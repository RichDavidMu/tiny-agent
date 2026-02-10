import type { TextContentBlock } from 'agent-core';
import { makeAutoObservable } from 'mobx';
import { BaseContentNode } from '@/stream/node/contentNodes/base.ts';

export class ThinkNode extends BaseContentNode {
  type = 'thinking' as const;
  text = '';
  constructor() {
    super();
    makeAutoObservable(this);
  }
  update(chunk: TextContentBlock) {
    this.text += chunk.content_block.text;
  }
}
