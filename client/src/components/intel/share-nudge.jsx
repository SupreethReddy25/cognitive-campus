import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

/**
 * A quiet invitation to share an interview — one card per scope, and gone for a week once dismissed.
 * It never opens anything on its own.
 */
const KEY = (scope) => `cc_nudge_${scope}`;
const WEEK = 7 * 86400000;

const dismissed = (scope) => {
  try { const at = Number(localStorage.getItem(KEY(scope))); return !!at && Date.now() - at < WEEK; } catch { return false; }
};

export function ShareNudge({ scope, title, text, action = 'Share yours', onShare, className = '' }) {
  const [hidden, setHidden] = useState(() => dismissed(scope));
  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(KEY(scope), String(Date.now())); } catch { /* storage unavailable */ }
  };
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border border-white/[0.09] px-6 py-5 ${className}`}>
          <div className="min-w-0 max-w-2xl">
            <div className="display text-[22px] leading-tight text-zinc-100">{title}</div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-zinc-500">{text}</p>
          </div>
          <div className="flex items-center gap-6">
            <button type="button" onClick={onShare} className="btn-line group">{action}<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></button>
            <button type="button" onClick={dismiss} aria-label="Not now" className="tag flex items-center gap-1.5 transition-colors hover:!text-zinc-100"><X className="h-3 w-3" />Not now</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
