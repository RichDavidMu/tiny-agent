import type { TextContentBlock } from 'agent-core';
import { BaseContentNode } from '@/stream/node/contentNodes/base.ts';

export class TextNode extends BaseContentNode {
  type = 'text' as const;
  text = '';
  update(chunk: TextContentBlock) {
    this.text += chunk.content_block.text;
  }
}
