import { createContext, useContext } from 'react';
import { InputStore } from '@/stores/inputStore.ts';
import { ThemeStore } from './themeStore';

export class RootStore {
  themeStore: ThemeStore;
  inputStore: InputStore;

  constructor() {
    this.themeStore = new ThemeStore();
    this.inputStore = new InputStore();
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
