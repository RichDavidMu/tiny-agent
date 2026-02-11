import type {
  ContentBlockTaskToolResultDelta,
  ContentBlockTaskToolUseDelta,
  ICallToolResult,
  StepSchema,
} from 'agent-core';
import { makeAutoObservable } from 'mobx';

export class Step {
  meta: StepSchema;
  toolCall: string | null = null;
  shouldAct: boolean | null = null;
  content: ICallToolResult['content'] | null = null;
  constructor({ meta }: { meta: StepSchema }) {
    makeAutoObservable(this);
    this.meta = meta;
  }
  update(chunk: ContentBlockTaskToolResultDelta | ContentBlockTaskToolUseDelta) {
    const { content_block } = chunk;
    if (content_block.type === 'tool_use') {
      const { should_act, input } = content_block;
      this.shouldAct = should_act;
      this.toolCall = input;
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
