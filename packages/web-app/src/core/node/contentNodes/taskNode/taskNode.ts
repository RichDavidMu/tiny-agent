import type { ContentBlockTextDelta, ContentBlockTextStart } from 'agent-core';
import type { BaseContentNode } from '@/core/node/contentNodes/base.ts';

export class TaskNode implements BaseContentNode {
  type = 'task' as const;
  text = '';
  update(chunk: ContentBlockTextStart | ContentBlockTextDelta) {
    this.text += chunk.content_block.text;
  }
}
