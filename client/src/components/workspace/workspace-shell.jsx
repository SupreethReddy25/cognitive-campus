import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { problemsService, submissionsService } from "@/services/api";
import { WorkspaceContext } from "./WorkspaceContext";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';

import { TopBar } from "./top-bar";
import { LeftPane } from "./left-pane";
import { CenterPane } from "./center-pane";
import { RightPane } from "./right-pane";
import { TestTiles } from "./test-tiles";

import LoadingSkeleton from "@/components/LoadingSkeleton";

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { key: 'python', label: 'Python', monaco: 'python' },
  { key: 'java', label: 'Java', monaco: 'java' },
  { key: 'cpp', label: 'C++', monaco: 'cpp' }
];

export function WorkspaceShell() {
  const { id } = useParams();
  const { user } = useAuth();
  const { trackProblem } = useSessionTracker();

  // Track this problem for "Continue Session" on dashboard
  useEffect(() => { if (id) trackProblem(id); }, [id]);

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [userTyped, setUserTyped] = useState(false);
  const [activeLine, setActiveLine] = useState(null);

  // Execution State
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Lighthouse & Socratic Mentor
  const [lighthouse, setLighthouse] = useState(true);
  const [citedLines, setCitedLines] = useState([]);
  const [nudgeDepth, setNudgeDepth] = useState(1);
  const [lastNudgedCode, setLastNudgedCode] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);

  // Mentor pane collapsed state — thin strip by default
  const [mentorOpen, setMentorOpen] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timerId = setInterval(() => setElapsed(n => n + 1), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Fetch Problem
  useEffect(() => {
    const load = async () => {
      try {
        const r = await problemsService.getProblemById(id);
        const p = r.data.data.problem;
        setProblem(p);
        setCode(p.starterCodeMap?.javascript || p.starterCode || '// Your code here\n');
      } catch (e) {
        console.error("Failed to load problem", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const switchLanguage = useCallback((newLang) => {
    if (newLang === language) return;
    const currentCodeRaw = code.trim();
    const isUntouched = !currentCodeRaw || 
      currentCodeRaw === '// Your code here' ||
      Object.values(problem?.starterCodeMap || {}).some(defaultCode => defaultCode.trim() === currentCodeRaw) ||
      currentCodeRaw === (problem?.starterCode || '').trim();

    if (userTyped && !isUntouched) {
      const ok = window.confirm('Switch language? Your current code will be replaced.');
      if (!ok) return;
    }
    
    setLanguage(newLang);
    setCode(problem?.starterCodeMap?.[newLang] || problem?.starterCode || '');
    setUserTyped(false);
    setResult(null);
  }, [language, userTyped, problem, code]);

  // Dedicated reset — restores the starter code for the current language
  const resetCode = useCallback(() => {
    setCode(problem?.starterCodeMap?.[language] || problem?.starterCode || '// Your code here\n');
    setUserTyped(false);
    setResult(null);
  }, [language, problem]);

  const [selectedTest, setSelectedTest] = useState(null);

  // Custom test case state
  const [customInput, setCustomInput] = useState('');
  const [customMode, setCustomMode] = useState(false);

  const handleRun = useCallback(async () => {
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setResult(null);
    try {
      const payload = { problemId: id, code, language };
      const r = await submissionsService.runCode(payload);
      setResult(r.data.data);
      if (r.data.data?.testResults?.results?.length > 0) {
         setSelectedTest(r.data.data.testResults.results[0].id || '0');
      }
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Run execution failed.' });
    } finally {
      setRunning(false);
    }
  }, [code, running, submitting, id, language]);

  // Run with custom input
  const handleCustomRun = useCallback(async (customInputStr) => {
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setResult(null);
    try {
      const payload = { problemId: id, code, language, customInput: customInputStr };
      const r = await submissionsService.runCode(payload);
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
      const r = await submissionsService.createSubmission({ problemId: id, code, hintsUsed, language });
      setResult(r.data.data);
      if (r.data.data?.testResults?.results?.length > 0) {
         setSelectedTest(r.data.data.testResults.results[0].id || '0');
      }
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  }, [code, submitting, running, id, hintsUsed, language]);

  // Derived arrays
  const testCasesArray = problem?.examples || [];
  
  const stats = useMemo(() => {
    if (!result || !result.testResults || !result.testResults.results) {
      return { pass: 0, total: testCasesArray.length || 0, avgRt: 0, done: 0 };
    }
    const list = result.testResults.results;
    const pass = list.filter(r => r.passed).length;
    const totalRt = list.reduce((a, b) => a + (b.executionTime || 0), 0);
    const avgRt = list.length ? Math.round(totalRt / list.length) : 0;
    return { pass, total: list.length, avgRt, done: list.length };
  }, [result, testCasesArray]);

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-background"><div className="w-96"><LoadingSkeleton lines={8} /></div></div>;
  }
  if (!problem) {
    return <div className="h-full flex items-center justify-center bg-background text-zinc-500">Problem not found.</div>;
  }

  const workspaceContextValue = {
    problem, id,
    code, setCode, userTyped, setUserTyped,
    language, switchLanguage, resetCode, LANGUAGES,
    running, submitting, result, handleRun, handleSubmit,
    nudgeDepth, setNudgeDepth, lastNudgedCode, setLastNudgedCode,
    hintsUsed, setHintsUsed,
    lighthouse, setLighthouse, activeLine, setActiveLine, citedLines, setCitedLines,
    history, setHistory,
    mentorOpen, setMentorOpen,
    customInput, setCustomInput, customMode, setCustomMode, handleCustomRun
  };

  // ─── V4 Layout: the workspace renders inside the AppShell ───
  // No GridNav — the global sidebar is already present via AppShell > Outlet.
  // Layout: [LeftPane 380px] | [CenterPane flex-1] | [RightPane collapsible strip]
  // Below center: TestTiles panel

  return (
    <WorkspaceContext.Provider value={workspaceContextValue}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
        {/* Top Bar — breadcrumb, BKT mastery, stats, timer */}
        <TopBar elapsed={elapsed} stats={stats} />

        {/* 3-pane body — fully resizable */}
        <div className="flex min-h-0 flex-1 border-t border-white/[0.04]">
          <PanelGroup direction="horizontal" className="h-full">
            {/* LEFT — Problem Description */}
            <Panel defaultSize="30%" minSize="15%" maxSize="50%">
              <div className="flex h-full flex-col overflow-hidden border-r border-white/[0.04]">
                <LeftPane />
              </div>
            </Panel>

            <PanelResizeHandle className="group relative flex w-2 flex-shrink-0 cursor-col-resize items-center justify-center bg-[#0d1117] z-10">
              <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/[0.04] group-hover:bg-[var(--signal)] transition-colors duration-150" />
            </PanelResizeHandle>

            {/* CENTER — Editor + Action Bar + Test Cases */}
            <Panel defaultSize="55%" minSize="30%">
              <div className="flex h-full min-w-0 flex-col overflow-hidden">
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <CenterPane />
                </div>
                <TestTiles 
                  running={running || submitting} 
                  results={result} 
                  onRun={handleRun}
                  selected={selectedTest}
                  onSelect={setSelectedTest}
                  stats={stats}
                  testCasesArray={testCasesArray}
                />
              </div>
            </Panel>

            <PanelResizeHandle className="group relative flex w-2 flex-shrink-0 cursor-col-resize items-center justify-center bg-[#0d1117] z-10">
              <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/[0.04] group-hover:bg-[var(--signal)] transition-colors duration-150" />
            </PanelResizeHandle>

            {/* RIGHT — Compact Socratic Mentor */}
            <Panel defaultSize="15%" minSize="10%" maxSize="30%">
              <div className="h-full overflow-hidden border-l border-white/[0.04]">
                <RightPane />
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}