"use client";

import { problem } from "@/lib/problem-data";
import { ChevronRight, Command } from "lucide-react";
function formatHMS(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
export function TopBar({
  elapsed,
  stats
}) {
  const bkt = Math.round(problem.bktMastery * 100);
  return <header className="relative flex h-[44px] items-center justify-between px-4">
      {/* Left — breadcrumb + problem id + difficulty */}
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
        {problem.breadcrumb.map((seg, i) => <span key={seg} className="flex items-center gap-3">
            <span className={i === problem.breadcrumb.length - 1 ? "text-zinc-300" : "text-zinc-600"}>
              {seg}
            </span>
            {i < problem.breadcrumb.length - 1 && <ChevronRight className="h-3 w-3 text-zinc-800" strokeWidth={1.5} />}
          </span>)}

        <span className="mx-2 h-3 w-px bg-white/[0.06]" />

        <span className="text-[10px] text-zinc-600">{problem.id}</span>
        <DifficultyChip difficulty={problem.difficulty} />
      </div>

      {/* Center — BKT mastery bar */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3">
        <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-600">BKT</span>
        <div className="relative h-[3px] w-40 overflow-hidden bg-white/[0.05]">
          <div className="absolute inset-y-0 left-0 bg-[var(--signal)] transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{
          width: `${bkt}%`
        }} />
          {[25, 50, 75].map(t => <span key={t} className="absolute inset-y-0 w-px bg-white/[0.08]" style={{
          left: `${t}%`
        }} />)}
        </div>
        <span className="font-mono text-[10px] tabular-nums text-zinc-400">{bkt}%</span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-700">MASTERY</span>
      </div>

      {/* Right — run stats + timer + ⌘K + user */}
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider">
        <span className="text-zinc-600">
          <span className="tabular-nums text-zinc-300">
            {stats.pass}/{stats.total}
          </span>
          <span className="mx-1 text-zinc-700">·</span>
          <span className="tabular-nums text-zinc-500">
            {stats.avgRt || 0}
            <span className="text-zinc-700">ms</span>
          </span>
        </span>

        <span className="mx-1 h-3 w-px bg-white/[0.06]" />

        <div className="flex items-center gap-1.5">
          <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="tabular-nums text-zinc-400">{formatHMS(elapsed)}</span>
        </div>

        <span className="mx-1 h-3 w-px bg-white/[0.06]" />

        <button className="press ease-signature flex items-center gap-1.5 border border-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-500 transition-colors duration-300 hover:border-white/[0.1] hover:text-zinc-300">
          <Command className="h-2.5 w-2.5" strokeWidth={1.5} />
          <span>K</span>
        </button>

        <div className="press flex h-6 w-6 items-center justify-center border border-white/[0.08] bg-white/[0.02] font-mono text-[10px] text-zinc-300">
          SR
        </div>
      </div>
    </header>;
}
function DifficultyChip({
  difficulty
}) {
  const color = difficulty === "Easy" ? "bg-[var(--signal)]" : difficulty === "Medium" ? "bg-amber-500" : "bg-rose-500";
  return <span className="flex items-center gap-1.5">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-zinc-400">{difficulty.toUpperCase()}</span>
    </span>;
}