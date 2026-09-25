import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowLeft, ArrowUpRight, ChevronDown, Info, KeyRound, Loader2, Plus, Search, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { companiesService, experiencesService, skillsService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { Page, PrimaryButton, CompanyLogo, Skeleton, ErrorNote, CountUp, chartTooltipStyle, cn } from '../components/ui/kit';

const SECTIONS = [['overview', 'Overview'], ['gauntlet', 'The gauntlet'], ['asked', 'What they ask'], ['voices', 'Voices'], ['prep', 'Prep plan']];
const CONF = { none: 'No data yet', low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' };
const DIFF_COLOR = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#fb7185' };
const OUTCOME = { Yes: ['Offer', 'text-emerald-400'], No: ['No offer', 'text-rose-400'], Pending: ['Pending', 'text-amber-400'] };
const chip = (on) => cn('shrink-0 rounded-sm border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', on ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200');

function Section({ id, kicker, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-24">
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-[var(--line-strong)] pb-4">
        <h2 className="display text-[clamp(30px,4.2vw,51px)] text-zinc-50">{title}</h2>
        {kicker && <div className="max-w-xs pb-1.5 text-right text-[13px] leading-snug text-zinc-500">{kicker}</div>}
      </div>
      {children}
    </section>
  );
}

// ─── One voice (experience) ──────────────────────────────────────────────────
function Voice({ exp, onVote }) {
  const [open, setOpen] = useState(false);
  const [label, tone] = OUTCOME[exp.offerReceived] || OUTCOME.Pending;
  const qCount = exp.rounds?.reduce((n, r) => n + (r.questions?.length || 0), 0) || 0;
  return (
    <article className="border-b border-[var(--line)] py-8">
      <button onClick={() => setOpen((o) => !o)} className="group flex w-full items-start gap-6 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="display text-[27.2px] leading-none text-zinc-100 transition-colors group-hover:text-[var(--ember)]">{exp.role}</span>
            <span className={cn('text-[13px] font-medium', tone)}>{label}</span>
            {exp.isVerified && <span className="inline-flex items-center gap-1 text-[12px] text-sky-300"><ShieldCheck className="h-3.5 w-3.5" />verified</span>}
            {exp.source === 'curated' && <span title="Written for the demo dataset, not reported by a real student" className="rounded-sm border border-[var(--line-strong)] px-2.5 py-0.5 text-[11.5px] text-zinc-500">sample report</span>}
          </div>
          <div className="tag mt-2">
            {exp.month} {exp.year}{(exp.collegeId?.shortName || exp.college) ? ` · ${exp.collegeId?.shortName || exp.college}` : ''} · {exp.rounds?.length || 0} rounds, {qCount} questions{exp.difficulty ? ` · felt ${exp.difficulty.toLowerCase()}` : ''} · {exp.source === 'curated' ? 'illustrative' : exp.author ? exp.author : 'anonymous'}
          </div>
          {!open && exp.overallTips && <p className="mt-4 max-w-3xl text-[17px] leading-[1.6] text-zinc-400">&ldquo;{exp.overallTips.length > 260 ? `${exp.overallTips.slice(0, 260)}…` : exp.overallTips}&rdquo;</p>}
        </div>
        <ChevronDown className={cn('mt-2 h-5 w-5 shrink-0 text-zinc-600 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-8 space-y-8 border-l border-[var(--line-strong)] pl-8">
              {exp.compensation && (exp.compensation.base || exp.compensation.bonus || exp.compensation.stock) && (
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-[14px]">{[['Base', exp.compensation.base], ['Bonus', exp.compensation.bonus], ['Stock', exp.compensation.stock]].filter(([, v]) => v).map(([k, v]) => <span key={k}><span className="text-zinc-500">{k}</span> <span className="text-zinc-100">{v}</span></span>)}</div>
              )}
              {exp.rounds?.map((r, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline gap-x-3"><span className="display text-[22.4px] text-zinc-600">{String(i + 1).padStart(2, '0')}</span><span className="text-[17px] font-medium text-zinc-100">{r.type}</span>{r.duration && <span className="text-[13px] text-zinc-500">{r.duration}</span>}{r.vibe && <span className="text-[13px] text-zinc-500">· {r.vibe}</span>}</div>
                  {r.topics?.length > 0 && <div className="mt-2 text-[13px] text-[var(--ember-soft)]">{r.topics.join(' · ')}</div>}
                  <ul className="mt-3 space-y-3">{r.questions?.filter((q) => q.text).map((q, j) => <li key={j} className="max-w-3xl text-[15px] leading-relaxed text-zinc-300">{q.text}<span className="ml-2 text-[11.5px] text-zinc-600">{q.questionType}</span></li>)}</ul>
                  {r.tips && <p className="mt-3 max-w-3xl text-[14px] italic leading-relaxed text-zinc-500">{r.tips}</p>}
                </div>
              ))}
              {exp.overallTips && <p className="max-w-3xl text-[17px] leading-[1.6] text-zinc-300"><span className="text-[var(--star)]">Advice — </span>{exp.overallTips}</p>}
              {exp.resourcesUsed && <p className="text-[13px] text-zinc-500">Prepared with: {exp.resourcesUsed}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex items-center gap-1 text-[13px]">
        <button onClick={() => onVote(exp, 'up')} className={cn('flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors', exp.userVote === 'up' ? 'bg-emerald-400/15 text-emerald-300' : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200')}><ThumbsUp className="h-3.5 w-3.5" />{exp.upvotes}</button>
        <button onClick={() => onVote(exp, 'down')} className={cn('flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors', exp.userVote === 'down' ? 'bg-rose-400/15 text-rose-300' : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200')}><ThumbsDown className="h-3.5 w-3.5" />{exp.downvotes}</button>
        {exp.qualityScore != null && <span className="ml-3 text-[12px] text-zinc-700">quality {exp.qualityScore}/100</span>}
      </div>
    </article>
  );
}

// ─── Prep plan ──────────────────────────────────────────────────────────────
const TASK_LABEL = { practice: 'Practise', review: 'Review', mock: 'Mock', behavioral: 'Behavioural', study: 'Study', read: 'Read' };

function PrepPlan({ slug, companyName }) {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try { const r = await companiesService.generatePrepPlan(slug, days); setPlan(r.data.data); }
    catch (e) { toast.error('Could not build the plan', e.response?.data?.error); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <p className="max-w-lg text-[17px] leading-relaxed text-zinc-400">A day-by-day plan built from real {companyName} statistics and your live mastery — aimed at the topics they ask most where you are weakest.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">{[14, 30, 45, 60].map((d) => <button key={d} onClick={() => setDays(d)} className={chip(days === d)}>{d} days</button>)}</div>
          <PrimaryButton onClick={generate} disabled={loading} icon={loading ? Loader2 : ArrowUpRight}>{plan ? 'Rebuild' : 'Build my plan'}</PrimaryButton>
        </div>
      </div>

      {loading && <div className="mt-10 space-y-3"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>}

      {plan && !loading && (
        <div className="mt-14">
          {plan.ai && !plan.ai.used && (
            <div className="mb-10 flex items-start gap-3 border-l-2 border-[var(--star)] pl-4 text-[13.5px] leading-relaxed text-zinc-400">
              {plan.ai.needsKey ? <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[var(--star)]" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>{plan.ai.message} Every number and problem link below is real. {plan.ai.needsKey && <Link to="/profile#ai" className="text-[var(--ember)] hover:underline">Add your Gemini key</Link>}</div>
            </div>
          )}
          <div className="grid gap-16 lg:grid-cols-[380px_1fr]">
            <div>
              <div className="flex items-baseline gap-3"><span className="display text-[104px] leading-[0.85] tnum text-zinc-50">{plan.readiness}</span><span className="text-[15px] text-zinc-500">/ 100<br />ready today</span></div>
              <p className="mt-6 text-[15px] leading-relaxed text-zinc-400">{plan.summary}</p>
              <div className="mt-10">
                <div className="mb-4 text-[13px] text-zinc-500">Where to focus — how often it&apos;s asked vs. how well you know it</div>
                <div className="space-y-5">{plan.focusAreas.slice(0, 6).map((f) => (
                  <div key={f.skill}>
                    <div className="flex items-baseline justify-between"><span className="text-[15px] text-zinc-100">{f.skill}</span><span className={cn('text-[12px]', f.level === 'high' ? 'text-rose-400' : f.level === 'medium' ? 'text-amber-400' : 'text-emerald-400')}>{f.level} priority</span></div>
                    <div className="mt-2 space-y-1"><div className="h-[3px] rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[var(--ember)]" style={{ width: `${f.frequencyPct}%` }} /></div><div className="h-[3px] rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[var(--star)]" style={{ width: `${f.mastery * 100}%` }} /></div></div>
                    <div className="mt-1.5 text-[11.5px] text-zinc-600">asked in {f.frequencyPct}% of reports · you at {Math.round(f.mastery * 100)}%</div>
                  </div>
                ))}</div>
              </div>
            </div>

            <div>
              {plan.phases.map((ph, i) => (
                <div key={i} className="border-t border-[var(--line-strong)] py-8 first:border-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-4"><div className="flex items-baseline gap-4"><span className="display text-[35.2px] leading-none text-[var(--ember)]">{i + 1}</span><span className="display text-[25.6px] text-zinc-100">{ph.name}</span></div><span className="text-[13px] text-zinc-500">days {ph.days}</span></div>
                  <p className="mt-2 pl-[52px] text-[14px] text-zinc-500">{ph.goal}</p>
                  <ul className="mt-6 space-y-5 pl-[52px]">
                    {ph.tasks.map((t, j) => (
                      <li key={j}>
                        <div className="text-[15px] leading-relaxed text-zinc-300"><span className="mr-2.5 text-[12px] font-medium text-[var(--ember-soft)]">{TASK_LABEL[t.type] || 'Study'}</span>{t.text}</div>
                        {t.problems?.length > 0 && <div className="mt-2.5 flex flex-wrap gap-2">{t.problems.map((p) => <Link key={p._id} to={`/problems/${p._id}`} className="rounded-sm border border-[var(--line-strong)] px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]">{p.title}</Link>)}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {plan.tips?.length > 0 && <div className="border-t border-[var(--line-strong)] pt-8"><div className="mb-4 text-[13px] text-zinc-500">Coach&apos;s notes</div><ul className="space-y-3">{plan.tips.map((t, i) => <li key={i} className="max-w-2xl text-[15px] leading-relaxed text-zinc-400">— {t}</li>)}</ul></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
  const { slug } = useParams();
  const toast = useToast();

  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [related, setRelated] = useState({ data: [], matchedTopics: [] });
  const [mastery, setMastery] = useState({});
  const [active, setActive] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [expFilter, setExpFilter] = useState({ offer: 'All', sort: 'recent', q: '' });
  const [qFilter, setQFilter] = useState({ type: 'All', q: '' });
  const [qLimit, setQLimit] = useState(10);
  const [expLimit, setExpLimit] = useState(5);
  const observed = useRef(false);

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

  // highlight the section you're reading in the sticky nav
  useEffect(() => {
    if (loading || !company || observed.current) return undefined;
    observed.current = true;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-35% 0px -55% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => { io.disconnect(); observed.current = false; };
  }, [loading, company]);

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

  const allQuestions = useMemo(() => experiences.flatMap((e) => (e.rounds || []).flatMap((r) => (r.questions || []).filter((q) => q.text).map((q) => ({ ...q, round: r.type, year: e.year })))), [experiences]);
  const filteredQs = allQuestions.filter((q) => (qFilter.type === 'All' || q.questionType === qFilter.type) && (!qFilter.q || `${q.text} ${(q.topicTags || []).join(' ')}`.toLowerCase().includes(qFilter.q.toLowerCase())));

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <Page><div className="space-y-6 pt-20"><Skeleton className="h-64" /><Skeleton className="h-96" /></div></Page>;
  if (error || !company) return <Page><div className="pt-20"><Link to="/intel" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-100"><ArrowLeft className="h-4 w-4" /> Atlas</Link><ErrorNote>{error || 'Company not found.'}</ErrorNote></div></Page>;

  const rounds = company.interviewProcess?.rounds || [];
  const diffTotal = stats.difficultyBuckets.reduce((n, b) => n + b.count, 0);
  const topics = stats.topTopics.slice(0, 10);
  const maxPct = Math.max(1, ...topics.map((t) => t.pct));

  return (
    <Page>
      {/* ═══ Hero ═══ */}
      <header className="pt-0 md:pt-2">
        <Link to="/intel" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-100"><ArrowLeft className="h-4 w-4" /> Atlas</Link>
        <div className="mt-10 grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div>
            <div className="flex items-center gap-4"><CompanyLogo company={company} size={52} /><div className="tag">{company.tier}{company.headquarters ? ` · ${company.headquarters}` : ''}{company.founded ? ` · founded ${company.founded}` : ''} · {CONF[stats.dataConfidence]}</div></div>
            <h1 className="display mt-6 text-[clamp(64px,11vw,168px)] leading-[0.9] text-zinc-50">{company.name}</h1>
            {company.description && <p className="mt-8 max-w-xl text-[18px] leading-relaxed text-zinc-400">{company.description}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <PrimaryButton onClick={() => setShowSubmit(true)} icon={Plus}>Share your interview</PrimaryButton>
              <button onClick={() => go('prep')} className="text-[14px] text-zinc-400 transition-colors hover:text-[var(--ember)]">Build a prep plan for {company.name} →</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-10">
            <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[76px] leading-none tnum text-zinc-50">{stats.offerRate != null ? <CountUp value={stats.offerRate} /> : '—'}{stats.offerRate != null && <span className="text-[30px] text-zinc-500">%</span>}</div><div className="tag mt-3">offer rate{stats.offerRateCI && <><br /><span className="text-zinc-600">likely {stats.offerRateCI.low}–{stats.offerRateCI.high}%</span></>}</div></div>
            <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[76px] leading-none tnum text-zinc-50"><CountUp value={stats.totalReports} /></div><div className="tag mt-3">reports</div></div>
            <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[76px] leading-none tnum text-zinc-50">{stats.avgRounds || rounds.length || '—'}</div><div className="tag mt-3">rounds, on average</div></div>
            <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[76px] leading-none tnum text-zinc-50">{company.ctcMin != null ? (company.ctcMin === company.ctcMax ? company.ctcMin : `${company.ctcMin}–${company.ctcMax}`) : '—'}</div><div className="tag mt-3">LPA package</div></div>
          </div>
        </div>
        {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="mt-12 mr-8 inline-block text-[14px] text-zinc-500 transition-colors hover:text-[var(--ember)]">{company.website.replace(/^https?:\/\/(www\.)?/, '')} ↗</a>}
        {company.roles?.length > 0 && <div className="mt-12 inline-block text-[14px] text-zinc-500">Hires for <span className="text-zinc-300">{company.roles.join(' · ')}</span></div>}
      </header>

      {/* sticky section nav */}
      <div className="sticky top-4 z-30 mt-14 flex justify-center">
        <nav className="flex items-center gap-1 rounded-full border border-[var(--line-strong)] bg-[#0d0d0d]/95 p-1 backdrop-blur-md">
          {SECTIONS.map(([id, l]) => (
            <button key={id} onClick={() => go(id)} className={cn('relative rounded-sm px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', active === id ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>
              {active === id && <motion.span layoutId="co-nav" className="absolute inset-0 rounded-sm bg-white/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{l}{id === 'voices' && <span className="ml-1.5 text-zinc-600">{experiences.length}</span>}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ Overview ═══ */}
      <Section id="overview" title={<>How it <em>feels</em></>} kicker="Difficulty as candidates rated it, and how offers have trended.">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="mb-4 text-[13px] text-zinc-500">Difficulty · {diffTotal} ratings</div>
            {diffTotal ? (
              <>
                <div className="flex h-3 overflow-hidden rounded-full">{stats.difficultyBuckets.filter((b) => b.count).map((b) => <motion.div key={b.label} initial={{ width: 0 }} animate={{ width: `${b.pct}%` }} transition={{ duration: 1 }} style={{ background: DIFF_COLOR[b.label] }} title={`${b.label} ${b.pct}%`} />)}</div>
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">{stats.difficultyBuckets.filter((b) => b.count).map((b) => <div key={b.label}><span className="display text-[40px] tnum" style={{ color: DIFF_COLOR[b.label] }}>{b.pct}%</span><span className="ml-2 text-[13px] text-zinc-500">{b.label.toLowerCase()}</span></div>)}</div>
              </>
            ) : <p className="text-[14px] text-zinc-600">No ratings yet.</p>}
            {stats.offerRateCI && <p className="mt-10 max-w-sm text-[13.5px] leading-relaxed text-zinc-500"><span className="text-zinc-300">{stats.offerYes} of {stats.offerKnown}</span> candidates with a known outcome got an offer. With a sample this size the true rate is probably between {stats.offerRateCI.low}% and {stats.offerRateCI.high}% (95% Wilson interval) — more reports narrow it. Reports are self-selected; treat rates as directional.</p>}
          </div>
          <div>
            <div className="mb-4 text-[13px] text-zinc-500">Reports (bars) and offer rate (line) by year</div>
            {stats.yearTrend.length ? (
              <div className="h-60"><ResponsiveContainer><ComposedChart data={stats.yearTrend} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="rgba(236,230,216,0.06)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#7a7466', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" tick={{ fill: '#5b564b', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: '#5b564b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip {...chartTooltipStyle} />
                <RBar yAxisId="l" dataKey="reports" name="Reports" fill="#fbbf24" fillOpacity={0.28} radius={[8, 8, 0, 0]} barSize={34} />
                <Line yAxisId="r" dataKey="offerRate" name="Offer rate %" stroke="#34d399" strokeWidth={2.4} dot={{ r: 4.5, fill: '#0a0a0a', stroke: '#34d399', strokeWidth: 2 }} connectNulls />
              </ComposedChart></ResponsiveContainer></div>
            ) : <p className="text-[14px] text-zinc-600">Not enough data yet.</p>}
          </div>
        </div>
      </Section>

      {/* ═══ The gauntlet ═══ */}
      <Section id="gauntlet" title={<>The <em>gauntlet</em></>} kicker={`A typical ${rounds.length}-stage pipeline · ${(company.interviewProcess?.difficulty || 'Medium').toLowerCase()} overall.`}>
        <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
          <ol className="relative">
            <span className="absolute bottom-4 left-[19px] top-4 w-px bg-[var(--line-strong)]" />
            {rounds.map((r, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.05 }} className="relative flex gap-8 pb-12 last:pb-0">
                <span className="relative z-10 mt-2 flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-full border border-[var(--ember)] bg-[var(--background)] text-[13px] font-semibold text-[var(--ember)]">{i + 1}</span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-4"><span className="display text-[36px] leading-tight text-zinc-100">{r.name}</span>{r.duration && <span className="text-[13px] text-zinc-500">{r.duration}</span>}</div>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-zinc-500">{r.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <div className="space-y-12">
            <div>
              <div className="mb-4 text-[13px] text-zinc-500">What rounds candidates actually reported</div>
              {stats.roundTypeDistribution.length ? (
                <div className="space-y-3.5">{stats.roundTypeDistribution.map((r) => (
                  <div key={r.label}><div className="flex justify-between text-[14px]"><span className="text-zinc-200">{r.label}</span><span className="tnum text-zinc-500">{r.pct}%</span></div><div className="mt-1.5 h-[3px] rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-[var(--ember)]" initial={{ width: 0 }} whileInView={{ width: `${r.pct}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div></div>
                ))}</div>
              ) : <p className="text-[14px] text-zinc-600">No round data yet.</p>}
            </div>
            {company.interviewProcess?.tipsSummary && <p className="border-l-2 border-[var(--star)] pl-4 text-[15px] leading-relaxed text-zinc-300"><span className="text-[var(--star)]">Editor&apos;s note — </span>{company.interviewProcess.tipsSummary}</p>}
          </div>
        </div>
      </Section>

      {/* ═══ What they ask ═══ */}
      <Section id="asked" title={<>What they <em>ask</em></>} kicker="Topic size = how often it appears in reports. Your own mastery sits beside it.">
        {topics.length ? (
          <div className="grid gap-x-16 gap-y-2 md:grid-cols-2">
            {topics.map((t, i) => {
              const m = t.skill ? mastery[t.skill] : undefined;
              const size = 26 + (t.pct / maxPct) * 26;
              return (
                <motion.div key={t.topic} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-3">
                  <span className="display text-zinc-100" style={{ fontSize: size, lineHeight: 1.05 }}>{t.topic}</span>
                  <span className="shrink-0 text-right text-[13px] leading-tight text-zinc-500"><span className="tnum text-zinc-300">{t.pct}%</span>{m !== undefined && <><br /><span className={cn('tnum', m >= 0.6 ? 'text-emerald-400' : m >= 0.35 ? 'text-amber-400' : 'text-rose-400')}>you {Math.round(m * 100)}%{m < 0.5 && t.pct >= 30 ? ' · gap' : ''}</span></>}</span>
                </motion.div>
              );
            })}
          </div>
        ) : <p className="text-[14px] text-zinc-600">No topic data yet — be the first to add a detailed report.</p>}

        <div className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h3 className="display text-[36px] text-zinc-100">Real questions <span className="text-zinc-600">· {allQuestions.length}</span></h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 border-b border-[var(--line-strong)] pb-1 focus-within:border-[var(--ember)]"><Search className="h-4 w-4 text-zinc-600" /><input value={qFilter.q} onChange={(e) => setQFilter({ ...qFilter, q: e.target.value })} placeholder="Search questions…" className="w-44 bg-transparent text-[14px] text-zinc-200 outline-none placeholder:text-zinc-700" /></div>
            </div>
          </div>
          <div className="mb-8 flex flex-wrap gap-1.5">{['All', 'DSA', 'System Design', 'CS Fundamentals', 'Behavioral', 'Role-specific'].map((t) => <button key={t} onClick={() => setQFilter({ ...qFilter, type: t })} className={chip(qFilter.type === t)}>{t}</button>)}</div>
          <div className="grid gap-x-16 md:grid-cols-2">
            {filteredQs.slice(0, qLimit).map((q, i) => (
              <div key={i} className="border-b border-[var(--line)] py-5">
                <p className="text-[16px] leading-[1.6] text-zinc-200">&ldquo;{q.text}&rdquo;</p>
                <div className="mt-2 text-[12px] text-zinc-600">{q.questionType || 'DSA'} · {q.round} · {q.year}{(q.topicTags || []).length > 0 && <span className="text-[var(--ember-soft)]"> · {(q.topicTags || []).slice(0, 3).join(', ')}</span>}</div>
              </div>
            ))}
          </div>
          {!filteredQs.length && <p className="py-10 text-center text-[14px] text-zinc-600">No questions match.</p>}
          {filteredQs.length > qLimit && <button onClick={() => setQLimit((n) => n + 12)} className="mt-8 rounded-sm border border-[var(--line-strong)] px-6 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 hover:text-zinc-100">Show more questions</button>}
        </div>

        <div className="mt-24 grid gap-16 lg:grid-cols-2">
          <div>
            <h3 className="display mb-6 text-[36px] text-zinc-100">Practise these</h3>
            <div>{related.data.slice(0, 7).map((p) => (
              <Link key={p._id} to={`/problems/${p._id}`} className="group flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <span className="flex min-w-0 items-center gap-3"><span className={cn('h-2 w-2 shrink-0 rounded-full', p.solved ? 'bg-emerald-400' : 'border border-zinc-600')} /><span className="truncate text-[16px] text-zinc-200 group-hover:text-[var(--ember)]">{p.title}</span>{p.askedHere && <span className="shrink-0 text-[11.5px] text-[var(--ember-soft)]">asked here</span>}</span>
                <span className="shrink-0 text-[12.5px] capitalize text-zinc-500">{p.difficulty}</span>
              </Link>
            ))}{!related.data.length && <p className="text-[14px] text-zinc-600">No matching problems yet.</p>}</div>
          </div>
          <div>
            <h3 className="display mb-6 text-[36px] text-zinc-100">How people prepared</h3>
            {stats.topResources.length ? <div className="space-y-4">{stats.topResources.map((r) => <div key={r.resource}><div className="flex justify-between text-[14px]"><span className="text-zinc-200">{r.resource}</span><span className="tnum text-zinc-500">{r.pct}%</span></div><div className="mt-1.5 h-[3px] rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[var(--star)]" style={{ width: `${r.pct}%` }} /></div></div>)}</div> : <p className="text-[14px] text-zinc-600">No resources reported yet.</p>}
          </div>
        </div>
      </Section>

      {/* ═══ Voices ═══ */}
      <Section id="voices" title={<>The <em>voices</em></>} kicker="Firsthand accounts. Open one to read every round.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">{['All', 'Yes', 'No', 'Pending'].map((o) => <button key={o} onClick={() => setExpFilter({ ...expFilter, offer: o })} className={chip(expFilter.offer === o)}>{o === 'Yes' ? 'Got the offer' : o === 'No' ? 'No offer' : o}</button>)}</div>
          <div className="flex items-center gap-1 text-[13px] text-zinc-500"><span className="mr-1">Order</span>{[['recent', 'Recent'], ['top', 'Top voted'], ['quality', 'Best written']].map(([k, l]) => <button key={k} onClick={() => setExpFilter({ ...expFilter, sort: k })} className={cn('rounded-sm px-3 py-1.5', expFilter.sort === k ? 'bg-white/[0.08] text-zinc-50' : 'hover:text-zinc-200')}>{l}</button>)}</div>
        </div>
        {filteredExps.length ? (
          <>
            {filteredExps.slice(0, expLimit).map((e) => <Voice key={e._id} exp={e} onVote={vote} />)}
            {filteredExps.length > expLimit && <button onClick={() => setExpLimit((n) => n + 6)} className="mt-8 rounded-sm border border-[var(--line-strong)] px-6 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 hover:text-zinc-100">Show {Math.min(6, filteredExps.length - expLimit)} more</button>}
          </>
        ) : (
          <div className="py-16 text-center"><div className="display text-[27.2px] italic text-zinc-500">No accounts match.</div><button onClick={() => setShowSubmit(true)} className="mt-4 text-[14px] text-[var(--ember)] hover:underline">Be the first to share how yours went</button></div>
        )}
      </Section>

      {/* ═══ Prep ═══ */}
      <Section id="prep" title={<>Your prep <em>plan</em></>} kicker="Generated from statistics, then polished by an AI coach when available.">
        <PrepPlan slug={slug} companyName={company.name} />
      </Section>

      {showSubmit && <SubmitExperienceModal company={company} companies={[company]} onClose={() => setShowSubmit(false)} onSuccess={() => { loadExperiences(); loadStats(); }} />}
    </Page>
  );
}
