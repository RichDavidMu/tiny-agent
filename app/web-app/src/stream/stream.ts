import { makeAutoObservable, runInAction } from 'mobx';
import {
  type ContentBlockDelta,
  type ContentBlockStart,
  type ContentBlockTaskStart,
  type ContentBlockTaskStatusDelta,
  type ContentBlockTaskToolResultDelta,
  type ContentBlockTaskToolUseDelta,
  type ContentBlockTextDelta,
  type ContentBlockTextStart,
  type MessageStart,
  type TaskReq,
  service,
} from '@tini-agent/agent-core';
import { webLogger } from '@tini-agent/utils';
import tree from '@/stream/tree.ts';
import { type ContentNode, Node, TaskNode, TextNode, ThinkNode } from '@/stream/node';
import rootStore from '@/stores/root-store.ts';
import { selectSession } from '@/lib/session.ts';

class Stream {
  loading = false;
  params: TaskReq | null = null;
  constructor() {
    makeAutoObservable(this, {
      params: false,
    });
  }
  async task(params: { input: string }) {
    this.params = params;
    this.loading = true;
    try {
      const stream = await service.taskStream(params);
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        webLogger.log(value);
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
        newContentNode.update(chunk as ContentBlockTextStart);
        break;
      }
      case 'task': {
        newContentNode = new TaskNode();
        newContentNode.update(chunk as ContentBlockTaskStart);
        break;
      }
      case 'text': {
        newContentNode = new TextNode();
        newContentNode.update(chunk as ContentBlockTextStart);
        break;
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
      case 'text': {
        if (contentTail.type !== 'text') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockTextDelta);
        break;
      }
      case 'task_status': {
        if (contentTail.type !== 'task') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockTaskStatusDelta);
        break;
      }
      case 'tool_result':
      case 'tool_use': {
        if (contentTail.type !== 'task') {
          throw new Error('invalidate chunk');
        }
        contentTail.update(chunk as ContentBlockTaskToolUseDelta | ContentBlockTaskToolResultDelta);
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
    const { addSession } = rootStore.sessionStore;
    const userNode = new Node({ id: parent, role: 'user' });
    userNode.content.push(new TextNode({ text: this.params!.input, type: 'text' }));
    const assistantNode = new Node({ id, role: 'assistant' });
    tree.appendNode(userNode);
    tree.appendNode(assistantNode);
    addSession({ id: chunk.message.sessionId, name: this.params!.input });
    selectSession(chunk.message.sessionId);
  }
}

export default new Stream();
