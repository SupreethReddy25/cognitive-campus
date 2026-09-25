import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, ComposedChart, Bar as RBar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { GraduationCap, Plus, TrendingUp, Building2, Users, Target, Sparkles, ArrowUpRight, Award, Flame, MapPin, Crown, IndianRupee, CalendarClock, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collegesService, usersService } from '../services/api';
import { CollegeSelector } from '../components/placement/CollegeSelector';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { Card, Label, SectionTitle, Stat, CompanyLogo, TierBadge, Pill, Bar, Ring, Skeleton, EmptyState, ErrorNote, CountUp, Reveal, chartTooltipStyle, cn } from '../components/ui/kit';

const CONF = { none: ['No data yet', 'zinc'], low: ['Low confidence', 'red'], medium: ['Medium confidence', 'amber'], high: ['High confidence', 'green'] };
const HEAT = (pct) => (pct === 0 ? 'rgba(255,255,255,0.03)' : `rgba(52,211,153,${0.1 + Math.min(pct, 100) / 100 * 0.75})`);
const short = (n) => ({ 'Stacks & Queues': 'Stacks', 'Dynamic Programming': 'DP', 'Greedy Algorithms': 'Greedy', 'Linked Lists': 'Lists' }[n] || n);

// ─── Gate: no college chosen ─────────────────────────────────────────────────
function CollegeGate({ onSelected }) {
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const pick = async (college) => {
    if (!college) return;
    setSaving(true);
    try {
      await usersService.updateProfile({ collegeId: college._id });
      toast.success('College saved', college.name);
      onSelected();
    } catch { toast.error('Could not save your college'); } finally { setSaving(false); }
  };
  return (
    <div className="mx-auto mt-16 max-w-xl text-center">
      <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--signal)]/25 bg-[var(--signal)]/10"><GraduationCap className="h-8 w-8 text-[var(--signal)]" strokeWidth={1.4} /></span>
      <h1 className="font-display text-[34px] font-light tracking-tight text-zinc-50">Placement intelligence, scoped to <span className="italic text-[var(--signal)]">your college</span></h1>
      <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-zinc-500">Select your college to see which companies recruit from it, how hiring is trending, which skills they test, and where your mastery falls short.</p>
      <div className="mx-auto mt-7 max-w-md text-left"><CollegeSelector value={null} onChange={pick} placeholder="Search — e.g. NIT Trichy, VIT, IIIT Hyderabad…" disabled={saving} /></div>
    </div>
  );
}

