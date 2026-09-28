import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../ui/kit';

/** Small pieces of the arena: rank tiers, the ladder, the Elo curve, the code input and the mode illustrations. */

export const EASE = [0.22, 1, 0.36, 1];
export const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };
export const dkey = (d) => String(d || '').toLowerCase();

export const TIERS = [
  { name: 'Bronze', min: 0, color: '#c98b5b' },
  { name: 'Silver', min: 1000, color: '#cbd5e1' },
  { name: 'Gold', min: 1200, color: '#fbbf24' },
  { name: 'Archon', min: 1400, color: '#a78bfa' },
  { name: 'Legend', min: 1600, color: '#34d399' }
];
export const tierOf = (elo) => [...TIERS].reverse().find((t) => elo >= t.min) || TIERS[0];
export const nextTier = (elo) => TIERS.find((t) => t.min > elo) || null;

/** Follows the pointer with a soft light — drives the `.spot` surfaces. */
export const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

const LADDER_MIN = 700;
const LADDER_MAX = 1700;
const at = (elo) => Math.min(1, Math.max(0, (elo - LADDER_MIN) / (LADDER_MAX - LADDER_MIN)));

/** The five tiers as one track, with a marker that slides to where you stand. */
export function RankLadder({ elo }) {
  const tier = tierOf(elo); const next = nextTier(elo);
  return (
    <div>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 flex h-[3px] -translate-y-1/2 gap-[3px]">
          {TIERS.map((t, i) => {
            const from = i === 0 ? 0 : at(t.min); const to = i === TIERS.length - 1 ? 1 : at(TIERS[i + 1].min);
            const fill = Math.min(1, Math.max(0, (at(elo) - from) / (to - from)));
            return (
              <div key={t.name} className="relative h-full bg-white/[0.08]" style={{ width: `${(to - from) * 100}%` }}>
                <motion.div className="absolute inset-y-0 left-0" style={{ background: t.color }} initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }} transition={{ duration: 1.4, delay: 0.3 + i * 0.12, ease: EASE }} />
              </div>
            );
          })}
        </div>
        <motion.div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" initial={{ left: '0%' }} animate={{ left: `${at(elo) * 100}%` }} transition={{ duration: 1.5, delay: 0.4, ease: EASE }}>
          <span className="absolute -inset-3 rounded-full opacity-50 blur-md" style={{ background: tier.color }} />
          <span className="relative block h-3 w-3 rounded-full border-2 border-[#0a0a0a]" style={{ background: tier.color, boxShadow: `0 0 0 1px ${tier.color}` }} />
        </motion.div>
      </div>
      <div className="relative mt-1 flex">
        {TIERS.map((t, i) => {
          const from = i === 0 ? 0 : at(t.min); const to = i === TIERS.length - 1 ? 1 : at(TIERS[i + 1].min);
          return <span key={t.name} className={cn('tag !text-[9px] !tracking-[0.16em]', t.name === tier.name && '!text-zinc-200')} style={{ width: `${(to - from) * 100}%` }}>{t.name}</span>;
        })}
      </div>
      <div className="mt-3 text-[13px] text-zinc-500">
        {next ? <><span className="tnum text-zinc-200">{next.min - elo}</span> points to <span style={{ color: next.color }}>{next.name}</span></> : 'Top tier — defend it.'}
      </div>
    </div>
  );
}

/** Your Elo across recent matches, reconstructed from the match history. */
export function EloTrend({ history = [], elo }) {
  const pts = useMemo(() => {
    const list = history.slice(-10);
    if (!list.length) return [];
    const start = elo - list.reduce((a, m) => a + (m.eloChange || 0), 0);
    let cur = start; const out = [{ v: start, m: null }];
    list.forEach((m) => { cur += m.eloChange || 0; out.push({ v: cur, m }); });
    return out;
  }, [history, elo]);

  if (pts.length < 2) {
    return <div className="flex h-full min-h-[120px] items-center text-[14px] leading-relaxed text-zinc-600">Play a rated Versus match and your rating curve starts here.</div>;
  }
  const W = 320; const H = 110; const pad = 10;
  const lo = Math.min(...pts.map((p) => p.v)) - 8; const hi = Math.max(...pts.map((p) => p.v)) + 8;
  const xy = pts.map((p, i) => [pad + (i * (W - pad * 2)) / (pts.length - 1), H - pad - ((p.v - lo) / (hi - lo || 1)) * (H - pad * 2)]);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
      <defs><linearGradient id="elo-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.22" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
      <motion.path d={`${line} L${xy[xy.length - 1][0]},${H} L${xy[0][0]},${H} Z`} fill="url(#elo-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.8 }} />
      <motion.path d={line} fill="none" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.3, ease: EASE }} />
      {xy.map(([x, y], i) => {
        const m = pts[i].m; if (!m) return null;
        const col = m.result === 'win' ? '#34d399' : m.result === 'loss' ? '#fb7185' : '#a1a1aa';
        return (
          <motion.circle key={i} cx={x} cy={y} r="3.2" fill="#0a0a0a" stroke={col} strokeWidth="1.5" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 300, damping: 18 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <title>{`${m.result} vs ${m.opponentName || 'opponent'} · ${m.eloChange > 0 ? '+' : ''}${m.eloChange}`}</title>
          </motion.circle>
        );
      })}
    </svg>
  );
}

