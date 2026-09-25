/**
 * Dashboard charts — all recharts, all animated on mount, all themed to the design system.
 */

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, LineChart, Line
} from 'recharts';
import { Flame, Trophy, Sparkles } from 'lucide-react';
import { chartTooltipStyle, Label } from '../ui/kit';

const short = (name) => ({ 'Stacks & Queues': 'Stacks', 'Dynamic Programming': 'DP', 'Greedy Algorithms': 'Greedy', 'Linked Lists': 'Lists' }[name] || name);

/** 12-axis mastery radar with a dashed cohort-average overlay. */
export function SkillRadarChart({ skills = [], height = 320 }) {
  const data = useMemo(
    () => skills.map((s) => ({
      skill: short(s.name),
      full: s.name,
      mastery: Math.round((s.masteryP || 0) * 100),
      cohort: s.cohortAvg != null ? Math.round(s.cohortAvg * 100) : null
    })),
    [skills]
  );
  if (!data.length) return null;
  const hasCohort = data.some((d) => d.cohort !== null);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          {hasCohort && <Radar name="Cohort avg" dataKey="cohort" stroke="#a78bfa" strokeDasharray="4 4" fill="#a78bfa" fillOpacity={0.06} isAnimationActive animationDuration={1200} />}
          <Radar name="You" dataKey="mastery" stroke="#34d399" fill="#34d399" fillOpacity={0.28} strokeWidth={2} isAnimationActive animationDuration={1400} animationEasing="ease-out" dot={{ r: 3, fill: '#34d399' }} />
          <Tooltip {...chartTooltipStyle} formatter={(v, n) => [`${v}%`, n]} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} iconType="plainline" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Average mastery over the last 30 days; toggle to overlay individual skills. */
export function MasteryTrendChart({ timeline = [], skills = [], height = 260 }) {
  const [selected, setSelected] = useState([]);
  const skillById = useMemo(() => new Map(skills.map((s) => [s.skillId, s])), [skills]);

  const data = useMemo(
    () => timeline.map((t) => {
      const row = { date: t.date.slice(5), avg: +(t.avgMastery * 100).toFixed(1) };
      selected.forEach((id) => { row[id] = t.perSkill?.[id] != null ? +(t.perSkill[id] * 100).toFixed(1) : null; });
      return row;
    }),
    [timeline, selected]
  );

  const first = data[0]?.avg ?? 0;
  const last = data[data.length - 1]?.avg ?? 0;
  const palette = ['#38bdf8', '#a78bfa', '#fbbf24', '#fb7185'];
  const movers = useMemo(() => [...skills].filter((s) => s.attempts > 0).sort((a, b) => b.attempts - a.attempts).slice(0, 6), [skills]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[26px] font-semibold tabular-nums text-zinc-100">{last.toFixed(0)}%</span>
          <span className={`font-mono text-[11px] ${last >= first ? 'text-emerald-400' : 'text-rose-400'}`}>{last >= first ? '+' : ''}{(last - first).toFixed(1)} pts / 30d</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {movers.map((s, i) => {
            const on = selected.includes(s.skillId);
            const color = palette[selected.indexOf(s.skillId)] || '#71717a';
            return (
              <button
                key={s.skillId}
                onClick={() => setSelected((cur) => (on ? cur.filter((x) => x !== s.skillId) : [...cur.slice(-3), s.skillId]))}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${on ? 'border-white/20 bg-white/[0.08] text-zinc-100' : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300'}`}
                style={on ? { borderColor: color, color } : {}}
              >
                {short(s.name)}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip {...chartTooltipStyle} formatter={(v, n) => [`${v}%`, n === 'avg' ? 'Overall' : short(skillById.get(n)?.name || n)]} />
            <Area type="monotone" dataKey="avg" stroke="#34d399" strokeWidth={2.2} fill="url(#avgFill)" isAnimationActive animationDuration={1300} />
            {selected.map((id, i) => (
              <Line key={id} type="monotone" dataKey={id} stroke={palette[i]} strokeWidth={1.8} dot={false} connectNulls isAnimationActive animationDuration={900} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Cumulative XP with milestone annotations (level-ups, streak milestones, first solve). */
export function XpProgressChart({ points = [], annotations = [], height = 240 }) {
  const data = useMemo(() => points.map((p) => ({ ...p, label: p.date.slice(5) })), [points]);
  const annos = useMemo(() => annotations.map((a) => ({ ...a, point: data.find((d) => d.date === a.date) })).filter((a) => a.point), [annotations, data]);
  const gained = data.length ? data[data.length - 1].cumulative - data[0].cumulative + data[0].xp : 0;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold tabular-nums text-zinc-100">+{gained}</span>
        <Label>XP in 30 days</Label>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 14, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 20', 'dataMax + 20']} />
            <Tooltip {...chartTooltipStyle} formatter={(v, n, p) => [`${v} XP${p?.payload?.xp ? ` (+${p.payload.xp} that day)` : ''}`, 'Total']} />
            <Area type="monotone" dataKey="cumulative" stroke="#38bdf8" strokeWidth={2.2} fill="url(#xpFill)" isAnimationActive animationDuration={1300} />
            {annos.map((a, i) => (
              <ReferenceDot
                key={`${a.date}-${i}`}
                x={a.point.label}
                y={a.point.cumulative}
                r={5}
                fill={a.type === 'level' ? '#fbbf24' : a.type === 'streak' ? '#f97316' : '#a78bfa'}
                stroke="#0d0d0d"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {annos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {annos.map((a, i) => (
            <span key={`${a.date}-${i}`} className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-zinc-400">
              {a.type === 'level' ? <Trophy className="h-3 w-3 text-amber-400" /> : a.type === 'streak' ? <Flame className="h-3 w-3 text-orange-400" /> : <Sparkles className="h-3 w-3 text-violet-400" />}
              {a.label} · {a.date.slice(5)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
