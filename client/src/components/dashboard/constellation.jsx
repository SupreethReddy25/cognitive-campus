import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * The Constellation — your knowledge as a night sky.
 *
 * Every skill is a star. Brightness and colour come straight from the Bayesian mastery estimate
 * (dim ember → gold → white-hot), lines are prerequisites, and a pulsing ring means the forgetting
 * curve says it is time to review. Laid out as a layered graph so the shape of the curriculum is visible.
 */

const W = 1200;
const H = 480;

const hash = (str, salt = 0) => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
};

export const starColor = (p, attempts) => {
  if (!attempts) return '#71717a';
  if (p >= 0.85) return '#ecfdf5';
  if (p >= 0.6) return '#34d399';
  if (p >= 0.35) return '#fbbf24';
  return '#fb7185';
};

function layout(skills) {
  const byId = new Map(skills.map((s) => [s.skillId, s]));
  const depth = new Map();
  const dfs = (s) => {
    if (depth.has(s.skillId)) return depth.get(s.skillId);
    depth.set(s.skillId, 0); // cycle guard
    const d = (s.prerequisites || []).reduce((m, p) => (byId.has(p._id) ? Math.max(m, dfs(byId.get(p._id)) + 1) : m), 0);
    depth.set(s.skillId, d);
    return d;
  };
  skills.forEach(dfs);
  const cols = Math.max(...depth.values(), 0) + 1;
  const groups = Array.from({ length: cols }, () => []);
  [...skills].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((s) => groups[depth.get(s.skillId)].push(s));

  const pos = new Map();
  groups.forEach((g, c) => {
    g.forEach((s, i) => {
      const x = cols === 1 ? W / 2 : 110 + (c * (W - 220)) / (cols - 1) + (hash(s.name, 1) - 0.5) * 34;
      const slot = (H - 150) * ((i + 1) / (g.length + 1)) + 75;
      const y = slot + (hash(s.name, 2) - 0.5) * 22;
      pos.set(s.skillId, { x, y, depth: c });
    });
  });
  return { pos, cols };
}

const BG_STARS = Array.from({ length: 110 }, (_, i) => ({
  x: hash('x' + i) * W, y: hash('y' + i) * H, r: 0.5 + hash('r' + i) * 1.3,
  o: 0.15 + hash('o' + i) * 0.45, d: hash('d' + i) * 6, t: 3 + hash('t' + i) * 5
}));

