import { useState, Suspense, lazy } from 'react';
import { problemsService } from '../services/api';
import { Loader2, ArrowUpRight, Check, X, AlertTriangle, Building2, Shield } from 'lucide-react';

const Editor = lazy(() => import('@monaco-editor/react'));

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { key: 'python', label: 'Python', monaco: 'python' },
  { key: 'java', label: 'Java', monaco: 'java' },
];

export default function SubmitIntelPage() {
  // ─── Form state ───
  const [rawDescription, setRawDescription] = useState('');
  const [company, setCompany] = useState('');
  const [round, setRound] = useState('');
  const [warStory, setWarStory] = useState('');
  const [confidence, setConfidence] = useState(65);
  const [referenceCode, setReferenceCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  // ─── Pipeline state ───
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState(null); // 'refining' | 'verifying' | null
  const [result, setResult] = useState(null); // { success, data }
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (rawDescription.trim().length < 20) {
      setError('Tell us more — at least 20 characters describing the problem.');
      return;
    }
    if (referenceCode.trim().length < 10) {
      setError('Paste your working solution in the editor below.');
      return;
    }

    setSubmitting(true);
    setPhase('refining');
    setResult(null);
    setError(null);

    try {
      // Brief delay for UX — shows the "refining" phase
      await new Promise(r => setTimeout(r, 600));
      setPhase('verifying');

      const response = await problemsService.proposeProblem({
        rawDescription: rawDescription.trim(),
        company: company.trim() || undefined,
        round: round.trim() || undefined,
        warStory: warStory.trim() || undefined,
        confidence,
        referenceCode: referenceCode.trim(),
        language
      });

      setResult({ success: true, data: response.data?.data });
      setPhase(null);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.data?.verificationResults) {
        // Verification failed — show test results
        setResult({
          success: false,
          data: errData.data,
          message: errData.message
        });
      } else {
        setError(errData?.message || err.message || 'Something went wrong.');
      }
      setPhase(null);
    } finally {
      setSubmitting(false);
    }
  };

  const confidenceLabel = confidence >= 80 ? 'HIGH' : confidence >= 50 ? 'MEDIUM' : 'LOW';
  const confidenceColor = confidence >= 80 ? 'text-[var(--signal)]' : confidence >= 50 ? 'text-amber-400' : 'text-rose-400';

  return <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
    <div className="flex min-h-full flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-md">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-zinc-500">
          <Shield className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.5} />
          <span className="text-zinc-200">INTEL</span>
          <span className="mx-1 h-3 w-px bg-white/[0.06]" />
          <span>SUBMIT REPORT</span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.22em] text-zinc-700">
          CLASSIFIED · {new Date().toISOString().slice(0, 10)}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-white/[0.04] px-10 pt-10 pb-8">
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span>FIELD REPORT</span>
          <span className="h-px w-8 bg-white/[0.08]" />
          <span className="text-zinc-500">INTERVIEW INTELLIGENCE</span>
        </div>
        <h1 className="font-sans text-[48px] font-extralight leading-[0.95] tracking-tight text-zinc-100" style={{ fontFamily: "'Playfair Display', serif" }}>
          Intelligence<br />
          <span className="text-[var(--signal)]">Report</span>.
        </h1>
        <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-zinc-500">
          Report what you remember from the interview. Our AI editor will refine your memory
          into a publication-quality coding challenge — then verify your solution.
        </p>
      </section>

      {/* ── Form body ── */}
      <div className="flex-1 px-10 py-8 space-y-8">

        {/* Raw Memory Dump */}
        <div>
          <label className="block font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-3">
            Raw Memory Dump
          </label>
          <textarea
            value={rawDescription}
            onChange={e => setRawDescription(e.target.value)}
            placeholder="Dump what you remember here. We'll handle the formatting.&#10;&#10;Example: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. I think there was a constraint about not using the same element twice. The interviewer said O(n) was expected.'"
            className="w-full min-h-[160px] resize-y bg-transparent border border-white/[0.04] px-5 py-4 text-[14px] leading-relaxed text-zinc-200 placeholder-zinc-700 outline-none font-mono transition-all duration-300 focus:border-[var(--signal)]/40 focus:shadow-[0_0_20px_rgba(74,124,89,0.06)]"
          />
          <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-zinc-700">
            <span>{rawDescription.length} CHARS</span>
            <span>{rawDescription.length >= 20 ? 'SUFFICIENT' : 'MIN 20 CHARS'}</span>
          </div>
        </div>

        {/* Metadata Bento */}
        <div className="grid grid-cols-5 gap-[1px] bg-white/[0.04] border border-white/[0.04]">
          {/* Company */}
          <div className="col-span-2 bg-background p-5">
            <label className="block font-mono text-[9px] tracking-[0.25em] text-zinc-600 uppercase mb-2">Company</label>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-zinc-700 shrink-0" strokeWidth={1.5} />
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Amazon, Google, Microsoft"
                className="w-full bg-transparent border-b border-white/[0.06] py-2 text-[14px] text-zinc-200 placeholder-zinc-700 outline-none transition-all focus:border-[var(--signal)]/40"
              />
            </div>
          </div>

          {/* Round */}
          <div className="col-span-1 bg-background p-5">
            <label className="block font-mono text-[9px] tracking-[0.25em] text-zinc-600 uppercase mb-2">Round</label>
            <input
              value={round}
              onChange={e => setRound(e.target.value)}
              placeholder="e.g. Round 2, OA"
              className="w-full bg-transparent border-b border-white/[0.06] py-2 text-[14px] text-zinc-200 placeholder-zinc-700 outline-none transition-all focus:border-[var(--signal)]/40"
            />
          </div>

          {/* Confidence Slider */}
          <div className="col-span-2 bg-background p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[9px] tracking-[0.25em] text-zinc-600 uppercase">Confidence</label>
              <span className={`font-mono text-[11px] tabular-nums ${confidenceColor}`}>{confidence}% · {confidenceLabel}</span>
            </div>
            <div className="relative mt-3">
              <input
                type="range" min="0" max="100" value={confidence}
                onChange={e => setConfidence(Number(e.target.value))}
                className="w-full h-[3px] appearance-none bg-white/[0.06] rounded-none outline-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:bg-[var(--signal)] [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(74,124,89,0.5)]
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[var(--signal)]
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
              />
              {/* Filled track */}
              <div className="absolute top-0 left-0 h-[3px] bg-[var(--signal)]/40 pointer-events-none" style={{ width: `${confidence}%` }} />
            </div>
            <div className="flex justify-between mt-1 font-mono text-[8px] text-zinc-800">
              <span>VAGUE</span>
              <span>EXACT RECALL</span>
            </div>
          </div>
        </div>

        {/* War Story */}
        <div>
          <label className="block font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase mb-3">
            The War Story <span className="text-zinc-700">(optional)</span>
          </label>
          <textarea
            value={warStory}
            onChange={e => setWarStory(e.target.value)}
            placeholder="How was the interviewer? Was the round hard? Any tips for future candidates? This gets shown as a 'classified briefing' to other students."
            className="w-full min-h-[100px] resize-y bg-transparent border-b border-white/[0.04] px-0 py-3 text-[14px] leading-relaxed text-zinc-300 placeholder-zinc-700 outline-none italic transition-all duration-300 focus:border-[var(--signal)]/30"
            style={{ fontFamily: "'Playfair Display', serif" }}
          />
        </div>

        {/* Reference Code — Monaco */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
              Reference Solution
            </label>
            <div className="flex items-center gap-1">
              {LANGUAGES.map(l => (
                <button
                  key={l.key}
                  onClick={() => setLanguage(l.key)}
                  className={`px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] uppercase transition-all duration-200 ${
                    language === l.key
                      ? 'bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20'
                      : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border border-white/[0.04] overflow-hidden" style={{ height: 280 }}>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-[var(--signal)] animate-spin" /></div>}>
              <Editor
                height="100%"
                language={LANGUAGES.find(l => l.key === language)?.monaco || 'javascript'}
                theme="vs-dark"
                value={referenceCode}
                onChange={val => setReferenceCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                }}
              />
            </Suspense>
          </div>
          <div className="mt-1.5 font-mono text-[9px] tracking-[0.2em] text-zinc-700">
            PASTE YOUR WORKING SOLUTION · WE'LL VERIFY IT AGAINST AI-GENERATED TEST CASES
          </div>
        </div>

        {/* Error banner */}
        {error && <div className="flex items-start gap-3 border border-rose-500/20 bg-rose-500/5 px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-[12px] text-rose-400">{error}</p>
            <button onClick={() => setError(null)} className="mt-1 font-mono text-[9px] text-rose-500/60 hover:text-rose-400 transition-colors">DISMISS</button>
          </div>
        </div>}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="group w-full border border-white/[0.08] bg-transparent py-4 text-[12px] font-medium tracking-[0.3em] text-zinc-300 uppercase transition-all duration-500 hover:bg-[var(--signal)] hover:text-white hover:border-[var(--signal)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{phase === 'refining' ? 'AI IS REFINING YOUR INTEL...' : 'VERIFYING AGAINST PISTON...'}</span>
            </>
          ) : (
            <>
              <span>TRANSMIT INTEL</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>

        {/* ═══ Result Panel ═══ */}
        {result && (
          <div className={`border ${result.success ? 'border-[var(--signal)]/20 bg-[var(--signal)]/[0.03]' : 'border-amber-500/20 bg-amber-500/[0.03]'} p-6 space-y-4`}>
            {/* Header */}
            <div className="flex items-center gap-3">
              {result.success ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--signal)]/10">
                  <Check className="h-4 w-4 text-[var(--signal)]" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                  <X className="h-4 w-4 text-amber-400" />
                </div>
              )}
              <div>
                <h3 className="text-[14px] font-medium text-zinc-200">
                  {result.success ? 'Intel Accepted' : 'Verification Failed'}
                </h3>
                <p className="text-[12px] text-zinc-500">
                  {result.success
                    ? `"${result.data?.problem?.title}" waitlisted for review.`
                    : result.message}
                </p>
              </div>
            </div>

            {/* Problem preview (success) */}
            {result.success && result.data?.problem && (
              <div className="border border-white/[0.04] p-4 space-y-2">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
                  <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
                  <span>GENERATED PROBLEM</span>
                </div>
                <h4 className="text-[16px] font-medium text-zinc-200">{result.data.problem.title}</h4>
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em]">
                  <span className={`uppercase ${result.data.problem.difficulty === 'easy' ? 'text-[var(--signal)]' : result.data.problem.difficulty === 'hard' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {result.data.problem.difficulty}
                  </span>
                  {result.data.problem.company && <span className="text-zinc-500">{result.data.problem.company}</span>}
                  <span className="text-zinc-700">{result.data.problem.testCaseCount} test cases</span>
                </div>
              </div>
            )}

            {/* Test results (failure) */}
            {!result.success && result.data?.verificationResults && (
              <div className="space-y-2">
                <div className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase mb-2">Test Case Results</div>
                {result.data.verificationResults.map((tr, i) => (
                  <div key={i} className={`border ${tr.passed ? 'border-[var(--signal)]/10' : 'border-rose-500/10'} p-3 font-mono text-[11px] space-y-1`}>
                    <div className="flex items-center gap-2">
                      {tr.passed
                        ? <Check className="h-3 w-3 text-[var(--signal)]" />
                        : <X className="h-3 w-3 text-rose-400" />}
                      <span className={tr.passed ? 'text-zinc-400' : 'text-rose-400'}>Test {i + 1}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-600">
                      <div><span className="text-zinc-700">Input:</span> <span className="text-zinc-400 break-all">{tr.input?.substring(0, 60)}</span></div>
                      <div><span className="text-zinc-700">Expected:</span> <span className="text-zinc-400 break-all">{tr.expectedOutput?.substring(0, 60)}</span></div>
                      <div><span className="text-zinc-700">Actual:</span> <span className={`break-all ${tr.passed ? 'text-[var(--signal)]' : 'text-rose-400'}`}>{tr.actualOutput?.substring(0, 60)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-10 py-4 font-mono text-[9px] tracking-[0.24em] text-zinc-800">
        <span>INTEL · ENGINE / 2026</span>
        <span className="text-[var(--signal)]/50">CLASSIFIED</span>
      </div>
    </div>
  </div>;
}
