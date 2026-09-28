import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

/**
 * The Constellation — your knowledge as a star chart.
 *
 * Every skill is a star. Brightness, the diffraction spikes and the halo follow the Bayesian mastery estimate; the
 * arc around it is progress (rose → amber → emerald as mastery grows); lines are prerequisites and a slow pulse means
 * the forgetting curve says it is time to review. Hovering a star sends a comet down each connected path, one line at
 * a time, and the stars it reaches light up as it arrives. The composition is hand-placed for the standard curriculum
 * and falls back to a layered auto-layout for any other skill set.
 */

const W = 1200;
const H = 540;
const EASE = [0.22, 1, 0.36, 1];
const TRAVEL = [0.45, 0, 0.25, 1];
const TRACE_SECONDS = 1.35;
const TRACE_STAGGER = 0.11;

/** Hand-composed positions (viewBox 1200×540) — a single flowing arc from fundamentals to advanced topics. */
const COMPOSED = {
  Arrays: [130, 250], Strings: [165, 435],
  Hashing: [360, 110], Sorting: [395, 240], Recursion: [372, 358], 'Linked Lists': [352, 470],
  Searching: [635, 150], 'Dynamic Programming': [650, 325], 'Stacks & Queues': [650, 462],
  Trees: [890, 405], Greedy: [905, 205], 'Greedy Algorithms': [905, 205], Graphs: [1078, 300]
};

const hash = (str, salt = 0) => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
};
const gauss = (k) => { let s = 0; for (let i = 0; i < 4; i++) s += hash(k, i + 11); return (s - 2) / 0.58; };

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
    const x = cols === 1 ? W / 2 : 130 + (c * (W - 260)) / (cols - 1);
    pos.set(s.skillId, { x, y: (H - 140) * ((i + 1) / (g.length + 1)) + 70 });
  }));
  return pos;
}

function layoutFor(skills) {
  const composed = skills.every((s) => COMPOSED[s.name]);
  if (composed) return new Map(skills.map((s) => [s.skillId, { x: COMPOSED[s.name][0], y: COMPOSED[s.name][1] }]));
  return autoLayout(skills);
}

// the faint stars that make up the backdrop — most are dust along a soft diagonal band, a few are bright
const DUST = Array.from({ length: 300 }, (_, i) => {
  const x = hash('dx' + i) * W;
  const y = H * (0.9 - 0.62 * (x / W)) + gauss('dy' + i) * 62;
  return { x, y, r: 0.3 + hash('dr' + i) * 0.7, o: 0.1 + hash('do' + i) * 0.34 };
}).filter((s) => s.y > 6 && s.y < H - 6);
const BRIGHT = Array.from({ length: 34 }, (_, i) => ({
  x: hash('bx' + i) * W, y: hash('by' + i) * H, r: 0.7 + hash('br' + i) * 1.1,
  o: 0.25 + hash('bo' + i) * 0.5, d: hash('bd' + i) * 8, t: 4 + hash('bt' + i) * 6
}));

const ago = (d) => (d == null ? '—' : d <= 0 ? 'due now' : d < 1.5 ? 'tomorrow' : `in ${Math.round(d)} days`);
const coreOf = (s, p) => (!s.isUnlocked && !s.attempts ? 3.2 : s.attempts > 0 ? 4 + p * 5.6 : 4.2);

/** A smooth horizontal-tangent curve between two stars, starting and ending on their rings. */
function curve(a, ra, b, rb) {
  const sx = Math.sign(b.x - a.x) || 1;
  const x1 = a.x + sx * ra; const x2 = b.x - sx * rb;
  const mx = (x1 + x2) / 2;
  return `M${x1.toFixed(1)},${a.y.toFixed(1)} C${mx.toFixed(1)},${a.y.toFixed(1)} ${mx.toFixed(1)},${b.y.toFixed(1)} ${x2.toFixed(1)},${b.y.toFixed(1)}`;
}

