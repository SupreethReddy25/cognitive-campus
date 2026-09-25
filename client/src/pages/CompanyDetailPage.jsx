import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar as RBar, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Line, Legend
} from 'recharts';
import {
  ArrowLeft, Plus, Sparkles, ThumbsUp, ThumbsDown, ChevronDown, ShieldCheck, Clock, Users, Target, Trophy, BookOpen, Loader2, KeyRound,
  MapPin, Search, CheckCircle2, Info, Wand2, ListChecks, Building2, Gauge, FileText, Layers
} from 'lucide-react';
import { companiesService, experiencesService, skillsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { Card, Label, SectionTitle, CompanyLogo, TierBadge, Pill, DiffPill, Bar, Ring, Skeleton, EmptyState, ErrorNote, CountUp, chartTooltipStyle, CHART_COLORS, cn } from '../components/ui/kit';

const TABS = [['overview', 'Overview', Gauge], ['process', 'Process', Layers], ['topics', 'Topics & questions', Target], ['experiences', 'Experiences', FileText], ['prep', 'Prep plan', Wand2]];
const BUCKET_COLOR = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#fb7185' };
const CONF = { none: ['No data', 'zinc'], low: ['Low confidence', 'red'], medium: ['Medium confidence', 'amber'], high: ['High confidence', 'green'] };

// ─── Experience card ─────────────────────────────────────────────────────────
function ExperienceCard({ exp, onVote }) {
  const [open, setOpen] = useState(false);
  const qCount = exp.rounds?.reduce((n, r) => n + (r.questions?.length || 0), 0) || 0;
  return (
    <Card padded={false} className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14.5px] font-semibold text-zinc-100">{exp.role}</span>
            <Pill tone={exp.offerReceived === 'Yes' ? 'green' : exp.offerReceived === 'No' ? 'red' : 'amber'}>{exp.offerReceived === 'Yes' ? 'Offer' : exp.offerReceived === 'No' ? 'No offer' : 'Pending'}</Pill>
            {exp.difficulty && <Pill tone="zinc">{exp.difficulty}</Pill>}
            {exp.isVerified && <Pill tone="blue" icon={ShieldCheck}>Verified</Pill>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-zinc-500">
            <span>{exp.month} {exp.year}</span>
            {(exp.collegeId?.shortName || exp.college) && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{exp.collegeId?.shortName || exp.college}</span>}
            <span>{exp.rounds?.length || 0} rounds · {qCount} questions</span>
            <span>{exp.author ? `by ${exp.author}` : 'Anonymous'}</span>
          </div>
          {!open && exp.overallTips && <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-zinc-500">{exp.overallTips}</p>}
        </div>
        <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-zinc-600 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.05]">
            <div className="space-y-4 p-5">
              {exp.compensation && (exp.compensation.base || exp.compensation.bonus || exp.compensation.stock) && (
                <div className="flex flex-wrap gap-2">{[['Base', exp.compensation.base], ['Bonus', exp.compensation.bonus], ['Stock', exp.compensation.stock]].filter(([, v]) => v).map(([k, v]) => <span key={k} className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1 font-mono text-[11px] text-emerald-300">{k}: {v}</span>)}</div>
              )}
              {exp.rounds?.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--signal)]/15 font-mono text-[10px] text-[var(--signal)]">{i + 1}</span><b className="text-[13px] text-zinc-200">{r.type}</b>{r.duration && <span className="flex items-center gap-1 font-mono text-[10.5px] text-zinc-500"><Clock className="h-3 w-3" />{r.duration}</span>}{r.vibe && <Pill tone="zinc">{r.vibe}</Pill>}</div>
                  {r.topics?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{r.topics.map((t) => <span key={t} className="rounded bg-[var(--signal)]/10 px-1.5 py-0.5 text-[10.5px] text-[var(--signal)]">{t}</span>)}</div>}
                  {r.questions?.filter((q) => q.text).map((q, j) => (
                    <div key={j} className="mt-2.5 border-l-2 border-white/10 pl-3"><div className="text-[12.5px] leading-relaxed text-zinc-300">{q.text}</div><div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wider text-zinc-600">{q.questionType}{q.topicTags?.length ? ` · ${q.topicTags.join(', ')}` : ''}</div></div>
                  ))}
                  {r.tips && <p className="mt-3 text-[12px] italic leading-relaxed text-zinc-500">“{r.tips}”</p>}
                </div>
              ))}
              {exp.overallTips && <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4 text-[12.5px] leading-relaxed text-emerald-100/80"><b className="text-emerald-300">Advice · </b>{exp.overallTips}</div>}
              {exp.resourcesUsed && <div className="text-[11.5px] text-zinc-500"><b className="text-zinc-400">Resources:</b> {exp.resourcesUsed}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-white/[0.05] bg-white/[0.015] px-5 py-2">
        <div className="flex items-center gap-1">
          <button onClick={() => onVote(exp, 'up')} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] transition-colors', exp.userVote === 'up' ? 'bg-emerald-400/15 text-emerald-300' : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200')}><ThumbsUp className="h-3.5 w-3.5" />{exp.upvotes}</button>
          <button onClick={() => onVote(exp, 'down')} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] transition-colors', exp.userVote === 'down' ? 'bg-rose-400/15 text-rose-300' : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200')}><ThumbsDown className="h-3.5 w-3.5" />{exp.downvotes}</button>
        </div>
        {exp.qualityScore != null && <span className="font-mono text-[10px] text-zinc-600">quality {exp.qualityScore}/100</span>}
      </div>
    </Card>
  );
}

