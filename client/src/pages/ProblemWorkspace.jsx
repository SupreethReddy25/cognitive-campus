import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { problemsService, submissionsService } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Send, ChevronDown, ChevronRight, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';

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
  const [expandedHints, setExpandedHints] = useState([]);
  const [showDesc, setShowDesc] = useState(true);
  const [userTyped, setUserTyped] = useState(false);

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
    if (userTyped) {
      const ok = window.confirm('Switch language? Your current code will be replaced.');
      if (!ok) return;
    }
    setLanguage(newLang);
    setCode(problem?.starterCodeMap?.[newLang] || problem?.starterCode || '');
    setUserTyped(false);
    setResult(null);
  }, [language, userTyped, problem]);

  const toggleHint = useCallback((i) => {
    setExpandedHints((prev) => { if (prev.includes(i)) return prev; setHintsUsed((h) => h + 1); return [...prev, i]; });
  }, []);

  const handleCodeChange = useCallback((val) => { setCode(val || ''); setUserTyped(true); }, []);

  const handleSubmit = async () => {
    if (!code.trim() || submitting) return;
    setSubmitting(true); setResult(null);
    try {
      const r = await submissionsService.createSubmission({ problemId: id, code, hintsUsed, language });
      setResult(r.data.data);
    } catch (e) { setResult({ error: e.response?.data?.message || 'Submission failed.' }); }
    finally { setSubmitting(false); }
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

        {/* Hints */}
        {problem.hints?.length > 0 && (
          <div className="card bg-[#0F0F1A]">
            <p className="text-xs font-medium text-[#E8E8F0] mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#FFA726]" /> Hints ({hintsUsed})
            </p>
            <div className="space-y-1.5">
              {problem.hints.map((h, i) => expandedHints.includes(i)
                ? <div key={i} className="bg-[#FFA726]/5 border border-[#FFA726]/15 rounded px-2.5 py-1.5"><p className="text-xs text-[#FFA726]">{h}</p></div>
                : <button key={i} onClick={() => toggleHint(i)} className="text-xs text-[#FFA726] hover:underline">Reveal Hint {i + 1}</button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !result.error && (
          <div className="card bg-[#0F0F1A] font-mono space-y-3">
            <p className="text-xs text-[#8888A0] uppercase tracking-widest">Result</p>
            <div className={`flex items-center gap-2 p-2.5 rounded border ${result.submission?.isCorrect ? 'border-[#00D4AA]/30 bg-[#00D4AA]/5' : 'border-[#FF4757]/30 bg-[#FF4757]/5'}`}>
              <span className={`text-lg ${result.submission?.isCorrect ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                {result.submission?.isCorrect ? '✓' : '✗'}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#E8E8F0]">{result.submission?.isCorrect ? 'All Passed' : 'Failed'}</p>
                <p className="text-[10px] text-[#8888A0]">{result.submission?.passedTestCases}/{result.submission?.totalTestCases} test cases</p>
              </div>
            </div>
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
          </div>
        )}
        {result?.error && <div className="card bg-[#FF4757]/5 border-[#FF4757]/30"><p className="text-xs text-[#FF4757]">{result.error}</p></div>}
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
              <Editor height="100%" language={monacoLang} theme="vs-dark" value={code} onChange={handleCodeChange}
                options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on', padding: { top: 12 } }} />
            </Suspense>
          </div>

          {/* Submit */}
          <div className="px-3 py-2.5 border-t border-[#2A2A4A]">
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : <><Send className="w-4 h-4" /> Submit</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemWorkspace;
