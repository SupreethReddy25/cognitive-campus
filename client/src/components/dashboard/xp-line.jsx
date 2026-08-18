import { useMemo, useState } from "react";

const RANGES = ["7D", "30D", "90D"];

/**
 * XpLine — receives real submission history from dashboard-view.
 * Falls back to an empty state if no data is available yet.
 * @param {{ submissions: Array<{createdAt: string, xpEarned?: number}> }} props
 */
export function XpLine({ submissions = [] }) {
  const [range, setRange] = useState("30D");

  // Build a day-bucketed XP series from real submissions
  const xpSeries = useMemo(() => {
    const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    const buckets = new Array(days).fill(0);
    const now = Date.now();
    const msPerDay = 86400000;

    submissions.forEach((s) => {
      const daysAgo = Math.floor((now - new Date(s.createdAt).getTime()) / msPerDay);
      if (daysAgo >= 0 && daysAgo < days) {
        // Each passing submission gives at least 10 XP; use xpEarned if available
        buckets[days - 1 - daysAgo] += s.xpEarned || 10;
      }
    });
    return buckets;
  }, [submissions, range]);

  const data = xpSeries;
  const total = data.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / Math.max(1, data.filter(v => v > 0).length));
  const max = Math.max(...data, 1);
  const min = Math.min(...data.filter(v => v > 0), 0);
  const w = 620;
  const h = 200;
  const padL = 28;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const toX = i => padL + i / Math.max(1, data.length - 1) * innerW;
  const toY = v => padT + innerH - (v - min) / Math.max(1, max - min) * innerH;

  const pathLine = useMemo(() => {
    if (!data.length) return "";
    let d = `M ${toX(0)} ${toY(data[0])}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = toX(i);
      const x1 = toX(i + 1);
      const y0 = toY(data[i]);
      const y1 = toY(data[i + 1]);
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.join(",")]);

  const pathArea = `${pathLine} L ${toX(data.length - 1)} ${padT + innerH} L ${toX(0)} ${padT + innerH} Z`;

  return <div className="relative flex h-full flex-col px-10 py-9">
      {/* header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-zinc-500">
            03 · XP · CURVE
          </div>
          <h2 className="mt-2 font-sans text-[26px] font-medium leading-tight tracking-tight-editorial text-zinc-100 text-balance">
            Progression over{" "}
            <span className="text-[var(--signal)]">the last {range.toLowerCase()}</span>.
          </h2>
        </div>
        <div className="flex items-center gap-1 border border-white/[0.06] p-[2px]">
          {["7D", "30D", "90D"].map(r => <button key={r} onClick={() => setRange(r)} className={`press ease-signature px-2.5 py-[3px] font-mono text-[10px] tracking-widest transition-colors ${r === range ? "bg-white/[0.05] text-zinc-100" : "text-zinc-600 hover:text-zinc-300"}`}>
              {r}
            </button>)}
        </div>
      </div>

      {/* aggregate row */}
      <div className="mb-6 grid grid-cols-4 gap-6">
        <Stat label="TOTAL XP" value={total.toLocaleString()} tone="primary" />
        <Stat label="AVG / ACTIVE DAY" value={avg.toLocaleString()} />
        <Stat label="PEAK DAY" value={max.toLocaleString()} />
        <Stat label="ACTIVE DAYS" value={data.filter(v => v > 0).length.toString()} />
      </div>

      {/* empty state */}
      {total === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-700">NO SUBMISSIONS YET — START SOLVING</span>
        </div>
      )}

      {/* chart */}
      {total > 0 && <div className="relative flex-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="xp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map(t => <line key={t} x1={padL} x2={w - padR} y1={padT + innerH * t} y2={padT + innerH * t} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray={t === 0 || t === 1 ? "none" : "2 3"} />)}

          {[0, 0.5, 1].map(t => {
          const v = Math.round(max - (max - min) * t);
          return <text key={t} x={padL - 6} y={padT + innerH * t + 3} textAnchor="end" fontFamily="var(--font-geist-mono)" fontSize="8" letterSpacing="1" fill="rgb(82,82,91)">
                {v}
              </text>;
        })}

          <path d={pathArea} fill="url(#xp-fill)" />
          <path d={pathLine} fill="none" stroke="var(--signal)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />

          {data.length > 0 && <g>
              <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="3" fill="var(--signal)" />
              <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="6" fill="none" stroke="var(--signal)" strokeOpacity="0.3" />
            </g>}

          <text x={padL} y={h - 6} fontFamily="var(--font-geist-mono)" fontSize="8" letterSpacing="2" fill="rgb(82,82,91)">
            -{data.length}D
          </text>
          <text x={w - padR} y={h - 6} textAnchor="end" fontFamily="var(--font-geist-mono)" fontSize="8" letterSpacing="2" fill="rgb(82,82,91)">
            TODAY
          </text>
        </svg>
      </div>}

      <span className="pointer-events-none absolute left-6 bottom-6 h-2 w-2 border-b border-l border-white/[0.08]" />
    </div>;
}

function Stat({ label, value, tone }) {
  return <div className="flex flex-col gap-1 border-l border-white/[0.06] pl-3">
      <span className="font-mono text-[9px] tracking-[0.24em] text-zinc-600">{label}</span>
      <span className={`font-sans text-[20px] font-medium tabular-nums leading-none ${tone === "primary" ? "text-[var(--signal)]" : "text-zinc-200"}`}>
        {value}
      </span>
    </div>;
}
