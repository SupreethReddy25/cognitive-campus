import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useArena } from '../../context/ArenaContext';
import { useAuth } from '../../context/AuthContext';
import { problemsService, arenaService, skillsService } from '../../services/api';
import { Copy, Check, ArrowRight, Loader2, Crown, Swords, Link2, Shuffle, Search, LogOut } from 'lucide-react';
import { Page, PageHead, CountUp, cn } from '../ui/kit';
import { CodeInput, DOT, EASE, EloTrend, ModeArt, Radar, RankLadder, TIERS, dkey, spot, tierOf } from './arena-ui';

const MODES = [
  { id: 'versus', label: 'Versus', tag: 'Rated · 1v1', line: 'A blind race', text: "Same problem, hidden screens. First to pass every test wins — and your rating moves." },
  { id: 'coop-shared', label: 'Together', tag: 'Unrated · 2', line: 'One shared editor', text: 'Two cursors, one document. Pair-program it, or run a mock interview — one drives, one asks.' },
  { id: 'coop-split', label: 'Side by side', tag: 'Unrated · 2', line: 'Two editors, live', text: 'Solve on your own while watching your partner’s code appear as they type.' }
];

const spotProps = { onPointerMove: spot };
const EMPTY_RATING = { elo: 1000, wins: 0, losses: 0, draws: 0, matchHistory: [] };
const pctOf = (x) => `${Math.round((x || 0) * 100)}%`;

