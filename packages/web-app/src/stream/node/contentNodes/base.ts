import { v4 as uuidv4 } from 'uuid';
import type { CONTENT_BLOCK_TYPE, ContentChunk } from 'agent-core';

export abstract class BaseContentNode {
  id = uuidv4();
  abstract type: Exclude<CONTENT_BLOCK_TYPE, 'tool_result'>;
  abstract update(chunk: ContentChunk): void;
}
