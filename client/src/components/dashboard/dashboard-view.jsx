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
        {/* ═══ Skill Radar + Activity Sparkline ═══ */}
        <div className="grid grid-cols-5 gap-[1px] bg-white/[0.04] border border-white/[0.04] mb-10">
          {/* Skill Radar — 3 cols */}
          <div className="col-span-3 bg-background p-7">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.18em] text-zinc-500 uppercase">Skill Mastery Radar</span>
            </div>
            <SkillRadar skillStates={skillStates} />
          </div>

          {/* Activity Sparkline — 2 cols */}
          <div className="col-span-2 bg-background p-7">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[11px] tracking-[0.18em] text-zinc-500 uppercase">7-Day Activity</span>
            </div>
            <ActivitySparkline recentSubs={recentSubs} />
            
            {/* Micro stats */}
            <div className="mt-5 grid grid-cols-2 gap-[1px] bg-white/[0.04]">
              <div className="bg-background py-2.5 px-3 flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase">Pass Rate</span>
                <span className="text-[18px] font-extralight tabular-nums text-zinc-200">
                  {recentSubs.length > 0 ? Math.round(recentSubs.filter(s => s.allTestsPassed || s.passed).length / recentSubs.length * 100) : 0}%
                </span>
              </div>
              <div className="bg-background py-2.5 px-3 flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase">This Week</span>
                <span className="text-[18px] font-extralight tabular-nums text-zinc-200">
                  {recentSubs.length}
                </span>
              </div>
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
    const passed = daySubs.filter(s => s.allTestsPassed || s.passed).length;
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
              <span style={{ fontSize: '9px', color: b.rate >= 70 ? '#4a7c59' : b.rate >= 40 ? '#eab308' : '#f43f5e', fontVariantNumeric: 'tabular-nums' }}>
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