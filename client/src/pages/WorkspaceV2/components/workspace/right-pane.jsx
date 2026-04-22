"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspace } from "../../WorkspaceContext";
import { problemsService } from "../../../../services/api";
import { ArrowRight, Command, Lightbulb, Sparkles, Loader2 } from "lucide-react";

export function RightPane() {
  const { 
    id, code, language,
    nudgeDepth, setNudgeDepth, 
    lastNudgedCode, setLastNudgedCode,
    hintsUsed, setHintsUsed,
    result,
    lighthouse, setLighthouse, setCitedLines
  } = useWorkspace();

  const [turns, setTurns] = useState([
    { role: "mentor", text: "Stuck? Ask me to analyze your code block and give you a subtle hint." }
  ]);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, composing]);

  const submit = async () => {
    if (!code.trim() || composing) return;
    
    const userText = draft.trim() || "Can I get a hint?";
    setTurns(ts => [...ts, { role: "you", text: userText }]);
    setDraft("");
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
        text: "My neural pathways are resting. Check your syntax and loops."
      }]);
    } finally {
      setComposing(false);
    }
  };

  return <aside className="relative flex min-h-0 flex-col border-l border-white/[0.04]">
      <span className="vlabel pointer-events-none absolute right-1 top-4 font-mono text-[9px] text-zinc-700">
        MENTOR · 04
      </span>

      {/* Header + Lighthouse toggle */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.04] pl-6 pr-3 shadow-md z-10 bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-[var(--signal)]" strokeWidth={1.5} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-400">
            SOCRATIC · MENTOR ({hintsUsed})
          </span>
        </div>
        <LighthouseToggle value={lighthouse} onChange={setLighthouse} />
      </div>

      {/* Conversation body */}
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
        <div className="space-y-6 px-6 py-5">
          {turns.map((t, i) => <Turn key={i} turn={t} index={i} onCite={setCitedLines} />)}
          {composing && <ComposingIndicator />}
        </div>
      </div>

      <MasteryDelta result={result} />

      {/* Composer */}
      <div className="shrink-0 border-t border-white/[0.04] px-3 py-2.5 bg-[#0a0a0a]">
        <div className="ease-signature flex items-center gap-2 border border-white/[0.06] bg-white/[0.01] px-2.5 py-2 transition-colors focus-within:border-[var(--signal)]/40 focus-within:bg-[var(--signal)]/5 rounded">
          <button onClick={submit} disabled={composing} className="text-[var(--signal)] hover:text-white transition-colors">
            {composing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" strokeWidth={2} />}
          </button>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }} placeholder="Ask the mentor for a nudge..." className="flex-1 bg-transparent font-sans text-[12.5px] tracking-tight text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
          <span className="flex items-center gap-0.5 border border-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 rounded">
            <span>↵</span>
          </span>
        </div>
      </div>
    </aside>;
}

function Turn({ turn, index, onCite }) {
  const isYou = turn.role === "you";
  return <div className="stagger-in" style={{
    animationDelay: `${Math.min(index, 4) * 60}ms`
  }} onMouseEnter={() => turn.cite && onCite(turn.cite)} onMouseLeave={() => turn.cite && onCite([])}>
      <div className={`mb-1.5 flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] ${isYou ? "text-zinc-600" : "text-[var(--signal)]/70"}`}>
        <span>{isYou ? "YOU" : "MENTOR"}</span>
        <span className="h-px w-6 bg-white/[0.06]" />
      </div>
      <div className={isYou ? "border-l border-white/[0.08] pl-3 font-sans text-[13px] leading-relaxed text-zinc-400" : "font-sans text-[13.5px] leading-[1.55] text-zinc-200"}>
        {turn.text}
      </div>

      {turn.cite && turn.cite.length > 0 && <button onClick={() => onCite(turn.cite)} className="ease-signature mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-zinc-600 transition-colors hover:text-[var(--signal)]">
          <span className="h-1 w-1 rounded-full bg-[var(--signal)] animate-pulse" />
          <span>CITES LINE {turn.cite[0]}</span>
        </button>}
    </div>;
}

function ComposingIndicator() {
  return <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-600">
      <span>MENTOR</span>
      <span className="h-px w-6 bg-white/[0.06]" />
      <span className="flex items-center gap-1">
        <Dot delay="0ms" />
        <Dot delay="120ms" />
        <Dot delay="240ms" />
      </span>
    </div>;
}

function Dot({ delay }) {
  return <span className="tick-shimmer inline-block h-1 w-1 rounded-full bg-[var(--signal)]" style={{
    animationDelay: delay
  }} />;
}

function LighthouseToggle({ value, onChange }) {
  return <button onClick={() => onChange(!value)} className="ease-signature press group flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-200" aria-pressed={value}>
      <Lightbulb className={`h-3 w-3 transition-colors ${value ? "text-[var(--signal)]" : "text-zinc-600"}`} strokeWidth={1.5} />
      <span className={value ? "text-zinc-200 font-bold" : ""}>LIGHTHOUSE</span>
      <span className={`relative inline-block h-3 w-6 rounded-[2px] transition-colors duration-300 ${value ? "bg-[var(--signal)]/80" : "bg-white/[0.06]"}`}>
        <span className={`absolute top-[1px] h-[10px] w-[10px] rounded-[1px] bg-zinc-50 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${value ? "left-[13px]" : "left-[1px]"}`} />
      </span>
    </button>;
}

function MasteryDelta({ result }) {
  // Only show this when a valid submission has happened
  if (!result || !result.submission || result.customInputRun) {
     return null;
  }

  const newMastery = result.newMastery || 0;
  const xpAwarded = result.xpEarned || 0;
  
  return <div className="shrink-0 border-t border-white/[0.04] px-3 py-2 bg-gradient-to-t from-[var(--signal)]/10 to-transparent">
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-zinc-300">
        <span>SESSION MASTERY Δ</span>
        <span className="text-[var(--signal)] font-bold">+{xpAwarded} XP</span>
      </div>
      <div className="mt-1.5 grid grid-cols-1 gap-1.5">
        <div className="space-y-1">
          <div className="h-[2px] w-full bg-white/[0.1]">
            <div className="h-full bg-[var(--signal)] transition-[width] duration-700" style={{
            width: `${Math.min(100, newMastery * 100)}%`
          }} />
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] tracking-widest text-zinc-400">
            <span className="uppercase">OVERALL MASTERY</span>
            <span className="tabular-nums text-white">{(newMastery * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>;
}