import { makeAutoObservable } from 'mobx';
import { type MessageStart, service } from 'agent-core';
import { webLogger } from '@tini-agent/utils';
import tree from '@/core/tree.ts';
import { TaskNode } from '@/core/node';

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
              break;
            }
            case 'content_block_delta': {
              break;
            }
            case 'content_block_stop': {
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
    this.loading = false;
  }

  handleMessageStart(chunk: MessageStart) {
    const { id, parent } = chunk.message;
    const userNode = new TaskNode({ id: parent, role: 'user' });
    const assistantNode = new TaskNode({ id, role: 'assistant' });
    tree.appendNode(userNode);
    tree.appendNode(assistantNode);
  }
}

export default new Stream();
