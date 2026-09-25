import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Wand2, ListChecks, Loader2, Plus, Trash2, ArrowRight, ArrowLeft, Check, KeyRound, EyeOff, Building2,
  GraduationCap, Zap, Users, FileText, CheckCircle2, Circle, AlertTriangle, Award, TrendingUp
} from 'lucide-react';
import { experiencesService, collegesService, companiesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { scoreQuality, estimateXp } from '../../lib/experienceQuality';
import { Ring, Label, Pill, Bar, CountUp, CompanyLogo, cn } from '../ui/kit';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => YEAR + 1 - i);
const ROUND_TYPES = ['OA', 'Technical', 'Managerial', 'HR', 'GD'];
const VIBES = ['Friendly', 'Neutral', 'Grilling'];
const Q_TYPES = ['DSA', 'System Design', 'CS Fundamentals', 'Behavioral', 'Role-specific'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard'];
const TOPIC_SUGGESTIONS = ['Arrays', 'Strings', 'Hashing', 'Recursion', 'Sorting', 'Binary Search', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Dynamic Programming', 'Greedy', 'Sliding Window', 'Two Pointers', 'Heap', 'Trie', 'Backtracking', 'System Design', 'LLD', 'OOP', 'SQL', 'DBMS', 'Operating Systems', 'Computer Networks', 'Concurrency', 'Behavioral', 'Leadership Principles', 'Puzzles', 'Aptitude'];

const emptyRound = () => ({ type: 'Technical', duration: '', vibe: '', topics: [], questions: [{ text: '', questionType: 'DSA', topicTags: [] }], tips: '' });

// ─── primitives ──────────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-zinc-200 outline-none transition-all placeholder:text-zinc-700 hover:border-white/[0.14] focus:border-[var(--signal)]/50 focus:bg-[var(--signal)]/[0.04]';
const Field = ({ label, required, hint, children, className }) => (
  <div className={cn('space-y-1.5', className)}>
    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}{required && <span className="text-[var(--signal)]">*</span>}{hint && <span className="normal-case tracking-normal text-zinc-700">— {hint}</span>}</div>
    {children}
  </div>
);
const Select = ({ children, ...p }) => <select {...p} className={cn(inputCls, 'cursor-pointer appearance-none')}>{children}</select>;

function ChipInput({ value, onChange, suggestions = [], placeholder = 'Add a topic…' }) {
  const [draft, setDraft] = useState('');
  const add = (t) => { const v = t.trim(); if (v && !value.includes(v)) onChange([...value, v]); setDraft(''); };
  const matches = draft ? suggestions.filter((s) => s.toLowerCase().includes(draft.toLowerCase()) && !value.includes(s)).slice(0, 5) : [];
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 focus-within:border-[var(--signal)]/50">
        {value.map((t) => <span key={t} className="flex items-center gap-1 rounded-md bg-[var(--signal)]/10 px-2 py-0.5 text-[11px] text-[var(--signal)]">{t}<button onClick={() => onChange(value.filter((x) => x !== t))}><X className="h-3 w-3 opacity-60 hover:opacity-100" /></button></span>)}
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft); } if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1)); }} placeholder={value.length ? '' : placeholder} className="min-w-[90px] flex-1 bg-transparent text-[12.5px] text-zinc-200 outline-none placeholder:text-zinc-700" />
      </div>
      {matches.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/[0.1] bg-[#0d1218] shadow-xl">{matches.map((m) => <button key={m} onClick={() => add(m)} className="block w-full px-3 py-2 text-left text-[12px] text-zinc-300 hover:bg-white/[0.05]">{m}</button>)}</div>}
      {!draft && value.length === 0 && <div className="mt-1.5 flex flex-wrap gap-1">{suggestions.slice(0, 6).map((s) => <button key={s} onClick={() => add(s)} className="rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10.5px] text-zinc-600 hover:text-zinc-300">+ {s}</button>)}</div>}
    </div>
  );
}

