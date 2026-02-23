import type { HistoryThinkingContent, TextContentBlock } from '@tini-agent/agent-core';
import { action, makeObservable, observable } from 'mobx';
import { BaseContentNode } from '@/stream/node/content-nodes/base.ts';

export class ThinkNode extends BaseContentNode {
  type = 'thinking' as const;
  text = '';
  constructor(initParams?: HistoryThinkingContent) {
    super();
    makeObservable(this, {
      text: observable,
      update: action,
    });
    if (!initParams) return;
    const { text } = initParams;
    this.text = text;
  }
  update(chunk: TextContentBlock) {
    this.text += chunk.content_block.text;
  }
}
