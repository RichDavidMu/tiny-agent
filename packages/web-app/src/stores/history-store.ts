import type { NavigateFunction } from 'react-router-dom';
import { makeAutoObservable } from 'mobx';

export class HistoryStore {
  public navigate: NavigateFunction | (() => void) = () => {};
  sessionId: string | undefined;
  setNavigate(n: NavigateFunction) {
    this.navigate = n;
  }
  constructor() {
    makeAutoObservable(this, {
      setNavigate: false,
      navigate: false,
    });
  }
  setSessionId(s: string | undefined) {
    this.sessionId = s;
  }
}
