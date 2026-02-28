import { v4 as uuidv4 } from 'uuid';
import type { CONTENT_BLOCK_TYPE, ContentChunk } from '@tini-agent/agent-core';
import { action, makeObservable, observable } from 'mobx';

export abstract class BaseContentNode {
  id = uuidv4();
  ended = false;
  abstract type: Exclude<CONTENT_BLOCK_TYPE, 'tool_result'>;
  abstract update(chunk: ContentChunk): void;
  protected constructor() {
    makeObservable(this, {
      ended: observable,
      setEnd: action,
    });
  }
  setEnd(ended: boolean) {
    this.ended = ended;
  }
}
