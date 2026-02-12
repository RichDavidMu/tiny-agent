import { makeAutoObservable, observable, reaction } from 'mobx';
import { type SessionItem, service } from 'agent-core';
import { toast } from 'sonner';
import tree from '@/stream/tree.ts';
import rootStore from '@/stores/root-store.ts';
import stream from '@/stream/stream.ts';

export class SessionStore {
  sessionId: string | undefined;
  sessionList = observable.array<SessionItem>([]);
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    reaction(
      () => this.sessionId,
      async (sessionId) => {
        if (stream.loading) return;
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
  addSession(session: SessionItem) {
    this.sessionList.unshift(session);
  }
  async getSessions() {
    const response = await service.getSessionList();
    this.sessionList.replace(response.list);
  }
}
