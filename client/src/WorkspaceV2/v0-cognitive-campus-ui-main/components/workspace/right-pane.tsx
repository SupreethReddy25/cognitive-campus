"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { mentorSeed, type MentorTurn } from "@/lib/problem-data"
import { ArrowRight, Command, Lightbulb, Sparkles } from "lucide-react"

export function RightPane({
  lighthouse,
  onLighthouseChange,
  onCite,
}: {
  lighthouse: boolean
  onLighthouseChange: (b: boolean) => void
  onCite: (lines: number[]) => void
}) {
  const [turns, setTurns] = useState<MentorTurn[]>(mentorSeed)
  const [draft, setDraft] = useState("")
  const [composing, setComposing] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [turns.length, composing])

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    setTurns((ts) => [...ts, { role: "you", text }])
    setDraft("")
    setComposing(true)
    window.setTimeout(() => {
      setTurns((ts) => [
        ...ts,
        {
          role: "mentor",
          text:
            "Walk me through the invariant you would hold. What is true just before line 18 runs, and what must remain true just after?",
          cite: [15, 16, 18],
        },
      ])
      setComposing(false)
    }, 900)
  }

  return (
    <aside className="relative flex min-h-0 flex-col border-l border-white/[0.04]">
      <span className="vlabel pointer-events-none absolute right-1 top-4 font-mono text-[9px] text-zinc-700">
        MENTOR · 04
      </span>

      {/* Header + Lighthouse toggle */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.04] pl-6 pr-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-500">
            SOCRATIC · MENTOR
          </span>
        </div>
        <LighthouseToggle value={lighthouse} onChange={onLighthouseChange} />
      </div>

      {/* Conversation body */}
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
        <div className="space-y-6 px-6 py-5">
          {turns.map((t, i) => (
            <Turn key={i} turn={t} index={i} onCite={onCite} />
          ))}
          {composing && <ComposingIndicator />}
        </div>
      </div>

      <MasteryDelta />

      {/* Composer */}
      <div className="shrink-0 border-t border-white/[0.04] px-3 py-2.5">
        <div className="ease-signature flex items-center gap-2 border border-white/[0.06] bg-white/[0.01] px-2.5 py-2 transition-colors focus-within:border-white/[0.14] focus-within:bg-white/[0.02]">
          <ArrowRight className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.5} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask the mentor…"
            className="flex-1 bg-transparent font-sans text-[12.5px] tracking-tight text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
          <span className="flex items-center gap-0.5 border border-white/[0.06] px-1 py-0 font-mono text-[9px] text-zinc-600">
            <Command className="h-2 w-2" strokeWidth={1.5} />
            <span>K</span>
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 font-mono text-[9px] tracking-[0.2em] text-zinc-700">
          <span>SOCRATIC PROTOCOL · v2</span>
          <span>↵ SEND</span>
        </div>
      </div>
    </aside>
  )
}

/* ──────────────────────────────────────────── */

function Turn({
  turn,
  index,
  onCite,
}: {
  turn: MentorTurn
  index: number
  onCite: (lines: number[]) => void
}) {
  const isYou = turn.role === "you"
  return (
    <div
      className="stagger-in"
      style={{ animationDelay: `${Math.min(index, 4) * 60}ms` }}
      onMouseEnter={() => turn.cite && onCite(turn.cite)}
      onMouseLeave={() => turn.cite && onCite([])}
    >
      <div
        className={`mb-1.5 flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] ${
          isYou ? "text-zinc-600" : "text-[var(--signal)]/70"
        }`}
      >
        <span>{isYou ? "YOU" : "MENTOR"}</span>
        <span className="h-px w-6 bg-white/[0.06]" />
        <span className="text-zinc-700">
          {isYou ? "0." + (index + 2) : "0." + (index + 1)}
        </span>
      </div>
      <div
        className={
          isYou
            ? "border-l border-white/[0.08] pl-3 font-sans text-[13px] leading-relaxed text-zinc-300"
            : "font-sans text-[13.5px] leading-[1.55] text-zinc-200"
        }
      >
        {turn.text}
      </div>

      {turn.cite && turn.cite.length > 0 && (
        <button
          onClick={() => onCite(turn.cite!)}
          className="ease-signature mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-zinc-600 transition-colors hover:text-[var(--signal)]"
        >
          <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
          <span>CITES LINES {turn.cite.join(" · ")}</span>
        </button>
      )}
    </div>
  )
}

function ComposingIndicator() {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-600">
      <span>MENTOR</span>
      <span className="h-px w-6 bg-white/[0.06]" />
      <span className="flex items-center gap-1">
        <Dot delay="0ms" />
        <Dot delay="120ms" />
        <Dot delay="240ms" />
      </span>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="tick-shimmer inline-block h-1 w-1 rounded-full bg-zinc-500"
      style={{ animationDelay: delay }}
    />
  )
}

function LighthouseToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (b: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="ease-signature press group flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-200"
      aria-pressed={value}
    >
      <Lightbulb
        className={`h-3 w-3 transition-colors ${value ? "text-[var(--signal)]" : "text-zinc-600"}`}
        strokeWidth={1.5}
      />
      <span className={value ? "text-zinc-200" : ""}>LIGHTHOUSE</span>
      <span
        className={`relative inline-block h-3 w-6 rounded-[2px] transition-colors duration-300 ${
          value ? "bg-[var(--signal)]/80" : "bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-[1px] h-[10px] w-[10px] rounded-[1px] bg-zinc-50 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            value ? "left-[13px]" : "left-[1px]"
          }`}
        />
      </span>
    </button>
  )
}

function MasteryDelta() {
  const delta = useMemo(() => ({ graph: 0.08, dag: 0.04, kahn: 0.11 }), [])
  return (
    <div className="shrink-0 border-t border-white/[0.04] px-3 py-2">
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-zinc-600">
        <span>SESSION MASTERY Δ</span>
        <span className="text-[var(--signal)]">+0.23</span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {Object.entries(delta).map(([k, v]) => (
          <div key={k} className="space-y-1">
            <div className="h-[2px] w-full bg-white/[0.05]">
              <div
                className="h-full bg-[var(--signal)]/80 transition-[width] duration-700"
                style={{ width: `${Math.min(100, v * 400)}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[9px] tracking-widest text-zinc-600">
              <span className="uppercase">{k}</span>
              <span className="tabular-nums text-zinc-400">+{v.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
