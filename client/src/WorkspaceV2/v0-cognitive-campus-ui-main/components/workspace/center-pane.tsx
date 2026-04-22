"use client"

import { useState } from "react"
import { codeLines } from "@/lib/problem-data"
import {
  ChevronDown,
  Command,
  Eraser,
  Play,
  RotateCcw,
  Send,
  Wand2,
  Check,
} from "lucide-react"

const LANGS = ["TypeScript", "Python", "Go", "Rust", "C++"] as const
type Lang = (typeof LANGS)[number]

export function CenterPane({
  highlightedLines,
  lighthouseActive,
  activeLine,
  onLineHover,
  onRun,
  running,
}: {
  highlightedLines: number[]
  lighthouseActive: boolean
  activeLine: number | null
  onLineHover: (n: number | null) => void
  onRun: () => void
  running: boolean
}) {
  const [lang, setLang] = useState<Lang>("TypeScript")
  const [openLang, setOpenLang] = useState(false)

  const highlightSet = new Set(highlightedLines)

  return (
    <section className="relative flex min-h-0 flex-col">
      {/* Editor file tab strip */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.04] px-3">
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <div className="press flex h-7 items-center gap-2 border-r border-white/[0.06] bg-white/[0.015] px-3 text-zinc-300">
            <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
            <span>solution.ts</span>
            <span className="ml-1 text-zinc-700">●</span>
          </div>
          <button className="press ease-signature flex h-7 items-center gap-1 px-3 text-zinc-600 transition-colors hover:text-zinc-400">
            <span>+</span>
            <span className="text-[10px] tracking-widest">NEW</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-zinc-600">
          <LangSelector lang={lang} onSelect={setLang} open={openLang} setOpen={setOpenLang} />
          <span className="h-3 w-px bg-white/[0.06]" />
          <span>UTF-8</span>
          <span className="text-zinc-800">·</span>
          <span>LF</span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <span className="border border-white/[0.06] px-1.5 py-0.5">VIM</span>
        </div>
      </div>

      {/* Vertical section label */}
      <span className="vlabel pointer-events-none absolute right-1 top-14 z-[1] font-mono text-[9px] text-zinc-700">
        MONACO · STAGE
      </span>

      {/* Monaco stage */}
      <div
        className="relative min-h-0 flex-1 overflow-auto scrollbar-surgical"
        onMouseLeave={() => onLineHover(null)}
      >
        <div className="pointer-events-none absolute inset-0 grid-micro-fine opacity-60" />

        <div className="relative font-mono text-[12.5px] leading-[1.7]">
          {codeLines.map((line) => {
            const isHl = highlightSet.has(line.n)
            const isActive = activeLine === line.n
            return (
              <div
                key={line.n}
                onMouseEnter={() => onLineHover(line.n)}
                className={`group relative grid grid-cols-[56px_1fr] items-start transition-colors duration-200 ${
                  isHl ? "lighthouse-line" : ""
                } ${isActive ? "bg-white/[0.015]" : ""}`}
              >
                <span
                  className={`select-none pr-4 pt-[1px] text-right tabular-nums ${
                    isActive
                      ? "text-zinc-400"
                      : isHl
                        ? "text-[var(--signal)]/80"
                        : "text-zinc-700"
                  }`}
                >
                  {line.n}
                </span>
                <span className="whitespace-pre pr-8">
                  {line.tokens.map((tok, i) => (
                    <span key={i} className={tok.c}>
                      {tok.t}
                    </span>
                  ))}
                  {isActive && (
                    <span className="caret-blink ml-[1px] inline-block h-[14px] w-[1.5px] translate-y-[2px] bg-zinc-300 align-middle" />
                  )}
                </span>

                {isHl && (
                  <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[9px] tracking-widest text-[var(--signal)]/70">
                    ◂ PIVOT
                  </span>
                )}
              </div>
            )
          })}

          <div className="h-24" />
        </div>

        {lighthouseActive && highlightedLines.length > 0 && (
          <div className="pointer-events-none absolute right-8 top-4 z-[2] border border-[var(--signal)]/30 bg-[var(--signal)]/5 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-[var(--signal)] backdrop-blur-sm">
            LIGHTHOUSE · {highlightedLines.length} PIVOTS
          </div>
        )}
      </div>

      {/* Floating glass action bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] flex justify-center">
        <div className="pointer-events-auto ring-hair flex items-center gap-1 border border-white/[0.08] bg-[#0a0a0a]/80 p-1 backdrop-blur-md">
          <GhostBtn label="Format">
            <Wand2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Format
          </GhostBtn>
          <GhostBtn label="Clear">
            <Eraser className="h-3.5 w-3.5" strokeWidth={1.5} /> Clear
          </GhostBtn>
          <GhostBtn label="Reset">
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset
          </GhostBtn>
          <span className="mx-1 h-5 w-px bg-white/[0.08]" />
          <button
            onClick={onRun}
            disabled={running}
            className={`press ease-signature flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] tracking-widest transition-colors duration-300 ${
              running ? "text-zinc-600" : "text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            {running ? (
              <span className="flex h-3 w-3 items-center justify-center">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--signal)]" />
              </span>
            ) : (
              <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            <span>RUN</span>
            <span className="flex items-center gap-0.5 border border-white/[0.08] px-1 py-0 text-[9px] text-zinc-600">
              <Command className="h-2 w-2" strokeWidth={1.5} />
              <span>↵</span>
            </span>
          </button>
          <button className="press ease-signature flex items-center gap-2 bg-[var(--signal)]/90 px-4 py-1.5 font-mono text-[11px] tracking-widest text-[#0a1410] transition-colors duration-300 hover:bg-[var(--signal)]">
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
            <span>SUBMIT</span>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────── */

function LangSelector({
  lang,
  onSelect,
  open,
  setOpen,
}: {
  lang: Lang
  onSelect: (l: Lang) => void
  open: boolean
  setOpen: (b: boolean) => void
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="press ease-signature flex items-center gap-1.5 border border-white/[0.06] bg-white/[0.01] px-2 py-0.5 text-zinc-400 transition-colors hover:border-white/[0.1] hover:text-zinc-200"
      >
        <span>{lang.toUpperCase()}</span>
        <ChevronDown className="h-2.5 w-2.5" strokeWidth={1.5} />
      </button>
      {open && (
        <div className="fade-in-up absolute right-0 top-full z-10 mt-1 w-44 border border-white/[0.08] bg-[#0c0c0c] p-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => {
                onSelect(l)
                setOpen(false)
              }}
              className="ease-signature flex w-full items-center justify-between px-2 py-1.5 font-mono text-[11px] tracking-widest text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-zinc-100"
            >
              <span>{l.toUpperCase()}</span>
              {l === lang && <Check className="h-3 w-3 text-[var(--signal)]" strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GhostBtn({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      aria-label={label}
      className="press ease-signature flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] tracking-widest text-zinc-500 transition-colors duration-300 hover:bg-white/[0.03] hover:text-zinc-200"
    >
      {children}
    </button>
  )
}
