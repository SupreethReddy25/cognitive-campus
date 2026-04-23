/**
 * RaceTracker — Versus mode progress bars
 *
 * Shows two horizontal progress bars that fill in real-time
 * as arena:progress_update events arrive.
 * Extracted from plan: "Race Tracker UI at the top of the center pane"
 */

import { useArena } from '../../context/ArenaContext';
import { useAuth } from '../../context/AuthContext';
import { Crown, Swords } from 'lucide-react';

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

  return <div className="border-b border-white/[0.04] bg-white/[0.01] px-5 py-3">
    <div className="flex items-center gap-2 mb-3">
      <Swords className="h-3.5 w-3.5 text-rose-400" strokeWidth={1.5} />
      <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-500">VERSUS · RACE</span>
      {isFinished && <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-amber-400">
        <Crown className="h-3 w-3" strokeWidth={2} />
        {iWon ? 'YOU WON!' : `${winner?.name} wins`}
      </span>}
    </div>

    {/* My bar */}
    <div className="flex items-center gap-3 mb-2">
      <span className="w-12 text-right text-[11px] font-mono font-medium text-[var(--signal)] truncate">
        YOU
      </span>
      <div className="relative flex-1 h-[8px] rounded-full bg-white/[0.06] overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--signal)] transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${myPct}%` }}
        />
      </div>
      <span className="w-16 font-mono text-[11px] tabular-nums text-zinc-400">
        {myProgress.progress}/{myProgress.total} tests
      </span>
    </div>

    {/* Opponent bar */}
    <div className="flex items-center gap-3">
      <span className="w-12 text-right text-[11px] font-mono font-medium text-rose-400 truncate">
        {opponent?.name?.split(' ')[0] || 'OPP'}
      </span>
      <div className="relative flex-1 h-[8px] rounded-full bg-white/[0.06] overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-rose-500 transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${oppPct}%` }}
        />
      </div>
      <span className="w-16 font-mono text-[11px] tabular-nums text-zinc-400">
        {oppProgress.progress}/{oppProgress.total} tests
      </span>
    </div>
  </div>;
}
