import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, Zap, Flame, TrendingUp, Award, BookOpen, Sparkles, Unlock, Star, X } from 'lucide-react';
import { Bar, CountUp, achievementIcon, rarityStyle, cn } from '@/components/ui/kit';

const COLORS = ['#34d399', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185', '#f97316'];

/** Two-note "success" chime via Web Audio (silent if the browser blocks audio). */
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
 * SuccessOverlay — the reward moment after an accepted submission.
 * Shows XP breakdown (streak multiplier + daily bonus), animated mastery movement for the skill,
 * level-ups, unlocked skills, new badges, and the recommended next problem.
 */
export function SuccessOverlay({ show, onDismiss, result, problem, onOpenEditorial }) {
  const navigate = useNavigate();

  const pieces = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 0.4, dur: 1.6 + Math.random() * 1.6, size: 4 + Math.random() * 6, color: COLORS[i % COLORS.length], rot: Math.random() * 360, drift: (Math.random() - 0.5) * 120 })),
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={onDismiss}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          {pieces.map((p) => (
            <motion.span key={p.id} initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }} animate={{ y: 520, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rot + 360 }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }} className="pointer-events-none absolute top-0 rounded-sm" style={{ left: `${p.x}%`, width: p.size, height: p.size * 0.5, background: p.color }} />
          ))}

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0a0f14]/95 shadow-[0_0_80px_rgba(52,211,153,0.15)] backdrop-blur-xl"
          >
            <button onClick={onDismiss} className="absolute right-4 top-4 z-10 text-zinc-600 transition-colors hover:text-zinc-300"><X className="h-4 w-4" /></button>
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[70px]" />

            <div className="relative px-7 pb-6 pt-7 text-center">
              <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }} className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
                <Trophy className="h-8 w-8 text-emerald-300" strokeWidth={1.4} />
              </motion.div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-300/70">{alreadySolved ? 'Solved again' : 'Accepted'}</div>
              <div className="mt-1 text-[24px] font-semibold tracking-tight text-zinc-100">{problem?.title}</div>
              <div className="mt-1 text-[12px] text-zinc-500">{r.submission?.passedTestCases}/{r.submission?.totalTestCases} tests · {problem?.skillId?.name}</div>
            </div>

            <div className="space-y-4 px-7 pb-6">
              {/* XP */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-baseline justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500"><Zap className="h-3 w-3 text-amber-400" /> XP earned</span>
                  <span className="text-[28px] font-semibold tabular-nums text-amber-300">+<CountUp value={r.xpEarned || 0} /></span>
                </div>
                {(xp.base > 0 || xp.dailyBonus > 0) ? (
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-zinc-500">
                    <div className="flex justify-between"><span>Problem ({problem?.difficulty})</span><span className="text-zinc-300">+{xp.base}</span></div>
                    {xp.streakMultiplier > 1 && <div className="flex justify-between"><span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> Streak ×{xp.streakMultiplier}</span><span className="text-orange-300">+{xp.boosted - xp.base}</span></div>}
                    {xp.dailyBonus > 0 && <div className="flex justify-between"><span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-400" /> Daily challenge bonus</span><span className="text-amber-300">+{xp.dailyBonus}</span></div>}
                  </div>
                ) : <p className="mt-1.5 text-[11.5px] text-zinc-600">XP is awarded once per problem — but every solve still sharpens your mastery estimate.</p>}
              </div>

              {/* Mastery */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-sky-400" /> {problem?.skillId?.name} mastery</span>
                  <span className="text-zinc-300">{Math.round(before * 100)}% → <b className="text-emerald-300">{Math.round(after * 100)}%</b></span>
                </div>
                <div className="relative">
                  <Bar value={before} max={1} height={8} color="rgba(255,255,255,0.18)" animate={false} />
                  <div className="absolute inset-0"><Bar value={after} max={1} height={8} color="linear-gradient(90deg,#34d399,#38bdf8)" marker={0.85} /></div>
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[9px] text-zinc-600"><span>0%</span><span>mastery line 85%</span></div>
              </div>

              {/* events */}
              {(leveledUp || unlocked.length > 0 || r.streak?.value > 0 || badges.length > 0) && (
                <div className="space-y-2">
                  {leveledUp && <Chip icon={Star} tone="amber">Level up! You reached level {r.newLevel}</Chip>}
                  {r.streak?.value > 0 && <Chip icon={Flame} tone="orange">{r.streak.value}-day streak{r.streak.freezeUsed ? ' — freeze used, streak saved' : ''}</Chip>}
                  {unlocked.map((s) => <Chip key={s} icon={Unlock} tone="emerald">Skill unlocked: {s}</Chip>)}
                  {badges.map((b) => { const I = achievementIcon(b.icon); return <div key={b.key} className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-2.5', rarityStyle(b.rarity).ring)}><I className="h-4 w-4" /><div className="text-left"><div className="text-[12.5px] font-semibold">Badge: {b.title}</div><div className="text-[11px] opacity-70">{b.desc} · +{b.xp} XP</div></div></div>; })}
                </div>
              )}

              {/* actions */}
              <div className="flex gap-2.5 pt-1">
                {next && (
                  <button onClick={() => { onDismiss?.(); navigate(`/problems/${next.problem._id}`); }} className="group flex flex-1 items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-left text-[12.5px] font-semibold text-black transition-all hover:brightness-110">
                    <span className="min-w-0"><span className="block text-[9px] font-medium uppercase tracking-wider opacity-70">Next up · {Math.round(next.predictedSuccess * 100)}% success</span><span className="block truncate">{next.problem.title}</span></span>
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
                <button onClick={() => { onDismiss?.(); onOpenEditorial?.(); }} className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] px-4 py-3 text-[12px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"><BookOpen className="h-3.5 w-3.5" /> Editorial</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Chip({ icon: Icon, tone, children }) {
  const t = { amber: 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200', orange: 'border-orange-400/25 bg-orange-400/[0.07] text-orange-200', emerald: 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200' }[tone];
  return <div className={cn('flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left text-[12.5px] font-medium', t)}><Icon className="h-4 w-4 shrink-0" />{children}</div>;
}
