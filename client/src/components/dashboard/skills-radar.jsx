export function SkillsRadar({ skillStates = [] }) {
  const skills = skillStates.length > 0 
    ? skillStates.slice(0, 8).map(s => ({ key: (s.skillId?.name || s.skillName || 'SKILL').toUpperCase().slice(0, 8), score: Math.round((s.masteryP || 0) * 100) }))
    : [{ key: "ARRAYS", score: 50 }, { key: "TREES", score: 40 }, { key: "GRAPHS", score: 30 }, { key: "DP", score: 25 }, { key: "STRINGS", score: 35 }, { key: "MATH", score: 20 }];

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const R = 120;
  const n = skills.length;

  const vertex = (i, v) => {
    const angle = Math.PI * 2 * i / n - Math.PI / 2;
    const r = v / 100 * R;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };
  const userPoints = skills.map((s, i) => vertex(i, s.score));
  const userPath = "M " + userPoints.map(([x, y]) => `${x},${y}`).join(" L ") + " Z";
  const cohortPoints = skills.map((_, i) => vertex(i, 68 + i * 7 % 9));
  const cohortPath = "M " + cohortPoints.map(([x, y]) => `${x},${y}`).join(" L ") + " Z";

  return <div className="relative flex h-full flex-col px-10 py-9">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] text-zinc-500">
            02 · SKILL · MATRIX
          </div>
          <h2 className="mt-2 font-sans text-[26px] font-medium leading-tight tracking-tight-editorial text-zinc-100 text-balance">
            Mastery across the{" "}
            <span className="text-[var(--signal)]">{n} pillars</span>.
          </h2>
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px] tracking-[0.24em] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 border border-[var(--signal)]" />
            <span>YOU</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 border border-dashed border-zinc-600" />
            <span>COHORT · P85</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full max-h-[320px] w-auto">
          {/* rings */}
          {[0.25, 0.5, 0.75, 1].map(t => {
          const d = skills.map((_, i) => {
            const [x, y] = vertex(i, t * 100);
            return `${i === 0 ? "M" : "L"} ${x},${y}`;
          }).join(" ") + " Z";
          return <path key={t} d={d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}

          {/* axes */}
          {skills.map((_, i) => {
          const [x, y] = vertex(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}

          {/* cohort shape */}
          <path d={cohortPath} fill="none" stroke="rgba(161,161,170,0.4)" strokeWidth="1" strokeDasharray="2 2" />

          {/* user shape */}
          <path d={userPath} fill="var(--signal)" fillOpacity="0.12" stroke="var(--signal)" strokeWidth="1.25" strokeLinejoin="miter" />

          {/* user vertex dots */}
          {userPoints.map(([x, y], i) => <g key={i}>
              <circle cx={x} cy={y} r="2" fill="var(--signal)" />
              <circle cx={x} cy={y} r="5" fill="none" stroke="var(--signal)" strokeOpacity="0.3" />
            </g>)}

          {/* axis labels */}
          {skills.map((s, i) => {
          const [lx, ly] = vertex(i, 118);
          return <text key={s.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-geist-mono)" fontSize="9" letterSpacing="1.5" fill="rgb(161,161,170)">
                {s.key}
              </text>;
        })}

          {/* center dot */}
          <circle cx={cx} cy={cy} r="1.5" fill="rgba(255,255,255,0.25)" />
        </svg>
      </div>

      {/* legend table */}
      <div className={`mt-6 grid gap-4 border-t border-white/[0.04] pt-4`} style={{ gridTemplateColumns: `repeat(${Math.min(n, 6)}, 1fr)` }}>
        {skills.slice(0, 6).map(s => <div key={s.key} className="flex flex-col gap-1">
            <span className="font-mono text-[9px] tracking-[0.22em] text-zinc-600">
              {s.key}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-sans text-[16px] font-medium tabular-nums text-zinc-200">
                {s.score}
              </span>
              <span className="font-mono text-[8px] text-zinc-700">/100</span>
            </div>
            <div className="h-[2px] w-full bg-white/[0.05]">
              <div className="h-full bg-[var(--signal)]/80" style={{
            width: `${s.score}%`
          }} />
            </div>
          </div>)}
      </div>

      {/* tick marks */}
      <span className="pointer-events-none absolute right-6 top-6 h-2 w-2 border-r border-t border-white/[0.08]" />
    </div>;
}