import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArena } from '../../context/ArenaContext';
import { problemsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Swords, Users, SplitSquareHorizontal, Search, Copy, Check, 
  ArrowRight, Loader2, Wifi, WifiOff, Crown, Zap
} from 'lucide-react';

const MODES = [
  {
    id: 'versus',
    label: 'Versus',
    subtitle: 'Race',
    description: 'Blind competitive mode. You cannot see your opponent\'s code. First to pass all tests wins.',
    icon: Swords,
    color: 'rose'
  },
  {
    id: 'coop-shared',
    label: 'Co-op',
    subtitle: 'Shared',
    description: 'Single editor, multi-cursor. Both users edit the same document in real-time.',
    icon: Users,
    color: 'signal'
  },
  {
    id: 'coop-split',
    label: 'Co-op',
    subtitle: 'Split',
    description: 'Side-by-side editors. Code independently while watching your partner type live.',
    icon: SplitSquareHorizontal,
    color: 'amber'
  }
];

export function ArenaLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    connected, error, createRoom, joinRoom, emitStartMatch,
    roomCode, matchStatus, room, players, mode,
    isHost, hasJoinedRoom, joiningInProgress, socketRef
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

  // Fetch problems for selector
  useEffect(() => {
    problemsService.getProblems()
      .then(r => {
        const probs = r.data?.data?.problems || r.data?.data || [];
        setProblems(Array.isArray(probs) ? probs : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ─── Listen for match_started to navigate BOTH players ───
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    
    const handleMatchStarted = ({ roomId }) => {
      console.log('[ArenaLobby] arena:match_started → navigating to /arena/' + roomId);
      navigate(`/arena/${roomId}`);
    };
    
    socket.on('arena:match_started', handleMatchStarted);
    return () => {
      socket.off('arena:match_started', handleMatchStarted);
    };
  }, [socketRef?.current, navigate]);

  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return problems.filter(p => 
      p.title?.toLowerCase().includes(q) || 
      p.difficulty?.toLowerCase().includes(q) ||
      p.skillId?.name?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [problems, searchQuery]);

  const handleCreate = () => {
    if (!selectedProblem) return;
    createRoom(selectedMode, selectedProblem._id);
  };

  const handleJoin = () => {
    if (!joinCode.trim() || joiningInProgress) return;
    joinRoom(joinCode.trim());
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffColor = (d) => d === 'Easy' ? 'text-[var(--signal)]' : d === 'Hard' ? 'text-rose-400' : 'text-amber-400';

  // ════════════════════════════════════════════════════════════
  // THE PRIMARY UI GATE: hasJoinedRoom drives the view switch
  // ════════════════════════════════════════════════════════════
  const showWaitingRoom = hasJoinedRoom && matchStatus === 'waiting';

  return <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-md">
        <div className="flex items-center gap-3 text-[13px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-semibold text-zinc-200">Arena</span>
          <span className="text-zinc-600">/</span>
          <span>Lobby</span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          {connected ? (
            <span className="flex items-center gap-1.5 text-[var(--signal)]">
              <Wifi className="h-3.5 w-3.5" strokeWidth={1.5} /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400">
              <WifiOff className="h-3.5 w-3.5" strokeWidth={1.5} /> Disconnected
            </span>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && <div className="mx-10 mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[12px] text-rose-400">
        {error}
      </div>}

      {/* ═══════════════════════════════════════════════════ */}
      {/* VIEW A: WAITING ROOM (shown when hasJoinedRoom)   */}
      {/* ═══════════════════════════════════════════════════ */}
      {showWaitingRoom ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-10 py-20">

          {/* Status message — 3 deterministic states using isHost */}
          {isHost && players.length < 2 && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--signal)]" />
              <span className="text-[16px] font-medium text-zinc-200">Waiting for opponent…</span>
            </div>
          )}

          {isHost && players.length >= 2 && (
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-medium text-[var(--signal)]">✓ Opponent Joined! Ready to start.</span>
            </div>
          )}

          {!isHost && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--signal)]" />
              <span className="text-[16px] font-medium text-zinc-200">Waiting for Host to start match…</span>
            </div>
          )}

          {/* Room code card */}
          <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-[12px] text-zinc-500 mb-4 font-mono tracking-widest">ROOM CODE</p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-mono text-[48px] font-bold tracking-[0.2em] text-zinc-100">{roomCode}</span>
              <button onClick={copyCode} className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-[11px] text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-zinc-200">
                {copied ? <Check className="h-3.5 w-3.5 text-[var(--signal)]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[13px] text-zinc-500">Share this code with your partner to join.</p>

            {/* Player list */}
            <div className="mt-6 space-y-2">
              {players.map((p, i) => <div key={p.userId || i} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a3441] text-[10px] font-bold text-zinc-200">
                  {p.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-[13px] font-medium text-zinc-200">{p.name}</span>
                {i === 0 && <Crown className="h-3 w-3 text-amber-400 ml-auto" strokeWidth={2} />}
              </div>)}
            </div>

            {/* Start Match — ONLY visible for Host when room is full */}
            {isHost && players.length >= 2 && (
              <button onClick={() => emitStartMatch(roomCode)} className="mt-6 w-full rounded-lg bg-[var(--signal)] py-3 text-[14px] font-semibold text-[#0a1410] transition-all hover:brightness-110">
                Start Match
              </button>
            )}
          </div>

          {/* Mode badge */}
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span className="font-mono tracking-widest">{mode?.toUpperCase()?.replace('-', ' ')}</span>
          </div>
        </div>
      ) : (

        /* ═══════════════════════════════════════════════════ */
        /* VIEW B: CREATE / JOIN FORM (default landing)      */
        /* ═══════════════════════════════════════════════════ */
        <div className="flex-1 px-10 py-10">
          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2 text-[12px] text-zinc-500">
              <Zap className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={2} />
              <span className="font-mono tracking-widest">REAL-TIME MULTIPLAYER</span>
            </div>
            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-tight text-zinc-50 mb-3">
              The Arena.
            </h1>
            <p className="max-w-lg text-[14px] leading-relaxed text-zinc-400">
              Challenge a friend to a coding race, or pair up to solve problems together with live cursors and shared editors.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 w-fit mb-8">
            <button onClick={() => setTab('create')} className={`rounded-md px-6 py-2 text-[13px] font-medium transition-colors ${tab === 'create' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Create Match
            </button>
            <button onClick={() => setTab('join')} className={`rounded-md px-6 py-2 text-[13px] font-medium transition-colors ${tab === 'join' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Join Match
            </button>
          </div>

          {tab === 'create' ? (
            <div className="space-y-8">
              {/* Mode selection */}
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-200 mb-4">Select Mode</h3>
                <div className="grid grid-cols-3 gap-4">
                  {MODES.map(m => {
                    const Icon = m.icon;
                    const active = selectedMode === m.id;
                    const borderColor = active 
                      ? m.color === 'signal' ? 'border-[var(--signal)]/50' : m.color === 'rose' ? 'border-rose-500/50' : 'border-amber-500/50'
                      : 'border-white/[0.06]';
                    const bgColor = active
                      ? m.color === 'signal' ? 'bg-[var(--signal)]/5' : m.color === 'rose' ? 'bg-rose-500/5' : 'bg-amber-500/5'
                      : 'bg-white/[0.01]';
                    const iconColor = m.color === 'signal' ? 'text-[var(--signal)]' : m.color === 'rose' ? 'text-rose-400' : 'text-amber-400';

                    return <button 
                      key={m.id}
                      onClick={() => setSelectedMode(m.id)}
                      className={`group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all ${borderColor} ${bgColor} hover:bg-white/[0.03]`}
                    >
                      {active && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-current" style={{ color: m.color === 'signal' ? 'var(--signal)' : m.color === 'rose' ? 'rgb(244,63,94)' : 'rgb(245,158,11)' }} />}
                      <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.5} />
                      <div>
                        <div className="text-[15px] font-semibold text-zinc-100">{m.label} <span className="text-zinc-500 font-normal">· {m.subtitle}</span></div>
                        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{m.description}</p>
                      </div>
                    </button>;
                  })}
                </div>
              </div>

              {/* Problem selector */}
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-200 mb-4">Select Problem</h3>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 focus-within:border-[var(--signal)]/40">
                    <Search className="h-4 w-4 text-zinc-600" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      placeholder={selectedProblem ? selectedProblem.title : "Search problems by name, difficulty, or topic..."}
                      className="flex-1 bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                    />
                    {selectedProblem && <span className={`text-[11px] font-mono ${diffColor(selectedProblem.difficulty)}`}>{selectedProblem.difficulty?.toUpperCase()}</span>}
                  </div>

                  {searchOpen && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-[300px] overflow-y-auto rounded-lg border border-white/[0.06] bg-[#0d1117] shadow-2xl scrollbar-surgical">
                      {loading ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-zinc-600" /></div>
                      ) : filteredProblems.length === 0 ? (
                        <div className="py-6 text-center text-[12px] text-zinc-600">No problems found</div>
                      ) : filteredProblems.map(p => (
                        <button 
                          key={p._id} 
                          onClick={() => { setSelectedProblem(p); setSearchQuery(''); setSearchOpen(false); }}
                          className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03] last:border-b-0"
                        >
                          <span className={`h-2 w-2 rounded-full shrink-0 ${p.difficulty === 'Easy' ? 'bg-[var(--signal)]' : p.difficulty === 'Hard' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-zinc-200 truncate">{p.title}</div>
                            <div className="text-[11px] text-zinc-600 font-mono">{p.skillId?.name || 'General'} · {p.difficulty}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProblem && <div className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-4 py-3">
                  <span className={`h-2 w-2 rounded-full ${selectedProblem.difficulty === 'Easy' ? 'bg-[var(--signal)]' : selectedProblem.difficulty === 'Hard' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <span className="text-[13px] font-medium text-zinc-200">{selectedProblem.title}</span>
                  <span className="ml-auto text-[11px] text-zinc-500 font-mono">{selectedProblem.difficulty?.toUpperCase()}</span>
                </div>}
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={!selectedProblem || !connected}
                className={`flex items-center gap-2 rounded-lg px-8 py-3 text-[14px] font-semibold transition-all ${
                  !selectedProblem || !connected
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-[var(--signal)] text-[#0a1410] hover:brightness-110'
                }`}
              >
                <Swords className="h-4 w-4" strokeWidth={2} />
                Create Match
                <ArrowRight className="h-4 w-4 ml-1" strokeWidth={2} />
              </button>
            </div>
          ) : (
            /* ─── JOIN TAB ─── */
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-200 mb-4">Enter Room Code</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. A3F1B2"
                    maxLength={6}
                    className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 font-mono text-[20px] font-bold tracking-[0.3em] text-center text-zinc-100 placeholder:text-zinc-700 placeholder:tracking-[0.3em] focus:border-[var(--signal)]/40 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={joinCode.length < 6 || !connected || joiningInProgress}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-8 py-3 text-[14px] font-semibold transition-all ${
                  joinCode.length < 6 || !connected || joiningInProgress
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-[var(--signal)] text-[#0a1410] hover:brightness-110'
                }`}
              >
                {joiningInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    Join Match
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-10 py-4 font-mono text-[9px] tracking-[0.24em] text-zinc-700">
        <span>ARENA · v1.0</span>
        <span className={connected ? "text-[var(--signal)]" : "text-rose-400"}>{connected ? 'SOCKET OK' : 'OFFLINE'}</span>
      </div>
    </div>
  </div>;
}
