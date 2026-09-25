import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { submissionsService, engagementService } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { RichText, CodeBlock } from '@/components/ui/rich-text';
import { DiffPill, Pill, Label, Bar, cn } from '@/components/ui/kit';
import { Bookmark, BookmarkCheck, Link2, Building2, Shield, Lock, Unlock, Check, Copy, Clock, Gauge, Cpu, AlertTriangle, Lightbulb, ChevronDown, History, RotateCcw, Trophy, Flame } from 'lucide-react';

const TABS = ['Description', 'Editorial', 'Submissions'];

export function LeftPane() {
  const { problem, id, setCode, setLanguage, result, editorialUnlocked, historyVersion, bookmarked, setBookmarked } = useWorkspace();
  const [tab, setTab] = useState('Description');
  const toast = useToast();

  useEffect(() => {
    const open = () => setTab('Editorial');
    window.addEventListener('cc:open-editorial', open);
    return () => window.removeEventListener('cc:open-editorial', open);
  }, []);

  const hasIntel = !!(problem.authorId || problem.company || problem.warStory);
  const tabs = hasIntel ? [...TABS, 'Intel'] : TABS;

  const toggleBookmark = async () => {
    try {
      const r = await engagementService.toggleBookmark(id);
      setBookmarked(r.data.data.bookmarked);
      toast.success(r.data.data.bookmarked ? 'Bookmarked' : 'Removed bookmark', problem.title);
      if (r.data.data.achievements?.length) toast.notify(r.data.data.achievements.map((a) => ({ type: 'achievement', title: `Badge earned: ${a.title}`, message: a.desc })));
    } catch {
      toast.error('Could not update bookmark');
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.info('Link copied', 'Share it with a friend to solve together.');
    } catch {
      toast.warning('Copy failed', window.location.href);
    }
  };

  const mastery = result?.newMastery ?? problem.skillMastery;
  const stats = problem.stats || {};

  return (
    <section className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
        <div className="px-6 pb-10 pt-5">
          {/* Title block */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <DiffPill difficulty={problem.difficulty} />
                {problem.skillId?.name && <Pill tone="zinc">{problem.skillId.name}</Pill>}
                {problem.userSolved && <Pill tone="green" icon={Check}>Solved</Pill>}
              </div>
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-zinc-100">{problem.title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={toggleBookmark} title={bookmarked ? 'Remove bookmark' : 'Bookmark for later'} className={cn('flex h-8 w-8 items-center justify-center rounded-lg border transition-colors', bookmarked ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/[0.07] text-zinc-500 hover:text-zinc-200')}>
                {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>
              <button onClick={share} title="Copy link" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-zinc-500 transition-colors hover:text-zinc-200"><Link2 className="h-4 w-4" /></button>
            </div>
          </div>

          {/* meta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-zinc-500">
            {stats.acceptance != null && <span title={`${stats.attempts} submissions`}>{stats.acceptance}% acceptance</span>}
            {stats.solvers > 0 && <span>{stats.solvers} solver{stats.solvers !== 1 ? 's' : ''}</span>}
            <span>{problem.xpReward || 10} XP</span>
            {problem.frequency > 0 && <span title="How often this appears in interviews (0-100)">freq {problem.frequency}</span>}
          </div>
          {problem.companies?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {problem.companies.slice(0, 6).map((c) => <span key={c} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10.5px] text-zinc-400">{c}</span>)}
              {problem.companies.length > 6 && <span className="px-1 text-[10.5px] text-zinc-600">+{problem.companies.length - 6}</span>}
            </div>
          )}

          {mastery != null && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
              <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500">
                <span>{problem.skillId?.name || 'Skill'} mastery</span>
                <span className={result?.masteryDelta > 0 ? 'text-emerald-400' : result?.masteryDelta < 0 ? 'text-rose-400' : 'text-zinc-400'}>
                  {Math.round(mastery * 100)}%{result?.masteryDelta ? ` (${result.masteryDelta > 0 ? '+' : ''}${(result.masteryDelta * 100).toFixed(1)})` : ''}
                </span>
              </div>
              <Bar value={mastery} max={1} height={5} marker={0.85} color={mastery >= 0.85 ? '#34d399' : mastery >= 0.6 ? '#38bdf8' : '#fbbf24'} />
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-5 border-b border-white/[0.06]">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn('relative pb-2.5 text-[12.5px] font-medium tracking-tight transition-colors', tab === t ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
                {t}
                {t === 'Editorial' && editorialUnlocked && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                {tab === t && <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-[var(--signal)]" />}
              </button>
            ))}
          </div>

          {tab === 'Description' && <Description problem={problem} />}
          {tab === 'Editorial' && <Editorial id={id} problem={problem} unlockedHint={editorialUnlocked} />}
          {tab === 'Submissions' && <Submissions id={id} setCode={setCode} setLanguage={setLanguage} version={historyVersion} />}
          {tab === 'Intel' && hasIntel && <IntelTab problem={problem} />}
        </div>
      </div>
    </section>
  );
}

function Description({ problem }) {
  return (
    <div className="mt-5 space-y-7">
      <RichText text={problem.description || ''} className="text-[13.5px]" />

      {(problem.examples || []).length > 0 && (
        <div className="space-y-4">
          {problem.examples.map((ex, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <Label className="mb-2.5 block text-zinc-600">Example {i + 1}</Label>
              <div className="space-y-1.5 font-mono text-[12px] leading-relaxed">
                <div className="flex gap-3"><span className="w-14 shrink-0 text-zinc-600">Input</span><span className="break-all text-zinc-200">{ex.input}</span></div>
                <div className="flex gap-3"><span className="w-14 shrink-0 text-zinc-600">Output</span><span className="break-all text-emerald-300">{ex.output}</span></div>
                {ex.explanation && <div className="flex gap-3 pt-1"><span className="w-14 shrink-0 text-zinc-700">Why</span><span className="font-sans text-[12.5px] italic leading-relaxed text-zinc-500">{ex.explanation}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {problem.constraints && (
        <div>
          <Label className="mb-2 block text-zinc-600">Constraints</Label>
          <ul className="space-y-1 font-mono text-[11.5px] text-zinc-400">
            {String(problem.constraints).split('\n').filter(Boolean).map((c, i) => <li key={i} className="flex gap-2"><span className="mt-1 text-zinc-700">›</span><span>{c}</span></li>)}
          </ul>
        </div>
      )}

      {(problem.hints || []).length > 0 && <HintAccordion hints={problem.hints} />}
    </div>
  );
}

function HintAccordion({ hints }) {
  const [open, setOpen] = useState(-1);
  return (
    <div>
      <Label className="mb-2 flex items-center gap-2 text-zinc-600"><Lightbulb className="h-3 w-3 text-amber-400" /> Hints <span className="text-zinc-700">· reveal one at a time</span></Label>
      <div className="space-y-1.5">
        {hints.map((h, i) => {
          const isOpen = open >= i;
          const locked = i > open + 1;
          return (
            <button key={i} disabled={locked} onClick={() => setOpen(isOpen ? i - 1 : i)} className={cn('block w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors', isOpen ? 'border-amber-400/20 bg-amber-400/[0.05]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]', locked && 'cursor-not-allowed opacity-40')}>
              <div className="flex items-center gap-3 text-[12.5px]">
                <span className="w-5 font-mono text-[10px] text-zinc-600">{String(i + 1).padStart(2, '0')}</span>
                <span className={cn('flex-1', isOpen ? 'text-zinc-200' : 'text-zinc-500')}>{isOpen ? h : locked ? 'Reveal the previous hint first' : 'Tap to reveal'}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-600 transition-transform', isOpen && 'rotate-180')} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Editorial ────────────────────────────────────────────────────────────────

function Editorial({ id, problem, unlockedHint }) {
  const [state, setState] = useState({ loading: true });
  const [lang, setLang] = useState('javascript');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setState({ loading: true });
    try {
      const r = await engagementService.getEditorial(id);
      setState({ loading: false, ...r.data.data });
    } catch (e) {
      const d = e.response?.data;
      if (e.response?.status === 403) setState({ loading: false, locked: true, failedAttempts: d?.data?.failedAttempts ?? 0, attemptsNeeded: d?.data?.attemptsNeeded ?? 3 });
      else setState({ loading: false, error: d?.message || 'Could not load the editorial.' });
    }
  }, [id]);

  useEffect(() => { load(); }, [load, unlockedHint]);

  if (state.loading) return <p className="mt-8 font-mono text-[11px] text-zinc-600">Loading editorial…</p>;
  if (state.error) return <p className="mt-8 text-[12.5px] text-rose-400">{state.error}</p>;

  if (state.locked) {
    const n = state.failedAttempts || 0;
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-white/[0.1] p-7 text-center">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04]"><Lock className="h-5 w-5 text-zinc-500" /></span>
        <div className="text-[14px] font-medium text-zinc-200">Editorial locked</div>
        <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-zinc-500">Solve the problem, or make {state.attemptsNeeded || 3} attempts, to unlock the optimal approach, complexity analysis and a code walkthrough.</p>
        <div className="mx-auto mt-4 max-w-[200px]"><Bar value={Math.min(n, 3)} max={3} height={5} color="#fbbf24" /><div className="mt-1.5 font-mono text-[10px] text-zinc-600">{Math.min(n, 3)} / 3 attempts</div></div>
      </div>
    );
  }
  if (!state.available) return <p className="mt-8 text-[12.5px] text-zinc-500">{state.message || 'No editorial has been written for this problem yet.'}</p>;

  const ed = state.editorial || {};
  const code = ed.code?.[lang] || ed.code?.javascript || ed.code?.python;
  const langs = Object.keys(ed.code || {}).filter((k) => ed.code[k]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="mt-6 space-y-7">
      <div className="flex items-center gap-2 text-[12px] text-emerald-300"><Unlock className="h-3.5 w-3.5" /> Editorial unlocked{state.solved ? ' — you solved this one' : ''}</div>

      {ed.intuition && <div><Label className="mb-2 block text-zinc-600">The key insight</Label><p className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 text-[13.5px] leading-relaxed text-emerald-100/90">{ed.intuition}</p></div>}
      {ed.approach && <div><Label className="mb-2 block text-zinc-600">Optimal approach</Label><RichText text={ed.approach} className="text-[13.5px]" /></div>}

      {ed.steps?.length > 0 && (
        <div>
          <Label className="mb-2.5 block text-zinc-600">Walkthrough</Label>
          <ol className="space-y-2.5">
            {ed.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[10px] text-zinc-400">{i + 1}</span>
                <span className="text-[13px] leading-relaxed text-zinc-300">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(ed.timeComplexity || ed.spaceComplexity) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"><Label className="mb-1 flex items-center gap-1.5 text-zinc-600"><Gauge className="h-3 w-3" /> Time</Label><div className="font-mono text-[13px] text-sky-300">{ed.timeComplexity}</div></div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"><Label className="mb-1 flex items-center gap-1.5 text-zinc-600"><Cpu className="h-3 w-3" /> Space</Label><div className="font-mono text-[13px] text-violet-300">{ed.spaceComplexity}</div></div>
        </div>
      )}

      {ed.pitfalls?.length > 0 && (
        <div>
          <Label className="mb-2 flex items-center gap-1.5 text-zinc-600"><AlertTriangle className="h-3 w-3 text-amber-400" /> Common pitfalls</Label>
          <ul className="space-y-1.5">{ed.pitfalls.map((p, i) => <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-zinc-400"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />{p}</li>)}</ul>
        </div>
      )}

      {code && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-zinc-600">Reference solution</Label>
            <div className="flex items-center gap-1">
              {langs.map((l) => <button key={l} onClick={() => setLang(l)} className={cn('rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors', (ed.code[lang] ? lang : langs[0]) === l ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>{l === 'javascript' ? 'JS' : 'PY'}</button>)}
              <button onClick={copy} className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-200">{copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
          <CodeBlock code={code} />
        </div>
      )}
    </div>
  );
}

// ─── Submission history ───────────────────────────────────────────────────────

function Submissions({ id, setCode, setLanguage, version }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let alive = true;
    submissionsService.getRecentSubmissions(id, 20).then((r) => { if (alive) setRows(r.data.data.submissions); }).catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, [id, version]);

  if (rows === null) return <p className="mt-8 font-mono text-[11px] text-zinc-600">Loading history…</p>;
  if (rows.length === 0) return <div className="mt-8 rounded-2xl border border-dashed border-white/[0.09] p-7 text-center text-[12.5px] text-zinc-500"><History className="mx-auto mb-2 h-5 w-5 text-zinc-600" />No submissions yet. Submit your first solution to start your history.</div>;

  return (
    <div className="mt-5 space-y-2">
      {rows.map((s, i) => {
        const isOpen = open === i;
        const delta = s.masteryAfter != null && s.masteryBefore != null ? s.masteryAfter - s.masteryBefore : null;
        return (
          <div key={s._id || i} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.03]">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', s.isCorrect ? 'bg-emerald-400' : 'bg-rose-400')} />
              <div className="min-w-0 flex-1">
                <div className={cn('text-[12.5px] font-medium', s.isCorrect ? 'text-zinc-100' : 'text-zinc-400')}>{s.isCorrect ? 'Accepted' : `${s.passedTestCases}/${s.totalTestCases} tests passed`}</div>
                <div className="font-mono text-[10px] text-zinc-600">{new Date(s.createdAt).toLocaleString()} · {s.language}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3 font-mono text-[10.5px] text-zinc-500">
                {s.xpAwarded > 0 && <span className="text-amber-400">+{s.xpAwarded} XP</span>}
                {delta !== null && <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}%</span>}
                {s.executionTime > 0 && <span className="hidden sm:inline"><Clock className="mr-1 inline h-3 w-3" />{s.executionTime}ms</span>}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-white/[0.05] p-3">
                <CodeBlock code={s.code} className="max-h-56" />
                <button onClick={() => { setCode(s.code); if (s.language) setLanguage?.(s.language, true); }} className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 font-mono text-[10.5px] text-zinc-300 transition-colors hover:bg-white/[0.05]"><RotateCcw className="h-3 w-3" /> Load into editor</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Intel tab ────────────────────────────────────────────────────────────────

function IntelTab({ problem }) {
  const authorName = problem.authorId?.name || 'Anonymous Operative';
  const conf = problem.confidenceLevel || 0;
  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]"><Shield className="h-3.5 w-3.5 text-[var(--signal)]" /><span className="text-[var(--signal)]">Community intel</span><span className="h-px flex-1 bg-white/[0.05]" /></div>
      {(problem.company || problem.round) && <div className="flex items-center gap-2 text-[13px] text-zinc-200"><Building2 className="h-4 w-4 text-zinc-500" />{problem.company}{problem.company && problem.round && <span className="text-zinc-700">|</span>}<span className="text-zinc-400">{problem.round}</span></div>}
      {conf > 0 && <div><div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-zinc-500"><span>MEMORY CONFIDENCE</span><span>{conf}%</span></div><Bar value={conf} max={100} height={4} color="#34d399" /></div>}
      {problem.warStory && <blockquote className="border-l-2 border-[var(--signal)]/30 py-1 pl-4 text-[13.5px] italic leading-relaxed text-zinc-400">“{problem.warStory}”</blockquote>}
      <div className="flex items-center gap-3 border-t border-white/[0.05] pt-4"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a2332] text-[10px] font-semibold text-zinc-300">{authorName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</div><div><div className="font-mono text-[10px] text-zinc-500">Reported by</div><div className="text-[12.5px] text-zinc-200">{authorName}</div></div></div>
    </div>
  );
}

export { Trophy, Flame };
