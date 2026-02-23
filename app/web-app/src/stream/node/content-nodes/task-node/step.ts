import type {
  ContentBlockTaskToolResultDelta,
  ContentBlockTaskToolUseDelta,
  HistoryStepContent,
  StepSchema,
} from 'agent-core';
import { makeAutoObservable } from 'mobx';
import type { ToolPart } from '@/components/ui/tool.tsx';

export class Step {
  meta: StepSchema;
  input?: Record<string, any>;
  shouldAct: boolean | null = null;
  content: string | null = null;
  constructor({ meta, initParams }: { meta: StepSchema; initParams?: HistoryStepContent }) {
    makeAutoObservable(this);
    this.meta = meta;
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
    return 'input-streaming';
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
