import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { problemsService, submissionsService } from "../../../../services/api";
import useSocket from "../../../../hooks/useSocket";
import { WorkspaceContext } from "../../WorkspaceContext";

import { GridNav } from "./grid-nav";
import { TopBar } from "./top-bar";
import { LeftPane } from "./left-pane";
import { CenterPane } from "./center-pane";
import { RightPane } from "./right-pane";
import { TestTiles } from "./test-tiles";

import LoadingSkeleton from "../../../../components/LoadingSkeleton";

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { key: 'python', label: 'Python', monaco: 'python' },
  { key: 'java', label: 'Java', monaco: 'java' },
  { key: 'cpp', label: 'C++', monaco: 'cpp' }
];

export function WorkspaceShell() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const [selectedTest, setSelectedTest] = useState(null);

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
  
  // Create stats specifically designed for the top bar and summary tiles
  const stats = useMemo(() => {
    if (!result || !result.testResults || !result.testResults.results) {
      return { pass: 0, total: testCasesArray.length || 0, avgRt: 0, done: 0 };
    }
    const list = result.testResults.results;
    const pass = list.filter(r => r.passed).length;
    const totalRt = list.reduce((a, b) => a + (b.executionTime || 0), 0);
    const avgRt = list.length ? Math.round(totalRt / list.length) : 0;
    return {
      pass,
      total: list.length,
      avgRt,
      done: list.length
    };
  }, [result, testCasesArray]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-background"><div className="w-96"><LoadingSkeleton lines={8} /></div></div>;
  }
  if (!problem) {
    return <div className="h-screen flex items-center justify-center bg-background text-zinc-500">Problem not found.</div>;
  }

  const workspaceContextValue = {
    problem, id,
    code, setCode, userTyped, setUserTyped,
    language, switchLanguage, LANGUAGES,
    running, submitting, result, handleRun, handleSubmit,
    nudgeDepth, setNudgeDepth, lastNudgedCode, setLastNudgedCode,
    hintsUsed, setHintsUsed,
    lighthouse, setLighthouse, activeLine, setActiveLine, citedLines, setCitedLines,
    history, setHistory
  };

  return (
    <WorkspaceContext.Provider value={workspaceContextValue}>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        <div className="grid h-screen" style={{ gridTemplateColumns: "48px 1fr" }}>
          <GridNav />
          <div className="grid min-w-0" style={{ gridTemplateRows: "44px 1fr 248px" }}>
            <TopBar elapsed={elapsed} stats={stats} />
            <div className="grid min-h-0 border-t border-white/[0.04]" style={{ gridTemplateColumns: "380px 1fr 400px" }}>
              <LeftPane />
              <CenterPane />
              <RightPane />
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
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}