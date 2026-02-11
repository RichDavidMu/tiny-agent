import type { TextContentBlock } from 'agent-core';
import { action, makeObservable, observable } from 'mobx';
import { BaseContentNode } from '@/stream/node/contentNodes/base.ts';

export class ThinkNode extends BaseContentNode {
  type = 'thinking' as const;
  text = '';
  constructor() {
    super();
    makeObservable(this, {
      text: observable,
      update: action,
    });
  }
  update(chunk: TextContentBlock) {
    this.text += chunk.content_block.text;
  }
}
