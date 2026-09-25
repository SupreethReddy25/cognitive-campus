import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useArena } from '../../context/ArenaContext';
import { problemsService, arenaService } from '../../services/api';
import { Copy, Check, ArrowRight, Loader2, Crown, Swords } from 'lucide-react';
import { Page, PrimaryButton, cn } from '../ui/kit';

const MODES = [
  { id: 'versus', n: '01', label: 'Versus', tag: 'a blind race', description: "You can't see your opponent's code. First to pass every test wins — and rating moves." },
  { id: 'coop-shared', n: '02', label: 'Together', tag: 'one shared editor', description: 'Two cursors, one document, in real time. Pair-program your way to the solution.' },
  { id: 'coop-split', n: '03', label: 'Side by side', tag: 'two editors', description: 'Code independently while watching your partner type, live.' }
];
const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };
const dkey = (d) => String(d || '').toLowerCase();

export function ArenaLobby() {
  const navigate = useNavigate();
  const {
    connected, error, createRoom, joinRoom, emitStartMatch,
    roomCode, matchStatus, players, mode,
    isHost, hasJoinedRoom, joiningInProgress, socketRef,
    isMatchmaking, findMatch, cancelMatchmaking
  } = useArena();

  const [tab, setTab] = useState('create');
  const [selectedMode, setSelectedMode] = useState('versus');
  const [joinCode, setJoinCode] = useState('');
  const [problems, setProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [arenaRating, setArenaRating] = useState(null);

  useEffect(() => {
    Promise.all([
      problemsService.getProblems({ limit: 200 }).catch(() => ({ data: [] })),
      arenaService.getRating().catch(() => ({ data: { data: { elo: 1000, rank: 'Silver' } } }))
    ]).then(([problemsRes, ratingRes]) => {
      const probs = problemsRes.data?.data?.problems || problemsRes.data?.data || [];
      setProblems(Array.isArray(probs) ? probs : []);
      setArenaRating(ratingRes.data?.data);
      setLoading(false);
    });
  }, []);

  // both players are sent into the room when the host starts the match
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return undefined;
    const handleMatchStarted = ({ roomId }) => navigate(`/arena/${roomId}`);
    socket.on('arena:match_started', handleMatchStarted);
    return () => { socket.off('arena:match_started', handleMatchStarted); };
  }, [socketRef?.current, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return problems.filter((p) => p.title?.toLowerCase().includes(q) || p.difficulty?.toLowerCase().includes(q) || p.skillId?.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [problems, searchQuery]);

  const handleCreate = () => { if (selectedProblem) createRoom(selectedMode, selectedProblem._id); };
  const handleJoin = () => { if (joinCode.trim() && !joiningInProgress) joinRoom(joinCode.trim()); };
  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showWaitingRoom = hasJoinedRoom && matchStatus === 'waiting';

  return (
    <Page>
      <header className="flex flex-wrap items-start justify-between gap-6 pt-14 md:pt-20">
        <div>
          <div className="text-[13px] text-zinc-500">Arena · real-time multiplayer</div>
          <h1 className="display mt-5 text-[clamp(52px,8vw,120px)] text-zinc-50">The <em className="text-[var(--ember)]">arena</em>.</h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-zinc-400">Race a friend to the answer, or pair up in a shared editor with live cursors.</p>
        </div>
        <div className="flex items-center gap-8 pt-2 text-right">
          {arenaRating && <div><div className="display text-[64px] leading-none tnum text-zinc-50">{arenaRating.elo}</div><div className="mt-1 text-[13px] text-zinc-500">{arenaRating.rank} rating</div></div>}
          <div className="flex items-center gap-2 text-[13px]"><span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'animate-pulse bg-rose-400')} /><span className={connected ? 'text-zinc-500' : 'text-rose-300'}>{connected ? 'Connected' : 'Connecting…'}</span></div>
        </div>
      </header>

      {error && <div className="mt-8 border-l-2 border-rose-400 pl-4 text-[14px] text-rose-300">{error}</div>}

      {showWaitingRoom ? (
        <div className="mx-auto max-w-xl pt-20 text-center">
          <div className="flex items-center justify-center gap-3 text-[17px] text-zinc-300">
            {isHost && players.length < 2 && <><Loader2 className="h-5 w-5 animate-spin text-[var(--ember)]" />Waiting for an opponent…</>}
            {isHost && players.length >= 2 && <span className="text-emerald-400">Your opponent is here. Ready when you are.</span>}
            {!isHost && <><Loader2 className="h-5 w-5 animate-spin text-[var(--ember)]" />Waiting for the host to start…</>}
          </div>
          <div className="mt-10 text-[13px] text-zinc-500">Room code</div>
          <div className="display mt-2 text-[clamp(72px,14vw,140px)] leading-none tracking-[0.12em] text-zinc-50">{roomCode}</div>
          <button onClick={copyCode} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-2 text-[13px] text-zinc-400 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy code'}</button>
          <ul className="mx-auto mt-12 max-w-sm text-left">
            {players.map((p, i) => (
              <li key={p.userId || i} className="flex items-center gap-4 border-b border-[var(--line)] py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ember)] text-[14px] font-semibold text-[#1a0d07]">{p.name?.[0]?.toUpperCase() || '?'}</span>
                <span className="display text-[26px] text-zinc-100">{p.name}</span>
                {i === 0 && <Crown className="ml-auto h-4 w-4 text-[var(--star)]" strokeWidth={2} />}
              </li>
            ))}
          </ul>
          {isHost && players.length >= 2 && <div className="mt-10 flex justify-center"><PrimaryButton onClick={() => emitStartMatch(roomCode)} icon={ArrowRight}>Start the match</PrimaryButton></div>}
          <div className="mt-8 text-[13px] text-zinc-600">{mode?.replace('-', ' ')}</div>
        </div>
      ) : (
        <div className="pt-16">
          <div className="mb-12 flex gap-1 border-b border-[var(--line-strong)] pb-3">
            {[['create', 'Create a match'], ['join', 'Join with a code']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={cn('relative rounded-full px-5 py-2 text-[14px] font-medium transition-colors', tab === k ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>
                {tab === k && <motion.span layoutId="arena-tab" className="absolute inset-0 rounded-full bg-white/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <div className="space-y-16">
              <div>
                <div className="mb-3 text-[13px] text-zinc-500">1 · Choose how you play</div>
                {MODES.map((m) => {
                  const active = selectedMode === m.id;
                  return (
                    <button key={m.id} onClick={() => setSelectedMode(m.id)} className="group relative flex w-full items-baseline gap-6 border-b border-[var(--line)] py-6 text-left">
                      <span className="display w-12 text-[30px] leading-none text-zinc-700">{m.n}</span>
                      <span className={cn('display text-[clamp(38px,5vw,68px)] leading-none transition-all duration-300', active ? 'translate-x-2 text-[var(--ember)]' : 'text-zinc-300 group-hover:text-zinc-100')}>{m.label}</span>
                      <span className="hidden text-[14px] text-zinc-600 md:inline">{m.tag}</span>
                      <span className={cn('ml-auto hidden max-w-sm text-right text-[14px] leading-snug text-zinc-500 transition-opacity md:block', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70')}>{m.description}</span>
                      {active && <motion.span layoutId="mode-underline" className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--ember)]" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="mb-3 text-[13px] text-zinc-500">2 · Choose the problem</div>
                <div className="relative">
                  <div className="flex items-center gap-4 border-b border-[var(--line-strong)] pb-3 focus-within:border-[var(--ember)]">
                    <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder={selectedProblem ? selectedProblem.title : 'Search by name, difficulty or skill…'}
                      className={cn('display w-full bg-transparent text-[34px] outline-none placeholder:text-zinc-700', selectedProblem ? 'placeholder:text-[var(--ember-soft)]' : '')} />
                    {selectedProblem && <span className="flex shrink-0 items-center gap-2 text-[13px] capitalize text-zinc-400"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[dkey(selectedProblem.difficulty)])} />{selectedProblem.difficulty}</span>}
                  </div>
                  {searchOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[340px] overflow-y-auto rounded-3xl border border-[var(--line-strong)] bg-[#141418] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] scrollbar-surgical">
                      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-600" /></div>
                        : filteredProblems.length === 0 ? <div className="py-8 text-center text-[14px] text-zinc-600">No problems found</div>
                        : filteredProblems.map((p) => (
                          <button key={p._id} onClick={() => { setSelectedProblem(p); setSearchQuery(''); setSearchOpen(false); }} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/[0.05]">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[dkey(p.difficulty)])} />
                            <span className="min-w-0 flex-1"><span className="block truncate text-[16px] text-zinc-100">{p.title}</span><span className="text-[12.5px] text-zinc-600">{p.skillId?.name || 'General'}</span></span>
                            <span className="text-[12.5px] capitalize text-zinc-500">{p.difficulty}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <PrimaryButton onClick={handleCreate} disabled={!selectedProblem || !connected} icon={Swords}>{selectedProblem ? 'Create the match' : 'Pick a problem first'}</PrimaryButton>
            </div>
          ) : (
            <div className="max-w-2xl space-y-16">
              <div>
                <div className="mb-3 text-[13px] text-zinc-500">Room code</div>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="A3F1B2" maxLength={6}
                  className="display w-full border-b border-[var(--line-strong)] bg-transparent pb-3 text-[clamp(64px,11vw,120px)] uppercase leading-none tracking-[0.12em] text-zinc-50 outline-none placeholder:text-zinc-800 focus:border-[var(--ember)]" />
                <div className="mt-8"><PrimaryButton onClick={handleJoin} disabled={joinCode.length < 6 || !connected || joiningInProgress} icon={joiningInProgress ? Loader2 : ArrowRight}>{joiningInProgress ? 'Joining…' : 'Join the match'}</PrimaryButton></div>
              </div>

              <div className="border-t border-[var(--line)] pt-10">
                <div className="display text-[36px] text-zinc-100">No code? Get matched.</div>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-zinc-500">Join the automatch queue and we&apos;ll pair you with a random opponent for a Versus race.</p>
                {isMatchmaking
                  ? <button onClick={cancelMatchmaking} className="mt-6 flex items-center gap-3 rounded-full border border-rose-400/40 px-6 py-3 text-[14px] text-rose-300 transition-colors hover:bg-rose-400/10"><Loader2 className="h-4 w-4 animate-spin" />Searching for an opponent… cancel</button>
                  : <button onClick={findMatch} disabled={!connected} className="mt-6 rounded-full border border-[var(--line-strong)] px-6 py-3 text-[14px] text-zinc-300 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)] disabled:opacity-40">Find me a match</button>}
              </div>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
