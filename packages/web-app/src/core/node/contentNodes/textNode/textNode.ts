import type { ContentBlockTextDelta, ContentBlockTextStart } from 'agent-core';
import type { BaseContentNode } from '@/core/node/contentNodes/base.ts';

export class TextNode implements BaseContentNode {
  type = 'text' as const;
  text = '';
  update(chunk: ContentBlockTextStart | ContentBlockTextDelta) {
    this.text += chunk.content_block.text;
  }
}
