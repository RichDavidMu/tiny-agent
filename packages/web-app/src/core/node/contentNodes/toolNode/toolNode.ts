import type {
  ContentBlockToolResultDelta,
  ContentBlockToolResultStart,
  ContentBlockToolUseDelta,
  ContentBlockToolUseStart,
  ICallToolResult,
} from 'agent-core';
import type { BaseContentNode } from '@/core/node/contentNodes';

export class ToolNode implements BaseContentNode {
  type = 'tool_use' as const;
  status: 'done' | 'error' | 'pending' = 'pending';
  desc: string = '';
  name: string = '';
  toolCallId: string = '';
  toolCallParams: string = '';
  content: ICallToolResult['content'] | null = null;
  update(
    chunk:
      | ContentBlockToolResultStart
      | ContentBlockToolUseStart
      | ContentBlockToolResultDelta
      | ContentBlockToolUseDelta,
  ) {
    const { content_block, type: chunkType } = chunk;
    if (content_block.type === 'tool_use') {
      if (chunkType === 'content_block_start') {
        const { desc, name, id } = content_block;
        this.desc = desc;
        this.name = name;
        this.toolCallId = id;
      }
      if (chunkType === 'content_block_delta') {
        const { input } = content_block;
        this.toolCallParams = input;
      }
    }
    if (content_block.type === 'tool_result') {
      const { content, isError, toolUseId } = content_block;
      if (toolUseId !== this.toolCallId || isError) {
        this.status = 'error';
      } else {
        this.status = 'done';
      }
      this.content = content;
    }
  }
}
