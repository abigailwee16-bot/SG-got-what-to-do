import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress non-actionable cross-origin third-party script errors (e.g. Disqus / Clarity / ads / iframe postMessage)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Check for generic cross-origin "Script error." or third-party origins
    if (
      event.message === 'Script error.' ||
      event.filename?.includes('disqus.com') ||
      event.filename?.includes('clarity.ms') ||
      event.filename?.includes('basemaps.cartocdn.com')
    ) {
      // Prevent noisy bubbling of third-party script errors
      event.preventDefault();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('disqus') ||
      reason.includes('clarity') ||
      reason.includes('Script error')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
