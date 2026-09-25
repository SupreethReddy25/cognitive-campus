import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, X, Hourglass, RotateCcw } from 'lucide-react';
import { Constellation, starColor } from '../components/dashboard/constellation';
import { buildSampleSky, SKY_STEPS } from '../lib/sampleSky';
import { Reveal, cn } from '../components/ui/kit';

/* ───────────────────────── nav ───────────────────────── */
function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ['rgba(12,12,16,0)', 'rgba(12,12,16,0.85)']);
  const line = useTransform(scrollY, [0, 80], ['rgba(236,230,216,0)', 'rgba(236,230,216,0.08)']);
  return (
    <motion.header style={{ backgroundColor: bg, borderBottomColor: line }} className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-6 md:px-14">
        <Link to="/" className="flex items-baseline gap-[1px] text-zinc-50"><span className="display text-[30px] italic leading-none">cogni</span><span className="text-[32px] leading-none text-[var(--ember)]">.</span></Link>
        <nav className="hidden items-center gap-9 text-[14px] text-zinc-400 md:flex">
          <a href="#model" className="transition-colors hover:text-zinc-50">How it thinks</a>
          <a href="#atlas" className="transition-colors hover:text-zinc-50">Interview atlas</a>
          <a href="#campus" className="transition-colors hover:text-zinc-50">Your campus</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2 text-[14px] text-zinc-300 transition-colors hover:text-zinc-50">Sign in</Link>
          <Link to="/register" className="rounded-full bg-[var(--ember)] px-5 py-2 text-[14px] font-semibold text-[#1a0d07] transition-[filter] hover:brightness-110">Begin</Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ───────────────────── hero + living sky ───────────────────── */
function Hero() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % SKY_STEPS.length), 2800);
    return () => clearInterval(id);
  }, []);
  const skills = useMemo(() => buildSampleSky(SKY_STEPS[step], step === 3 ? ['hashing'] : step === 4 ? ['sorting'] : []), [step]);
  return (
    <section className="relative pt-36 md:pt-44">
      <div className="mx-auto max-w-[1360px] px-6 md:px-14">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}>
          <div className="text-[14px] text-zinc-500">Adaptive practice for placement season</div>
          <h1 className="display mt-6 text-[clamp(58px,10.5vw,168px)] text-zinc-50">A platform that<br />learns <em className="text-[var(--ember)]">how you learn</em>.</h1>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.23, 1, 0.32, 1] }} className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-xl text-[20px] leading-relaxed text-zinc-400">Every problem you solve moves a star. Cogni estimates what you truly know — and what you&apos;re about to forget — then chooses your next problem so you never waste an evening.</p>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/register')} className="group flex items-center gap-4 rounded-full bg-[var(--ember)] py-3 pl-8 pr-3 text-[#1a0d07] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"><span className="text-[16px] font-semibold">Start free</span><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a0d07] text-[var(--ember)]"><ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" /></span></button>
            <Link to="/login" className="text-[15px] text-zinc-400 transition-colors hover:text-zinc-50">I have an account</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1.2 }} className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-3 text-[13px] text-zinc-600">
            <span>A sample sky — in six weeks of practice. Hover a star.</span>
            <span className="tnum">week {step * 1.5 + 1 | 0} · {Object.keys(SKY_STEPS[step]).length} of 12 skills started</span>
          </div>
          <Constellation skills={skills} onGo={() => navigate('/register')} />
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────── interactive BKT playground ───────────────────── */
const P0 = 0.1; const T = 0.15; const S = 0.1; const G = 0.25;
const observe = (p, correct) => {
  const pc = p * (1 - S) + (1 - p) * G;
  const post = correct ? (p * (1 - S)) / pc : (p * S) / (1 - pc);
  return post + (1 - post) * T;
};
const forget = (p, days) => P0 + (p - P0) * Math.exp(-days / 20);

const EXPLAIN = {
  start: 'This star starts dim: a new skill, maybe a 10% chance you know it. Try the buttons.',
  right: 'A correct answer is strong evidence — but not proof. You might have guessed (about 1 in 4 do), so the star brightens without jumping to 100%.',
  wrong: 'A miss dims the star, but less than you’d fear: even experts slip (about 1 in 10), so one wrong answer never erases what you know.',
  wait: 'A week passes. Memory fades along a forgetting curve — the pulsing ring means this skill is due for a refresher.'
};

