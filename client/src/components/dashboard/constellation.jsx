import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

/**
 * The Constellation — your knowledge as a night sky.
 *
 * Every skill is a star. Core brightness and the halo follow the Bayesian mastery estimate, the thin ring around it
 * is a progress arc (rose → amber → emerald as mastery grows), lines are prerequisites and a slow pulse means the
 * forgetting curve says it is time to review. The composition is hand-placed for the standard curriculum and falls
 * back to a layered auto-layout for any other skill set.
 */

const W = 1200;
const H = 540;
const EASE = [0.22, 1, 0.36, 1];

/** Hand-composed positions (viewBox 1200×540) — a single flowing arc from fundamentals to advanced topics. */
const COMPOSED = {
  Arrays: [120, 250], Strings: [150, 430],
  Hashing: [355, 105], Sorting: [385, 235], Recursion: [360, 350], 'Linked Lists': [340, 470],
  Searching: [620, 150], 'Dynamic Programming': [640, 320], 'Stacks & Queues': [640, 465],
  Trees: [880, 400], Greedy: [900, 205], 'Greedy Algorithms': [900, 205], Graphs: [1085, 305]
};

const hash = (str, salt = 0) => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
};

/** Semantic colour for a mastery value — used by the ring, the profile ledger and the workspace bar. */
export const starColor = (p, attempts) => {
  if (!attempts) return '#71717a';
  if (p >= 0.85) return '#ecfdf5';
  if (p >= 0.6) return '#34d399';
  if (p >= 0.35) return '#fbbf24';
  return '#fb7185';
};

function autoLayout(skills) {
  const byId = new Map(skills.map((s) => [s.skillId, s]));
  const depth = new Map();
  const dfs = (s) => {
    if (depth.has(s.skillId)) return depth.get(s.skillId);
    depth.set(s.skillId, 0);
    const d = (s.prerequisites || []).reduce((m, p) => (byId.has(p._id) ? Math.max(m, dfs(byId.get(p._id)) + 1) : m), 0);
    depth.set(s.skillId, d);
    return d;
  };
  skills.forEach(dfs);
  const cols = Math.max(...depth.values(), 0) + 1;
  const groups = Array.from({ length: cols }, () => []);
  [...skills].sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((s) => groups[depth.get(s.skillId)].push(s));
  const pos = new Map();
  groups.forEach((g, c) => g.forEach((s, i) => {
    const x = cols === 1 ? W / 2 : 120 + (c * (W - 240)) / (cols - 1);
    pos.set(s.skillId, { x, y: (H - 140) * ((i + 1) / (g.length + 1)) + 70 });
  }));
  return pos;
}

function layoutFor(skills) {
  const composed = skills.every((s) => COMPOSED[s.name]);
  if (composed) return new Map(skills.map((s) => [s.skillId, { x: COMPOSED[s.name][0], y: COMPOSED[s.name][1] }]));
  return autoLayout(skills);
}

const BG_STARS = Array.from({ length: 130 }, (_, i) => ({
  x: hash('x' + i) * W, y: hash('y' + i) * H, r: 0.4 + hash('r' + i) * 1.2,
  o: 0.12 + hash('o' + i) * 0.4, d: hash('d' + i) * 8, t: 4 + hash('t' + i) * 6
}));

const ago = (d) => (d == null ? '—' : d <= 0 ? 'due now' : d < 1.5 ? 'tomorrow' : `in ${Math.round(d)} days`);

