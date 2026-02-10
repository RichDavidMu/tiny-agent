import type { CONTENT_BLOCK_TYPE, ContentChunk } from 'agent-core';

export abstract class BaseContentNode {
  abstract type: Exclude<CONTENT_BLOCK_TYPE, 'tool_result'>;
  abstract update(chunk: ContentChunk): void;
}
