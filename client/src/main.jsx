import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import './index.css';

// development aid: `?noanim` makes every animation land instantly (used by automated checks in a background tab)
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('noanim')) MotionGlobalConfig.skipAnimations = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
