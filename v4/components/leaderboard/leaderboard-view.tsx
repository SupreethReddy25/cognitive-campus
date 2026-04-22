"use client"

import { useMemo, useState } from "react"
import { leaderboard, type LeaderRow } from "@/lib/app-data"
import { Search, Globe, Flame } from "lucide-react"

const SCOPES = ["GLOBAL", "COUNTRY", "FRIENDS"] as const
const WINDOWS = ["24H", "7D", "30D", "ALL"] as const
type Scope = (typeof SCOPES)[number]
type Range = (typeof WINDOWS)[number]

export function LeaderboardView() {
  const [scope, setScope] = useState<Scope>("GLOBAL")
  const [range, setRange] = useState<Range>("30D")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return leaderboard
    return leaderboard.filter(
      (r) =>
        r.handle.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q),
    )
  }, [query])

  const you = leaderboard.find((r) => r.isYou)

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">
        {/* Top toolbar */}
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-12 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span className="text-zinc-200">LEADERBOARD</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <Globe className="h-3 w-3" strokeWidth={1.5} />
            <span>GLOBAL · {range}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-zinc-600">
            <span>{filtered.length.toLocaleString()} RANKED</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <span className="text-[var(--signal)]/80">LIVE · REFRESH 05:00</span>
          </div>
        </header>

        {/* Editorial hero */}
        <section className="border-b border-white/[0.04] px-12 pb-10 pt-10">
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span>04 / 05 · LEADERBOARD</span>
            <span className="h-px w-8 bg-white/[0.08]" />
            <span className="text-zinc-500">{new Date().toISOString().slice(0, 10)}</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-sans text-[64px] font-medium leading-[0.94] tracking-tight-editorial text-zinc-50 text-balance">
                The top{" "}
                <span className="text-[var(--signal)]">minds</span>,
                <br />
                ranked by mastery.
              </h1>
              <p className="mt-4 max-w-xl font-sans text-[13.5px] leading-relaxed text-zinc-500 text-pretty">
                Bayesian mastery blends BKT posterior, contest rating, and peer-review signals.
                Global percentile is computed nightly across{" "}
                <span className="text-zinc-300">1.2M</span> active hackers.
              </p>
            </div>

            {you && (
              <div className="relative min-w-[280px] border border-white/[0.08] p-5">
                <span className="absolute -top-2.5 left-4 bg-background px-2 font-mono text-[9px] tracking-[0.28em] text-[var(--signal)]/80">
                  YOUR · POSITION
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] tracking-widest text-zinc-600">RANK</span>
                  <span className="font-sans text-[44px] font-medium leading-none tabular-nums text-zinc-100">
                    #{you.rank}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <MiniStat label="MASTERY" value={you.mastery.toFixed(1)} />
                  <MiniStat label="PCT" value={you.percentile.toFixed(2)} />
                  <MiniStat label="STREAK" value={`${you.streak}D`} />
                </div>
                <span className="absolute right-2 top-2 h-1 w-1 bg-[var(--signal)]" />
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <section className="flex items-center gap-4 border-b border-white/[0.04] px-12 py-4">
          <div className="flex items-center gap-1 border border-white/[0.06] p-[2px]">
            {SCOPES.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`press ease-signature px-3 py-1 font-mono text-[10px] tracking-[0.2em] transition-colors ${
                  s === scope ? "bg-white/[0.05] text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border border-white/[0.06] p-[2px]">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setRange(w)}
                className={`press ease-signature px-2.5 py-1 font-mono text-[10px] tracking-widest transition-colors ${
                  w === range ? "bg-white/[0.05] text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 border border-white/[0.06] px-2.5 py-1.5">
            <Search className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter hackers…"
              className="w-56 bg-transparent font-mono text-[11px] tracking-wide text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </section>

        {/* Table */}
        <section className="flex-1 px-12 py-8">
          <div className="grid grid-cols-[56px_1fr_160px_120px_120px_100px_56px] items-center gap-6 border-y border-white/[0.06] py-3 font-mono text-[9px] tracking-[0.28em] text-zinc-600">
            <span>RANK</span>
            <span>HACKER</span>
            <span>MASTERY</span>
            <span>PERCENTILE</span>
            <span>SOLVED</span>
            <span>STREAK</span>
            <span className="text-right">TIER</span>
          </div>

          <ul>
            {filtered.map((r, i) => (
              <LeaderboardRow key={r.handle} row={r} index={i} />
            ))}
          </ul>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 font-mono text-[10px] tracking-[0.24em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span>NO MATCHES · REFINE YOUR QUERY</span>
            </div>
          )}
        </section>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-12 py-5 font-mono text-[9px] tracking-[0.28em] text-zinc-700">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <div className="flex items-center gap-4">
            <span>RATINGS ENGINE · ELO-BKT</span>
            <span className="text-[var(--signal)]/70">OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardRow({ row, index }: { row: LeaderRow; index: number }) {
  const top3 = row.rank <= 3
  const goldTint =
    row.rank === 1
      ? "text-amber-200/90"
      : row.rank === 2
        ? "text-zinc-200"
        : row.rank === 3
          ? "text-orange-300/75"
          : "text-zinc-500"

  return (
    <li
      className={`ease-signature group relative grid grid-cols-[56px_1fr_160px_120px_120px_100px_56px] items-center gap-6 border-b border-white/[0.04] py-4 transition-colors hover:bg-white/[0.015] ${
        row.isYou ? "bg-[var(--signal)]/[0.025]" : ""
      }`}
      style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
    >
      {row.isYou && (
        <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 bg-[var(--signal)]" />
      )}

      {/* Rank */}
      <div className="flex items-center gap-2">
        <span className={`font-sans text-[20px] font-medium leading-none tabular-nums ${goldTint}`}>
          {String(row.rank).padStart(2, "0")}
        </span>
        {top3 && (
          <span
            className={`inline-block h-1 w-1 rounded-full ${
              row.rank === 1
                ? "bg-amber-300/70"
                : row.rank === 2
                  ? "bg-zinc-300/70"
                  : "bg-orange-300/60"
            }`}
          />
        )}
      </div>

      {/* Hacker */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-[10px] ${
            row.isYou
              ? "border-[var(--signal)]/60 bg-[var(--signal)]/10 text-[var(--signal)]"
              : "border-white/[0.08] bg-white/[0.02] text-zinc-400"
          }`}
        >
          {row.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`truncate font-sans text-[14px] font-medium ${
                row.isYou ? "text-[var(--signal)]" : "text-zinc-100"
              }`}
            >
              {row.name}
            </span>
            {row.isYou && (
              <span className="border border-[var(--signal)]/40 px-1.5 py-[1px] font-mono text-[8px] tracking-[0.2em] text-[var(--signal)]">
                YOU
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] tracking-widest text-zinc-600">
            <span>@{row.handle}</span>
            <span className="text-zinc-800">·</span>
            <span>{row.country}</span>
            <span className="text-zinc-800">·</span>
            <span>LVL {row.level}</span>
          </div>
        </div>
      </div>

      {/* Mastery */}
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-20 bg-white/[0.05]">
          <div
            className="h-full bg-[var(--signal)]/80"
            style={{ width: `${row.mastery}%` }}
          />
        </div>
        <span className="font-mono text-[12px] tabular-nums text-zinc-200">
          {row.mastery.toFixed(1)}
        </span>
      </div>

      {/* Percentile */}
      <span className="font-mono text-[12px] tabular-nums text-zinc-300">
        {row.percentile.toFixed(2)}
        <span className="text-zinc-700">%</span>
      </span>

      {/* Solved */}
      <span className="font-mono text-[12px] tabular-nums text-zinc-400">
        {row.solved.toLocaleString()}
      </span>

      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <Flame
          className={`h-3 w-3 ${row.streak >= 50 ? "text-[var(--signal)]" : "text-zinc-700"}`}
          strokeWidth={1.5}
        />
        <span className="font-mono text-[11px] tabular-nums text-zinc-400">{row.streak}D</span>
      </div>

      {/* Tier */}
      <div className="flex justify-end">
        <span
          className={`border px-1.5 py-[1px] font-mono text-[8px] tracking-[0.22em] ${
            row.tier === "LEGEND"
              ? "border-amber-300/40 text-amber-200/90"
              : row.tier === "ARCHON"
                ? "border-zinc-300/30 text-zinc-300"
                : row.tier === "ADEPT"
                  ? "border-[var(--signal)]/40 text-[var(--signal)]/90"
                  : "border-white/[0.08] text-zinc-500"
          }`}
        >
          {row.tier}
        </span>
      </div>
    </li>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
      <span className="font-mono text-[8px] tracking-[0.24em] text-zinc-600">{label}</span>
      <span className="font-mono text-[12px] tabular-nums text-zinc-200">{value}</span>
    </div>
  )
}
