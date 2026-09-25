import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Play, Search, Filter, X } from 'lucide-react';
import { sheetsService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Label, Bar, Ring, DiffPill, Pill, Skeleton, EmptyState, ErrorNote, cn } from '../components/ui/kit';

const DIFFS = ['all', 'easy', 'medium', 'hard'];
const STATUS = [['all', 'All'], ['todo', 'To do'], ['done', 'Done']];

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

  const toggle = async (p) => {
    if (p.problemId && auto.has(String(p.problemId))) { toast.info('Solved on the platform', 'This one is tracked automatically.'); return; }
    const k = keyOf(p);
    const next = new Set(manual);
    const nowDone = !next.has(k);
    nowDone ? next.add(k) : next.delete(k);
    setManual(next);
    try { await sheetsService.updateProgress(slug, { problemIdentifier: k, completed: nowDone }); }
    catch { setManual(manual); toast.error('Could not save progress'); }
  };

  const problems = sheet?.problems || [];
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

  if (loading) return <div className="space-y-4 p-10"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-96" /></div>;
  if (error || !sheet) return <div className="p-10"><Link to="/sheets" className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Sheets</Link><ErrorNote>{error}</ErrorNote></div>;

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <Link to="/sheets" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Sheets <span className="text-zinc-700">/</span> <span className="text-zinc-300">{sheet.name}</span></Link>
        <span className="font-mono text-[11px] tabular-nums text-zinc-500">{done} / {problems.length}</span>
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card className="overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[var(--signal)]/[0.08] blur-[70px]" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl"><Pill tone="zinc">{sheet.source || 'Curated'}</Pill><h1 className="mt-2.5 text-[30px] font-semibold tracking-tight text-zinc-50">{sheet.name}</h1><p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{sheet.description}</p></div>
            <div className="flex items-center gap-6">
              <Ring value={problems.length ? done / problems.length : 0} size={92} stroke={8}><div className="text-center"><div className="text-[20px] font-semibold tabular-nums text-zinc-100">{Math.round((problems.length ? done / problems.length : 0) * 100)}%</div><div className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">done</div></div></Ring>
              <div className="w-44 space-y-2.5">{['easy', 'medium', 'hard'].map((d) => { const s = byDiff(d); return <div key={d}><div className="mb-1 flex items-center justify-between"><DiffPill difficulty={d} className="scale-90 origin-left" /><span className="font-mono text-[10.5px] text-zinc-500">{s.done}/{s.total}</span></div><Bar value={s.done} max={s.total || 1} height={4} color={d === 'easy' ? '#34d399' : d === 'medium' ? '#fbbf24' : '#fb7185'} /></div>; })}</div>
            </div>
          </div>
        </Card>

        {/* filters */}
        <Card padded={false} className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2"><Search className="h-3.5 w-3.5 text-zinc-600" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter problems…" className="w-full bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600" />{q && <button onClick={() => setQ('')}><X className="h-3.5 w-3.5 text-zinc-600" /></button>}</div>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">{DIFFS.map((d) => <button key={d} onClick={() => setDiff(d)} className={cn('rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider', diff === d ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{d}</button>)}</div>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">{STATUS.map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={cn('rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider', status === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{l}</button>)}</div>
            <button onClick={() => setOnlyPlatform((v) => !v)} className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors', onlyPlatform ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/[0.07] text-zinc-500 hover:text-zinc-200')}><Filter className="h-3 w-3" /> On platform</button>
          </div>
          {topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{topics.map((t) => <button key={t} onClick={() => setTopic(topic === t ? '' : t)} className={cn('rounded-md border px-2 py-1 text-[11px] transition-colors', topic === t ? 'border-[var(--signal)]/40 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/[0.06] text-zinc-500 hover:text-zinc-200')}>{t}</button>)}</div>}
        </Card>

        {list.length === 0 ? <EmptyState icon={Search} title="Nothing matches" text="Loosen the filters." /> : (
          <Card padded={false} className="overflow-hidden">
            {list.map((p, i) => {
              const d = isDone(p);
              return (
                <motion.div key={keyOf(p) + i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.3) }} className={cn('flex items-center gap-4 border-b border-white/[0.04] px-5 py-3 transition-colors last:border-0 hover:bg-white/[0.025]', d && 'bg-emerald-400/[0.025]')}>
                  <button onClick={() => toggle(p)} title={d ? 'Mark as not done' : 'Mark as done'} className="shrink-0">{d ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5 text-zinc-700 hover:text-zinc-400" />}</button>
                  <span className="w-7 shrink-0 font-mono text-[10.5px] tabular-nums text-zinc-600">{String(sheet.problems.indexOf(p) + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-[14px] font-medium', d ? 'text-zinc-500 line-through decoration-zinc-700' : 'text-zinc-100')}>{p.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-zinc-600">{p.skill && <span className="text-zinc-500">{p.skill}</span>}{(p.topics || []).slice(0, 3).join(' · ')}</div>
                  </div>
                  <DiffPill difficulty={p.difficulty} className="hidden sm:inline-flex" />
                  {p.isAvailable && p.problemId ? (
                    <Link to={`/problems/${p.problemId}`} className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[var(--signal)] transition-colors hover:bg-[var(--signal)]/20"><Play className="h-3 w-3" /> Solve</Link>
                  ) : (
                    <a href={p.externalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-200"><ExternalLink className="h-3 w-3" /> LeetCode</a>
                  )}
                </motion.div>
              );
            })}
          </Card>
        )}
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-zinc-700">{list.length} of {problems.length} shown · platform problems tick automatically when you solve them</p>
      </div>
    </div>
  );
}
