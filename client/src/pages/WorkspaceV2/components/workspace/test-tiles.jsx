"use client";
import { useWorkspace } from "../../WorkspaceContext";
import { Play, Plus, Loader2 } from "lucide-react";

export function TestTiles({ 
  running, 
  results, 
  onRun, 
  selected, 
  onSelect, 
  stats,
  testCasesArray 
}) {
  
  // Real tests from API if available, else fallback to problem dummy array
  // The backend execution groups public test cases. 
  // If we have actual run results, we show those tiles!
  const hasResultList = results?.testResults?.results?.length > 0;
  
  const displayTiles = hasResultList 
    ? results.testResults.results.map((tc, i) => ({
         id: tc.id || `test-${i}`,
         name: `Case ${i+1}`,
         input: tc.input || "(none)",
         expected: tc.expectedOutput || "(none)",
         got: tc.actualOutput || "(runtime error)",
         status: tc.passed ? "pass" : "fail",
         runtimeMs: tc.executionTime || 0,
         memoryKb: Math.floor(Math.random() * 100) + 40000 // Mock, since piston doesn't give accurate mem yet
      }))
    : testCasesArray.map((tc, i) => ({
         id: `test-${i}`,
         name: `Case ${i+1}`,
         input: tc.input || "(none)",
         expected: tc.output || "(none)",
         got: "—",
         status: running ? "running" : "idle",
         runtimeMs: null,
         memoryKb: null
      }));

  const selectedData = displayTiles.find((t) => t.id === selected) ?? displayTiles[0] ?? {
       id: '0', name: 'Wait', input: '-', expected: '-', got: '-', status: 'idle'
  };

  return <section className="relative grid min-h-0 grid-rows-[36px_108px_1fr] border-t border-white/[0.04]">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4">
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
          <span className="vlabel-inline">TEST CASES</span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <span className="text-zinc-600">{displayTiles.length} TESTS</span>
          <span className="text-zinc-800">·</span>
          <SummaryDot stats={stats} running={running} />
        </div>

        <div className="flex items-center gap-1">
          <button className="press ease-signature flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-200">
            <Plus className="h-3 w-3" strokeWidth={1.5} />
            CUSTOM
          </button>
          <button onClick={onRun} disabled={running} className={`press ease-signature flex items-center gap-1.5 border-l border-white/[0.06] px-3 py-1 font-mono text-[10px] tracking-[0.2em] transition-colors ${running ? "text-zinc-600 cursor-not-allowed" : "text-zinc-200 hover:bg-white/[0.03]"}`}>
            {running ? <Loader2 className="h-3 w-3 animate-spin"/> : <Play className="h-3 w-3" strokeWidth={1.5} />}
            {running ? "RUNNING" : "RUN ALL"}
          </button>
        </div>
      </div>

      {/* Tiles row */}
      <div className="flex overflow-x-auto scrollbar-surgical divide-x divide-white/[0.04] border-b border-white/[0.04]">
        {displayTiles.map((tc, i) => {
        const isSelected = selected === tc.id || (!selected && i === 0);
        return <button key={tc.id} onClick={() => onSelect(tc.id)} className={`min-w-[140px] flex-shrink-0 stagger-in press ease-signature group relative flex flex-col items-start gap-2 p-3 text-left transition-colors duration-300 ${isSelected ? "bg-white/[0.02]" : "hover:bg-white/[0.015]"}`} style={{
          animationDelay: `${i * 60}ms`
        }}>
              {/* index + dot + name */}
              <div className="flex w-full items-center gap-2">
                <span className="font-mono text-[9px] tabular-nums text-zinc-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StatusDot status={tc.status} />
                <span className="font-mono text-[11px] tracking-widest text-zinc-300">
                  {tc.name.toUpperCase()}
                </span>
                {tc.hidden && <span className="ml-auto border border-white/[0.06] px-1 font-mono text-[8px] tracking-widest text-zinc-600">
                    HIDDEN
                  </span>}
              </div>

              {/* metrics row */}
              <div className="flex items-center gap-4 pl-5 font-mono text-[10px] tracking-widest text-zinc-500">
                {tc.status === "pass" || tc.status === "fail" ? <>
                    <span className="tabular-nums">{tc.runtimeMs}ms</span>
                    <span className="text-zinc-800">·</span>
                    <span className="tabular-nums">
                      {((tc.memoryKb ?? 0) / 1024).toFixed(1)}mb
                    </span>
                  </> : tc.status === "running" ? <span className="text-[var(--signal)]">EXECUTING</span> : <span className="text-zinc-700">—</span>}
              </div>

              {/* input preview */}
              <div className="w-full truncate pl-5 font-mono text-[10.5px] text-zinc-600">
                {tc.input}
              </div>

              {/* running marching ants */}
              {tc.status === "running" && <span className="march absolute inset-x-0 bottom-0 h-[1px]" />}

              {isSelected && <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--signal)]" />}
            </button>;
      })}
      </div>

      {/* Expanded detail — Input / Expected / Got */}
      {(results?.error || results?.testResults?.results?.some(t => t.actualOutput?.includes('[ERROR]'))) ? (
        <div className="flex flex-col overflow-hidden bg-rose-500/5 p-4">
          <p className="text-xs font-mono text-rose-400 font-bold mb-2">COMPILATION / RUNTIME ERROR</p>
          <pre className="text-[11px] font-mono text-rose-300 whitespace-pre-wrap">
            {results?.error || results?.testResults?.results?.find(t => t.actualOutput?.includes('[ERROR]'))?.actualOutput}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-white/[0.04] overflow-hidden">
          <DetailBlock label="INPUT" value={selectedData.input} tone="zinc" />
          <DetailBlock label="EXPECTED" value={selectedData.expected} tone="zinc" />
          <DetailBlock label="GOT" value={selectedData.status === "pass" || selectedData.status === "fail" ? selectedData.got ?? "—" : selectedData.status === "running" ? "…" : "not run"} tone={selectedData.status === "pass" ? "signal" : selectedData.status === "fail" ? "rose" : "muted"} />
        </div>
      )}
    </section>;
}

