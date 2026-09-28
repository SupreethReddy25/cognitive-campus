import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CompanyLogo } from '../ui/kit';

const W = 1000;
const H = 520;
const PAD = { l: 64, r: 36, t: 30, b: 58 };
const TIER_COLOR = { FAANG: '#34d399', Product: '#e4e4e7', Finance: '#fbbf24', Service: '#71717a', Startup: '#a78bfa' };
const DIFF = { Easy: 1, Medium: 2, Hard: 3 };
const MAX_LPA = 90;

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

/** Total scheduled interview time in minutes, summed from the rounds' stated durations. */
const minutesOf = (c) => (c.interviewProcess?.rounds || []).reduce((n, r) => n + (parseInt(String(r.duration || '').match(/\d+/)?.[0], 10) || 0), 0);

/** Interview load from what we actually know: how demanding the process is rated, plus how many hours it takes. */
const intensity = (c) => (DIFF[c.interviewProcess?.difficulty] || 2) * 3 + (minutesOf(c) || 240) / 45;

/**
 * The atlas as a map: package on one axis, interview intensity on the other, bubble size = reports on file.
 * Whatever the filters hide is dimmed, not removed, so the shape of the market stays readable.
 */
export function CompanyMap({ companies, visible, campus, collegeName }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(null);
  const visibleIds = useMemo(() => new Set(visible.map((c) => c._id)), [visible]);

  const points = useMemo(() => {
    const ints = companies.map(intensity);
    const lo = Math.min(...ints, 6) - 0.5;
    const hi = Math.max(...ints, 16) + 0.5;
    return companies.filter((c) => c.ctcMax != null).map((c) => {
      const cx = PAD.l + (Math.min(c.ctcMax, MAX_LPA) / MAX_LPA) * (W - PAD.l - PAD.r);
      const jitter = (hash(c.name) - 0.5) * 0.7;
      const cy = H - PAD.b - ((intensity(c) + jitter - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
      return { c, cx, cy, r: 9 + Math.sqrt(c.experienceCount || 0) * 4.2, color: TIER_COLOR[c.tier] || '#a1a1aa' };
    }).sort((a, b) => b.r - a.r); // small bubbles paint last so they stay clickable
  }, [companies]);

  const active = points.find((p) => p.c._id === hover);
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  const fillIn = (i) => ({ delay: hover === null ? 0.1 + i * 0.025 : 0 });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none overflow-visible" role="group" aria-label="Companies by package and interview intensity">
        {ticks.map((t) => {
          const x = PAD.l + (t / MAX_LPA) * (W - PAD.l - PAD.r);
          return (
            <g key={t}>
              <line x1={x} x2={x} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.05)" />
              <text x={x} y={H - PAD.b + 22} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="#52525b" letterSpacing="1">{t}</text>
            </g>
          );
        })}
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 6" />)}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="rgba(255,255,255,0.18)" />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.18)" />
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#71717a" letterSpacing="2">PACKAGE (LPA, TOP OF RANGE) →</text>
        <text x={PAD.l - 14} y={PAD.t + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#71717a" letterSpacing="2">HEAVIER LOAD</text>
        <text x={PAD.l - 14} y={H - PAD.b} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#71717a" letterSpacing="2">LIGHTER LOAD</text>
        <text x={W - PAD.r - 8} y={PAD.t + 16} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.16)" letterSpacing="3">DEMANDING · TOP PAY</text>
        <text x={W - PAD.r - 8} y={H - PAD.b - 12} textAnchor="end" fontSize="10.5" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.16)" letterSpacing="3">LIGHTER · TOP PAY</text>
        <text x={PAD.l + 12} y={PAD.t + 16} fontSize="10.5" fontFamily="var(--font-mono)" fill="rgba(255,255,255,0.16)" letterSpacing="3">DEMANDING</text>

        {points.map(({ c, cx, cy, r, color }, i) => {
          const on = visibleIds.has(c._id);
          const isHover = hover === c._id;
          const inCampus = !!campus?.[c.slug];
          return (
            <motion.g key={c._id} transform={`translate(${cx} ${cy})`} initial={{ opacity: 0 }} animate={{ opacity: hover && !isHover ? 0.25 : on ? 1 : 0.14 }} transition={{ duration: 0.45, ...fillIn(i) }}
              onPointerEnter={() => setHover(c._id)} onPointerLeave={() => setHover(null)} onClick={() => navigate(`/companies/${c.slug}`)} className="cursor-pointer outline-none" tabIndex={0} role="link" aria-label={`${c.name}, up to ${c.ctcMax} LPA`}
              onFocus={() => setHover(c._id)} onBlur={() => setHover(null)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/companies/${c.slug}`); }}>
              <circle r={r + 14} fill="transparent" />
              {inCampus && <circle r={r + 6} fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 4" />}
              <motion.circle r={r} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={isHover ? 2 : 1.2} initial={{ scale: 0 }} animate={{ scale: isHover ? 1.18 : 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18, ...fillIn(i) }} style={{ transformOrigin: '0px 0px' }} />
              <circle r={2.6} fill={color} />
              {(r > 17 || isHover) && <text y={r + 15} textAnchor="middle" fontSize="11.5" fontFamily="var(--font-sans)" fill={isHover ? '#fff' : 'rgba(255,255,255,0.7)'} style={{ paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 4, strokeLinejoin: 'round' }}>{c.name}</text>}
            </motion.g>
          );
        })}
      </svg>

      <AnimatePresence>
        {active && (
          <motion.div key={active.c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="pointer-events-none absolute z-10 w-[250px] border border-white/[0.14] bg-[#0a0a0a]/95 p-5 backdrop-blur-xl"
            style={{ left: `${(active.cx / W) * 100}%`, top: `${(active.cy / H) * 100}%`, transform: `translate(${active.cx > W * 0.6 ? 'calc(-100% - 24px)' : '24px'}, -50%)` }}>
            <div className="flex items-center gap-3">
              <CompanyLogo company={active.c} size={34} />
              <div className="min-w-0"><div className="display truncate text-[22px] leading-none text-zinc-50">{active.c.name}</div><div className="tag mt-1 !text-[9px]">{active.c.tier}</div></div>
            </div>
            <dl className="mt-4 space-y-1.5 text-[12.5px]">
              {[
                ['Package', active.c.ctcMin === active.c.ctcMax ? `${active.c.ctcMax} LPA` : `${active.c.ctcMin}–${active.c.ctcMax} LPA`],
                ['Process', `${active.c.interviewProcess?.rounds?.length || '—'} rounds · ${minutesOf(active.c) ? `${(minutesOf(active.c) / 60).toFixed(1)}h` : '—'} · ${active.c.interviewProcess?.difficulty || '—'}`],
                ['Reports', active.c.experienceCount],
                ...(active.c.offerRate != null ? [['Offer rate', `${active.c.offerRate}%`]] : []),
                ...(campus?.[active.c.slug] ? [[collegeName || 'Your campus', `${campus[active.c.slug].visits} seasons${campus[active.c.slug].probability != null ? ` · ${campus[active.c.slug].probability}% likely` : ''}`]] : [])
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="tag !text-[9px]">{k}</dt><dd className="text-right text-zinc-200">{v}</dd></div>)}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        {Object.entries(TIER_COLOR).map(([t, col]) => <span key={t} className="tag flex items-center gap-2 !text-[9.5px]"><span className="h-2 w-2 rounded-full" style={{ background: col }} />{t}</span>)}
        {campus && Object.keys(campus).length > 0 && <span className="tag flex items-center gap-2 !text-[9.5px] !text-[var(--signal)]"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-[var(--signal)]" />Recruits at {collegeName || 'your campus'}</span>}
        <span className="tag ml-auto !text-[9px] !text-zinc-700">Load = rated difficulty + total interview hours · bubble size = reports on file</span>
      </div>
    </div>
  );
}
