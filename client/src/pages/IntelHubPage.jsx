import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Plus, TrendingUp, Flame, ArrowUpRight, Activity, FileText, Layers, X, SlidersHorizontal, Eye, Users } from 'lucide-react';
import { companiesService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { ReviewQueue } from '../components/intel/ReviewQueue';
import { Card, Label, CompanyLogo, TierBadge, Skeleton, EmptyState, Pill, Bar, CountUp, cn } from '../components/ui/kit';

const TIERS = ['FAANG', 'Product', 'Finance', 'Service', 'Startup'];
const SORTS = [['trending', 'Trending'], ['experiences', 'Most reports'], ['ctc', 'Highest CTC'], ['name', 'A–Z']];
const DIFF_TONE = { Easy: 'green', Medium: 'amber', Hard: 'red' };
const MAX_CTC = 80;

function CtcRange({ min, max }) {
  if (min == null) return <span className="text-zinc-600">Not disclosed</span>;
  const cap = (v) => Math.min(100, (v / MAX_CTC) * 100);
  return (
    <div>
      <div className="mb-1.5 font-mono text-[12px] text-zinc-200">{min === max ? `${min}` : `${min}–${max}`} <span className="text-zinc-500">LPA</span></div>
      <div className="relative h-1.5 rounded-full bg-white/[0.06]">
        <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-emerald-500/60 to-sky-400/80" style={{ left: `${cap(min)}%`, width: `${Math.max(3, cap(max) - cap(min))}%` }} />
      </div>
    </div>
  );
}

function CompanyCard({ c, index, trending, onSubmit }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.35 }}>
      <Card padded={false} glow className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16]">
        <Link to={`/companies/${c.slug}`} className="block p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <CompanyLogo company={c} size={46} />
              <div className="min-w-0">
                <div className="truncate text-[16px] font-semibold text-zinc-100">{c.name}</div>
                <div className="mt-1 flex items-center gap-1.5"><TierBadge tier={c.tier} />{trending && <Pill tone="amber" icon={Flame}>Trending</Pill>}</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-700 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--signal)]" />
          </div>

          <div className="mt-5 grid grid-cols-[1.3fr_1fr] gap-5">
            <div><Label className="mb-1.5 block text-zinc-600">Avg CTC</Label><CtcRange min={c.ctcMin} max={c.ctcMax} /></div>
            <div>
              <Label className="mb-1.5 block text-zinc-600">Reports</Label>
              <div className="flex items-baseline gap-1.5"><span className="text-[17px] font-semibold tabular-nums text-zinc-100">{c.experienceCount}</span>{c.recentExperiences > 0 && <span className="font-mono text-[10px] text-emerald-400">+{c.recentExperiences} new</span>}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Pill tone={DIFF_TONE[c.interviewProcess?.difficulty] || 'zinc'}>{c.interviewProcess?.difficulty || 'Medium'}</Pill>
            <Pill tone="zinc">{c.interviewProcess?.rounds?.length || 0} rounds</Pill>
            {c.offerRate != null && <Pill tone="blue">{c.offerRate}% offer rate</Pill>}
          </div>

          <div className="mt-3.5 line-clamp-1 text-[11.5px] text-zinc-500">{(c.roles || []).slice(0, 4).join(' · ')}</div>
        </Link>
        <div className="flex items-center justify-between border-t border-white/[0.05] bg-white/[0.015] px-5 py-2.5">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600"><Eye className="h-3 w-3" />{(c.viewCount || 0).toLocaleString()} views</span>
          <button onClick={() => onSubmit(c)} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-[var(--signal)]"><Plus className="h-3 w-3" /> Add your experience</button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function IntelHubPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState({ trending: { mostViewed: [], mostSubmitted: [] }, totalExperiences: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('companies');

  const [search, setSearch] = useState('');
  const [tiers, setTiers] = useState([]);
  const [ctc, setCtc] = useState([0, MAX_CTC]);
  const [minReports, setMinReports] = useState(0);
  const [sort, setSort] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [submitTarget, setSubmitTarget] = useState(null);
  const searchRef = useRef(null);

  const load = () => companiesService.getCompanies().then((r) => { setCompanies(r.data.data); setMeta(r.data.meta || meta); }).catch(() => toast.error('Could not load companies')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e) => { if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = companies.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.roles || []).some((r) => r.toLowerCase().includes(q)) && !c.tier.toLowerCase().includes(q)) return false;
      if (tiers.length && !tiers.includes(c.tier)) return false;
      if ((c.ctcMax ?? 0) < ctc[0] || (c.ctcMin ?? Infinity) > ctc[1]) return false;
      if (c.experienceCount < minReports) return false;
      return true;
    });
    const sorters = {
      trending: (a, b) => b.recentExperiences - a.recentExperiences || (b.viewCount || 0) - (a.viewCount || 0),
      experiences: (a, b) => b.experienceCount - a.experienceCount,
      ctc: (a, b) => (b.ctcMax ?? 0) - (a.ctcMax ?? 0),
      name: (a, b) => a.name.localeCompare(b.name)
    };
    return [...list].sort(sorters[sort]);
  }, [companies, search, tiers, ctc, minReports, sort]);

  const byId = useMemo(() => new Map(companies.map((c) => [c._id, c])), [companies]);
  const trendingIds = new Set(meta.trending?.mostSubmitted?.slice(0, 3));
  const mostViewed = (meta.trending?.mostViewed || []).map((id) => byId.get(id)).filter(Boolean).slice(0, 5);
  const mostSubmitted = (meta.trending?.mostSubmitted || []).map((id) => byId.get(id)).filter(Boolean).slice(0, 5);
  const anyFilter = search || tiers.length || ctc[0] > 0 || ctc[1] < MAX_CTC || minReports > 0;

  const totalReports = meta.totalExperiences || companies.reduce((n, c) => n + c.experienceCount, 0);

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3">
          <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-200">Intel Hub</span>
          <span className="mx-2 hidden h-3 w-px bg-white/[0.06] sm:block" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 sm:block">Company intelligence</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] p-[3px]">
          {[['companies', 'Companies', Layers], ['review', 'Review queue', Shield]].map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors', tab === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}><I className="h-3 w-3" />{l}</button>
          ))}
        </div>
      </header>

      {tab === 'review' ? <ReviewQueue /> : (
        <div className="space-y-6 px-6 py-8 md:px-10">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0d1218] via-[#0b0f15] to-[#0a0d13] p-7 md:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/[0.08] blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-[var(--signal)]/[0.07] blur-[80px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div>
                <Label>Interview intelligence database</Label>
                <h1 className="mt-3 font-display text-[40px] font-light leading-[1.08] tracking-tight text-zinc-50 md:text-[48px]">Know the interview <span className="italic text-[var(--signal)]">before</span> you walk in.</h1>
                <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-zinc-500">Real questions, round structures, difficulty ratings and offer rates — crowdsourced from students who just sat the interviews. Statistics show confidence intervals, so you always know how much to trust a number.</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button onClick={() => setSubmitTarget({})} className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-[12.5px] font-semibold text-black shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110"><Plus className="h-4 w-4" strokeWidth={2.4} /> Submit your experience</button>
                  <span className="text-[11.5px] text-zinc-500">Paste raw text and AI structures it · earn up to <b className="text-amber-300">200 XP</b></span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['Companies', companies.length, Layers], ['Reports', totalReports, FileText], ['This month', companies.reduce((n, c) => n + c.recentExperiences, 0), Activity]].map(([l, v, I]) => (
                  <div key={l} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"><I className="mb-2 h-4 w-4 text-[var(--signal)]" strokeWidth={1.6} /><div className="text-[26px] font-semibold tabular-nums text-zinc-100"><CountUp value={v} /></div><Label className="text-zinc-600">{l}</Label></div>
                ))}
              </div>
            </div>
          </div>

          {/* Trending */}
          {!loading && (mostViewed.length > 0 || mostSubmitted.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {[['Most viewed', Eye, mostViewed, (c) => `${(c.viewCount || 0).toLocaleString()} views`], ['Most active this month', TrendingUp, mostSubmitted, (c) => `${c.recentExperiences} new · ${c.experienceCount} total`]].map(([title, I, list, sub]) => (
                <Card key={title}>
                  <div className="mb-3 flex items-center gap-2"><I className="h-3.5 w-3.5 text-amber-400" /><Label className="text-zinc-300">{title}</Label></div>
                  <div className="space-y-1.5">
                    {list.map((c, i) => (
                      <Link key={c._id} to={`/companies/${c.slug}`} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
                        <span className="w-4 font-mono text-[11px] text-zinc-600">{i + 1}</span>
                        <CompanyLogo company={c} size={28} className="rounded-lg" />
                        <span className="flex-1 truncate text-[13px] text-zinc-200 group-hover:text-[var(--signal)]">{c.name}</span>
                        <span className="font-mono text-[10.5px] text-zinc-600">{sub(c)}</span>
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <Card padded={false} className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2">
                <Search className="h-3.5 w-3.5 text-zinc-600" />
                <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, role or tier…   ( / )" className="w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
                {search && <button onClick={() => setSearch('')}><X className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-300" /></button>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {TIERS.map((t) => <button key={t} onClick={() => setTiers((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))} className={cn('rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors', tiers.includes(t) ? 'border-[var(--signal)]/40 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/[0.07] text-zinc-500 hover:text-zinc-200')}>{t}</button>)}
              </div>
              <button onClick={() => setShowFilters((s) => !s)} className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors', showFilters ? 'border-white/20 bg-white/[0.06] text-zinc-100' : 'border-white/[0.07] text-zinc-500 hover:text-zinc-200')}><SlidersHorizontal className="h-3 w-3" /> Filters</button>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-white/[0.07] bg-[#0b0f15] px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider text-zinc-300 focus:outline-none">{SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </div>
            {showFilters && (
              <div className="mt-4 grid gap-6 border-t border-white/[0.05] pt-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between"><Label>CTC range (LPA)</Label><span className="font-mono text-[11px] text-zinc-300">{ctc[0]} – {ctc[1] >= MAX_CTC ? `${MAX_CTC}+` : ctc[1]}</span></div>
                  <div className="flex items-center gap-3"><input type="range" min={0} max={MAX_CTC} step={5} value={ctc[0]} onChange={(e) => setCtc([Math.min(Number(e.target.value), ctc[1] - 5), ctc[1]])} className="h-1 flex-1 accent-emerald-400" /><input type="range" min={0} max={MAX_CTC} step={5} value={ctc[1]} onChange={(e) => setCtc([ctc[0], Math.max(Number(e.target.value), ctc[0] + 5)])} className="h-1 flex-1 accent-sky-400" /></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between"><Label>Minimum reports</Label><span className="font-mono text-[11px] text-zinc-300">{minReports}+</span></div>
                  <input type="range" min={0} max={8} value={minReports} onChange={(e) => setMinReports(Number(e.target.value))} className="h-1 w-full accent-emerald-400" />
                </div>
              </div>
            )}
          </Card>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No companies match" text="Loosen a filter or clear the search." action={anyFilter && <button onClick={() => { setSearch(''); setTiers([]); setCtc([0, MAX_CTC]); setMinReports(0); }} className="rounded-lg border border-white/10 px-4 py-2 text-[12px] text-zinc-300 hover:bg-white/[0.05]">Clear filters</button>} />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c, i) => <CompanyCard key={c._id} c={c} index={i} trending={trendingIds.has(c._id)} onSubmit={setSubmitTarget} />)}
              </div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-zinc-700">{filtered.length} {filtered.length === 1 ? 'company' : 'companies'}{tiers.length ? ` · ${tiers.join(', ')}` : ''}{search ? ` matching “${search}”` : ''}</p>
            </>
          )}
        </div>
      )}

      {submitTarget !== null && (
        <SubmitExperienceModal
          company={submitTarget._id ? submitTarget : null}
          companies={companies}
          onClose={() => setSubmitTarget(null)}
          onSuccess={() => { load(); }}
        />
      )}
    </div>
  );
}
