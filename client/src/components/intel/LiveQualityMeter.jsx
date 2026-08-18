import React, { useMemo } from 'react';

/**
 * LiveQualityMeter — real-time intel quality score bar.
 * Updates as user fills slots, with dynamic nudges guiding toward completion.
 */
export default function LiveQualityMeter({ data }) {
  const { score, breakdown, nudge } = useMemo(() => {
    let s = 0;
    const bd = [];

    // Resources (max 10)
    if (data.resources?.length > 0) { s += 5; bd.push('Resources'); }
    if (data.resources?.length >= 2) { s += 5; }

    // Rounds (max 35 — most valuable)
    const roundCount = data.rounds?.length || 0;
    s += Math.min(roundCount * 8, 24);
    if (roundCount > 0) bd.push(`${roundCount} round${roundCount > 1 ? 's' : ''}`);

    // Round completeness (max 25)
    const roundsToScore = (data.rounds || []).slice(0, 4);
    roundsToScore.forEach(r => {
      let rs = 0;
      if (r.type)              rs += 2;
      if (r.duration)          rs += 1;
      if (r.vibe)              rs += 2;
      if (r.topics?.length > 0) { rs += 3; bd.push(`Topics in R${roundsToScore.indexOf(r) + 1}`); }
      if (r.questions?.length > 0) { rs += 3; }
      s += Math.min(rs, 11);
    });

    // Advice (max 15)
    if (data.tips?.length > 0)  { s += 8;  bd.push('Advice'); }
    if (data.tips?.length >= 3) { s += 7; }

    // Extras (max 15)
    if (data.retrospective?.length > 20) { s += 8; }
    if (data.overallFeel)                { s += 5; bd.push('Overall feel'); }
    if (data.prepNotes?.length > 20)     { s += 5; }

    const final = Math.min(Math.round(s), 100);

    let nudge;
    let missing = [];
    if (!data.resources?.length) missing.push('prep resources');
    if (!roundCount) missing.push('at least 1 round');
    else if (roundCount < 2) missing.push('more rounds');
    if (!data.tips?.length) missing.push('advice for candidates');
    else if (!data.overallFeel) missing.push('an overall feel');

    if (final >= 85)      nudge = { text: "Excellent intel! This will help thousands of candidates.", level: 'excellent' };
    else if (final >= 60) nudge = { text: missing.length ? `Add ${missing[0]} to boost quality.` : 'Looking great!', level: 'good' };
    else                  nudge = { text: missing.length ? `Add ${missing[0]} to start building quality.` : 'Keep filling to help others!', level: 'low' };

    return { score: final, breakdown: bd, nudge };
  }, [data]);

  const barColor =
    score >= 75 ? 'bg-[var(--signal)]' :
    score >= 45 ? 'bg-amber-400' :
    'bg-red-500';

  const glowColor =
    score >= 75 ? 'shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
    score >= 45 ? 'shadow-[0_0_8px_rgba(251,191,36,0.3)]' :
    'shadow-[0_0_8px_rgba(239,68,68,0.3)]';

  return (
    <div className="border border-white/[0.05] bg-[#050508] px-5 py-4 rounded-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600">Intel Quality</span>
        <span className={`text-sm font-bold font-mono ${
          score >= 75 ? 'text-[var(--signal)]' : score >= 45 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {score}<span className="text-zinc-700 text-xs">/100</span>
        </span>
      </div>

      {/* Bar */}
      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor} ${glowColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Nudge */}
      <p className="text-[11px] text-zinc-500">{nudge.text}</p>

      {/* Breakdown pills */}
      {breakdown.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {[...new Set(breakdown)].map(b => (
            <span key={b} className="text-[9px] font-mono text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded-sm">
              ✓ {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
