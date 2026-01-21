import { FileTable } from './fileTable.ts';

export class AgentDb {
  private readonly dbName = 'agent-core';
  private readonly version = 1;
  private readonly fileStoreName = 'files';
  private dbPromise: Promise<IDBDatabase> | null = null;

  readonly file: FileTable;

  constructor() {
    this.file = new FileTable(() => this.openDb(), this.fileStoreName);
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
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }
}

export const agentDb = new AgentDb();
