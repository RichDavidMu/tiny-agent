import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import rootStore, { RootStoreProvider } from '@/stores/root-store.ts';
import App from './app';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootStoreProvider value={rootStore}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootStoreProvider>
  </StrictMode>,
);
