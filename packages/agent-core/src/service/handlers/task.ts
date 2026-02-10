import { v4 as uuid } from 'uuid';
import type { AgentChunk, MessageStop, StatusBlock } from '../proto/agentProtocol.ts';
import type { CTX } from '../proto/ctx.ts';
import type { AgentState } from '../../types/fsm.ts';

interface TaskReq {
  input: string;
}

export class TaskCtx implements CTX<TaskReq, TaskCtx> {
  res: TaskCtx = this;
  req: TaskReq;
  rs: ReadableStream<AgentChunk>;
  private controller!: ReadableStreamDefaultController<AgentChunk>;
  private latestChunk!: Exclude<AgentChunk, StatusBlock>;
  private messageId = uuid();

  constructor({ req }: { req: TaskReq }) {
    this.req = req;
    this.rs = new ReadableStream<AgentChunk>({
      start: (c) => {
        this.controller = c;
      },
    });
    this.write({
      type: 'message_start',
      message: {
        start_timestamp: new Date().getDate(),
        id: this.messageId,
        type: 'message',
        role: 'assistant',
        model: '',
        parent: '0',
        content: [],
      },
    });
  }

  public onText(t: string, type: 'text' | 'thinking' | 'task'): void {
    if (this.latestChunk.type === 'message_stop') {
      throw new Error('stream stopped');
    }
    if (
      this.latestChunk.type === 'message_start' ||
      this.latestChunk.type === 'content_block_stop'
    ) {
      this.write({
        type: 'content_block_start',
        index: 0,
        content_block: {
          start_timestamp: new Date().getDate(),
          type: type,
          text: t,
        },
      });
      return;
    }
    if (
      (this.latestChunk.type === 'content_block_delta' &&
        this.latestChunk.content_block.type !== type) ||
      (this.latestChunk.type === 'content_block_start' &&
        this.latestChunk.content_block.type !== type)
    ) {
      this.onTextEnd();
      this.write({
        type: 'content_block_start',
        index: 0,
        content_block: {
          start_timestamp: new Date().getDate(),
          type: type,
          text: t,
        },
      });
      return;
    }
    this.write({
      type: 'content_block_delta',
      index: this.latestChunk.index + 1,
      content_block: {
        type: type,
        text: t,
      },
    });
  }

  public onTextEnd(): void {
    if (
      this.latestChunk.type !== 'content_block_delta' &&
      this.latestChunk.type !== 'content_block_start'
    ) {
      throw new Error('stream error,');
    }
    this.write({
      type: 'content_block_stop',
      index: this.latestChunk.index + 1,
      content_block: {
        stop_timestamp: new Date().getDate(),
      },
    });
  }

  public status(s: AgentState): void {
    this.write({ type: 'status_block', status: s });
  }

  public onEnd(stop_reason: MessageStop['message']['stop_reason']): void {
    this.write({ type: 'message_stop', message: { id: this.messageId, stop_reason } });
    this.close();
  }

  private write(c: AgentChunk) {
    if (c.type !== 'status_block') {
      this.latestChunk = c;
    }
    this.controller.enqueue(c);
  }
  private close() {
    this.controller.close();
  }
}
