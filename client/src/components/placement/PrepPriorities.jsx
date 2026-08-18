import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';

const PRIORITY_CONFIG = {
  high:   { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500', label: 'HIGH PRIORITY' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', label: 'REVIEW' },
  low:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: 'STRONG' },
};

/**
 * PrepPriorities
 *
 * Renders the BKT × Intel preparation priorities panel.
 * Shows tracked skills (with BKT mastery) and untracked topics (self-study).
 *
 * Props:
 *   prepPriorities — the prepPriorities object from getCollegeCompanyIntel
 *   companyName    — string, for the summary line
 *   collegeName    — string
 */
export function PrepPriorities({ prepPriorities, companyName, collegeName }) {
  if (!prepPriorities) return null;

  const { tracked = [], untracked = [], summary, dataConfidence, totalReports } = prepPriorities;

  const hasData = tracked.length > 0 || untracked.length > 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[var(--signal)]/10 shrink-0 mt-0.5">
          <TrendingUp className="h-4 w-4 text-[var(--signal)]" strokeWidth={1.6} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">What to Prepare</h3>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            {summary || `Topics reported for ${companyName} at ${collegeName}, ranked by frequency and your current mastery.`}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {!hasData && (
          <div className="flex items-center gap-3 text-zinc-500 text-sm py-2">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.6} />
            <span>Not enough data yet to generate preparation priorities.</span>
          </div>
        )}

        {/* Tracked skills with BKT mastery */}
        {tracked.map(item => {
          const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
          const masteryPct = item.mastery !== null ? Math.round(item.mastery * 100) : null;

          return (
            <div
              key={item.skillName}
              className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border} transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Priority label */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className={`text-[9px] font-mono tracking-[0.15em] ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {/* Skill name */}
                  <p className="text-sm font-semibold text-zinc-100">{item.skillName}</p>
                  {/* Sub-topics */}
                  {item.relatedTopics?.length > 0 && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      via: {item.relatedTopics.slice(0, 4).join(', ')}
                    </p>
                  )}
                  {/* Frequency */}
                  <p className="text-[11px] text-zinc-600 mt-1">{item.frequencyLabel}</p>
                </div>

                <div className="text-right shrink-0">
                  {/* Mastery ring — only show if we have BKT data */}
                  {masteryPct !== null && (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-lg font-bold tabular-nums ${cfg.color}`}>
                        {masteryPct}%
                      </span>
                      <span className="text-[10px] text-zinc-600">mastery</span>
                      {/* Mastery bar */}
                      <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.priority === 'high' ? 'bg-rose-500' :
                            item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${masteryPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {masteryPct === null && (
                    <span className="text-[11px] text-zinc-600">No practice data</span>
                  )}
                </div>
              </div>

              {/* Recommendation + link */}
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-[11px] text-zinc-500 italic">{item.recommendation}</p>
                <Link
                  to="/problems"
                  className={`flex items-center gap-1 text-[11px] font-medium ${cfg.color} hover:opacity-80 transition-opacity`}
                >
                  <BookOpen className="h-3 w-3" strokeWidth={2} />
                  Practice
                  <ArrowRight className="h-3 w-3" strokeWidth={2} />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Untracked topics */}
        {untracked.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.6} />
              <span className="text-[10px] font-mono tracking-[0.15em] text-zinc-500 uppercase">
                Self-Study Topics
              </span>
            </div>
            <div className="space-y-2">
              {untracked.map(item => (
                <div key={item.topic} className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-sm text-zinc-300">{item.topic}</span>
                    <p className="text-[11px] text-zinc-600">{item.frequencyLabel}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">Not in adaptive system</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-700 mt-3 pt-3 border-t border-white/[0.04]">
              These topics are not tracked by CognitiveCampus's adaptive learning — use external resources for self-study.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
