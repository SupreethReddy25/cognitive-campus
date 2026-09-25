/**
 * RaceTracker — two stars racing to the finish.
 * Versus mode progress: each player is a star travelling along a hairline toward a finish marker.
 * Real-time updates via arena:progress_update events.
 */

import { useArena } from '../../context/ArenaContext';
import { useAuth } from '../../context/AuthContext';
import { Crown } from 'lucide-react';

export function RaceTracker() {
  const { user } = useAuth();
  const { progressMap, players, winner, matchStatus } = useArena();

  const myUserId = user?._id;
  const opponent = players.find((p) => p.userId !== myUserId);

  const mine = progressMap[myUserId] || { progress: 0, total: 1 };
  const theirs = opponent ? (progressMap[opponent.userId] || { progress: 0, total: 1 }) : { progress: 0, total: 1 };
  const pct = (p) => (p.total > 0 ? (p.progress / p.total) * 100 : 0);

  const isFinished = matchStatus === 'finished';
  const iWon = winner?.userId === myUserId;
  const isActive = matchStatus === 'active';

  return (
    <div className="border-b border-[var(--line)] px-6 py-4">
      <div className="mb-3 flex items-center justify-between text-[12.5px]">
        <span className="text-zinc-500">Versus · first to pass every test</span>
        {isActive && <span className="flex items-center gap-2 text-[var(--ember)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" />live</span>}
        {isFinished && <span className="flex items-center gap-1.5 font-medium text-[var(--star)]"><Crown className="h-3.5 w-3.5" />{iWon ? 'Victory' : `${winner?.name?.split(' ')[0]} wins`}</span>}
      </div>
      <Lane label="You" p={mine} pct={pct(mine)} color="#34d399" me />
      <Lane label={opponent?.name?.split(' ')[0] || 'Opponent'} p={theirs} pct={pct(theirs)} color="#38bdf8" />
    </div>
  );
}

function Lane({ label, p, pct, color, me = false }) {
  const done = p.finished;
  const ticks = Math.max(1, p.total);
  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className={`w-16 truncate text-right text-[13px] ${me ? 'font-medium text-zinc-100' : 'text-zinc-400'}`}>{label}</span>
      <div className="relative h-px flex-1 bg-[var(--line-strong)]">
        {Array.from({ length: ticks + 1 }).map((_, i) => <span key={i} className="absolute top-1/2 h-[7px] w-px -translate-y-1/2 bg-[var(--line-strong)]" style={{ left: `${(i / ticks) * 100}%` }} />)}
        <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, height: 1, background: color, transition: 'width .7s cubic-bezier(.34,1.56,.64,1)' }} />
        <span className="absolute top-1/2" style={{ left: `${pct}%`, transition: 'left .7s cubic-bezier(.34,1.56,.64,1)', transform: 'translate(-50%,-50%)' }}>
          <span className="absolute -inset-3 rounded-full" style={{ background: `radial-gradient(circle, ${color}66, transparent 70%)` }} />
          <span className="relative block h-2.5 w-2.5 rounded-full" style={{ background: done ? '#ecfdf5' : color }} />
        </span>
        <span className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-[var(--line-strong)]" />
      </div>
      <span className="w-14 text-[12.5px] tnum text-zinc-500"><span className="text-zinc-200">{p.progress}</span>/{p.total}</span>
    </div>
  );
}
