import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';

// Safely register PWA service worker with automatic update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({ 
      immediate: true,
      onRegisterError(error) {
        console.warn('PWA service worker registration error:', error);
      }
    });
  } catch (err) {
    console.warn('PWA service worker bypass:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

