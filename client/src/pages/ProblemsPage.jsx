import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bookmark, BookmarkCheck, CheckCircle2, CircleDashed, Circle, ArrowUpRight, X } from 'lucide-react';
import { problemsService, skillsService, usersService, engagementService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Bar, Skeleton, cn } from '../components/ui/kit';

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
  const [showCompanies, setShowCompanies] = useState(false);

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

  const chip = (on) => cn('shrink-0 rounded-sm border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', on ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200');
  const DIFF_DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="mx-auto max-w-[1360px] px-6 md:px-14">
        <header className="grid gap-12 pt-2 md:pt-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <div className="tag">Practice · {problems.length} problems, each one tuned to a skill</div>
            <h1 className="display mt-5 text-[clamp(38px,6vw,77px)] text-zinc-50">Pick your <em className="text-[var(--ember)]">next</em> problem.</h1>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {['easy', 'medium', 'hard'].map((d) => {
              const st = byDiff(d);
              return (
                <div key={d} className="border-t border-[var(--line-strong)] pt-3">
                  <div className="display text-[35.2px] leading-none tnum text-zinc-50">{st.done}<span className="text-[20px] text-zinc-600">/{st.total}</span></div>
                  <div className="mt-2 flex items-center gap-2 text-[12px] capitalize text-zinc-500"><span className={cn('h-1.5 w-1.5 rounded-full', DIFF_DOT[d])} />{d}</div>
                </div>
              );
            })}
          </div>
        </header>

        {rec && (
          <Link to={`/problems/${rec.problem._id}`} className="group mt-14 flex flex-wrap items-center justify-between gap-6 border border-[var(--signal)]/30 bg-[var(--signal)]/[0.04] px-8 py-7 transition-colors hover:border-[var(--signal)]/60">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[12.5px] text-[var(--ember-soft)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" />The model&apos;s pick for you</div>
              <div className="display mt-2 truncate text-[clamp(24px,3.1vw,37px)] leading-none text-zinc-50">{rec.problem.title}</div>
              <div className="mt-2.5 max-w-2xl text-[14px] text-zinc-400">{rec.reasons?.[0] || `Builds ${rec.skill.name}`}</div>
            </div>
            <div className="flex items-center gap-7">
              <div className="text-right"><div className="display text-[38.4px] leading-none tnum text-zinc-50">{Math.round(rec.predictedSuccess * 100)}<span className="text-[20px] text-zinc-500">%</span></div><div className="mt-1 text-[11.5px] text-zinc-500">likely to solve</div></div>
              <span className="flex h-12 w-12 items-center justify-center border border-white/20 text-zinc-100 transition-all group-hover:border-white group-hover:bg-white group-hover:text-black"><ArrowUpRight className="h-5 w-5" /></span>
            </div>
          </Link>
        )}

        {/* filters */}
        <div className="mt-14 flex items-center gap-4 border-b border-[var(--line-strong)] pb-3 focus-within:border-[var(--ember)]">
          <Search className="h-5 w-5 text-zinc-600" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, tag or company…" className="display w-full bg-transparent text-[25.6px] text-zinc-50 placeholder:text-zinc-700 focus:outline-none" />
          {q && <button onClick={() => setQ('')} className="text-zinc-500 hover:text-zinc-100"><X className="h-5 w-5" /></button>}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-surgical">
            <button onClick={() => setSkill('')} className={chip(!skill)}>All skills</button>
            {skills.map((sk) => <button key={sk._id} onClick={() => setSkill(skill === sk._id ? '' : sk._id)} className={chip(skill === sk._id)}>{sk.name}</button>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {DIFFS.map((d) => <button key={d} onClick={() => setDiff(d)} className={cn(chip(diff === d), 'capitalize')}>{d === 'all' ? 'Any difficulty' : d}</button>)}
              <span className="mx-2 h-5 w-px bg-[var(--line-strong)]" />
              {STATUS.map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={chip(status === k)}>{l}</button>)}
            </div>
            {companies.length > 0 && <button onClick={() => setShowCompanies((v) => !v)} className="text-[13px] text-zinc-500 hover:text-zinc-100">{company ? `Asked at ${company}` : 'Asked at…'} {showCompanies ? '−' : '+'}</button>}
          </div>
          {showCompanies && <div className="flex flex-wrap gap-1.5">{companies.map((c) => <button key={c} onClick={() => setCompany(company === c ? '' : c)} className={chip(company === c)}>{c}</button>)}</div>}
        </div>

        {/* list */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-[12.5px] text-zinc-600"><span><span className="tnum text-zinc-300">{filtered.length}</span> problem{filtered.length === 1 ? '' : 's'}{anyFilter && <button onClick={clear} className="ml-3 text-[var(--ember)] hover:underline">clear filters</button>}</span></div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : view.length === 0 ? (
            <div className="py-20 text-center"><div className="display text-[27.2px] italic text-zinc-500">Nothing matches.</div></div>
          ) : (
            <ol>
              {view.map((p, i) => {
                const st = statusOf(p);
                const ss = states[p.skillId?._id];
                return (
                  <motion.li key={p._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.25) }}>
                    <Link to={`/problems/${p._id}`} className="group relative grid grid-cols-[28px_1fr_auto] items-center gap-5 border-b border-[var(--line)] py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[28px_1fr_190px_110px_44px]">
                      <span className="absolute -left-4 top-3 hidden h-[calc(100%-24px)] w-[2px] rounded-full bg-[var(--ember)] opacity-0 transition-opacity group-hover:opacity-100 md:block" />
                      <span title={st === 'solved' ? 'Solved' : st === 'attempted' ? 'Attempted' : 'Not started'}>{st === 'solved' ? <CheckCircle2 className="h-[19px] w-[19px] text-emerald-400" /> : st === 'attempted' ? <CircleDashed className="h-[19px] w-[19px] text-amber-400" /> : <Circle className="h-[19px] w-[19px] text-zinc-700" />}</span>
                      <div className="min-w-0">
                        <div className={cn('truncate text-[18px] font-medium transition-colors group-hover:text-[var(--ember)]', st === 'solved' ? 'text-zinc-400' : 'text-zinc-100')}>{p.title}</div>
                        <div className="mt-1 truncate text-[12.5px] text-zinc-600">{(p.tags || []).slice(0, 3).join(' · ')}{(p.companies || []).length > 0 && <span className="hidden md:inline"> — {(p.companies || []).slice(0, 3).join(', ')}</span>}{attempted[p._id] && <span> · {attempted[p._id].attempts} attempt{attempted[p._id].attempts !== 1 ? 's' : ''}</span>}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="truncate text-[13px] text-zinc-400">{p.skillId?.name}</div>
                        {ss && ss.attempts > 0 ? <div className="mt-1.5 flex items-center gap-2"><Bar value={ss.masteryP} max={1} height={2} className="w-20" color={ss.masteryP >= 0.85 ? '#ecfdf5' : ss.masteryP >= 0.5 ? '#fbbf24' : '#fb7185'} /><span className="text-[11px] tnum text-zinc-500">{Math.round(ss.masteryP * 100)}%</span></div> : <div className="mt-1.5 text-[11px] text-zinc-700">not started</div>}
                      </div>
                      <div className="hidden items-center gap-2 text-[13px] capitalize text-zinc-400 md:flex"><span className={cn('h-1.5 w-1.5 rounded-full', DIFF_DOT[p.difficulty])} />{p.difficulty}</div>
                      <button onClick={(e) => toggleBookmark(e, p._id)} title="Bookmark" className={cn('flex h-9 w-9 items-center justify-center justify-self-end rounded-full transition-colors', bookmarks.has(p._id) ? 'text-[var(--star)]' : 'text-zinc-700 hover:text-zinc-300')}>{bookmarks.has(p._id) ? <BookmarkCheck className="h-[18px] w-[18px]" /> : <Bookmark className="h-[18px] w-[18px]" />}</button>
                    </Link>
                  </motion.li>
                );
              })}
            </ol>
          )}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4 text-[13px]">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm border border-[var(--line-strong)] px-5 py-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 font-mono text-[10.5px] uppercase tracking-[0.16em]">Previous</button>
              <span className="tnum text-zinc-500">{page} of {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="rounded-sm border border-[var(--line-strong)] px-5 py-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 font-mono text-[10.5px] uppercase tracking-[0.16em]">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
