import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Check, Search, X } from 'lucide-react';
import { sheetsService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Page, Skeleton, ErrorNote, cn } from '../components/ui/kit';

const DIFFS = ['all', 'easy', 'medium', 'hard'];
const STATUS = [['all', 'All'], ['todo', 'To do'], ['done', 'Done']];
const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };
const chip = (on) => cn('shrink-0 rounded-sm border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', on ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200');

export default function SheetDetailPage() {
  const { slug } = useParams();
  const toast = useToast();
  const [sheet, setSheet] = useState(null);
  const [manual, setManual] = useState(new Set());
  const [auto, setAuto] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState('');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState('all');
  const [topic, setTopic] = useState('');
  const [onlyPlatform, setOnlyPlatform] = useState(false);

  useEffect(() => {
    setLoading(true);
    sheetsService.getSheet(slug).then((r) => {
      setSheet(r.data.data.sheet);
      setManual(new Set(r.data.data.progress || []));
      setAuto(new Set(r.data.data.autoSolved || []));
    }).catch((e) => setError(e.response?.status === 404 ? 'Sheet not found.' : 'Could not load this sheet.')).finally(() => setLoading(false));
  }, [slug]);

  const keyOf = (p) => (p.problemId ? String(p.problemId) : p.title);
  const isDone = (p) => (p.problemId && auto.has(String(p.problemId))) || manual.has(keyOf(p));

  const toggle = async (e, p) => {
    e.preventDefault(); e.stopPropagation();
    if (p.problemId && auto.has(String(p.problemId))) { toast.info('Solved on the platform', 'This one is tracked automatically.'); return; }
    const k = keyOf(p);
    const next = new Set(manual);
    const nowDone = !next.has(k);
    nowDone ? next.add(k) : next.delete(k);
    setManual(next);
    try { await sheetsService.updateProgress(slug, { problemIdentifier: k, completed: nowDone }); }
    catch { setManual(manual); toast.error('Could not save progress'); }
  };

  const problems = useMemo(() => sheet?.problems || [], [sheet]);
  const done = problems.filter(isDone).length;
  const topics = useMemo(() => { const c = {}; problems.forEach((p) => (p.topics || []).forEach((t) => { c[t] = (c[t] || 0) + 1; })); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t); }, [problems]);

  const list = problems.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (diff !== 'all' && p.difficulty !== diff) return false;
    if (topic && !(p.topics || []).includes(topic)) return false;
    if (onlyPlatform && !p.isAvailable) return false;
    if (status === 'done' && !isDone(p)) return false;
    if (status === 'todo' && isDone(p)) return false;
    return true;
  });

  const byDiff = (d) => ({ done: problems.filter((p) => p.difficulty === d && isDone(p)).length, total: problems.filter((p) => p.difficulty === d).length });
  const pct = problems.length ? done / problems.length : 0;

  if (loading) return <Page><div className="space-y-4 pt-20"><Skeleton className="h-40" /><Skeleton className="h-96" /></div></Page>;
  if (error || !sheet) return <Page><div className="pt-20"><Link to="/sheets" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-100"><ArrowLeft className="h-4 w-4" /> Sheets</Link><ErrorNote>{error}</ErrorNote></div></Page>;

  return (
    <Page>
      <header className="pt-0 md:pt-4">
        <Link to="/sheets" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-100"><ArrowLeft className="h-4 w-4" /> All sheets</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <div className="tag">{sheet.source || 'Curated'}</div>
            <h1 className="display mt-4 text-[clamp(35px,5.4vw,70px)] text-zinc-50">{sheet.name}</h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-zinc-400">{sheet.description}</p>
          </div>
          <div>
            <div className="flex items-baseline gap-3"><span className="display text-[88px] leading-[0.9] tnum text-zinc-50">{Math.round(pct * 100)}</span><span className="text-[22px] text-zinc-500">% · {done} of {problems.length}</span></div>
            <div className="mt-5 grid grid-cols-3 gap-5">
              {['easy', 'medium', 'hard'].map((d) => { const s = byDiff(d); return (
                <div key={d}><div className="h-[2px] overflow-hidden rounded-full bg-white/[0.08]"><motion.div className="h-full bg-[var(--ember)]" initial={{ width: 0 }} animate={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} transition={{ duration: 1 }} /></div><div className="mt-2 flex items-center justify-between text-[12px] capitalize text-zinc-500"><span className="flex items-center gap-1.5"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[d])} />{d}</span><span className="tnum">{s.done}/{s.total}</span></div></div>
              ); })}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-14 flex items-center gap-4 border-b border-[var(--line-strong)] pb-3 focus-within:border-[var(--ember)]">
        <Search className="h-5 w-5 text-zinc-600" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter this sheet…" className="display w-full bg-transparent text-[24px] text-zinc-50 placeholder:text-zinc-700 focus:outline-none" />
        {q && <button onClick={() => setQ('')}><X className="h-5 w-5 text-zinc-500" /></button>}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {DIFFS.map((d) => <button key={d} onClick={() => setDiff(d)} className={chip(diff === d)}>{d === 'all' ? 'Any difficulty' : d}</button>)}
        <span className="mx-2 h-5 w-px bg-[var(--line-strong)]" />
        {STATUS.map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={chip(status === k)}>{l}</button>)}
        <span className="mx-2 h-5 w-px bg-[var(--line-strong)]" />
        <button onClick={() => setOnlyPlatform((v) => !v)} className={chip(onlyPlatform)}>Solvable here</button>
      </div>
      {topics.length > 0 && <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-surgical">{topics.map((t) => <button key={t} onClick={() => setTopic(topic === t ? '' : t)} className={cn(chip(topic === t), 'normal-case')}>{t}</button>)}</div>}

      <div className="mt-8">
        {list.length === 0 ? <div className="py-20 text-center"><div className="display text-[27.2px] italic text-zinc-500">Nothing matches.</div></div> : (
          <ol>
            {list.map((p, i) => {
              const d = isDone(p);
              const inner = (
                <>
                  <button onClick={(e) => toggle(e, p)} title={d ? 'Mark as not done' : 'Mark as done'} className={cn('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-all', d ? 'border-[var(--ember)] bg-[var(--ember)] text-[#04130d]' : 'border-[var(--line-strong)] text-transparent hover:border-[var(--ember)]')}><Check className="h-3.5 w-3.5" strokeWidth={3} /></button>
                  <span className="w-8 shrink-0 text-[12.5px] tnum text-zinc-700">{String(sheet.problems.indexOf(p) + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[18px] font-medium transition-colors', d ? 'text-zinc-600 line-through decoration-zinc-700' : 'text-zinc-100 group-hover:text-[var(--ember)]')}>{p.title}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-zinc-600">{[p.skill, ...(p.topics || []).slice(0, 3)].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="hidden items-center gap-2 text-[13px] capitalize text-zinc-400 sm:flex"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[p.difficulty])} />{p.difficulty}</span>
                  <span className={cn('flex w-[92px] shrink-0 items-center justify-end gap-1.5 text-[12.5px]', p.isAvailable ? 'text-[var(--ember-soft)]' : 'text-zinc-600')}>{p.isAvailable && p.problemId ? 'Solve' : 'LeetCode'}<ArrowUpRight className="h-3.5 w-3.5" /></span>
                </>
              );
              const cls = 'group flex items-center gap-4 border-b border-[var(--line)] py-4 transition-colors hover:bg-white/[0.02]';
              return (
                <motion.li key={keyOf(p) + i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.012, 0.3) }}>
                  {p.isAvailable && p.problemId
                    ? <Link to={`/problems/${p.problemId}`} className={cls}>{inner}</Link>
                    : <a href={p.externalUrl} target="_blank" rel="noreferrer" className={cls}>{inner}</a>}
                </motion.li>
              );
            })}
          </ol>
        )}
        <p className="mt-6 text-[12px] text-zinc-700">{list.length} of {problems.length} shown · platform problems tick automatically when you solve them</p>
      </div>
    </Page>
  );
}
