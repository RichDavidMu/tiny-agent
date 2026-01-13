import { createContext, useContext } from 'react';
import { ThemeStore } from './themeStore';

export class RootStore {
  themeStore: ThemeStore;

  constructor() {
    this.themeStore = new ThemeStore();
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
