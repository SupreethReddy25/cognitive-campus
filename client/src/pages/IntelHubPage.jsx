import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Plus, X } from 'lucide-react';
import { companiesService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { ReviewQueue } from '../components/intel/ReviewQueue';
import { CompanyLogo, Skeleton, CountUp, cn } from '../components/ui/kit';

const TIERS = ['FAANG', 'Product', 'Finance', 'Service', 'Startup'];
const SORTS = [['trending', 'Trending'], ['experiences', 'Most reports'], ['ctc', 'Highest CTC'], ['name', 'A–Z']];
const MAX_CTC = 80;
const DIFF_WORD = { Easy: 'Friendly', Medium: 'Balanced', Hard: 'Demanding' };

const ctcText = (c) => (c.ctcMin == null ? '—' : c.ctcMin === c.ctcMax ? `${c.ctcMin}` : `${c.ctcMin}–${c.ctcMax}`);

/** Breaking-news style ticker of where the fresh reports are landing. */
function Ticker({ items }) {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[var(--line)] py-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee flex w-max gap-10 whitespace-nowrap text-[13px] text-zinc-500">
        {row.map((c, i) => (
          <Link key={i} to={`/companies/${c.slug}`} className="group flex items-center gap-2.5 hover:text-zinc-100">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ember)]" />
            <span className="text-zinc-300 group-hover:text-[var(--ember)]">{c.name}</span>
            <span className="tnum">{c.recentExperiences} new report{c.recentExperiences === 1 ? '' : 's'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** The right-hand dossier that follows whichever row you hover — no page loads to skim. */
function Preview({ c, onSubmit }) {
  const rounds = c?.interviewProcess?.rounds || [];
  return (
    <div className="sticky top-10 hidden h-fit lg:block">
      <AnimatePresence mode="wait">
        {c && (
          <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
            className="rounded-[28px] border border-[var(--line-strong)] bg-[var(--ink-2)] p-8">
            <div className="flex items-center gap-4">
              <CompanyLogo company={c} size={56} />
              <div className="min-w-0">
                <div className="display truncate text-[38px] leading-none text-zinc-50">{c.name}</div>
                <div className="mt-1.5 text-[12.5px] text-zinc-500">{c.tier}{c.headquarters ? ` · ${c.headquarters.split('·')[0].trim()}` : ''}</div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-6">
              <div><div className="display text-[44px] leading-none tnum text-zinc-50">{c.offerRate != null ? c.offerRate : '—'}{c.offerRate != null && <span className="text-[20px] text-zinc-500">%</span>}</div><div className="mt-2 text-[11.5px] text-zinc-500">offer rate</div></div>
              <div><div className="display text-[44px] leading-none tnum text-zinc-50">{c.experienceCount}</div><div className="mt-2 text-[11.5px] text-zinc-500">reports{c.recentExperiences > 0 && <span className="text-[var(--ember)]"> · +{c.recentExperiences}</span>}</div></div>
              <div><div className="display text-[44px] leading-none tnum text-zinc-50">{ctcText(c)}</div><div className="mt-2 text-[11.5px] text-zinc-500">LPA</div></div>
            </div>

            <div className="mt-7">
              <div className="mb-3 text-[12px] text-zinc-500">The gauntlet — {DIFF_WORD[c.interviewProcess?.difficulty] || 'Balanced'}, {rounds.length || '—'} rounds</div>
              {rounds.length > 0 ? (
                <ol className="relative flex items-start justify-between">
                  <span className="absolute left-3 right-3 top-[7px] h-px bg-[var(--line-strong)]" />
                  {rounds.slice(0, 6).map((r, i) => (
                    <li key={i} className="relative flex w-full flex-col items-center gap-2 text-center">
                      <span className="relative h-[15px] w-[15px] rounded-full border border-[var(--ember)] bg-[var(--ink-2)]"><span className="absolute inset-[3px] rounded-full bg-[var(--ember)]" style={{ opacity: 0.25 + (i / Math.max(1, rounds.length - 1)) * 0.75 }} /></span>
                      <span className="line-clamp-2 max-w-[74px] text-[10.5px] leading-tight text-zinc-500">{r.name || r.type || `Round ${i + 1}`}</span>
                    </li>
                  ))}
                </ol>
              ) : <div className="text-[12.5px] text-zinc-600">Round structure not reported yet.</div>}
            </div>

            <div className="mt-7 text-[12.5px] leading-relaxed text-zinc-500">Hires for <span className="text-zinc-300">{(c.roles || []).slice(0, 4).join(', ') || 'multiple roles'}</span>.</div>

            <div className="mt-8 flex items-center gap-3">
              <Link to={`/companies/${c.slug}`} className="group flex flex-1 items-center justify-between rounded-full bg-[var(--ember)] py-2.5 pl-6 pr-2.5 text-[14px] font-semibold text-[#1a0d07] transition-[filter] hover:brightness-110">
                Open the dossier<span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a0d07] text-[var(--ember)]"><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
              <button onClick={() => onSubmit(c)} title="Add your experience" className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line-strong)] text-zinc-400 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]"><Plus className="h-4 w-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function IntelHubPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('atlas');
  const [search, setSearch] = useState('');
  const [tiers, setTiers] = useState([]);
  const [ctc, setCtc] = useState([0, MAX_CTC]);
  const [minReports, setMinReports] = useState(0);
  const [sort, setSort] = useState('trending');
  const [refine, setRefine] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);
  const searchRef = useRef(null);

  const load = () => companiesService.getCompanies().then((r) => setCompanies(r.data.data)).catch(() => toast.error('Could not load companies')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e) => { if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = companies.filter((c) => {
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

  const shown = filtered.find((c) => c._id === hoverId) || filtered[0];
  const anyFilter = search || tiers.length || ctc[0] > 0 || ctc[1] < MAX_CTC || minReports > 0;
  const totalReports = companies.reduce((n, c) => n + c.experienceCount, 0);
  const recent = companies.reduce((n, c) => n + c.recentExperiences, 0);
  const hot = [...companies].filter((c) => c.recentExperiences > 0).sort((a, b) => b.recentExperiences - a.recentExperiences).slice(0, 8);

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="mx-auto max-w-[1360px] px-6 md:px-14">
        <header className="flex items-start justify-between pt-14 md:pt-20">
          <div className="max-w-3xl">
            <div className="text-[13px] text-zinc-500">Intel · the interview atlas</div>
            <h1 className="display mt-5 text-[clamp(48px,7.4vw,104px)] text-zinc-50">Know the interview <em className="text-[var(--ember)]">before</em> you walk in.</h1>
            <p className="mt-7 max-w-xl text-[18px] leading-relaxed text-zinc-400">
              <span className="text-zinc-100"><CountUp value={totalReports} /></span> firsthand reports across <span className="text-zinc-100"><CountUp value={companies.length} /></span> companies{recent > 0 && <>, <span className="text-[var(--ember)]">{recent} added this month</span></>}. Every percentage carries a confidence interval, so you know how far to trust it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <button onClick={() => setSubmitTarget({})} className="group flex items-center gap-3 rounded-full bg-[var(--ember)] py-3 pl-7 pr-3 text-[#1a0d07] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]">
                <span className="text-[15px] font-semibold">Share your interview</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a0d07] text-[var(--ember)]"><Plus className="h-4 w-4" strokeWidth={2.4} /></span>
              </button>
              <span className="text-[13px] text-zinc-500">Paste raw notes — AI structures them. Earn up to <span className="text-[var(--star)]">200 XP</span>.</span>
            </div>
          </div>
          <button onClick={() => setTab(tab === 'atlas' ? 'review' : 'atlas')} className="mt-2 hidden rounded-full border border-[var(--line-strong)] px-4 py-2 text-[13px] text-zinc-400 transition-colors hover:text-zinc-100 md:block">
            {tab === 'atlas' ? 'Review queue' : '← Back to atlas'}
          </button>
        </header>

        {tab === 'review' ? <div className="pt-10"><ReviewQueue /></div> : (
          <>
            <div className="mt-14"><Ticker items={hot} /></div>

            {/* search — an oversized line, not a form field */}
            <div className="mt-12 flex items-center gap-4 border-b border-[var(--line-strong)] pb-4 focus-within:border-[var(--ember)]">
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a company, a role…" className="display w-full bg-transparent text-[clamp(30px,4vw,52px)] text-zinc-50 placeholder:text-zinc-700 focus:outline-none" />
              {search ? <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-zinc-100"><X className="h-5 w-5" /></button> : <kbd className="hidden rounded-md border border-[var(--line-strong)] px-2 py-1 text-[11px] text-zinc-600 md:block">/</kbd>}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[13px]">
              <div className="flex flex-wrap items-center gap-1.5">
                {TIERS.map((t) => (
                  <button key={t} onClick={() => setTiers((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                    className={cn('rounded-full border px-3.5 py-1.5 transition-colors', tiers.includes(t) ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200')}>{t}</button>
                ))}
                <button onClick={() => setRefine((r) => !r)} className={cn('rounded-full px-3.5 py-1.5 transition-colors', refine ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>Refine {refine ? '−' : '+'}</button>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <span className="mr-1">Sorted by</span>
                {SORTS.map(([k, l]) => <button key={k} onClick={() => setSort(k)} className={cn('rounded-full px-3 py-1.5 transition-colors', sort === k ? 'bg-white/[0.08] text-zinc-50' : 'hover:text-zinc-200')}>{l}</button>)}
              </div>
            </div>

            <AnimatePresence>
              {refine && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid gap-10 pb-2 pt-8 md:grid-cols-2">
                    <div>
                      <div className="mb-3 flex justify-between text-[13px]"><span className="text-zinc-500">Package range</span><span className="tnum text-zinc-200">{ctc[0]} – {ctc[1] >= MAX_CTC ? `${MAX_CTC}+` : ctc[1]} LPA</span></div>
                      <div className="flex items-center gap-4"><input type="range" min={0} max={MAX_CTC} step={5} value={ctc[0]} onChange={(e) => setCtc([Math.min(Number(e.target.value), ctc[1] - 5), ctc[1]])} className="h-1 flex-1 accent-[var(--ember)]" /><input type="range" min={0} max={MAX_CTC} step={5} value={ctc[1]} onChange={(e) => setCtc([ctc[0], Math.max(Number(e.target.value), ctc[0] + 5)])} className="h-1 flex-1 accent-[var(--ember)]" /></div>
                    </div>
                    <div>
                      <div className="mb-3 flex justify-between text-[13px]"><span className="text-zinc-500">At least this many reports</span><span className="tnum text-zinc-200">{minReports}+</span></div>
                      <input type="range" min={0} max={8} value={minReports} onChange={(e) => setMinReports(Number(e.target.value))} className="h-1 w-full accent-[var(--ember)]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* the index */}
            <div className="mt-10 grid gap-16 pb-6 lg:grid-cols-[1fr_440px]">
              <div>
                {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="mb-3 h-16" />)
                  : filtered.length === 0 ? (
                    <div className="py-20 text-center"><div className="display text-[34px] italic text-zinc-500">Nothing matches.</div>{anyFilter && <button onClick={() => { setSearch(''); setTiers([]); setCtc([0, MAX_CTC]); setMinReports(0); }} className="mt-4 text-[13px] text-[var(--ember)] hover:underline">Clear every filter</button>}</div>
                  ) : (
                    <ol onMouseLeave={() => setHoverId(null)}>
                      {filtered.map((c, i) => {
                        const active = shown?._id === c._id;
                        return (
                          <motion.li key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.35) }} onMouseEnter={() => setHoverId(c._id)} onFocus={() => setHoverId(c._id)}>
                            <Link to={`/companies/${c.slug}`} className="group flex items-baseline gap-5 border-b border-[var(--line)] py-4">
                              <span className="w-8 shrink-0 text-[13px] tnum text-zinc-700">{String(i + 1).padStart(2, '0')}</span>
                              <span className={cn('display shrink-0 text-[clamp(30px,3.6vw,50px)] leading-none transition-all duration-300', active ? 'translate-x-2 text-[var(--ember)]' : 'text-zinc-200')}>{c.name}</span>
                              {c.recentExperiences > 0 && <span className="-translate-y-3 text-[11px] font-medium text-[var(--ember)]">+{c.recentExperiences}</span>}
                              <span className="mb-2 hidden flex-1 self-end border-b border-dotted border-zinc-700 sm:block" />
                              <span className="hidden shrink-0 text-right text-[13px] leading-tight text-zinc-500 sm:block"><span className="tnum text-zinc-300">{c.experienceCount}</span> reports<br /><span className="tnum">{ctcText(c)}</span> LPA</span>
                              <ArrowUpRight className={cn('h-4 w-4 shrink-0 self-center transition-all', active ? 'translate-x-0 text-[var(--ember)] opacity-100' : '-translate-x-1 text-zinc-700 opacity-0')} />
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ol>
                  )}
              </div>
              <Preview c={shown} onSubmit={setSubmitTarget} />
            </div>
          </>
        )}
      </div>

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
