import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { skillsService, usersService, submissionsService, problemsService } from "../../services/api";
import { Link, useNavigate } from 'react-router-dom';
import { useSessionTracker } from "../../hooks/useSessionTracker";
import { 
  ArrowUpRight, Zap, Flame, CircleCheckBig, Search, Bell, Command,
  ArrowRight, Target, Loader2, Trophy, Clock, Activity, Swords,
  ChevronRight, Sparkles
} from "lucide-react";
import { ActivityHeatmap } from "../ui/activity-heatmap";
import { LeaderboardView } from "../leaderboard/leaderboard-view";



export function DashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getLastSession } = useSessionTracker();
  const lastSession = useMemo(() => getLastSession(), []); // Stable, only runs once on mount
  const [skillStates, setSkillStates] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recentSubs, setRecentSubs] = useState([]);
  const [focusedCard, setFocusedCard] = useState(null);
  
  // Dynamic greeting state (Zero-latency cache)
  const [greetingData, setGreetingData] = useState(() => {
    const cached = localStorage.getItem('cached_ai_quote');
    if (cached) {
      try { 
        const parsed = JSON.parse(cached); 
        if (parsed && parsed.text && parsed.highlight) return parsed;
      } catch(e) {}
    }
    return { text: "Ready when you are, ", highlight: "let's go", highlightColor: "#34d399", suffix: "." };
  });
  const [greetingKey, setGreetingKey] = useState(0);
  const [greetingContext, setGreetingContext] = useState(null); // stores lastPath if quote was problem-based

  const [allSubmissions, setAllSubmissions] = useState([]);

  useEffect(() => {
    const context = {
      lastPath: lastSession?.path,
      timestamp: lastSession?.timestamp
    };
    // Fetch dynamic AI quote ONCE on mount with context
    usersService.getDashboardQuote(context)
      .then(r => {
        if (r.data?.data && r.data.data.text && r.data.data.highlight) {
          const quote = r.data.data;
          setGreetingData(quote);
          setGreetingKey(prev => prev + 1);
          // If backend flagged this as context-based, store the path for click-to-navigate
          if (quote.contextPath) setGreetingContext(quote.contextPath);
          const toCache = { text: quote.text, highlight: quote.highlight, highlightColor: quote.highlightColor, suffix: quote.suffix };
          localStorage.setItem('cached_ai_quote', JSON.stringify(toCache));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    skillsService.getMySkillStates()
      .then(r => setSkillStates(r.data?.data?.skillStates || []))
      .catch(() => {});
    usersService.getRecommendations()
      .then(r => {
        const recs = r.data?.data?.recommendations || r.data?.data || [];
        setRecommendations(Array.isArray(recs) ? recs : []);
      })
      .catch(() => setRecommendations([]))
      .finally(() => setRecsLoading(false));
    problemsService.getProblems()
      .then(r => {
        const probs = r.data?.data?.problems || r.data?.data || [];
        setTotalProblems(Array.isArray(probs) ? probs.length : 0);
      })
      .catch(() => {});
    submissionsService.getHistory({ limit: 500 })
      .then(r => {
        const subs = r.data?.data?.submissions || r.data?.data || [];
        const validSubs = Array.isArray(subs) ? subs : [];
        setAllSubmissions(validSubs);
        setRecentSubs(validSubs.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const displayName = user?.name?.split(' ')[0] || 'User';
  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const streak = user?.streak || 0;
  const tier = level >= 40 ? "Legend" : level >= 30 ? "Archon" : level >= 15 ? "Adept" : "Apprentice";
  const xpToNext = (level + 1) * 100;
  const masteredCount = skillStates.filter(s => (s.masteryP || 0) >= 0.85).length;
  
  // Heatmap Data — pass raw date map to component (it handles cell layout internally)
  const { dateMap, totalSolves } = useMemo(() => {
    const map = {};
    let count = 0;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    for (const sub of allSubmissions) {
      const d = new Date(sub.createdAt);
      if (d >= oneYearAgo) {
        const key = d.toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + 1;
        count++;
      }
    }
    return { dateMap: map, totalSolves: count };
  }, [allSubmissions]);

  // Extract topRec safely from any API shape
  const topRec = useMemo(() => {
    const rec = recommendations[0];
    if (!rec) return null;
    return {
      id: rec._id || rec.id || rec.problem?._id || rec.problemId,
      title: rec.title || rec.problem?.title || rec.problemTitle || 'Next Problem',
      difficulty: rec.difficulty || rec.problem?.difficulty,
    };
  }, [recommendations]);

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleContinue = () => {
    if (lastSession?.path) {
      navigate(lastSession.path);
    } else {
      navigate('/problems');
    }
  };

  // Time since last session
  const lastSessionLabel = useMemo(() => {
    if (!lastSession?.timestamp) return null;
    const diff = Date.now() - lastSession.timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }, [lastSession]);

  return <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
    <div className="flex min-h-full flex-col">
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-[13px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-semibold text-zinc-200">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-3 py-1.5" title={`${streak} Day Streak`}>
            <Flame className={`h-4 w-4 ${streak > 0 ? 'text-[var(--signal)] drop-shadow-[0_0_8px_rgba(74,124,89,0.8)]' : 'text-zinc-600'}`} strokeWidth={2} />
            <span className={`font-mono text-[13px] tabular-nums font-semibold ${streak > 0 ? 'text-zinc-200' : 'text-zinc-500'}`}>
              {streak}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
            <span className="text-[12px] text-zinc-700">Search</span>
            <span className="ml-3 flex items-center gap-0.5 rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] text-zinc-700">
              <Command className="h-2.5 w-2.5" strokeWidth={1.5} />K
            </span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-zinc-600">{timeStr}</span>
        </div>
      </header>

      {/* ─── Bento Grid ─── */}
      <div className="flex-1 px-10 py-10">
        {/* ═══ Hero — Greeting + Continue ═══ */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3 w-3 text-[var(--signal)]" strokeWidth={2} />
            <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase">
              Level {level} · {tier}
            </span>
          </div>
          {/* Clickable quote — navigates to last problem only if quote was context-generated */}
          <h1
            key={greetingKey}
            onClick={() => greetingContext && navigate(greetingContext)}
            className={`font-display text-[42px] font-light leading-[1.1] tracking-[-0.02em] text-zinc-100 animate-in fade-in duration-500 ${
              greetingContext ? 'cursor-pointer hover:text-zinc-300 transition-colors' : ''
            }`}
            title={greetingContext ? 'Click to jump back in' : ''}
          >
            {greetingData.text?.trimEnd()}
            {' '}
            <span className="italic" style={{ color: greetingData.highlightColor, fontFamily: "'Syne', sans-serif" }}>
              {greetingData.highlight}
            </span>
            {/* Auto-add space if suffix starts with a letter (not punctuation) */}
            {greetingData.suffix && /^[a-zA-Z]/.test(greetingData.suffix) ? ' ' + greetingData.suffix : greetingData.suffix}
          </h1>
          <p className="mt-2 text-[13px] text-zinc-500 max-w-lg">
            {displayName}, you've mastered {masteredCount} pattern{masteredCount !== 1 ? 's' : ''}.
            {masteredCount < 5 ? ' Keep pushing the frontier.' : " You\u2019re building serious depth."}
          </p>

          {/* Continue row — button left, top recommendation right */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleContinue}
                className="group flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-[12px] font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98]">
                Continue session
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </button>
              {lastSessionLabel && (
                <span className="font-mono text-[10px] text-zinc-700 tracking-wider">
                  Last active {lastSessionLabel}
                </span>
              )}
            </div>
            {/* Top recommended problem */}
            {topRec && !recsLoading && (
              <Link
                to={`/problems/${topRec.id}`}
                className="group flex items-center gap-3 border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-mono text-[8px] tracking-[0.2em] text-zinc-600 uppercase">Next up</span>
                  <span className="text-[12px] text-zinc-300 font-medium max-w-[200px] truncate text-right group-hover:text-white transition-colors">
                    {topRec.title}
                  </span>
                  {topRec.difficulty && (
                    <span className={`font-mono text-[8px] ${
                      topRec.difficulty === 'Easy' ? 'text-green-500' :
                      topRec.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                    }`}>{topRec.difficulty}</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-300 transition-colors shrink-0" strokeWidth={1.5} />
              </Link>
            )}
          </div>
        </section>


        {/* ═══ Arena Quick-Launch Card ═══ */}
        <section className="mb-8 rounded-2xl border border-white/[0.06] bg-[var(--card)] p-5 card-glow relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-rose-500/8 blur-[60px] pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Swords className="h-5 w-5 text-rose-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-zinc-100">Challenge someone. <span className="text-rose-400">Right now.</span></h3>
                <p className="text-[12px] text-zinc-600 mt-0.5">Versus, co-op shared, or co-op split — Elo-rated matches.</p>
              </div>
            </div>
            <Link to="/arena"
              className="shrink-0 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-[11px] font-semibold tracking-wide text-rose-300 transition-all hover:bg-rose-500/20 hover:text-rose-200"
            >
              Enter Arena
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* ═══ Skill Radar & Heatmap ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 mb-10">
          {/* Skill Radar */}
          <div 
            onMouseEnter={() => setFocusedCard('radar')}
            onMouseLeave={() => setFocusedCard(null)}
            className={`card-glow bg-[#080b10]/60 border border-white/[0.08] p-7 rounded-3xl shadow-2xl backdrop-blur-3xl relative overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1 hover:bg-[#080b10]/80 hover:border-white/[0.15] hover:shadow-[0_20px_40px_rgba(52,211,153,0.08)] ${focusedCard && focusedCard !== 'radar' ? 'opacity-70' : 'opacity-100 z-10'}`}>
            {/* Revolving Orb */}
            <div className={`absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite] pointer-events-none transition-opacity duration-1000 ${focusedCard && focusedCard !== 'radar' ? 'opacity-20' : (focusedCard === 'radar' ? 'opacity-100' : 'opacity-70')}`}
                 style={{ animationPlayState: focusedCard && focusedCard !== 'radar' ? 'paused' : 'running' }}>
              <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 bg-[var(--signal)]/10 rounded-full animate-[spectrum-cycle_18s_linear_infinite]" 
                   style={{ animationDelay: '-5s', animationPlayState: focusedCard && focusedCard !== 'radar' ? 'paused' : 'running' }} />
            </div>
            
            <div className="flex items-center gap-2 mb-5 relative z-10">
              <Activity className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-medium">BKT Mastery Radar</span>
            </div>
            <div className="flex-1 flex items-center justify-center relative z-10">
              <SkillRadar skillStates={skillStates} />
            </div>
          </div>

          {/* Activity Heatmap */}
          <div 
            onMouseEnter={() => setFocusedCard('heatmap')}
            onMouseLeave={() => setFocusedCard(null)}
            className={`card-glow bg-[#080b10]/60 border border-white/[0.08] p-7 rounded-3xl shadow-2xl backdrop-blur-3xl relative overflow-hidden flex flex-col min-w-0 transition-all duration-500 hover:-translate-y-1 hover:bg-[#080b10]/80 hover:border-white/[0.15] hover:shadow-[0_20px_40px_rgba(56,189,248,0.08)] ${focusedCard && focusedCard !== 'heatmap' ? 'opacity-70' : 'opacity-100 z-10'}`}>
            {/* Revolving Orb */}
            <div className={`absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_50s_linear_infinite] pointer-events-none transition-opacity duration-1000 ${focusedCard && focusedCard !== 'heatmap' ? 'opacity-20' : (focusedCard === 'heatmap' ? 'opacity-100' : 'opacity-70')}`}
                 style={{ animationPlayState: focusedCard && focusedCard !== 'heatmap' ? 'paused' : 'running' }}>
              <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 bg-blue-500/10 rounded-full animate-[spectrum-cycle_25s_linear_infinite]" 
                   style={{ animationDelay: '-12s', animationPlayState: focusedCard && focusedCard !== 'heatmap' ? 'paused' : 'running' }} />
            </div>
            
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
                <span className="text-[10px] tracking-[0.25em] text-zinc-500 uppercase">Activity Heatmap</span>
              </div>
              <span className="text-[12px] font-semibold text-zinc-100">
                <span className="text-[var(--signal)]">{totalSolves}</span> solves this year
              </span>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden relative z-10">
               <ActivityHeatmap dateMap={dateMap} />
            </div>
            
            {/* Micro stats */}
            <div className="mt-7 grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl py-3 px-4 flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Recent Pass Rate</span>
                <span className="text-[20px] font-medium tabular-nums text-zinc-200">
                  {recentSubs.length > 0 ? Math.round(recentSubs.filter(s => s.isCorrect).length / recentSubs.length * 100) : 0}%
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl py-3 px-4 flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Streak</span>
                <span className="text-[20px] font-medium tabular-nums text-[var(--signal)]">
                  {streak} <span className="text-sm font-normal text-zinc-600 ml-1">days</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Two-column: Recommendations + Recent Activity ═══ */}
        <div className="grid grid-cols-5 gap-8 mb-10">
          {/* Recommendations — 3 cols */}
          <div 
            onMouseEnter={() => setFocusedCard('recs')}
            onMouseLeave={() => setFocusedCard(null)}
            className={`card-glow col-span-3 bg-[#080b10]/60 border border-white/[0.08] p-7 rounded-3xl shadow-2xl backdrop-blur-3xl flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:bg-[#080b10]/80 hover:border-white/[0.15] hover:shadow-[0_20px_40px_rgba(167,139,250,0.08)] ${focusedCard && focusedCard !== 'recs' ? 'opacity-70' : 'opacity-100 z-10'}`}>
            {/* Revolving Orb */}
            <div className={`absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_45s_linear_infinite] pointer-events-none transition-opacity duration-1000 ${focusedCard && focusedCard !== 'recs' ? 'opacity-20' : (focusedCard === 'recs' ? 'opacity-100' : 'opacity-70')}`}
                 style={{ animationPlayState: focusedCard && focusedCard !== 'recs' ? 'paused' : 'running' }}>
              <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 bg-purple-500/10 rounded-full animate-[spectrum-cycle_30s_linear_infinite]" 
                   style={{ animationDelay: '-2s', animationPlayState: focusedCard && focusedCard !== 'recs' ? 'paused' : 'running' }} />
            </div>
            
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                <span className="text-[10px] tracking-[0.25em] text-zinc-400 font-medium uppercase">Recommended</span>
              </div>
              <Link to="/problems" className="flex items-center gap-1 text-[11px] tracking-[0.15em] text-zinc-500 uppercase hover:text-[var(--signal)] transition-colors">
                All <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              </Link>
            </div>
            {recsLoading ? (
              <div className="flex justify-center py-12 relative z-10"><Loader2 className="h-4 w-4 animate-spin text-zinc-700" /></div>
            ) : recommendations.length === 0 ? (
              <div className="space-y-2 relative z-10">
                {[
                  { title: "Two Sum", skill: "HashMap", difficulty: "Easy", path: "/problems" },
                  { title: "Valid Parentheses", skill: "Stack", difficulty: "Easy", path: "/problems" },
                  { title: "Binary Search", skill: "Arrays", difficulty: "Medium", path: "/problems" }
                ].map((p, i) => (
                  <Link key={`fallback-${i}`} to={p.path}
                    className="group flex items-center justify-between bg-white/[0.02] border border-white/[0.03] rounded-2xl px-6 py-4 transition-colors hover:bg-white/[0.05] hover:border-white/[0.1]">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[10px] tabular-nums text-zinc-600 w-5">{String(i + 1).padStart(2, '0')}</span>
                      <DiffDot difficulty={p.difficulty} />
                      <div className="min-w-0 flex items-center gap-3">
                        <div>
                          <div className="text-[14px] font-medium text-zinc-300 truncate group-hover:text-white transition-colors">{p.title}</div>
                          <div className="text-[10px] tracking-[0.12em] text-zinc-500 uppercase mt-0.5">{p.skill}</div>
                        </div>
                        {i === 0 && (
                          <span className="border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest text-[var(--signal)] uppercase">
                            Calibration
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-white transition-colors shrink-0" strokeWidth={1.5} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2 relative z-10">
                {recommendations.slice(0, 4).map((p, i) => {
                  const problemId = p.problemId?._id || p.problemId || p._id;
                  const title = p.problemId?.title || p.title || 'Untitled';
                  const skillName = p.skillId?.name || p.skill || '';
                  const difficulty = p.problemId?.difficulty || p.difficulty || 'Medium';

                  return <Link key={problemId || i} to={`/problems/${problemId}`}
                    className="group flex items-center justify-between bg-white/[0.02] border border-white/[0.03] rounded-2xl px-6 py-4 transition-colors hover:bg-white/[0.05] hover:border-white/[0.1]">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[10px] tabular-nums text-zinc-600 w-5">{String(i + 1).padStart(2, '0')}</span>
                      <DiffDot difficulty={difficulty} />
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-zinc-300 truncate group-hover:text-white transition-colors">{title}</div>
                        <div className="text-[10px] tracking-[0.12em] text-zinc-500 uppercase mt-0.5">{skillName}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-white transition-colors shrink-0" strokeWidth={1.5} />
                  </Link>;
                })}
              </div>
            )}
          </div>

          {/* Recent Activity — 2 cols */}
          <div 
            onMouseEnter={() => setFocusedCard('activity')}
            onMouseLeave={() => setFocusedCard(null)}
            className={`card-glow col-span-2 bg-[#080b10]/60 border border-white/[0.08] p-7 rounded-3xl shadow-2xl backdrop-blur-3xl flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:bg-[#080b10]/80 hover:border-white/[0.15] hover:shadow-[0_20px_40px_rgba(52,211,153,0.08)] ${focusedCard && focusedCard !== 'activity' ? 'opacity-70' : 'opacity-100 z-10'}`}>
            {/* Revolving Orb */}
            <div className={`absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_35s_linear_infinite] pointer-events-none transition-opacity duration-1000 ${focusedCard && focusedCard !== 'activity' ? 'opacity-20' : (focusedCard === 'activity' ? 'opacity-100' : 'opacity-70')}`}
                 style={{ animationPlayState: focusedCard && focusedCard !== 'activity' ? 'paused' : 'running' }}>
              <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 bg-teal-500/10 rounded-full animate-[spectrum-cycle_22s_linear_infinite]" 
                   style={{ animationDelay: '-19s', animationPlayState: focusedCard && focusedCard !== 'activity' ? 'paused' : 'running' }} />
            </div>
            
            <div className="flex items-center gap-2 mb-5 relative z-10">
              <Activity className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.25em] text-zinc-400 font-medium uppercase">Recent Activity</span>
            </div>
            <div className="space-y-2 flex-1 relative z-10">
              {recentSubs.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl px-6 py-10 text-center text-[12px] text-zinc-500 tracking-wider">
                  No submissions yet
                </div>
              ) : recentSubs.slice(0, 4).map((sub, i) => {
                const passed = sub.isCorrect;
                const title = sub.problemId?.title || 'Problem';
                const when = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                return <div key={sub._id || i} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${passed ? 'bg-[var(--signal)]' : 'bg-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]'}`} />
                    <span className="text-[13px] font-medium text-zinc-300 truncate">{title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-600 shrink-0">{when}</span>
                </div>;
              })}
            </div>

            {/* Quick links */}
            <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
              <Link to="/arena" className="group flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 transition-colors hover:bg-white/[0.08] hover:border-white/[0.15]">
                <Swords className="h-4 w-4 text-zinc-500 group-hover:text-amber-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase group-hover:text-zinc-200 transition-colors">Arena</span>
              </Link>
              <Link to="/leaderboard" className="group flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 transition-colors hover:bg-white/[0.08] hover:border-white/[0.15]">
                <Trophy className="h-4 w-4 text-zinc-500 group-hover:text-yellow-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase group-hover:text-zinc-200 transition-colors">Ranks</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ Leaderboard ═══ */}
        <LeaderboardView />
      </div>

      {/* ─── Footer ─── */}
      <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-10 py-4 font-mono text-[9px] tracking-[0.24em] text-zinc-800">
        <span>COGNITIVE · CAMPUS / 2026</span>
        <span className="text-[var(--signal)]/50">OK</span>
      </div>
    </div>
  </div>;
}

function DiffDot({ difficulty }) {
  const color = difficulty === 'Easy' ? 'bg-[var(--signal)]' : difficulty === 'Hard' ? 'bg-rose-500' : 'bg-amber-500';
  return <span className={`h-2 w-2 rounded-full ${color} shrink-0`} />;
}

/* ─── Skill Radar Chart ─── SVG polygon visualization of BKT mastery */
function SkillRadar({ skillStates }) {
  const skills = (skillStates || []).slice(0, 6);
  if (skills.length < 3) {
    return <div className="flex h-48 items-center justify-center text-[12px] text-zinc-700">
      Complete more skills to unlock radar
    </div>;
  }

  const cx = 120, cy = 110, r = 85;
  const n = skills.length;
  const angleStep = (2 * Math.PI) / n;
  const offset = -Math.PI / 2; // Start from top

  // Generate polygon points for a given radius multiplier
  const polyPoints = (radiusMult) =>
    skills.map((_, i) => {
      const a = offset + i * angleStep;
      return `${cx + r * radiusMult * Math.cos(a)},${cy + r * radiusMult * Math.sin(a)}`;
    }).join(' ');

  // Data polygon
  const dataPoints = skills.map((s, i) => {
    const mastery = s.masteryP || 0;
    const a = offset + i * angleStep;
    return `${cx + r * mastery * Math.cos(a)},${cy + r * mastery * Math.sin(a)}`;
  }).join(' ');

  return <div className="flex items-center gap-6">
    <svg viewBox="0 0 240 220" className="h-48 w-48 shrink-0">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(level => (
        <polygon key={level} points={polyPoints(level)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {skills.map((_, i) => {
        const a = offset + i * angleStep;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
      })}
      {/* Data fill */}
      <polygon points={dataPoints} fill="rgba(74,124,89,0.12)" stroke="var(--signal)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data dots */}
      {skills.map((s, i) => {
        const mastery = s.masteryP || 0;
        const a = offset + i * angleStep;
        const x = cx + r * mastery * Math.cos(a);
        const y = cy + r * mastery * Math.sin(a);
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--signal)" opacity="0.8">
          <animate attributeName="r" values="3;4;3" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
        </circle>;
      })}
      {/* Labels */}
      {skills.map((s, i) => {
        const a = offset + i * angleStep;
        const lx = cx + (r + 18) * Math.cos(a);
        const ly = cy + (r + 18) * Math.sin(a);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" 
          className="fill-zinc-600" style={{ fontSize: '8px', letterSpacing: '0.12em', fontFamily: 'Inter, sans-serif' }}>
          {(s.skillId?.name || 'Skill').slice(0, 8).toUpperCase()}
        </text>;
      })}
    </svg>

    {/* Skill legend */}
    <div className="flex flex-col gap-2 min-w-0">
      {skills.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" style={{ opacity: 0.4 + (s.masteryP || 0) * 0.6 }} />
          <span className="text-[11px] text-zinc-500 truncate max-w-[100px]">{s.skillId?.name || 'Skill'}</span>
          <span className="ml-auto font-mono text-[10px] tabular-nums text-zinc-400">{Math.round((s.masteryP || 0) * 100)}%</span>
        </div>
      ))}
    </div>
  </div>;
}

/* ─── Activity Sparkline ─── 7-day SVG area chart with glassmorphic tooltip */
function ActivitySparkline({ recentSubs }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Generate 7-day buckets with pass rate
  const now = Date.now();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * 86400000;
    const dayEnd = dayStart + 86400000;
    const daySubs = (recentSubs || []).filter(s => {
      const t = new Date(s.createdAt).getTime();
      return t >= dayStart && t < dayEnd;
    });
    const passed = daySubs.filter(s => s.isCorrect).length;
    const dayObj = new Date(dayStart);
    return {
      count: daySubs.length,
      passed,
      rate: daySubs.length > 0 ? Math.round(passed / daySubs.length * 100) : 0,
      label: dayNames[dayObj.getDay()],
      date: `${dayObj.getMonth() + 1}/${dayObj.getDate()}`
    };
  });

  const days = buckets.map(b => b.count);
  const max = Math.max(...days, 1);
  const w = 200, h = 60;
  const stepX = w / 6;

  const points = days.map((v, i) => ({
    x: i * stepX,
    y: h - (v / max) * (h - 8) - 4
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return <div>
    <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full h-20" onMouseLeave={() => setHoveredIdx(null)}>
      {/* Grid lines */}
      {[0, 1, 2].map(i => (
        <line key={i} x1="0" y1={h / 3 * i + 4} x2={w} y2={h / 3 * i + 4} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#sparkGrad)" opacity="0.6" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Interactive dots */}
      {points.map((p, i) => (
        <g key={i} onMouseEnter={() => setHoveredIdx(i)}>
          {/* Invisible hit area */}
          <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer" />
          {/* Visible dot */}
          <circle cx={p.x} cy={p.y}
            r={hoveredIdx === i ? 4 : (days[i] > 0 ? 2.5 : 1.5)}
            fill={days[i] > 0 ? "var(--signal)" : "rgba(255,255,255,0.1)"}
            style={{ transition: 'r 0.2s ease' }}
          />
          {/* Glow ring on hover */}
          {hoveredIdx === i && <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="var(--signal)" strokeWidth="1" opacity="0.3" />}
        </g>
      ))}
      {/* Day labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h + 13} textAnchor="middle"
          className={hoveredIdx === i ? 'fill-zinc-400' : 'fill-zinc-700'}
          style={{ fontSize: '8px', fontFamily: 'Inter, sans-serif', transition: 'fill 0.2s' }}>
          {buckets[i].label.charAt(0)}
        </text>
      ))}

      {/* Glassmorphic tooltip */}
      {hoveredIdx !== null && (() => {
        const p = points[hoveredIdx];
        const b = buckets[hoveredIdx];
        const tooltipW = 80, tooltipH = 48;
        // Clamp tooltip position so it doesn't overflow SVG
        const tx = Math.max(0, Math.min(p.x - tooltipW / 2, w - tooltipW));
        const ty = Math.max(0, p.y - tooltipH - 10);
        return <foreignObject x={tx} y={ty} width={tooltipW} height={tooltipH}>
          <div style={{
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '6px 8px',
            fontFamily: 'Inter, sans-serif',
          }}>
            <div style={{ fontSize: '8px', letterSpacing: '0.18em', color: '#71717a', textTransform: 'uppercase', marginBottom: '3px' }}>
              {b.label} · {b.date}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '14px', fontWeight: 200, color: '#e4e4e7', fontVariantNumeric: 'tabular-nums' }}>
                {b.count}
              </span>
              <span style={{ fontSize: '9px', color: b.rate >= 70 ? '#34d399' : b.rate >= 40 ? '#fbbf24' : '#fb7185', fontVariantNumeric: 'tabular-nums' }}>
                {b.rate}% pass
              </span>
            </div>
          </div>
        </foreignObject>;
      })()}

      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>;
}