import { FileTable } from './fileTable.ts';
import { ToolResultTable } from './toolResultTable.ts';
import { SessionTable } from './sessionTable.ts';

export class AgentDb {
  private readonly dbName = 'agent-core';
  private readonly version = 6;
  private readonly fileStoreName = 'files';
  private readonly toolResultStoreName = 'toolResults';
  private readonly sessionStoreName = 'sessions';
  private dbPromise: Promise<IDBDatabase> | null = null;

  readonly file: FileTable;
  readonly toolResult: ToolResultTable;
  readonly session: SessionTable;

  constructor() {
    this.file = new FileTable(() => this.openDb(), this.fileStoreName);
    this.toolResult = new ToolResultTable(() => this.openDb(), this.toolResultStoreName);
    this.session = new SessionTable(() => this.openDb(), this.sessionStoreName);
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
          db.createObjectStore(this.fileStoreName, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.toolResultStoreName)) {
          db.createObjectStore(this.toolResultStoreName, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.sessionStoreName)) {
          db.createObjectStore(this.sessionStoreName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }
}

export const agentDb = new AgentDb();