function Playground() {
  const [hist, setHist] = useState([{ p: P0, kind: 'start' }]);
  const cur = hist[hist.length - 1];
  const push = (kind) => setHist((h) => {
    const p = h[h.length - 1].p;
    const next = kind === 'right' ? observe(p, true) : kind === 'wrong' ? observe(p, false) : forget(p, 7);
    return [...h, { p: Math.min(0.995, next), kind }].slice(-14);
  });
  const col = starColor(cur.p, 1);
  const r = 14 + cur.p * 30;
  const due = cur.kind === 'wait' && cur.p >= 0.35;
  const W = 520; const H = 150;
  const pts = hist.map((h, i) => [(i / Math.max(hist.length - 1, 1)) * (W - 20) + 10, H - 14 - h.p * (H - 28)]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  return (
    <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center">
          <svg viewBox="-150 -150 300 300" className="absolute inset-0 h-full w-full overflow-visible">
            <defs><radialGradient id="pg-halo"><stop offset="0%" stopColor={col} stopOpacity="0.55" /><stop offset="100%" stopColor={col} stopOpacity="0" /></radialGradient></defs>
            <motion.circle fill="url(#pg-halo)" initial={{ r: r * 4.4 }} animate={{ r: r * 4.4 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }} />
            {cur.p >= 0.85 && <g stroke={col} strokeWidth="1.2" strokeLinecap="round"><line x1={-r - 34} x2={r + 34} y1="0" y2="0" /><line y1={-r - 34} y2={r + 34} x1="0" x2="0" /></g>}
            {due && <circle fill="none" stroke="#ff7a4d" strokeWidth="1.5"><animate attributeName="r" values={`${r + 4};${r + 26}`} dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.9;0" dur="2s" repeatCount="indefinite" /></circle>}
            <motion.circle fill={col} initial={{ r }} animate={{ r }} transition={{ type: 'spring', stiffness: 90, damping: 12 }} />
          </svg>
          <div className="relative text-center"><div className="display text-[84px] leading-none tnum" style={{ color: cur.p > 0.5 ? '#0c0c10' : '#ece6d8' }}>{Math.round(cur.p * 100)}<span className="text-[30px] opacity-60">%</span></div></div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => push('right')} className="flex items-center gap-2 rounded-full border border-emerald-400/40 px-6 py-3 text-[15px] text-emerald-300 transition-colors hover:bg-emerald-400/10"><Check className="h-4 w-4" />I solved it</button>
          <button onClick={() => push('wrong')} className="flex items-center gap-2 rounded-full border border-rose-400/40 px-6 py-3 text-[15px] text-rose-300 transition-colors hover:bg-rose-400/10"><X className="h-4 w-4" />I got it wrong</button>
          <button onClick={() => push('wait')} className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-6 py-3 text-[15px] text-zinc-300 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]"><Hourglass className="h-4 w-4" />A week passes</button>
          {hist.length > 1 && <button onClick={() => setHist([{ p: P0, kind: 'start' }])} className="flex items-center gap-2 px-3 py-3 text-[14px] text-zinc-600 hover:text-zinc-300"><RotateCcw className="h-3.5 w-3.5" />reset</button>}
        </div>
        <motion.p key={cur.kind + hist.length} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-8 min-h-[96px] max-w-lg text-[18px] leading-relaxed text-zinc-300">{EXPLAIN[cur.kind]}</motion.p>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full max-w-[520px]" aria-label="Mastery history">
          <line x1="10" x2={W - 10} y1={H - 14 - 0.85 * (H - 28)} y2={H - 14 - 0.85 * (H - 28)} stroke="rgba(236,230,216,0.18)" strokeDasharray="3 5" />
          <text x={W - 10} y={H - 14 - 0.85 * (H - 28) - 6} textAnchor="end" fontSize="11" fill="#7a7466">mastered at 85%</text>
          <path d={path} fill="none" stroke="#ff7a4d" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 5 : 3} fill={hist[i].kind === 'wrong' ? '#f0728a' : hist[i].kind === 'wait' ? '#8fbcda' : '#94d6a8'} />)}
        </svg>
        <p className="mt-2 text-[12.5px] text-zinc-600">The real engine also learns your speed, hints used and problem difficulty — this is the core idea, running in your browser.</p>
      </div>
    </div>
  );
}

