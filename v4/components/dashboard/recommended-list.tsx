import Link from "next/link"
import { recommended } from "@/lib/app-data"
import { ArrowUpRight, Target } from "lucide-react"

export function RecommendedList() {
  return (
    <section className="border-b border-white/[0.04] px-12 py-14">
      {/* Section header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="mb-2 font-mono text-[10px] tracking-[0.28em] text-zinc-500">
            04 · RECOMMENDED · FOR YOU
          </div>
          <h2 className="font-sans text-[36px] font-medium leading-[0.95] tracking-tight-editorial text-zinc-100 text-balance">
            Next problems,{" "}
            <span className="text-[var(--signal)]">ranked by BKT gap</span>.
          </h2>
          <p className="mt-3 max-w-xl font-sans text-[13.5px] leading-relaxed text-zinc-500 text-pretty">
            Selected where your Bayesian mastery trails cohort median by at least{" "}
            <span className="text-zinc-300">0.15</span>. Solve to close the gap fastest.
          </p>
        </div>
        <Link
          href="/workspace"
          className="press ease-signature group flex items-center gap-2 border border-white/[0.08] px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-zinc-300 transition-colors hover:border-[var(--signal)]/60 hover:text-[var(--signal)]"
        >
          <span>OPEN WORKSPACE</span>
          <ArrowUpRight
            className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </Link>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[80px_1fr_220px_120px_120px_60px] items-center gap-6 border-y border-white/[0.06] py-3 font-mono text-[9px] tracking-[0.28em] text-zinc-600">
        <span>ID</span>
        <span>PROBLEM</span>
        <span>PATTERN</span>
        <span>ACCURACY</span>
        <span className="text-right">XP · GAP</span>
        <span />
      </div>

      {/* Rows */}
      <ul>
        {recommended.map((p, i) => (
          <li
            key={p.id}
            className="ease-signature group grid grid-cols-[80px_1fr_220px_120px_120px_60px] items-center gap-6 border-b border-white/[0.04] py-5 transition-colors hover:bg-white/[0.015]"
          >
            <span className="font-mono text-[11px] tabular-nums text-zinc-500">
              {p.id}
            </span>

            <div className="flex items-center gap-3 min-w-0">
              <DiffDot difficulty={p.difficulty} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-sans text-[15px] font-medium text-zinc-100">
                    {p.title}
                  </span>
                  {i === 0 && (
                    <span className="inline-flex items-center gap-1 border border-[var(--signal)]/40 px-1.5 py-[1px] font-mono text-[8px] tracking-[0.2em] text-[var(--signal)]">
                      <Target className="h-2 w-2" strokeWidth={1.5} />
                      TOP PICK
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 font-mono text-[9px] tracking-widest text-zinc-600">
                  <span>
                    {p.difficulty.toUpperCase()} · {p.tags.join(" · ")}
                  </span>
                </div>
              </div>
            </div>

            <span className="truncate font-mono text-[10px] tracking-[0.2em] text-zinc-400">
              {p.pattern}
            </span>

            <div className="flex items-center gap-2">
              <div className="h-[2px] w-16 bg-white/[0.05]">
                <div
                  className="h-full bg-zinc-400"
                  style={{ width: `${p.accuracy}%` }}
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                {p.accuracy}%
              </span>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <span className="font-sans text-[15px] font-medium tabular-nums text-zinc-100">
                +{p.xp}
              </span>
              <span className="font-mono text-[9px] tracking-widest text-[var(--signal)]/80">
                Δ {p.bktGap.toFixed(2)}
              </span>
            </div>

            <Link
              href="/workspace"
              className="press ease-signature flex h-7 w-7 items-center justify-center border border-white/[0.06] text-zinc-500 transition-colors group-hover:border-[var(--signal)]/60 group-hover:text-[var(--signal)]"
              aria-label={`Solve ${p.title}`}
            >
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DiffDot({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const color =
    difficulty === "Easy"
      ? "bg-[var(--signal)]"
      : difficulty === "Medium"
        ? "bg-amber-500"
        : "bg-rose-500"
  return (
    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center border border-white/[0.08]">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  )
}
