import { user } from "@/lib/app-data"
import { MetricsRow } from "./metrics-row"
import { SkillsRadar } from "./skills-radar"
import { XpLine } from "./xp-line"
import { RecommendedList } from "./recommended-list"
import { DashboardHeader } from "./dashboard-header"

export function DashboardView() {
  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">
        {/* Sticky top toolbar */}
        <DashboardHeader />

        {/* Editorial hero */}
        <section className="relative border-b border-white/[0.04] px-12 pb-14 pt-12">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
              <span>01 / 05 · DASHBOARD</span>
              <span className="h-px w-8 bg-white/[0.08]" />
              <span className="text-zinc-500">{new Date().toISOString().slice(0, 10)}</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-zinc-600">
              SIG · 0xA1F3 / BKT v2.1
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="mb-2 font-mono text-[11px] tracking-[0.28em] text-zinc-500">
                WELCOME · BACK
              </div>
              <h1 className="font-sans text-[88px] font-medium leading-[0.92] tracking-tight-editorial text-zinc-50 text-balance">
                {user.name}
              </h1>
              <p className="mt-4 max-w-xl font-sans text-[14px] leading-relaxed text-zinc-400 text-pretty">
                You last held an invariant over a directed acyclic graph.
                Your Bayesian knowledge trace moved{" "}
                <span className="text-[var(--signal)]">+0.23</span> this week.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <MiniGauge label="TRACE" value={62} />
              <MiniGauge label="FOCUS" value={87} />
              <MiniGauge label="RATING" value={1842} raw />
            </div>
          </div>

          {/* Corner tick */}
          <span className="absolute right-12 top-12 h-3 w-3 border-r border-t border-white/[0.08]" />
          <span className="absolute bottom-14 left-12 h-3 w-3 border-b border-l border-white/[0.08]" />
        </section>

        {/* 4 metrics — single row divided by 1px hairlines */}
        <MetricsRow />

        {/* Charts row */}
        <section className="grid border-b border-white/[0.04] lg:grid-cols-[1fr_1fr]">
          <div className="border-r border-white/[0.04]">
            <SkillsRadar />
          </div>
          <div>
            <XpLine />
          </div>
        </section>

        {/* Recommended */}
        <RecommendedList />

        {/* Footer signature strip */}
        <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-12 py-5 font-mono text-[9px] tracking-[0.28em] text-zinc-700">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <div className="flex items-center gap-4">
            <span>REGION · IN-S1</span>
            <span>MODEL · BKT-v2.1</span>
            <span className="text-[var(--signal)]/70">OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniGauge({ label, value, raw = false }: { label: string; value: number; raw?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--signal)"
            strokeWidth="1.5"
            strokeDasharray={`${Math.min(100, raw ? 72 : value) * 1.005} 200`}
            strokeLinecap="square"
            opacity={0.85}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tabular-nums text-zinc-300">
          {raw ? value : `${value}`}
        </div>
      </div>
      <div className="font-mono text-[9px] tracking-[0.28em] text-zinc-600">{label}</div>
    </div>
  )
}
