import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bookmark, BookmarkCheck, CheckCircle2, CircleDashed, Circle, ArrowUpRight, Building2, Terminal, X, Sparkles, Flame } from 'lucide-react';
import { problemsService, skillsService, usersService, engagementService, analyticsService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Label, DiffPill, Bar, Skeleton, EmptyState, Pill, cn } from '../components/ui/kit';

const STATUS = [['all', 'All'], ['todo', 'Unsolved'], ['attempted', 'Attempted'], ['solved', 'Solved'], ['bookmarked', 'Bookmarked']];
const DIFFS = ['all', 'easy', 'medium', 'hard'];
const PAGE = 20;

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
  const [page, setPage] = useState(1);

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

  const companies = useMemo(() => {
    const c = {};
    problems.forEach((p) => (p.companies || []).forEach((n) => { c[n] = (c[n] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([n]) => n);
  }, [problems]);

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

  useEffect(() => { setPage(1); }, [q, skill, diff, status, company]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice((page - 1) * PAGE, page * PAGE);

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
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" /><span className="text-zinc-200">Workspace</span><span className="mx-2 h-3 w-px bg-white/[0.06]" /><Terminal className="h-3 w-3" /><span>Problem browser</span></div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">{problems.length} PROBLEMS · {solved.length} SOLVED</div>
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        {/* Hero + progress */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="font-display text-[44px] font-light leading-[1.05] tracking-tight text-zinc-50">Choose your <span className="italic text-[var(--signal)]">challenge</span>.</h1>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-zinc-500">Every submission feeds the Bayesian Knowledge Tracing engine. Filter by skill, company or status — or take the problem the model thinks you are ready for.</p>
            {rec && (
              <Link to={`/problems/${rec.problem._id}`} className="group mt-5 flex max-w-xl items-center justify-between gap-4 rounded-2xl border border-[var(--signal)]/25 bg-[var(--signal)]/[0.06] p-4 transition-all hover:border-[var(--signal)]/45 hover:bg-[var(--signal)]/[0.1]">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2"><Pill tone="green" icon={Sparkles}>Recommended</Pill><DiffPill difficulty={rec.problem.difficulty} /></div>
                  <div className="truncate text-[15px] font-semibold text-zinc-100">{rec.problem.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-zinc-500">{rec.reasons?.[0]}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3"><div className="text-right"><div className="font-mono text-[16px] text-zinc-200">{Math.round(rec.predictedSuccess * 100)}%</div><div className="font-mono text-[8.5px] uppercase tracking-wider text-zinc-600">predicted</div></div><ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-[var(--signal)]" /></div>
              </Link>
            )}
          </div>
          <Card>
            <Label>Your progress</Label>
            <div className="mt-4 space-y-3">
              {['easy', 'medium', 'hard'].map((d) => {
                const s = byDiff(d);
                return (
                  <div key={d}>
                    <div className="mb-1 flex items-center justify-between text-[12px]"><DiffPill difficulty={d} /><span className="font-mono text-zinc-400">{s.done} / {s.total}</span></div>
                    <Bar value={s.done} max={s.total || 1} height={5} color={d === 'easy' ? '#34d399' : d === 'medium' ? '#fbbf24' : '#fb7185'} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padded={false} className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2">
              <Search className="h-3.5 w-3.5 text-zinc-600" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tag or company…" className="w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
              {q && <button onClick={() => setQ('')}><X className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-300" /></button>}
            </div>
            <select value={skill} onChange={(e) => setSkill(e.target.value)} className="rounded-xl border border-white/[0.07] bg-[#0b0f15] px-3 py-2 text-[12px] text-zinc-300 focus:outline-none">
              <option value="">All skills</option>
              {skills.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">
              {DIFFS.map((d) => <button key={d} onClick={() => setDiff(d)} className={cn('rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors', diff === d ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{d}</button>)}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">
              {STATUS.map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={cn('rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors', status === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{l}</button>)}
            </div>
          </div>
          {companies.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-zinc-600"><Building2 className="h-3 w-3" /> Asked at</span>
              {companies.map((c) => <button key={c} onClick={() => setCompany(company === c ? '' : c)} className={cn('rounded-md border px-2 py-1 text-[11px] transition-colors', company === c ? 'border-[var(--signal)]/40 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/[0.06] text-zinc-500 hover:text-zinc-200')}>{c}</button>)}
            </div>
          )}
        </Card>

        {/* List */}
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : view.length === 0 ? (
          <EmptyState icon={Search} title="No problems match" text="Try clearing a filter or searching for something broader." action={anyFilter && <button onClick={clear} className="rounded-lg border border-white/10 px-4 py-2 text-[12px] text-zinc-300 hover:bg-white/[0.05]">Clear filters</button>} />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="hidden grid-cols-[44px_1fr_170px_150px_90px_84px] items-center gap-4 border-b border-white/[0.06] px-5 py-3 font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-600 md:grid"><span /><span>Problem</span><span>Skill · mastery</span><span>Companies</span><span>Difficulty</span><span /></div>
            {view.map((p, i) => {
              const st = statusOf(p);
              const ss = states[p.skillId?._id];
              return (
                <motion.div key={p._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.25) }}>
                  <Link to={`/problems/${p._id}`} className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-white/[0.04] px-5 py-3.5 transition-colors last:border-0 hover:bg-white/[0.03] md:grid-cols-[44px_1fr_170px_150px_90px_84px]">
                    <span title={st === 'solved' ? 'Solved' : st === 'attempted' ? 'Attempted' : 'Not started'}>{st === 'solved' ? <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" /> : st === 'attempted' ? <CircleDashed className="h-[18px] w-[18px] text-amber-400" /> : <Circle className="h-[18px] w-[18px] text-zinc-700" />}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-medium text-zinc-100 transition-colors group-hover:text-[var(--signal)]">{p.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-zinc-600">{(p.tags || []).slice(0, 3).join(' · ')}{attempted[p._id] && <span className="text-zinc-500">· {attempted[p._id].attempts} attempt{attempted[p._id].attempts !== 1 ? 's' : ''}</span>}</div>
                    </div>
                    <div className="hidden md:block">
                      <div className="truncate text-[12px] text-zinc-400">{p.skillId?.name}</div>
                      {ss && ss.attempts > 0 ? <div className="mt-1 flex items-center gap-2"><Bar value={ss.masteryP} max={1} height={3} className="w-16" color={ss.masteryP >= 0.85 ? '#34d399' : '#38bdf8'} /><span className="font-mono text-[10px] text-zinc-500">{Math.round(ss.masteryP * 100)}%</span></div> : <div className="mt-1 font-mono text-[10px] text-zinc-700">not started</div>}
                    </div>
                    <div className="hidden truncate text-[11px] text-zinc-500 md:block">{(p.companies || []).slice(0, 3).join(', ') || '—'}</div>
                    <div className="hidden md:block"><DiffPill difficulty={p.difficulty} /></div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="md:hidden"><DiffPill difficulty={p.difficulty} /></span>
                      <button onClick={(e) => toggleBookmark(e, p._id)} title="Bookmark" className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', bookmarks.has(p._id) ? 'text-amber-300' : 'text-zinc-700 hover:text-zinc-300')}>{bookmarks.has(p._id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}</button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </Card>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-white/[0.07] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-100 disabled:opacity-30">Prev</button>
            <span className="font-mono text-[11px] tabular-nums text-zinc-500">{page} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="rounded-lg border border-white/[0.07] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-100 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
