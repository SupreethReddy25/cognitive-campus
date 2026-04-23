import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { problemsService } from "@/services/api";
import { ArrowRight, Lightbulb, Sparkles, Loader2, Zap } from "lucide-react";

/**
 * RightPane — Compact Socratic Mentor
 * 
 * Design: Minimal, compact AI assistant panel.
 * - Lighthouse toggle with green glow when active
 * - Smart one-click "Nudge" button
 * - Compact conversation thread
 * - No separate collapsed/expanded states — parent Panel handles sizing
 */
export function RightPane() {
  const { 
    id, code, language,
    nudgeDepth, setNudgeDepth, 
    lastNudgedCode, setLastNudgedCode,
    hintsUsed, setHintsUsed,
    result,
    lighthouse, setLighthouse, setCitedLines,
  } = useWorkspace();

  const [turns, setTurns] = useState([]);
  const [composing, setComposing] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, composing]);

  const requestNudge = async (userText) => {
    if (!code.trim() || composing) return;
    
    const msg = userText?.trim() || "Give me a hint";
    setTurns(ts => [...ts, { role: "you", text: msg }]);
    setComposing(true);
    setHintsUsed(h => h + 1);

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
      const nudgeText = nudgeData.nudgeText || (typeof nudgeData === 'string' ? nudgeData : '');
      const targetLine = parseInt(nudgeData.targetLine, 10);
      
      setTurns(ts => [...ts, {
        role: "mentor",
        text: nudgeText,
        cite: (!isNaN(targetLine) && targetLine !== null) ? [targetLine] : undefined
      }]);

      if (lighthouse && !isNaN(targetLine) && targetLine !== null) {
         setCitedLines([targetLine]);
      }
    } catch (e) {
      setTurns(ts => [...ts, {
        role: "mentor",
        text: "My circuits are resting. Check your syntax and edge cases."
      }]);
    } finally {
      setComposing(false);
    }
  };

  const glowActive = lighthouse;

  return <aside className={`relative flex h-full flex-col overflow-hidden transition-shadow duration-500 ${glowActive ? 'shadow-[inset_0_0_30px_rgba(74,124,89,0.08)]' : ''}`}>
    {/* ── Ambient glow overlay when lighthouse is ON ── */}
    {glowActive && <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[var(--signal)]/[0.03] via-transparent to-[var(--signal)]/[0.02]" />}

    {/* ── Header ── */}
    <div className="relative z-10 flex h-10 shrink-0 items-center justify-between border-b border-white/[0.04] px-3">
      <div className="flex items-center gap-2">
        <Sparkles className={`h-3 w-3 transition-colors duration-300 ${glowActive ? 'text-[var(--signal)]' : 'text-zinc-700'}`} strokeWidth={1.5} />
        <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">
          Mentor
        </span>
        {hintsUsed > 0 && <span className="font-mono text-[9px] tabular-nums text-zinc-700">({hintsUsed})</span>}
      </div>
      <LighthouseToggle value={lighthouse} onChange={setLighthouse} />
    </div>

    {/* ── Conversation ── */}
    <div ref={scrollerRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
      {turns.length === 0 ? (
        /* Empty state — clean and minimal */
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${glowActive ? 'bg-[var(--signal)]/10' : 'bg-white/[0.03]'}`}>
            <Lightbulb className={`h-4 w-4 transition-colors duration-300 ${glowActive ? 'text-[var(--signal)]' : 'text-zinc-700'}`} strokeWidth={1.5} />
          </div>
          <p className="text-[12px] text-zinc-600 leading-relaxed max-w-[180px]">
            Write some code, then ask for a nudge.
          </p>
          {glowActive && <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-[var(--signal)]/60 uppercase">Lighthouse active</p>}
        </div>
      ) : (
        <div className="space-y-4 px-3 py-3">
          {turns.map((t, i) => <Turn key={i} turn={t} index={i} onCite={setCitedLines} glowActive={glowActive} />)}
          {composing && <ComposingIndicator />}
        </div>
      )}
    </div>

    {/* ── Mastery delta ── */}
    <MasteryDelta result={result} />

    {/* ── Bottom: Smart Nudge Button + Input ── */}
    <div className="relative z-10 shrink-0 border-t border-white/[0.04] px-3 py-2.5">
      {/* One-click nudge */}
      <button 
        onClick={() => requestNudge()} 
        disabled={composing || !code.trim()}
        className={`group mb-2 flex w-full items-center justify-center gap-2 py-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
          glowActive 
            ? 'bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20 hover:bg-[var(--signal)]/20 hover:border-[var(--signal)]/40' 
            : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-200'
        }`}
      >
        {composing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Zap className={`h-3.5 w-3.5 transition-colors ${glowActive ? 'text-[var(--signal)]' : 'text-zinc-600 group-hover:text-zinc-300'}`} strokeWidth={2} />
        )}
        <span>{composing ? 'Thinking...' : 'Nudge me'}</span>
      </button>

      {/* Text input for custom questions */}
      <div className="flex items-center gap-2 border border-white/[0.04] bg-white/[0.01] px-2.5 py-1.5 transition-colors focus-within:border-white/[0.08]">
        <input 
          value="" 
          onChange={() => {}}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              requestNudge(e.target.value);
              e.target.value = "";
            }
          }}
          placeholder="Or ask something..."
          className="flex-1 bg-transparent text-[11px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none"
        />
        <span className="font-mono text-[8px] text-zinc-800">↵</span>
      </div>
    </div>
  </aside>;
}

function Turn({ turn, index, onCite, glowActive }) {
  const isYou = turn.role === "you";
  return <div 
    className="animate-in fade-in slide-in-from-bottom-1 duration-200" 
    style={{ animationDelay: `${Math.min(index, 4) * 40}ms` }}
    onMouseEnter={() => turn.cite && onCite(turn.cite)} 
    onMouseLeave={() => turn.cite && onCite([])}
  >
    <div className={`mb-1 flex items-center gap-1.5 font-mono text-[8px] tracking-[0.22em] ${isYou ? "text-zinc-700" : glowActive ? "text-[var(--signal)]/70" : "text-zinc-600"}`}>
      <span className={`h-1 w-1 rounded-full ${isYou ? 'bg-zinc-700' : glowActive ? 'bg-[var(--signal)]' : 'bg-zinc-600'}`} />
      <span>{isYou ? "YOU" : "MENTOR"}</span>
    </div>
    <div className={isYou 
      ? "border-l border-white/[0.06] pl-2.5 text-[11.5px] leading-relaxed text-zinc-500" 
      : `text-[12px] leading-[1.6] text-zinc-300 ${glowActive ? 'pl-2.5 border-l border-[var(--signal)]/20' : ''}`
    }>
      {turn.text}
    </div>

    {turn.cite && turn.cite.length > 0 && (
      <button onClick={() => onCite(turn.cite)} className="mt-1.5 inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.2em] text-zinc-700 transition-colors hover:text-[var(--signal)]">
        <span className="h-1 w-1 rounded-full bg-[var(--signal)] animate-pulse" />
        <span>LINE {turn.cite[0]}</span>
      </button>
    )}
  </div>;
}

function ComposingIndicator() {
  return <div className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.2em] text-zinc-700">
    <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
    <span>MENTOR</span>
    <span className="flex items-center gap-0.5 ml-1">
      {[0, 120, 240].map(d => (
        <span key={d} className="inline-block h-1 w-1 rounded-full bg-[var(--signal)] animate-pulse" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  </div>;
}

function LighthouseToggle({ value, onChange }) {
  return <button 
    onClick={() => onChange(!value)} 
    className="group flex items-center gap-1.5 transition-colors"
    aria-pressed={value}
    title={value ? "Lighthouse ON" : "Lighthouse OFF"}
  >
    <Lightbulb className={`h-3 w-3 transition-all duration-300 ${value ? "text-[var(--signal)] drop-shadow-[0_0_4px_rgba(74,124,89,0.5)]" : "text-zinc-700"}`} strokeWidth={1.5} />
    <span className={`relative inline-block h-3 w-6 rounded-full transition-colors duration-300 ${value ? "bg-[var(--signal)]/60" : "bg-white/[0.06]"}`}>
      <span className={`absolute top-[2px] h-[8px] w-[8px] rounded-full bg-zinc-100 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${value ? "left-[14px]" : "left-[2px]"}`} />
    </span>
  </button>;
}

function MasteryDelta({ result }) {
  if (!result || !result.submission || result.customInputRun) return null;

  const newMastery = result.newMastery || 0;
  const xpAwarded = result.xpEarned || 0;
  
  return <div className="relative z-10 shrink-0 border-t border-white/[0.04] px-3 py-2">
    <div className="flex items-center justify-between font-mono text-[8px] tracking-[0.2em] text-zinc-500">
      <span>MASTERY Δ</span>
      <span className="text-[var(--signal)] font-bold">+{xpAwarded} XP</span>
    </div>
    <div className="mt-1 h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
      <div className="h-full bg-[var(--signal)] transition-[width] duration-700" style={{ width: `${Math.min(100, newMastery * 100)}%` }} />
    </div>
  </div>;
}