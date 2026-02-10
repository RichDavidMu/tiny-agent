import { makeAutoObservable, runInAction } from 'mobx';
import {
  type ContentBlockDelta,
  type ContentBlockStart,
  type ContentBlockTextDelta,
  type ContentBlockToolResultDelta,
  type ContentBlockToolResultStart,
  type ContentBlockToolUseDelta,
  type MessageStart,
  service,
} from 'agent-core';
import { webLogger } from '@tini-agent/utils';
import tree from '@/stream/tree.ts';
import { type ContentNode, Node, TextNode } from '@/stream/node';
import { ThinkNode } from '@/stream/node/contentNodes/thinkNode';
import { TaskNode } from '@/stream/node/contentNodes/taskNode';
import { ToolNode } from '@/stream/node/contentNodes/toolNode';

class Stream {
  loading = false;
  constructor() {
    makeAutoObservable(this);
  }
  async task(params: { input: string }) {
    this.loading = true;
    try {
      const stream = await service.taskStream(params);
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          switch (value.type) {
            case 'message_start': {
              this.handleMessageStart(value);
              break;
            }
            case 'content_block_start': {
              this.handleContentBlockStart(value);
              break;
            }
            case 'content_block_delta': {
              this.handleContentBlockDelta(value);
              break;
            }
            case 'content_block_stop': {
              this.handleContentBlockStop();
              break;
            }
            case 'message_stop': {
              // do nothing
              break;
            }
          }
        }
      }
    } catch (error) {
      webLogger.error(error);
    }
    runInAction(() => {
      this.loading = false;
    });
  }

  handleContentBlockStart(chunk: ContentBlockStart) {
    const { type: contentType } = chunk.content_block;
    let newContentNode: ContentNode | null = null;
    switch (contentType) {
      case 'thinking': {
        newContentNode = new ThinkNode();
        break;
      }
      case 'task': {
        newContentNode = new TaskNode();
        break;
      }
      case 'text': {
        newContentNode = new TextNode();
        break;
      }
      case 'tool_use': {
        newContentNode = new ToolNode();
        break;
      }
      case 'tool_result': {
        const target = tree.currentNode.content.find(
          (c) =>
            c.type === 'tool_use' &&
            c.toolCallId === (chunk as ContentBlockToolResultStart).content_block.toolUseId,
        );
        if (target) {
          (target as ToolNode).update(chunk as ContentBlockToolResultStart);
        }
      }
    }
    if (!newContentNode) {
      return;
    }
    tree.currentNode.content.push(newContentNode);
  }

  handleContentBlockDelta(chunk: ContentBlockDelta) {
    const { type: contentType } = chunk.content_block;
    const { contentTail } = tree.currentNode;
    if (!contentTail) {
      throw new Error('invalidate chunk');
    }
    switch (contentType) {
      case 'thinking': {
        if (contentTail.type !== 'thinking') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockTextDelta);
        break;
      }
      case 'task': {
        if (contentTail.type !== 'task') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockTextDelta);
        break;
      }
      case 'text': {
        if (contentTail.type !== 'text') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockTextDelta);
        break;
      }
      case 'tool_result':
      case 'tool_use': {
        if (contentTail.type !== 'tool_use') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockToolResultDelta | ContentBlockToolUseDelta);
        break;
      }
    }
  }

  handleContentBlockStop() {
    const { contentTail } = tree.currentNode;
    if (!contentTail) {
      throw new Error('invalidate chunk');
    }
    contentTail.setEnd(true);
  }

  handleMessageStart(chunk: MessageStart) {
    const { id, parent } = chunk.message;
    const userNode = new Node({ id: parent, role: 'user' });
    const assistantNode = new Node({ id, role: 'assistant' });
    tree.appendNode(userNode);
    tree.appendNode(assistantNode);
  }
}

export default new Stream();
