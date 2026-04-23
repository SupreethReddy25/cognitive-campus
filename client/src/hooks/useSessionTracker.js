import { useEffect } from 'react';

/**
 * useSessionTracker — Persists the user's last active problem to localStorage.
 * 
 * Call `trackProblem(problemId)` on every workspace mount.
 * Call `getLastSession()` from the Dashboard to power the "Continue" button.
 */

const STORAGE_KEY = 'cc_last_session';

export function useSessionTracker() {
  const trackProblem = (problemId) => {
    if (!problemId) return;
    const payload = {
      problemId,
      timestamp: Date.now(),
      path: `/problems/${problemId}`
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  };

  const getLastSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };

  const clearSession = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return { trackProblem, getLastSession, clearSession };
}
