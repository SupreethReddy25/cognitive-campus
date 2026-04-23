import { ArrowUpRight, Minus } from "lucide-react";

export function MetricsRow({ xp = 0, level = 1, streak = 0, masteredCount = 0, totalSkills = 1 }) {
  const coverage = totalSkills > 0 ? ((masteredCount / totalSkills) * 100).toFixed(1) : '0.0';
  
  const heroMetrics = [{
    label: "TOTAL XP",
    value: xp.toLocaleString(),
    unit: "",
    delta: "+XP",
    deltaLabel: "LIFETIME",
    deltaTone: "up",
    index: "01"
  }, {
    label: "LEVEL",
    value: String(level),
    unit: "/ 40",
    delta: "",
    deltaLabel: "CURRENT",
    deltaTone: "up",
    index: "02"
  }, {
    label: "STREAK",
    value: String(streak),
    unit: "DAYS",
    delta: `${streak}D`,
    deltaLabel: "CURRENT",
    deltaTone: streak > 0 ? "up" : "neutral",
    index: "03"
  }, {
    label: "MASTERED",
    value: String(masteredCount),
    unit: `/ ${totalSkills}`,
    delta: `${coverage}%`,
    deltaLabel: "COVERAGE",
    deltaTone: "up",
    index: "04"
  }];

  return <section className="grid border-b border-white/[0.04] md:grid-cols-2 lg:grid-cols-4">
      {heroMetrics.map((m, i) => <div key={m.label} className={`relative flex flex-col justify-between gap-6 px-8 py-9 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/[0.015] ${i < heroMetrics.length - 1 ? "lg:border-r lg:border-white/[0.04]" : ""} ${i < 2 ? "md:border-r md:border-white/[0.04]" : ""} ${i < 2 ? "border-b border-white/[0.04] md:border-b-0" : ""}`}>
          {/* Upper meta */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-zinc-500">
              <span className="text-zinc-700">{m.index}</span>
              <span className="h-px w-4 bg-white/[0.08]" />
              <span>{m.label}</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center border border-white/[0.06] text-zinc-600">
              {m.deltaTone === "up" ? <ArrowUpRight className="h-2.5 w-2.5 text-[var(--signal)]/80" strokeWidth={1.5} /> : <Minus className="h-2.5 w-2.5" strokeWidth={1.5} />}
            </span>
          </div>

          {/* Big numeral */}
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-[52px] font-medium leading-none tracking-tight text-zinc-50 tabular-nums">
              {m.value}
            </span>
            {m.unit && <span className="font-mono text-[12px] tracking-widest text-zinc-600">
                {m.unit}
              </span>}
          </div>

          {/* Delta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[11px] tracking-wider tabular-nums ${m.deltaTone === "up" ? "text-[var(--signal)]" : "text-zinc-400"}`}>
                {m.delta}
              </span>
              <span className="font-mono text-[9px] tracking-[0.24em] text-zinc-700">
                {m.deltaLabel}
              </span>
            </div>
            <MiniSpark index={i} />
          </div>

          {/* Corner tick marks */}
          <span className="absolute right-4 top-4 h-1 w-1 bg-white/[0.06]" />
        </div>)}
    </section>;
}

function MiniSpark({ index }) {
  const seeds = [[3, 5, 4, 6, 5, 7, 6, 8], [2, 3, 4, 4, 5, 5, 6, 7], [5, 4, 6, 5, 7, 6, 8, 7], [4, 5, 5, 6, 6, 7, 7, 8]];
  const pts = seeds[index % seeds.length];
  const max = Math.max(...pts);
  const w = 52;
  const h = 14;
  const step = w / (pts.length - 1);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - p / max * h).toFixed(1)}`).join(" ");
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <path d={path} fill="none" stroke="var(--signal)" strokeWidth="1" strokeLinejoin="round" strokeLinecap="square" />
    </svg>;
}