function Tip({ skill, p, onGo }) {
  const status = !skill.isUnlocked && !skill.attempts ? 'Locked — master its prerequisites first'
    : skill.reviewDue ? 'Due for review — it is fading'
    : skill.isMastered ? 'Mastered'
    : skill.attempts ? 'Growing'
    : 'Not started';
  return (
    <div className="w-[248px] rounded-sm border border-[var(--line-strong)] bg-[#0f0f0f] p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]">
      <div className="flex items-baseline justify-between gap-3">
        <div className="display text-[19.2px] text-zinc-50">{skill.name}</div>
        <div className="display text-[24px] tnum" style={{ color: starColor(p, skill.attempts) }}>{Math.round(p * 100)}<span className="text-[15px]">%</span></div>
      </div>
      <div className="tag mt-0.5">{status}</div>
      <dl className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3 text-[12px]">
        <div className="flex justify-between"><dt className="text-zinc-500">Attempts</dt><dd className="tnum text-zinc-300">{skill.attempts}</dd></div>
        {skill.trend && skill.attempts > 0 && <div className="flex justify-between"><dt className="text-zinc-500">Trend</dt><dd className="text-zinc-300">{skill.trend === 'up' ? 'Rising' : skill.trend === 'down' ? 'Slipping' : 'Steady'}</dd></div>}
        {skill.cohortDelta != null && skill.attempts > 0 && <div className="flex justify-between"><dt className="text-zinc-500">vs your peers</dt><dd className="tnum text-zinc-300">{skill.cohortDelta >= 0 ? '+' : ''}{Math.round(skill.cohortDelta * 100)} pts</dd></div>}
        {skill.predictedAttemptsToMastery > 0 && !skill.isMastered && <div className="flex justify-between"><dt className="text-zinc-500">To mastery</dt><dd className="tnum text-zinc-300">~{skill.predictedAttemptsToMastery} solves</dd></div>}
      </dl>
      <button onClick={onGo} className="btn-line group">
        Practice {skill.name}<ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Constellation({ skills = [], onGo = null, aspect = null }) {
  const navigate = useNavigate();
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const active = pinned || hover;

  const { pos } = useMemo(() => layout(skills), [skills]);
  const edges = useMemo(() => {
    const out = [];
    skills.forEach((s) => (s.prerequisites || []).forEach((pr) => {
      const a = pos.get(pr._id); const b = pos.get(s.skillId);
      if (!a || !b) return;
      const from = skills.find((x) => x.skillId === pr._id);
      out.push({ id: `${pr._id}-${s.skillId}`, from: pr._id, to: s.skillId, a, b, lit: !!(from?.attempts && s.attempts) });
    }));
    return out;
  }, [skills, pos]);

  const onMove = (e) => {
    const el = wrap.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const activeSkill = skills.find((s) => s.skillId === active);
  const ap = activeSkill ? pos.get(activeSkill.skillId) : null;
  const goPractice = (s) => (onGo ? onGo(s) : navigate(`/problems?skill=${encodeURIComponent(s.name)}`));

  return (
    <div ref={wrap} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onClick={() => setPinned(null)} className="relative w-full select-none" style={{ '--px': 0, '--py': 0, aspectRatio: aspect || `${W} / ${H}` }}>
      {/* deep layer — barely moves */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -8px))', transition: 'transform .4s ease-out' }} aria-hidden>
        {BG_STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e4e4e7" className="twinkle" style={{ '--o': s.o, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />
        ))}
      </svg>

      {/* skill layer */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" style={{ transform: 'translate(calc(var(--px) * 6px), calc(var(--py) * 5px))', transition: 'transform .4s ease-out' }} role="group" aria-label="Skill constellation">
        <defs>
          <radialGradient id="halo"><stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.5" /><stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" /></radialGradient>
          <linearGradient id="lit" x1="0" x2="1"><stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" /><stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.55" /></linearGradient>
        </defs>

        {edges.map((e, i) => {
          const mx = (e.a.x + e.b.x) / 2;
          const hot = active && (active === e.from || active === e.to);
          return (
            <motion.path key={e.id} d={`M${e.a.x},${e.a.y} C${mx},${e.a.y} ${mx},${e.b.y} ${e.b.x},${e.b.y}`} fill="none"
              stroke={hot ? '#6ee7b7' : e.lit ? 'url(#lit)' : 'rgba(255,255,255,0.12)'} strokeWidth={hot ? 1.6 : e.lit ? 1.2 : 0.9} strokeDasharray={e.lit || hot ? undefined : '2 5'}
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1, delay: 0.25 + i * 0.05, ease: 'easeOut' }} />
          );
        })}

        {skills.map((s) => {
          const q = pos.get(s.skillId); if (!q) return null;
          const p = s.currentP ?? s.masteryP;
          const touched = s.attempts > 0;
          const locked = !s.isUnlocked && !touched;
          const core = locked ? 4 : touched ? 5 + p * 7 : 4.5;
          const col = starColor(p, s.attempts);
          const isActive = active === s.skillId;
          return (
            <g key={s.skillId} transform={`translate(${q.x} ${q.y})`}>
            <motion.g initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + q.depth * 0.12, type: 'spring', stiffness: 160, damping: 16 }} style={{ transformOrigin: '0px 0px' }}
              className="cursor-pointer outline-none" tabIndex={0} role="button" aria-label={`${s.name}, ${Math.round(p * 100)} percent mastery`}
              onMouseEnter={() => setHover(s.skillId)} onFocus={() => setHover(s.skillId)} onBlur={() => setHover(null)}
              onClick={(ev) => { ev.stopPropagation(); setPinned(pinned === s.skillId ? null : s.skillId); }}
              onKeyDown={(ev) => { if (ev.key === 'Enter') goPractice(s); }}>
              <circle r={44} fill="transparent" />
              {touched && <circle r={core * (isActive ? 4.2 : 3.2)} fill="url(#halo)" opacity={(0.25 + p * 0.75) * (isActive ? 1 : 0.85)} style={{ transition: 'all .3s' }} />}
              {s.reviewDue && (
                <circle r={core + 4} fill="none" stroke="#34d399" strokeWidth="1.4">
                  <animate attributeName="r" values={`${core + 3};${core + 17}`} dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              {s.isMastered && (
                <g stroke={col} strokeWidth="1" strokeLinecap="round" opacity="0.9">
                  <line x1={-core - 11} x2={core + 11} y1="0" y2="0" /><line y1={-core - 11} y2={core + 11} x1="0" x2="0" />
                </g>
              )}
              {locked
                ? <circle r={core} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 3" />
                : <circle r={isActive ? core + 1.5 : core} fill={col} style={{ transition: 'r .2s' }} />}
              <text y={core + 22} textAnchor="middle" className="select-none" fontSize="12" fontFamily="var(--font-mono)" letterSpacing="0.04em" fontWeight={isActive ? 600 : 500}
                fill={isActive ? '#ffffff' : locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.72)'} style={{ transition: 'fill .2s', paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 4, strokeLinejoin: 'round' }}>
                {s.name}{touched ? <tspan fill={col} dx="6" fontFamily="var(--font-mono)" fontSize="12" fontWeight="500">{Math.round(p * 100)}</tspan> : null}
              </text>
            </motion.g>
            </g>
          );
        })}
      </svg>

      {/* tooltip */}
      <AnimatePresence>
        {activeSkill && ap && (
          <motion.div key={activeSkill.skillId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
            className="absolute z-20" style={{ left: `${(ap.x / W) * 100}%`, top: `${(ap.y / H) * 100}%`, transform: `translate(${ap.x > W * 0.68 ? 'calc(-100% - 28px)' : '28px'}, ${ap.y > H * 0.55 ? '-88%' : '-14%'})` }}
            onMouseEnter={() => setHover(activeSkill.skillId)}>
            <Tip skill={activeSkill} p={activeSkill.currentP ?? activeSkill.masteryP} onGo={() => goPractice(activeSkill)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
