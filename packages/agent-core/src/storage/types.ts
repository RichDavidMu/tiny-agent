import type { ChatCompletionTool } from '@mlc-ai/web-llm';

export type FileRecord = {
  id: string;
  name: string;
  mimeType: string;
  content: string;
  createdAt: number;
};

export type CreateFileInput = {
  id?: string;
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
  id: string; // step_uuid
  stepId: string;
  stepGoal: string;
  taskId: string;
  result: string;
  isError: boolean;
  resultFile: string;
  fileId: string | null;
  tool: null | ChatCompletionTool;
  createdAt: number;
};

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
};
