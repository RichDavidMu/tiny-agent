import type { NavigateFunction, Params } from 'react-router-dom';
import { makeAutoObservable, reaction } from 'mobx';
import rootStore from '@/stores/root-store.ts';

export class HistoryStore {
  public navigate: NavigateFunction | (() => void) = () => {};
  public params!: Params<string>;
  setNavigate(n: NavigateFunction) {
    this.navigate = n;
  }
  constructor() {
    makeAutoObservable(this, {
      setNavigate: false,
      navigate: false,
    });
    reaction(
      () => this.params?.sessionId,
      (sessionId) => {
        rootStore.sessionStore.setSessionId(sessionId);
      },
    );
  }
  setParams(p: Params<string>) {
    this.params = p;
  }
}