function Tip({ skill, p, onGo }) {
  const locked = !skill.isUnlocked && !skill.attempts;
  const col = starColor(p, skill.attempts);
  const rows = [];
  if (locked) {
    rows.push(['Unlocks after', (skill.prerequisites || []).map((x) => x.name).join(', ') || '—']);
  } else {
    rows.push(['Attempts', skill.attempts]);
    if (skill.attempts > 0 && skill.trend) rows.push(['Trend', skill.trend === 'up' ? 'Rising' : skill.trend === 'down' ? 'Slipping' : 'Steady']);
    if (skill.cohortDelta != null && skill.attempts > 0) rows.push(['vs your peers', `${skill.cohortDelta >= 0 ? '+' : ''}${Math.round(skill.cohortDelta * 100)} pts`]);
    if (skill.reviewDue) rows.push(['Review', 'due now']);
    else if (skill.reviewInDays != null && skill.attempts > 0) rows.push(['Next review', ago(skill.reviewInDays)]);
    if (skill.predictedAttemptsToMastery > 0 && p < 0.85) rows.push(['To mastery', `~${skill.predictedAttemptsToMastery} solves`]);
  }
  return (
    <div className="w-[264px] border border-white/[0.12] bg-[#0a0a0a]/95 shadow-[0_28px_70px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="font-display text-[19px] font-semibold leading-tight tracking-tight text-zinc-50">{skill.name}</div>
          <div className="tag mt-1.5" style={{ color: locked ? '#71717a' : col }}>
            {locked ? 'Locked' : p >= 0.85 ? 'Mastered' : skill.reviewDue ? 'Fading — review soon' : skill.attempts ? 'Growing' : 'Ready'}
          </div>
        </div>
        <div className="font-display text-[34px] font-light leading-none tnum text-zinc-50">{Math.round(p * 100)}<span className="text-[14px] text-zinc-500">%</span></div>
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/[0.07] px-5 py-3.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 text-[12.5px]"><dt className="tag !tracking-[0.16em]">{k}</dt><dd className="text-right text-zinc-200">{v}</dd></div>
        ))}
      </dl>
      {!locked && (
        <button onClick={onGo} className="group flex w-full items-center justify-between border-t border-white/[0.07] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-300 hover:bg-white hover:text-black">
          <span className="whitespace-nowrap">Practise</span>
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      )}
    </div>
  );
}

