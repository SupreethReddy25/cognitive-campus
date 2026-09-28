import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Clock, Link2, Loader2, Plus, RotateCcw, Sparkles, Trash2, X, XCircle } from 'lucide-react';
import { companiesService, experiencesService, problemsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { scoreQuality, estimateXp } from '../../lib/experienceQuality';
import { canonicalTag, detectTopics, matchProblem } from '../../lib/topicDetect';
import { CompanyLogo, CountUp, Ring, cn } from '../ui/kit';

/**
 * ShareSheet — how a student tells us about an interview.
 *
 * Built around three ideas: ask for the least first (four taps and you have a valid report), let people speak the way they
 * already do (paste a WhatsApp message and we structure it; type a question and we tag it), and show the value immediately
 * (the report assembles itself on the right, with what it is worth). Nothing is mandatory beyond the basics, the draft is
 * saved as you go, and closing never asks "are you sure?".
 */

const EASE = [0.22, 1, 0.36, 1];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const NOW = new Date();
const YEARS = Array.from({ length: 6 }, (_, i) => NOW.getFullYear() + (NOW.getMonth() > 8 ? 1 : 0) - i);
const OUTCOMES = [['Yes', 'Got the offer'], ['No', 'Didn’t get it'], ['Pending', 'Still waiting']];
const ROUND_TYPES = ['OA', 'Technical', 'Managerial', 'HR', 'GD'];
const DURATIONS = ['30 min', '45 min', '60 min', '90 min', '2 hours+'];
const VIBES = ['Friendly', 'Neutral', 'Grilling'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard'];
const RESOURCES = ['LeetCode', 'Striver / A2Z', 'GeeksforGeeks', 'InterviewBit', 'NeetCode', 'CTCI book', 'Mock interviews', 'Seniors', 'YouTube'];
const DRAFT_KEY = 'cc_share_draft_v2';
const PARSE_STAGES = ['Reading your notes…', 'Finding the rounds…', 'Pulling out the questions…', 'Tidying up…'];
const STEPS = [['basics', 'The result'], ['rounds', 'The rounds'], ['finish', 'One last thing']];

let uid = 0;
const nextId = () => `r${Date.now().toString(36)}${uid++}`;
const blankQuestion = () => ({ id: nextId(), text: '', questionType: null, topicTags: [], tagsTouched: false, problemId: null, problemTitle: null });
const blankRound = (type = 'Technical') => ({ id: nextId(), type, duration: '', vibe: '', questions: [blankQuestion()] });
const monthsAgo = (n) => { const d = new Date(NOW.getFullYear(), NOW.getMonth() - n, 1); return { year: d.getFullYear(), month: MONTHS[d.getMonth()] }; };

const initialForm = (company, user) => ({
  companyId: company?._id || '',
  role: '',
  offerReceived: '',
  ...monthsAgo(0),
  rounds: [],
  overallTips: '',
  resources: [],
  difficulty: '',
  ctc: '',
  isAnonymous: true,
  collegeId: user?.collegeId?._id || null
});

const underline = 'w-full border-b border-white/[0.14] bg-transparent py-2.5 text-[16px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-[var(--signal)]';

/** A row of mutually exclusive choices; the highlight glides between them. */
function Choice({ id, value, onChange, options, size = 'md' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const [k, label] = Array.isArray(opt) ? opt : [opt, opt];
        const on = value === k;
        return (
          <button key={k} type="button" onClick={() => onChange(on && size === 'sm' ? '' : k)}
            className={cn('relative border font-mono uppercase tracking-[0.14em] transition-colors duration-300', size === 'sm' ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2.5 text-[10.5px]', on ? 'border-white/45 text-zinc-50' : 'border-white/[0.09] text-zinc-500 hover:border-white/25 hover:text-zinc-200')}>
            {on && <motion.span layoutId={`choice-${id}`} className="absolute inset-0 bg-white/[0.08]" transition={{ type: 'spring', stiffness: 480, damping: 38 }} />}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Label({ children, hint }) {
  return <div className="mb-3 flex items-baseline gap-3"><span className="tag !text-zinc-400">{children}</span>{hint && <span className="text-[12.5px] text-zinc-600">{hint}</span>}</div>;
}

/* ───────────────────────────── company picker ───────────────────────────── */

function CompanyPicker({ companies, value, onPick }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const chosen = companies.find((c) => c._id === value);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? companies.filter((c) => c.name.toLowerCase().includes(s)) : [...companies].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))).slice(0, 6);
  }, [companies, q]);

  if (chosen && !open) {
    return (
      <div className="flex items-center gap-4">
        <CompanyLogo company={chosen} size={52} />
        <div className="min-w-0 flex-1"><div className="display text-[32px] leading-none text-zinc-50">{chosen.name}</div><div className="tag mt-1.5">{chosen.tier}</div></div>
        <button type="button" onClick={() => { setOpen(true); setQ(''); }} className="tag transition-colors hover:!text-zinc-100">Change</button>
      </div>
    );
  }
  const pick = (c) => { onPick(c); setOpen(false); setQ(''); };
  return (
    <div className="relative">
      <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }} placeholder="Which company?"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, list.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter' && list[idx]) { e.preventDefault(); pick(list[idx]); }
        }}
        className={cn(underline, 'display !text-[30px]')} />
      <ul className="mt-2 border border-white/[0.09] bg-[#0c0c0c]">
        {list.map((c, i) => (
          <li key={c._id}>
            <button type="button" onMouseEnter={() => setIdx(i)} onClick={() => pick(c)} className={cn('flex w-full items-center gap-4 px-4 py-3 text-left transition-colors', i === idx ? 'bg-white/[0.05]' : '')}>
              <CompanyLogo company={c} size={30} />
              <span className="flex-1 text-[16px] text-zinc-100">{c.name}</span>
              <span className="tag !text-[9.5px]">{c.experienceCount ? `${c.experienceCount} reports` : 'be the first'}</span>
            </button>
          </li>
        ))}
        {!list.length && <li className="px-4 py-5 text-[14px] text-zinc-600">No company by that name yet.</li>}
      </ul>
    </div>
  );
}

