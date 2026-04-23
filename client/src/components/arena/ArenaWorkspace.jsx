/**
 * ArenaWorkspace — The main Arena game view
 *
 * V4 UI parity: File tab strip, Monaco editor, action bar (Format/Clear/Reset/Run/Submit),
 * test results panel. Resizable split for Co-op Split mode.
 * 
 * Run/Submit reads code directly from Monaco editor ref (never stale state).
 * Rejoin support for page refresh recovery.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useArena } from '../../context/ArenaContext';
import { useAuth } from '../../context/AuthContext';
import { problemsService, submissionsService } from '../../services/api';
import { RaceTracker } from './RaceTracker';
import { SharedEditor } from './SharedEditor';
import { SplitEditor } from './SplitEditor';
import {
  ArrowLeft, Copy, Check, Clock, Users, Swords, SplitSquareHorizontal,
  Play, Send, Loader2, Crown, Trophy, WifiOff, RefreshCw,
  AlignLeft, Trash2, RotateCcw, Command, ChevronDown
} from 'lucide-react';

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript', ext: 'js' },
  { key: 'python', label: 'Python', monaco: 'python', ext: 'py' },
  { key: 'java', label: 'Java', monaco: 'java', ext: 'java' },
  { key: 'cpp', label: 'C++', monaco: 'cpp', ext: 'cpp' }
];

export function ArenaWorkspace() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    room, mode, matchStatus, players, winner, startedAt,
    leaveRoom, reportTestPassed, reportSubmission,
    progressMap, partnerOffline, rejoinRoom, connected,
    emitLanguageChange
  } = useArena();

  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  const localEditorRef = useRef(null);

  // ─── Rejoin on mount (handles refresh) ───
  useEffect(() => {
    if (connected && roomId && !room) {
      rejoinRoom(roomId);
    }
  }, [connected, roomId, room]);

  // ─── Fetch problem ───
  useEffect(() => {
    if (!room?.problemId) return;
    problemsService.getProblemById(room.problemId)
      .then(r => {
        const p = r.data?.data?.problem || r.data?.data || r.data;
        setProblem(p);
      })
      .catch(() => {});
  }, [room?.problemId]);

  // ─── Timer ───
  useEffect(() => {
    if (matchStatus !== 'active') return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [matchStatus]);

  const timeStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsed]);

  // ─── Read code from Monaco editor ref ───
  const getCurrentCode = () => {
    if (localEditorRef.current) {
      return localEditorRef.current.getValue();
    }
    return '';
  };

  // ─── Run ───
  const handleRun = useCallback(async () => {
    const code = getCurrentCode();
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setResult(null);
    try {
      const payload = { problemId: room.problemId, code, language };
      const r = await submissionsService.runCode(payload);
      const data = r.data?.data || r.data;
      setResult(data);
      if (data?.testResults?.results?.length > 0) {
        setSelectedTest(data.testResults.results[0].id || '0');
      }
      // Report progress to arena
      if (data?.testResults?.results) {
        const passed = data.testResults.results.filter(t => t.passed).length;
        const total = data.testResults.results.length;
        reportTestPassed(passed - 1, total);
      }
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Run failed.' });
    } finally {
      setRunning(false);
    }
  }, [running, submitting, room?.problemId, language, reportTestPassed]);

  // ─── Submit ───
  const handleSubmit = useCallback(async () => {
    const code = getCurrentCode();
    if (!code.trim() || submitting || running) return;
    setSubmitting(true);
    setResult(null);
    try {
      const payload = { problemId: room.problemId, code, language };
      const r = await submissionsService.createSubmission(payload);
      const data = r.data?.data || r.data;
      setResult(data);
      if (data?.testResults?.results?.length > 0) {
        setSelectedTest(data.testResults.results[0].id || '0');
      }
      const passed = data?.testResults?.results?.filter(t => t.passed).length || 0;
      const total = data?.testResults?.results?.length || 0;
      const allPassed = passed === total && total > 0;
      reportSubmission(passed, total, allPassed);
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Submit failed.' });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, running, room?.problemId, language, reportSubmission]);

  // ─── Format / Clear / Reset ───
  const handleFormat = () => {
    localEditorRef.current?.getAction('editor.action.formatDocument')?.run();
  };
  const handleClear = () => {
    if (localEditorRef.current) localEditorRef.current.setValue('');
  };
  const handleReset = () => {
    if (!window.confirm('Reset code to default template?')) return;
    const langObj = LANGUAGES.find(l => l.key === language);
    const boilerplate = problem?.starterCodeMap?.[language] || problem?.starterCode || '// Start coding...\n';
    if (localEditorRef.current) localEditorRef.current.setValue(boilerplate);
  };

  // ─── Versus editor mount ───
  const handleVersusEditorMount = useCallback((editor, monaco) => {
    localEditorRef.current = editor;
    // Store monaco globally for Language Context Engine
    if (!window.monaco) window.monaco = monaco;
    // Keyboard shortcuts
    editor.addAction({ id: 'arena-run', label: 'Run', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote], run: () => handleRun() });
    editor.addAction({ id: 'arena-submit', label: 'Submit', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: () => handleSubmit() });
  }, [handleRun, handleSubmit]);

  const handleEditorRef = useCallback((editor) => {
    localEditorRef.current = editor;
  }, []);

  // ─── LANGUAGE CONTEXT ENGINE ───
  // When user selects a language:
  //  1. Update React state (language + file tab extension)
  //  2. Swap the Monaco editor model language for syntax highlighting
  //  3. Inject boilerplate into the Yjs document if empty/default
  //  4. Emit language change to partner via socket
  const DEFAULT_BOILERPLATES = {
    javascript: '// Your solution here\nfunction solve(input) {\n  \n}\n',
    python: '# Your solution here\ndef solve(input):\n    pass\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        // Your solution here\n    }\n}\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your solution here\n    return 0;\n}\n'
  };

  const getBoilerplate = useCallback((lang) => {
    if (problem?.starterCodeMap?.[lang]) return problem.starterCodeMap[lang];
    return DEFAULT_BOILERPLATES[lang] || '// Start coding...\n';
  }, [problem]);

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    setLangOpen(false);

    const newLangMeta = LANGUAGES.find(l => l.key === newLang);
    const editor = localEditorRef.current;
    if (!editor) return;

    // 1. Swap Monaco model language for proper syntax highlighting
    const model = editor.getModel();
    if (model && window.monaco) {
      window.monaco.editor.setModelLanguage(model, newLangMeta?.monaco || newLang);
    }

    // 2. Inject boilerplate if editor is empty or still contains default boilerplate
    const currentCode = editor.getValue();
    const isDefault = !currentCode || currentCode.trim() === '' ||
      Object.values(DEFAULT_BOILERPLATES).some(b => currentCode.trim() === b.trim()) ||
      currentCode.trim() === (problem?.starterCode || '').trim();

    if (isDefault) {
      const newBoilerplate = getBoilerplate(newLang);
      editor.setValue(newBoilerplate);
    }

    // 3. Emit to partner
    emitLanguageChange(newLang);
  }, [problem, emitLanguageChange, getBoilerplate]);

  const handleLeave = () => {
    leaveRoom();
    navigate('/arena');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langMeta = LANGUAGES.find(l => l.key === language) || LANGUAGES[0];
  const modeIcon = mode === 'versus' ? Swords : mode === 'coop-shared' ? Users : SplitSquareHorizontal;
  const ModeIcon = modeIcon;
  const modeLabel = mode === 'versus' ? 'VERSUS · RACE' : mode === 'coop-shared' ? 'CO-OP · SHARED' : 'CO-OP · SPLIT';
  const modeColor = mode === 'versus' ? 'text-rose-400' : mode === 'coop-shared' ? 'text-[var(--signal)]' : 'text-amber-400';

  // ─── Test case data ───
  const testCasesArray = problem?.examples || [];
  const hasResultList = result?.testResults?.results?.length > 0;
  const displayTiles = hasResultList
    ? result.testResults.results.map((tc, i) => ({
        id: tc.id || `test-${i}`,
        name: tc.name || `Case ${i + 1}`,
        input: tc.input || '(none)',
        expected: tc.expectedOutput || '(none)',
        got: tc.actualOutput || '(runtime error)',
        status: tc.passed ? 'pass' : 'fail'
      }))
    : testCasesArray.map((ex, i) => ({
        id: `case-${i}`,
        name: `Case ${i + 1}`,
        input: ex.input || '(none)',
        expected: ex.output || '(none)',
        got: 'not run',
        status: 'pending'
      }));
  const stats = useMemo(() => {
    if (!hasResultList) return { pass: 0, total: testCasesArray.length || 0 };
    const list = result.testResults.results;
    return { pass: list.filter(t => t.passed).length, total: list.length };
  }, [result, testCasesArray]);

  // ─── Match finished overlay ───
  if (matchStatus === 'finished') {
    const iWon = winner?.userId === user?._id;
    return <div className="flex h-full flex-col items-center justify-center bg-background gap-6 px-10">
      <Trophy className={`h-16 w-16 ${iWon ? 'text-amber-400' : 'text-zinc-600'}`} strokeWidth={1.5} />
      <h1 className="text-[36px] font-semibold text-zinc-100">{iWon ? 'Victory!' : 'Match Complete'}</h1>
      <p className="text-[14px] text-zinc-400 text-center max-w-md">
        {iWon ? `You passed all tests first!` : winner ? `${winner.name} finished first.` : 'The match has ended.'}
      </p>
      <div className="flex items-center gap-4 mt-4">
        <Link to="/arena" className="rounded-lg border border-white/[0.08] px-6 py-2.5 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.03]">Back to Lobby</Link>
        <Link to={`/problems/${room?.problemId}`} className="rounded-lg bg-[var(--signal)] px-6 py-2.5 text-[13px] font-semibold text-[#0a1410] hover:brightness-110">Practice Solo</Link>
      </div>
    </div>;
  }

  return <div className="flex h-full flex-col overflow-hidden bg-background">
    {/* ─── Top bar ─── */}
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.04] px-4">
      <div className="flex items-center gap-3">
        <button onClick={handleLeave} className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> EXIT
        </button>
        <span className="h-3 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-1.5">
          <ModeIcon className={`h-3.5 w-3.5 ${modeColor}`} strokeWidth={1.5} />
          <span className={`font-mono text-[10px] tracking-[0.18em] ${modeColor}`}>{modeLabel}</span>
        </div>
        <span className="h-3 w-px bg-white/[0.06]" />
        <button onClick={copyCode} className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-300">
          {copied ? <Check className="h-3 w-3 text-[var(--signal)]" /> : <Copy className="h-3 w-3" />}
          {roomId}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {players.map(p => <div key={p.userId} className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a3441] text-[8px] font-bold text-zinc-200">
              {p.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-[11px] text-zinc-400">{p.name?.split(' ')[0]}</span>
          </div>)}
        </div>
        <span className="h-3 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
          <Clock className="h-3 w-3" strokeWidth={1.5} /> {timeStr}
        </div>
      </div>
    </header>

    {/* ─── Partner Offline Banner ─── */}
    {partnerOffline && (
      <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[12px] text-amber-300">
        <WifiOff className="h-3.5 w-3.5" />
        <span className="font-medium">{partnerOffline.name} disconnected.</span>
        <span className="text-amber-400/60">Waiting 30s for reconnection…</span>
        <RefreshCw className="h-3 w-3 animate-spin text-amber-400/40" />
      </div>
    )}

    {/* ─── Race tracker (versus only) ─── */}
    {mode === 'versus' && <RaceTracker />}

    {/* ─── Main content ─── */}
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT: Problem description */}
      <div className="w-[360px] shrink-0 overflow-y-auto border-r border-white/[0.04] scrollbar-surgical">
        <div className="p-6">
          {problem ? <>
            <h2 className="text-[22px] font-semibold text-zinc-100 mb-3">{problem.title}</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                problem.difficulty === 'Easy' ? 'bg-[var(--signal)]/20 text-[var(--signal)]' :
                problem.difficulty === 'Hard' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}>{problem.difficulty}</span>
              <span className="font-mono text-[10px] text-zinc-600">{problem.skillId?.name || 'General'}</span>
            </div>
            <div className="prose prose-invert prose-sm text-[13px] leading-relaxed text-zinc-400">{problem.description}</div>
            {problem.examples?.length > 0 && <div className="mt-6 space-y-4">
              {problem.examples.map((ex, i) => <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
                <div className="font-mono text-[10px] tracking-widest text-zinc-500 mb-2">EXAMPLE {i + 1}</div>
                <div className="font-mono text-[12px] text-zinc-300 space-y-1">
                  <div><span className="text-zinc-500">Input: </span>{ex.input}</div>
                  <div><span className="text-zinc-500">Output: </span>{ex.output}</div>
                  {ex.note && <div className="text-[11px] text-zinc-500 italic mt-1">{ex.note}</div>}
                </div>
              </div>)}
            </div>}
          </> : (
            <div className="flex items-center gap-2 text-zinc-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading problem...</div>
          )}
        </div>
      </div>

      {/* CENTER: Editor + Action Bar + Test Results */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* File tab strip — matching V4 */}
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.04] px-3">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <div className="flex h-7 items-center gap-2 border-r border-white/[0.06] bg-white/[0.015] px-3 text-zinc-300">
              <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
              <span>solution.{langMeta.ext}</span>
              <span className="ml-1 text-zinc-700">●</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-zinc-600">
            {/* Language selector — V4 style */}
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 border border-white/[0.06] bg-white/[0.01] px-2 py-0.5 text-zinc-400 transition-colors hover:border-white/[0.1] hover:text-zinc-200">
                <span>{langMeta.label.toUpperCase()}</span>
                <ChevronDown className="h-2.5 w-2.5" strokeWidth={1.5} />
              </button>
              {langOpen && <div className="absolute right-0 top-full z-10 mt-1 w-32 border border-white/[0.08] bg-[#0c0c0c] p-1 shadow-2xl">
                {LANGUAGES.map(l => (
                  <button key={l.key} onClick={() => handleLanguageChange(l.key)}
                    className="flex w-full items-center justify-between px-2 py-1.5 font-mono text-[11px] tracking-widest text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-[var(--signal)]">
                    <span>{l.label.toUpperCase()}</span>
                    {l.key === language && <Check className="h-3 w-3 text-[var(--signal)]" strokeWidth={2} />}
                  </button>
                ))}
              </div>}
            </div>
            <span className="h-3 w-px bg-white/[0.06]" />
            <span>UTF-8</span>
          </div>
        </div>

        {/* Editor area — mode dependent */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {mode === 'coop-shared' ? (
            <SharedEditor language={language} starterCodeMap={problem?.starterCodeMap} onLanguageChange={handleLanguageChange} onEditorRef={handleEditorRef} />
          ) : mode === 'coop-split' ? (
            <SplitEditor language={language} starterCodeMap={problem?.starterCodeMap} onLanguageChange={handleLanguageChange} onEditorRef={handleEditorRef} />
          ) : (
            <Editor
              height="100%"
              language={langMeta.monaco}
              theme="vs-dark"
              defaultValue={problem?.starterCodeMap?.[language] || problem?.starterCode || '// Start coding...\n'}
              onMount={handleVersusEditorMount}
              options={{
                fontSize: 13, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 },
                automaticLayout: true, tabSize: 2, wordWrap: 'on', renderLineHighlight: 'all',
                cursorSmoothCaretAnimation: 'on', suggestOnTriggerCharacters: true, quickSuggestions: true,
                parameterHints: { enabled: true }
              }}
            />
          )}
        </div>

        {/* ─── Action Bar — exact V4 parity ─── */}
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/[0.04] bg-[#0a0a0a]/80 px-4 py-2 backdrop-blur-sm">
          <GhostBtn label="Format" onClick={handleFormat}><AlignLeft className="h-3.5 w-3.5" strokeWidth={1.5} /><span>Format</span></GhostBtn>
          <GhostBtn label="Clear" onClick={handleClear}><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /><span>Clear</span></GhostBtn>
          <GhostBtn label="Reset" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /><span>Reset</span></GhostBtn>

          <span className="mx-2 h-5 w-px bg-white/[0.08]" />

          <button onClick={handleRun} disabled={running || submitting}
            className={`press flex items-center gap-2 px-4 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 border border-white/[0.08] ${running ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-200 hover:bg-white/[0.04] hover:border-white/[0.15]'}`}>
            {running ? <span className="flex h-3 w-3 items-center justify-center"><span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--signal)]" /></span> : <Play className="h-3.5 w-3.5" strokeWidth={1.5} />}
            <span>RUN</span>
            <span className="flex items-center gap-0.5 border border-white/[0.08] px-1 py-0 text-[9px] text-zinc-600">
              <Command className="h-2 w-2" strokeWidth={1.5} /><span>'</span>
            </span>
          </button>

          <button onClick={handleSubmit} disabled={running || submitting}
            className={`press flex items-center gap-2 px-5 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 ${submitting ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[var(--signal)] text-[#0a1410] hover:brightness-110'}`}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Send className="h-3.5 w-3.5" strokeWidth={2} />}
            <span>SUBMIT</span>
          </button>
        </div>

        {/* ─── Test Cases Panel — V4 style ─── */}
        <div className="shrink-0 border-t border-white/[0.04] max-h-[240px] overflow-hidden flex flex-col">
          {/* Test case header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-zinc-500">
              <span>TEST CASES</span>
              <span className="text-zinc-700">·</span>
              <span>{stats.total} TESTS</span>
              <span className="text-zinc-700">·</span>
              <span className={hasResultList ? (stats.pass === stats.total ? 'text-[var(--signal)]' : 'text-rose-400') : 'text-zinc-600'}>
                {hasResultList ? `${stats.pass}/${stats.total} PASSED` : 'READY'}
              </span>
            </div>
            <button onClick={handleRun} disabled={running}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors">
              <Play className="h-3 w-3" strokeWidth={1.5} /> RUN ALL
            </button>
          </div>

          {/* Test tiles */}
          <div className="flex-1 overflow-y-auto scrollbar-surgical">
            {displayTiles.length === 0 ? (
              <div className="p-4 text-[12px] text-zinc-600 text-center">No test cases available.</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {displayTiles.map((tc, i) => (
                  <button key={tc.id} onClick={() => setSelectedTest(tc.id)}
                    className={`w-full px-4 py-2.5 text-left transition-colors ${selectedTest === tc.id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-mono text-[10px] tracking-widest text-zinc-600">{String(i + 1).padStart(2, '0')}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${tc.status === 'pass' ? 'bg-[var(--signal)]' : tc.status === 'fail' ? 'bg-rose-500' : 'bg-zinc-700'}`} />
                      <span className="font-mono text-[11px] text-zinc-300">{tc.name}</span>
                    </div>
                    {selectedTest === tc.id && (
                      <div className="mt-2 grid grid-cols-3 gap-4 text-[11px]">
                        <div>
                          <div className="font-mono text-[9px] tracking-widest text-zinc-600 mb-1">INPUT</div>
                          <div className="font-mono text-zinc-400 break-all">{tc.input}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] tracking-widest text-zinc-600 mb-1">EXPECTED</div>
                          <div className="font-mono text-zinc-400">{tc.expected}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] tracking-widest text-zinc-600 mb-1">GOT</div>
                          <div className={`font-mono ${tc.status === 'pass' ? 'text-[var(--signal)]' : tc.status === 'fail' ? 'text-rose-400' : 'text-zinc-600'}`}>
                            {tc.got}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>;
}

function GhostBtn({ children, label, onClick }) {
  return <button aria-label={label} onClick={onClick}
    className="press flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-zinc-500 transition-colors duration-300 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent hover:border-white/[0.06]">
    {children}
  </button>;
}