export function Constellation({ skills = [], onGo = null, aspect = null }) {
  const navigate = useNavigate();
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const closeTimer = useRef(null);
  const active = pinned || hover;

  const pos = useMemo(() => layoutFor(skills), [skills]);
  const byId = useMemo(() => new Map(skills.map((s) => [s.skillId, s])), [skills]);

  // prerequisite edges + neighbour lookup (for focus highlighting)
  const { edges, neighbours } = useMemo(() => {
    const es = []; const nb = new Map(skills.map((s) => [s.skillId, new Set()]));
    skills.forEach((s) => (s.prerequisites || []).forEach((pr) => {
      const a = pos.get(pr._id); const b = pos.get(s.skillId);
      if (!a || !b) return;
      const from = byId.get(pr._id);
      es.push({ id: `${pr._id}-${s.skillId}`, from: pr._id, to: s.skillId, a, b, lit: !!(from?.attempts && s.attempts), delay: hash(pr._id + s.skillId) });
      nb.get(pr._id)?.add(s.skillId); nb.get(s.skillId)?.add(pr._id);
    }));
    return { edges: es, neighbours: nb };
  }, [skills, pos, byId]);

  // smooth parallax: the pointer sets a target, a rAF loop eases toward it (no CSS transition, no re-render)
  useEffect(() => {
    const el = wrap.current; if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = { x: 0, y: 0 }; const c = { x: 0, y: 0 }; let raf;
    const move = (e) => { const r = el.getBoundingClientRect(); t.x = (e.clientX - r.left) / r.width - 0.5; t.y = (e.clientY - r.top) / r.height - 0.5; };
    const leave = () => { t.x = 0; t.y = 0; };
    const tick = () => {
      c.x += (t.x - c.x) * 0.06; c.y += (t.y - c.y) * 0.06;
      el.style.setProperty('--px', c.x.toFixed(4)); el.style.setProperty('--py', c.y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  const enter = (id) => { clearTimeout(closeTimer.current); setHover(id); };
  const leave = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setHover(null), 140); };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { setPinned(null); setHover(null); } };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const activeSkill = active ? byId.get(active) : null;
  const ap = activeSkill ? pos.get(activeSkill.skillId) : null;
  const focusSet = active ? new Set([active, ...(neighbours.get(active) || [])]) : null;
  const goPractice = (s) => (onGo ? onGo(s) : navigate(`/problems?skill=${encodeURIComponent(s.name)}`));

  return (
    <div>
    <div ref={wrap} onClick={() => setPinned(null)} className="relative w-full select-none" style={{ '--px': 0, '--py': 0, aspectRatio: aspect || `${W} / ${H}` }}>
      {/* deep layer */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" style={{ transform: 'translate3d(calc(var(--px) * -14px), calc(var(--py) * -10px), 0)', willChange: 'transform' }} aria-hidden>
        {BG_STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e4e4e7" className="twinkle" style={{ '--o': s.o, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />)}
      </svg>

      {/* skill layer */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" style={{ transform: 'translate3d(calc(var(--px) * 7px), calc(var(--py) * 5px), 0)', willChange: 'transform' }} role="group" aria-label="Skill constellation">
        <defs>
          <radialGradient id="cs-halo"><stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.55" /><stop offset="55%" stopColor="#34d399" stopOpacity="0.12" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></radialGradient>
          <linearGradient id="cs-lit" x1="0" x2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.55" /><stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.55" /></linearGradient>
          <filter id="cs-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
        </defs>

        {/* edges */}
        {edges.map((e, i) => {
          const mx = (e.a.x + e.b.x) / 2;
          const d = `M${e.a.x},${e.a.y} C${mx},${e.a.y} ${mx},${e.b.y} ${e.b.x},${e.b.y}`;
          const hot = active && (active === e.from || active === e.to);
          const dim = active && !hot;
          return (
            <g key={e.id} style={{ opacity: dim ? 0.25 : 1, transition: 'opacity .45s cubic-bezier(.22,1,.36,1)' }}>
              <motion.path d={d} fill="none" strokeLinecap="round"
                stroke={hot ? '#6ee7b7' : e.lit ? 'url(#cs-lit)' : 'rgba(255,255,255,0.14)'} strokeWidth={hot ? 1.8 : e.lit ? 1.25 : 1} strokeDasharray={e.lit || hot ? undefined : '1 6'}
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.4, delay: 0.2 + i * 0.05, ease: EASE }} style={{ transition: 'stroke .4s, stroke-width .4s' }} />
              {e.lit && (
                <circle r="1.7" fill="#a7f3d0" opacity="0.9">
                  <animateMotion dur={`${5 + e.delay * 4}s`} begin={`${1.6 + e.delay * 3}s`} repeatCount="indefinite" path={d} keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1" />
                </circle>
              )}
            </g>
          );
        })}

        {/* stars */}
        {skills.map((s, idx) => {
          const q = pos.get(s.skillId); if (!q) return null;
          const p = s.currentP ?? s.masteryP;
          const touched = s.attempts > 0;
          const locked = !s.isUnlocked && !touched;
          const isActive = active === s.skillId;
          const dim = focusSet && !focusSet.has(s.skillId);
          const core = locked ? 3.2 : touched ? 3.6 + p * 5.4 : 3.6;
          const R = core + 10;
          const C = 2 * Math.PI * R;
          const arc = starColor(p, s.attempts);
          const coreCol = locked ? 'none' : touched ? `hsl(${150 + (1 - p) * 30} ${Math.round(14 + p * 62)}% ${Math.round(66 + p * 30)}%)` : '#a1a1aa';
          return (
            <g key={s.skillId} transform={`translate(${q.x} ${q.y})`} style={{ opacity: dim ? 0.3 : 1, transition: 'opacity .45s cubic-bezier(.22,1,.36,1)' }}>
              <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + idx * 0.07, duration: 0.9, ease: EASE }} style={{ transformOrigin: '0px 0px' }}>
                <g className="star-float" style={{ animationDelay: `${hash(s.name, 3) * -6}s`, animationDuration: `${6 + hash(s.name, 4) * 4}s` }}>
                  <g className="cursor-pointer outline-none" tabIndex={0} role="button" aria-label={`${s.name}, ${Math.round(p * 100)} percent mastery`}
                    onPointerEnter={() => enter(s.skillId)} onPointerLeave={leave} onFocus={() => enter(s.skillId)} onBlur={leave}
                    onClick={(ev) => { ev.stopPropagation(); setPinned(pinned === s.skillId ? null : s.skillId); }} onKeyDown={(ev) => { if (ev.key === 'Enter') goPractice(s); }}>
                    <circle r={46} fill="transparent" />

                    {/* halo */}
                    {touched && <motion.circle r={core * 4.2} fill="url(#cs-halo)" animate={{ opacity: (0.25 + p * 0.75) * (isActive ? 1 : 0.8), scale: isActive ? 1.25 : 1 }} transition={{ duration: 0.5, ease: EASE }} style={{ transformOrigin: '0px 0px' }} />}

                    {/* review pulse */}
                    {s.reviewDue && (
                      <circle r={R} fill="none" stroke="#34d399" strokeWidth="1">
                        <animate attributeName="r" values={`${R};${R + 20}`} dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".2 .6 .3 1" />
                        <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* progress ring */}
                    {!locked && (
                      <g style={{ transform: 'rotate(-90deg)' }}>
                        <circle r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.4" />
                        {touched && (
                          <motion.circle r={R} fill="none" stroke={arc} strokeWidth={isActive ? 2.2 : 1.6} strokeLinecap="round" strokeDasharray={C}
                            initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.max(0.02, p)) }} transition={{ duration: 1.5, delay: 0.9 + idx * 0.07, ease: EASE }} style={{ transition: 'stroke-width .3s' }} />
                        )}
                      </g>
                    )}

                    {/* mastered rays */}
                    {p >= 0.85 && touched && (
                      <g stroke="#ecfdf5" strokeWidth="0.9" strokeLinecap="round" opacity="0.75">
                        <line x1={-R - 9} x2={-R - 2} y1="0" y2="0" /><line x1={R + 2} x2={R + 9} y1="0" y2="0" /><line y1={-R - 9} y2={-R - 2} x1="0" x2="0" /><line y1={R + 2} y2={R + 9} x1="0" x2="0" />
                      </g>
                    )}

                    {/* core */}
                    {locked
                      ? <circle r={core} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeDasharray="1.5 3" />
                      : (
                        <>
                          {touched && <circle r={core * 1.5} fill={coreCol} opacity="0.5" filter="url(#cs-soft)" />}
                          <motion.circle r={core} fill={coreCol} animate={{ scale: isActive ? 1.28 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ transformOrigin: '0px 0px' }} />
                        </>
                      )}

                    {/* label */}
                    <text y={R + 19} textAnchor="middle" fontSize="12.5" fontFamily="var(--font-sans)" fontWeight={isActive ? 600 : 500}
                      fill={isActive ? '#ffffff' : locked ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.78)'} style={{ transition: 'fill .3s', paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 4, strokeLinejoin: 'round' }}>
                      {s.name}
                    </text>
                    {touched && <text y={R + 34} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" letterSpacing="0.08em" fill={arc} opacity="0.9" style={{ paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 3 }}>{Math.round(p * 100)}%</text>}
                  </g>
                </g>
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* tooltip — placed beside the star on whichever side has room, never on top of it */}
      <AnimatePresence>
        {activeSkill && ap && (() => {
          const right = ap.x < W * 0.62;
          const below = ap.y < H * 0.42;
          return (
            <div className="absolute z-20" style={{ left: `${(ap.x / W) * 100}%`, top: `${(ap.y / H) * 100}%`, transform: `translate(${right ? '56px' : 'calc(-100% - 56px)'}, ${below ? '-28%' : '-72%'})` }}
              onClick={(e) => e.stopPropagation()} onPointerEnter={() => enter(activeSkill.skillId)} onPointerLeave={leave}>
              <motion.div key={activeSkill.skillId} initial={{ opacity: 0, x: right ? -10 : 10, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, ease: EASE }}>
                <Tip skill={activeSkill} p={activeSkill.currentP ?? activeSkill.masteryP} onGo={() => goPractice(activeSkill)} />
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
      {/* legend */}
      <div className="mt-3 hidden items-center gap-6 md:flex">
        {[['bg-white', 'core brightness = how well you know it'], ['ring border border-[#34d399]', 'ring = mastery progress'], ['pulse', 'pulse = due for review']].map(([k, l]) => (
          <span key={l} className="tag flex items-center gap-2 !tracking-[0.14em] !text-zinc-600">
            {k === 'pulse' ? <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399]/60" /><span className="relative h-2 w-2 rounded-full border border-[#34d399]" /></span>
              : k.startsWith('ring') ? <span className="h-2.5 w-2.5 rounded-full border border-[#34d399]" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
