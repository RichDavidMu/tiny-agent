import type { AgentState, ICallToolResult } from '../../types';

export const Role = {
  user: 'user',
  assistant: 'assistant',
} as const;
export type ROLE_TYPE = (typeof Role)[keyof typeof Role];

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

export const ContentBlockType = {
  text: 'text',
  task: 'task',
  toolUse: 'tool_use',
  toolResult: 'tool_result',
  thinking: 'thinking',
} as const;
export const CONTENT_TYPE_VALUES = Array.from(Object.values(ContentBlockType));
export type CONTENT_BLOCK_TYPE = (typeof ContentBlockType)[keyof typeof ContentBlockType];

interface ContentBase {
  type: CONTENT_BLOCK_TYPE;
}

export interface TextContent extends ContentBase {
  type: 'text' | 'task' | 'thinking';
  text: string;
}

export interface ToolResultContent extends ContentBase {
  type: 'tool_result';
  toolUseId: string;
  content: ICallToolResult['content'];
  isError: boolean;
}

interface Base {
  type: CHUNK_TYPE;
}

interface ContentBlockStartBase extends Base {
  index: number;
}

interface ContentBlockDeltaBase extends Base {
  index: number;
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

export interface ContentBlockTextStart extends ContentBlockStartBase {
  type: 'content_block_start';
  content_block: {
    start_timestamp: number;
  } & TextContent;
}

export interface ContentBlockToolResultStart extends ContentBlockStartBase {
  type: 'content_block_start';
  content_block: {
    start_timestamp: number;
  } & ToolResultContent;
}

export interface ContentBlockToolUseStart extends ContentBlockStartBase {
  type: 'content_block_start';
  content_block: {
    start_timestamp: number;
    type: 'tool_use';
    id: string;
    name: string;
    desc: string;
  };
}

export type ContentBlockStart =
  | ContentBlockTextStart
  | ContentBlockToolUseStart
  | ContentBlockToolResultStart;

export interface ContentBlockTextDelta extends ContentBlockDeltaBase {
  type: 'content_block_delta';
  content_block: {} & TextContent;
}

export interface ContentBlockToolResultDelta extends ContentBlockDeltaBase {
  type: 'content_block_delta';
  content_block: {} & ToolResultContent;
}

export interface ContentBlockToolUseDelta extends ContentBlockDeltaBase {
  type: 'content_block_delta';
  content_block: {
    type: 'tool_use';
    input: string;
    should_act: boolean;
  };
}

export type ContentBlockDelta =
  | ContentBlockTextDelta
  | ContentBlockToolUseDelta
  | ContentBlockToolResultDelta;

export interface ContentBlockStop extends Base {
  type: 'content_block_stop';
  index: number;
  stop_timestamp: number;
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

export type ContentChunk = ContentBlockStart | ContentBlockDelta | ContentBlockStop;
