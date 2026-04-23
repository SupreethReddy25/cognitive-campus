"use client";

import { testCases } from "@/lib/problem-data";
import { Play, Plus } from "lucide-react";
export function TestTiles({
  running,
  results,
  onRun,
  selected,
  onSelect,
  stats
}) {
  const selectedCase = testCases.find(t => t.id === selected) ?? testCases[0];
  const selectedResult = results[selected];
  return <section className="relative grid min-h-0 grid-rows-[36px_108px_1fr] border-t border-white/[0.04]">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4">
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
          <span className="vlabel-inline">TEST CASES</span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <span className="text-zinc-600">{testCases.length} TESTS</span>
          <span className="text-zinc-800">·</span>
          <SummaryDot stats={stats} running={running} />
        </div>

        <div className="flex items-center gap-1">
          <button className="press ease-signature flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-200">
            <Plus className="h-3 w-3" strokeWidth={1.5} />
            CUSTOM
          </button>
          <button onClick={onRun} disabled={running} className={`press ease-signature flex items-center gap-1.5 border-l border-white/[0.06] px-3 py-1 font-mono text-[10px] tracking-[0.2em] transition-colors ${running ? "text-zinc-600" : "text-zinc-200 hover:bg-white/[0.03]"}`}>
            <Play className="h-3 w-3" strokeWidth={1.5} />
            {running ? "RUNNING" : "RUN ALL"}
          </button>
        </div>
      </div>

      {/* Tiles row */}
      <div className="grid grid-cols-5 divide-x divide-white/[0.04] border-b border-white/[0.04]">
        {testCases.map((tc, i) => {
        const r = results[tc.id];
        const isSelected = selected === tc.id;
        return <button key={tc.id} onClick={() => onSelect(tc.id)} className={`stagger-in press ease-signature group relative flex flex-col items-start gap-2 p-3 text-left transition-colors duration-300 ${isSelected ? "bg-white/[0.02]" : "hover:bg-white/[0.015]"}`} style={{
          animationDelay: `${i * 60}ms`
        }}>
              {/* index + dot + name */}
              <div className="flex w-full items-center gap-2">
                <span className="font-mono text-[9px] tabular-nums text-zinc-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StatusDot status={r?.status ?? "idle"} />
                <span className="font-mono text-[11px] tracking-widest text-zinc-300">
                  {tc.name.toUpperCase()}
                </span>
                {tc.hidden && <span className="ml-auto border border-white/[0.06] px-1 font-mono text-[8px] tracking-widest text-zinc-600">
                    HIDDEN
                  </span>}
              </div>

              {/* metrics row */}
              <div className="flex items-center gap-4 pl-5 font-mono text-[10px] tracking-widest text-zinc-500">
                {r?.status === "pass" || r?.status === "fail" ? <>
                    <span className="tabular-nums">{r.runtimeMs}ms</span>
                    <span className="text-zinc-800">·</span>
                    <span className="tabular-nums">
                      {((r.memoryKb ?? 0) / 1024).toFixed(1)}mb
                    </span>
                  </> : r?.status === "running" ? <span className="text-[var(--signal)]">EXECUTING</span> : <span className="text-zinc-700">—</span>}
              </div>

              {/* input preview */}
              <div className="w-full truncate pl-5 font-mono text-[10.5px] text-zinc-600">
                {tc.input}
              </div>

              {/* running marching ants */}
              {r?.status === "running" && <span className="march absolute inset-x-0 bottom-0 h-[1px]" />}

              {isSelected && <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />}
            </button>;
      })}
      </div>

      {/* Expanded detail — Input / Expected / Got */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.04] overflow-hidden">
        <DetailBlock label="INPUT" value={selectedCase.input} tone="zinc" />
        <DetailBlock label="EXPECTED" value={selectedCase.expected} tone="zinc" />
        <DetailBlock label="GOT" value={selectedResult?.status === "pass" || selectedResult?.status === "fail" ? selectedResult.got ?? "—" : selectedResult?.status === "running" ? "…" : "not run"} tone={selectedResult?.status === "pass" ? "signal" : selectedResult?.status === "fail" ? "rose" : "muted"} />
      </div>
    </section>;
}

/* ──────────────────────────────────────────── */

function StatusDot({
  status
}) {
  const cls = status === "pass" ? "bg-[var(--signal)] shadow-[0_0_8px_var(--signal)]" : status === "fail" ? "bg-rose-400 shadow-[0_0_8px_rgb(251,113,133)]" : status === "running" ? "bg-amber-400 animate-pulse" : "bg-zinc-700";
  return <span className={`inline-block h-1 w-1 rounded-full ${cls}`} />;
}
function SummaryDot({
  stats,
  running
}) {
  if (running) {
    return <span className="flex items-center gap-1.5 text-[var(--signal)]">
        <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--signal)]" />
        <span>EXECUTING</span>
      </span>;
  }
  if (stats.done === 0) {
    return <span className="text-zinc-700">READY</span>;
  }
  const allPass = stats.pass === stats.total;
  return <span className={`flex items-center gap-1.5 ${allPass ? "text-[var(--signal)]" : "text-amber-400"}`}>
      <span className={`h-1 w-1 rounded-full ${allPass ? "bg-[var(--signal)]" : "bg-amber-400"}`} />
      <span className="tabular-nums">
        {stats.pass}/{stats.total} PASS
      </span>
      <span className="text-zinc-700">·</span>
      <span className="tabular-nums text-zinc-500">AVG {stats.avgRt}MS</span>
    </span>;
}
function DetailBlock({
  label,
  value,
  tone
}) {
  const color = tone === "signal" ? "text-[var(--signal)]" : tone === "rose" ? "text-rose-400" : tone === "muted" ? "text-zinc-600" : "text-zinc-200";
  return <div className="flex min-h-0 flex-col px-4 py-3">
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
        <span>{label}</span>
        <span className="h-px flex-1 bg-white/[0.04]" />
      </div>
      <pre className={`whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed ${color}`}>
        {value}
      </pre>
    </div>;
}