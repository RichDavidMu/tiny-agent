import type { ContentBlockTextDelta, ContentBlockTextStart } from 'agent-core';
import { BaseContentNode } from '@/core/node/contentNodes/base.ts';

export class ThinkNode extends BaseContentNode {
  type = 'thinking' as const;
  text = '';
  update(chunk: ContentBlockTextStart | ContentBlockTextDelta) {
    this.text += chunk.content_block.text;
  }
}
