import type { TextContentBlock } from 'agent-core';
import { action, makeObservable, observable } from 'mobx';
import { BaseContentNode } from '@/stream/node/contentNodes/base.ts';

export class TextNode extends BaseContentNode {
  type = 'text' as const;
  text = '';
  constructor({ text }: { text: string } = { text: '' }) {
    super();
    this.text = text;
    makeObservable(this, {
      text: observable,
      update: action,
    });
  }
  update(chunk: TextContentBlock) {
    this.text += chunk.content_block.text;
  }
}
