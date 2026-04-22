"use client"

import { useState } from "react"
import { heatmap } from "@/lib/app-data"

const DAYS = ["M", "W", "F"]
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

function intensityBg(n: number) {
  if (n === 0) return "transparent"
  const pct = 12 + n * 16
  return `color-mix(in oklab, var(--signal) ${pct}%, transparent)`
}

export function ProfileHeatmap() {
  // heatmap is 52 * 7 = 364 cells, day-major per week column
  const weeks = 52
  const [hover, setHover] = useState<{
    week: number
    day: number
    count: number
  } | null>(null)

  return (
    <div className="relative">
      {/* month labels */}
      <div className="mb-2 grid grid-cols-12 gap-0 pl-6">
        {MONTHS.map((m) => (
          <span
            key={m}
            className="font-mono text-[9px] tracking-[0.22em] text-zinc-600"
          >
            {m}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* day-of-week labels */}
        <div className="flex w-4 flex-col justify-between py-[6px] font-mono text-[8px] tracking-widest text-zinc-700">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* grid */}
        <div className="flex flex-1 gap-[3px]">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-1 flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, d) => {
                const idx = w * 7 + d
                const v = heatmap[idx]
                const active = hover?.week === w && hover?.day === d
                return (
                  <button
                    key={d}
                    type="button"
                    onMouseEnter={() => setHover({ week: w, day: d, count: v * 3 })}
                    onMouseLeave={() => setHover(null)}
                    className={`aspect-square w-full border ${
                      active ? "border-white/40" : "border-white/[0.06]"
                    } transition-colors duration-150`}
                    style={{ backgroundColor: intensityBg(v) }}
                    aria-label={`Week ${w + 1} day ${d + 1}: ${v * 3} solves`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* tooltip */}
      {hover && (
        <div className="pointer-events-none mt-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] text-zinc-500">
          <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
          <span className="text-zinc-300">
            {hover.count} solves
          </span>
          <span>·</span>
          <span>
            WEEK {String(hover.week + 1).padStart(2, "0")} · DAY {hover.day + 1}
          </span>
        </div>
      )}
    </div>
  )
}
