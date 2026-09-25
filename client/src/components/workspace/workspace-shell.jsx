import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { problemsService, submissionsService } from '@/services/api';
import { WorkspaceContext } from './WorkspaceContext';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { TopBar } from './top-bar';
import { LeftPane } from './left-pane';
import { CenterPane } from './center-pane';
import { RightPane } from './right-pane';
import { TestTiles } from './test-tiles';
import { SuccessOverlay } from './SuccessOverlay';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { key: 'python', label: 'Python', monaco: 'python' },
  { key: 'java', label: 'Java', monaco: 'java' },
  { key: 'cpp', label: 'C++', monaco: 'cpp' }
];

export function WorkspaceShell() {
  const { id } = useParams();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const { trackProblem } = useSessionTracker();

  useEffect(() => { if (id) trackProblem(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Editor state
  const [code, setCode] = useState('');
  const [language, setLanguageRaw] = useState(() => localStorage.getItem('cc_lang') || 'javascript');
  const [userTyped, setUserTyped] = useState(false);
  const [activeLine, setActiveLine] = useState(null);
  const [runtimes, setRuntimes] = useState(null);

  const [keybindings, setKeybindings] = useState(() => localStorage.getItem('cc_keybindings') || 'standard');
  const updateKeybindings = useCallback((val) => {
    setKeybindings(val);
    localStorage.setItem('cc_keybindings', val);
  }, []);

  // Execution state
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [editorialUnlocked, setEditorialUnlocked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Mentor
  const [lighthouse, setLighthouse] = useState(true);
  const [citedLines, setCitedLines] = useState([]);
  const [nudgeDepth, setNudgeDepth] = useState(1);
  const [lastNudgedCode, setLastNudgedCode] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mentorOpen, setMentorOpen] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  // Timer (resets per problem) — sent with the submission as timeTaken (seconds)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    const timerId = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(timerId);
  }, [id]);

  const starterFor = useCallback((p, lang) => p?.starterCodeMap?.[lang] || (lang === 'javascript' ? p?.starterCode : null) || '', []);

  // Load problem + runtimes
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    setLoading(true);
    setResult(null);
    setHintsUsed(0);
    setNudgeDepth(1);
    setEditorialUnlocked(false);
    setLoadError(null);
    (async () => {
      try {
        const [pRes, rtRes] = await Promise.all([problemsService.getProblemById(id), submissionsService.getRuntimes().catch(() => null)]);
        if (!alive) return;
        const p = pRes.data.data.problem;
        const rt = rtRes?.data?.data?.runtimes || null;
        setProblem(p);
        setRuntimes(rt);
        setBookmarked(!!p.bookmarked);
        setEditorialUnlocked(!!p.userSolved);
        // choose a language that both has a starter template and can execute
        let lang = localStorage.getItem('cc_lang') || 'javascript';
        if (!p.starterCodeMap?.[lang] && !(lang === 'javascript' && p.starterCode)) lang = p.starterCodeMap?.javascript ? 'javascript' : Object.keys(p.starterCodeMap || {})[0] || 'javascript';
        setLanguageRaw(lang);
        setCode(starterFor(p, lang) || '// Your code here\n');
        setUserTyped(false);
      } catch (e) {
        if (alive) setLoadError(e.response?.data?.message || 'Failed to load problem');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, starterFor]);

  const availableLanguages = useMemo(
    () => LANGUAGES.filter((l) => problem?.starterCodeMap?.[l.key] || (l.key === 'javascript' && problem?.starterCode)).map((l) => ({ ...l, engine: runtimes?.[l.key]?.available === false ? null : runtimes?.[l.key]?.engine || 'unknown', unavailable: runtimes?.[l.key]?.available === false })),
    [problem, runtimes]
  );

  const setLanguage = useCallback((lang) => { setLanguageRaw(lang); localStorage.setItem('cc_lang', lang); }, []);

  const switchLanguage = useCallback((newLang) => {
    if (newLang === language) return;
    const current = code.trim();
    const untouched = !current || current === '// Your code here' || Object.values(problem?.starterCodeMap || {}).some((c) => (c || '').trim() === current) || current === (problem?.starterCode || '').trim();
    if (userTyped && !untouched && !window.confirm('Switch language? Your current code will be replaced.')) return;
    setLanguage(newLang);
    setCode(starterFor(problem, newLang));
    setUserTyped(false);
    setResult(null);
  }, [language, userTyped, problem, code, setLanguage, starterFor]);

  const resetCode = useCallback(() => {
    setCode(starterFor(problem, language) || '// Your code here\n');
    setUserTyped(false);
    setResult(null);
  }, [language, problem, starterFor]);

  const [selectedTest, setSelectedTest] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [customMode, setCustomMode] = useState(false);

  const handleRun = useCallback(async () => {
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await submissionsService.runCode({ problemId: id, code, language });
      setResult(r.data.data);
      setSelectedTest(r.data.data?.testResults?.results?.[0]?.id ?? '0');
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Run failed.' });
    } finally {
      setRunning(false);
    }
  }, [code, running, submitting, id, language]);

  const handleCustomRun = useCallback(async (customInputStr) => {
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await submissionsService.runCode({ problemId: id, code, language, customInput: customInputStr });
      setResult(r.data.data);
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Custom run failed.' });
    } finally {
      setRunning(false);
    }
  }, [code, running, submitting, id, language]);

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || submitting || running) return;
    setSubmitting(true);
    setResult(null);
    try {
      const r = await submissionsService.createSubmission({ problemId: id, code, hintsUsed, language, timeTaken: elapsed });
      const data = r.data.data;
      setResult(data);
      setSelectedTest(data?.testResults?.results?.find((t) => !t.passed)?.id ?? data?.testResults?.results?.[0]?.id ?? '0');
      setHistoryVersion((v) => v + 1);
      if (data.editorialUnlocked) setEditorialUnlocked(true);
      setProblem((p) => (p ? { ...p, skillMastery: data.newMastery, userSolved: p.userSolved || data.submission?.isCorrect } : p));
      if (data.submission?.isCorrect) {
        setSuccessResult(data);
        setShowSuccess(true);
        setHintsUsed(0);
      } else if (data.failedAttempts >= 3 && !problem?.userSolved) {
        toast.info('Editorial unlocked', 'You have made 3 attempts — the walkthrough is now available.');
      }
      // toasts for everything else that happened (streaks, badges, unlocks…) — level-ups/badges are also in the overlay
      const extra = (data.notifications || []).filter((n) => !(data.submission?.isCorrect && ['achievement', 'level_up', 'skill_unlocked'].includes(n.type)));
      if (extra.length) toast.notify(extra);
      refreshUser?.();
    } catch (e) {
      const msg = e.response?.data?.message || 'Submission failed.';
      setResult({ error: msg });
      if (e.response?.status === 429) toast.warning('Slow down', msg);
    } finally {
      setSubmitting(false);
    }
  }, [code, submitting, running, id, hintsUsed, language, elapsed, problem, toast, refreshUser]);

  const testCasesArray = problem?.examples?.length ? problem.examples : (problem?.testCases || []).filter((t) => !t.isHidden).map((t) => ({ input: t.input, output: t.expectedOutput }));

  const stats = useMemo(() => {
    const list = result?.testResults?.results;
    if (!list || result?.customInputRun) return { pass: 0, total: testCasesArray.length || 0, avgRt: 0, done: 0 };
    const pass = list.filter((r) => r.passed).length;
    const totalRt = list.reduce((a, b) => a + (b.executionTime || 0), 0);
    return { pass, total: list.length, avgRt: list.length ? Math.round(totalRt / list.length) : 0, done: list.length };
  }, [result, testCasesArray]);

  if (loading) return <div className="flex h-full items-center justify-center bg-background"><div className="w-96"><LoadingSkeleton lines={8} /></div></div>;
  if (!problem) return <div className="flex h-full flex-col items-center justify-center gap-2 bg-background text-zinc-500"><span>{loadError || 'Problem not found.'}</span></div>;

  const workspaceContextValue = {
    problem, id, code, setCode, userTyped, setUserTyped,
    language, setLanguage, switchLanguage, resetCode, LANGUAGES: availableLanguages,
    keybindings, updateKeybindings,
    running, submitting, result, handleRun, handleSubmit,
    nudgeDepth, setNudgeDepth, lastNudgedCode, setLastNudgedCode, hintsUsed, setHintsUsed,
    lighthouse, setLighthouse, activeLine, setActiveLine, citedLines, setCitedLines,
    history, setHistory, historyVersion, mentorOpen, setMentorOpen,
    customInput, setCustomInput, customMode, setCustomMode, handleCustomRun,
    editorialUnlocked, bookmarked, setBookmarked
  };

  return (
    <WorkspaceContext.Provider value={workspaceContextValue}>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
        <TopBar elapsed={elapsed} stats={stats} />

        <div className="flex min-h-0 flex-1 border-t border-white/[0.04]">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize="33%" minSize="18%" maxSize="55%">
              <div className="flex h-full flex-col overflow-hidden border-r border-white/[0.06] bg-[#0a0c0e]"><LeftPane /></div>
            </Panel>

            <PanelResizeHandle className="group relative z-10 flex w-2 flex-shrink-0 cursor-col-resize items-center justify-center bg-[#0d1117]">
              <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/[0.04] transition-colors duration-150 group-hover:bg-[var(--signal)]" />
            </PanelResizeHandle>

            <Panel defaultSize="45%" minSize="30%">
              <div className="flex h-full min-w-0 flex-col overflow-hidden bg-[#0d1117]">
                <div className="relative min-h-0 flex-1 overflow-hidden"><CenterPane /></div>
                <TestTiles running={running || submitting} results={result} onRun={handleRun} selected={selectedTest} onSelect={setSelectedTest} stats={stats} testCasesArray={testCasesArray} />
              </div>
            </Panel>

            <PanelResizeHandle className="group relative z-10 flex w-2 flex-shrink-0 cursor-col-resize items-center justify-center bg-[#0d1117]">
              <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/[0.04] transition-colors duration-150 group-hover:bg-[var(--signal)]" />
            </PanelResizeHandle>

            <Panel defaultSize="22%" minSize="14%" maxSize="34%">
              <div className="h-full overflow-hidden border-l border-white/[0.06] bg-[#080a0c]"><RightPane /></div>
            </Panel>
          </PanelGroup>
        </div>

        <SuccessOverlay
          show={showSuccess}
          onDismiss={() => setShowSuccess(false)}
          result={successResult}
          problem={problem}
          onOpenEditorial={() => window.dispatchEvent(new CustomEvent('cc:open-editorial'))}
        />
      </div>
    </WorkspaceContext.Provider>
  );
}
