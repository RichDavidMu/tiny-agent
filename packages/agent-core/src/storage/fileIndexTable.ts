import { v4 as uuidv4 } from 'uuid';
import type { CreateFileIndexInput, FileIndexRecord } from './types.ts';

export class FileIndexTable {
  private readonly storeName: string;
  private readonly getDb: () => Promise<IDBDatabase>;

  constructor(getDb: () => Promise<IDBDatabase>, storeName = 'fileIndex') {
    this.getDb = getDb;
    this.storeName = storeName;
  }

  async create(input: CreateFileIndexInput): Promise<FileIndexRecord> {
    const db = await this.getDb();
    const record: FileIndexRecord = {
      id: uuidv4(),
      fileId: input.fileId,
      name: input.name,
      chunkText: input.chunkText,
      chunkIndex: input.chunkIndex,
      taskId: input.taskId,
      stepId: input.stepId,
      toolName: input.toolName,
      embedding: input.embedding,
      embeddingDim: input.embeddingDim,
      embeddingModel: input.embeddingModel,
      createdAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(this.storeName).add(record);
    });

    return record;
  }

  async get(id: string): Promise<FileIndexRecord | null> {
    const db = await this.getDb();
    return await new Promise<FileIndexRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).get(id);
      request.onsuccess = () => resolve((request.result as FileIndexRecord | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  }

  async list(): Promise<FileIndexRecord[]> {
    const db = await this.getDb();
    return await new Promise<FileIndexRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).getAll();
      request.onsuccess = () => resolve(request.result as FileIndexRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async findByTask(taskId: string): Promise<FileIndexRecord[]> {
    const db = await this.getDb();
    return await new Promise<FileIndexRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('taskId');
      const request = index.getAll(taskId);
      request.onsuccess = () => resolve(request.result as FileIndexRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async findByStep(stepId: string): Promise<FileIndexRecord[]> {
    const db = await this.getDb();
    return await new Promise<FileIndexRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('stepId');
      const request = index.getAll(stepId);
      request.onsuccess = () => resolve(request.result as FileIndexRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async findByName(name: string): Promise<FileIndexRecord[]> {
    const db = await this.getDb();
    return await new Promise<FileIndexRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('name');
      const request = index.getAll(name);
      request.onsuccess = () => resolve(request.result as FileIndexRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<FileIndexRecord, 'id' | 'createdAt'>>,
  ): Promise<FileIndexRecord | null> {
    const db = await this.getDb();
    return await new Promise<FileIndexRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getRequest = store.get(id);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as FileIndexRecord | undefined;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated: FileIndexRecord = {
          ...existing,
          ...updates,
          id: existing.id,
          createdAt: existing.createdAt,
        };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated);
      };
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(this.storeName).delete(id);
    });
  }
}
