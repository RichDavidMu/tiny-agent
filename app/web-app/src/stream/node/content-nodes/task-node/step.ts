import type {
  ContentBlockTaskToolResultDelta,
  ContentBlockTaskToolUseDelta,
  HistoryStepContent,
  StepSchema,
} from '@tini-agent/agent-core';
import { makeAutoObservable } from 'mobx';
import type { ToolPart } from '@/components/ui/tool.tsx';
import type { TaskNode } from '@/stream';

export class Step {
  meta: StepSchema;
  input?: Record<string, any>;
  shouldAct: boolean | null = null;
  content: string | null = null;
  taskNode: TaskNode;
  constructor({
    meta,
    initParams,
    taskNode,
  }: {
    meta: StepSchema;
    initParams?: HistoryStepContent;
    taskNode: TaskNode;
  }) {
    makeAutoObservable(this);
    this.meta = meta;
    this.taskNode = taskNode;
    if (!initParams) return;
    const { result, shouldAct, input } = initParams;
    this.content = result;
    this.shouldAct = shouldAct;
    this.input = input || undefined;
  }

  get output() {
    if (!this.content || this.meta.status !== 'done') {
      return undefined;
    }
    return this.content;
  }

  get errorText() {
    if (!this.content || this.meta.status !== 'error') {
      return undefined;
    }
    return this.content;
  }

  get state(): ToolPart['state'] {
    if (this.meta.status === 'error') {
      return 'output-available';
    }
    if (this.meta.status === 'done') {
      return 'output-available';
    }
    if (this.input) {
      return 'input-available';
    }
    const idx = this.taskNode.stepList.findIndex((s) => s === this);
    if (idx === 0 || this.taskNode.stepList[idx - 1]?.meta?.status !== 'pending') {
      return 'input-streaming';
    }
    return 'pending';
  }
  update(chunk: ContentBlockTaskToolResultDelta | ContentBlockTaskToolUseDelta) {
    const { content_block } = chunk;
    if (content_block.type === 'tool_use') {
      const { should_act, input } = content_block;
      this.shouldAct = should_act;
      this.input = input;
    }
    if (content_block.type === 'tool_result') {
      const { content, isError } = content_block;
      if (isError) {
        this.meta.status = 'error';
      } else {
        this.meta.status = 'done';
      }
      this.content = content;
    }
  }
}
