import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import './index.css';

// development aid: `?noanim` makes every animation land instantly (used by automated checks in a background tab)
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('noanim')) MotionGlobalConfig.skipAnimations = true;

// One listener feeds every `.spot` / `.row` surface its pointer position, so no component needs its own handler.
document.addEventListener('pointermove', (e) => {
  const el = e.target instanceof Element ? e.target.closest('.spot, .row') : null;
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
