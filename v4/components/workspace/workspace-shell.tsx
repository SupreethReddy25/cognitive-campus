"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TopBar } from "./top-bar"
import { LeftPane } from "./left-pane"
import { CenterPane } from "./center-pane"
import { RightPane } from "./right-pane"
import { TestTiles } from "./test-tiles"
import { codeLines, testCases } from "@/lib/problem-data"

export type TestStatus = "idle" | "running" | "pass" | "fail"
export type TestResult = {
  id: string
  status: TestStatus
  runtimeMs?: number
  memoryKb?: number
  got?: string
}

const COLLAPSED_WIDTH = 44
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 320
const MAX_WIDTH = 560

export function WorkspaceShell() {
  const [lighthouse, setLighthouse] = useState(true)
  const [citedLines, setCitedLines] = useState<number[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  // ── Mentor sidebar: collapse + resize ─────────────
  const [mentorOpen, setMentorOpen] = useState(false)
  const [mentorWidth, setMentorWidth] = useState(DEFAULT_WIDTH)
  const [dragging, setDragging] = useState(false)
  const dragStateRef = useRef<{ startX: number; startW: number } | null>(null)

  // Suppress transition during drag so motion stays tight
  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!mentorOpen) return
      e.preventDefault()
      dragStateRef.current = { startX: e.clientX, startW: mentorWidth }
      setDragging(true)
    },
    [mentorOpen, mentorWidth],
  )

  useEffect(() => {
    if (!dragging) return
    const onMove = (ev: MouseEvent) => {
      const s = dragStateRef.current
      if (!s) return
      const delta = s.startX - ev.clientX
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, s.startW + delta))
      setMentorWidth(next)
    }
    const onUp = () => {
      setDragging(false)
      dragStateRef.current = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging])

  // ── Session timer ─────────────────────────────────
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Test run orchestration ────────────────────────
  const [results, setResults] = useState<Record<string, TestResult>>(
    () =>
      Object.fromEntries(
        testCases.map((t) => [t.id, { id: t.id, status: "idle" as TestStatus }]),
      ),
  )
  const [running, setRunning] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string>(testCases[0].id)
  const timers = useRef<number[]>([])

  const runAll = useCallback(() => {
    if (running) return
    setRunning(true)
    setResults((prev) => {
      const next = { ...prev }
      for (const t of testCases) next[t.id] = { id: t.id, status: "running" }
      return next
    })
    timers.current.forEach(clearTimeout)
    timers.current = []
    testCases.forEach((tc, i) => {
      const t = window.setTimeout(() => {
        setResults((prev) => {
          const runtimeMs = 12 + i * 6 + ((i * 37) % 11)
          const memoryKb = 41800 + i * 120
          return {
            ...prev,
            [tc.id]: {
              id: tc.id,
              status: "pass",
              runtimeMs,
              memoryKb,
              got: tc.expected,
            },
          }
        })
        if (i === testCases.length - 1) setRunning(false)
      }, 320 + i * 220)
      timers.current.push(t)
    })
  }, [running])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const lighthouseLines = useMemo(
    () => (lighthouse ? codeLines.filter((l) => l.lighthouse).map((l) => l.n) : []),
    [lighthouse],
  )

  const highlightedLines = useMemo(() => {
    if (citedLines.length > 0) return citedLines
    return lighthouseLines
  }, [citedLines, lighthouseLines])

  const stats = useMemo(() => {
    const list = Object.values(results)
    const done = list.filter((r) => r.status === "pass" || r.status === "fail")
    const pass = list.filter((r) => r.status === "pass").length
    const totalRt = done.reduce((a, b) => a + (b.runtimeMs ?? 0), 0)
    const avgRt = done.length ? Math.round(totalRt / done.length) : 0
    return { pass, total: list.length, avgRt, done: done.length }
  }, [results])

  const rightColumn = mentorOpen ? mentorWidth : COLLAPSED_WIDTH

  return (
    <div
      className="grid h-full min-h-0 flex-1"
      style={{ gridTemplateRows: "44px 1fr 248px" }}
    >
      <TopBar elapsed={elapsed} stats={stats} />

      {/* 3-column body */}
      <div
        className={`grid min-h-0 border-t border-white/[0.04] ${
          dragging ? "" : "transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        }`}
        style={{ gridTemplateColumns: `360px 1fr ${rightColumn}px` }}
      >
        <LeftPane />
        <CenterPane
          highlightedLines={highlightedLines}
          lighthouseActive={lighthouse && citedLines.length === 0}
          activeLine={activeLine}
          onLineHover={setActiveLine}
          onRun={runAll}
          running={running}
        />
        <RightPane
          lighthouse={lighthouse}
          onLighthouseChange={setLighthouse}
          onCite={setCitedLines}
          open={mentorOpen}
          onOpenChange={setMentorOpen}
          onResizeStart={startDrag}
          dragging={dragging}
        />
      </div>

      <TestTiles
        running={running}
        results={results}
        onRun={runAll}
        selected={selectedTest}
        onSelect={setSelectedTest}
        stats={stats}
      />

      {/* Global cursor override while dragging */}
      {dragging && (
        <style jsx global>{`
          body,
          * {
            cursor: col-resize !important;
            user-select: none !important;
          }
        `}</style>
      )}
    </div>
  )
}
