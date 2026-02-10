import type { AgentState } from '../../types/fsm.ts';
import type { ICallToolResult } from '../../types/tools.ts';

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

export interface ToolUseContent extends ContentBase {
  type: 'tool_use';
  id: string;
  input: Record<string, any>;
  name: string;
  desc: string;
}

export interface ToolResultContent extends ContentBase {
  type: 'tool_result';
  toolUseId: string;
  content: ICallToolResult['content'];
  isError: boolean;
}

export type ContentType = TextContent | ToolResultContent;

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
  } & ContentType;
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

type ContentBlockStart = ContentBlockTextStart | ContentBlockToolUseStart;

export interface ContentBlockTextDelta extends ContentBlockDeltaBase {
  type: 'content_block_delta';
  content_block: {} & ContentType;
}
export interface ContentBlockToolUseDelta extends ContentBlockDeltaBase {
  type: 'content_block_delta';
  content_block: {
    type: 'tool_use';
    input: Record<string, any> | null;
    should_act: boolean;
  };
}

type ContentBlockDelta = ContentBlockTextDelta | ContentBlockToolUseDelta;

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
