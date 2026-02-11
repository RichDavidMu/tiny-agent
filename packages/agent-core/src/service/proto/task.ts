import type { AgentState, ICallToolResult, TaskSchema } from '../../types';

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
  taskStatus: 'task_status',
  toolUse: 'tool_use',
  toolResult: 'tool_result',
  thinking: 'thinking',
} as const;
export const CONTENT_TYPE_VALUES = Array.from(Object.values(ContentBlockType));
export type CONTENT_BLOCK_TYPE = (typeof ContentBlockType)[keyof typeof ContentBlockType];

interface Base {
  type: CHUNK_TYPE;
}

/*
  message type start
 */
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

/*
  message type end
 */

interface ContentBlockStartBase extends Base {
  type: 'content_block_start';
  index: number;
  start_timestamp: number;
}

interface ContentBlockDeltaBase extends Base {
  type: 'content_block_delta';
  index: number;
}

interface ContentBase {
  type: CONTENT_BLOCK_TYPE;
}

/*
   text content start
 */
export interface StartTextContent extends ContentBase {
  type: 'text' | 'thinking';
  text: string;
}

export type DeltaTextContent = StartTextContent;

export interface ContentBlockTextStart extends ContentBlockStartBase {
  content_block: StartTextContent;
}

export interface ContentBlockTextDelta extends ContentBlockDeltaBase {
  content_block: DeltaTextContent;
}

export type TextContentBlock = ContentBlockTextStart | ContentBlockTextDelta;

/*
   text content end
 */

/*
  task content start
 */
export interface StartTaskContent extends ContentBase, TaskSchema {
  type: 'task';
}
export interface DeltaTaskStatusContent extends ContentBase {
  type: 'task_status';
  task_uuid: string;
  status: TaskSchema['status'];
}

export interface DeltaTaskContentToolUse extends ContentBase {
  type: 'tool_use';
  task_uuid: string;
  step_uuid: string;
  input: Record<string, any>;
  should_act: boolean;
}

export interface DeltaTaskContentToolResult extends ContentBase {
  type: 'tool_result';
  task_uuid: string;
  step_uuid: string;
  content: ICallToolResult['content'];
  isError: boolean;
}
export interface ContentBlockTaskStart extends ContentBlockStartBase {
  content_block: StartTaskContent;
}

export interface ContentBlockTaskStatusDelta extends ContentBlockDeltaBase {
  content_block: DeltaTaskStatusContent;
}

export interface ContentBlockTaskToolUseDelta extends ContentBlockDeltaBase {
  content_block: DeltaTaskContentToolUse;
}

export interface ContentBlockTaskToolResultDelta extends ContentBlockDeltaBase {
  content_block: DeltaTaskContentToolResult;
}

export type TaskContentBlock =
  | ContentBlockTaskStart
  | ContentBlockTaskStatusDelta
  | ContentBlockTaskToolUseDelta
  | ContentBlockTaskToolResultDelta;

/*
  task content end
 */

/*
  full content block def start
 */
export type ContentBlockStart = ContentBlockTextStart | ContentBlockTaskStart;

export type ContentBlockDelta =
  | ContentBlockTextDelta
  | ContentBlockTaskToolUseDelta
  | ContentBlockTaskToolResultDelta
  | ContentBlockTaskStatusDelta;

export interface ContentBlockStop extends Base {
  type: 'content_block_stop';
  index: number;
  stop_timestamp: number;
}

/*
  full content block def end
 */

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
