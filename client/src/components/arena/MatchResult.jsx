import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { RankLadder, EASE, tierOf } from './arena-ui';
import { cn } from '../ui/kit';

/** Counts from the old rating to the new one, so the swing is felt rather than read. */
function Swing({ before, after }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = animate(before, after, { duration: 1.6, delay: 0.9, ease: EASE, onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v); } });
    return () => c.stop();
  }, [before, after]);
  return <span ref={ref} className="display text-[clamp(64px,9vw,112px)] leading-none tnum text-zinc-50">{before}</span>;
}

/** The end-of-match screen: who won, how the rating moved, how far each player got. */
export default function MatchResult({ iWon, winner, players, myId, ratings, mode, time, problemId }) {
  const mine = ratings?.[myId];
  const draw = !winner;
  const me = players.find((p) => p.userId === myId);
  const opp = players.find((p) => p.userId !== myId);
  const coop = mode !== 'versus';
  const title = coop ? <>Well <em className="text-[var(--signal)]">played</em>.</> : draw ? <>A <em className="text-[var(--signal)]">draw</em>.</> : iWon ? <>Victor<em className="text-[var(--signal)]">y</em>.</> : <>Match <em className="text-zinc-500">over</em>.</>;
  const line = coop ? 'Nobody’s rating moves in this mode — the point was the conversation.'
    : iWon ? 'You passed every test first.' : winner ? `${winner.name} finished first. Read the editorial, then come back for a rematch.` : 'Nobody finished.';

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-2 overflow-y-auto px-8 py-12 text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="tag">{coop ? 'Session complete' : 'Final result'} · {time}</motion.div>
      <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="display mt-4 text-[clamp(52px,9vw,120px)] text-zinc-50">{title}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-md text-[16px] leading-relaxed text-zinc-400">{line}</motion.p>

      {mine && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE }} className="mt-10 w-full max-w-md border border-[var(--line)] p-7">
          <div className="tag">Rating</div>
          <div className="mt-3 flex items-end justify-center gap-4">
            <Swing before={mine.before} after={mine.after} />
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className={cn('mb-3 font-mono text-[15px]', mine.delta > 0 ? 'text-emerald-400' : mine.delta < 0 ? 'text-rose-400' : 'text-zinc-400')}>{mine.delta > 0 ? '+' : ''}{mine.delta}</motion.span>
          </div>
          <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.2em]" style={{ color: tierOf(mine.after).color }}>{tierOf(mine.after).name}</div>
          <div className="mt-6 text-left"><RankLadder elo={mine.after} /></div>
        </motion.div>
      )}

      {players.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 grid w-full max-w-md grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)]">
          {[[me, 'You'], [opp, opp?.name?.split(' ')[0] || 'Opponent']].map(([p, label], i) => (
            <div key={i} className="bg-[#0a0a0a] p-4 text-left">
              <div className="tag !text-[9.5px]">{label}</div>
              <div className="display mt-1 text-[28px] tnum text-zinc-100">{p?.progress ?? 0}<span className="text-[15px] text-zinc-600"> / {p?.totalTests ?? '—'}</span></div>
              <div className="tag !text-[9px]">tests passed</div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Link to="/arena" className="btn-line group">Back to the arena<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></Link>
        {problemId && <Link to={`/problems/${problemId}`} className="text-[15px] text-zinc-400 transition-colors hover:text-[var(--signal)]">Practise it solo →</Link>}
      </motion.div>
    </div>
  );
}