function Step({ n, title, hint, children, right }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-6">
        <div className="flex items-baseline gap-4">
          <span className="tag !text-[var(--signal)]">{n}</span>
          <h2 className="display text-[clamp(24px,2.6vw,34px)] text-zinc-100">{title}</h2>
          {hint && <span className="hidden text-[13px] text-zinc-600 md:inline">{hint}</span>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Tabs({ id, value, onChange, options }) {
  return (
    <div className="flex border border-white/[0.09]">
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={cn('relative px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors duration-300', value === k ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>
          {value === k && <motion.span layoutId={`tabs-${id}`} className="absolute inset-0 bg-white/[0.08]" transition={{ type: 'spring', stiffness: 460, damping: 38 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────── standing ────────────────────────────── */

function Standing({ rating, board, loading }) {
  const elo = rating?.elo ?? 1000;
  const tier = tierOf(elo);
  const w = rating?.wins || 0; const l = rating?.losses || 0; const d = rating?.draws || 0;
  const games = w + l + d;
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="mt-14 grid divide-y divide-[var(--line)] border border-[var(--line)] md:grid-cols-[1.3fr_0.8fr_1.3fr] md:divide-x md:divide-y-0">
      <div className="p-7">
        <div className="tag">Your rating</div>
        <div className="mt-3 flex items-end gap-4">
          <CountUp value={elo} className="display text-[clamp(56px,6vw,80px)] leading-none tnum text-zinc-50" />
          <span className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: tier.color }}>{tier.name}</span>
        </div>
        <div className="tag mt-2 !text-zinc-600">{board?.me ? `Ranked #${board.me.rank} of ${board.total}` : loading ? ' ' : 'Unranked — play a match'}</div>
        <div className="mt-7"><RankLadder elo={elo} /></div>
      </div>
      <div className="p-7">
        <div className="tag">Record</div>
        <div className="mt-4 flex gap-7">
          {[['Won', w, '#34d399'], ['Lost', l, '#fb7185'], ['Drawn', d, '#a1a1aa']].map(([k, v, c]) => (
            <div key={k}><div className="display text-[40px] leading-none tnum" style={{ color: v ? c : '#52525b' }}>{v}</div><div className="tag mt-2 !text-[9.5px]">{k}</div></div>
          ))}
        </div>
        <div className="mt-7 flex h-[3px] gap-[2px] bg-white/[0.05]">
          {games > 0 && [[w, '#34d399'], [d, '#a1a1aa'], [l, '#fb7185']].map(([v, c], i) => v > 0 && <motion.span key={i} className="h-full" style={{ background: c }} initial={{ width: 0 }} animate={{ width: `${(v / games) * 100}%` }} transition={{ duration: 1.2, delay: 0.5, ease: EASE }} />)}
        </div>
        <div className="mt-3 text-[13px] text-zinc-500">{games ? <><span className="tnum text-zinc-200">{Math.round((w / games) * 100)}%</span> win rate over {games} {games === 1 ? 'match' : 'matches'}</> : 'No matches yet.'}</div>
      </div>
      <div className="flex flex-col p-7">
        <div className="tag">Rating curve · last {Math.min(10, rating?.matchHistory?.length || 0) || 10}</div>
        <div className="mt-4 min-h-[128px] flex-1"><EloTrend history={rating?.matchHistory || []} elo={elo} /></div>
      </div>
    </motion.section>
  );
}

/* ────────────────────────────── challenge ────────────────────────────── */

function ProblemRow({ p, selected, onPick, note, lid }) {
  const co = (p.companies || []).slice(0, 2);
  return (
    <button onClick={() => onPick(p)} {...spotProps} className={cn('spot group relative flex w-full items-center gap-4 border-b border-[var(--line)] px-4 py-3.5 text-left transition-colors duration-300', selected ? 'bg-white/[0.045]' : 'hover:bg-white/[0.02]')}>
      {selected && <motion.span layoutId={`pick-${lid}`} className="absolute inset-y-0 left-0 w-[2px] bg-[var(--signal)]" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
      <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[dkey(p.difficulty)])} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] text-zinc-100 transition-transform duration-300 group-hover:translate-x-1">{p.title}</span>
        <span className="tag !text-[9.5px] !tracking-[0.14em]">{note || p.skillId?.name || 'General'}</span>
      </span>
      <span className="hidden gap-2 md:flex">{co.map((c) => <span key={c} className="tag !text-[9.5px] !tracking-[0.12em] border border-white/[0.08] px-1.5 py-0.5">{c}</span>)}</span>
      <span className="tag hidden w-14 text-right capitalize sm:block">{p.difficulty}</span>
      <span className={cn('flex h-5 w-5 items-center justify-center border transition-all duration-300', selected ? 'border-[var(--signal)] bg-[var(--signal)] text-black' : 'border-white/[0.14] text-transparent group-hover:border-white/40')}><Check className="h-3 w-3" strokeWidth={3} /></span>
    </button>
  );
}

function Challenge({ problems, loading, picks, companies, selected, onSelect }) {
  const [tab, setTab] = useState('foryou');
  const [co, setCo] = useState('');
  const [diff, setDiff] = useState('all');
  const [q, setQ] = useState('');
  const [flash, setFlash] = useState(null);
  const rolling = !!flash;
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const company = co || companies[0]?.[0] || '';

  const byCompany = useMemo(() => problems.filter((p) => (p.companies || []).includes(company)).sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, 7), [problems, company]);
  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return problems.slice(0, 7);
    return problems.filter((p) => p.title?.toLowerCase().includes(s) || p.skillId?.name?.toLowerCase().includes(s) || (p.companies || []).some((c) => c.toLowerCase().includes(s))).slice(0, 8);
  }, [problems, q]);

  const roll = () => {
    const pool = problems.filter((p) => diff === 'all' || dkey(p.difficulty) === diff);
    if (!pool.length || rolling) return;
    let n = 0;
    timer.current = setInterval(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (++n >= 16) { clearInterval(timer.current); setFlash(null); onSelect(pick); } else setFlash(pick);
    }, 75);
  };

  const empty = (t) => <div className="border-b border-[var(--line)] px-4 py-10 text-center text-[14px] text-zinc-600">{t}</div>;
  return (
    <div>
      <Tabs id="challenge" value={tab} onChange={setTab} options={[['foryou', 'For you'], ['company', 'Company round'], ['random', 'Surprise me'], ['search', 'Search']]} />
      <div className="mt-2 min-h-[320px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.35, ease: EASE }}>
            {loading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-zinc-600" /></div>
              : tab === 'foryou' ? (
                picks.length ? picks.map((g) => (
                  <div key={g.key} className="pt-5 first:pt-4">
                    <div className="mb-1 flex items-center gap-3 px-4"><span className="tag !text-zinc-400">{g.title}</span><span className="text-[12.5px] text-zinc-600">{g.sub}</span></div>
                    {g.items.map((p) => <ProblemRow key={p._id} p={p} selected={selected?._id === p._id} onPick={onSelect} lid="foryou" note={g.noteFor?.(p)} />)}
                  </div>
                )) : empty('No problems yet.')
              ) : tab === 'company' ? (
                <div className="pt-4">
                  <div className="mb-2 flex flex-wrap gap-2 px-4">
                    {companies.slice(0, 9).map(([c, n]) => (
                      <button key={c} onClick={() => setCo(c)} className={cn('relative border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors duration-300', company === c ? 'border-white/40 text-zinc-50' : 'border-white/[0.09] text-zinc-500 hover:border-white/25 hover:text-zinc-200')}>
                        {c} <span className="ml-1 text-zinc-600">{n}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mb-1 px-4 text-[13px] text-zinc-600">The questions {company} is asked about most — pick one and play it like the real round.</p>
                  {byCompany.map((p) => <ProblemRow key={p._id} p={p} selected={selected?._id === p._id} onPick={onSelect} lid="company" note={`${company} · asked ${p.frequency || 0}×`} />)}
                </div>
              ) : tab === 'random' ? (
                <div className="px-4 pt-6">
                  <div className="flex flex-wrap items-center gap-5">
                    <Tabs id="roll-diff" value={diff} onChange={setDiff} options={[['all', 'Any'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']]} />
                    <button onClick={roll} disabled={rolling} className="btn-line group"><Shuffle className={cn('h-3.5 w-3.5', rolling && 'animate-spin')} strokeWidth={1.8} />{rolling ? 'Rolling' : 'Roll a problem'}</button>
                  </div>
                  <div className="mt-8 flex min-h-[112px] items-center border-y border-[var(--line)]">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div key={flash?._id || selected?._id || 'none'} initial={{ opacity: 0, y: rolling ? 14 : 0, filter: rolling ? 'blur(3px)' : 'blur(0px)' }} animate={{ opacity: rolling ? 0.55 : 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -14 }} transition={{ duration: rolling ? 0.07 : 0.4, ease: EASE }} className="display text-[clamp(28px,3.4vw,46px)] leading-tight text-zinc-100">
                        {flash?.title || selected?.title || <span className="text-zinc-700">Leave it to chance.</span>}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="pt-4">
                  <div className="mx-4 flex items-center gap-3 border-b border-white/[0.14] pb-3 focus-within:border-[var(--signal)]">
                    <Search className="h-4 w-4 text-zinc-600" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, skill or company…" className="display w-full bg-transparent text-[24px] outline-none placeholder:text-zinc-700" />
                  </div>
                  {found.length ? found.map((p) => <ProblemRow key={p._id} p={p} selected={selected?._id === p._id} onPick={onSelect} lid="search" />) : empty('Nothing matches that.')}
                </div>
              )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ────────────────────────────── side rail ────────────────────────────── */

function RailBox({ title, right, children, className = '', ...rest }) {
  return (
    <section className={cn('border border-[var(--line)] p-6', className)} {...rest}>
      <div className="mb-5 flex items-center justify-between"><h3 className="tag !text-zinc-400">{title}</h3>{right}</div>
      {children}
    </section>
  );
}

function JoinBox({ code, setCode, onJoin, joining, connected, focus }) {
  return (
    <RailBox title="Join with a code">
      <CodeInput value={code} onChange={setCode} onEnter={onJoin} autoFocus={focus} />
      <button onClick={onJoin} disabled={code.length < 6 || !connected || joining} className="btn-line group mt-5 w-full justify-between">
        {joining ? 'Joining…' : 'Join the match'}{joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />}
      </button>
    </RailBox>
  );
}

function AutoMatch({ searching, onFind, onCancel, connected }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!searching) { setSec(0); return undefined; }
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [searching]);
  return (
    <RailBox title="Automatch" className="spot" {...spotProps}>
      <div>
        <AnimatePresence mode="wait" initial={false}>
          {searching ? (
            <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-5">
              <Radar />
              <div className="flex-1"><div className="text-[15px] text-zinc-200">Looking for an opponent…</div><div className="tag mt-1 tnum">{String(Math.floor(sec / 60)).padStart(2, '0')}:{String(sec % 60).padStart(2, '0')}</div></div>
              <button onClick={onCancel} className="tag !text-rose-300 transition-colors hover:!text-rose-200">Cancel</button>
            </motion.div>
          ) : (
            <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[14px] leading-relaxed text-zinc-500">No code and no friend online? We’ll pair you with anyone in the queue for a rated Versus race.</p>
              <button onClick={onFind} disabled={!connected} className="btn-line group mt-5 w-full justify-between">Find me a match<Swords className="h-3.5 w-3.5" strokeWidth={1.8} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RailBox>
  );
}

function Ladder({ board }) {
  const rows = board?.leaderboard || [];
  const me = board?.me;
  const tierColor = (n) => TIERS.find((t) => t.name === n)?.color || '#a1a1aa';
  return (
    <RailBox title="The ladder" right={board?.total ? <span className="tag !text-zinc-600">{board.total} ranked</span> : null}>
      {!rows.length ? <div className="text-[14px] text-zinc-600">Nobody is ranked yet — be the first.</div> : (
        <ul className="-mx-2">
          {rows.slice(0, 5).map((r, i) => (
            <motion.li key={r.userId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: EASE }} {...spotProps}
              className={cn('spot flex items-center gap-3 px-2 py-2.5 transition-colors', r.isCurrentUser && 'bg-white/[0.04]')}>
              <span className={cn('tag w-5 tnum', i === 0 && '!text-[#fbbf24]')}>{r.rank}</span>
              <span className="min-w-0 flex-1"><span className={cn('block truncate text-[14.5px]', r.isCurrentUser ? 'text-zinc-50' : 'text-zinc-300')}>{r.isCurrentUser ? 'You' : r.name}</span>{r.college && <span className="tag !text-[9px] !tracking-[0.14em]">{r.college}</span>}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tierColor(r.tier) }} />
              <span className="display w-12 text-right text-[18px] tnum text-zinc-200">{r.elo}</span>
            </motion.li>
          ))}
          {me && !rows.slice(0, 5).some((r) => r.isCurrentUser) && (
            <li className="mt-1 flex items-center gap-3 border-t border-[var(--line)] bg-white/[0.04] px-2 py-2.5"><span className="tag w-5 tnum">{me.rank}</span><span className="flex-1 text-[14.5px] text-zinc-50">You</span><span className="display w-12 text-right text-[18px] tnum text-zinc-200">{me.elo}</span></li>
          )}
        </ul>
      )}
    </RailBox>
  );
}

function Recent({ history }) {
  const list = [...(history || [])].reverse().slice(0, 5);
  return (
    <RailBox title="Recent matches">
      {!list.length ? <div className="text-[14px] leading-relaxed text-zinc-600">Your matches will be listed here, with the problem so you can practise what beat you.</div> : (
        <ul className="-mx-2">
          {list.map((m, i) => {
            const c = m.result === 'win' ? '#34d399' : m.result === 'loss' ? '#fb7185' : '#a1a1aa';
            const pid = m.problemId?._id;
            const Row = pid ? Link : 'div';
            return (
              <li key={m._id || i}>
                <Row {...(pid ? { to: `/problems/${pid}` } : {})} {...spotProps} className="spot group flex items-center gap-3 px-2 py-2.5 transition-colors">
                  <span className="flex h-7 w-7 items-center justify-center border font-mono text-[11px] font-semibold" style={{ borderColor: `${c}66`, color: c }}>{m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[14px] text-zinc-300">vs {m.opponentName || m.opponentId?.name || 'Opponent'}</span><span className="tag block truncate !text-[9px] !tracking-[0.12em]">{m.problemId?.title || 'Problem'}</span></span>
                  <span className="tnum text-[13px]" style={{ color: c }}>{m.eloChange > 0 ? '+' : ''}{m.eloChange ?? 0}</span>
                </Row>
              </li>
            );
          })}
        </ul>
      )}
    </RailBox>
  );
}

/* ────────────────────────────── waiting room ────────────────────────────── */

function Slot({ player, you, host, index }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {player ? (
          <>
            <motion.span key={player.userId} className="absolute inset-0 rounded-full border" style={{ borderColor: you ? 'var(--signal)' : 'rgba(255,255,255,0.3)' }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} />
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }} className={cn('display flex h-[84px] w-[84px] items-center justify-center rounded-full text-[38px]', you ? 'bg-[var(--signal)] text-[#04130d]' : 'bg-white text-black')}>{player.name?.[0]?.toUpperCase() || '?'}</motion.span>
            {host && <Crown className="absolute -right-1 top-1 h-4 w-4 text-[#fbbf24]" strokeWidth={2} />}
          </>
        ) : (
          <>
            <Radar size={112} />
            <span className="absolute h-[84px] w-[84px] rounded-full border border-dashed border-white/20" />
          </>
        )}
      </div>
      <div className="display mt-5 text-[26px] leading-tight text-zinc-100">{player ? (you ? 'You' : player.name) : <span className="text-zinc-600">Waiting…</span>}</div>
      <div className="tag mt-1.5 !text-[9.5px]">{player ? (you ? player.name : host ? 'Host' : 'Opponent') : `Player ${index + 1}`}</div>
    </div>
  );
}

function WaitingRoom({ roomCode, players, isHost, mode, room, user, onStart, onLeave }) {
  const [copied, setCopied] = useState('');
  const [problem, setProblem] = useState(null);
  useEffect(() => {
    if (!room?.problemId) return;
    problemsService.getProblemById(room.problemId).then((r) => setProblem(r.data?.data?.problem || r.data?.data || null)).catch(() => {});
  }, [room?.problemId]);
  const me = players.find((p) => p.userId === user?._id) || players[0];
  const opp = players.find((p) => p.userId !== me?.userId);
  const link = `${window.location.origin}/arena?join=${roomCode}`;
  const copy = (kind, text) => { navigator.clipboard?.writeText(text); setCopied(kind); setTimeout(() => setCopied(''), 1800); };
  const meta = MODES.find((m) => m.id === mode);
  const ready = players.length >= 2;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-4xl pt-14 pb-10">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <Slot player={me} you host={isHost} index={0} />
        <div className="flex flex-col items-center gap-3"><span className="h-10 w-px bg-white/[0.14]" /><span className="display text-[22px] italic text-zinc-600">{mode === 'versus' ? 'vs' : '&'}</span><span className="h-10 w-px bg-white/[0.14]" /></div>
        <Slot player={opp} host={!isHost && !!opp} index={1} />
      </div>

      <div className="mt-16 text-center">
        <div className="tag">Room code</div>
        <div className="mt-4 flex justify-center gap-2.5">
          {roomCode?.split('').map((c, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 16, rotateX: -60 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.6, ease: EASE }} className="display flex h-[clamp(52px,8vw,84px)] w-[clamp(40px,6.4vw,66px)] items-center justify-center border border-white/[0.16] text-[clamp(28px,4.6vw,46px)] text-zinc-50">{c}</motion.span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => copy('code', roomCode)} className="btn-line group">{copied === 'code' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}{copied === 'code' ? 'Copied' : 'Copy code'}</button>
          <button onClick={() => copy('link', link)} className="btn-line group">{copied === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}{copied === 'link' ? 'Link copied' : 'Copy invite link'}</button>
        </div>
      </div>

      <div className="mx-auto mt-14 grid max-w-2xl gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
        <div className="bg-[#0a0a0a] p-5"><div className="tag">Mode</div><div className="display mt-2 text-[24px] text-zinc-100">{meta?.label || mode}</div><div className="mt-1 text-[13px] text-zinc-500">{meta?.line}</div></div>
        <div className="bg-[#0a0a0a] p-5"><div className="tag">Problem</div>{problem ? <><div className="display mt-2 truncate text-[24px] text-zinc-100">{problem.title}</div><div className="mt-1 flex items-center gap-2 text-[13px] capitalize text-zinc-500"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[dkey(problem.difficulty)])} />{problem.difficulty}{problem.skillId?.name && <> · {problem.skillId.name}</>}</div></> : <div className="mt-3 h-6 w-2/3 animate-pulse bg-white/[0.05]" />}</div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-5">
        <AnimatePresence mode="wait" initial={false}>
          {isHost && ready ? <motion.div key="go" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><button onClick={onStart} className="btn-line btn-solid group text-[11.5px]">Start the match<ArrowRight className="h-3.5 w-3.5" strokeWidth={2} /></button></motion.div>
            : <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-[15px] text-zinc-400"><Loader2 className="h-4 w-4 animate-spin text-[var(--signal)]" />{isHost ? 'Share the code — the match starts when they arrive.' : ready ? 'Waiting for the host to start…' : 'Joining…'}</motion.div>}
        </AnimatePresence>
        <button onClick={onLeave} className="tag flex items-center gap-2 transition-colors hover:!text-zinc-200"><LogOut className="h-3 w-3" />{isHost ? 'Cancel this match' : 'Leave the room'}</button>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────── page ────────────────────────────── */

export function ArenaLobby() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { connected, error, createRoom, joinRoom, emitStartMatch, leaveRoom, roomCode, room, matchStatus, players, mode, isHost, hasJoinedRoom, joiningInProgress, socketRef, isMatchmaking, findMatch, cancelMatchmaking } = useArena();

  const [selectedMode, setSelectedMode] = useState('versus');
  const [joinCode, setJoinCode] = useState((params.get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  const [problems, setProblems] = useState([]);
  const [states, setStates] = useState([]);
  const [rating, setRating] = useState(null);
  const [board, setBoard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // each panel fills in as its own request lands, so a slow problem list never holds the rating back
  useEffect(() => {
    arenaService.getRating().then((r) => setRating(r.data?.data || EMPTY_RATING)).catch(() => setRating(EMPTY_RATING));
    arenaService.getLeaderboard().then((r) => setBoard(r.data?.data || null)).catch(() => {});
    skillsService.getMySkillStates().then((r) => setStates(r.data?.data?.skillStates || [])).catch(() => {});
    problemsService.getProblems({ limit: 200 }).then((r) => {
      const probs = r.data?.data?.problems || r.data?.data || [];
      setProblems(Array.isArray(probs) ? probs : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // both players are sent into the room when the host starts the match
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return undefined;
    const started = ({ roomId }) => navigate(`/arena/${roomId}`);
    socket.on('arena:match_started', started);
    return () => { socket.off('arena:match_started', started); };
  }, [socketRef?.current, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const companies = useMemo(() => {
    const c = new Map();
    problems.forEach((p) => (p.companies || []).forEach((n) => c.set(n, (c.get(n) || 0) + 1)));
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [problems]);

  // recommendations: two problems from each of your three weakest skills, pitched to how well you know them
  const picks = useMemo(() => {
    const byFreq = (a, b) => (b.frequency || 0) - (a.frequency || 0);
    const weak = states.filter((s) => s.attempts > 0 && s.skillId).sort((a, b) => a.masteryP - b.masteryP).slice(0, 3);
    const groups = weak.map((s, i) => {
      const want = s.masteryP < 0.4 ? ['easy', 'medium'] : s.masteryP < 0.7 ? ['medium'] : ['medium', 'hard'];
      const items = problems.filter((p) => p.skillId?._id === s.skillId._id && want.includes(dkey(p.difficulty))).sort(byFreq).slice(0, 2);
      return { key: s.skillId._id, title: s.skillId.name, sub: `${pctOf(s.masteryP)} mastery${i === 0 ? ' — your weakest' : ''}`, items };
    }).filter((g) => g.items.length);
    if (groups.length) return groups;
    const items = [...problems].filter((p) => dkey(p.difficulty) !== 'hard').sort(byFreq).slice(0, 5);
    return items.length ? [{ key: 'top', title: 'Most asked', sub: 'across all companies', items }] : [];
  }, [problems, states]);

  useEffect(() => { if (!selected && picks[0]?.items[0]) setSelected(picks[0].items[0]); }, [picks]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = () => { if (joinCode.length === 6 && !joiningInProgress) joinRoom(joinCode); };
  const inRoom = hasJoinedRoom && matchStatus === 'waiting';
  const md = MODES.find((m) => m.id === selectedMode);

  return (
    <Page>
      <PageHead kicker="Arena · real-time" title={<>The <em className="text-[var(--signal)]">arena</em>.</>} lead="Race a friend to the answer, pair up in a shared editor, or take a company’s favourite question into a live round."
        right={<div className="flex items-center gap-2 pb-2"><span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'animate-pulse bg-rose-400')} /><span className="tag">{connected ? 'Connected' : 'Connecting…'}</span></div>} />

      {error && <div className="mt-8 border-l-2 border-rose-400 pl-4 text-[14px] text-rose-300">{error}</div>}

      {inRoom ? (
        <WaitingRoom roomCode={roomCode} players={players} isHost={isHost} mode={mode} room={room} user={user} onStart={() => emitStartMatch(roomCode)} onLeave={leaveRoom} />
      ) : (
        <>
          {rating ? <Standing rating={rating} board={board} loading={false} /> : <div className="mt-14 h-[330px] animate-pulse border border-[var(--line)] bg-white/[0.01]" />}

          <div className="mt-20 grid gap-16 pb-24 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-20">
            <div className="space-y-20">
              <Step n="01" title="How do you want to play?">
                <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
                  {MODES.map((m) => {
                    const on = selectedMode === m.id;
                    return (
                      <button key={m.id} onClick={() => setSelectedMode(m.id)} {...spotProps} className={cn('spot group relative flex flex-col bg-[#0a0a0a] text-left transition-colors duration-500', on ? 'bg-[#0f0f0f]' : 'hover:bg-[#0d0d0d]')}>
                        {on && <motion.span layoutId="mode-on" className="absolute inset-x-0 top-0 h-[2px] bg-[var(--signal)]" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                        <div className={cn('relative h-[128px] border-b border-[var(--line)] transition-opacity duration-500', on ? 'opacity-100' : 'opacity-50 group-hover:opacity-90')}><ModeArt id={m.id} /></div>
                        <div className="flex-1 p-6">
                          <div className="flex items-center justify-between"><span className="tag !text-[9.5px]">{m.tag}</span><span className={cn('flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-300', on ? 'border-[var(--signal)] bg-[var(--signal)]' : 'border-white/[0.2]')}>{on && <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />}</span></div>
                          <div className={cn('display mt-4 text-[30px] leading-none transition-transform duration-500', on ? 'translate-x-1 text-zinc-50' : 'text-zinc-300 group-hover:translate-x-1')}>{m.label}</div>
                          <div className="mt-2 text-[13.5px] text-zinc-400">{m.line}</div>
                          <p className="mt-4 text-[13.5px] leading-relaxed text-zinc-600">{m.text}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Step>

              <Step n="02" title="Pick the challenge" hint="Recommended from your weakest skills">
                <Challenge problems={problems} loading={loading} picks={picks} companies={companies} selected={selected} onSelect={setSelected} />
              </Step>

              <motion.div layout className="sticky bottom-5 z-10 flex flex-wrap items-center gap-x-8 gap-y-4 border border-white/[0.14] bg-[#0a0a0a]/90 px-6 py-4 backdrop-blur-xl">
                <div className="min-w-0 flex-1">
                  <div className="tag !text-[9.5px]">{md.label} · {md.tag}</div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={selected?._id || 'none'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-1 flex items-center gap-3">
                      {selected ? <><span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[dkey(selected.difficulty)])} /><span className="display truncate text-[22px] text-zinc-50">{selected.title}</span><span className="tag hidden capitalize sm:inline">{selected.difficulty}</span></> : <span className="text-[15px] text-zinc-600">Choose a problem above</span>}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <button onClick={() => selected && createRoom(selectedMode, selected._id)} disabled={!selected || !connected} className="btn-line btn-solid group">{connected ? 'Create the match' : 'Connecting…'}<Swords className="h-3.5 w-3.5" strokeWidth={2} /></button>
              </motion.div>
            </div>

            <aside className="space-y-6">
              <JoinBox code={joinCode} setCode={setJoinCode} onJoin={handleJoin} joining={joiningInProgress} connected={connected} focus={!!params.get('join')} />
              <AutoMatch searching={isMatchmaking} onFind={findMatch} onCancel={cancelMatchmaking} connected={connected} />
              <Ladder board={board} />
              <Recent history={rating?.matchHistory} />
            </aside>
          </div>
        </>
      )}
    </Page>
  );
}
