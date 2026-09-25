import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame, Search, Command, Swords, Target, Trophy, CircleCheckBig, Zap, Layers, TrendingUp, Activity, Lightbulb,
  Users, Award, Repeat, Clock, ArrowUpRight, BarChart3
} from 'lucide-react';
import { analyticsService, usersService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSessionTracker } from '../../hooks/useSessionTracker';
import { ActivityHeatmap } from '../ui/activity-heatmap';
import { LeaderboardView } from '../leaderboard/leaderboard-view';
import { Card, Label, SectionTitle, Stat, Reveal, Skeleton, ErrorNote, Ring, CountUp, DiffPill, Bar, Pill } from '../ui/kit';
import { SkillRadarChart, MasteryTrendChart, XpProgressChart } from './charts';
import { MissionHero, StreakWidget, DailyChallengeCard, SkillLedger, InsightsPanel, RecommendationList, AchievementStrip, timeAgo } from './widgets';

const QUOTE_CACHE = 'cached_ai_quote_v2';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-1" /><Skeleton className="h-96 lg:col-span-2" /></div>
    </div>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { getLastSession } = useSessionTracker();
  const lastSession = useMemo(() => getLastSession(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem(QUOTE_CACHE) || 'null'); return c?.text && c?.highlight ? c : null; } catch { return null; }
  });

  useEffect(() => {
    let alive = true;
    analyticsService.getDashboard()
      .then((r) => { if (alive) setData(r.data.data); })
      .catch((e) => { if (alive) setError(e.response?.data?.message || 'Could not load your dashboard.'); });
    usersService.getDashboardQuote({ lastPath: lastSession?.path, timestamp: lastSession?.timestamp })
      .then((r) => {
        const q = r.data?.data;
        if (alive && q?.text && q?.highlight) {
          setQuote(q);
          try { localStorage.setItem(QUOTE_CACHE, JSON.stringify(q)); } catch { /* storage unavailable */ }
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [lastSession]);

  // one gentle nudge per session when the streak is on the line
  useEffect(() => {
    if (!data?.streak?.atRisk || sessionStorage.getItem('cc_streak_nudge')) return;
    sessionStorage.setItem('cc_streak_nudge', '1');
    toast.push({ type: 'warning', title: `Your ${data.streak.streak}-day streak is on the line`, message: data.streak.hoursLeft != null ? `${data.streak.hoursLeft}h left today — one solved problem keeps it alive.` : 'Solve one problem today to keep it alive.' });
  }, [data, toast]);

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (!data && !error) return <div className="h-full overflow-y-auto scrollbar-surgical"><DashboardSkeleton /></div>;
  if (error && !data) return <div className="p-10"><ErrorNote>{error}</ErrorNote></div>;

  const { skills, totals, today, rank, peers } = data;
  const solvedPct = totals.catalogue ? totals.solved / totals.catalogue : 0;

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">
        {/* ─── Top bar ─── */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
          <div className="flex items-center gap-3 text-[13px] text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)] shadow-[0_0_8px_var(--signal)]" />
            <span className="font-semibold text-zinc-200">Mission Control</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-orange-400/20 bg-orange-400/[0.06] px-3 py-1.5" title={`${data.streak.streak} day streak`}>
              <Flame className={`h-4 w-4 ${data.streak.streak ? 'text-orange-400' : 'text-zinc-600'}`} strokeWidth={2} />
              <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-200">{data.streak.streak}</span>
            </div>
            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))} className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 transition-colors hover:bg-white/[0.05] sm:flex">
              <Search className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
              <span className="text-[12px] text-zinc-600">Search</span>
              <span className="ml-3 flex items-center gap-0.5 rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600"><Command className="h-2.5 w-2.5" strokeWidth={1.5} />K</span>
            </button>
            <span className="hidden font-mono text-[11px] tabular-nums text-zinc-600 md:block">{timeStr}</span>
          </div>
        </header>

        <div className="flex-1 space-y-6 px-6 py-8 md:px-10">
          {/* ═══ Hero ═══ */}
          <Reveal><MissionHero data={data} quote={quote} onQuoteClick={() => quote?.contextPath && navigate(quote.contextPath)} /></Reveal>

          {/* ═══ Quick stats ═══ */}
          <Reveal delay={0.05}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Solved today" icon={CircleCheckBig} value={<CountUp value={today.solved} />} sub={`${today.attempts} attempt${today.attempts !== 1 ? 's' : ''} · +${today.xp} XP`} />
              <Stat label="Streak" icon={Flame} accent="amber" value={<><CountUp value={data.streak.streak} /><span className="ml-1 text-[13px] font-normal text-zinc-500">d</span></>} sub={data.streak.multiplier > 1 ? `×${data.streak.multiplier} XP multiplier` : `Best ${data.user.longestStreak}d`} />
              <Stat label="Leaderboard" icon={Trophy} accent="violet" value={<>#{rank.position}</>} sub={`Top ${Math.max(1, 100 - rank.percentile)}% of ${rank.total}`} />
              <Stat label="Solved" icon={Target} accent="blue" value={<><CountUp value={totals.solved} /><span className="ml-1 text-[13px] font-normal text-zinc-500">/ {totals.catalogue}</span></>} sub={`${totals.solvedByDifficulty.easy}E · ${totals.solvedByDifficulty.medium}M · ${totals.solvedByDifficulty.hard}H`} />
              <Stat label="Skills mastered" icon={Layers} value={<><CountUp value={totals.mastered} /><span className="ml-1 text-[13px] font-normal text-zinc-500">/ {totals.skillCount}</span></>} sub="≥ 85% mastery" />
              <Stat label="Total XP" icon={Zap} accent="amber" value={<CountUp value={data.user.xp} />} sub={`Level ${data.user.level}`} />
            </div>
          </Reveal>

          {/* ═══ Streak · Daily · Radar ═══ */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1.25fr]">
            <Reveal delay={0.05}><StreakWidget streak={{ ...data.streak, longestStreak: data.user.longestStreak }} activity={data.activity} /></Reveal>
            <Reveal delay={0.1}><DailyChallengeCard daily={data.dailyChallenge} /></Reveal>
            <Reveal delay={0.15}>
              <Card className="h-full">
                <SectionTitle icon={Activity} title="BKT mastery radar" sub="Probability you've learned each skill — dashed line is your cohort average." />
                <SkillRadarChart skills={skills} height={270} />
              </Card>
            </Reveal>
          </div>

          {/* ═══ Trends ═══ */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Card>
                <SectionTitle icon={TrendingUp} title="Mastery over time" sub="Average mastery across all 12 skills, replayed from every attempt (forgetting included)." />
                <MasteryTrendChart timeline={data.masteryTimeline} skills={skills} />
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card>
                <SectionTitle icon={Zap} title="XP progression" sub="Cumulative XP with milestones — level-ups, streaks and first solves." />
                <XpProgressChart points={data.xpTimeline.points} annotations={data.xpTimeline.annotations} />
              </Card>
            </Reveal>
          </div>

          {/* ═══ Skill ledger ═══ */}
          <Reveal>
            <Card>
              <SectionTitle
                icon={BarChart3}
                title="Skill progression ledger"
                sub="Mastery, cohort comparison, learning trend and a model-based estimate of how long each skill will take to master at your current pace."
                action={<Link to="/profile" className="hidden items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[var(--signal)] sm:flex">Model details <ArrowUpRight className="h-3 w-3" /></Link>}
              />
              <SkillLedger skills={skills} />
            </Card>
          </Reveal>

          {/* ═══ Recommendations + Insights ═══ */}
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Reveal>
              <Card>
                <SectionTitle icon={Target} title="Recommended for you" sub="Ranked by weak spots, review timing, difficulty ramp and what your target company asks." action={<Link to="/problems" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[var(--signal)]">All <ArrowUpRight className="h-3 w-3" /></Link>} />
                <RecommendationList recs={data.recommendations} />
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-6">
                <Card>
                  <SectionTitle icon={Lightbulb} title="Insights" />
                  <InsightsPanel insights={data.insights} />
                </Card>
                {peers?.overallPercentile != null && (
                  <Card>
                    <SectionTitle icon={Users} title={`You vs ${peers.scope}`} sub={`Anonymised — ${peers.peerCount} peers`} />
                    <div className="flex items-center gap-5">
                      <Ring value={peers.overallPercentile / 100} size={84} stroke={8} color="#a78bfa"><span className="text-[15px] font-semibold text-zinc-100">{peers.overallPercentile}<span className="text-[9px] text-zinc-500">th</span></span></Ring>
                      <div className="space-y-1.5 text-[12px] text-zinc-400">
                        <div>Your avg mastery <b className="text-zinc-100">{Math.round(peers.myAvgMastery * 100)}%</b></div>
                        <div>Peer avg <b className="text-zinc-300">{Math.round(peers.peerAvgMastery * 100)}%</b></div>
                        <Link to="/placement" className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200">Skill-gap analysis <ArrowUpRight className="h-3 w-3" /></Link>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Reveal>
          </div>

          {/* ═══ Activity + Recent ═══ */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <Card>
                <SectionTitle icon={Clock} title="Activity" action={<span className="text-[12px] font-semibold text-zinc-100"><span className="text-[var(--signal)]">{Object.values(data.activity).reduce((a, b) => a + b, 0)}</span> submissions this year</span>} />
                <ActivityHeatmap dateMap={data.activity} />
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card className="h-full">
                <SectionTitle icon={Repeat} title="Recent submissions" />
                <div className="space-y-2">
                  {data.recentSubmissions.length === 0 && <p className="py-6 text-center text-[12.5px] text-zinc-600">No submissions yet — pick a problem and start.</p>}
                  {data.recentSubmissions.slice(0, 6).map((s) => (
                    <Link key={s._id} to={`/problems/${s.problemId?._id}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:bg-white/[0.05]">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.isCorrect ? 'bg-[var(--signal)]' : 'bg-rose-500'}`} />
                        <span className="truncate text-[13px] text-zinc-300">{s.problemId?.title || 'Problem'}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {s.xpAwarded > 0 && <span className="font-mono text-[10px] text-amber-400">+{s.xpAwarded}</span>}
                        <span className="font-mono text-[10px] text-zinc-600">{timeAgo(s.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link to="/arena" className="group flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] py-2.5 text-[11px] font-semibold uppercase tracking-wider text-rose-300 transition-colors hover:bg-rose-500/[0.12]"><Swords className="h-3.5 w-3.5" /> Arena</Link>
                  <Link to="/sheets" className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:bg-white/[0.07]"><Layers className="h-3.5 w-3.5" /> Sheets</Link>
                </div>
              </Card>
            </Reveal>
          </div>

          {/* ═══ Badges ═══ */}
          <Reveal>
            <Card>
              <SectionTitle icon={Award} title="Achievements" />
              <AchievementStrip achievements={data.achievements} />
            </Card>
          </Reveal>

          {/* ═══ Leaderboard ═══ */}
          <LeaderboardView />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-6 py-4 font-mono text-[9px] tracking-[0.24em] text-zinc-800 md:px-10">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <span className="text-[var(--signal)]/50">OK</span>
        </div>
      </div>
    </div>
  );
}
