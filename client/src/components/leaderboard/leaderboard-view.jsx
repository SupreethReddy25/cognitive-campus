import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { leaderboardService } from '../../services/api';
import useSocket from '../../hooks/useSocket';
import { Skeleton, cn } from '../ui/kit';

const initials = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('');
const PODIUM = [
  { h: 'h-40', c: '#f2c66d' }, // 1st
  { h: 'h-28', c: '#d9d2c2' }, // 2nd
  { h: 'h-20', c: '#d9a679' }  // 3rd
];

export function LeaderboardView() {
  const { lastLeaderboardSignal } = useSocket();
  const [scope, setScope] = useState('global');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ collegeAvailable: false });
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(12);

  const load = async (s = scope) => {
    try {
      const r = await leaderboardService.getLeaderboard({ scope: s });
      setRows(r.data?.data?.leaderboard || []);
      setMeta({ collegeAvailable: !!r.data?.data?.collegeAvailable });
    } catch { setRows([]); } finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); load(scope); }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (lastLeaderboardSignal) load(); }, [lastLeaderboardSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || (r.college || '').toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const maxXp = Math.max(1, ...rows.map((r) => r.xp));
  const podium = !query ? rows.slice(0, 3) : [];
  const list = query ? filtered : rows.slice(3);
  const me = rows.find((r) => r.isCurrentUser);
  const meVisible = !me || me.rank <= 3 || list.slice(0, limit).some((r) => r.isCurrentUser);

  const Row = ({ r, i }) => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
      className={cn('grid grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-[var(--line)] py-3.5 md:grid-cols-[48px_1fr_150px_70px_70px_110px]', r.isCurrentUser && 'bg-[var(--ember)]/[0.06]')}>
      <span className="display text-[28px] leading-none tnum text-zinc-600">{r.rank}</span>
      <div className="flex min-w-0 items-center gap-3.5">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', r.isCurrentUser ? 'bg-[var(--ember)] text-[#1a0d07]' : 'border border-[var(--line-strong)] text-zinc-400')}>{initials(r.name)}</span>
        <div className="min-w-0"><div className={cn('truncate text-[16px] font-medium', r.isCurrentUser ? 'text-[var(--ember-soft)]' : 'text-zinc-100')}>{r.name}{r.isCurrentUser && <span className="ml-2 text-[11px] font-normal text-[var(--ember)]">you</span>}</div><div className="truncate text-[12px] text-zinc-600">{r.college || '—'} · level {r.level}</div></div>
      </div>
      <div className="hidden items-center gap-3 md:flex"><div className="h-[2px] w-16 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[var(--star)]" style={{ width: `${(r.xp / maxXp) * 100}%` }} /></div><span className="text-[14px] tnum text-zinc-300">{r.xp.toLocaleString()}</span></div>
      <span className="hidden text-[13px] tnum text-zinc-500 md:block">{r.solved ?? 0} solved</span>
      <span className="hidden items-center gap-1 text-[13px] tnum text-zinc-500 md:flex"><Flame className={cn('h-3.5 w-3.5', r.streak >= 7 ? 'text-[var(--ember)]' : 'text-zinc-700')} />{r.streak}d</span>
      <span className="text-right text-[13px] tnum text-zinc-400 md:hidden">{r.xp.toLocaleString()}</span>
      <span className="hidden text-right text-[12.5px] text-zinc-500 md:block">{r.skillsMastered}/12 mastered</span>
    </motion.div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-md text-[14px] leading-relaxed text-zinc-500">Ranked by XP — streak multipliers, daily challenges and first solves all count. Updates live when anyone earns XP.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            {[['global', 'Everyone'], ['college', 'My college']].map(([k, l]) => (
              <button key={k} onClick={() => setScope(k)} disabled={k === 'college' && !meta.collegeAvailable && scope !== 'college'} title={k === 'college' && !meta.collegeAvailable ? 'Choose your college in Profile to unlock' : ''}
                className={cn('rounded-full px-4 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40', scope === k ? 'bg-white/[0.08] text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>{l}</button>
            ))}
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a student…" className="w-44 border-b border-[var(--line-strong)] bg-transparent pb-1 text-[14px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[var(--ember)]" />
        </div>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        : rows.length === 0 ? <div className="py-16 text-center"><div className="display text-[32px] italic text-zinc-500">{scope === 'college' ? 'Nobody else from your college is here yet.' : 'No students yet.'}</div></div>
        : (
          <>
            {podium.length === 3 && (
              <div className="mb-10 grid grid-cols-3 items-end gap-3 md:gap-8">
                {[1, 0, 2].map((idx) => { const r = podium[idx]; const st = PODIUM[idx]; return (
                  <motion.div key={r.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="text-center">
                    <span className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[15px] font-semibold', r.isCurrentUser ? 'bg-[var(--ember)] text-[#1a0d07]' : 'border border-[var(--line-strong)] text-zinc-300')}>{initials(r.name)}</span>
                    <div className="mt-3 truncate text-[16px] font-medium text-zinc-100">{r.name}</div>
                    <div className="display mt-1 text-[30px] leading-none tnum" style={{ color: st.c }}>{r.xp.toLocaleString()}<span className="ml-1 text-[13px] text-zinc-600">xp</span></div>
                    <div className={cn('relative mx-auto mt-4 flex w-full items-start justify-center rounded-t-2xl border border-b-0 border-[var(--line-strong)] pt-3', st.h)} style={{ background: `linear-gradient(180deg, ${st.c}1f, transparent)` }}><span className="display text-[46px] leading-none" style={{ color: st.c }}>{idx + 1}</span></div>
                  </motion.div>
                ); })}
              </div>
            )}

            <div>{list.slice(0, query ? 50 : limit).map((r, i) => <Row key={r.userId} r={r} i={i} />)}</div>
            {!query && list.length > limit && <button onClick={() => setLimit((n) => n + 15)} className="mt-6 rounded-full border border-[var(--line-strong)] px-6 py-2.5 text-[13px] text-zinc-400 hover:text-zinc-100">Show more</button>}
            {!query && !meVisible && me && (<div className="mt-6"><div className="mb-1 text-[12px] text-zinc-600">Your place</div><Row r={me} i={0} /></div>)}
          </>
        )}
    </div>
  );
}
