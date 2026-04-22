"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GridNav } from "./grid-nav"
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

export function WorkspaceShell() {
  // Lighthouse mode highlights "pivot" lines in the editor + cross-cites in mentor
  const [lighthouse, setLighthouse] = useState(true)
  // Citation lines from the currently hovered mentor turn
  const [citedLines, setCitedLines] = useState<number[]>([])
  // Editor focus
  const [activeLine, setActiveLine] = useState<number | null>(null)

  // Session timer — hydration-safe
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Test run orchestration
  const [results, setResults] = useState<Record<string, TestResult>>(
    () =>
      Object.fromEntries(testCases.map((t) => [t.id, { id: t.id, status: "idle" as TestStatus }])),
  )
  const [running, setRunning] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string>(testCases[0].id)
  const timers = useRef<number[]>([])

  const runAll = useCallback(() => {
    if (running) return
    setRunning(true)
    // reset all to running
    setResults((prev) => {
      const next = { ...prev }
      for (const t of testCases) next[t.id] = { id: t.id, status: "running" }
      return next
    })
    // stagger completions — deterministic for feel
    timers.current.forEach(clearTimeout)
    timers.current = []
    testCases.forEach((tc, i) => {
      const t = window.setTimeout(() => {
        setResults((prev) => {
          const pass = tc.name !== "cycle" ? true : true // cycle case also passes ([] === [])
          const runtimeMs = 12 + i * 6 + Math.floor((i * 37) % 11)
          const memoryKb = 41800 + i * 120
          return {
            ...prev,
            [tc.id]: {
              id: tc.id,
              status: pass ? "pass" : "fail",
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Master grid — 48px rail + content column */}
      <div
        className="grid h-screen"
        style={{ gridTemplateColumns: "48px 1fr" }}
      >
        <GridNav />

        {/* Content column — stacks top / main / bottom dock */}
        <div
          className="grid min-w-0"
          style={{ gridTemplateRows: "44px 1fr 248px" }}
        >
          <TopBar elapsed={elapsed} stats={stats} />

          {/* Main workspace — 3 columns */}
          <div
            className="grid min-h-0 border-t border-white/[0.04]"
            style={{ gridTemplateColumns: "380px 1fr 400px" }}
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
        </div>
      </div>
    </div>
  )
}