/** A comet that travels a path, leaving a glowing line behind it. Driven by one animation so line and head never drift apart. */
function Trace({ d, color, delay }) {
  const path = useRef(null); const head = useRef(null); const glow = useRef(null);
  useEffect(() => {
    const p = path.current; if (!p) return undefined;
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len}`;
    const ctrl = animate(0, 1, {
      duration: TRACE_SECONDS, delay, ease: TRAVEL,
      onUpdate: (t) => {
        p.style.strokeDashoffset = `${len * (1 - t)}`;
        const pt = p.getPointAtLength(len * t);
        const o = t < 0.015 ? 0 : t > 0.94 ? (1 - t) / 0.06 : 1;
        [head.current, glow.current].forEach((el, i) => { if (!el) return; el.setAttribute('cx', pt.x); el.setAttribute('cy', pt.y); el.style.opacity = i ? o * 0.55 : o; });
      }
    });
    return () => ctrl.stop();
  }, [d, delay]);
  return (
    <g>
      <path ref={path} d={d} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" style={{ strokeDasharray: 9999, strokeDashoffset: 9999, filter: `drop-shadow(0 0 3px ${color})` }} />
      <circle ref={glow} r="9" fill={color} filter="url(#cs-blur-s)" style={{ opacity: 0 }} />
      <circle ref={head} r="2.3" fill="#ffffff" style={{ opacity: 0 }} />
    </g>
  );
}

function Tip({ skill, p, onGo, requires, leads }) {
  const locked = !skill.isUnlocked && !skill.attempts;
  const started = skill.attempts > 0;
  const col = starColor(p, skill.attempts);
  const rows = [];
  if (locked) {
    rows.push(['Unlocks after', requires.join(', ') || '—']);
  } else {
    rows.push(['Attempts', skill.attempts]);
    if (started && skill.trend) rows.push(['Trend', skill.trend === 'up' ? 'Rising' : skill.trend === 'down' ? 'Slipping' : 'Steady']);
    if (skill.cohortDelta != null && started) rows.push(['vs your peers', `${skill.cohortDelta >= 0 ? '+' : ''}${Math.round(skill.cohortDelta * 100)} pts`]);
    if (skill.reviewDue) rows.push(['Review', 'due now']);
    else if (skill.reviewInDays != null && started) rows.push(['Next review', ago(skill.reviewInDays)]);
    if (skill.predictedAttemptsToMastery > 0 && p < 0.85 && started) rows.push(['To mastery', `~${skill.predictedAttemptsToMastery} solves`]);
    if (requires.length) rows.push(['Builds on', requires.join(', ')]);
  }
  if (leads.length) rows.push(['Leads to', leads.join(', ')]);
  return (
    <div className="w-[272px] border border-white/[0.12] bg-[#0a0a0a]/95 shadow-[0_28px_70px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="font-display text-[19px] font-semibold leading-tight tracking-tight text-zinc-50">{skill.name}</div>
          <div className="tag mt-1.5" style={{ color: locked ? '#71717a' : col }}>
            {locked ? 'Locked' : p >= 0.85 && started ? 'Mastered' : skill.reviewDue && started ? 'Fading — review soon' : started ? 'Growing' : 'Ready to start'}
          </div>
        </div>
        <div className="font-display text-[34px] font-light leading-none tnum text-zinc-50">{started ? <>{Math.round(p * 100)}<span className="text-[14px] text-zinc-500">%</span></> : <span className="text-zinc-600">—</span>}</div>
      </div>
      <dl className="mt-4 space-y-2 border-t border-white/[0.07] px-5 py-3.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 text-[12.5px]"><dt className="tag shrink-0 !tracking-[0.16em]">{k}</dt><dd className="truncate text-right text-zinc-200">{v}</dd></div>
        ))}
      </dl>
      {!locked && (
        <button onClick={onGo} className="group flex w-full items-center justify-between border-t border-white/[0.07] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-300 hover:bg-white hover:text-black">
          <span className="whitespace-nowrap">{started ? 'Practise' : 'Start here'}</span>
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
  const [arrived, setArrived] = useState(() => new Set());
  const closeTimer = useRef(null);
  const active = pinned || hover;

  const pos = useMemo(() => layoutFor(skills), [skills]);
  const byId = useMemo(() => new Map(skills.map((s) => [s.skillId, s])), [skills]);
  const radius = useMemo(() => new Map(skills.map((s) => { const p = s.currentP ?? s.masteryP; return [s.skillId, coreOf(s, p) + 13]; })), [skills]);

  // prerequisite edges, neighbour lookup and each star's "requires / unlocks" partners
  const { edges, neighbours, requiresOf, leadsOf } = useMemo(() => {
    const es = []; const nb = new Map(skills.map((s) => [s.skillId, []]));
    const req = new Map(skills.map((s) => [s.skillId, []])); const lead = new Map(skills.map((s) => [s.skillId, []]));
    skills.forEach((s) => (s.prerequisites || []).forEach((pr) => {
      const a = pos.get(pr._id); const b = pos.get(s.skillId);
      if (!a || !b) return;
      const from = byId.get(pr._id);
      es.push({ id: `${pr._id}-${s.skillId}`, from: pr._id, to: s.skillId, d: curve(a, radius.get(pr._id) || 16, b, radius.get(s.skillId) || 16), lit: !!(from?.attempts && s.attempts), delay: hash(pr._id + s.skillId) });
      nb.get(pr._id)?.push(s.skillId); nb.get(s.skillId)?.push(pr._id);
      req.get(s.skillId)?.push(pr.name || from?.name); lead.get(pr._id)?.push(s.name);
    }));
    return { edges: es, neighbours: nb, requiresOf: req, leadsOf: lead };
  }, [skills, pos, byId, radius]);

  // eased parallax + a spotlight that trails the pointer (rAF + CSS vars: smooth, and never re-renders React)
  useEffect(() => {
    const el = wrap.current; if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = { x: 0, y: 0, o: 0 }; const c = { x: 0, y: 0, o: 0 }; let raf;
    const move = (e) => { const r = el.getBoundingClientRect(); t.x = (e.clientX - r.left) / r.width - 0.5; t.y = (e.clientY - r.top) / r.height - 0.5; t.o = 1; };
    const leave = () => { t.x = 0; t.y = 0; t.o = 0; };
    const tick = () => {
      c.x += (t.x - c.x) * 0.055; c.y += (t.y - c.y) * 0.055; c.o += (t.o - c.o) * 0.06;
      el.style.setProperty('--px', c.x.toFixed(4)); el.style.setProperty('--py', c.y.toFixed(4));
      el.style.setProperty('--sx', `${((c.x + 0.5) * 100).toFixed(2)}%`); el.style.setProperty('--sy', `${((c.y + 0.5) * 100).toFixed(2)}%`); el.style.setProperty('--so', c.o.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  const enter = (id) => { clearTimeout(closeTimer.current); setHover(id); };
  const leave = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setHover(null), 160); };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { setPinned(null); setHover(null); } };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  // the connected stars light up one by one as the comet reaches them
  const activeEdges = useMemo(() => (active ? edges.filter((e) => e.from === active || e.to === active) : []), [active, edges]);
  useEffect(() => {
    setArrived(new Set());
    if (!active) return undefined;
    const timers = activeEdges.map((e, i) => setTimeout(() => setArrived((s) => new Set(s).add(e.from === active ? e.to : e.from)), (i * TRACE_STAGGER + TRACE_SECONDS * 0.93) * 1000));
    return () => timers.forEach(clearTimeout);
  }, [active, activeEdges]);

  const activeSkill = active ? byId.get(active) : null;
  const [tip, setTip] = useState(null);
  const ap = activeSkill ? pos.get(activeSkill.skillId) : null;
  const nbSet = active ? new Set(neighbours.get(active) || []) : null;
  const relation = (id) => (!active ? null : (byId.get(id)?.prerequisites || []).some((x) => x._id === active) ? 'unlocks' : 'requires');
  const goPractice = (s) => (onGo ? onGo(s) : navigate(`/problems?skill=${encodeURIComponent(s.name)}`));

  // pick the side of the star where the card covers the fewest stars — connected ones count most
  const placeTip = () => {
    const box = wrap.current?.getBoundingClientRect(); if (!box || !ap) return null;
    const k = box.width / W; const cw = 272; const ch = 292; const gap = 58;
    const ax = ap.x * k; const ay = ap.y * k;
    const cands = [
      { x: ax + gap, y: ay - ch * 0.4, dx: -12, dy: 0 }, { x: ax - gap - cw, y: ay - ch * 0.4, dx: 12, dy: 0 },
      { x: ax - cw / 2, y: ay - gap - ch, dx: 0, dy: 12 }, { x: ax - cw / 2, y: ay + gap, dx: 0, dy: -12 }
    ];
    let best = null;
    cands.forEach((c) => {
      const x = Math.min(Math.max(c.x, 6), Math.max(6, box.width - cw - 6)); const y = Math.min(Math.max(c.y, -30), Math.max(0, box.height - ch + 50));
      let score = (Math.abs(x - c.x) + Math.abs(y - c.y)) * 0.05;
      skills.forEach((s) => {
        const q = pos.get(s.skillId); if (!q) return;
        const sx = q.x * k; const sy = q.y * k;
        const nx = Math.min(Math.max(sx, x), x + cw); const ny = Math.min(Math.max(sy, y), y + ch);
        if ((sx - nx) ** 2 + (sy - ny) ** 2 < 40 * 40) score += s.skillId === active ? 500 : nbSet?.has(s.skillId) ? 12 : 3;
      });
      if (!best || score < best.score) best = { ...c, x, y, score };
    });
    return best;
  };

  useEffect(() => { setTip(active ? placeTip() : null); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // the glow of the nebula sits where you are strongest
  const nebula = useMemo(() => {
    let sx = 0; let sy = 0; let sw = 0;
    skills.forEach((s) => { const q = pos.get(s.skillId); const p = s.currentP ?? s.masteryP; if (q && s.attempts > 0) { sx += q.x * p; sy += q.y * p; sw += p; } });
    return sw ? { x: (sx / sw / W) * 100, y: (sy / sw / H) * 100 } : { x: 25, y: 50 };
  }, [skills, pos]);

  return (
    <div>
    <div ref={wrap} onClick={() => setPinned(null)} className="relative w-full select-none" style={{ '--px': 0, '--py': 0, '--sx': '50%', '--sy': '50%', '--so': 0, aspectRatio: aspect || `${W} / ${H}` }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 110%, rgba(255,255,255,0.028), transparent 60%)' }} />
      <div className="pointer-events-none absolute h-[70%] w-[55%] rounded-full opacity-100 transition-[left,top] duration-[1800ms] ease-out" style={{ left: `${nebula.x}%`, top: `${nebula.y}%`, transform: 'translate(-50%,-50%)', background: 'radial-gradient(closest-side, rgba(52,211,153,0.085), rgba(52,211,153,0.03) 55%, transparent)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ opacity: 'var(--so)', background: 'radial-gradient(280px circle at var(--sx) var(--sy), rgba(255,255,255,0.05), transparent 70%)' }} />
      <span className="shooting pointer-events-none absolute left-[7%] top-[9%] h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-white/90" />

      {/* deep layer: dust, bright stars, graticule */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" style={{ transform: 'translate3d(calc(var(--px) * -16px), calc(var(--py) * -11px), 0) scale(1.04)', willChange: 'transform' }} aria-hidden>
        <g fill="none" stroke="#fff" strokeOpacity="0.045" strokeWidth="1">
          {[560, 780, 1000, 1220, 1440].map((r) => <circle key={r} cx={W * 0.4} cy={H * 2.05} r={r} />)}
        </g>
        <g fill="#e4e4e7">{DUST.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />)}</g>
        {BRIGHT.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4f4f5" className="twinkle" style={{ '--o': s.o, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />)}
      </svg>
      </div>

      {/* skill layer */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" style={{ transform: 'translate3d(calc(var(--px) * 8px), calc(var(--py) * 6px), 0)', willChange: 'transform' }} role="group" aria-label="Skill constellation">
        <defs>
          <linearGradient id="cs-lit" x1="0" x2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.6" /><stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.6" /></linearGradient>
          <linearGradient id="cs-spike" x1="0" x2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="50%" stopColor="#fff" stopOpacity="0.9" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <filter id="cs-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9" /></filter>
          <filter id="cs-blur-s" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.5" /></filter>
        </defs>

        {/* resting edges */}
        {edges.map((e, i) => {
          const involved = active && (active === e.from || active === e.to);
          return (
            <g key={e.id} style={{ opacity: active ? (involved ? 0.55 : 0.1) : 1, transition: 'opacity .6s cubic-bezier(.22,1,.36,1)' }}>
              {e.lit
                ? <motion.path d={e.d} fill="none" stroke="url(#cs-lit)" strokeWidth="1.3" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, delay: 0.25 + i * 0.05, ease: EASE }} />
                : <motion.path d={e.d} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="1 6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 + i * 0.05 }} />}
              {e.lit && (
                <circle r="1.7" fill="#a7f3d0" opacity="0.85">
                  <animateMotion dur={`${6 + e.delay * 5}s`} begin={`${1.8 + e.delay * 3}s`} repeatCount="indefinite" path={e.d} keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1" />
                </circle>
              )}
            </g>
          );
        })}

        {/* the comets: they leave the hovered star and travel each connected path */}
        <AnimatePresence>
          {activeEdges.map((e, i) => {
            const fromActive = e.from === active;
            const other = pos.get(fromActive ? e.to : e.from); const me = pos.get(active);
            const d = fromActive ? e.d : curve(me, radius.get(active) || 16, other, radius.get(e.from) || 16);
            return (
              <motion.g key={`${active}:${e.id}`} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.55 } }}>
                <Trace d={d} color={fromActive ? '#6ee7b7' : '#bae6fd'} delay={0.08 + i * TRACE_STAGGER} />
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* stars */}
        {skills.map((s, idx) => {
          const q = pos.get(s.skillId); if (!q) return null;
          const p = s.currentP ?? s.masteryP;
          const touched = s.attempts > 0;
          const locked = !s.isUnlocked && !touched;
          const isActive = active === s.skillId;
          const isNb = !!nbSet?.has(s.skillId);
          const lit = isActive || (isNb && arrived.has(s.skillId));
          const dim = active && !lit;
          const core = coreOf(s, p);
          const R = core + 13;
          const C = 2 * Math.PI * R;
          const arc = starColor(p, s.attempts);
          const coreCol = touched ? `hsl(${150 + (1 - p) * 30} ${Math.round(14 + p * 62)}% ${Math.round(68 + p * 28)}%)` : '#d4d4d8';
          const spike = 16 + p * 26;
          const rel = isNb ? relation(s.skillId) : null;
          return (
            <g key={s.skillId} transform={`translate(${q.x} ${q.y})`} style={{ opacity: dim ? 0.2 : 1, transition: 'opacity .7s cubic-bezier(.22,1,.36,1)' }}>
              <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + idx * 0.07, duration: 0.9, ease: EASE }} style={{ transformOrigin: '0px 0px' }}>
                <g className="star-float" style={{ animationDelay: `${hash(s.name, 3) * -6}s`, animationDuration: `${6 + hash(s.name, 4) * 4}s` }}>
                  <g className="cursor-pointer outline-none" tabIndex={0} role="button" aria-label={`${s.name}, ${touched ? `${Math.round(p * 100)} percent mastery` : locked ? 'locked' : 'not started'}`}
                    onPointerEnter={() => enter(s.skillId)} onPointerLeave={leave} onFocus={() => enter(s.skillId)} onBlur={leave}
                    onClick={(ev) => { ev.stopPropagation(); setPinned(pinned === s.skillId ? null : s.skillId); }} onKeyDown={(ev) => { if (ev.key === 'Enter') goPractice(s); }}>
                    <circle r={48} fill="transparent" />

                    {/* hover ripple leaves the star, and a smaller one greets the comet when it arrives */}
                    {isActive && <motion.circle key={`r-${active}`} fill="none" stroke={arc === '#71717a' ? '#a7f3d0' : arc} strokeWidth="1" initial={{ r: R, opacity: 0.7 }} animate={{ r: R + 34, opacity: 0 }} transition={{ duration: 1.6, ease: 'easeOut' }} />}
                    {isNb && <motion.circle key={`a-${active}`} fill="none" stroke="#a7f3d0" strokeWidth="1" initial={{ r: R, opacity: 0 }} animate={{ opacity: [0, 0.8, 0], r: [R, R + 2, R + 24] }} transition={{ delay: 0.08 + Math.max(0, activeEdges.findIndex((e) => e.from === s.skillId || e.to === s.skillId)) * TRACE_STAGGER + TRACE_SECONDS * 0.93, duration: 1.1, times: [0, 0.03, 1], ease: 'easeOut' }} />}

                    {/* halo */}
                    {touched && <motion.circle r={core * 3.4} fill={arc} filter="url(#cs-blur)" animate={{ opacity: (0.1 + p * 0.3) * (lit ? 1.7 : 1), scale: lit ? 1.2 : 1 }} transition={{ duration: 0.8, ease: EASE }} style={{ transformOrigin: '0px 0px' }} />}

                    {/* diffraction spikes */}
                    {touched && (
                      <g className="star-breathe" style={{ animationDelay: `${hash(s.name, 5) * -6}s`, animationDuration: `${5 + hash(s.name, 6) * 3}s` }} opacity={0.35 + p * 0.6}>
                        <rect x={-spike} y={-0.45} width={spike * 2} height={0.9} fill="url(#cs-spike)" />
                        <rect x={-0.45} y={-spike * 0.8} width={0.9} height={spike * 1.6} fill="url(#cs-spike)" />
                      </g>
                    )}

                    {/* review pulse */}
                    {s.reviewDue && touched && (
                      <circle r={R} fill="none" stroke="#34d399" strokeWidth="1">
                        <animate attributeName="r" values={`${R};${R + 22}`} dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".2 .6 .3 1" />
                        <animate attributeName="opacity" values="0.7;0" dur="3.2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* instrument bezel + progress ring */}
                    {touched && <circle className="star-orbit" r={R + 6} fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="1" strokeDasharray="1 5.2" />}
                    {!locked && (
                      <g style={{ transform: 'rotate(-90deg)' }}>
                        <circle r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.4" />
                        {touched && (
                          <motion.circle r={R} fill="none" stroke={arc} strokeWidth={lit ? 2.4 : 1.7} strokeLinecap="round" strokeDasharray={C}
                            initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.max(0.02, p)) }} transition={{ duration: 1.6, delay: 0.9 + idx * 0.07, ease: EASE }} style={{ transition: 'stroke-width .4s' }} />
                        )}
                      </g>
                    )}

                    {/* mastered rays */}
                    {p >= 0.85 && touched && (
                      <g stroke="#ecfdf5" strokeWidth="0.9" strokeLinecap="round" opacity="0.8">
                        <line x1={-R - 11} x2={-R - 3} y1="0" y2="0" /><line x1={R + 3} x2={R + 11} y1="0" y2="0" /><line y1={-R - 11} y2={-R - 3} x1="0" x2="0" /><line y1={R + 3} y2={R + 11} x1="0" x2="0" />
                      </g>
                    )}

                    {/* core */}
                    {locked ? (
                      <>
                        <circle r={R - 2} fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.24)" strokeWidth="1" strokeDasharray="2 4" />
                        <circle r="1.8" fill="rgba(255,255,255,0.4)" />
                      </>
                    ) : (
                      <>
                        {!touched && <circle className="star-breathe" r={R + 5} fill="none" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="1 4" />}
                        {touched && <circle r={core * 1.7} fill={coreCol} opacity="0.55" filter="url(#cs-blur-s)" />}
                        <motion.circle r={core} fill={coreCol} animate={{ scale: lit ? 1.3 : 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} style={{ transformOrigin: '0px 0px' }} />
                      </>
                    )}

                    {/* label */}
                    <text y={R + 21} textAnchor="middle" fontSize="13" fontFamily="var(--font-sans)" fontWeight={lit ? 600 : 500}
                      fill={lit ? '#ffffff' : locked ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.86)'} style={{ transition: 'fill .4s', paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 4, strokeLinejoin: 'round' }}>
                      {s.name}
                    </text>
                    {touched && <text y={R + 36} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" letterSpacing="0.1em" fill={arc} style={{ paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 3 }}>{Math.round(p * 100)}%</text>}
                    {!touched && <text y={R + 36} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.18em" fill={locked ? 'rgba(255,255,255,0.28)' : '#a7f3d0'} style={{ paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 3 }}>{locked ? 'LOCKED' : 'START HERE'}</text>}
                    <motion.text y={R + 51} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" letterSpacing="0.2em" fill={rel === 'unlocks' ? '#6ee7b7' : '#bae6fd'} initial={false} animate={{ opacity: rel && lit ? 0.95 : 0 }} transition={{ duration: 0.5 }} style={{ paintOrder: 'stroke', stroke: '#0a0a0a', strokeWidth: 3 }}>
                      {rel === 'unlocks' ? 'UNLOCKED BY THIS' : 'REQUIRED FIRST'}
                    </motion.text>
                  </g>
                </g>
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* tooltip — placed wherever it hides the fewest connected stars */}
      <AnimatePresence>
        {activeSkill && ap && tip && (() => {
          return (
            <div className="absolute z-20" style={{ left: tip.x, top: tip.y }} onClick={(e) => e.stopPropagation()} onPointerEnter={() => enter(activeSkill.skillId)} onPointerLeave={leave}>
              <motion.div key={activeSkill.skillId} initial={{ opacity: 0, x: tip.dx, y: tip.dy, scale: 0.98 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.14 } }} transition={{ duration: 0.45, delay: 0.16, ease: EASE }}>
                <Tip skill={activeSkill} p={activeSkill.currentP ?? activeSkill.masteryP} onGo={() => goPractice(activeSkill)} requires={requiresOf.get(activeSkill.skillId) || []} leads={leadsOf.get(activeSkill.skillId) || []} />
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* the curriculum axis */}
      <div className="pointer-events-none absolute inset-x-[3%] bottom-1 hidden items-center gap-3 md:flex">
        <span className="tag !tracking-[0.2em] !text-zinc-600">Fundamentals</span>
        <span className="h-px flex-1 bg-gradient-to-r from-white/20 via-white/[0.07] to-white/20" />
        <span className="tag !tracking-[0.2em] !text-zinc-600">Advanced</span>
      </div>
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
