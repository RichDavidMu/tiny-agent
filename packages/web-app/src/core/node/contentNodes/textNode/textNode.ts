import type { ContentBlockTextDelta, ContentBlockTextStart } from 'agent-core';
import { BaseContentNode } from '@/core/node/contentNodes/base.ts';

export class TextNode extends BaseContentNode {
  type = 'text' as const;
  text = '';
  update(chunk: ContentBlockTextStart | ContentBlockTextDelta) {
    this.text += chunk.content_block.text;
  }
}
