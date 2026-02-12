import type { HistoryTextContent, TextContentBlock } from 'agent-core';
import { action, makeObservable, observable } from 'mobx';
import { BaseContentNode } from '@/stream/node/content-nodes/base.ts';

export class TextNode extends BaseContentNode {
  type = 'text' as const;
  text = '';
  constructor(initParams?: HistoryTextContent) {
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
