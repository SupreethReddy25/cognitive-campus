import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collegesService, usersService } from '../services/api';
import { CollegeSelector } from '../components/placement/CollegeSelector';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { Page, PrimaryButton, CompanyLogo, Skeleton, ErrorNote, CountUp, chartTooltipStyle, cn } from '../components/ui/kit';

const CONF = { none: 'no data yet', low: 'low confidence', medium: 'medium confidence', high: 'high confidence' };

function Section({ title, kicker, children, className = '' }) {
  return (
    <section className={cn('pt-24', className)}>
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-[var(--line-strong)] pb-4">
        <h2 className="display text-[clamp(36px,4.6vw,60px)] text-zinc-50">{title}</h2>
        {kicker && <div className="hidden max-w-sm pb-1.5 text-right text-[13px] leading-snug text-zinc-500 md:block">{kicker}</div>}
      </div>
      {children}
    </section>
  );
}

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
    <div className="mx-auto max-w-2xl pt-28 text-center">
      <div className="text-[13px] text-zinc-500">Placement · college intelligence</div>
      <h1 className="display mt-5 text-[clamp(46px,7vw,88px)] text-zinc-50">Where do you <em className="text-[var(--ember)]">study</em>?</h1>
      <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-zinc-400">Pick your college and this page becomes yours: who recruits there, how hiring is moving, what they test, and where your mastery falls short.</p>
      <div className="mx-auto mt-10 max-w-md text-left"><CollegeSelector value={null} onChange={pick} placeholder="Search — NIT Trichy, VIT, IIIT Hyderabad…" disabled={saving} /></div>
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
  const pred = insights?.predictions;
  const topPercentile = useMemo(() => (insights?.peers?.perSkill || []).filter((p) => p.percentile != null).sort((a, b) => b.percentile - a.percentile)[0], [insights]);

  const official = insights?.college?.placementSummary;
  const officialFigures = [];
  if (official) {
    if (official.placed) officialFigures.push({ label: 'students placed', value: official.placed.toLocaleString('en-IN') });
    if (official.placedPct) officialFigures.push({ label: 'placement rate', value: official.placedPct, unit: '%' });
    if (official.medianLpa) officialFigures.push({ label: 'median package (LPA)', value: official.medianLpa });
    if (official.avgLpa) officialFigures.push({ label: 'average package (LPA)', value: official.avgLpa });
    if (official.highestLpa) officialFigures.push({ label: 'highest package (LPA)', value: official.highestLpa });
    if (official.offers && officialFigures.length < 4) officialFigures.push({ label: 'offers made', value: official.offers.toLocaleString('en-IN') });
    if (official.companies && officialFigures.length < 4) officialFigures.push({ label: 'companies', value: official.companies });
    officialFigures.length = Math.min(officialFigures.length, 4);
  }

  if (!college) return <Page><CollegeGate onSelected={refreshUser} /></Page>;

  return (
    <Page>
      {error && <div className="pt-16"><ErrorNote>{error}</ErrorNote></div>}
      {loading && <div className="space-y-6 pt-20"><Skeleton className="h-56" /><Skeleton className="h-80" /></div>}

      {insights && dash && (
        <>
          <header className="pt-14 md:pt-20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-[13px] text-zinc-500">Placement · {insights.college.tier} · {insights.college.location}{insights.college.nirfRank ? ` · NIRF ${insights.college.nirfYear} engineering #${insights.college.nirfRank}` : ''} · {CONF[dash.dataConfidence]} <button onClick={changeCollege} className="ml-2 text-zinc-600 underline-offset-2 hover:text-zinc-300 hover:underline">change</button></div>
              <PrimaryButton onClick={() => setShowSubmit(true)} icon={Plus}>Add your experience</PrimaryButton>
            </div>
            <h1 className="display mt-6 text-[clamp(44px,7.4vw,112px)] leading-[0.95] text-zinc-50">{insights.college.name}</h1>
            {insights.skillGap && <p className="mt-8 max-w-3xl text-[clamp(20px,2.2vw,28px)] leading-[1.4] text-zinc-400">{insights.skillGap.headline}</p>}

            {official ? (
              <div className="mt-14">
                <div className="grid grid-cols-2 gap-x-10 gap-y-10 lg:grid-cols-4">
                  {officialFigures.map((f) => (
                    <div key={f.label} className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[72px] leading-none tnum text-zinc-50">{f.value}{f.unit && <span className="text-[28px] text-zinc-500">{f.unit}</span>}</div><div className="mt-3 text-[13px] text-zinc-500">{f.label}</div></div>
                  ))}
                </div>
                <p className="mt-6 max-w-3xl text-[12.5px] leading-relaxed text-zinc-600">
                  {official.season} · {official.scope}. {official.note ? `${official.note} ` : ''}Source:{' '}
                  {official.source?.url ? <a href={official.source.url} target="_blank" rel="noreferrer" className="text-zinc-400 underline-offset-2 hover:text-[var(--ember)] hover:underline">{official.source.name}</a> : official.source?.name}. Figures are as published and rounded; check the institute&apos;s own report before quoting them.
                </p>
              </div>
            ) : (
            <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-10 lg:grid-cols-4">
              <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[72px] leading-none tnum text-zinc-50"><CountUp value={latest?.hires || 0} /></div><div className="mt-3 text-[13px] text-zinc-500">hired in {latest?.year}{prev && <span className={cn('ml-1.5', latest.hires >= prev.hires ? 'text-emerald-400' : 'text-rose-400')}>{latest.hires >= prev.hires ? '+' : ''}{latest.hires - prev.hires} vs {prev.year}</span>}</div></div>
              <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[72px] leading-none tnum text-zinc-50">{latest?.avgPackage ? <CountUp value={latest.avgPackage} decimals={1} /> : '—'}</div><div className="mt-3 text-[13px] text-zinc-500">avg LPA{latest?.topPackage ? ` · top ${latest.topPackage} at ${latest.topPackageCompany}` : ''}</div></div>
              <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[72px] leading-none tnum text-zinc-50"><CountUp value={insights.topRecruiters.length} /></div><div className="mt-3 text-[13px] text-zinc-500">regular recruiters</div></div>
              <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[72px] leading-none tnum text-zinc-50"><CountUp value={dash.stats.totalExperiences} /></div><div className="mt-3 text-[13px] text-zinc-500">interview reports{dash.stats.overallOfferRate != null ? ` · ${dash.stats.overallOfferRate}% offers` : ''}</div></div>
            </div>
            )}
          </header>

          {/* trajectory */}
          <Section title={<>The <em>trajectory</em></>} kicker="Modelled from typical recruiter patterns — an illustration until your placement cell uploads real records. Bars: students hired; line: average package (LPA).">
            <div className="grid gap-16 lg:grid-cols-[1.6fr_1fr]">
              <div className="h-72"><ResponsiveContainer><ComposedChart data={insights.hiringTrends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(236,230,216,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#7a7466', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" tick={{ fill: '#5b564b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: '#5b564b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <RBar yAxisId="l" dataKey="hires" name="Students hired" fill="#f2c66d" fillOpacity={0.28} radius={[8, 8, 0, 0]} barSize={40} />
                <Line yAxisId="r" dataKey="avgPackage" name="Avg package (LPA)" stroke="#ff7a4d" strokeWidth={2.4} dot={{ r: 4.5, fill: '#0c0c10', stroke: '#ff7a4d', strokeWidth: 2 }} connectNulls />
              </ComposedChart></ResponsiveContainer></div>
              <div>
                <div className="mb-4 text-[13px] text-zinc-500">Most reliable recruiters</div>
                {insights.topRecruiters.slice(0, 6).map((r, i) => (
                  <Link key={r.company._id} to={`/placement/companies/${r.company.slug}`} className="group flex items-center gap-4 border-b border-[var(--line)] py-3">
                    <span className="w-5 text-[13px] tnum text-zinc-700">{i + 1}</span>
                    <span className="flex-1 truncate text-[17px] text-zinc-200 transition-colors group-hover:text-[var(--ember)]">{r.company.name}</span>
                    <span className="text-[13px] tnum text-zinc-500">{r.totalHires} hires</span>
                  </Link>
                ))}
              </div>
            </div>
          </Section>

          {/* who visits next */}
          {pred?.companies?.length > 0 && (
            <Section title={<>Who&apos;s coming in <em>{pred.year}</em></>} kicker={<>Illustrative: computed from modelled visit history (recency-weighted, Bayesian prior). It predicts campus visits, not offers.{pred.hiresTrendPct != null && <> Hiring is <span className={pred.hiresTrendPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{pred.hiresTrendPct >= 0 ? '+' : ''}{pred.hiresTrendPct}%</span> over three years.</>}</>}>
              <ol className="grid gap-x-16 md:grid-cols-2">
                {pred.companies.slice(0, 8).map((c, i) => (
                  <motion.li key={c.company._id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05 }}>
                    <Link to={`/placement/companies/${c.company.slug}`} className="group flex items-center gap-5 border-b border-[var(--line)] py-5">
                      <span className="display w-[92px] shrink-0 text-[52px] leading-none tnum" style={{ color: c.probability >= 75 ? '#fff1cf' : c.probability >= 50 ? '#f2c66d' : '#c9683f' }}>{c.probability}<span className="text-[20px] opacity-60">%</span></span>
                      <span className="min-w-0 flex-1">
                        <span className="display block truncate text-[30px] leading-tight text-zinc-100 transition-colors group-hover:text-[var(--ember)]">{c.company.name}</span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-zinc-500">{c.label}{c.expectedHires ? ` · ~${c.expectedHires} hires` : ''}{c.lastPackageLpa ? ` · ${c.lastPackageLpa} LPA` : ''}</span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ol>
            </Section>
          )}

          {/* what they test — bubble matrix */}
          <Section title={<>What they <em>test</em> here</>} kicker={`Share of ${insights.skillDemand.totalReports} interview reports, by year, that tested each skill. Bigger bubble = more often.`}>
            {insights.skillDemand.totalReports === 0 ? (
              <div className="py-8 text-[16px] text-zinc-500">No reports from your college yet. <button onClick={() => setShowSubmit(true)} className="text-[var(--ember)] hover:underline">Be the first</button> — it unlocks this view for your whole batch.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-separate border-spacing-0">
                  <thead><tr><th className="pb-3 text-left text-[12px] font-normal text-zinc-600" />{insights.skillDemand.years.map((y) => <th key={y} className="pb-3 text-center text-[12px] font-normal tnum text-zinc-500">{y}</th>)}<th className="pb-3 text-center text-[12px] font-normal text-zinc-500">Overall</th></tr></thead>
                  <tbody>{insights.skillDemand.rows.map((r) => (
                    <tr key={r.skill} className="group">
                      <td className="border-t border-[var(--line)] py-1.5 pr-6 text-[16px] text-zinc-300 group-hover:text-zinc-50">{r.skill}</td>
                      {r.byYear.map((c) => (
                        <td key={c.year} title={`${c.pct}% · ${c.reports} report(s)`} className="border-t border-[var(--line)] py-1.5 text-center">
                          <span className="mx-auto block rounded-full" style={{ width: 6 + c.pct * 0.34, height: 6 + c.pct * 0.34, background: c.pct ? `rgba(255,122,77,${0.25 + c.pct / 130})` : 'rgba(236,230,216,0.06)' }} />
                        </td>
                      ))}
                      <td className="border-t border-[var(--line)] py-1.5 text-center text-[15px] tnum text-zinc-200">{r.overallPct ? `${r.overallPct}%` : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Section>

          {/* your gap */}
          {insights.skillGap && insights.skillGap.items.length > 0 && (
            <Section title={<>Your <em>gap</em></>} kicker={<>Demand at your college × (1 − your mastery).{topPercentile && insights.peers && <> You&apos;re in the top {Math.max(1, 100 - topPercentile.percentile)}% at {insights.peers.scope} for {topPercentile.name}.</>}</>}>
              <div>
                {insights.skillGap.items.slice(0, 5).map((g) => (
                  <div key={g.skill} className="grid items-center gap-x-12 gap-y-3 border-b border-[var(--line)] py-6 md:grid-cols-[1fr_1.2fr_auto]">
                    <div><div className="display text-[36px] leading-none text-zinc-100">{g.skill}</div><div className={cn('mt-2 text-[12.5px]', g.severity === 'critical' ? 'text-rose-400' : g.severity === 'moderate' ? 'text-amber-400' : 'text-emerald-400')}>{g.severity} gap{g.practiceTarget > 0 ? <span className="text-zinc-500"> · ~{g.practiceTarget} more solid problems</span> : ''}</div></div>
                    <div className="space-y-3">
                      <div><div className="mb-1 flex justify-between text-[12px] text-zinc-500"><span>asked in</span><span className="tnum">{g.demandPct}% of reports</span></div><div className="h-[3px] rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-[var(--ember)]" initial={{ width: 0 }} whileInView={{ width: `${g.demandPct}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div></div>
                      <div><div className="mb-1 flex justify-between text-[12px] text-zinc-500"><span>your mastery</span><span className="tnum">{Math.round(g.mastery * 100)}%</span></div><div className="h-[3px] rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-[var(--star)]" initial={{ width: 0 }} whileInView={{ width: `${g.mastery * 100}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div></div>
                    </div>
                    <Link to={`/problems?skill=${encodeURIComponent(g.skill)}`} className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-[13.5px] text-zinc-300 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]">Practise <ArrowUpRight className="h-4 w-4" /></Link>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* reports from your college */}
          <Section title={<>Told by <em>your</em> seniors</>} kicker="Interview reports from students at your own college — open one for prep priorities merged with your mastery.">
            {dash.companies.length ? (
              <ol className="grid gap-x-16 md:grid-cols-2">
                {dash.companies.slice(0, 8).map((c) => (
                  <li key={c.company._id}>
                    <Link to={`/placement/companies/${c.company.slug}`} className="group flex items-center gap-4 border-b border-[var(--line)] py-5">
                      <CompanyLogo company={c.company} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="display block truncate text-[28px] leading-tight text-zinc-100 transition-colors group-hover:text-[var(--ember)]">{c.company.name}</span>
                        <span className="block truncate text-[12.5px] text-zinc-500">{c.experienceCount} report{c.experienceCount !== 1 ? 's' : ''}{c.topTopics?.length ? ` · ${c.topTopics.slice(0, 3).map((t) => t.topic).join(', ')}` : ''}</span>
                      </span>
                      {c.latestOfferRate != null && <span className="text-right"><span className="display block text-[30px] leading-none tnum text-zinc-200">{c.latestOfferRate}%</span><span className="text-[11px] text-zinc-600">offers</span></span>}
                    </Link>
                  </li>
                ))}
              </ol>
            ) : <div className="py-6 text-[16px] text-zinc-500">Nobody from your college has shared yet. <button onClick={() => setShowSubmit(true)} className="text-[var(--ember)] hover:underline">Be the first — help your juniors.</button></div>}
            {dash.topTopics.length > 0 && <div className="mt-12"><div className="mb-3 text-[13px] text-zinc-500">Topics that keep coming up here</div><div className="flex flex-wrap gap-2">{dash.topTopics.slice(0, 12).map((t) => <span key={t.topic} className="rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-[14px] text-zinc-300">{t.topic} <span className="tnum text-zinc-600">{t.count}</span></span>)}</div></div>}
          </Section>
        </>
      )}

      {showSubmit && <SubmitExperienceModal companies={[]} onClose={() => setShowSubmit(false)} onSuccess={() => college?.slug && load(college.slug)} />}
    </Page>
  );
}
