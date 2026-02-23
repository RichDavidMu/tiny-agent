import { createContext, useContext } from 'react';
import { InputStore } from '@/stores/input-store.ts';
import { HistoryStore } from '@/stores/history-store.ts';
import { SessionStore } from '@/stores/session-store.ts';
import { ThemeStore } from './theme-store.ts';

export class RootStore {
  themeStore: ThemeStore;
  inputStore: InputStore;
  historyStore: HistoryStore;
  sessionStore: SessionStore;

  constructor() {
    this.themeStore = new ThemeStore();
    this.inputStore = new InputStore();
    this.historyStore = new HistoryStore();
    this.sessionStore = new SessionStore();
  }
}

const rootStore = new RootStore();

const RootStoreContext = createContext<RootStore>(rootStore);

export const useStore = () => {
  const context = useContext(RootStoreContext);
  if (!context) {
    throw new Error('useStore must be used within RootStoreProvider');
  }
  return context;
};

export const RootStoreProvider = RootStoreContext.Provider;

export default rootStore;