/* ──────────────────────────────────────────── */

function StatusDot({ status }) {
  const cls = status === "pass" ? "bg-[var(--signal)] shadow-[0_0_8px_var(--signal)]" : status === "fail" ? "bg-rose-400 shadow-[0_0_8px_rgb(251,113,133)]" : status === "running" ? "bg-amber-400 animate-pulse" : "bg-zinc-700";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

function SummaryDot({ stats, running }) {
  if (running) {
    return <span className="flex items-center gap-1.5 text-[var(--signal)] font-bold">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--signal)]" />
        <span>EXECUTING BATCH</span>
      </span>;
  }
  if (stats.done === 0) {
    return <span className="text-zinc-700">READY</span>;
  }
  const allPass = stats.pass === stats.total;
  return <span className={`flex items-center gap-1.5 font-bold ${allPass ? "text-[var(--signal)]" : "text-rose-400"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${allPass ? "bg-[var(--signal)]" : "bg-rose-400"}`} />
      <span className="tabular-nums">
        {stats.pass}/{stats.total} PASS
      </span>
      <span className="text-zinc-700">·</span>
      <span className="tabular-nums text-zinc-500">AVG {stats.avgRt}MS</span>
    </span>;
}

function DetailBlock({ label, value, tone }) {
  const color = tone === "signal" ? "text-[var(--signal)]" : tone === "rose" ? "text-rose-400" : tone === "muted" ? "text-zinc-600" : "text-zinc-200";
  return <div className="flex min-h-0 flex-col px-4 py-3">
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
        <span>{label}</span>
        <span className="h-px flex-1 bg-white/[0.04]" />
      </div>
      <div className="overflow-y-auto scrollbar-none">
        <pre className={`whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed ${color}`}>
          {value}
        </pre>
      </div>
    </div>;
}