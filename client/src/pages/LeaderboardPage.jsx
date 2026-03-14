import { useEffect, useState, useCallback } from 'react';
import { leaderboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Trophy, Medal, Crown } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { lastLeaderboardSignal } = useSocket();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await leaderboardService.getLeaderboard();
      setLeaderboard(res.data.data.leaderboard);
    } catch (err) {
      console.error('Leaderboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Re-fetch on socket signal
  useEffect(() => {
    if (lastLeaderboardSignal > 0) {
      fetchLeaderboard();
    }
  }, [lastLeaderboardSignal, fetchLeaderboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={2} />
        <div className="card"><LoadingSkeleton lines={12} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-amber-400" />
          Leaderboard
        </h1>
        <p className="text-muted text-sm mt-1">Top performers by XP</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50 text-left">
              <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider w-20">Rank</th>
              <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider text-center">Level</th>
              <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider text-right">XP</th>
              <th className="px-6 py-3 text-xs font-medium text-muted uppercase tracking-wider text-right hidden sm:table-cell">Skills Mastered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user?._id || entry.isCurrentUser;
              return (
                <tr
                  key={entry.userId}
                  className={`transition-colors ${
                    isCurrentUser
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : 'hover:bg-surface/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <RankDisplay rank={entry.rank} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {entry.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {entry.name}
                          {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                      LVL {entry.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-amber-400">{entry.xp}</span>
                  </td>
                  <td className="px-6 py-4 text-right hidden sm:table-cell">
                    <span className="text-sm text-muted">{entry.skillsMastered}/12</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted">No data yet. Be the first to submit!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RankDisplay = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1">
        <Crown className="w-5 h-5 text-amber-400" />
        <span className="font-bold text-amber-400">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-1">
        <Medal className="w-5 h-5 text-gray-300" />
        <span className="font-bold text-gray-300">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-1">
        <Medal className="w-5 h-5 text-amber-600" />
        <span className="font-bold text-amber-600">3</span>
      </div>
    );
  }
  return <span className="text-sm text-muted font-medium">{rank}</span>;
};

export default LeaderboardPage;
