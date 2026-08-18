import React from 'react';
import { Database, Shield, Users } from 'lucide-react';

/**
 * DataConfidenceBadge
 *
 * Renders a badge indicating data reliability based on sample size.
 * Rules: 0=none, 1-2=low, 3-9=medium, 10+=high
 *
 * Props:
 *   confidence — 'none' | 'low' | 'medium' | 'high'
 *   count      — number of reports (shown in label)
 *   className  — optional extra classes
 */
export function DataConfidenceBadge({ confidence, count, className = '' }) {
  const configs = {
    none:   { label: 'No data yet', color: 'text-zinc-600', bg: 'bg-zinc-800/50', border: 'border-zinc-700/30', icon: Database },
    low:    { label: `${count} report${count !== 1 ? 's' : ''} — limited`, color: 'text-zinc-500', bg: 'bg-zinc-800/50', border: 'border-zinc-700/30', icon: Users },
    medium: { label: `Based on ${count} reports`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Shield },
    high:   { label: `Based on ${count} reports`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Shield },
  };

  const cfg = configs[confidence] || configs.none;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${cfg.color} ${cfg.bg} ${cfg.border} ${className}`}>
      <Icon className="h-3 w-3" strokeWidth={1.8} />
      {cfg.label}
    </span>
  );
}

/**
 * TopicBar
 *
 * Horizontal frequency bar chart for topics.
 * Pure CSS — no chart library.
 *
 * Props:
 *   topics  — [{ topic, count }] sorted by count desc
 *   max     — override max for bar scaling (defaults to topics[0].count)
 *   limit   — how many topics to show (default 8)
 */
export function TopicBar({ topics = [], max, limit = 8 }) {
  if (!topics.length) return null;

  const displayTopics = topics.slice(0, limit);
  const maxCount = max || displayTopics[0]?.count || 1;

  return (
    <div className="space-y-2">
      {displayTopics.map(({ topic, count }, i) => {
        const pct = Math.max(4, Math.round((count / maxCount) * 100));
        const isTop = i === 0;

        return (
          <div key={topic} className="flex items-center gap-3">
            <div className="w-28 text-[11px] text-zinc-400 truncate shrink-0">{topic}</div>
            <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isTop ? 'bg-[var(--signal)]' : 'bg-zinc-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-6 text-[11px] text-zinc-600 text-right tabular-nums shrink-0">{count}</div>
          </div>
        );
      })}
    </div>
  );
}
