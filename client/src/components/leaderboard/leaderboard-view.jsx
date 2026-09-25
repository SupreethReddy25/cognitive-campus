import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Flame, Trophy, GraduationCap, Globe, Zap } from 'lucide-react';
import { leaderboardService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { Card, Label, Bar, Skeleton, EmptyState, cn } from '../ui/kit';

const tierFor = (level) => (level >= 40 ? 'LEGEND' : level >= 30 ? 'ARCHON' : level >= 15 ? 'ADEPT' : 'APPRENTICE');
const TIER_STYLE = {
  LEGEND: 'border-amber-300/40 text-amber-200',
  ARCHON: 'border-zinc-300/30 text-zinc-300',
  ADEPT: 'border-[var(--signal)]/40 text-[var(--signal)]',
  APPRENTICE: 'border-white/[0.08] text-zinc-500'
};

export function LeaderboardView() {
  const { user } = useAuth();
  const { lastLeaderboardSignal } = useSocket();
  const [scope, setScope] = useState('global');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ collegeAvailable: false });
  const [loading, setLoading] = useState(true);

  const load = async (s = scope) => {
    try {
      const r = await leaderboardService.getLeaderboard({ scope: s });
      setRows(r.data?.data?.leaderboard || []);
      setMeta({ collegeAvailable: !!r.data?.data?.collegeAvailable });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); load(scope); }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (lastLeaderboardSignal) load(); }, [lastLeaderboardSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || (r.college || '').toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const maxXp = Math.max(1, ...rows.map((r) => r.xp));

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.05] px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-zinc-100"><Trophy className="h-4 w-4 text-amber-400" /> Leaderboard</h2>
          <p className="mt-0.5 text-[12px] text-zinc-500">Ranked by XP. Streak multipliers, daily challenges and first solves all count.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] p-[3px]">
            <button onClick={() => setScope('global')} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors', scope === 'global' ? 'bg-white/[0.07] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}><Globe className="h-3 w-3" /> Global</button>
            <button onClick={() => setScope('college')} disabled={!meta.collegeAvailable && scope !== 'college'} title={meta.collegeAvailable ? '' : 'Select your college in Profile to unlock'} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40', scope === 'college' ? 'bg-white/[0.07] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}><GraduationCap className="h-3 w-3" /> My college</button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-1.5">
            <Search className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a student…" className="w-40 bg-transparent text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="px-2 py-2 md:px-6">
        {loading ? (
          <div className="space-y-2 py-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Trophy} title="No students to show" text={scope === 'college' ? 'Nobody else from your college has joined yet — invite classmates!' : 'Try a different search.'} className="my-4 border-0" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/[0.05] text-left">
                  {['#', 'Student', 'XP', 'Solved', 'Mastered', 'Streak', 'Tier'].map((h) => <th key={h} className="px-3 py-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-zinc-600">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const top3 = r.rank <= 3;
                  const tier = tierFor(r.level);
                  return (
                    <motion.tr key={r.userId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className={cn('relative border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]', r.isCurrentUser && 'bg-[var(--signal)]/[0.05]')}>
                      <td className="w-14 px-3 py-3">
                        <span className={cn('text-[18px] font-medium tabular-nums', r.rank === 1 ? 'text-amber-300' : r.rank === 2 ? 'text-zinc-200' : r.rank === 3 ? 'text-orange-300' : 'text-zinc-500')}>{top3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold', r.isCurrentUser ? 'border-[var(--signal)]/50 bg-[var(--signal)]/10 text-[var(--signal)]' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400')}>{r.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('truncate text-[13.5px] font-medium', r.isCurrentUser ? 'text-[var(--signal)]' : 'text-zinc-100')}>{r.name}</span>
                              {r.isCurrentUser && <span className="rounded border border-[var(--signal)]/40 px-1.5 font-mono text-[8px] tracking-widest text-[var(--signal)]">YOU</span>}
                            </div>
                            <div className="font-mono text-[9.5px] tracking-wider text-zinc-600">{r.college || '—'} · LVL {r.level}</div>
                          </div>
                        </div>
                      </td>
                      <td className="w-44 px-3 py-3">
                        <div className="flex items-center gap-2.5"><Bar value={r.xp} max={maxXp} height={4} color="linear-gradient(90deg,#fbbf24,#f97316)" className="w-16" /><span className="font-mono text-[12px] tabular-nums text-zinc-200">{r.xp.toLocaleString()}</span></div>
                      </td>
                      <td className="px-3 py-3 font-mono text-[12px] tabular-nums text-zinc-400">{r.solved ?? 0}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-2"><Bar value={r.skillsMastered} max={12} height={4} className="w-14" /><span className="font-mono text-[11px] tabular-nums text-zinc-400">{r.skillsMastered}/12</span></div></td>
                      <td className="px-3 py-3"><span className="flex items-center gap-1 font-mono text-[11.5px] text-zinc-400"><Flame className={cn('h-3 w-3', r.streak >= 7 ? 'text-orange-400' : 'text-zinc-700')} />{r.streak}d</span></td>
                      <td className="px-3 py-3"><span className={cn('rounded border px-1.5 py-0.5 font-mono text-[8.5px] tracking-[0.18em]', TIER_STYLE[tier])}>{tier}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.05] px-6 py-3 font-mono text-[9.5px] uppercase tracking-widest text-zinc-600">
        <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Live — updates when anyone earns XP</span>
        <span>{filtered.length} shown</span>
      </div>
    </Card>
  );
}