/* ───────────────────────────── one question ───────────────────────────── */

function QuestionLine({ q, problems, onChange, onEnter, onRemove, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  useEffect(() => { if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = `${ref.current.scrollHeight}px`; } }, [q.text]);
  const suggestion = !q.problemId ? matchProblem(q.text, problems) : null;

  const edit = (text) => {
    const next = { ...q, text };
    if (!q.tagsTouched) { const d = detectTopics(text); next.topicTags = d.topics; next.questionType = d.questionType; }
    onChange(next);
  };
  const dropTag = (t) => onChange({ ...q, topicTags: q.topicTags.filter((x) => x !== t), tagsTouched: true });

  return (
    <div className="group/q relative">
      <textarea ref={ref} rows={1} value={q.text} onChange={(e) => edit(e.target.value)} placeholder="A question you were asked — even roughly…"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (q.text.trim()) onEnter(); }
          else if (e.key === 'Backspace' && !q.text) { e.preventDefault(); onRemove(); }
        }}
        className="block w-full resize-none overflow-hidden border-b border-white/[0.08] bg-transparent py-2 pr-8 text-[15px] leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-700 focus:border-[var(--signal)]" />
      <button type="button" onClick={onRemove} aria-label="Remove question" className="absolute right-0 top-2.5 text-zinc-700 opacity-0 transition-opacity hover:text-rose-400 group-hover/q:opacity-100"><X className="h-3.5 w-3.5" /></button>
      <AnimatePresence initial={false}>
        {(q.topicTags.length > 0 || suggestion || q.problemId) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="flex flex-wrap items-center gap-1.5 overflow-hidden pt-2">
            {q.topicTags.map((t) => (
              <button key={t} type="button" onClick={() => dropTag(t)} title="Remove tag" className="group/t flex items-center gap-1 border border-white/[0.1] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:border-rose-400/40 hover:text-rose-300">
                {t}<X className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/t:opacity-100" />
              </button>
            ))}
            {q.problemId ? (
              <button type="button" onClick={() => onChange({ ...q, problemId: null, problemTitle: null })} className="flex items-center gap-1.5 border border-[var(--signal)]/40 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--signal)]"><Link2 className="h-2.5 w-2.5" />{q.problemTitle}</button>
            ) : suggestion && (
              <button type="button" onClick={() => onChange({ ...q, problemId: suggestion._id, problemTitle: suggestion.title })} className="flex items-center gap-1.5 border border-dashed border-[var(--signal)]/50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--signal)] transition-colors hover:bg-[var(--signal)]/10"><Link2 className="h-2.5 w-2.5" />Link “{suggestion.title}”</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────────── one round ───────────────────────────── */

function RoundCard({ round, index, problems, onChange, onRemove }) {
  const [focusLast, setFocusLast] = useState(false);
  const setQ = (qi, patch) => onChange({ ...round, questions: round.questions.map((q, i) => (i === qi ? patch : q)) });
  const addQ = () => { onChange({ ...round, questions: [...round.questions, blankQuestion()] }); setFocusLast(true); };
  const rmQ = (qi) => onChange({ ...round, questions: round.questions.length > 1 ? round.questions.filter((_, i) => i !== qi) : [blankQuestion()] });
  return (
    <motion.li layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }} transition={{ duration: 0.5, ease: EASE }} className="relative pl-12">
      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center border border-[var(--signal)]/60 bg-[#0a0a0a] font-mono text-[11px] text-[var(--signal)]">{index + 1}</span>
      <div className="border border-white/[0.08] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Choice id={`type-${round.id}`} size="sm" value={round.type} onChange={(v) => v && onChange({ ...round, type: v })} options={[...new Set([...ROUND_TYPES, round.type])]} />
          <button type="button" onClick={onRemove} aria-label="Remove round" className="text-zinc-600 transition-colors hover:text-rose-400"><Trash2 className="h-4 w-4" strokeWidth={1.6} /></button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-3"><Clock className="h-3.5 w-3.5 text-zinc-600" /><Choice id={`dur-${round.id}`} size="sm" value={round.duration} onChange={(v) => onChange({ ...round, duration: v })} options={DURATIONS} /></div>
          <Choice id={`vibe-${round.id}`} size="sm" value={round.vibe} onChange={(v) => onChange({ ...round, vibe: v })} options={VIBES} />
        </div>
        <div className="mt-6 space-y-3">
          {round.questions.map((q, qi) => (
            <QuestionLine key={q.id} q={q} problems={problems} autoFocus={focusLast && qi === round.questions.length - 1} onChange={(p) => setQ(qi, p)} onEnter={addQ} onRemove={() => rmQ(qi)} />
          ))}
        </div>
        <button type="button" onClick={addQ} className="tag mt-4 flex items-center gap-2 transition-colors hover:!text-zinc-100"><Plus className="h-3 w-3" />Another question</button>
      </div>
    </motion.li>
  );
}

/* ───────────────────────────── live report ───────────────────────────── */

function LiveReport({ company, form, quality, xp, showCoach }) {
  const topics = [...new Set(form.rounds.flatMap((r) => r.questions.flatMap((q) => q.topicTags)))].slice(0, 8);
  const outcome = OUTCOMES.find(([k]) => k === form.offerReceived)?.[1];
  const qCount = form.rounds.reduce((n, r) => n + r.questions.filter((q) => q.text.trim()).length, 0);
  return (
    <aside className="hidden border-l border-[var(--line)] bg-white/[0.012] p-8 lg:block">
      <div className="tag mb-5">Your report, as others will see it</div>
      <div className="border border-white/[0.09] bg-[#0a0a0a] p-5">
        <div className="flex items-center gap-3">
          {company ? <CompanyLogo company={company} size={36} /> : <div className="h-9 w-9 border border-dashed border-white/[0.14]" />}
          <div className="min-w-0"><div className="display truncate text-[22px] leading-none text-zinc-100">{company?.name || 'Company'}</div><div className="tag mt-1 !text-[9px]">{form.role || 'Role'} · {form.month.slice(0, 3)} {form.year}</div></div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {outcome ? <span className={cn('tag !text-[9.5px]', form.offerReceived === 'Yes' ? '!text-emerald-400' : form.offerReceived === 'No' ? '!text-rose-400' : '!text-amber-400')}>{outcome}</span> : <span className="tag !text-[9.5px] !text-zinc-700">Outcome</span>}
          {form.difficulty && <span className="tag !text-[9.5px]">· {form.difficulty}</span>}
        </div>
        <ol className="mt-5 space-y-3 border-l border-white/[0.1] pl-4">
          <AnimatePresence initial={false}>
            {form.rounds.map((r) => (
              <motion.li key={r.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--signal)]" />
                <div className="flex items-baseline justify-between gap-3 text-[13.5px]"><span className="text-zinc-200">{r.type}</span><span className="tag !text-[9px]">{[r.duration, `${r.questions.filter((q) => q.text.trim()).length} Q`].filter(Boolean).join(' · ')}</span></div>
              </motion.li>
            ))}
          </AnimatePresence>
          {!form.rounds.length && <li className="text-[12.5px] text-zinc-700">Rounds appear here as you add them.</li>}
        </ol>
        {topics.length > 0 && <div className="mt-5 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-4">{topics.map((t) => <span key={t} className="border border-white/[0.1] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">{t}</span>)}</div>}
      </div>

      <div className="mt-6 flex items-center gap-5">
        <Ring value={quality.score / 100} size={72} stroke={4} color={quality.score >= 65 ? '#34d399' : quality.score >= 40 ? '#fbbf24' : '#71717a'}>
          <span className="display text-[22px] tnum text-zinc-100">{quality.score}</span>
        </Ring>
        <div><div className="text-[15px] text-zinc-200">{quality.grade}</div><div className="mt-1 text-[12.5px] text-zinc-600"><span className="tnum text-[var(--star)]">+{xp} XP</span> · {qCount} question{qCount === 1 ? '' : 's'}</div></div>
      </div>
      <AnimatePresence>
        {showCoach && quality.score < 85 && quality.suggestions[0] && (
          <motion.p key={quality.suggestions[0]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 border-l border-[var(--signal)]/50 pl-4 text-[13px] leading-relaxed text-zinc-500">{quality.suggestions[0]}</motion.p>
        )}
      </AnimatePresence>
      {company && <p className="mt-8 text-[12.5px] leading-relaxed text-zinc-600">{company.experienceCount ? `${company.experienceCount} report${company.experienceCount === 1 ? '' : 's'} so far — yours would be #${company.experienceCount + 1}.` : `No one has shared ${company.name} yet — yours would be the first.`}</p>}
    </aside>
  );
}

/* ───────────────────────────── done ───────────────────────────── */

function Done({ impact, onClose, onAnother }) {
  const gain = impact.companyReportsAfter - impact.companyReportsBefore;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="mx-auto flex h-full max-w-xl flex-col justify-center px-8 py-10 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }} className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--signal)] text-[var(--signal)]"><Check className="h-6 w-6" strokeWidth={2.4} /></motion.div>
      <h2 className="display text-[clamp(40px,5vw,64px)] text-zinc-50">Thank <em className="text-[var(--signal)]">you</em>.</h2>
      <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-zinc-400">Someone preparing for {impact.company.name} next month will read what you just wrote.</p>
      <div className="mt-10 grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)]">
        {[[`+${impact.xpEarned}`, 'XP earned', true], [impact.questionsContributed, 'questions added'], [gain > 0 ? `${impact.companyReportsBefore} → ${impact.companyReportsAfter}` : impact.companyReportsAfter, 'reports on file']].map(([v, l, n], i) => (
          <div key={i} className="bg-[#0a0a0a] p-5"><div className="display text-[30px] leading-none tnum text-zinc-50">{n ? <>+<CountUp value={impact.xpEarned} /></> : v}</div><div className="tag mt-2 !text-[9px]">{l}</div></div>
        ))}
      </div>
      {(impact.newTopics?.length > 0 || impact.dataConfidenceBefore !== impact.dataConfidenceAfter) && (
        <div className="mt-6 space-y-2 text-left text-[13.5px] text-zinc-500">
          {impact.dataConfidenceBefore !== impact.dataConfidenceAfter && <div>Confidence in {impact.company.name}’s data went from <span className="text-zinc-300">{impact.dataConfidenceBefore}</span> to <span className="text-[var(--signal)]">{impact.dataConfidenceAfter}</span>.</div>}
          {impact.newTopics?.length > 0 && <div>New topics on the dossier: <span className="text-zinc-300">{impact.newTopics.join(', ')}</span>.</div>}
        </div>
      )}
      {impact.achievements?.map((a) => <div key={a.key} className="mt-4 border border-[var(--signal)]/30 bg-[var(--signal)]/[0.05] px-4 py-3 text-left text-[14px] text-zinc-200">Badge earned — {a.title}</div>)}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Link to={`/companies/${impact.company.slug}`} onClick={onClose} className="btn-line group">See it on the dossier<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></Link>
        <button type="button" onClick={onAnother} className="tag transition-colors hover:!text-zinc-100">Share another interview</button>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────── the sheet ───────────────────────────── */

export function ShareSheet({ company: preset, companies: companiesProp, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [companies, setCompanies] = useState(companiesProp || []);
  const [problems, setProblems] = useState([]);
  const [step, setStep] = useState('basics');
  const [form, setForm] = useState(() => initialForm(preset, user));
  const [raw, setRaw] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState(null);
  const [undo, setUndo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [impact, setImpact] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [stage, setStage] = useState(0);
  const scroller = useRef(null);

  const company = companies.find((c) => c._id === form.companyId) || (preset && preset._id === form.companyId ? preset : null);
  const set = useCallback((patch) => setForm((f) => ({ ...f, ...patch })), []);

  // data the sheet leans on — the company list, and the catalogue for linking questions to practice
  useEffect(() => {
    if (!companies.length) companiesService.getCompanies().then((r) => setCompanies(r.data.data)).catch(() => {});
    problemsService.getProblems({ limit: 200 }).then((r) => { const p = r.data?.data?.problems || r.data?.data || []; setProblems(Array.isArray(p) ? p : []); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // a draft from an earlier visit is offered, never forced
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d && Date.now() - d.at < 7 * 86400000 && d.form?.companyId && (!preset || preset._id === d.form.companyId) && (d.form.rounds?.length || d.form.role)) setDraft(d);
    } catch { /* no draft */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // save as you go
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) { touched.current = true; return undefined; }
    if (impact) return undefined;
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), form, step })); setSavedAt(Date.now()); } catch { /* storage unavailable */ }
    }, 700);
    return () => clearTimeout(t);
  }, [form, step, impact]);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);

  // while notes are being read, the status line moves on so a slow answer never looks stuck
  useEffect(() => {
    if (!parsing) { setStage(0); return undefined; }
    const id = setInterval(() => setStage((n) => Math.min(n + 1, PARSE_STAGES.length - 1)), 2600);
    return () => clearInterval(id);
  }, [parsing]);

  const payloadRounds = useMemo(() => form.rounds.map((r) => {
    const questions = r.questions.filter((q) => q.text.trim()).map((q) => ({ text: q.text.trim(), questionType: q.questionType || undefined, topicTags: q.topicTags, problemId: q.problemId || undefined }));
    return { type: r.type, duration: r.duration || undefined, vibe: r.vibe || undefined, topics: [...new Set(questions.flatMap((q) => q.topicTags))], questions };
  }), [form.rounds]);
  const payload = useMemo(() => ({
    companyId: form.companyId, role: form.role.trim(), year: form.year, month: form.month, offerReceived: form.offerReceived,
    difficulty: form.difficulty || undefined, isAnonymous: form.isAnonymous, collegeId: form.collegeId || undefined,
    compensation: form.offerReceived === 'Yes' && form.ctc ? { base: `${form.ctc} LPA` } : undefined,
    overallTips: form.overallTips.trim() || undefined, resourcesUsed: form.resources.join(', ') || undefined, rounds: payloadRounds
  }), [form, payloadRounds]);
  const quality = useMemo(() => scoreQuality(payload), [payload]);
  const xp = estimateXp(quality.score);

  const basicsOk = !!(form.companyId && form.role.trim() && form.offerReceived);
  const publishable = basicsOk && quality.score >= 25;
  const stepIdx = STEPS.findIndex(([k]) => k === step);
  const go = (s) => { setStep(s); scroller.current?.scrollTo({ top: 0, behavior: 'smooth' }); };

  const applyParsed = (data) => {
    const rounds = (data.rounds || []).map((r) => ({
      id: nextId(), type: r.type || 'Technical', duration: r.duration || '', vibe: VIBES.includes(r.vibe) ? r.vibe : '',
      questions: (r.questions?.length ? r.questions : [{ text: '' }]).map((q) => {
        const given = [...new Set((q.topicTags || []).map(canonicalTag).filter(Boolean))];
        const seen = given.length ? null : detectTopics(q.text || '');
        return { id: nextId(), text: q.text || '', questionType: q.questionType || seen?.questionType || null, topicTags: given.length ? given : seen.topics, tagsTouched: given.length > 0, problemId: null, problemTitle: null };
      })
    }));
    setUndo({ form, raw });
    setForm((f) => ({
      ...f,
      role: f.role || data.role || '',
      offerReceived: f.offerReceived || (['Yes', 'No', 'Pending'].includes(data.offerReceived) ? data.offerReceived : ''),
      difficulty: f.difficulty || (DIFFICULTIES.includes(data.difficulty) ? data.difficulty : ''),
      overallTips: f.overallTips || data.overallTips || '',
      resources: f.resources.length ? f.resources : RESOURCES.filter((r) => String(data.resourcesUsed || '').toLowerCase().includes(r.split(' ')[0].toLowerCase())),
      rounds: [...f.rounds.filter((r) => r.questions.some((q) => q.text.trim())), ...rounds]
    }));
    return rounds;
  };

  const structure = async (text = raw) => {
    if (parsing || text.trim().length < 40) return;
    setParsing(true); setParseNote(null);
    try {
      const r = await experiencesService.parseRawDump(text, company?.name);
      const rounds = applyParsed(r.data.data);
      const qs = rounds.reduce((n, x) => n + x.questions.filter((q) => q.text).length, 0);
      setRaw('');
      setParseNote({ rounds: rounds.length, questions: qs, ai: r.data.ai });
    } catch (e) {
      toast.error('Couldn’t read that', e.response?.data?.error || 'You can still add the rounds yourself below.');
    } finally { setParsing(false); }
  };

  const submit = async () => {
    if (!publishable || submitting) return;
    setSubmitting(true);
    try {
      const r = await experiencesService.createExperience(payload);
      setImpact(r.data.impact);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      refreshUser?.();
      onSuccess?.();
    } catch (e) {
      toast.error('Couldn’t publish', e.response?.data?.error || 'Please try again in a moment.');
    } finally { setSubmitting(false); }
  };

  const reset = () => { setImpact(null); setForm(initialForm(preset, user)); setRaw(''); setParseNote(null); setUndo(null); setStep('basics'); };
  const setRound = (id, next) => set({ rounds: form.rounds.map((r) => (r.id === id ? next : r)) });
  const addRound = (type) => set({ rounds: [...form.rounds, blankRound(type)] });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-0 backdrop-blur-md sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.5, ease: EASE }}
        role="dialog" aria-label="Share your interview" className="relative flex h-full w-full max-w-[1180px] flex-col overflow-hidden border border-white/[0.12] bg-[#0a0a0a] sm:h-[min(860px,94vh)]">
        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-[var(--line)] px-6 py-4 sm:px-8">
          {impact ? <span className="tag">Published</span> : (
            <ol className="flex items-center gap-6 sm:gap-8">
              {STEPS.map(([k, l], i) => (
                <li key={k} className={cn('relative flex items-center gap-2.5 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors', i <= stepIdx ? 'text-zinc-100' : 'text-zinc-600')}>
                  <span className={i < stepIdx ? 'text-[var(--signal)]' : ''}>{i < stepIdx ? <Check className="h-3 w-3" strokeWidth={3} /> : `0${i + 1}`}</span><span className="hidden sm:inline">{l}</span>
                  {i === stepIdx && <motion.span layoutId="share-step" className="absolute inset-x-0 -bottom-[17px] h-px bg-[var(--signal)]" />}
                </li>
              ))}
            </ol>
          )}
          <div className="flex items-center gap-5">
            {!impact && savedAt && <span className="tag hidden !text-[9px] !text-zinc-700 sm:inline">Draft saved</span>}
            <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-500 transition-colors hover:text-zinc-100"><X className="h-5 w-5" strokeWidth={1.6} /></button>
          </div>
        </header>

        <div className={cn('grid min-h-0 flex-1', !impact && 'lg:grid-cols-[minmax(0,1fr)_340px]')}>
          <div ref={scroller} className="min-h-0 overflow-y-auto scrollbar-surgical">
            {impact ? <Done impact={impact} onClose={onClose} onAnother={reset} /> : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }} transition={{ duration: 0.45, ease: EASE }} className="px-6 py-8 sm:px-10 sm:py-10">
                  {step === 'basics' && (
                    <div className="mx-auto max-w-xl space-y-12">
                      <div>
                        <h2 className="display text-[clamp(32px,4vw,46px)] text-zinc-50">How did it <em>go</em>?</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">Four quick answers, then tell it your way. It takes about two minutes and can be anonymous.</p>
                      </div>
                      {draft && !form.rounds.length && !form.role && (
                        <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--signal)]/30 bg-[var(--signal)]/[0.04] px-5 py-4">
                          <span className="text-[14px] text-zinc-300">You have an unfinished report for <span className="text-zinc-50">{companies.find((c) => c._id === draft.form.companyId)?.name || 'a company'}</span>.</span>
                          <span className="flex gap-5"><button type="button" onClick={() => { setForm(draft.form); setStep(draft.step === 'finish' ? 'rounds' : draft.step); setDraft(null); }} className="tag !text-[var(--signal)]">Resume</button><button type="button" onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } setDraft(null); }} className="tag">Discard</button></span>
                        </div>
                      )}
                      <div><Label>Company</Label><CompanyPicker companies={companies} value={form.companyId} onPick={(c) => set({ companyId: c._id })} /></div>
                      <div>
                        <Label>The outcome</Label>
                        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
                          {OUTCOMES.map(([k, l]) => {
                            const on = form.offerReceived === k;
                            const Icon = k === 'Yes' ? Check : k === 'No' ? XCircle : Clock;
                            return (
                              <button key={k} type="button" onClick={() => set({ offerReceived: k })} className={cn('relative flex items-center gap-3 bg-[#0a0a0a] px-5 py-5 text-left transition-colors duration-300', on ? 'text-zinc-50' : 'text-zinc-500 hover:bg-[#0e0e0e] hover:text-zinc-200')}>
                                {on && <motion.span layoutId="outcome-on" className="absolute inset-0 border border-white/40 bg-white/[0.05]" transition={{ type: 'spring', stiffness: 460, damping: 38 }} />}
                                <Icon className={cn('relative h-4 w-4', on && (k === 'Yes' ? 'text-emerald-400' : k === 'No' ? 'text-rose-400' : 'text-amber-400'))} strokeWidth={1.8} /><span className="relative text-[15px]">{l}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label hint="What the role was called">Role</Label>
                        <input value={form.role} onChange={(e) => set({ role: e.target.value })} placeholder="e.g. SDE-1, Intern" className={underline} />
                        {company?.roles?.length > 0 && <div className="mt-4"><Choice id="role" size="sm" value={form.role} onChange={(v) => v && set({ role: v })} options={company.roles.slice(0, 5)} /></div>}
                      </div>
                      <div>
                        <Label>When</Label>
                        <Choice id="when" size="sm" value={`${form.month} ${form.year}`} onChange={(v) => { const m = [monthsAgo(0), monthsAgo(1)].find((o) => `${o.month} ${o.year}` === v); if (m) set(m); }}
                          options={[monthsAgo(0), monthsAgo(1)].map((o, i) => [`${o.month} ${o.year}`, i ? 'Last month' : 'This month'])} />
                        <div className="mt-4 flex items-center gap-4 text-[14px] text-zinc-500">
                          <span>or</span>
                          <select value={form.month} onChange={(e) => set({ month: e.target.value })} className="border-b border-white/[0.14] bg-transparent py-1.5 text-zinc-200 outline-none focus:border-[var(--signal)]">{MONTHS.map((m) => <option key={m} className="bg-[#0a0a0a]">{m}</option>)}</select>
                          <select value={form.year} onChange={(e) => set({ year: Number(e.target.value) })} className="border-b border-white/[0.14] bg-transparent py-1.5 text-zinc-200 outline-none focus:border-[var(--signal)]">{YEARS.map((y) => <option key={y} className="bg-[#0a0a0a]">{y}</option>)}</select>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 'rounds' && (
                    <div className="mx-auto max-w-2xl space-y-10">
                      <div>
                        <h2 className="display text-[clamp(32px,4vw,46px)] text-zinc-50">Walk us <em>through</em> it.</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">Paste your notes and we’ll sort them into rounds — or build it round by round. The questions are the part the next student will value most.</p>
                      </div>

                      <div className="relative border border-white/[0.1] transition-colors focus-within:border-[var(--signal)]/60">
                        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5} disabled={parsing}
                          onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t.trim().length > 120 && !raw.trim()) { e.preventDefault(); setRaw(t); structure(t); } }}
                          placeholder={'Paste anything — a WhatsApp message, a Notion page, a rough paragraph.\n\n“OA was 2 DSA on HackerRank (90 min), one was a grid BFS. Then two technical rounds, first on arrays and a project deep dive…”'}
                          className="block w-full resize-none bg-transparent p-5 text-[15px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700" />
                        <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-3">
                          <span className="text-[12.5px] text-zinc-600">{parsing ? PARSE_STAGES[stage] : raw.trim().length >= 40 ? 'Ready when you are.' : 'Pasting a long note structures it automatically.'}</span>
                          <button type="button" onClick={() => structure()} disabled={parsing || raw.trim().length < 40} className="btn-line group !px-4 !py-2 !text-[10px] disabled:opacity-40">{parsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />}Sort it into rounds</button>
                        </div>
                        {parsing && <motion.span className="absolute inset-x-0 top-0 h-px bg-[var(--signal)]" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 6, ease: 'linear' }} />}
                      </div>

                      {parsing && (
                        <div className="space-y-3" aria-hidden>
                          {[0, 1].map((i) => <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.25, 0.6, 0.25] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }} className="h-24 border border-white/[0.08] bg-white/[0.02]" />)}
                        </div>
                      )}

                      <AnimatePresence>
                        {parseNote && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center justify-between gap-4 border border-[var(--signal)]/30 bg-[var(--signal)]/[0.04] px-5 py-4">
                            <div className="text-[14px] leading-relaxed text-zinc-300">
                              Found <span className="text-zinc-50">{parseNote.rounds} round{parseNote.rounds === 1 ? '' : 's'}</span> and <span className="text-zinc-50">{parseNote.questions} question{parseNote.questions === 1 ? '' : 's'}</span> — check they look right.
                              {parseNote.ai && !parseNote.ai.used && <span className="block text-[12.5px] text-zinc-600">Sorted with the built-in reader. Add your own AI key in Profile for sharper results.</span>}
                            </div>
                            {undo && <button type="button" onClick={() => { setForm(undo.form); setRaw(undo.raw); setUndo(null); setParseNote(null); }} className="tag flex items-center gap-2 transition-colors hover:!text-zinc-100"><RotateCcw className="h-3 w-3" />Undo</button>}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <ol className="relative space-y-6 before:absolute before:bottom-8 before:left-4 before:top-8 before:w-px before:bg-white/[0.09]">
                        <AnimatePresence initial={false}>
                          {form.rounds.map((r, i) => <RoundCard key={r.id} round={r} index={i} problems={problems} onChange={(next) => setRound(r.id, next)} onRemove={() => set({ rounds: form.rounds.filter((x) => x.id !== r.id) })} />)}
                        </AnimatePresence>
                      </ol>

                      <div>
                        <div className="tag mb-3 !text-zinc-500">{form.rounds.length ? 'Add another round' : 'Or add a round yourself'}</div>
                        <div className="flex flex-wrap gap-2">
                          {[...ROUND_TYPES, 'Other'].map((t) => <button key={t} type="button" onClick={() => addRound(t === 'Other' ? 'Technical' : t)} className="flex items-center gap-2 border border-white/[0.1] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:border-white/35 hover:text-zinc-100"><Plus className="h-3 w-3" />{t}</button>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 'finish' && (
                    <div className="mx-auto max-w-xl space-y-12">
                      <div>
                        <h2 className="display text-[clamp(32px,4vw,46px)] text-zinc-50">One last <em>thing</em>.</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-zinc-500">All optional — but a sentence of advice is the most useful thing on a dossier.</p>
                      </div>
                      <div>
                        <Label hint="What would you tell the next student?">Your advice</Label>
                        <textarea value={form.overallTips} onChange={(e) => set({ overallTips: e.target.value })} rows={4} placeholder="What surprised you, what you’d prepare differently, what they really cared about…" className="block w-full resize-none border border-white/[0.1] bg-transparent p-4 text-[15px] leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-700 focus:border-[var(--signal)]/60" />
                      </div>
                      <div><Label>How hard was it overall?</Label><Choice id="diff" size="sm" value={form.difficulty} onChange={(v) => set({ difficulty: v })} options={DIFFICULTIES} /></div>
                      <div>
                        <Label>What you prepared with</Label>
                        <div className="flex flex-wrap gap-2">
                          {RESOURCES.map((r) => {
                            const on = form.resources.includes(r);
                            return <button key={r} type="button" onClick={() => set({ resources: on ? form.resources.filter((x) => x !== r) : [...form.resources, r] })} className={cn('flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors', on ? 'border-[var(--signal)]/60 bg-[var(--signal)]/[0.08] text-zinc-50' : 'border-white/[0.09] text-zinc-500 hover:border-white/25 hover:text-zinc-200')}>{on && <Check className="h-3 w-3 text-[var(--signal)]" strokeWidth={3} />}{r}</button>;
                          })}
                        </div>
                      </div>
                      {form.offerReceived === 'Yes' && (
                        <div><Label hint="Optional — shown as a range, never with your name">Package (LPA)</Label><input value={form.ctc} onChange={(e) => set({ ctc: e.target.value.replace(/[^\d.]/g, '').slice(0, 5) })} inputMode="decimal" placeholder="e.g. 24" className={cn(underline, 'max-w-[180px]')} /></div>
                      )}
                      <button type="button" onClick={() => set({ isAnonymous: !form.isAnonymous })} className="flex w-full items-start gap-4 border border-white/[0.09] p-5 text-left transition-colors hover:border-white/25">
                        <span className={cn('relative mt-0.5 h-5 w-9 shrink-0 border transition-colors', form.isAnonymous ? 'border-[var(--signal)] bg-[var(--signal)]/20' : 'border-white/25')}><motion.span animate={{ x: form.isAnonymous ? 16 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 34 }} className={cn('absolute top-[3px] h-3 w-3', form.isAnonymous ? 'bg-[var(--signal)]' : 'bg-zinc-500')} /></span>
                        <span><span className="block text-[15px] text-zinc-100">Post anonymously</span><span className="mt-1 block text-[13px] leading-relaxed text-zinc-500">Your name is never shown. We keep who wrote it only for moderation.{user?.collegeId?.shortName && <> It still counts toward {user.collegeId.shortName}’s campus intel.</>}</span></span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          {!impact && <LiveReport company={company} form={form} quality={quality} xp={xp} showCoach={step !== 'basics'} />}
        </div>

        {!impact && (
          <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-[var(--line)] px-6 py-4 sm:px-8">
            <button type="button" onClick={() => (stepIdx === 0 ? onClose() : go(STEPS[stepIdx - 1][0]))} className="tag flex items-center gap-2 transition-colors hover:!text-zinc-100"><ArrowLeft className="h-3 w-3" />{stepIdx === 0 ? 'Close' : 'Back'}</button>
            {step === 'basics' && <button type="button" onClick={() => go('rounds')} disabled={!basicsOk} className="btn-line group disabled:opacity-40">{basicsOk ? 'Continue' : 'Pick a company, role and outcome'}<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></button>}
            {step === 'rounds' && <div className="flex items-center gap-6"><button type="button" onClick={() => go('finish')} className="tag transition-colors hover:!text-zinc-100">Skip to the end</button><button type="button" onClick={() => go('finish')} disabled={!form.rounds.some((r) => r.questions.some((q) => q.text.trim()))} className="btn-line group disabled:opacity-40">Continue<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></button></div>}
            {step === 'finish' && <button type="button" onClick={submit} disabled={!publishable || submitting} className="btn-line btn-solid group disabled:opacity-40">{submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}{publishable ? `Publish · +${xp} XP` : 'Add a round with one question to publish'}</button>}
          </footer>
        )}
      </motion.div>
    </motion.div>
  );
}
