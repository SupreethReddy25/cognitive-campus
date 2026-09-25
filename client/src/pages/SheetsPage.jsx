import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { sheetsService } from '../services/api';
import { CountUp, Page, PageHead, Skeleton, cn } from '../components/ui/kit';

export default function SheetsPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hover, setHover] = useState(null);

  useEffect(() => {
    sheetsService.getSheets().then((r) => setSheets(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => sheets.filter((s) => `${s.name} ${s.source} ${s.description}`.toLowerCase().includes(search.toLowerCase())), [sheets, search]);
  const totals = useMemo(() => ({ done: sheets.reduce((n, s) => n + (s.userProgress?.solved || 0), 0), total: sheets.reduce((n, s) => n + (s.totalProblems || 0), 0) }), [sheets]);

  return (
    <Page>
      <PageHead
        kicker="Sheets · hand-picked paths through the curriculum"
        title={<>Follow a <em className="text-[var(--ember)]">path</em>.</>}
        lead={<>Anything you solve on the platform ticks itself off. {totals.total > 0 && <><span className="text-zinc-100"><CountUp value={totals.done} /></span> of {totals.total} problems across all sheets are behind you.</>}</>}
        right={<div className="flex w-64 items-center gap-3 border-b border-[var(--line-strong)] pb-2 focus-within:border-[var(--ember)]"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a sheet…" className="display w-full bg-transparent text-[20.8px] text-zinc-50 placeholder:text-zinc-700 focus:outline-none" />{search && <button onClick={() => setSearch('')}><X className="h-4 w-4 text-zinc-500" /></button>}</div>}
      />

      <div className="mt-16" onMouseLeave={() => setHover(null)}>
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mb-3 h-24" />)
          : filtered.length === 0 ? <div className="py-20 text-center"><div className="display text-[27.2px] italic text-zinc-500">No sheet by that name.</div></div>
          : filtered.map((s, i) => {
            const done = s.userProgress?.solved || 0;
            const pct = s.totalProblems ? done / s.totalProblems : 0;
            const active = hover === s._id;
            return (
              <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }} onMouseEnter={() => setHover(s._id)}>
                <Link to={`/sheets/${s.slug}`} className="group relative grid items-end gap-x-10 gap-y-3 py-9 md:grid-cols-[64px_1fr_auto]">
                  {/* the underline IS the progress bar */}
                  <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--line-strong)]" />
                  <motion.span className="absolute bottom-0 left-0 h-[2px] bg-[var(--ember)]" initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 1.2, delay: 0.2 + i * 0.06, ease: [0.23, 1, 0.32, 1] }} />
                  <span className="display hidden text-[30.4px] leading-none text-zinc-700 md:block">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <div className="tag">{s.source || 'Curated'} · {s.totalProblems} problems · <span className="text-zinc-400">{s.availableProblems} live here</span></div>
                    <div className={cn('display mt-2 text-[clamp(27px,3.9vw,51px)] leading-[1] transition-all duration-300', active ? 'translate-x-2 text-[var(--ember)]' : 'text-zinc-100')}>{s.name}</div>
                    <p className={cn('max-w-2xl text-[14px] leading-relaxed text-zinc-500 transition-all duration-300', active ? 'mt-3 max-h-24 opacity-100' : 'max-h-0 overflow-hidden opacity-0')}>{s.description}</p>
                  </div>
                  <div className="flex items-end gap-6">
                    <div className="text-right"><div className="display text-[43.2px] leading-none tnum text-zinc-50">{Math.round(pct * 100)}<span className="text-[22px] text-zinc-600">%</span></div><div className="tag mt-1">{done} of {s.totalProblems}</div></div>
                    <ArrowUpRight className={cn('mb-2 h-6 w-6 transition-all', active ? 'text-[var(--ember)]' : 'text-zinc-700')} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
      </div>
    </Page>
  );
}
