import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { problemsService, submissionsService } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Send, Play, ChevronDown, ChevronRight, Lightbulb, ArrowRight, Loader2, History, RotateCcw } from 'lucide-react';
import { useRef } from 'react';

const Editor = lazy(() => import('@monaco-editor/react'));

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { key: 'python', label: 'Python', monaco: 'python' },
  { key: 'java', label: 'Java', monaco: 'java' },
  { key: 'cpp', label: 'C++', monaco: 'cpp' }
];

const ProblemWorkspace = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [nudgeText, setNudgeText] = useState('');
  const [loadingNudge, setLoadingNudge] = useState(false);
  const [showDesc, setShowDesc] = useState(true);
  const [userTyped, setUserTyped] = useState(false);

  // New UI states for Run vs Submit framework
  const [running, setRunning] = useState(false);
  const [customInputToggled, setCustomInputToggled] = useState(false);
  const [customInputStr, setCustomInputStr] = useState('');
  const [activeTab, setActiveTab] = useState('result'); // 'result' | 'history'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Progressive Nudging
  const [nudgeDepth, setNudgeDepth] = useState(1);
  const [lastNudgedCode, setLastNudgedCode] = useState('');

  // Lighthouse Mode
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const [lighthouseModeToggled, setLighthouseModeToggled] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await problemsService.getProblemById(id);
        const p = r.data.data.problem;
        setProblem(p);
        setCode(p.starterCodeMap?.javascript || p.starterCode || '// Your code here\n');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const switchLanguage = useCallback((newLang) => {
    if (newLang === language) return;
    
    // Auto-detect empty or default state to avoid wiping code unexpectedly
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

  const handleNudge = async () => {
    if (!code.trim() || loadingNudge) return;
    setLoadingNudge(true);
    setHintsUsed((h) => h + 1); // Deducts 1.5% from mastery points

    let currentDepth = nudgeDepth;
    if (code === lastNudgedCode) {
      if (currentDepth < 3) currentDepth += 1;
    } else {
      currentDepth = 1;
      setLastNudgedCode(code);
    }
    setNudgeDepth(currentDepth);

    try {
      let lastErrorStr = null;
      if (result?.testResults?.results) {
        const errTc = result.testResults.results.find(tc => typeof tc.actualOutput === 'string' && tc.actualOutput.startsWith('[ERROR]'));
        if (errTc) lastErrorStr = errTc.actualOutput.replace('[ERROR] ', '').trim();
      } else if (result?.error) {
        lastErrorStr = result.error;
      }

      const r = await problemsService.getAiNudge(id, code, language, currentDepth, lastErrorStr);
      const nudgeData = r.data.data.nudge;
      setNudgeText(nudgeData.nudgeText || (typeof nudgeData === 'string' ? nudgeData : ''));

      if (lighthouseModeToggled && nudgeData.targetLine && editorRef.current && monacoRef.current) {
        const line = parseInt(nudgeData.targetLine, 10);
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const lineCount = editor.getModel()?.getLineCount() || 0;

        if (!isNaN(line) && line > 0 && line <= lineCount) {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column: 1 });

          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
            {
              range: new monaco.Range(line, 1, line, 1),
              options: {
                isWholeLine: true,
                className: 'lighthouse-highlight' // style injected globally below
              }
            }
          ]);

          setTimeout(() => {
            if (editorRef.current) {
              decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
            }
          }, 3000);
        }
      }
    } catch (e) {
      setNudgeText('The Mentor is currently resting. Check your syntax and loops.');
    } finally {
      setLoadingNudge(false);
    }
  };

  const handleCodeChange = useCallback((val) => { setCode(val || ''); setUserTyped(true); }, []);

  const handleRun = async () => {
    if (!code.trim() || running || submitting) return;
    setRunning(true); setResult(null); setActiveTab('result');
    try {
      const payload = { problemId: id, code, language };
      if (customInputToggled && customInputStr.trim()) {
        payload.customInput = customInputStr;
      }
      const r = await submissionsService.runCode(payload);
      setResult(r.data.data);
    } catch (e) { 
      setResult({ error: e.response?.data?.message || 'Run execution failed.' }); 
    } finally {
      setRunning(false);
      setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || submitting || running) return;
    setSubmitting(true); setResult(null); setActiveTab('result');
    try {
      const r = await submissionsService.createSubmission({ problemId: id, code, hintsUsed, language });
      setResult(r.data.data);
    } catch (e) { setResult({ error: e.response?.data?.message || 'Submission failed.' }); }
    finally {
      setSubmitting(false);
      setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const callbacksRef = useRef({ handleRun, handleSubmit });
  useEffect(() => { callbacksRef.current = { handleRun, handleSubmit }; }, [handleRun, handleSubmit]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
          return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          callbacksRef.current.handleSubmit();
        } else {
          callbacksRef.current.handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadHistory = async () => {
    if (activeTab === 'history') return;
    setActiveTab('history');
    setLoadingHistory(true);
    try {
      const r = await submissionsService.getRecentSubmissions(id);
      setHistory(r.data.data.submissions);
    } catch (e) { console.error('Failed to load DB history:', e); }
    finally { setLoadingHistory(false); }
  };

  const restoreCodeOptions = (historicalCode, historicalLang) => {
    const ok = window.confirm('Restore this past submission? Your current editor will be overwritten.');
    if (!ok) return;
    if (language !== historicalLang) setLanguage(historicalLang);
    setCode(historicalCode);
    setUserTyped(true);
  };

  const calculateTotalTime = (testResults) => {
    if (!testResults?.results) return 0;
    return testResults.results.reduce((sum, r) => sum + (r.executionTime || 0), 0);
  };

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100vh-100px)]"><div className="card"><LoadingSkeleton lines={10} /></div><div className="card"><LoadingSkeleton lines={10} /></div></div>;
  if (!problem) return <div className="card text-center py-10"><p className="text-sm text-[#8888A0]">Problem not found.</p><Link to="/problems" className="text-xs text-[#6C63FF]">Back</Link></div>;

  const monacoLang = LANGUAGES.find((l) => l.key === language)?.monaco || 'javascript';

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-100px)]">
      {/* LEFT — Description */}
      <div className="lg:w-[42%] overflow-y-auto space-y-3">
        <div className="card bg-[#0F0F1A]">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-base font-semibold tracking-tight">{problem.title}</h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <p className="text-[10px] font-mono text-[#8888A0] mb-3">
            {problem.skillId?.name} · {problem.userAttempts || 0} attempts
          </p>

          <button onClick={() => setShowDesc(!showDesc)} className="flex items-center gap-1 text-xs text-[#8888A0] hover:text-[#E8E8F0] mb-2">
            {showDesc ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Description
          </button>
          {showDesc && (
            <div className="space-y-3">
              <p className="text-sm text-[#C0C0D0] leading-relaxed whitespace-pre-line">{problem.description}</p>
              {problem.constraints && (
                <pre className="text-xs font-mono text-[#8888A0] bg-[#0F0F1A] border border-[#2A2A4A] rounded p-2.5 whitespace-pre-line">{problem.constraints}</pre>
              )}
              {problem.examples?.length > 0 && problem.examples.map((ex, i) => (
                <div key={i} className="bg-[#0F0F1A] border border-[#2A2A4A] rounded p-2.5 font-mono text-xs">
                  <p><span className="text-[#8888A0]">Input: </span><span className="text-[#E8E8F0]">{ex.input}</span></p>
                  <p><span className="text-[#8888A0]">Output: </span><span className="text-[#E8E8F0]">{ex.output}</span></p>
                  {ex.explanation && <p className="text-[#8888A0] mt-1">{ex.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mentor Coach Nudge */}
        <div className="card bg-[#0F0F1A] border border-[#6C63FF]/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#E8E8F0] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#6C63FF]" /> Mentor Coach ({hintsUsed} nudges)
            </p>
            <div className="flex items-center gap-3">
              <label className="text-[10px] text-[#8888A0] flex items-center gap-1.5 cursor-pointer hover:text-[#E8E8F0] transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded border-[#2A2A4A] bg-[#0F0F1A] text-[#00D4AA] focus:ring-[#00D4AA]/30 cursor-pointer"
                  checked={lighthouseModeToggled}
                  onChange={(e) => setLighthouseModeToggled(e.target.checked)}
                />
                Lighthouse Mode
              </label>
              <button 
                onClick={handleNudge} 
                disabled={loadingNudge} 
                className="btn-primary text-xs px-3 py-1 bg-[#6C63FF]/20 hover:bg-[#6C63FF]/40 text-[#6C63FF] border border-[#6C63FF]/30 flex items-center gap-1"
              >
                {loadingNudge ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Ask for a Nudge'}
              </button>
            </div>
          </div>
          
          {nudgeText && (
            <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-lg p-3">
              <p className="text-xs text-[#E8E8F0] leading-relaxed italic border-l-2 border-[#6C63FF] pl-2">
                "{nudgeText}"
              </p>
            </div>
          )}
          {!nudgeText && !loadingNudge && (
            <p className="text-xs text-[#8888A0]">Stuck? Ask the Mentor to analyze your code block and give you a subtle hint.</p>
          )}
        </div>

        {/* Result & History Pane */}
        {(result || activeTab === 'history') && (
          <div id="result-section" className="card bg-[#0F0F1A] font-mono space-y-3">
            <div className="flex border-b border-[#2A2A4A]">
              <button 
                onClick={() => setActiveTab('result')}
                className={`flex-1 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${activeTab === 'result' ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]' : 'text-[#8888A0] hover:text-[#E8E8F0]'}`}
              >
                Result
              </button>
              <button 
                onClick={loadHistory}
                className={`flex-1 py-2 text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'history' ? 'text-[#00D4AA] border-b-2 border-[#00D4AA]' : 'text-[#8888A0] hover:text-[#E8E8F0]'}`}
              >
                <History className="w-3.5 h-3.5" /> Recent
              </button>
            </div>

            {/* Content: History */}
            {activeTab === 'history' && (
              <div className="pt-2 space-y-3">
                {loadingHistory ? (
                  <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-[#8888A0]" /></div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-[#8888A0] text-center py-4">No recent submissions found.</p>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className={`p-3 rounded border text-xs flex items-center justify-between transition-colors ${h.isCorrect ? 'border-[#00D4AA]/20 bg-[#00D4AA]/5' : 'border-[#FF4757]/20 bg-[#FF4757]/5'}`}>
                      <div>
                        <p className={`font-semibold ${h.isCorrect ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>{h.isCorrect ? 'Accepted' : 'Failed'}</p>
                        <p className="text-[#8888A0] mt-1 pr-2 truncate block sm:inline">{new Date(h.createdAt).toLocaleString()} · {h.language}</p>
                        {!h.isCorrect && <p className="text-[#8888A0] block sm:inline sm:ml-1">· {h.passedTestCases}/{h.totalTestCases} Tests</p>}
                      </div>
                      <button onClick={() => restoreCodeOptions(h.code, h.language)} className="shrink-0 p-1.5 bg-[#1A1A2E] hover:bg-[#2A2A4A] border border-[#2A2A4A] rounded text-[#E8E8F0] transition-colors" title="Restore this code">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Content: Execution Result */}
            {activeTab === 'result' && result && !result.error && (
              <div className="space-y-3 pt-2">
                {!result.customInputRun && (
                  <div className={`flex items-center justify-between p-2.5 rounded border ${result.submission?.isCorrect || result.testResults?.allPassed ? 'border-[#00D4AA]/30 bg-[#00D4AA]/5' : 'border-[#FF4757]/30 bg-[#FF4757]/5'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${result.submission?.isCorrect || result.testResults?.allPassed ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                        {result.submission?.isCorrect || result.testResults?.allPassed ? '✓' : '✗'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#E8E8F0]">{result.submission?.isCorrect || result.testResults?.allPassed ? 'All Passed' : 'Failed'}</p>
                        <p className="text-[10px] text-[#8888A0]">{result.submission?.passedTestCases ?? result.testResults?.passed}/{result.submission?.totalTestCases ?? result.testResults?.total} test cases</p>
                      </div>
                    </div>
                    {calculateTotalTime(result.testResults) > 0 && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#1A1A2E] text-[#8888A0] border border-[#2A2A4A] shadow-inner font-semibold tracking-wider flex items-center gap-1.5" title="Total Execution Time">
                        ⏱️ {calculateTotalTime(result.testResults)}ms
                      </span>
                    )}
                  </div>
                )}

            {/* Per-test-case details */}
            {result.testResults?.results?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-[#8888A0] uppercase tracking-widest">Test Case Details</p>
                {result.testResults.results.map((tc, i) => (
                  <div key={i} className={`rounded border p-2 text-xs ${tc.passed ? 'border-[#00D4AA]/20 bg-[#00D4AA]/5' : 'border-[#FF4757]/20 bg-[#FF4757]/5'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[#8888A0]">Test {i + 1}</span>
                      <div className="flex items-center gap-3">
                        {tc.executionTime > 0 && <span className="text-[#8888A0] text-[10px] font-mono">⏱️ {tc.executionTime}ms</span>}
                        <span className={tc.passed ? 'text-[#00D4AA]' : 'text-[#FF4757]'}>
                          {tc.passed ? '✓ Pass' : '✗ Fail'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {result.customInputRun ? (
                        <>
                          <p><span className="text-[#8888A0]">Custom Input: </span><span className="text-[#E8E8F0]">{tc.input || '(none)'}</span></p>
                          <p><span className="text-[#8888A0]">Your Output: </span><span className="text-[#E8E8F0]">{tc.actualOutput || '(empty)'}</span></p>
                        </>
                      ) : (
                        <>
                          <p><span className="text-[#8888A0]">Input: </span><span className="text-[#E8E8F0]">{tc.input || '(none)'}</span></p>
                          <p><span className="text-[#8888A0]">Expected: </span><span className="text-[#E8E8F0]">{tc.expectedOutput}</span></p>
                          <p><span className="text-[#8888A0]">Actual: </span><span className={tc.passed ? 'text-[#00D4AA]' : 'text-[#FF4757]'}>{tc.actualOutput || '(empty)'}</span></p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submissions only render progression / AST block */}
            {!result.customInputRun && result.submission && (
              <>
                <p className="text-xl font-bold text-[#00D4AA]">+{result.xpEarned || 0} XP</p>
                <p className="text-xs text-[#8888A0]">Mastery: <span className="text-[#6C63FF]">{Math.round((result.newMastery || 0) * 100)}%</span> · Level {result.newLevel} · Streak {result.newStreak}d</p>
                {result.astFeedback?.algorithmClass && result.astFeedback.algorithmClass !== 'n/a' && (
                  <p className="text-xs text-[#8888A0]">Algorithm: <span className="text-[#E8E8F0]">{result.astFeedback.algorithmClass}</span></p>
                )}
                {result.nudge && <p className="text-xs text-[#FFA726] bg-[#FFA726]/5 border border-[#FFA726]/15 rounded px-2.5 py-1.5">{result.nudge}</p>}
                {result.nextRecommendation?.problem && (
                  <Link to={`/problems/${result.nextRecommendation.problem._id}`} className="flex items-center gap-1.5 text-xs text-[#6C63FF] hover:underline">
                    Next: {result.nextRecommendation.problem.title} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </>
            )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'result' && result?.error && <div id="result-section" className="card bg-[#FF4757]/5 border-[#FF4757]/30"><p className="text-xs text-[#FF4757]">{result.error}</p></div>}
      </div>

      {/* RIGHT — Editor */}
      <div className="lg:w-[58%] flex flex-col">
        <div className="flex flex-col flex-1 bg-[#0A0A14] border border-[#2A2A4A] rounded-lg overflow-hidden">
          {/* Language selector */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2A4A]">
            <div className="flex items-center gap-0.5">
              {LANGUAGES.map((l) => (
                <button key={l.key} onClick={() => switchLanguage(l.key)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${language === l.key ? 'bg-[#6C63FF] text-white' : 'text-[#8888A0] hover:text-white'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-[350px]">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-[#6C63FF] animate-spin" /></div>}>
              <style>{`
                .lighthouse-highlight {
                  background-color: rgba(108, 99, 255, 0.4) !important;
                }
              `}</style>
              <Editor height="100%" language={monacoLang} theme="vs-dark" value={code} onChange={handleCodeChange}
                onMount={(editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco; }}
                options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on', padding: { top: 12 } }} />
            </Suspense>
          </div>

          {/* Custom Input Block */}
          {customInputToggled && (
            <div className="bg-[#0F0F1A] border-t border-[#2A2A4A] p-2 space-y-1">
              <label className="text-[10px] text-[#8888A0] uppercase tracking-widest pl-1 font-semibold flex items-center justify-between">
                Custom Input Test
                {language === 'java' && <span className="text-[#FFA726] lowercase font-normal">(Pipe <span className="font-mono text-white">|</span> delimited for Java inputs)</span>}
              </label>
              <textarea 
                placeholder={language === 'java' ? "e.g., [1,2,3] | 5" : "e.g., [1,2,3], 5"}
                value={customInputStr}
                onChange={e => setCustomInputStr(e.target.value)}
                className="w-full bg-[#1A1A2E] text-xs font-mono text-[#E8E8F0] border border-[#2A2A4A] focus:border-[#6C63FF] rounded p-2 focus:outline-none resize-y min-h-[50px] placeholder:text-[#8888A0]/50"
              />
            </div>
          )}

          {/* Action Footer */}
          <div className="px-3 py-2.5 border-t border-[#2A2A4A] flex items-center justify-between bg-[#0A0A14]">
            <div className="flex items-center">
              <label className="text-xs text-[#8888A0] flex items-center gap-1.5 cursor-pointer hover:text-[#E8E8F0] transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded border-[#2A2A4A] bg-[#0F0F1A] text-[#6C63FF] focus:ring-[#6C63FF]/30 cursor-pointer"
                  checked={customInputToggled}
                  onChange={(e) => setCustomInputToggled(e.target.checked)}
                />
                Custom Input
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRun} 
                disabled={submitting || running} 
                className="px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 bg-transparent border border-[#6C63FF]/50 text-[#6C63FF] hover:bg-[#6C63FF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Running</> : <><Play className="w-3.5 h-3.5"/> Run</>}
              </button>

              <button 
                onClick={handleSubmit} 
                disabled={submitting || running} 
                className="btn-primary min-w-[120px] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting</> : <><Send className="w-4 h-4" /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemWorkspace;