// ─── round editor ────────────────────────────────────────────────────────────
function RoundEditor({ round, index, onChange, onRemove, canRemove }) {
  const set = (k, v) => onChange({ ...round, [k]: v });
  const setQ = (i, patch) => set('questions', round.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--signal)]/15 font-mono text-[11px] text-[var(--signal)]">{index + 1}</span><span className="text-[13px] font-medium text-zinc-200">Round {index + 1}</span></div>
        {canRemove && <button onClick={onRemove} className="text-zinc-600 transition-colors hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Type"><Select value={round.type} onChange={(e) => set('type', e.target.value)}>{ROUND_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Duration"><input className={inputCls} value={round.duration} onChange={(e) => set('duration', e.target.value)} placeholder="e.g. 60 minutes" /></Field>
        <Field label="Vibe"><Select value={round.vibe} onChange={(e) => set('vibe', e.target.value)}><option value="">—</option>{VIBES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
      </div>
      <Field label="Topics covered" className="mt-3"><ChipInput value={round.topics} onChange={(v) => set('topics', v)} suggestions={TOPIC_SUGGESTIONS} /></Field>

      <div className="mt-4">
        <Label className="mb-2 block text-zinc-500">Questions asked</Label>
        <div className="space-y-2.5">
          {round.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <textarea rows={2} className={cn(inputCls, 'resize-none')} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="e.g. Given a grid with obstacles, find the shortest path to the target…" />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={q.questionType} onChange={(e) => setQ(i, { questionType: e.target.value })} className="rounded-lg border border-white/[0.08] bg-[#0b0f15] px-2 py-1 text-[11px] text-zinc-400 outline-none">{Q_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                <div className="min-w-[160px] flex-1"><ChipInput value={q.topicTags || []} onChange={(v) => setQ(i, { topicTags: v })} suggestions={TOPIC_SUGGESTIONS} placeholder="tags" /></div>
                {round.questions.length > 1 && <button onClick={() => set('questions', round.questions.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => set('questions', [...round.questions, { text: '', questionType: 'DSA', topicTags: [] }])} className="mt-2 flex items-center gap-1 text-[11.5px] text-zinc-500 transition-colors hover:text-[var(--signal)]"><Plus className="h-3.5 w-3.5" /> Add another question</button>
      </div>
      <Field label="Tips for this round" className="mt-3"><textarea rows={2} className={cn(inputCls, 'resize-none')} value={round.tips} onChange={(e) => set('tips', e.target.value)} placeholder="What surprised you? What would you do differently?" /></Field>
    </div>
  );
}

// ─── side panel ──────────────────────────────────────────────────────────────
function QualityPanel({ quality, xp }) {
  const color = quality.score >= 75 ? '#34d399' : quality.score >= 45 ? '#fbbf24' : '#fb7185';
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="flex items-center gap-4">
          <Ring value={quality.score / 100} size={78} stroke={7} color={color}><span className="text-[19px] font-semibold tabular-nums text-zinc-100">{quality.score}</span></Ring>
          <div><Label>Intel quality</Label><div className="mt-0.5 text-[15px] font-semibold" style={{ color }}>{quality.grade}</div><div className="mt-1 flex items-center gap-1 text-[11.5px] text-amber-300"><Zap className="h-3 w-3" /> ~{xp} XP on submit</div></div>
        </div>
        <div className="mt-4 space-y-1.5">
          {quality.breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-[11.5px]">
              {b.done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-zinc-700" />}
              <span className={cn('flex-1', b.done ? 'text-zinc-300' : 'text-zinc-600')}>{b.label}</span>
              <span className="font-mono text-[10px] text-zinc-600">{b.points}/{b.max}</span>
            </div>
          ))}
        </div>
      </div>
      {quality.suggestions.length > 0 && (
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <Label className="mb-2 block text-amber-300/80">Make it more useful</Label>
          <ul className="space-y-1.5">{quality.suggestions.map((s, i) => <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-zinc-400"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-amber-400/70" />{s}</li>)}</ul>
        </div>
      )}
      <div className="rounded-2xl border border-white/[0.06] p-4 text-[11.5px] leading-relaxed text-zinc-500"><Users className="mb-1.5 h-4 w-4 text-violet-400" />Your report joins the community's statistics: topic frequencies, offer-rate confidence intervals and personalised prep plans all get sharper with every detailed submission.</div>
    </div>
  );
}

// ─── preview ────────────────────────────────────────────────────────────────
function Preview({ form, companyName }) {
  const q = form.rounds.flatMap((r) => r.questions).filter((x) => x.text.trim());
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f15] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[16px] font-semibold text-zinc-100">{companyName || 'Company'}</span><span className="text-zinc-600">·</span><span className="text-[14px] text-zinc-300">{form.role || 'Role'}</span>
        <Pill tone={form.offerReceived === 'Yes' ? 'green' : form.offerReceived === 'No' ? 'red' : 'amber'}>{form.offerReceived === 'Yes' ? 'Offer' : form.offerReceived === 'No' ? 'No offer' : 'Pending'}</Pill>
        {form.difficulty && <Pill tone="zinc">{form.difficulty}</Pill>}
        {form.isAnonymous && <Pill tone="zinc" icon={EyeOff}>Anonymous</Pill>}
      </div>
      <div className="mt-1 font-mono text-[11px] text-zinc-600">{form.month} {form.year}{form.college ? ` · ${form.college}` : ''}{form.cgpa ? ` · CGPA ${form.cgpa}` : ''}</div>
      <div className="mt-4 space-y-3">
        {form.rounds.map((r, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]"><b className="text-zinc-200">Round {i + 1}: {r.type}</b>{r.duration && <span className="text-zinc-600">{r.duration}</span>}{r.vibe && <Pill tone="zinc">{r.vibe}</Pill>}</div>
            {r.topics.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{r.topics.map((t) => <span key={t} className="rounded bg-[var(--signal)]/10 px-1.5 py-0.5 text-[10.5px] text-[var(--signal)]">{t}</span>)}</div>}
            {r.questions.filter((x) => x.text.trim()).map((x, j) => <div key={j} className="mt-2 border-l-2 border-white/10 pl-3 text-[12.5px] leading-relaxed text-zinc-400">{x.text}</div>)}
            {r.tips && <div className="mt-2 text-[12px] italic text-zinc-500">Tip: {r.tips}</div>}
          </div>
        ))}
      </div>
      {form.overallTips && <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3.5 text-[12.5px] leading-relaxed text-emerald-100/80"><b className="text-emerald-300">Advice:</b> {form.overallTips}</div>}
      {form.resourcesUsed && <div className="mt-3 text-[11.5px] text-zinc-500">Resources: {form.resourcesUsed}</div>}
      <div className="mt-3 font-mono text-[10px] text-zinc-700">{q.length} questions · {form.rounds.length} rounds</div>
    </div>
  );
}

// ─── impact ─────────────────────────────────────────────────────────────────
function Impact({ impact, onClose, onAnother }) {
  const gain = impact.companyReportsAfter - impact.companyReportsBefore;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl py-4 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10"><CheckCircle2 className="h-8 w-8 text-emerald-300" /></motion.div>
      <h3 className="text-[24px] font-semibold text-zinc-100">{impact.status === 'Published' ? 'Intel published' : 'Submitted for review'}</h3>
      <p className="mt-1 text-[13px] text-zinc-500">{impact.status === 'Published' ? 'Thank you — you just made the next candidate\'s prep easier.' : 'Your submission is short on detail, so a moderator will review it before it goes live. Add more next time to publish instantly.'}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><Zap className="mx-auto mb-1 h-4 w-4 text-amber-400" /><div className="text-[24px] font-semibold text-amber-300">+<CountUp value={impact.xpEarned} /></div><Label className="text-zinc-600">XP</Label></div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><FileText className="mx-auto mb-1 h-4 w-4 text-sky-400" /><div className="text-[24px] font-semibold text-sky-300">{impact.quality.score}</div><Label className="text-zinc-600">Quality</Label></div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><TrendingUp className="mx-auto mb-1 h-4 w-4 text-emerald-400" /><div className="text-[24px] font-semibold text-emerald-300">{impact.questionsContributed}</div><Label className="text-zinc-600">Questions</Label></div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left">
        <Label className="mb-2 block text-zinc-500">How this grows the knowledge base</Label>
        <div className="space-y-2 text-[12.5px] text-zinc-400">
          <div className="flex items-center justify-between"><span>{impact.company.name} reports</span><span className="font-mono text-zinc-200">{impact.companyReportsBefore} → <b className="text-emerald-300">{impact.companyReportsAfter}</b></span></div>
          {impact.dataConfidenceBefore !== impact.dataConfidenceAfter && <div className="flex items-center justify-between"><span>Data confidence</span><span className="font-mono text-zinc-200">{impact.dataConfidenceBefore} → <b className="text-emerald-300">{impact.dataConfidenceAfter}</b></span></div>}
          {impact.newTopics?.length > 0 && <div className="flex items-start justify-between gap-3"><span>New topics surfaced</span><span className="flex flex-wrap justify-end gap-1">{impact.newTopics.slice(0, 5).map((t) => <span key={t} className="rounded bg-[var(--signal)]/10 px-1.5 py-0.5 text-[10.5px] text-[var(--signal)]">{t}</span>)}</span></div>}
          {impact.offerRate != null && <div className="flex items-center justify-between"><span>Community offer rate now</span><span className="font-mono text-zinc-200">{impact.offerRate}%</span></div>}
        </div>
      </div>
      {impact.achievements?.map((a) => <div key={a.key} className="mt-3 flex items-center gap-3 rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-2.5 text-left"><Award className="h-4 w-4 text-violet-300" /><div><div className="text-[12.5px] font-semibold text-violet-200">Badge: {a.title}</div><div className="text-[11px] text-violet-300/60">{a.desc} · +{a.xp} XP</div></div></div>)}

      <div className="mt-6 flex justify-center gap-3">
        <Link to={`/companies/${impact.company.slug}`} onClick={onClose} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-[12.5px] font-semibold text-black hover:brightness-110">View {impact.company.name} dossier</Link>
        <button onClick={onAnother} className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-[12.5px] text-zinc-300 hover:bg-white/[0.05]">Submit another</button>
      </div>
    </motion.div>
  );
}