// ─── Prep plan ──────────────────────────────────────────────────────────────
function PrepPlan({ slug, companyName }) {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await companiesService.generatePrepPlan(slug, days);
      setPlan(r.data.data);
    } catch (e) {
      toast.error('Could not build the plan', e.response?.data?.error);
    } finally { setLoading(false); }
  };

  const TYPE = { practice: ['Practice', 'green'], review: ['Review', 'blue'], mock: ['Mock', 'violet'], behavioral: ['Behavioural', 'amber'], study: ['Study', 'blue'], read: ['Read', 'zinc'] };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><SectionTitle icon={Wand2} title="Personalised prep plan" sub={`Built from real ${companyName} interview statistics and your live BKT mastery. An AI coach polishes the narrative when available.`} className="mb-0" /></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] p-[3px]">{[14, 30, 45, 60].map((d) => <button key={d} onClick={() => setDays(d)} className={cn('rounded-md px-3 py-1.5 font-mono text-[10.5px] transition-colors', days === d ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{d}d</button>)}</div>
            <button onClick={generate} disabled={loading} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:brightness-110 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{plan ? 'Regenerate' : 'Generate plan'}</button>
          </div>
        </div>
      </Card>

      {!plan && !loading && <EmptyState icon={ListChecks} title="No plan yet" text="Pick a horizon and generate — the plan targets the topics this company asks most where your mastery is lowest." />}
      {loading && <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>}

      {plan && !loading && (
        <>
          {plan.ai && !plan.ai.used && (
            <div className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-[12.5px]', plan.ai.needsKey ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100' : 'border-white/10 bg-white/[0.03] text-zinc-400')}>
              {plan.ai.needsKey ? <KeyRound className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>{plan.ai.message} <span className="text-zinc-500">The plan below is the data-driven version — every number and problem link is real.</span> {plan.ai.needsKey && <Link to="/profile#ai" className="font-semibold underline underline-offset-2">Add your Gemini key</Link>}</div>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card>
              <div className="flex items-center gap-5">
                <Ring value={plan.readiness / 100} size={104} stroke={9} color={plan.readiness >= 70 ? '#34d399' : plan.readiness >= 40 ? '#fbbf24' : '#fb7185'}><div className="text-center"><div className="text-[26px] font-semibold tabular-nums text-zinc-100">{plan.readiness}</div><div className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">ready</div></div></Ring>
                <p className="text-[13px] leading-relaxed text-zinc-400">{plan.summary}</p>
              </div>
              <div className="mt-6"><Label className="mb-3 block text-zinc-500">Focus areas · frequency × (1 − mastery)</Label>
                <div className="space-y-3">{plan.focusAreas.slice(0, 7).map((f) => (
                  <div key={f.skill}>
                    <div className="mb-1 flex items-center justify-between text-[12px]"><span className="text-zinc-300">{f.skill}</span><span className="flex items-center gap-2 font-mono text-[10.5px] text-zinc-500">{f.frequencyPct}% of reports · you {Math.round(f.mastery * 100)}%<Pill tone={f.level === 'high' ? 'red' : f.level === 'medium' ? 'amber' : 'green'}>{f.level}</Pill></span></div>
                    <div className="grid grid-cols-2 gap-1.5"><Bar value={f.frequencyPct} max={100} height={4} color="#a78bfa" /><Bar value={f.mastery} max={1} height={4} color="#34d399" /></div>
                  </div>
                ))}</div>
                <div className="mt-2 flex gap-4 font-mono text-[9.5px] text-zinc-600"><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-violet-400" /> company demand</span><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-emerald-400" /> your mastery</span></div>
              </div>
            </Card>

            <div className="space-y-4">
              {plan.phases.map((ph, i) => (
                <Card key={i}>
                  <div className="mb-3 flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-400/15 font-mono text-[11px] text-violet-300">{i + 1}</span><span className="text-[15px] font-semibold text-zinc-100">{ph.name}</span></div><p className="mt-1 text-[12px] text-zinc-500">{ph.goal}</p></div><Pill tone="zinc">Days {ph.days}</Pill></div>
                  <div className="space-y-2.5">
                    {ph.tasks.map((t, j) => { const [label, tone] = TYPE[t.type] || TYPE.study; return (
                      <div key={j} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex items-start gap-2.5"><Pill tone={tone}>{label}</Pill><p className="text-[12.5px] leading-relaxed text-zinc-300">{t.text}</p></div>
                        {t.problems?.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5 pl-1">{t.problems.map((p) => <Link key={p._id} to={`/problems/${p._id}`} className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[11.5px] text-zinc-300 transition-colors hover:border-[var(--signal)]/40 hover:text-[var(--signal)]">{p.title}<DiffPill difficulty={p.difficulty} className="scale-90" /></Link>)}</div>}
                      </div>
                    ); })}
                  </div>
                </Card>
              ))}
              <Card><Label className="mb-2 block text-zinc-500">Coach tips</Label><ul className="space-y-2">{plan.tips.map((t, i) => <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-zinc-400"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />{t}</li>)}</ul></Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [related, setRelated] = useState({ data: [], matchedTopics: [] });
  const [mastery, setMastery] = useState({});
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const [expFilter, setExpFilter] = useState({ offer: 'All', sort: 'recent', q: '' });
  const [qFilter, setQFilter] = useState({ type: 'All', q: '' });

  const loadExperiences = () => companiesService.getCompanyExperiences(slug).then((r) => setExperiences(r.data.data));
  const loadStats = () => companiesService.getCompanyStats(slug).then((r) => setStats(r.data.data));

  useEffect(() => {
    setLoading(true);
    Promise.all([companiesService.getCompany(slug), companiesService.getCompanyStats(slug), companiesService.getCompanyExperiences(slug), companiesService.getRelatedProblems(slug), skillsService.getMySkillStates()])
      .then(([c, s, e, rel, st]) => {
        setCompany(c.data.data); setStats(s.data.data); setExperiences(e.data.data); setRelated(rel.data);
        const m = {}; st.data.data.skillStates.forEach((x) => { if (x.skillId?.name) m[x.skillId.name] = x.masteryP; }); setMastery(m);
      })
      .catch((e) => setError(e.response?.status === 404 ? 'Company not found.' : 'Could not load this company.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const vote = async (exp, v) => {
    try {
      const r = await experiencesService.vote(exp._id, v);
      setExperiences((list) => list.map((e) => (e._id === exp._id ? { ...e, ...r.data.data } : e)));
    } catch { toast.error('Sign in to vote'); }
  };

  const filteredExps = useMemo(() => {
    let list = experiences.filter((e) => (expFilter.offer === 'All' || e.offerReceived === expFilter.offer) && (!expFilter.q || `${e.role} ${e.overallTips || ''} ${e.rounds?.map((r) => r.questions?.map((q) => q.text).join(' ')).join(' ')}`.toLowerCase().includes(expFilter.q.toLowerCase())));
    if (expFilter.sort === 'top') list = [...list].sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
    if (expFilter.sort === 'quality') list = [...list].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    return list;
  }, [experiences, expFilter]);

  const allQuestions = useMemo(() => experiences.flatMap((e) => (e.rounds || []).flatMap((r) => (r.questions || []).filter((q) => q.text).map((q) => ({ ...q, round: r.type, year: e.year, offer: e.offerReceived })))), [experiences]);
  const filteredQs = allQuestions.filter((q) => (qFilter.type === 'All' || q.questionType === qFilter.type) && (!qFilter.q || `${q.text} ${(q.topicTags || []).join(' ')}`.toLowerCase().includes(qFilter.q.toLowerCase())));

  if (loading) return <div className="space-y-6 px-6 py-8 md:px-10"><Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-96" /></div>;
  if (error || !company) return <div className="p-10"><Link to="/intel" className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Intel Hub</Link><ErrorNote>{error || 'Company not found.'}</ErrorNote></div>;

  const conf = CONF[stats.dataConfidence] || CONF.none;
  const topics = stats.topTopics.slice(0, 12);
  const pieData = stats.difficultyBuckets.filter((b) => b.count > 0);
  const pieTotal = pieData.reduce((n, b) => n + b.count, 0);

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <Link to="/intel" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 transition-colors hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Intel Hub <span className="text-zinc-700">/</span> <span className="text-zinc-300">{company.name}</span></Link>
        <button onClick={() => setShowSubmit(true)} className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-[var(--signal)] transition-colors hover:bg-[var(--signal)]/20"><Plus className="h-3.5 w-3.5" /> Submit experience</button>
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        {/* Dossier header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0d1218] via-[#0b0f15] to-[#0a0d13] p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-500/[0.07] blur-[80px]" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <CompanyLogo company={company} size={72} className="rounded-2xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[32px] font-semibold leading-none tracking-tight text-zinc-50">{company.name}</h1><TierBadge tier={company.tier} /><Pill tone={conf[1]}>{conf[0]}</Pill></div>
                {company.headquarters && <div className="mt-2 flex items-center gap-1.5 text-[12px] text-zinc-500"><MapPin className="h-3.5 w-3.5" />{company.headquarters}</div>}
                {company.description && <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-zinc-400">{company.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">{(company.roles || []).map((r) => <span key={r} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400">{r}</span>)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"><Label className="text-zinc-600">CTC</Label><div className="mt-1 font-mono text-[15px] text-zinc-100">{company.ctcMin != null ? `${company.ctcMin}–${company.ctcMax}` : '—'} <span className="text-[10px] text-zinc-500">LPA</span></div></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"><Label className="text-zinc-600">Reports</Label><div className="mt-1 text-[19px] font-semibold text-zinc-100"><CountUp value={stats.totalReports} /></div></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3"><Label className="text-zinc-600">Avg rounds</Label><div className="mt-1 text-[19px] font-semibold text-zinc-100">{stats.avgRounds || company.interviewProcess?.rounds?.length || '—'}</div></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3" title={stats.offerRateCI ? `95% CI ${stats.offerRateCI.low}–${stats.offerRateCI.high}% (n=${stats.offerKnown})` : ''}><Label className="text-zinc-600">Offer rate</Label><div className="mt-1 text-[19px] font-semibold text-zinc-100">{stats.offerRate != null ? `${stats.offerRate}%` : '—'}</div>{stats.offerRateCI && <div className="font-mono text-[9.5px] text-zinc-600">{stats.offerRateCI.low}–{stats.offerRateCI.high}% CI</div>}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {TABS.map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={cn('flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium transition-colors', tab === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}><I className="h-3.5 w-3.5" />{l}{k === 'experiences' && <span className="rounded bg-white/[0.08] px-1.5 font-mono text-[10px] text-zinc-400">{experiences.length}</span>}</button>)}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <SectionTitle icon={Gauge} title="Difficulty distribution" sub={pieTotal ? `How ${pieTotal} candidates rated it` : 'No ratings yet'} />
                {pieTotal ? (
                  <div className="flex items-center gap-4"><div className="h-44 w-44 shrink-0"><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="count" nameKey="label" innerRadius="58%" outerRadius="92%" paddingAngle={3} stroke="none" isAnimationActive animationDuration={1000}>{pieData.map((b) => <Cell key={b.label} fill={BUCKET_COLOR[b.label]} />)}</Pie><Tooltip {...chartTooltipStyle} formatter={(v, n) => [`${v} reports`, n]} /></PieChart></ResponsiveContainer></div>
                    <div className="space-y-2.5">{pieData.map((b) => <div key={b.label} className="flex items-center gap-2 text-[12.5px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKET_COLOR[b.label] }} /><span className="text-zinc-300">{b.label}</span><span className="font-mono text-zinc-500">{b.pct}%</span></div>)}
                      {stats.difficultyDistribution.length > 0 && <div className="pt-1 font-mono text-[9.5px] leading-relaxed text-zinc-600">{stats.difficultyDistribution.map((d) => `${d.label} ${d.count}`).join(' · ')}</div>}</div></div>
                ) : <EmptyState icon={Gauge} title="No difficulty ratings" className="py-8" />}
              </Card>

              <Card className="lg:col-span-2">
                <SectionTitle icon={Trophy} title="Reports & offer rate by year" sub="Bars: number of reports. Line: % of decided candidates who received an offer." />
                {stats.yearTrend.length ? (
                  <div className="h-48"><ResponsiveContainer><ComposedChart data={stats.yearTrend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="year" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis yAxisId="l" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} /><YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} /><Tooltip {...chartTooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /><RBar yAxisId="l" dataKey="reports" name="Reports" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={26} /><Line yAxisId="r" dataKey="offerRate" name="Offer rate %" stroke="#34d399" strokeWidth={2.2} dot={{ r: 4, fill: '#34d399' }} connectNulls /></ComposedChart></ResponsiveContainer></div>
                ) : <EmptyState icon={Trophy} title="Not enough data" className="py-8" />}
              </Card>
            </div>

            {stats.offerRateCI && (
              <Card><div className="flex items-start gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" /><div className="text-[12.5px] leading-relaxed text-zinc-400"><b className="text-zinc-200">How to read the offer rate:</b> {stats.offerYes} of {stats.offerKnown} candidates with a known outcome got an offer ({stats.offerRate}%). With this sample size the true rate is likely between <b className="text-zinc-200">{stats.offerRateCI.low}%</b> and <b className="text-zinc-200">{stats.offerRateCI.high}%</b> (95% Wilson confidence interval). More reports narrow the range. Reports are self-selected, so treat rates as directional.</div></div></Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <SectionTitle icon={BookOpen} title="Practise these" sub={related.matchedTopics?.length ? `Matched to ${company.name}'s most-reported topics` : 'Popular problems'} action={<Link to="/problems" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[var(--signal)]">All problems →</Link>} />
                <div className="space-y-2">{related.data.slice(0, 8).map((p) => <Link key={p._id} to={`/problems/${p._id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:bg-white/[0.05]"><div className="flex min-w-0 items-center gap-2.5">{p.solved ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-white/15" />}<span className="truncate text-[13px] text-zinc-200 group-hover:text-[var(--signal)]">{p.title}</span>{p.askedHere && <Pill tone="violet">Asked here</Pill>}</div><div className="flex shrink-0 items-center gap-2"><span className="hidden font-mono text-[10px] text-zinc-600 sm:inline">{p.skillId?.name}</span><DiffPill difficulty={p.difficulty} /></div></Link>)}{!related.data.length && <p className="py-6 text-center text-[12.5px] text-zinc-600">No matching problems yet.</p>}</div>
              </Card>
              <Card>
                <SectionTitle icon={BookOpen} title="What candidates used to prepare" />
                {stats.topResources.length ? <div className="space-y-3">{stats.topResources.map((r) => <div key={r.resource}><div className="mb-1 flex justify-between text-[12.5px]"><span className="text-zinc-300">{r.resource}</span><span className="font-mono text-zinc-500">{r.pct}%</span></div><Bar value={r.pct} max={100} height={4} color="#38bdf8" /></div>)}</div> : <p className="py-6 text-center text-[12.5px] text-zinc-600">No resources reported yet.</p>}
                {company.interviewProcess?.tipsSummary && <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4 text-[12.5px] leading-relaxed text-emerald-100/80"><b className="text-emerald-300">Editorial tip · </b>{company.interviewProcess.tipsSummary}</div>}
              </Card>
            </div>
          </div>
        )}

        {/* ═══ PROCESS ═══ */}
        {tab === 'process' && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <SectionTitle icon={Layers} title="Official interview process" sub={`Typical ${company.interviewProcess?.rounds?.length || 0}-stage pipeline · overall difficulty ${company.interviewProcess?.difficulty || 'Medium'}`} />
              <div className="relative space-y-5 pl-2">
                <span className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-[var(--signal)]/50 via-white/10 to-transparent" />
                {(company.interviewProcess?.rounds || []).map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative flex gap-4">
                    <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--signal)]/40 bg-[#0b0f15] font-mono text-[12px] text-[var(--signal)]">{i + 1}</span>
                    <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"><div className="flex items-center justify-between gap-2"><b className="text-[13.5px] text-zinc-100">{r.name}</b>{r.duration && <span className="flex items-center gap-1 font-mono text-[10.5px] text-zinc-500"><Clock className="h-3 w-3" />{r.duration}</span>}</div><p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500">{r.description}</p></div>
                  </motion.div>
                ))}
              </div>
            </Card>
            <div className="space-y-6">
              <Card>
                <SectionTitle icon={Users} title="Round types reported" sub="Share of all reported rounds" />
                {stats.roundTypeDistribution.length ? <div className="h-52"><ResponsiveContainer><BarChart data={stats.roundTypeDistribution} layout="vertical" margin={{ left: 8, right: 16 }}><XAxis type="number" hide /><YAxis type="category" dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} axisLine={false} width={80} /><Tooltip {...chartTooltipStyle} formatter={(v, n, p) => [`${v} (${p.payload.pct}%)`, 'Rounds']} /><RBar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>{stats.roundTypeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</RBar></BarChart></ResponsiveContainer></div> : <EmptyState icon={Users} title="No round data yet" className="py-8" />}
              </Card>
              <Card>
                <SectionTitle icon={FileText} title="Roles reported" />
                <div className="space-y-2.5">{stats.roleDistribution.map((r) => <div key={r.label}><div className="mb-1 flex justify-between text-[12.5px]"><span className="text-zinc-300">{r.label}</span><span className="font-mono text-zinc-500">{r.count} · {r.pct}%</span></div><Bar value={r.pct} max={100} height={4} color="#a78bfa" /></div>)}{!stats.roleDistribution.length && <p className="text-[12.5px] text-zinc-600">No reports yet.</p>}</div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ TOPICS ═══ */}
        {tab === 'topics' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <SectionTitle icon={Target} title="Topic frequency" sub="% of reports in which the topic appeared — with your current mastery for tracked DSA skills." />
                {topics.length ? <div className="space-y-3">{topics.map((t, i) => {
                  const m = t.skill ? mastery[t.skill] : undefined;
                  return (
                    <motion.div key={t.topic} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]"><span className="flex items-center gap-2 text-zinc-200">{t.topic}{t.skill && m !== undefined && <span className={cn('font-mono text-[10px]', m >= 0.6 ? 'text-emerald-400' : m >= 0.35 ? 'text-amber-400' : 'text-rose-400')}>you {Math.round(m * 100)}%</span>}{t.skill && m !== undefined && m < 0.5 && t.pct >= 30 && <Pill tone="red">gap</Pill>}</span><span className="font-mono text-[11px] text-zinc-500">{t.pct}% · {t.count} reports</span></div>
                      <Bar value={t.pct} max={100} height={6} color={t.pct >= 60 ? 'linear-gradient(90deg,#34d399,#38bdf8)' : '#a78bfa'} />
                    </motion.div>
                  );
                })}</div> : <EmptyState icon={Target} title="No topic data yet" text="Be the first to add a detailed report." className="py-8" />}
              </Card>
              <Card>
                <SectionTitle icon={Layers} title="Question types" />
                {stats.questionTypeDistribution.length ? <div className="h-52"><ResponsiveContainer><PieChart><Pie data={stats.questionTypeDistribution} dataKey="count" nameKey="label" innerRadius="52%" outerRadius="88%" paddingAngle={2} stroke="none">{stats.questionTypeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip {...chartTooltipStyle} formatter={(v, n, p) => [`${v} (${p.payload.pct}%)`, n]} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div> : <EmptyState icon={Layers} title="No questions yet" className="py-8" />}
              </Card>
            </div>

            <Card>
              <SectionTitle icon={Search} title="Real questions asked" sub={`${allQuestions.length} questions from candidates`} action={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-1.5"><Search className="h-3 w-3 text-zinc-600" /><input value={qFilter.q} onChange={(e) => setQFilter({ ...qFilter, q: e.target.value })} placeholder="Search…" className="w-32 bg-transparent text-[12px] text-zinc-200 outline-none placeholder:text-zinc-700" /></div>
                  <select value={qFilter.type} onChange={(e) => setQFilter({ ...qFilter, type: e.target.value })} className="rounded-lg border border-white/[0.07] bg-[#0b0f15] px-2.5 py-1.5 text-[12px] text-zinc-300 outline-none">{['All', 'DSA', 'System Design', 'CS Fundamentals', 'Behavioral', 'Role-specific'].map((t) => <option key={t}>{t}</option>)}</select>
                </div>} />
              <div className="grid gap-2.5 md:grid-cols-2">
                {filteredQs.slice(0, 40).map((q, i) => <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5"><p className="text-[12.5px] leading-relaxed text-zinc-300">{q.text}</p><div className="mt-2 flex flex-wrap items-center gap-1.5"><Pill tone="zinc">{q.questionType || 'DSA'}</Pill><span className="font-mono text-[10px] text-zinc-600">{q.round} · {q.year}</span>{(q.topicTags || []).slice(0, 3).map((t) => <span key={t} className="rounded bg-[var(--signal)]/10 px-1.5 py-0.5 text-[10px] text-[var(--signal)]">{t}</span>)}</div></div>)}
              </div>
              {!filteredQs.length && <p className="py-8 text-center text-[12.5px] text-zinc-600">No questions match.</p>}
            </Card>
          </div>
        )}

        {/* ═══ EXPERIENCES ═══ */}
        {tab === 'experiences' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] p-[3px]">{['All', 'Yes', 'No', 'Pending'].map((o) => <button key={o} onClick={() => setExpFilter({ ...expFilter, offer: o })} className={cn('rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider', expFilter.offer === o ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{o === 'Yes' ? 'Offer' : o === 'No' ? 'No offer' : o}</button>)}</div>
              <select value={expFilter.sort} onChange={(e) => setExpFilter({ ...expFilter, sort: e.target.value })} className="rounded-lg border border-white/[0.07] bg-[#0b0f15] px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider text-zinc-300 outline-none"><option value="recent">Most recent</option><option value="top">Top voted</option><option value="quality">Highest quality</option></select>
              <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2"><Search className="h-3.5 w-3.5 text-zinc-600" /><input value={expFilter.q} onChange={(e) => setExpFilter({ ...expFilter, q: e.target.value })} placeholder="Search questions, roles, tips…" className="w-full bg-transparent text-[12.5px] text-zinc-200 outline-none placeholder:text-zinc-700" /></div>
            </div>
            {filteredExps.length ? filteredExps.map((e) => <ExperienceCard key={e._id} exp={e} onVote={vote} />) : <EmptyState icon={FileText} title="No experiences match" text="Be the first to share how your interview went." action={<button onClick={() => setShowSubmit(true)} className="rounded-lg bg-[var(--signal)]/15 px-4 py-2 text-[12px] text-[var(--signal)] hover:bg-[var(--signal)]/25">Submit experience</button>} />}
          </div>
        )}

        {tab === 'prep' && <PrepPlan slug={slug} companyName={company.name} />}
      </div>

      {showSubmit && <SubmitExperienceModal company={company} companies={[company]} onClose={() => setShowSubmit(false)} onSuccess={() => { loadExperiences(); loadStats(); }} />}
    </div>
  );
}
