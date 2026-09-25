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
  amber: ['#f2c66d', 'text-amber-300'],
  orange: ['#ff7a4d', 'text-orange-300'],
  sky: ['#8fbcda', 'text-sky-300'],
  violet: ['#f2c66d', 'text-amber-300'],
  emerald: ['#94d6a8', 'text-emerald-300'],
  rose: ['#f0728a', 'text-rose-300']
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
      <div className="pointer-events-none fixed bottom-24 right-5 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2.5">
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
                className="pointer-events-auto relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[#16161b] py-3.5 pl-5 pr-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)]"
              >
                <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: TONE[kind.tone][0] }} />
                <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${TONE[kind.tone][1]}`} strokeWidth={1.7} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium leading-snug text-zinc-50">{t.title}</div>
                  {t.message && <div className="mt-0.5 text-[12.5px] leading-snug text-zinc-500">{t.message}</div>}
                </div>
                <button onClick={() => dismiss(t.id)} className="mt-0.5 text-zinc-600 transition-colors hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