/* ───────────────────── atlas preview ───────────────────── */
const ATLAS = [
  { name: 'Google', tier: 'FAANG', reports: 7, offer: 67, ctc: '32–45', rounds: ['Online assessment', 'Technical 1', 'Technical 2', 'Googliness'] },
  { name: 'Amazon', tier: 'FAANG', reports: 6, offer: 80, ctc: '26–38', rounds: ['Online assessment', 'Technical 1', 'Bar raiser', 'Hiring manager'] },
  { name: 'Microsoft', tier: 'FAANG', reports: 5, offer: 100, ctc: '22–45', rounds: ['Coding round', 'Design & DSA', 'Culture fit'] },
  { name: 'Goldman Sachs', tier: 'Finance', reports: 3, offer: 50, ctc: '22–32', rounds: ['Online assessment', 'Technical', 'Superday'] },
  { name: 'Flipkart', tier: 'Product', reports: 4, offer: 75, ctc: '28–34', rounds: ['Machine coding', 'Problem solving', 'Hiring manager'] }
];

function Atlas() {
  const [i, setI] = useState(0);
  const c = ATLAS[i];
  return (
    <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
      <ol onMouseLeave={() => setI(0)}>
        {ATLAS.map((a, k) => (
          <li key={a.name} onMouseEnter={() => setI(k)}>
            <div className="group flex items-baseline gap-5 border-b border-[var(--line)] py-4">
              <span className="w-8 text-[13px] tnum text-zinc-700">{String(k + 1).padStart(2, '0')}</span>
              <span className={cn('display text-[clamp(34px,4.4vw,58px)] leading-none transition-all duration-300', i === k ? 'translate-x-2 text-[var(--ember)]' : 'text-zinc-200')}>{a.name}</span>
              <span className="mb-2 hidden flex-1 self-end border-b border-dotted border-zinc-700 sm:block" />
              <span className="hidden text-right text-[13px] leading-tight text-zinc-500 sm:block"><span className="tnum text-zinc-300">{a.reports}</span> reports<br />{a.ctc} LPA</span>
            </div>
          </li>
        ))}
      </ol>
      <motion.div key={c.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-fit rounded-[28px] border border-[var(--line-strong)] bg-[var(--ink-2)] p-8">
        <div className="display text-[44px] leading-none text-zinc-50">{c.name}</div>
        <div className="mt-1.5 text-[13px] text-zinc-500">{c.tier}</div>
        <div className="mt-7 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-6">
          <div><div className="display text-[44px] leading-none tnum text-zinc-50">{c.offer}<span className="text-[20px] text-zinc-500">%</span></div><div className="mt-2 text-[11.5px] text-zinc-500">offer rate</div></div>
          <div><div className="display text-[44px] leading-none tnum text-zinc-50">{c.reports}</div><div className="mt-2 text-[11.5px] text-zinc-500">reports</div></div>
          <div><div className="display text-[44px] leading-none tnum text-zinc-50">{c.rounds.length}</div><div className="mt-2 text-[11.5px] text-zinc-500">rounds</div></div>
        </div>
        <div className="mt-7 text-[12px] text-zinc-500">The gauntlet</div>
        <ol className="relative mt-3 flex items-start justify-between">
          <span className="absolute left-3 right-3 top-[7px] h-px bg-[var(--line-strong)]" />
          {c.rounds.map((r, k) => (
            <li key={r} className="relative flex w-full flex-col items-center gap-2 text-center"><span className="relative h-[15px] w-[15px] rounded-full border border-[var(--ember)] bg-[var(--ink-2)]"><span className="absolute inset-[3px] rounded-full bg-[var(--ember)]" style={{ opacity: 0.3 + (k / Math.max(1, c.rounds.length - 1)) * 0.7 }} /></span><span className="max-w-[80px] text-[10.5px] leading-tight text-zinc-500">{r}</span></li>
          ))}
        </ol>
        <p className="mt-7 text-[12.5px] leading-relaxed text-zinc-600">Sample data. Real reports carry confidence intervals, so you know how far to trust every number.</p>
      </motion.div>
    </div>
  );
}

/* ───────────────────── campus preview ───────────────────── */
const SKILLS = [['Arrays', [90, 100, 100]], ['Hashing', [40, 60, 70]], ['Trees', [30, 50, 60]], ['Graphs', [20, 45, 70]], ['Dynamic Programming', [10, 40, 65]], ['System design', [0, 15, 35]]];
function Campus() {
  return (
    <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-[clamp(24px,2.8vw,38px)] leading-[1.35] text-zinc-300">At a campus like yours, <span className="display text-[1.2em] italic text-[var(--ember)]">Graphs</span> and <span className="display text-[1.2em] italic text-[var(--ember)]">Dynamic Programming</span> went from rare to routine in three seasons.</p>
        <p className="mt-6 max-w-md text-[16px] leading-relaxed text-zinc-500">Pick your college and Cogni shows who recruits there, how hiring is moving, which skills they test — and where <em>your</em> mastery falls short, ranked by the size of the gap.</p>
      </div>
      <table className="w-full border-separate border-spacing-0">
        <thead><tr><th /><th className="pb-3 text-center text-[12px] font-normal tnum text-zinc-500">2024</th><th className="pb-3 text-center text-[12px] font-normal tnum text-zinc-500">2025</th><th className="pb-3 text-center text-[12px] font-normal tnum text-zinc-500">2026</th></tr></thead>
        <tbody>{SKILLS.map(([n, v]) => (
          <tr key={n}><td className="border-t border-[var(--line)] py-2 pr-4 text-[16px] text-zinc-300">{n}</td>{v.map((x, k) => <td key={k} className="border-t border-[var(--line)] py-2 text-center"><motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: k * 0.12, type: 'spring' }} className="mx-auto block rounded-full" style={{ width: 6 + x * 0.3, height: 6 + x * 0.3, background: x ? `rgba(255,122,77,${0.25 + x / 130})` : 'rgba(236,230,216,0.06)' }} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function Block({ id, kicker, title, children }) {
  return (
    <section id={id} className="mx-auto max-w-[1360px] scroll-mt-20 px-6 pt-36 md:px-14">
      <Reveal>
        <div className="mb-14 max-w-3xl"><div className="text-[14px] text-zinc-500">{kicker}</div><h2 className="display mt-4 text-[clamp(44px,6.4vw,92px)] text-zinc-50">{title}</h2></div>
      </Reveal>
      {children}
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="ambient-mesh" />
      <div className="relative z-10">
        <Nav />
        <Hero />

        <Block id="model" kicker="How it thinks" title={<>Not a score. A <em className="text-[var(--ember)]">belief</em>.</>}>
          <Playground />
        </Block>

        <Block id="atlas" kicker="Interview atlas" title={<>Know the interview <em className="text-[var(--ember)]">before</em> you walk in.</>}>
          <Atlas />
          <Reveal><Link to="/register" className="mt-12 inline-flex items-center gap-2 text-[15px] text-zinc-400 transition-colors hover:text-[var(--ember)]">Read real reports, questions and offer rates <ArrowUpRight className="h-4 w-4" /></Link></Reveal>
        </Block>

        <Block id="campus" kicker="Your campus" title={<>Placement, scoped to <em className="text-[var(--ember)]">where you study</em>.</>}>
          <Campus />
        </Block>

        <section className="mx-auto max-w-[1360px] px-6 pb-16 pt-44 text-center md:px-14">
          <Reveal>
            <h2 className="display text-[clamp(56px,10vw,150px)] text-zinc-50">Ready when <em className="text-[var(--ember)]">you</em> are.</h2>
            <div className="mt-12 flex justify-center"><Link to="/register" className="group flex items-center gap-4 rounded-full bg-[var(--ember)] py-3 pl-9 pr-3 text-[#1a0d07] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"><span className="text-[17px] font-semibold">Light your first star</span><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a0d07] text-[var(--ember)]"><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" /></span></Link></div>
          </Reveal>
          <footer className="mt-32 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8 text-[13px] text-zinc-600">
            <span className="display text-[22px] italic text-zinc-500">cogni.</span>
            <span>Bayesian knowledge tracing · placement intelligence · built for campus</span>
          </footer>
        </section>
      </div>
    </div>
  );
}
