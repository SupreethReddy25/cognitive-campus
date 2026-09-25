import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from './WorkspaceContext';
import { problemsService } from '@/services/api';
import { Loader2, KeyRound, WifiOff } from 'lucide-react';
import { cn } from '@/components/ui/kit';

const DEPTHS = [
  { depth: 1, key: 'hint', label: 'A hint', desc: 'A nudge in the right direction' },
  { depth: 2, key: 'approach', label: 'The approach', desc: 'Name the technique, find the flaw' },
  { depth: 3, key: 'pseudocode', label: 'Pseudocode', desc: 'A step-by-step plan, no code' }
];

/**
 * RightPane — Socratic Mentor with three progressive levels.
 * Students choose how much help they want; deeper levels cost a little mastery (hints are counted).
 * Works with a Gemini key (BYOK or platform) and degrades to curated hints/editorial steps when AI is unavailable.
 */
export function RightPane() {
  const {
    id, code, language, result, hintsUsed, setHintsUsed, setNudgeDepth, nudgeDepth,
    lighthouse, setLighthouse, setCitedLines
  } = useWorkspace();

  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns.length, busy]);

  const lastError = () => {
    if (result?.testResults?.results) {
      const e = result.testResults.results.find((tc) => typeof tc.actualOutput === 'string' && tc.actualOutput.startsWith('[ERROR]'));
      if (e) return e.actualOutput.replace('[ERROR] ', '').trim();
    }
    return result?.error || null;
  };

  const ask = async (depth) => {
    if (!code.trim() || busy) return;
    setBusy(depth);
    setHintsUsed((h) => h + 1);
    setNudgeDepth(depth);
    try {
      const r = await problemsService.getAiNudge(id, code, language, depth, lastError());
      const n = r.data.data.nudge;
      const targetLine = Number.isInteger(n.targetLine) ? n.targetLine : null;
      setTurns((t) => [...t, { role: 'mentor', depth, text: n.nudgeText, cite: targetLine ? [targetLine] : undefined, source: n.source, provider: n.ai?.provider }]);
      if (n.remaining !== null && n.remaining !== undefined) setRemaining(n.remaining);
      setNotice(n.ai && n.ai.used === false ? { message: n.ai.message, needsKey: !!n.ai.needsKey } : null);
      if (lighthouse && targetLine) setCitedLines([targetLine]);
    } catch (e) {
      setTurns((t) => [...t, { role: 'mentor', depth, text: e.response?.data?.message || 'The mentor could not be reached. Trace your code against the first example by hand.', source: 'error' }]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <aside className="relative flex h-full flex-col overflow-hidden">
      <div className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-[var(--line)] px-5">
        <div className="flex items-baseline gap-3">
          <span className="display text-[24px] leading-none text-zinc-100">Mentor</span>
          {hintsUsed > 0 && <span className="text-[12px] tnum text-zinc-600" title="Hints reduce mastery gain slightly">{hintsUsed} used</span>}
        </div>
        <button onClick={() => setLighthouse(!lighthouse)} aria-pressed={lighthouse} title="Lighthouse: highlight the line the mentor points at" className="flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-300">
          <span className={cn('relative inline-block h-4 w-7 rounded-full transition-colors', lighthouse ? 'bg-[var(--ember)]' : 'bg-white/[0.12]')}>
            <span className={cn('absolute top-[2px] h-3 w-3 rounded-full bg-[#14100d] transition-all', lighthouse ? 'left-[14px]' : 'left-[2px] bg-zinc-300')} />
          </span>
          Lighthouse
        </button>
      </div>

      {/* Thread */}
      <div ref={scrollerRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
        {turns.length === 0 ? (
          <div className="flex h-full flex-col justify-center px-6">
            <p className="display text-[34px] leading-[1.05] text-zinc-300">Stuck? <em className="text-zinc-500">Ask for exactly as much help as you want.</em></p>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">Each step gives away a little more — and costs a little mastery. Start small.</p>
          </div>
        ) : (
          <div className="space-y-7 px-6 py-6">
            {turns.map((t, i) => (
              <div key={i} onMouseEnter={() => t.cite && setCitedLines(t.cite)} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                <div className="mb-2 flex items-center gap-2 text-[12px] text-[var(--ember-soft)]">
                  <span className="display text-[18px] leading-none">{t.depth}</span>{DEPTHS[t.depth - 1].label}
                  <span className="text-zinc-700">{t.source === 'curated' ? '· curated' : t.source === 'cache' ? '· saved' : t.source === 'ai' ? '· AI' : ''}</span>
                </div>
                <div className="whitespace-pre-line border-l-2 border-[var(--line-strong)] pl-4 text-[14.5px] leading-[1.7] text-zinc-300">{t.text}</div>
                {t.cite && <button onClick={() => setCitedLines(t.cite)} className="mt-2 ml-4 inline-flex items-center gap-1.5 text-[12px] text-zinc-500 transition-colors hover:text-[var(--ember)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" />see line {t.cite[0]}</button>}
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-[13px] text-zinc-600"><Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ember)]" /> Thinking…</div>}
          </div>
        )}
      </div>

      {notice && (
        <div className={cn('relative z-10 mx-5 mb-3 border-l-2 pl-3 text-[12.5px] leading-snug', notice.needsKey ? 'border-[var(--star)] text-zinc-300' : 'border-zinc-600 text-zinc-500')}>
          <div className="flex items-start gap-2">
            {notice.needsKey ? <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--star)]" /> : <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>{notice.message} {notice.needsKey && <Link to="/profile#ai" className="text-[var(--ember)] hover:underline">Add your key</Link>}</span>
          </div>
        </div>
      )}

      {/* Ladder */}
      <div className="relative z-10 shrink-0 border-t border-[var(--line)] px-3 pb-20 pt-2">
        {DEPTHS.map((d) => (
          <button key={d.key} onClick={() => ask(d.depth)} disabled={!!busy || !code.trim()} title={d.desc}
            className={cn('group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40', nudgeDepth === d.depth && turns.length ? 'bg-white/[0.05]' : 'hover:bg-white/[0.04]')}>
            <span className="display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)] text-[20px] text-zinc-400 transition-colors group-hover:border-[var(--ember)] group-hover:text-[var(--ember)]">{busy === d.depth ? <Loader2 className="h-4 w-4 animate-spin text-[var(--ember)]" /> : d.depth}</span>
            <span className="min-w-0"><span className="block text-[14.5px] font-medium text-zinc-200">{d.label}</span><span className="block truncate text-[12px] text-zinc-600">{d.desc}</span></span>
          </button>
        ))}
        <div className="mt-1 px-3 text-[11.5px] leading-relaxed text-zinc-700">{remaining !== null ? `${remaining} free AI hints left today · ` : ''}The editorial unlocks after a solve or 3 attempts.</div>
      </div>
    </aside>
  );
}
