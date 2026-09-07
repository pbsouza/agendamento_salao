import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Service Worker Handling
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (window.self !== window.top) {
    // Inside preview iframe: purge any existing workers to guarantee live preview renders directly
    try {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    } catch {}
  } else {
    // Direct browser navigation / PWA mode
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker
        .register(swUrl)
        .catch(() => {});
    });
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
