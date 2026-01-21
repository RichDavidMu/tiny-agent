import { v4 as uuidv4 } from 'uuid';
import type { CreateFileInput, FileRecord } from './types.ts';

export class FileTable {
  private readonly storeName: string;
  private readonly getDb: () => Promise<IDBDatabase>;

  constructor(getDb: () => Promise<IDBDatabase>, storeName = 'files') {
    this.getDb = getDb;
    this.storeName = storeName;
  }

  async create(input: CreateFileInput): Promise<FileRecord> {
    const db = await this.getDb();
    const record: FileRecord = {
      id: uuidv4(),
      name: input.name,
      mimeType: input.mimeType,
      content: input.content,
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

  async get(id: string): Promise<FileRecord | null> {
    const db = await this.getDb();
    return await new Promise<FileRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).get(id);
      request.onsuccess = () => resolve((request.result as FileRecord | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  }

  async list(): Promise<FileRecord[]> {
    const db = await this.getDb();
    return await new Promise<FileRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).getAll();
      request.onsuccess = () => resolve(request.result as FileRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async findByName(name: string): Promise<FileRecord[]> {
    const db = await this.getDb();
    return await new Promise<FileRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('name');
      const request = index.getAll(name);
      request.onsuccess = () => resolve(request.result as FileRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  async update(
    id: string,
    updates: Partial<Omit<FileRecord, 'id' | 'createdAt'>>,
  ): Promise<FileRecord | null> {
    const db = await this.getDb();
    return await new Promise<FileRecord | null>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getRequest = store.get(id);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as FileRecord | undefined;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated: FileRecord = {
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
