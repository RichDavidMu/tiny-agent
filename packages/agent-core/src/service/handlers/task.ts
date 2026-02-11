import { v4 as uuid } from 'uuid';
import type { AgentChunk, CTX, MessageStop, StatusBlock } from '../proto';
import type { AgentState, ICallToolResult, StepSchema, TaskSchema } from '../../types';

export interface TaskReq {
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
        parent: uuid(),
        content: [],
      },
    });
  }

  public onTaskStart(task: TaskSchema): void {
    if (this.latestChunk.type === 'message_stop') {
      throw new Error('stream stopped');
    }
    this.write({
      type: 'content_block_start',
      start_timestamp: new Date().getDate(),
      index: 0,
      content_block: {
        type: 'task',
        ...task,
      },
    });
  }
  public onTaskStatus(task: TaskSchema): void {
    if (this.latestChunk.type === 'message_stop') {
      throw new Error('stream stopped');
    }
    this.write({
      type: 'content_block_delta',
      index: 1,
      content_block: {
        type: 'task_status',
        task_uuid: task.task_uuid,
        status: task.status,
      },
    });
  }

  public onToolUse(
    step: StepSchema,
    task: TaskSchema,
    shouldAct: boolean,
    toolCall: Record<string, any>,
  ): void {
    this.write({
      type: 'content_block_delta',
      index: 0,
      content_block: {
        type: 'tool_use',
        task_uuid: task.task_uuid,
        step_uuid: step.step_uuid,
        input: toolCall,
        should_act: shouldAct,
      },
    });
  }

  public onToolResult(result: ICallToolResult, step: StepSchema, task: TaskSchema): void {
    if (this.latestChunk.type !== 'content_block_delta') {
      return;
    }
    this.write({
      type: 'content_block_delta',
      index: this.latestChunk.index + 1,
      content_block: {
        type: 'tool_result',
        isError: !!result.isError,
        content: result.content,
        task_uuid: task.task_uuid,
        step_uuid: step.step_uuid,
      },
    });
    this.write({ type: 'content_block_stop', index: 0, stop_timestamp: new Date().getDate() });
  }
  public onText(t: string, type: 'text' | 'thinking'): void {
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
        start_timestamp: new Date().getDate(),
        content_block: {
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
      this.onContentBlockEnd();
      this.write({
        type: 'content_block_start',
        index: 0,
        start_timestamp: new Date().getDate(),
        content_block: {
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

  public onContentBlockEnd(): void {
    if (
      this.latestChunk.type !== 'content_block_delta' &&
      this.latestChunk.type !== 'content_block_start'
    ) {
      throw new Error('stream error,');
    }
    this.write({
      type: 'content_block_stop',
      index: this.latestChunk.index + 1,
      stop_timestamp: new Date().getDate(),
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
