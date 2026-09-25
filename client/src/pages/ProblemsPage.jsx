import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Search, Bookmark, Check, ArrowUpRight, ArrowRight, X } from 'lucide-react';
import { problemsService, skillsService, usersService, engagementService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Page, PageHead, Ring, Skeleton, cn } from '../components/ui/kit';
import { starColor } from '../components/dashboard/constellation';

const STATUS = [['all', 'All'], ['todo', 'Unsolved'], ['attempted', 'Started'], ['solved', 'Solved'], ['bookmarked', 'Saved']];
const DIFFS = [['all', 'Any'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };
const PAGE = 20;
const EASE = [0.22, 1, 0.36, 1];

/** Follows the pointer with a soft light — drives the `.spot` surfaces. */
const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** Segmented control whose highlight glides between options. */
function Segmented({ id, value, onChange, options }) {
  return (
    <div className="flex border border-white/[0.09]">
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={cn('relative px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors duration-300', value === k ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>
          {value === k && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 bg-white/[0.08]" transition={{ type: 'spring', stiffness: 460, damping: 38 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

function StatusGlyph({ status }) {
  return (
    <span className="relative flex h-[22px] w-[22px] items-center justify-center" title={status === 'solved' ? 'Solved' : status === 'attempted' ? 'Started' : 'Not started'}>
      <span className={cn('absolute inset-0 rounded-full border transition-colors duration-300', status === 'solved' ? 'border-emerald-400/60 bg-emerald-400/10' : status === 'attempted' ? 'border-amber-400/60' : 'border-white/[0.16] group-hover:border-emerald-400/50')} />
      {status === 'solved' && <Check className="relative h-3 w-3 text-emerald-300" strokeWidth={3} />}
      {status === 'attempted' && <span className="absolute inset-[5px] rounded-full bg-gradient-to-r from-amber-400 to-transparent" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
    </span>
  );
}

export default function ProblemsPage() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [problems, setProblems] = useState([]);
  const [skills, setSkills] = useState([]);
  const [states, setStates] = useState({});
  const [attempted, setAttempted] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState('all');
  const [company, setCompany] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [showCompanies, setShowCompanies] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    Promise.all([
      problemsService.getProblems({ limit: 200 }),
      skillsService.getAllSkills(),
      skillsService.getMySkillStates(),
      usersService.getAttempted(),
      engagementService.getBookmarks(),
      usersService.getRecommendations()
    ]).then(([p, s, st, a, b, r]) => {
      setProblems(p.data.data.problems);
      setSkills(s.data.data.skills);
      const wanted = params.get('skill');
      if (wanted) { const hit = s.data.data.skills.find((x) => x.name.toLowerCase() === wanted.toLowerCase()); if (hit) setSkill(hit._id); }
      const map = {};
      st.data.data.skillStates.forEach((x) => { if (x.skillId?._id) map[x.skillId._id] = x; });
      setStates(map);
      setAttempted(a.data.data.attempted);
      setBookmarks(new Set(b.data.data.ids));
      setRec(r.data.data.recommendations?.[0] || null);
    }).catch(() => toast.error('Could not load problems')).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e) => { if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const companies = useMemo(() => {
    const c = {};
    problems.forEach((p) => (p.companies || []).forEach((n) => { c[n] = (c[n] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([n]) => n);
  }, [problems]);
  const perSkill = useMemo(() => { const m = {}; problems.forEach((p) => { const id = p.skillId?._id; if (id) m[id] = (m[id] || 0) + 1; }); return m; }, [problems]);

  const statusOf = (p) => (attempted[p._id]?.solved ? 'solved' : attempted[p._id] ? 'attempted' : 'todo');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return problems.filter((p) => {
      if (ql && !p.title.toLowerCase().includes(ql) && !(p.tags || []).some((t) => t.toLowerCase().includes(ql)) && !(p.companies || []).some((c) => c.toLowerCase().includes(ql))) return false;
      if (skill && p.skillId?._id !== skill) return false;
      if (diff !== 'all' && p.difficulty !== diff) return false;
      if (company && !(p.companies || []).includes(company)) return false;
      if (status === 'bookmarked') return bookmarks.has(p._id);
      if (status !== 'all' && statusOf(p) !== status) return false;
      return true;
    });
  }, [problems, q, skill, diff, status, company, attempted, bookmarks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setShown(PAGE); }, [q, skill, diff, status, company]);
  const view = filtered.slice(0, shown);

  const solved = problems.filter((p) => attempted[p._id]?.solved);
  const byDiff = (d) => ({ done: solved.filter((p) => p.difficulty === d).length, total: problems.filter((p) => p.difficulty === d).length });

  const toggleBookmark = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(bookmarks);
    next.has(id) ? next.delete(id) : next.add(id);
    setBookmarks(next);
    try {
      const r = await engagementService.toggleBookmark(id);
      if (r.data.data.achievements?.length) toast.notify(r.data.data.achievements.map((a) => ({ type: 'achievement', title: `Badge earned: ${a.title}`, message: a.desc })));
    } catch {
      setBookmarks(bookmarks);
      toast.error('Could not update bookmark');
    }
  };

  const clear = () => { setQ(''); setSkill(''); setDiff('all'); setStatus('all'); setCompany(''); };
  const anyFilter = q || skill || diff !== 'all' || status !== 'all' || company;

  return (
    <Page>
      <PageHead
        kicker={`Practice · ${problems.length} problems, each tuned to a skill`}
        title={<>Pick your <em>next</em> problem.</>}
        right={
          <div className="grid grid-cols-3 gap-6">
            {['easy', 'medium', 'hard'].map((d, i) => {
              const st = byDiff(d);
              return (
                <div key={d} className="min-w-[92px]">
                  <div className="font-display text-[34px] font-light leading-none tnum text-zinc-50">{st.done}<span className="text-[16px] text-zinc-600">/{st.total}</span></div>
                  <div className="mt-2.5 h-px bg-white/[0.1]"><motion.div className={cn('h-px', DOT[d])} initial={{ width: 0 }} animate={{ width: `${st.total ? (st.done / st.total) * 100 : 0}%` }} transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: EASE }} /></div>
                  <div className="tag mt-2 flex items-center gap-2"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[d])} />{d}</div>
                </div>
              );
            })}
          </div>
        }
      />

      {/* the model's pick */}
      {rec && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: EASE }} className="mt-12">
          <Link to={`/problems/${rec.problem._id}`} onMouseMove={spot} className="spot spot-strong group flex flex-wrap items-center justify-between gap-8 border border-white/[0.09] bg-white/[0.015] px-8 py-7 transition-[border-color,background-color] duration-500 hover:border-emerald-400/40 hover:bg-white/[0.025]">
            <div className="min-w-0 max-w-2xl">
              <div className="tag flex items-center gap-3 !text-emerald-400/90"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>The model&apos;s pick for you</div>
              <div className="mt-4 font-display text-[clamp(26px,3.4vw,42px)] font-light leading-[1.05] tracking-tight text-zinc-50 transition-transform duration-500 group-hover:translate-x-1">{rec.problem.title}</div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px] text-zinc-500">
                <span className="flex items-center gap-2 capitalize"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[rec.problem.difficulty])} />{rec.problem.difficulty}</span>
                <span>{rec.skill.name}</span>
                <span className="text-zinc-400">{rec.reasons?.[0] || `Builds ${rec.skill.name}`}</span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <Ring value={rec.predictedSuccess} size={84} stroke={2.5} color="#34d399" track="rgba(255,255,255,0.09)">
                <div className="text-center"><div className="font-display text-[22px] font-light leading-none tnum text-zinc-50">{Math.round(rec.predictedSuccess * 100)}<span className="text-[11px] text-zinc-500">%</span></div><div className="tag mt-1 !text-[8px] !tracking-[0.12em]">likely</div></div>
              </Ring>
              <span className="flex h-12 w-12 items-center justify-center border border-white/[0.16] text-zinc-200 transition-all duration-500 group-hover:border-white group-hover:bg-white group-hover:text-black"><ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </div>
          </Link>
        </motion.div>
      )}

      {/* skills */}
      <div className="mt-14">
        <div className="tag mb-3">Skill</div>
        <div className="relative">
          <div className="scrollbar-surgical flex gap-1.5 overflow-x-auto pb-3 [mask-image:linear-gradient(90deg,#000_92%,transparent)]">
            <LayoutGroup id="skills">
              {[{ _id: '', name: 'All skills' }, ...skills].map((sk) => {
                const on = skill === sk._id;
                return (
                  <button key={sk._id || 'all'} onClick={() => setSkill(on && sk._id ? '' : sk._id)} className={cn('relative shrink-0 border px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors duration-300', on ? 'border-emerald-400/50 text-emerald-300' : 'border-white/[0.09] text-zinc-500 hover:border-white/25 hover:text-zinc-100')}>
                    {on && <motion.span layoutId="skill-bg" className="absolute inset-0 bg-emerald-400/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                    <span className="relative">{sk.name}{sk._id && <span className="ml-2 tnum opacity-50">{perSkill[sk._id] || 0}</span>}</span>
                  </button>
                );
              })}
            </LayoutGroup>
          </div>
        </div>
      </div>

      {/* sticky search + segments */}
      <div className="sticky top-0 z-30 -mx-6 mt-4 border-y border-white/[0.06] bg-[#0a0a0a]/85 px-6 py-4 backdrop-blur-xl md:-mx-14 md:px-14">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <label className="group flex min-w-[260px] flex-1 items-center gap-3 border-b border-white/[0.14] pb-2 transition-colors duration-300 focus-within:border-emerald-400/70">
            <Search className="h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-emerald-400" />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tag or company…" className="w-full bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600" />
            <AnimatePresence>{q ? <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setQ('')} className="text-zinc-500 hover:text-zinc-100"><X className="h-4 w-4" /></motion.button> : <kbd className="hidden border border-white/[0.12] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 md:block">/</kbd>}</AnimatePresence>
          </label>
          <Segmented id="diff" value={diff} onChange={setDiff} options={DIFFS} />
          <Segmented id="status" value={status} onChange={setStatus} options={STATUS} />
          {companies.length > 0 && <button onClick={() => setShowCompanies((v) => !v)} className={cn('font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', company ? 'text-emerald-300' : 'text-zinc-500 hover:text-zinc-100')}>{company ? `Asked at ${company}` : 'Asked at'} {showCompanies ? '−' : '+'}</button>}
        </div>
        <AnimatePresence initial={false}>
          {showCompanies && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 pt-4">{companies.map((c) => <button key={c} onClick={() => setCompany(company === c ? '' : c)} className={cn('border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors duration-300', company === c ? 'border-emerald-400/50 bg-emerald-400/[0.08] text-emerald-300' : 'border-white/[0.09] text-zinc-500 hover:border-white/25 hover:text-zinc-100')}>{c}</button>)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* list */}
      <div className="mt-6">
        <div className="mb-1 grid grid-cols-[28px_1fr_auto] items-center gap-5 px-4 md:grid-cols-[28px_1fr_190px_110px_44px]">
          <span /><span className="tag">{filtered.length} problem{filtered.length === 1 ? '' : 's'}{anyFilter && <button onClick={clear} className="ml-4 text-emerald-400/90 transition-colors hover:text-emerald-300">clear filters ×</button>}</span>
          <span className="tag hidden md:block">Skill · mastery</span><span className="tag hidden md:block">Difficulty</span><span />
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[68px]" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center"><div className="font-display text-[28px] font-light text-zinc-500">Nothing matches.</div><button onClick={clear} className="btn-line mt-6">Clear filters</button></div>
        ) : (
          <ol>
            <AnimatePresence initial={false} mode="popLayout">
              {view.map((p, i) => {
                const st = statusOf(p);
                const ss = states[p.skillId?._id];
                const mp = ss?.masteryP;
                const marked = bookmarks.has(p._id);
                return (
                  <motion.li key={p._id} layout="position" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.45, delay: Math.min(i, 12) * 0.03, ease: EASE, layout: { duration: 0.4, ease: EASE } }}>
                    <Link to={`/problems/${p._id}`} onMouseMove={spot} className="spot group relative grid grid-cols-[28px_1fr_auto] items-center gap-5 border-b border-white/[0.06] px-4 py-[18px] md:grid-cols-[28px_1fr_190px_110px_44px]">
                      <span className="absolute inset-y-3 left-0 w-[2px] origin-center scale-y-0 bg-emerald-400 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-y-100" />
                      <StatusGlyph status={st} />
                      <div className="min-w-0">
                        <div className={cn('truncate text-[17px] font-medium transition-[transform,color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1', st === 'solved' ? 'text-zinc-400 group-hover:text-zinc-100' : 'text-zinc-100')}>{p.title}</div>
                        <div className="mt-1 flex items-center gap-2 truncate text-[12.5px] text-zinc-600 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1">
                          <span className="truncate">{[...(p.tags || []).slice(0, 2), ...(p.companies || []).slice(0, 2)].join(' · ')}</span>
                          {attempted[p._id] && <span className="shrink-0 text-zinc-500">· {attempted[p._id].attempts} attempt{attempted[p._id].attempts !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <div className="truncate text-[13px] text-zinc-400">{p.skillId?.name}</div>
                        {ss && ss.attempts > 0
                          ? <div className="mt-2 flex items-center gap-2.5"><div className="h-px w-24 bg-white/[0.1]"><motion.div className="h-px" style={{ background: starColor(mp, 1) }} initial={{ width: 0 }} animate={{ width: `${mp * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + Math.min(i, 10) * 0.03, ease: EASE }} /></div><span className="font-mono text-[10.5px] tnum text-zinc-500">{Math.round(mp * 100)}</span></div>
                          : <div className="tag mt-2 !text-zinc-700">not started</div>}
                      </div>
                      <div className="hidden items-center gap-2.5 text-[13px] capitalize text-zinc-400 md:flex"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[p.difficulty])} />{p.difficulty}</div>
                      <div className="flex items-center justify-end gap-1">
                        <ArrowRight className="hidden h-4 w-4 -translate-x-2 text-emerald-400 opacity-0 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-0 group-hover:opacity-100 lg:block" />
                        <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => toggleBookmark(e, p._id)} title={marked ? 'Remove bookmark' : 'Bookmark'} className={cn('flex h-8 w-8 items-center justify-center transition-colors duration-300', marked ? 'text-amber-300' : 'text-zinc-700 hover:text-zinc-200')}>
                          <Bookmark className="h-[17px] w-[17px] transition-all duration-300" fill={marked ? 'currentColor' : 'none'} />
                        </motion.button>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}

        {filtered.length > shown && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button onClick={() => setShown((n) => n + PAGE)} className="btn-line">Show {Math.min(PAGE, filtered.length - shown)} more</button>
            <span className="tag">{shown} of {filtered.length}</span>
          </div>
        )}
      </div>
    </Page>
  );
}
