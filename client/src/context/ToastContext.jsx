import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Flame, Award, Unlock, Zap, Star, Info, AlertTriangle, CheckCircle2, XCircle, Swords, Snowflake, X } from 'lucide-react';

/**
 * ToastContext — one global, stackable notification system.
 *
 *   const toast = useToast();
 *   toast.success('Saved');
 *   toast.notify(serverNotifications)   // maps { type: 'level_up' | 'achievement' | … } to styled toasts
 */

const ToastContext = createContext(null);

const KIND = {
  level_up: { icon: Trophy, tone: 'amber' },
  streak_milestone: { icon: Flame, tone: 'orange' },
  streak_freeze: { icon: Snowflake, tone: 'sky' },
  achievement: { icon: Award, tone: 'violet' },
  skill_unlocked: { icon: Unlock, tone: 'emerald' },
  skill_mastered: { icon: Star, tone: 'emerald' },
  daily_bonus: { icon: Zap, tone: 'amber' },
  arena: { icon: Swords, tone: 'rose' },
  success: { icon: CheckCircle2, tone: 'emerald' },
  error: { icon: XCircle, tone: 'rose' },
  warning: { icon: AlertTriangle, tone: 'amber' },
  info: { icon: Info, tone: 'sky' }
};

const TONE = {
  amber: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-300',
  orange: 'border-orange-400/25 bg-orange-400/[0.08] text-orange-300',
  sky: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-300',
  violet: 'border-violet-400/25 bg-violet-400/[0.08] text-violet-300',
  emerald: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300',
  rose: 'border-rose-400/25 bg-rose-400/[0.08] text-rose-300'
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((t) => {
    const id = ++seq.current;
    const duration = t.duration ?? 4500;
    setToasts((list) => [...list.slice(-4), { id, ...t }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = useMemo(() => {
    const make = (type) => (title, message, opts = {}) => push({ type, title, message, ...opts });
    return {
      push,
      dismiss,
      success: make('success'),
      error: make('error'),
      warning: make('warning'),
      info: make('info'),
      /** Show a batch of server notifications, staggered so each one is readable. */
      notify: (notifications = []) => {
        notifications.forEach((n, i) => setTimeout(() => push({ type: n.type, title: n.title, message: n.message, duration: n.type === 'achievement' || n.type === 'level_up' ? 6000 : 4500 }), i * 450));
      }
    };
  }, [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const kind = KIND[t.type] || KIND.info;
            const Icon = kind.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl ${TONE[kind.tone]}`}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/25"><Icon className="h-4 w-4" strokeWidth={1.8} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold leading-snug text-zinc-100">{t.title}</div>
                  {t.message && <div className="mt-0.5 text-[12px] leading-snug text-zinc-400">{t.message}</div>}
                </div>
                <button onClick={() => dismiss(t.id)} className="mt-0.5 text-zinc-500 transition-colors hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
