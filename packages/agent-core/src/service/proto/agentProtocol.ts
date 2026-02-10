import type { AgentState } from '../../types/fsm.ts';

export const ChunkType = {
  message_start: 'message_start',
  message_stop: 'message_stop',
  content_block_start: 'content_block_start',
  content_block_delta: 'content_block_delta',
  content_block_stop: 'content_block_stop',
  status_block: 'status_block',
} as const;
export const CHUNK_TYPE_VALUES = Array.from(Object.values(ChunkType));
export type CHUNK_TYPE = (typeof ChunkType)[keyof typeof ChunkType];

interface Base {
  type: CHUNK_TYPE;
}

export interface MessageStart extends Base {
  type: 'message_start';
  message: {
    start_timestamp: number;
    id: string;
    type: 'message';
    role: 'assistant';
    model: string;
    parent: string;
    content: [];
  };
}

export interface MessageStop extends Base {
  type: 'message_stop';
  message: {
    id: string;
    stop_reason: 'error' | 'success';
  };
}

export interface ContentBlockStart extends Base {
  type: 'content_block_start';
  index: number;
  content_block: {
    start_timestamp: number;
    type: 'text' | 'tool_call' | 'thinking' | 'task';
    text: string;
  };
}
export interface ContentBlockDelta extends Base {
  type: 'content_block_delta';
  index: number;
  content_block: {
    type: 'text' | 'tool_call' | 'thinking' | 'task';
    text: string;
  };
}

export interface ContentBlockStop extends Base {
  type: 'content_block_stop';
  index: number;
  content_block: {
    stop_timestamp: number;
  };
}

export interface StatusBlock extends Base {
  type: 'status_block';
  status: AgentState;
}

export type AgentChunk =
  | MessageStart
  | MessageStop
  | ContentBlockStart
  | ContentBlockDelta
  | ContentBlockStop
  | StatusBlock;
