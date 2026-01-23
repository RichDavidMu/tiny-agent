import { FileTable } from './fileTable.ts';

export class AgentDb {
  private readonly dbName = 'agent-core';
  private readonly version = 1;
  private readonly fileStoreName = 'files';
  // private readonly fileIndexStoreName = 'fileIndex';
  private dbPromise: Promise<IDBDatabase> | null = null;

  readonly file: FileTable;
  // readonly fileIndex: FileIndexTable;

  constructor() {
    this.file = new FileTable(() => this.openDb(), this.fileStoreName);
    // this.fileIndex = new FileIndexTable(() => this.openDb(), this.fileIndexStoreName);
  }

  private ensureIndexedDb(): void {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment');
    }
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.ensureIndexedDb();

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.fileStoreName)) {
          const store = db.createObjectStore(this.fileStoreName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
        }
        // if (!db.objectStoreNames.contains(this.fileIndexStoreName)) {
        //   const store = db.createObjectStore(this.fileIndexStoreName, { keyPath: 'id' });
        //   store.createIndex('fileId', 'fileId', { unique: false });
        //   store.createIndex('name', 'name', { unique: false });
        //   store.createIndex('taskId', 'taskId', { unique: false });
        //   store.createIndex('stepId', 'stepId', { unique: false });
        //   store.createIndex('toolName', 'toolName', { unique: false });
        //   store.createIndex('createdAt', 'createdAt', { unique: false });
        // }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }
}

export const agentDb = new AgentDb();
