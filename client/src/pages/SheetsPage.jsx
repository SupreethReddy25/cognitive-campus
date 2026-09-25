import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, BookOpen, ArrowUpRight, CheckCircle2, Layers, Target } from 'lucide-react';
import { sheetsService } from '../services/api';
import { Card, Label, Bar, Ring, Pill, Skeleton, EmptyState, Reveal, cn } from '../components/ui/kit';

const GRADIENT = ['from-emerald-500/[0.12]', 'from-sky-500/[0.12]', 'from-violet-500/[0.12]', 'from-amber-500/[0.12]', 'from-rose-500/[0.12]', 'from-teal-500/[0.12]', 'from-fuchsia-500/[0.12]'];
const RING = ['#34d399', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185', '#2dd4bf', '#e879f9'];

export default function SheetsPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    sheetsService.getSheets().then((r) => setSheets(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => sheets.filter((s) => `${s.name} ${s.source} ${s.description}`.toLowerCase().includes(search.toLowerCase())), [sheets, search]);
  const totals = useMemo(() => ({ done: sheets.reduce((n, s) => n + (s.userProgress?.solved || 0), 0), total: sheets.reduce((n, s) => n + (s.totalProblems || 0), 0) }), [sheets]);

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" /><span className="text-[13px] font-semibold text-zinc-200">Sheets</span>{!loading && <><span className="mx-1 h-3 w-px bg-white/[0.06]" /><span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600">{filtered.length} SHEETS</span></>}</div>
        <div className="flex w-56 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 focus-within:border-[var(--signal)]/30"><Search className="h-3.5 w-3.5 shrink-0 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sheets…" className="flex-1 bg-transparent text-[12px] text-zinc-300 outline-none placeholder:text-zinc-700" />{search && <button onClick={() => setSearch('')}><X className="h-3 w-3 text-zinc-600" /></button>}</div>
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="font-display text-[42px] font-light leading-[1.05] tracking-tight text-zinc-50">Curated <span className="italic text-[var(--signal)]">sheets</span></h1><p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-zinc-500">Hand-picked problem lists. Anything you solve on the platform ticks itself off — external links you can mark manually.</p></div>
          {totals.total > 0 && <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-3"><Ring value={totals.done / totals.total} size={54} stroke={6}><span className="text-[11px] font-semibold text-zinc-100">{Math.round((totals.done / totals.total) * 100)}%</span></Ring><div><div className="text-[18px] font-semibold tabular-nums text-zinc-100">{totals.done}<span className="text-[12px] font-normal text-zinc-500"> / {totals.total}</span></div><Label className="text-zinc-600">across all sheets</Label></div></div>}
        </div>

        {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
          : filtered.length === 0 ? <EmptyState icon={BookOpen} title="No sheets match" text="Try a different search." />
          : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s, i) => {
                const done = s.userProgress?.solved || 0;
                const pct = s.totalProblems ? done / s.totalProblems : 0;
                return (
                  <Reveal key={s._id} delay={Math.min(i * 0.05, 0.3)}>
                    <Link to={`/sheets/${s.slug}`} className="group block h-full">
                      <Card padded={false} glow className={cn('h-full overflow-hidden bg-gradient-to-br to-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16]', GRADIENT[i % GRADIENT.length])}>
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0"><Pill tone="zinc">{s.source || 'Curated'}</Pill><h3 className="mt-2.5 text-[17px] font-semibold leading-snug text-zinc-100 group-hover:text-[var(--signal)]">{s.name}</h3></div>
                            <Ring value={pct} size={58} stroke={6} color={RING[i % RING.length]}><span className="text-[12px] font-semibold text-zinc-100">{Math.round(pct * 100)}%</span></Ring>
                          </div>
                          <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-zinc-500">{s.description}</p>
                          <div className="mt-4"><div className="mb-1.5 flex justify-between font-mono text-[10.5px]"><span className="text-zinc-400">{done} solved</span><span className="text-zinc-600">{s.totalProblems} problems</span></div><Bar value={done} max={s.totalProblems || 1} height={5} color={RING[i % RING.length]} /></div>
                          <div className="mt-4 flex flex-wrap items-center gap-1.5">
                            <span className="flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300"><Target className="h-3 w-3" />{s.availableProblems} on platform</span>
                            {s.byDifficulty && <span className="font-mono text-[10px] text-zinc-600">{s.byDifficulty.easy}E · {s.byDifficulty.medium}M · {s.byDifficulty.hard}H</span>}
                          </div>
                          {s.topTopics?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{s.topTopics.map((t) => <span key={t} className="rounded border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">{t}</span>)}</div>}
                        </div>
                        <div className="flex items-center justify-between border-t border-white/[0.05] bg-black/20 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600 group-hover:text-[var(--signal)]"><span>{done > 0 ? 'Continue' : 'Start sheet'}</span><ArrowUpRight className="h-3.5 w-3.5" /></div>
                      </Card>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
