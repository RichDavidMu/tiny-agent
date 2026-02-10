import type { ContentBlockTextDelta, ContentBlockTextStart } from 'agent-core';
import { BaseContentNode } from '@/stream/node/contentNodes/base.ts';

export class TaskNode extends BaseContentNode {
  type = 'task' as const;
  text = '';
  update(chunk: ContentBlockTextStart | ContentBlockTextDelta) {
    this.text += chunk.content_block.text;
  }
}
