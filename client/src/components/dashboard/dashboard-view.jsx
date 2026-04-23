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

/* ─── Dynamic greetings ─── */
const GREETINGS = [
  "Back for blood?",
  "Hello, legend.",
  "Optimize the world.",
  "Logic is power.",
  "Ready to conquer?",
  "The grind never sleeps.",
  "Let's close the gap.",
  "Think. Code. Dominate.",
  "Welcome back, architect.",
  "Build something brilliant.",
  "Your code awaits.",
  "Time to level up.",
];

function getGreeting() {
  // Rotate daily so it's deterministic but changes each day
  const dayIndex = Math.floor(Date.now() / 86400000) % GREETINGS.length;
  return GREETINGS[dayIndex];
}

export function DashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getLastSession } = useSessionTracker();
  const [skillStates, setSkillStates] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recentSubs, setRecentSubs] = useState([]);

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
    submissionsService.getHistory({ limit: 5 })
      .then(r => {
        const subs = r.data?.data?.submissions || r.data?.data || [];
        setRecentSubs(Array.isArray(subs) ? subs.slice(0, 4) : []);
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

  const greeting = getGreeting();
  const lastSession = getLastSession();
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
          <h1 className="text-[52px] font-extralight leading-[1.05] tracking-tight text-zinc-100">
            {greeting}
          </h1>
          <p className="mt-3 text-[14px] text-zinc-500 max-w-lg">
            {displayName}, you've mastered {masteredCount} patterns. 
            {masteredCount < 5 ? ' Keep pushing the frontier.' : " You\u2019re building serious depth."}
          </p>

          <div className="mt-7 flex items-center gap-3">
            <button onClick={handleContinue}
              className="group flex items-center gap-2.5 rounded-none border border-white/[0.12] bg-white/[0.02] px-6 py-3 text-[12px] font-medium tracking-[0.15em] text-zinc-200 uppercase transition-all duration-300 hover:bg-white hover:text-black hover:border-white">
              Continue session
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
            </button>
            {lastSessionLabel && (
              <span className="font-mono text-[10px] text-zinc-700 tracking-wider">
                Last active {lastSessionLabel}
              </span>
            )}
          </div>
        </section>

        {/* ═══ Bento: 4-card grid ═══ */}
        <div className="grid grid-cols-4 gap-[1px] bg-white/[0.04] border border-white/[0.04] mb-10">
          {/* Metric 1: XP */}
          <div className="flex flex-col gap-3 bg-background p-7">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.15em] text-zinc-600 uppercase">Total XP</span>
            </div>
            <span className="text-[36px] font-extralight leading-none tabular-nums text-zinc-100">{xp.toLocaleString()}</span>
            <span className="text-[11px] text-[var(--signal)]">{xpToNext - (xp % xpToNext)} to next level</span>
          </div>

          {/* Metric 2: Streak */}
          <div className="flex flex-col gap-3 bg-background p-7">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.15em] text-zinc-600 uppercase">Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-extralight leading-none tabular-nums text-zinc-100">{streak}</span>
              <span className="text-[13px] text-zinc-600">days</span>
            </div>
            <span className="text-[11px] text-zinc-600">Keep it alive</span>
          </div>

          {/* Metric 3: Mastered */}
          <div className="flex flex-col gap-3 bg-background p-7">
            <div className="flex items-center gap-2">
              <CircleCheckBig className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.15em] text-zinc-600 uppercase">Mastered</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-extralight leading-none tabular-nums text-zinc-100">{masteredCount}</span>
              <span className="text-[13px] text-zinc-600">/ {totalProblems || '—'}</span>
            </div>
            <span className="text-[11px] text-[var(--signal)]">{totalProblems > 0 ? ((masteredCount / totalProblems * 100).toFixed(0)) : '0'}% coverage</span>
          </div>

          {/* Metric 4: Level ring */}
          <div className="flex items-center gap-5 bg-background p-7">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--signal)" strokeWidth="2" 
                  strokeDasharray={`${(xp % (level * 100)) / (level * 100) * 176} 176`} strokeLinecap="round" opacity={0.7} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[8px] tracking-widest text-zinc-700">LVL</span>
                <span className="text-[18px] font-light tabular-nums text-zinc-200">{level}</span>
              </div>
            </div>
            <div>
              <div className="text-[14px] font-medium text-zinc-200">{tier}</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">tier</div>
            </div>
          </div>
        </div>

        {/* ═══ Two-column: Recommendations + Recent Activity ═══ */}
        <div className="grid grid-cols-5 gap-8 mb-10">
          {/* Recommendations — 3 cols */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
                <span className="text-[11px] tracking-[0.18em] text-zinc-500 uppercase">Recommended</span>
              </div>
              <Link to="/problems" className="flex items-center gap-1 text-[11px] tracking-[0.15em] text-zinc-700 uppercase hover:text-zinc-400 transition-colors">
                All <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              </Link>
            </div>
            {recsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-4 w-4 animate-spin text-zinc-700" /></div>
            ) : recommendations.length === 0 ? (
              <div className="py-12 text-center text-[11px] text-zinc-700 tracking-wider">Solve more problems to unlock recommendations</div>
            ) : (
              <div className="space-y-[1px] border border-white/[0.04]">
                {recommendations.slice(0, 4).map((p, i) => {
                  const problemId = p.problemId?._id || p.problemId || p._id;
                  const title = p.problemId?.title || p.title || 'Untitled';
                  const skillName = p.skillId?.name || p.skill || '';
                  const difficulty = p.problemId?.difficulty || p.difficulty || 'Medium';

                  return <Link key={problemId || i} to={`/problems/${problemId}`}
                    className="group flex items-center justify-between bg-background px-6 py-4 transition-colors hover:bg-white/[0.02]">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[10px] tabular-nums text-zinc-700 w-5">{String(i + 1).padStart(2, '0')}</span>
                      <DiffDot difficulty={difficulty} />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{title}</div>
                        <div className="text-[10px] tracking-[0.12em] text-zinc-600 uppercase mt-0.5">{skillName}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-800 group-hover:text-zinc-400 transition-colors shrink-0" strokeWidth={1.5} />
                  </Link>;
                })}
              </div>
            )}
          </div>

          {/* Recent Activity — 2 cols */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.18em] text-zinc-500 uppercase">Recent</span>
            </div>
            <div className="space-y-[1px] border border-white/[0.04]">
              {recentSubs.length === 0 ? (
                <div className="bg-background px-6 py-10 text-center text-[11px] text-zinc-700 tracking-wider">
                  No submissions yet
                </div>
              ) : recentSubs.map((sub, i) => {
                const passed = sub.allTestsPassed || sub.passed;
                const title = sub.problemId?.title || 'Problem';
                const when = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                return <div key={sub._id || i} className="flex items-center justify-between bg-background px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${passed ? 'bg-[var(--signal)]' : 'bg-rose-500/60'}`} />
                    <span className="text-[12px] text-zinc-300 truncate">{title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-700 shrink-0">{when}</span>
                </div>;
              })}
            </div>

            {/* Quick links */}
            <div className="mt-6 grid grid-cols-2 gap-[1px] border border-white/[0.04]">
              <Link to="/arena" className="group flex items-center gap-2 bg-background px-4 py-3 transition-colors hover:bg-white/[0.02]">
                <Swords className="h-3.5 w-3.5 text-zinc-700 group-hover:text-amber-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[11px] tracking-[0.12em] text-zinc-500 uppercase group-hover:text-zinc-300 transition-colors">Arena</span>
              </Link>
              <Link to="/leaderboard" className="group flex items-center gap-2 bg-background px-4 py-3 transition-colors hover:bg-white/[0.02]">
                <Trophy className="h-3.5 w-3.5 text-zinc-700 group-hover:text-amber-400 transition-colors" strokeWidth={1.5} />
                <span className="text-[11px] tracking-[0.12em] text-zinc-500 uppercase group-hover:text-zinc-300 transition-colors">Ranks</span>
              </Link>
            </div>
          </div>
        </div>
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