export default function PlacementDashboardPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const college = user?.collegeId && typeof user.collegeId === 'object' ? user.collegeId : null;

  const [insights, setInsights] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const load = (slug) => {
    setLoading(true); setError(null);
    Promise.all([collegesService.getCollegeInsights(slug), collegesService.getCollegeDashboard(slug)])
      .then(([i, d]) => { setInsights(i.data.data); setDash(d.data.data); })
      .catch((e) => setError(e.response?.data?.message || 'Could not load placement data.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (college?.slug) load(college.slug); }, [college?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCollege = async () => {
    try { await usersService.updateProfile({ collegeId: null }); await refreshUser(); setInsights(null); setDash(null); } catch { toast.error('Could not change college'); }
  };

  const latest = insights?.hiringTrends?.[insights.hiringTrends.length - 1];
  const prev = insights?.hiringTrends?.[insights.hiringTrends.length - 2];
  const totalHires = insights?.hiringTrends?.reduce((n, t) => n + t.hires, 0) || 0;
  const radar = useMemo(() => (insights?.peers?.perSkill || []).map((p) => ({ skill: short(p.name), you: Math.round(p.mastery * 100), peers: p.peerAvg != null ? Math.round(p.peerAvg * 100) : null })), [insights]);
  const topPercentiles = useMemo(() => (insights?.peers?.perSkill || []).filter((p) => p.percentile != null).sort((a, b) => b.percentile - a.percentile), [insights]);
  const maxRecruiter = Math.max(1, ...(insights?.topRecruiters || []).map((r) => r.totalHires));

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500"><span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--signal)]" /><span className="text-zinc-200">Placement</span><span className="mx-2 hidden h-3 w-px bg-white/[0.06] sm:block" /><span className="hidden sm:block">College intelligence</span></div>
        {college && <button onClick={() => setShowSubmit(true)} className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[var(--signal)] hover:bg-[var(--signal)]/20"><Plus className="h-3.5 w-3.5" /> Add experience</button>}
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        {!college && <CollegeGate onSelected={refreshUser} />}
        {college && error && <ErrorNote>{error}</ErrorNote>}
        {college && loading && <div className="space-y-6"><Skeleton className="h-44 rounded-3xl" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-80" /></div>}

        {college && insights && dash && (
          <>
            {/* Header */}
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0d1218] via-[#0b0f15] to-[#0a0d13] p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/[0.08] blur-[80px]" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><TierBadge tier={insights.college.tier} /><Pill tone={CONF[dash.dataConfidence][1]}>{CONF[dash.dataConfidence][0]}</Pill></div>
                    <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-zinc-50">{insights.college.name}</h1>
                    <div className="mt-1.5 flex items-center gap-3 text-[12.5px] text-zinc-500">{insights.college.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{insights.college.location}</span>}<button onClick={changeCollege} className="text-zinc-600 underline-offset-2 hover:text-zinc-300 hover:underline">Change college</button></div>
                  </div>
                  {insights.skillGap && <div className="max-w-md rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4"><div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/80"><Target className="h-3.5 w-3.5" /> Your skill-gap headline</div><p className="text-[13px] leading-relaxed text-zinc-300">{insights.skillGap.headline}</p></div>}
                </div>
              </div>
            </Reveal>

            {/* KPIs */}
            <Reveal delay={0.05}>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <Stat label="Recruiters" icon={Building2} value={<CountUp value={insights.topRecruiters.length} />} sub={`${dash.stats.totalCompanies} with interview reports`} />
                <Stat label={`Hires ${latest?.year || ''}`} icon={Users} accent="blue" value={<CountUp value={latest?.hires || 0} />} sub={prev ? `${latest.hires >= prev.hires ? '+' : ''}${latest.hires - prev.hires} vs ${prev.year}` : 'latest season'} />
                <Stat label="Avg package" icon={IndianRupee} accent="amber" value={latest?.avgPackage ? <><CountUp value={latest.avgPackage} decimals={1} /><span className="ml-1 text-[13px] font-normal text-zinc-500">LPA</span></> : '—'} sub={latest?.topPackage ? `top ${latest.topPackage} LPA · ${latest.topPackageCompany}` : ''} />
                <Stat label="Total hires (5y)" icon={Award} accent="violet" value={<CountUp value={totalHires} />} sub={`${insights.hiringTrends.length} seasons of data`} />
                <Stat label="Reports" icon={Sparkles} value={<CountUp value={dash.stats.totalExperiences} />} sub={dash.stats.overallOfferRate != null ? `${dash.stats.overallOfferRate}% offer rate` : 'need 3+ for stats'} />
              </div>
            </Reveal>

            {/* YoY + top recruiters */}
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Reveal>
                <Card>
                  <SectionTitle icon={TrendingUp} title="Year-over-year hiring" sub="Bars: students hired. Lines: number of companies and average package (LPA)." />
                  <div className="h-72"><ResponsiveContainer><ComposedChart data={insights.hiringTrends} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="l" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <RBar yAxisId="l" dataKey="hires" name="Students hired" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={34} isAnimationActive animationDuration={1000} />
                    <Line yAxisId="r" dataKey="companies" name="Companies" stroke="#a78bfa" strokeWidth={2.2} dot={{ r: 4 }} />
                    <Line yAxisId="r" dataKey="avgPackage" name="Avg package (LPA)" stroke="#fbbf24" strokeWidth={2.2} dot={{ r: 4 }} connectNulls />
                  </ComposedChart></ResponsiveContainer></div>
                </Card>
              </Reveal>
              <Reveal delay={0.06}>
                <Card className="h-full">
                  <SectionTitle icon={Crown} title="Top recruiters" sub="By seasons visited, then total hires" />
                  <div className="space-y-2">
                    {insights.topRecruiters.slice(0, 7).map((r, i) => (
                      <Link key={r.company._id} to={`/placement/companies/${r.company.slug}`} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
                        <span className="w-4 font-mono text-[11px] text-zinc-600">{i + 1}</span>
                        <CompanyLogo company={r.company} size={30} className="rounded-lg" />
                        <div className="min-w-0 flex-1"><div className="flex items-center justify-between text-[13px]"><span className="truncate text-zinc-200 group-hover:text-[var(--signal)]">{r.company.name}</span><span className="font-mono text-[11px] text-zinc-500">{r.totalHires} hires</span></div><Bar value={r.totalHires} max={maxRecruiter} height={3} color="#34d399" className="mt-1" /></div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </Reveal>
            </div>

            {/* Predictions */}
            {insights.predictions?.companies?.length > 0 && (
              <Reveal>
                <Card>
                  <SectionTitle icon={CalendarClock} title={`Who is likely to visit in ${insights.predictions.year}?`} sub={insights.predictions.basis} action={insights.predictions.hiresTrendPct != null && <Pill tone={insights.predictions.hiresTrendPct >= 0 ? 'green' : 'red'}>Hiring {insights.predictions.hiresTrendPct >= 0 ? '+' : ''}{insights.predictions.hiresTrendPct}% (3y)</Pill>} />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {insights.predictions.companies.slice(0, 9).map((c, i) => (
                      <motion.div key={c.company._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="flex items-center gap-3"><CompanyLogo company={c.company} size={34} className="rounded-lg" /><div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium text-zinc-100">{c.company.name}</div><div className="truncate font-mono text-[10px] text-zinc-600">{c.reason}</div></div>
                          <Ring value={c.probability / 100} size={46} stroke={5} color={c.probability >= 75 ? '#34d399' : c.probability >= 50 ? '#38bdf8' : '#fbbf24'}><span className="text-[11px] font-semibold text-zinc-100">{c.probability}%</span></Ring></div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5"><Pill tone={c.probability >= 75 ? 'green' : c.probability >= 50 ? 'blue' : 'amber'}>{c.label}</Pill>{c.expectedHires && <Pill tone="zinc">~{c.expectedHires} hires</Pill>}{c.lastPackageLpa && <Pill tone="zinc">{c.lastPackageLpa} LPA</Pill>}</div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-zinc-600"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Probability = recency-weighted visit frequency (half-life 2 years) with a Beta prior, so one visit never reads as certainty. It predicts campus visits, not offers.</p>
                </Card>
              </Reveal>
            )}

            {/* Skill demand heatmap */}
            <Reveal>
              <Card>
                <SectionTitle icon={Flame} title="Skill demand at your college" sub={`Share of ${insights.skillDemand.totalReports} interview reports (by year) that tested each skill.`} />
                {insights.skillDemand.totalReports === 0 ? <EmptyState icon={Flame} title="No reports from your college yet" text="Be the first to submit — it unlocks this heatmap for your batch." className="py-8" /> : (
                  <div className="overflow-x-auto"><table className="w-full min-w-[560px] border-separate border-spacing-1"><thead><tr><th className="pb-1 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-zinc-600">Skill</th>{insights.skillDemand.years.map((y) => <th key={y} className="pb-1 text-center font-mono text-[10px] font-medium text-zinc-500">{y}</th>)}<th className="pb-1 text-center font-mono text-[9.5px] font-medium uppercase tracking-wider text-zinc-500">All</th></tr></thead>
                    <tbody>{insights.skillDemand.rows.map((r) => (
                      <tr key={r.skill}><td className="pr-3 text-[12.5px] text-zinc-300">{r.skill}</td>
                        {r.byYear.map((c) => <td key={c.year} title={`${c.reports} report(s)`} className="rounded-md text-center font-mono text-[11px] text-zinc-100" style={{ background: HEAT(c.pct), height: 30 }}>{c.pct ? `${c.pct}%` : ''}</td>)}
                        <td className="rounded-md text-center font-mono text-[11px] font-semibold text-zinc-50" style={{ background: HEAT(r.overallPct) }}>{r.overallPct ? `${r.overallPct}%` : '—'}</td></tr>
                    ))}</tbody></table></div>
                )}
              </Card>
            </Reveal>

            {/* Skill gap + radar */}
            {insights.skillGap && (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Reveal>
                  <Card>
                    <SectionTitle icon={Target} title="Your skill gap" sub="Gap score = demand at your college × (1 − your mastery). Practice targets come from the BKT time-to-mastery model." />
                    <div className="space-y-2.5">
                      {insights.skillGap.items.length === 0 && <p className="py-6 text-center text-[12.5px] text-zinc-600">Not enough demand data yet.</p>}
                      {insights.skillGap.items.slice(0, 8).map((g) => (
                        <div key={g.skill} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2"><span className="text-[13.5px] font-medium text-zinc-100">{g.skill}</span><Pill tone={g.severity === 'critical' ? 'red' : g.severity === 'moderate' ? 'amber' : 'green'} icon={g.severity === 'minor' ? CheckCircle2 : AlertTriangle}>{g.severity}</Pill></div>
                            <Link to={`/problems?skill=${encodeURIComponent(g.skill)}`} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[var(--signal)]">Practise <ArrowUpRight className="h-3 w-3" /></Link>
                          </div>
                          <div className="mt-2.5 grid grid-cols-2 gap-3"><div><div className="mb-1 flex justify-between font-mono text-[10px] text-zinc-500"><span>Demand</span><span>{g.demandPct}%</span></div><Bar value={g.demandPct} max={100} height={4} color="#a78bfa" /></div><div><div className="mb-1 flex justify-between font-mono text-[10px] text-zinc-500"><span>Your mastery</span><span>{Math.round(g.mastery * 100)}%</span></div><Bar value={g.mastery} max={1} height={4} color={g.mastery >= 0.7 ? '#34d399' : '#fbbf24'} /></div></div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-zinc-500">{g.practiceTarget != null && g.practiceTarget > 0 && <span>Recommended: <b className="text-zinc-300">~{g.practiceTarget} more solid problems</b></span>}{g.percentile != null && <span>Top <b className="text-zinc-300">{Math.max(1, 100 - g.percentile)}%</b> at your college</span>}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Reveal>
                <Reveal delay={0.06}>
                  <div className="space-y-6">
                    <Card>
                      <SectionTitle icon={Users} title="You vs college average" sub={insights.peers ? `Anonymised · ${insights.peers.peerCount} peers` : ''} />
                      {radar.length > 0 && <div className="h-64"><ResponsiveContainer><RadarChart data={radar} outerRadius="70%"><PolarGrid stroke="rgba(255,255,255,0.08)" /><PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} /><Radar name="College avg" dataKey="peers" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} strokeDasharray="4 4" /><Radar name="You" dataKey="you" stroke="#34d399" fill="#34d399" fillOpacity={0.3} strokeWidth={2} /><Tooltip {...chartTooltipStyle} formatter={(v) => `${v}%`} /><Legend wrapperStyle={{ fontSize: 11 }} /></RadarChart></ResponsiveContainer></div>}
                    </Card>
                    {topPercentiles.length > 0 && (
                      <Card>
                        <SectionTitle icon={Award} title="Where you stand" />
                        <div className="space-y-2">{[...topPercentiles.slice(0, 2), ...topPercentiles.slice(-1)].filter((p, i, a) => a.findIndex((x) => x.skillId === p.skillId) === i).map((p) => (
                          <div key={p.skillId} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[12.5px]"><span className="text-zinc-300">{p.name}</span><span className={cn('font-mono', p.percentile >= 60 ? 'text-emerald-400' : p.percentile >= 30 ? 'text-amber-400' : 'text-rose-400')}>Top {Math.max(1, 100 - p.percentile)}% at {insights.peers.scope}</span></div>
                        ))}</div>
                        <p className="mt-3 text-[11.5px] leading-relaxed text-zinc-600">e.g. “You are in the top {Math.max(1, 100 - (topPercentiles[0]?.percentile || 50))}% of students at {insights.peers.scope} for {topPercentiles[0]?.name}.”</p>
                      </Card>
                    )}
                  </div>
                </Reveal>
              </div>
            )}

            {/* Companies with intel + topics */}
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Reveal>
                <Card>
                  <SectionTitle icon={Building2} title="Companies with interview reports from your college" sub="Click for college-scoped prep priorities merged with your BKT mastery." />
                  {dash.companies.length ? <div className="grid gap-3 md:grid-cols-2">{dash.companies.slice(0, 8).map((c) => (
                    <Link key={c.company._id} to={`/placement/companies/${c.company.slug}`} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]">
                      <div className="flex items-center gap-3"><CompanyLogo company={c.company} size={34} className="rounded-lg" /><div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium text-zinc-100 group-hover:text-[var(--signal)]">{c.company.name}</div><div className="font-mono text-[10px] text-zinc-600">{c.experienceCount} report{c.experienceCount !== 1 ? 's' : ''}{c.yearsActive?.length ? ` · ${c.yearsActive.slice(0, 3).join(', ')}` : ''}</div></div>{c.latestOfferRate != null && <div className="text-right"><div className="text-[15px] font-semibold text-zinc-100">{c.latestOfferRate}%</div><div className="font-mono text-[8.5px] uppercase text-zinc-600">offers</div></div>}</div>
                      {c.topTopics?.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1">{c.topTopics.slice(0, 4).map((t) => <span key={t.topic} className="rounded bg-[var(--signal)]/10 px-1.5 py-0.5 text-[10px] text-[var(--signal)]">{t.topic}</span>)}</div>}
                    </Link>
                  ))}</div> : <EmptyState icon={Building2} title="No reports from your college yet" text="Share your interview experience to help your juniors." className="py-8" action={<button onClick={() => setShowSubmit(true)} className="rounded-lg bg-[var(--signal)]/15 px-4 py-2 text-[12px] text-[var(--signal)]">Submit experience</button>} />}
                </Card>
              </Reveal>
              <Reveal delay={0.06}>
                <Card className="h-full">
                  <SectionTitle icon={Target} title="Top topics asked here" />
                  <div className="space-y-3">{dash.topTopics.slice(0, 10).map((t) => <div key={t.topic}><div className="mb-1 flex justify-between text-[12.5px]"><span className="text-zinc-300">{t.topic}</span><span className="font-mono text-zinc-500">{t.count}</span></div><Bar value={t.count} max={dash.topTopics[0]?.count || 1} height={4} color="#a78bfa" /></div>)}{!dash.topTopics.length && <p className="text-[12.5px] text-zinc-600">No topics yet.</p>}</div>
                </Card>
              </Reveal>
            </div>
          </>
        )}
      </div>

      {showSubmit && <SubmitExperienceModal companies={[]} onClose={() => setShowSubmit(false)} onSuccess={() => college?.slug && load(college.slug)} />}
    </div>
  );
}
