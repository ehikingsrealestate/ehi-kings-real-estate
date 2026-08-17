import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {ConvexProvider} from 'convex/react';
import {Analytics} from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import {convex} from './admin/convexClient';

// When launched as an installed app (home-screen / standalone), open the staff
// workspace — not the marketing home. iOS bookmarks the page you "Add to Home
// Screen" from and ignores the manifest start_url, so we steer to /admin here.
(() => {
  try {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone && (window.location.pathname === '/' || window.location.pathname === '')) {
      window.location.replace('/admin');
    }
  } catch { /* ignore */ }
})();

const tree = (
  <BrowserRouter>
    <App />
    <Analytics />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {convex ? <ConvexProvider client={convex}>{tree}</ConvexProvider> : tree}
  </StrictMode>,
);

// Register the service worker so the staff app is installable to the home screen.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
