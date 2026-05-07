/**
 * RaceTracker — Ultra-thin Glowing Race Lines
 *
 * Versus mode progress visualization.
 * 1px glowing lines with spring-physics easing and ambient glow.
 * Real-time updates via arena:progress_update events.
 */

import { useArena } from '../../context/ArenaContext';
import { useAuth } from '../../context/AuthContext';
import { Crown, Swords, Zap } from 'lucide-react';

export function RaceTracker() {
  const { user } = useAuth();
  const { progressMap, players, winner, matchStatus } = useArena();

  const myUserId = user?._id;
  const opponent = players.find(p => p.userId !== myUserId);
  const me = players.find(p => p.userId === myUserId);

  const myProgress = progressMap[myUserId] || { progress: 0, total: 1 };
  const oppProgress = opponent ? (progressMap[opponent.userId] || { progress: 0, total: 1 }) : { progress: 0, total: 1 };

  const myPct = myProgress.total > 0 ? (myProgress.progress / myProgress.total) * 100 : 0;
  const oppPct = oppProgress.total > 0 ? (oppProgress.progress / oppProgress.total) * 100 : 0;

  const isFinished = matchStatus === 'finished';
  const iWon = winner?.userId === myUserId;
  const isActive = matchStatus === 'active';

  return <div className="border-b border-white/[0.04] bg-white/[0.01] px-5 py-3">
    {/* Header */}
    <div className="flex items-center gap-2 mb-4">
      <Swords className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
      <span className="font-mono text-[9px] tracking-[0.24em] text-zinc-600 uppercase">
        Versus · Race
      </span>
      {isActive && <span className="ml-auto flex items-center gap-1.5">
        <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
        <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--signal)]">LIVE</span>
      </span>}
      {isFinished && <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.15em] text-amber-400 uppercase">
        <Crown className="h-3 w-3" strokeWidth={2} />
        {iWon ? 'Victory' : `${winner?.name?.split(' ')[0]} wins`}
      </span>}
    </div>

    {/* My race line */}
    <RaceLine
      label="YOU"
      progress={myProgress.progress}
      total={myProgress.total}
      pct={myPct}
      color="var(--signal)"
      glowColor="rgba(74, 124, 89, 0.6)"
      isMe={true}
      finished={myProgress.finished}
    />

    {/* Separator */}
    <div className="my-2.5 flex items-center gap-2">
      <div className="flex-1 h-px bg-white/[0.03]" />
      <Zap className="h-2.5 w-2.5 text-zinc-800" strokeWidth={1.5} />
      <div className="flex-1 h-px bg-white/[0.03]" />
    </div>

    {/* Opponent race line */}
    <RaceLine
      label={opponent?.name?.split(' ')[0] || 'OPP'}
      progress={oppProgress.progress}
      total={oppProgress.total}
      pct={oppPct}
      color="#e11d48"
      glowColor="rgba(225, 29, 72, 0.5)"
      isMe={false}
      finished={oppProgress.finished}
    />
  </div>;
}

function RaceLine({ label, progress, total, pct, color, glowColor, isMe, finished }) {
  return <div className="flex items-center gap-3">
    {/* Label */}
    <span
      className="w-10 text-right font-mono text-[10px] tracking-[0.12em] truncate uppercase"
      style={{ color: isMe ? 'var(--signal)' : '#fb7185' }}
    >
      {label}
    </span>

    {/* Track */}
    <div className="relative flex-1 h-[1px] bg-white/[0.06] overflow-visible">
      {/* Glow line */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          height: '1px',
          background: color,
          boxShadow: `0 0 8px ${glowColor}, 0 0 20px ${glowColor}`,
          transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
      {/* Leading dot — spring-physics overshoot */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: `${pct}%`,
          width: '4px',
          height: '4px',
          borderRadius: '9999px',
          background: color,
          boxShadow: `0 0 6px ${glowColor}, 0 0 12px ${glowColor}`,
          transition: 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>

    {/* Counter */}
    <span className="w-14 font-mono text-[10px] tabular-nums text-zinc-500">
      <span className="text-zinc-300">{progress}</span>
      <span className="text-zinc-700">/{total}</span>
    </span>

    {/* Finished indicator */}
    {finished && <span
      className="font-mono text-[8px] tracking-[0.2em] uppercase"
      style={{ color }}
    >
      ✓
    </span>}
  </div>;
}
