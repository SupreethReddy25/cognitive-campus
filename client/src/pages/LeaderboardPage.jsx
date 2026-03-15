import { useEffect, useState, useCallback } from 'react';
import { leaderboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import LoadingSkeleton from '../components/LoadingSkeleton';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { lastLeaderboardSignal } = useSocket();
  const [lb, setLb] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { const r = await leaderboardService.getLeaderboard(); setLb(r.data.data.leaderboard); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (lastLeaderboardSignal > 0) fetch(); }, [lastLeaderboardSignal, fetch]);

  if (loading) return <div className="card"><LoadingSkeleton lines={12} /></div>;

  const rankBorder = { 1: 'border-l-amber-400', 2: 'border-l-gray-400', 3: 'border-l-amber-700' };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>

      <div className="border border-[#2A2A4A] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#0F0F1A] text-[10px] font-mono text-[#8888A0] uppercase tracking-widest border-b border-[#2A2A4A]">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Name</span>
          <span className="col-span-2 text-center">Level</span>
          <span className="col-span-2 text-right">XP</span>
          <span className="col-span-2 text-right hidden sm:block">Mastered</span>
        </div>

        {/* Rows */}
        {lb.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[#8888A0]">No data yet.</div>
        ) : lb.map((entry) => {
          const isMe = entry.userId === user?._id || entry.isCurrentUser;
          return (
            <div key={entry.userId}
              className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-l-2 transition-colors ${
                isMe ? 'bg-[#6C63FF]/5 border-l-[#6C63FF]'
                : rankBorder[entry.rank] ? `bg-[#1A1A2E] ${rankBorder[entry.rank]}`
                : 'bg-[#1A1A2E] border-l-transparent hover:bg-[#22223A]'
              } ${entry.rank > 1 ? 'border-t border-[#2A2A4A]' : ''}`}>
              <span className="col-span-1 font-mono text-sm font-bold text-[#8888A0]">{entry.rank}</span>
              <div className="col-span-5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#6C63FF]/15 flex items-center justify-center text-[10px] font-semibold text-[#6C63FF] shrink-0">
                  {entry.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm text-[#E8E8F0] truncate">
                  {entry.name}{isMe && <span className="text-[10px] text-[#6C63FF] ml-1">(you)</span>}
                </span>
              </div>
              <span className="col-span-2 text-center font-mono text-xs text-[#6C63FF]">{entry.level}</span>
              <span className="col-span-2 text-right font-mono text-sm font-semibold text-[#FFA726]">{entry.xp}</span>
              <span className="col-span-2 text-right font-mono text-xs text-[#8888A0] hidden sm:block">{entry.skillsMastered}/12</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardPage;
