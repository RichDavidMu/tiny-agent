import { makeAutoObservable, observable, reaction } from 'mobx';
import { service } from 'agent-core';
import { toast } from 'sonner';
import tree from '@/stream/tree.ts';
import rootStore from '@/stores/root-store.ts';

export class SessionStore {
  sessionId: string | undefined;
  sessionList = observable.array<string>([]);
  constructor() {
    makeAutoObservable(this);
    reaction(
      () => this.sessionId,
      async (sessionId) => {
        tree.reset();
        if (!sessionId) {
          return;
        }
        const history = await service.getSessionHistory({ sessionId });
        if (!history) {
          toast.error('invalidate session');
          rootStore.historyStore.navigate('/chat');
          return;
        }
        tree.generateFromSession(history);
      },
    );
  }
  setSessionId(s: string | undefined) {
    this.sessionId = s;
  }
  async getSessions() {
    const list = await service.getSessionList();
    this.sessionList.replace(list);
  }
}
