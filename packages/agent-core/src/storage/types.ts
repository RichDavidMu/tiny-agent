export type FileRecord = {
  id: string;
  name: string;
  mimeType: string;
  content: ArrayBuffer;
  createdAt: number;
};

export type CreateFileInput = {
  name: string;
  mimeType: string;
  content: ArrayBuffer;
};

export type FileIndexRecord = {
  id: string;
  fileId: string;
  name: string;
  summary: string;
  tags: string[];
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
  summary: string;
  tags?: string[];
  taskId: string;
  stepId: string;
  toolName: string;
  embedding?: ArrayBuffer;
  embeddingDim?: number;
  embeddingModel?: string;
};