// ─── main ───────────────────────────────────────────────────────────────────
export function SubmitExperienceModal({ company, companies: companiesProp, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState('start'); // start | paste | details | rounds | review | done
  const [companies, setCompanies] = useState(companiesProp || []);
  const [colleges, setColleges] = useState([]);
  const [raw, setRaw] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseInfo, setParseInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [impact, setImpact] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    companyId: company?._id || '', role: '', offerReceived: 'Pending', year: YEAR, month: MONTHS[new Date().getMonth()], difficulty: '', collegeId: '', college: '',
    cgpa: '', isAnonymous: false, rounds: [emptyRound()], overallTips: '', resourcesUsed: '', applicationSource: '', base: '', bonus: '', stock: ''
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!companies.length) companiesService.getCompanies().then((r) => setCompanies(r.data.data || [])).catch(() => {});
    collegesService.getColleges({ limit: 100 }).then((r) => {
      const list = r.data?.data?.colleges || [];
      setColleges(list);
      const mine = user?.collegeId?._id || user?.collegeId;
      if (mine) { const c = list.find((x) => x._id === mine); if (c) setForm((f) => ({ ...f, collegeId: c._id, college: c.name })); }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quality = useMemo(() => scoreQuality({ ...form, rounds: form.rounds.map((r) => ({ ...r, questions: r.questions })) }), [form]);
  const xp = estimateXp(quality.score);
  const companyName = companies.find((c) => c._id === form.companyId)?.name || company?.name || '';

  const parse = async () => {
    if (raw.trim().length < 60) { setError('Write at least a few sentences — the more detail, the better the structure.'); return; }
    setParsing(true); setError(null);
    try {
      const r = await experiencesService.parseRawDump(raw.trim(), companyName);
      const p = r.data.data;
      setParseInfo({ source: r.data.source, ai: r.data.ai, quality: r.data.quality, company: r.data.company, tracked: r.data.skillCoverage?.tracked || [] });
      setForm((f) => ({
        ...f,
        companyId: f.companyId || r.data.company?._id || '',
        role: p.role || f.role, year: p.year || f.year, month: p.month || f.month, offerReceived: p.offerReceived || f.offerReceived, difficulty: p.difficulty || f.difficulty, cgpa: p.cgpa || f.cgpa,
        rounds: p.rounds?.length ? p.rounds.map((rd) => ({ type: rd.type || 'Technical', duration: rd.duration || '', vibe: rd.vibe || '', topics: rd.topics || [], tips: rd.tips || '', questions: rd.questions?.length ? rd.questions : [{ text: '', questionType: 'DSA', topicTags: [] }] })) : f.rounds,
        overallTips: p.overallTips || f.overallTips, resourcesUsed: p.resourcesUsed || f.resourcesUsed
      }));
      setStep('details');
    } catch (e) {
      setError(e.response?.data?.error || 'Parsing failed — try the guided builder instead.');
    } finally { setParsing(false); }
  };

  const canDetails = !!form.companyId && !!form.role.trim();
  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      const payload = {
        companyId: form.companyId, role: form.role.trim(), year: form.year, month: form.month, offerReceived: form.offerReceived, difficulty: form.difficulty || undefined, cgpa: form.cgpa || undefined,
        collegeId: form.collegeId || undefined, college: form.college || undefined, isAnonymous: form.isAnonymous, applicationSource: form.applicationSource || undefined,
        compensation: form.offerReceived === 'Yes' && (form.base || form.bonus || form.stock) ? { base: form.base, bonus: form.bonus, stock: form.stock } : undefined,
        rounds: form.rounds.map((r) => ({ ...r, questions: r.questions.filter((q) => q.text.trim()) })).filter((r) => r.questions.length || r.topics.length || r.tips),
        overallTips: form.overallTips, resourcesUsed: form.resourcesUsed
      };
      const r = await experiencesService.createExperience(payload);
      setImpact(r.data.impact);
      setStep('done');
      refreshUser?.();
      onSuccess?.(r.data.impact);
      if (r.data.impact?.achievements?.length) toast.notify(r.data.impact.achievements.map((a) => ({ type: 'achievement', title: `Badge earned: ${a.title}`, message: a.desc })));
    } catch (e) {
      setError(e.response?.data?.error || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  const reset = () => { setStep('start'); setRaw(''); setParseInfo(null); setImpact(null); setForm((f) => ({ ...f, role: '', rounds: [emptyRound()], overallTips: '', resourcesUsed: '' })); };

  const STEPS = [['details', 'Basics'], ['rounds', 'Rounds'], ['review', 'Review']];
  const stepIdx = STEPS.findIndex(([k]) => k === step);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#090c11] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--signal)]/10"><Sparkles className="h-4 w-4 text-[var(--signal)]" /></span><div><div className="text-[14px] font-semibold text-zinc-100">Share your interview experience</div><div className="text-[11px] text-zinc-600">{companyName ? `${companyName} · ` : ''}Helps every student after you</div></div></div>
          {stepIdx >= 0 && (
            <div className="hidden items-center gap-2 sm:flex">{STEPS.map(([k, l], i) => <div key={k} className="flex items-center gap-2"><span className={cn('flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px]', i < stepIdx ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300' : i === stepIdx ? 'border-[var(--signal)]/50 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/10 text-zinc-600')}>{i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}</span><span className={cn('text-[11.5px]', i === stepIdx ? 'text-zinc-200' : 'text-zinc-600')}>{l}</span>{i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-white/10" />}</div>)}</div>
          )}
          <button onClick={onClose} className="text-zinc-600 transition-colors hover:text-zinc-200"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
          {step === 'done' && impact ? <div className="px-6 py-6"><Impact impact={impact} onClose={onClose} onAnother={reset} /></div> : (
            <div className={cn('grid gap-6 p-6', step !== 'start' && step !== 'paste' && 'lg:grid-cols-[1fr_290px]')}>
              <div className="min-w-0">
                <AnimatePresence mode="wait">
                  {step === 'start' && (
                    <motion.div key="start" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-2xl py-4">
                      <h2 className="text-center text-[22px] font-semibold text-zinc-100">How would you like to share it?</h2>
                      {!company?._id && <Field label="Company" required className="mx-auto mt-5 max-w-sm"><Select value={form.companyId} onChange={(e) => set('companyId', e.target.value)}><option value="">Select the company…</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></Field>}
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <button onClick={() => setStep('paste')} className="group rounded-2xl border border-[var(--signal)]/25 bg-[var(--signal)]/[0.05] p-5 text-left transition-all hover:border-[var(--signal)]/50 hover:bg-[var(--signal)]/[0.09]"><Wand2 className="mb-3 h-6 w-6 text-[var(--signal)]" /><div className="text-[15px] font-semibold text-zinc-100">Paste it — AI structures it</div><p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-500">Dump your notes or a Telegram/WhatsApp message. We extract rounds, questions, topics and outcome, then you review.</p><Pill tone="green" className="mt-3">Fastest · ~1 min</Pill></button>
                        <button onClick={() => setStep('details')} className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.04]"><ListChecks className="mb-3 h-6 w-6 text-sky-400" /><div className="text-[15px] font-semibold text-zinc-100">Guided step-by-step</div><p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-500">Fill in the basics, then add each round with questions, topics and tips. A live quality meter shows what's missing.</p><Pill tone="blue" className="mt-3">Most detailed</Pill></button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'paste' && (
                    <motion.div key="paste" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-2xl">
                      <button onClick={() => setStep('start')} className="mb-3 flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                      <h2 className="text-[20px] font-semibold text-zinc-100">Paste your experience</h2>
                      <p className="mt-1 text-[12.5px] text-zinc-500">Include the company, when it was, each round, and the questions you remember. Messy is fine.</p>
                      {!company?._id && <Field label="Company (optional — we'll detect it)" className="mt-4"><Select value={form.companyId} onChange={(e) => set('companyId', e.target.value)}><option value="">Detect from text</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></Field>}
                      <textarea rows={12} value={raw} onChange={(e) => setRaw(e.target.value)} className={cn(inputCls, 'mt-4 resize-none font-mono text-[12.5px] leading-relaxed')} placeholder={'I had my Google interview in August 2024 for SDE-1 (on campus).\n\nRound 1 — Online assessment, 90 minutes. Two problems: one shortest-path grid problem, one DP on strings…\n\nRound 2 — Technical, 45 minutes. Asked to find the minimum window…\n\nGot the offer. Tip: practise graphs with extra state.'} />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-600"><span>{raw.trim().length} characters</span><span>{raw.trim().length >= 60 ? 'Good to go' : 'Add a bit more detail'}</span></div>
                      {error && <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2.5 text-[12.5px] text-rose-300">{error}</div>}
                      <div className="mt-4 flex items-center justify-end gap-3">
                        <button onClick={() => setStep('details')} className="text-[12px] text-zinc-500 hover:text-zinc-300">Skip — fill manually</button>
                        <button onClick={parse} disabled={parsing} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-[12.5px] font-semibold text-black transition-all hover:brightness-110 disabled:opacity-60">{parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{parsing ? 'Structuring…' : 'Structure with AI'}</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'details' && (
                    <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                      {parseInfo && (
                        <div className={cn('rounded-2xl border p-4', parseInfo.source === 'ai' ? 'border-emerald-400/20 bg-emerald-400/[0.05]' : 'border-amber-400/20 bg-amber-400/[0.05]')}>
                          <div className="flex items-start gap-3">
                            {parseInfo.source === 'ai' ? <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />}
                            <div className="text-[12.5px] leading-relaxed text-zinc-300">
                              {parseInfo.source === 'ai' ? <>Structured by AI ({parseInfo.ai?.provider}{parseInfo.ai?.byok ? ', your key' : ''}). Please double-check everything below — <b>you</b> are the source of truth.</> : <>We used the built-in offline parser{parseInfo.ai?.message ? ` — ${parseInfo.ai.message}` : ''} Review each field carefully.{parseInfo.ai?.needsKey && <> <Link to="/profile#ai" onClick={onClose} className="inline-flex items-center gap-1 font-semibold text-amber-200 underline underline-offset-2"><KeyRound className="h-3 w-3" /> Add your Gemini key</Link></>}</>}
                              {parseInfo.tracked.length > 0 && <div className="mt-1.5 text-[11.5px] text-zinc-500">Feeds skill analytics for: {parseInfo.tracked.join(', ')}</div>}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Company" required><Select value={form.companyId} onChange={(e) => set('companyId', e.target.value)} disabled={!!company?._id}><option value="">Select…</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}{company?._id && !companies.some((c) => c._id === company._id) && <option value={company._id}>{company.name}</option>}</Select></Field>
                        <Field label="Role" required><input className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="SDE-1, Data Analyst, Product Manager…" list="roles" /><datalist id="roles">{['SDE-1', 'SDE-2', 'SDE Intern', 'Data Analyst', 'Product Manager', 'ML Engineer'].map((r) => <option key={r} value={r} />)}</datalist></Field>
                        <Field label="Month"><Select value={form.month} onChange={(e) => set('month', e.target.value)}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
                        <Field label="Year"><Select value={form.year} onChange={(e) => set('year', Number(e.target.value))}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Outcome"><div className="grid grid-cols-3 gap-2">{[['Yes', 'Offer', 'emerald'], ['No', 'No offer', 'rose'], ['Pending', 'Pending', 'amber']].map(([v, l, c]) => <button key={v} type="button" onClick={() => set('offerReceived', v)} className={cn('rounded-xl border py-2.5 text-[12.5px] font-medium transition-all', form.offerReceived === v ? { emerald: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300', rose: 'border-rose-400/50 bg-rose-400/10 text-rose-300', amber: 'border-amber-400/50 bg-amber-400/10 text-amber-300' }[c] : 'border-white/[0.08] text-zinc-500 hover:text-zinc-200')}>{l}</button>)}</div></Field>
                        <Field label="Difficulty"><div className="grid grid-cols-4 gap-2">{DIFFICULTIES.map((d) => <button key={d} type="button" onClick={() => set('difficulty', form.difficulty === d ? '' : d)} className={cn('rounded-xl border py-2.5 text-[11.5px] transition-all', form.difficulty === d ? 'border-[var(--signal)]/50 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-200')}>{d}</button>)}</div></Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Your college" hint="powers college-level analytics"><Select value={form.collegeId} onChange={(e) => { const c = colleges.find((x) => x._id === e.target.value); setForm((f) => ({ ...f, collegeId: e.target.value, college: c?.name || '' })); }}><option value="">Not listed / skip</option>{colleges.map((c) => <option key={c._id} value={c._id}>{c.shortName} — {c.name}</option>)}</Select></Field>
                        <Field label="CGPA (optional)"><input className={inputCls} value={form.cgpa} onChange={(e) => set('cgpa', e.target.value)} placeholder="8.4" /></Field>
                      </div>
                      {form.offerReceived === 'Yes' && (
                        <div className="grid gap-4 sm:grid-cols-3"><Field label="Base"><input className={inputCls} value={form.base} onChange={(e) => set('base', e.target.value)} placeholder="24 LPA" /></Field><Field label="Bonus"><input className={inputCls} value={form.bonus} onChange={(e) => set('bonus', e.target.value)} placeholder="3 LPA" /></Field><Field label="Stock / ESOP"><input className={inputCls} value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="$50k RSUs" /></Field></div>
                      )}
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"><input type="checkbox" checked={form.isAnonymous} onChange={(e) => set('isAnonymous', e.target.checked)} className="h-4 w-4 accent-emerald-400" /><span className="text-[12.5px] text-zinc-300">Post anonymously <span className="text-zinc-600">— your name is never shown to other students</span></span></label>
                      <div className="flex justify-end"><button disabled={!canDetails} onClick={() => setStep('rounds')} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-[12.5px] font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">Continue to rounds <ArrowRight className="h-4 w-4" /></button></div>
                    </motion.div>
                  )}

                  {step === 'rounds' && (
                    <motion.div key="rounds" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      {form.rounds.map((r, i) => <RoundEditor key={i} round={r} index={i} canRemove={form.rounds.length > 1} onChange={(nr) => set('rounds', form.rounds.map((x, j) => (j === i ? nr : x)))} onRemove={() => set('rounds', form.rounds.filter((_, j) => j !== i))} />)}
                      {form.rounds.length < 8 && <button onClick={() => set('rounds', [...form.rounds, emptyRound()])} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.12] py-3 text-[12.5px] text-zinc-500 transition-colors hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"><Plus className="h-4 w-4" /> Add round</button>}
                      <Field label="Overall advice"><textarea rows={3} className={cn(inputCls, 'resize-none')} value={form.overallTips} onChange={(e) => set('overallTips', e.target.value)} placeholder="If you could tell the next candidate three things, what would they be?" /></Field>
                      <Field label="Resources you used" hint="comma separated"><input className={inputCls} value={form.resourcesUsed} onChange={(e) => set('resourcesUsed', e.target.value)} placeholder="LeetCode, NeetCode 150, Striver sheet, Grokking System Design" /></Field>
                      <div className="flex justify-between"><button onClick={() => setStep('details')} className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-4 w-4" /> Back</button><button onClick={() => setStep('review')} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-[12.5px] font-semibold text-black hover:brightness-110">Preview <ArrowRight className="h-4 w-4" /></button></div>
                    </motion.div>
                  )}

                  {step === 'review' && (
                    <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex items-center gap-2 text-[12.5px] text-zinc-500"><Building2 className="h-4 w-4" /> This is exactly how your report will appear to other students.</div>
                      <Preview form={form} companyName={companyName} />
                      {quality.score < 25 && <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 text-[12.5px] text-amber-200">Heads up: very short submissions go to a moderator first. Add a few concrete questions to publish instantly.</div>}
                      {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2.5 text-[12.5px] text-rose-300">{error}</div>}
                      <div className="flex justify-between"><button onClick={() => setStep('rounds')} className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-200"><ArrowLeft className="h-4 w-4" /> Edit</button><button onClick={submit} disabled={submitting} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-[12.5px] font-semibold text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Publish · +{xp} XP</button></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {(step === 'details' || step === 'rounds' || step === 'review') && <div className="lg:sticky lg:top-0 lg:self-start"><QualityPanel quality={quality} xp={xp} /></div>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
