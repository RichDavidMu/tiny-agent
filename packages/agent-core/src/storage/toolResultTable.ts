import { v4 as uuidv4 } from 'uuid';
import type { CreateToolResultInput, ToolResultRecord } from './types.ts';

export class ToolResultTable {
  private readonly storeName: string;
  private readonly getDb: () => Promise<IDBDatabase>;

  constructor(getDb: () => Promise<IDBDatabase>, storeName = 'toolResults') {
    this.getDb = getDb;
    this.storeName = storeName;
  }

  async create(input: CreateToolResultInput): Promise<ToolResultRecord> {
    const db = await this.getDb();
    const record: ToolResultRecord = {
      id: input.id ?? uuidv4(),
      stepId: input.stepId,
      taskId: input.taskId,
      result: input.result,
      isError: input.isError,
      resultFile: input.resultFile,
      fileId: input.fileId,
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

  async list(): Promise<ToolResultRecord[]> {
    const db = await this.getDb();
    return await new Promise<ToolResultRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).getAll();
      request.onsuccess = () => resolve(request.result as ToolResultRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async findByStepId(stepId: string): Promise<ToolResultRecord | null> {
    const db = await this.getDb();
    return await new Promise<ToolResultRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('stepId');
      const request = index.get(stepId);
      request.onsuccess = () => resolve((request.result as ToolResultRecord | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findByTaskId(taskId: string): Promise<ToolResultRecord | null> {
    const db = await this.getDb();
    return await new Promise<ToolResultRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('taskId');
      const request = index.get(taskId);
      request.onsuccess = () => resolve((request.result as ToolResultRecord | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<ToolResultRecord, 'id' | 'createdAt'>>,
  ): Promise<ToolResultRecord | null> {
    const db = await this.getDb();
    return await new Promise<ToolResultRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getRequest = store.get(id);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as ToolResultRecord | undefined;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated: ToolResultRecord = {
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
