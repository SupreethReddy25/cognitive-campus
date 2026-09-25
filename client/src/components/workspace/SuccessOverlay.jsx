import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { CountUp, cn } from '@/components/ui/kit';
import { starColor } from '@/components/dashboard/constellation';

/** Three-note "success" chime via Web Audio (silent if the browser blocks audio). */
function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.05 + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9 + i * 0.09);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09); osc.stop(ctx.currentTime + 1.3);
    });
  } catch { /* audio unavailable */ }
}

/**
 * SuccessOverlay — the reward moment: the skill's star is lit a little brighter.
 * XP breakdown, mastery movement, level-ups, unlocked skills, badges and the recommended next problem.
 */
export function SuccessOverlay({ show, onDismiss, result, problem, onOpenEditorial }) {
  const navigate = useNavigate();

  // a burst of sparks radiating from the star
  const sparks = useMemo(
    () => Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2 + Math.random() * 0.4; const d = 120 + Math.random() * 150; return { id: i, x: Math.cos(a) * d, y: Math.sin(a) * d, s: 2 + Math.random() * 3.5, delay: Math.random() * 0.25 }; }),
    [show] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!show) return undefined;
    if (localStorage.getItem('cc_sound') !== 'off') chime();
    const onKey = (e) => e.key === 'Escape' && onDismiss?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onDismiss]);

  const r = result || {};
  const xp = r.xpBreakdown || {};
  const before = r.masteryBefore ?? 0;
  const after = r.newMastery ?? 0;
  const next = r.nextRecommendation;
  const unlocked = r.newlyUnlockedSkills || [];
  const badges = r.achievements || [];
  const leveledUp = (r.notifications || []).some((n) => n.type === 'level_up');
  const alreadySolved = xp.alreadySolved;
  const rBefore = 8 + before * 16;
  const rAfter = 8 + after * 16;
  const col = starColor(after, 1);

  const lines = [];
  if (leveledUp) lines.push(<>You reached <b className="text-zinc-50">level {r.newLevel}</b>.</>);
  if (r.streak?.value > 0) lines.push(<><b className="text-[var(--ember-soft)]">{r.streak.value}-day streak</b>{r.streak.freezeUsed ? ' — a freeze saved it' : ''}.</>);
  unlocked.forEach((s) => lines.push(<>New skill unlocked: <b className="text-zinc-50">{s}</b>.</>));
  badges.forEach((b) => lines.push(<>Badge earned — <b className="text-[var(--star)]">{b.title}</b> <span className="text-zinc-600">(+{b.xp} XP)</span>.</>));

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={onDismiss}>
          <div className="absolute inset-0 bg-[#0c0c10]/[0.93] backdrop-blur-md" />

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }} onClick={(e) => e.stopPropagation()} className="relative z-10 w-full max-w-[560px] text-center">
            <button onClick={onDismiss} className="absolute -top-2 right-0 text-zinc-600 transition-colors hover:text-zinc-300" aria-label="Close"><X className="h-5 w-5" /></button>

            {/* the star */}
            <div className="relative mx-auto h-[260px] w-[260px]">
              {sparks.map((p) => (
                <motion.span key={p.id} initial={{ x: 0, y: 0, opacity: 0, scale: 1 }} animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [1, 1, 0.3] }} transition={{ duration: 1.5, delay: 0.25 + p.delay, ease: 'easeOut' }} className="pointer-events-none absolute left-1/2 top-1/2 rounded-full" style={{ width: p.s, height: p.s, background: col }} />
              ))}
              <svg viewBox="-130 -130 260 260" className="absolute inset-0 h-full w-full overflow-visible">
                <defs><radialGradient id="ov-halo"><stop offset="0%" stopColor={col} stopOpacity="0.6" /><stop offset="100%" stopColor={col} stopOpacity="0" /></radialGradient></defs>
                <motion.circle cx="0" cy="0" fill="url(#ov-halo)" initial={{ r: rBefore * 3 }} animate={{ r: rAfter * 4.2 }} transition={{ duration: 1.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }} />
                <motion.g initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8 }} stroke={col} strokeWidth="1.2" strokeLinecap="round" style={{ transformOrigin: '0px 0px' }}>
                  <line x1={-rAfter - 30} x2={rAfter + 30} y1="0" y2="0" /><line y1={-rAfter - 30} y2={rAfter + 30} x1="0" x2="0" />
                </motion.g>
                <motion.circle cx="0" cy="0" fill={col} initial={{ r: rBefore }} animate={{ r: rAfter }} transition={{ duration: 1.3, delay: 0.3, ease: [0.23, 1, 0.32, 1] }} />
              </svg>
            </div>

            <div className="-mt-6 text-[14px] text-zinc-500">{alreadySolved ? 'Solved again' : 'Accepted'} · {r.submission?.passedTestCases}/{r.submission?.totalTestCases} tests</div>
            <h2 className="display mt-2 text-[clamp(44px,7vw,72px)] text-zinc-50">{problem?.title}</h2>

            <div className="mt-8 flex items-end justify-center gap-10">
              <div><div className="display text-[64px] leading-none tnum text-[var(--star)]">+<CountUp value={r.xpEarned || 0} /></div><div className="mt-1 text-[13px] text-zinc-500">XP{xp.streakMultiplier > 1 ? ` · streak ×${xp.streakMultiplier}` : ''}{xp.dailyBonus > 0 ? ` · daily +${xp.dailyBonus}` : ''}</div></div>
              <div><div className="display text-[64px] leading-none tnum text-zinc-50">{Math.round(before * 100)}<span className="text-[26px] text-zinc-600"> → </span><span style={{ color: col }}>{Math.round(after * 100)}</span><span className="text-[26px] text-zinc-600">%</span></div><div className="mt-1 text-[13px] text-zinc-500">{problem?.skillId?.name} mastery</div></div>
            </div>
            {xp.alreadySolved && <p className="mx-auto mt-4 max-w-sm text-[13px] text-zinc-600">XP is awarded once per problem — every solve still sharpens your mastery estimate.</p>}

            {lines.length > 0 && <ul className="mx-auto mt-8 max-w-md space-y-2 text-[15px] text-zinc-400">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {next && (
                <button onClick={() => { onDismiss?.(); navigate(`/problems/${next.problem._id}`); }} className="group flex items-center gap-4 rounded-full bg-[var(--ember)] py-2.5 pl-7 pr-2.5 text-left text-[#1a0d07] transition-[filter] hover:brightness-110">
                  <span className="min-w-0"><span className="block text-[11.5px] font-medium opacity-70">Next · {Math.round(next.predictedSuccess * 100)}% likely</span><span className="block max-w-[240px] truncate text-[15px] font-semibold">{next.problem.title}</span></span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a0d07] text-[var(--ember)]"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                </button>
              )}
              <button onClick={() => { onDismiss?.(); onOpenEditorial?.(); }} className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-[14px] text-zinc-300 transition-colors hover:border-zinc-400">Read the editorial</button>
              <button onClick={onDismiss} className={cn('text-[14px] text-zinc-600 transition-colors hover:text-zinc-300')}>Keep going</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