/** Six boxes that behave like one field: type, paste, backspace across them. */
export function CodeInput({ value, onChange, onEnter, autoFocus = false }) {
  const refs = useRef([]);
  const chars = Array.from({ length: 6 }, (_, i) => value[i] || '');
  useEffect(() => { if (autoFocus) refs.current[Math.min(value.length, 5)]?.focus(); }, [autoFocus]); // eslint-disable-line react-hooks/exhaustive-deps
  const clean = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const set = (i, ch) => { const next = chars.slice(); next[i] = ch; onChange(next.join('').slice(0, 6)); };
  return (
    <div className="flex gap-2" onPaste={(e) => { e.preventDefault(); const t = clean(e.clipboardData.getData('text')).slice(0, 6); onChange(t); refs.current[Math.min(t.length, 5)]?.focus(); }}>
      {chars.map((c, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="text" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`Code character ${i + 1}`}
          onChange={(e) => { const ch = clean(e.target.value).slice(-1); if (!ch) return; set(i, ch); refs.current[i + 1]?.focus(); }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') { e.preventDefault(); if (chars[i]) set(i, ''); else { set(Math.max(0, i - 1), ''); refs.current[Math.max(0, i - 1)]?.focus(); } }
            else if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus();
            else if (e.key === 'ArrowRight') refs.current[i + 1]?.focus();
            else if (e.key === 'Enter') onEnter?.();
          }}
          onFocus={(e) => e.target.select()}
          className={cn('display h-14 w-full min-w-0 border bg-transparent text-center text-[26px] uppercase text-zinc-50 outline-none transition-all duration-300 focus:-translate-y-0.5 focus:border-[var(--signal)] focus:bg-white/[0.03]', c ? 'border-white/[0.24]' : 'border-white/[0.09]')} />
      ))}
    </div>
  );
}

/** Rings that ripple outward while we look for an opponent. */
export function Radar({ size = 64 }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute inset-0 rounded-full border border-[var(--signal)]" initial={{ scale: 0.15, opacity: 0.8 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }} />
      ))}
      <span className="relative h-2 w-2 rounded-full bg-[var(--signal)]" />
    </span>
  );
}

/** Tiny looping illustrations that show what each mode feels like. */
export function ModeArt({ id }) {
  if (id === 'versus') {
    return (
      <div className="relative h-full w-full">
        {[['34%', '#34d399', 4.6, 0], ['66%', '#38bdf8', 5.4, 0.6]].map(([top, c, dur, delay]) => (
          <div key={top} className="absolute inset-x-[6%]" style={{ top }}>
            <div className="h-px w-full bg-white/[0.14]" />
            <motion.span className="absolute -top-[4px] h-2 w-2 rounded-full" style={{ background: c, boxShadow: `0 0 12px ${c}` }} animate={{ left: ['0%', '92%', '0%'] }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }} />
            <span className="absolute -right-1 -top-[5px] h-2.5 w-2.5 rotate-45 border border-white/30" />
          </div>
        ))}
      </div>
    );
  }
  const line = (w, i, c) => <motion.span key={i} className="block h-[3px] rounded-full" style={{ background: c || 'rgba(255,255,255,0.16)' }} initial={{ width: 0 }} animate={{ width: [0, `${w}%`, `${w}%`, 0] }} transition={{ duration: 6, repeat: Infinity, delay: i * 0.5, times: [0, 0.35, 0.85, 1], ease: 'easeInOut' }} />;
  if (id === 'coop-shared') {
    return (
      <div className="relative h-full w-full px-[10%] py-[18%]">
        <div className="space-y-2.5">{[62, 78, 44, 70, 52].map((w, i) => line(w, i))}</div>
        <motion.span className="absolute left-[18%] top-[16%] h-4 w-[2px] bg-[#34d399]" animate={{ x: [0, 90, 40, 0], y: [0, 14, 42, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}><span className="absolute -top-3.5 left-0 whitespace-nowrap bg-[#34d399] px-1 font-mono text-[7px] font-bold text-black">YOU</span></motion.span>
        <motion.span className="absolute left-[55%] top-[52%] h-4 w-[2px] bg-[#38bdf8]" animate={{ x: [0, -70, -20, 0], y: [0, -28, -6, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}><span className="absolute -top-3.5 left-0 whitespace-nowrap bg-[#38bdf8] px-1 font-mono text-[7px] font-bold text-black">PEER</span></motion.span>
      </div>
    );
  }
  return (
    <div className="grid h-full w-full grid-cols-2 gap-3 px-[8%] py-[16%]">
      {[['#34d399', 0], ['#38bdf8', 1.4]].map(([c, d]) => (
        <div key={c} className="space-y-2.5 border border-white/[0.1] p-2.5">
          {[70, 48, 82, 36].map((w, i) => line(w, i + d, i === 3 ? c : undefined))}
        </div>
      ))}
    </div>
  );
}
