import type { ChatCompletionTool } from '@mlc-ai/web-llm';

export type FileRecord = {
  createdAt: number;
} & CreateFileInput;

export type CreateFileInput = {
  id: string;
  name: string;
  mimeType: string;
  content: string;
};

export type FileIndexRecord = {
  id: string;
  fileId: string;
  name: string;
  chunkText: string;
  chunkIndex: number;
  taskId: string;
  stepId: string;
  toolName: string;
  embedding?: ArrayBuffer;
  embeddingDim?: number;
  embeddingModel?: string;
  createdAt: number;
};

export type CreateFileIndexInput = {
  fileId: string;
  name: string;
  chunkText: string;
  chunkIndex: number;
  taskId: string;
  stepId: string;
  toolName: string;
  embedding?: ArrayBuffer;
  embeddingDim?: number;
  embeddingModel?: string;
};

export type ToolResultRecord = {
  createdAt: number;
} & CreateToolResultInput;

export type CreateToolResultInput = {
  id: string; // step_uuid
  stepId: string;
  stepGoal: string;
  taskId: string;
  result: string;
  isError: boolean;
  resultFile: string;
  fileId: string | null;
  tool: null | ChatCompletionTool;
  shouldAct: boolean;
  input: Record<string, any> | null;
};

// Session history types
export type SessionRecord = {
  createdAt: number;
  updatedAt: number;
} & CreateSessionInput;

export type CreateSessionInput = {
  id: string; // session_id
  nodes: SessionNode[];
};

export type SessionNode = {
  id: string; // message_id
  role: 'user' | 'assistant';
  parent: string | null;
  content: SessionContentNode[];
};

export type SessionContentNode = SessionTextContent | SessionThinkingContent | SessionTaskContent;

export type SessionTextContent = {
  type: 'text';
  text: string;
};

export type SessionThinkingContent = {
  type: 'thinking';
  text: string;
};

export type SessionTaskContent = {
  type: 'task';
  task_uuid: string;
  task_goal: string;
  status: 'pending' | 'done' | 'error';
  steps: SessionStepContent[];
};

export type SessionStepContent = {
  step_uuid: string;
  step_goal: string;
  tool_name: string;
  status: 'pending' | 'done' | 'error';
};
