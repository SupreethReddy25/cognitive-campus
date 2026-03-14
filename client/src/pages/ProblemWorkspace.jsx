import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { problemsService, submissionsService } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  Play, Send, ChevronDown, ChevronRight, CheckCircle2,
  XCircle, AlertTriangle, Lightbulb, ArrowRight, Loader2
} from 'lucide-react';

// Lazy load Monaco Editor — it's heavy (~2MB)
const Editor = lazy(() => import('@monaco-editor/react'));

const ProblemWorkspace = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [expandedHints, setExpandedHints] = useState([]);
  const [showDescription, setShowDescription] = useState(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await problemsService.getProblemById(id);
        const prob = res.data.data.problem;
        setProblem(prob);
        setCode(prob.starterCode || '// Write your solution here\n');
      } catch (err) {
        console.error('Failed to load problem:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const toggleHint = useCallback((index) => {
    setExpandedHints((prev) => {
      if (prev.includes(index)) return prev;
      setHintsUsed((h) => h + 1);
      return [...prev, index];
    });
  }, []);

  const handleSubmit = async () => {
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await submissionsService.createSubmission({
        problemId: id,
        code,
        hintsUsed
      });
      setResult(res.data.data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Submission failed. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)]">
        <div className="card"><LoadingSkeleton lines={10} /></div>
        <div className="card"><LoadingSkeleton lines={10} /></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted">Problem not found.</p>
        <Link to="/problems" className="text-primary text-sm mt-2 inline-block">Back to Problems</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
      {/* LEFT PANEL — Problem description + results */}
      <div className="lg:w-[45%] overflow-y-auto space-y-4">
        {/* Problem header */}
        <div className="card">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-xl font-bold">{problem.title}</h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <p className="text-xs text-muted mb-4">
            Skill: {problem.skillId?.name} • Attempts: {problem.userAttempts || 0}
          </p>

          {/* Toggle description */}
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-1 text-sm text-muted hover:text-gray-100 mb-2"
          >
            {showDescription ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Description
          </button>

          {showDescription && (
            <div className="space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {problem.description}
              </p>

              {problem.constraints && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Constraints</h3>
                  <pre className="text-xs text-muted bg-secondary rounded-lg p-3 whitespace-pre-line">
                    {problem.constraints}
                  </pre>
                </div>
              )}

              {problem.examples?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Examples</h3>
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="bg-secondary rounded-lg p-3 mb-2 text-xs">
                      <p className="text-muted"><strong className="text-gray-300">Input:</strong> {ex.input}</p>
                      <p className="text-muted"><strong className="text-gray-300">Output:</strong> {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-muted mt-1"><strong className="text-gray-300">Explanation:</strong> {ex.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hints */}
        {problem.hints?.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Hints ({hintsUsed} used)
            </h3>
            <div className="space-y-2">
              {problem.hints.map((hint, index) => (
                <div key={index}>
                  {expandedHints.includes(index) ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <p className="text-sm text-amber-200">{hint}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleHint(index)}
                      className="text-sm text-amber-400 hover:underline"
                    >
                      Reveal Hint {index + 1}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results panel */}
        {result && !result.error && (
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold">Submission Result</h3>

            {/* Pass/fail */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              result.submission?.isCorrect
                ? 'bg-accent/10 border border-accent/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              {result.submission?.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <div>
                <p className="font-medium">
                  {result.submission?.isCorrect ? 'All Tests Passed!' : 'Some Tests Failed'}
                </p>
                <p className="text-xs text-muted">
                  {result.submission?.passedTestCases}/{result.submission?.totalTestCases} test cases passed
                </p>
              </div>
            </div>

            {/* XP earned */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-400 font-semibold">+{result.xpEarned || 0} XP</span>
              <span className="text-muted">• Level {result.newLevel} • Streak {result.newStreak}d</span>
            </div>

            {/* Mastery */}
            <div className="text-sm">
              <span className="text-muted">Mastery: </span>
              <span className="text-primary font-medium">
                {Math.round((result.newMastery || 0) * 100)}%
              </span>
            </div>

            {/* AST feedback */}
            {result.astFeedback && (
              <div className="text-sm">
                <p className="text-muted">
                  Algorithm: <span className="text-gray-200">{result.astFeedback.algorithmClass}</span>
                </p>
                {result.astFeedback.antiPatternDetected && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-2">
                    <p className="text-amber-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {result.astFeedback.antiPatternDescription}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Nudge */}
            {result.nudge && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <p className="text-amber-200 text-sm">{result.nudge}</p>
              </div>
            )}

            {/* Next recommendation */}
            {result.nextRecommendation?.problem && (
              <Link
                to={`/problems/${result.nextRecommendation.problem._id}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Next: {result.nextRecommendation.problem.title} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {result?.error && (
          <div className="card bg-red-500/10 border-red-500/30">
            <p className="text-red-400 text-sm">{result.error}</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — Code editor */}
      <div className="lg:w-[55%] flex flex-col">
        <div className="card flex-1 flex flex-col p-0 overflow-hidden">
          {/* Editor header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
            <span className="text-sm text-muted">JavaScript</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-[400px]">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            }>
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16 }
                }}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemWorkspace;
