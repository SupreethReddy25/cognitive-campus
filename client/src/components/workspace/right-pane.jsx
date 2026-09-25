import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from './WorkspaceContext';
import { problemsService } from '@/services/api';
import { Lightbulb, Sparkles, Loader2, Compass, ListChecks, KeyRound, WifiOff, BookOpen } from 'lucide-react';
import { cn } from '@/components/ui/kit';

const DEPTHS = [
  { depth: 1, key: 'hint', label: 'Hint', desc: 'A nudge in the right direction', icon: Lightbulb },
  { depth: 2, key: 'approach', label: 'Approach', desc: 'Name the technique, find the flaw', icon: Compass },
  { depth: 3, key: 'pseudocode', label: 'Pseudocode', desc: 'A step-by-step plan, no code', icon: ListChecks }
];

/**
 * RightPane — Socratic Mentor with three progressive levels.
 * Each level is an explicit button, so students choose how much help they want; deeper levels
 * cost a little mastery (hints are counted). Works with a Gemini key (BYOK or platform) and
 * degrades to curated hints/editorial steps when AI is unavailable.
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
    <aside className={cn('relative flex h-full flex-col overflow-hidden', lighthouse && 'shadow-[inset_0_0_30px_rgba(52,211,153,0.05)]')} style={lighthouse ? { borderLeft: '1px solid rgba(52,211,153,0.2)' } : {}}>
      {/* Header */}
      <div className="relative z-10 flex h-10 shrink-0 items-center justify-between border-b border-white/[0.05] px-3">
        <div className="flex items-center gap-2">
          <Sparkles className={cn('h-3.5 w-3.5', lighthouse ? 'text-[var(--signal)]' : 'text-zinc-600')} strokeWidth={1.6} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Mentor</span>
          {hintsUsed > 0 && <span className="font-mono text-[9px] tabular-nums text-amber-400/80" title="Hints reduce mastery gain slightly">{hintsUsed} used</span>}
        </div>
        <button onClick={() => setLighthouse(!lighthouse)} aria-pressed={lighthouse} title={lighthouse ? 'Lighthouse on — highlights the line the mentor points at' : 'Lighthouse off'} className="flex items-center gap-1.5">
          <Lightbulb className={cn('h-3 w-3', lighthouse ? 'text-[var(--signal)]' : 'text-zinc-700')} strokeWidth={1.6} />
          <span className={cn('relative inline-block h-3 w-6 rounded-full transition-colors', lighthouse ? 'bg-[var(--signal)]/60' : 'bg-white/[0.08]')}>
            <span className={cn('absolute top-[2px] h-2 w-2 rounded-full bg-zinc-100 transition-all', lighthouse ? 'left-[14px]' : 'left-[2px]')} />
          </span>
        </button>
      </div>

      {/* Thread */}
      <div ref={scrollerRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
        {turns.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]"><Lightbulb className="h-5 w-5 text-zinc-600" strokeWidth={1.5} /></span>
            <p className="max-w-[190px] text-[12px] leading-relaxed text-zinc-500">Stuck? Ask for the level of help you want — start small.</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-700">Hint → Approach → Pseudocode</p>
          </div>
        ) : (
          <div className="space-y-4 px-3 py-3">
            {turns.map((t, i) => {
              const meta = DEPTHS[t.depth - 1];
              return (
                <div key={i} onMouseEnter={() => t.cite && setCitedLines(t.cite)} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--signal)]/80">
                    <meta.icon className="h-3 w-3" strokeWidth={1.8} />
                    <span>{meta.label}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-600">{t.source === 'curated' ? 'curated' : t.source === 'cache' ? 'saved' : t.source === 'ai' ? 'AI' : ''}</span>
                  </div>
                  <div className="whitespace-pre-line rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-[12.5px] leading-[1.65] text-zinc-300">{t.text}</div>
                  {t.cite && <button onClick={() => setCitedLines(t.cite)} className="mt-1.5 inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.18em] text-zinc-600 transition-colors hover:text-[var(--signal)]"><span className="h-1 w-1 animate-pulse rounded-full bg-[var(--signal)]" />LINE {t.cite[0]}</button>}
                </div>
              );
            })}
            {busy && <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-600"><Loader2 className="h-3 w-3 animate-spin text-[var(--signal)]" /> Thinking…</div>}
          </div>
        )}
      </div>

      {/* Missing key / degraded notice */}
      {notice && (
        <div className={cn('relative z-10 mx-3 mb-2 rounded-lg border px-3 py-2 text-[11px] leading-snug', notice.needsKey ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400')}>
          <div className="flex items-start gap-2">
            {notice.needsKey ? <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>{notice.message} {notice.needsKey && <Link to="/profile#ai" className="font-semibold underline underline-offset-2">Open AI settings</Link>}</span>
          </div>
        </div>
      )}

      {/* Ladder */}
      <div className="relative z-10 shrink-0 space-y-1.5 border-t border-white/[0.05] px-3 py-3">
        {DEPTHS.map((d) => (
          <button
            key={d.key}
            onClick={() => ask(d.depth)}
            disabled={!!busy || !code.trim()}
            title={d.desc}
            className={cn(
              'group flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40',
              nudgeDepth === d.depth && turns.length ? 'border-[var(--signal)]/30 bg-[var(--signal)]/[0.07]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
            )}
          >
            {busy === d.depth ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--signal)]" /> : <d.icon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-[var(--signal)]" strokeWidth={1.8} />}
            <span className="flex-1">
              <span className="block text-[11.5px] font-medium text-zinc-200">{d.label}</span>
              <span className="hidden text-[10px] text-zinc-600 xl:block">{d.desc}</span>
            </span>
            <span className="font-mono text-[9px] text-zinc-700">L{d.depth}</span>
          </button>
        ))}
        {remaining !== null && <div className="pt-0.5 text-center font-mono text-[9px] tracking-wider text-zinc-600">{remaining} free AI hints left today</div>}
        <div className="flex items-center justify-center gap-1.5 pt-0.5 font-mono text-[9px] text-zinc-700"><BookOpen className="h-2.5 w-2.5" /> Editorial unlocks after a solve or 3 attempts</div>
      </div>
    </aside>
  );
}
