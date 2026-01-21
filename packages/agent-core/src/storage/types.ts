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
