/**
 * Dashboard widgets: hero, streak, daily challenge, skill ledger, insights, recommendations, badges.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, Snowflake, Zap, Timer, ArrowRight, Sparkles, Play, Lock, TrendingUp, TrendingDown, Minus, RefreshCw,
  Target, Award, Users, Clock, Repeat, CheckCircle2, ChevronRight, Lightbulb, Bookmark
} from 'lucide-react';
import { Card, Label, Bar, Ring, DiffPill, Pill, SectionTitle, achievementIcon, rarityStyle, cn } from '../ui/kit';

// ─── Hero ────────────────────────────────────────────────────────────────────

const TIERS = [[40, 'Legend'], [30, 'Archon'], [15, 'Adept'], [1, 'Apprentice']];
export const tierFor = (level) => (TIERS.find(([min]) => level >= min) || TIERS[TIERS.length - 1])[1];

export function MissionHero({ data, quote, onQuoteClick }) {
  const { user, resume, lastProblem, recommendations } = data;
  const next = recommendations?.[0];
  const q = quote || { text: 'Ready when you are, ', highlight: "let's go", highlightColor: '#34d399', suffix: '.' };
  const clickable = !!q.contextPath;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0d1218] via-[#0b0f15] to-[#0a0d13] p-7 md:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--signal)]/[0.07] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-500/[0.05] blur-[90px]" />

      <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-[var(--signal)]" strokeWidth={2} />
            <Label>Level {user.level} · {tierFor(user.level)}</Label>
          </div>

          <h1
            onClick={clickable ? onQuoteClick : undefined}
            className={cn('font-display text-[38px] font-light leading-[1.1] tracking-[-0.02em] text-zinc-100 md:text-[46px]', clickable && 'cursor-pointer transition-colors hover:text-zinc-300')}
          >
            {q.text?.trimEnd()}{' '}
            <span className="italic" style={{ color: q.highlightColor, fontFamily: "'Syne', sans-serif" }}>{q.highlight}</span>
            {q.suffix && /^[a-zA-Z]/.test(q.suffix) ? ` ${q.suffix}` : q.suffix}
          </h1>

          {q.tip && (
            <div className="mt-4 flex max-w-xl items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={1.8} />
              <p className="text-[12.5px] leading-relaxed text-zinc-400">
                {q.tip}
                <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600">{q.source === 'ai' ? 'AI tip' : 'Study tip'}</span>
              </p>
            </div>
          )}

          {/* level progress */}
          <div className="mt-6 max-w-xl">
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Level {user.level}</Label>
              <span className="font-mono text-[10.5px] tabular-nums text-zinc-500">{user.levelProgress} / 100 XP → Lv {user.level + 1}</span>
            </div>
            <Bar value={user.levelProgress} max={100} height={7} color="linear-gradient(90deg,#34d399,#38bdf8)" />
          </div>
        </div>

        {/* Continue where you left off */}
        <div className="flex flex-col justify-center gap-3">
          <Label>Continue where you left off</Label>
          {resume ? (
            <Link
              to={`/problems/${resume._id}`}
              className="group rounded-2xl border border-[var(--signal)]/25 bg-[var(--signal)]/[0.06] p-4 transition-all duration-300 hover:border-[var(--signal)]/45 hover:bg-[var(--signal)]/[0.1]"
            >
              <div className="mb-2 flex items-center justify-between">
                <Pill tone="amber" icon={Play}>In progress</Pill>
                <DiffPill difficulty={resume.difficulty} />
              </div>
              <div className="text-[16px] font-semibold text-zinc-100">{resume.title}</div>
              <div className="mt-1 text-[12px] text-zinc-500">{resume.attempts} attempt{resume.attempts !== 1 ? 's' : ''} · last {timeAgo(resume.lastAttemptAt)}</div>
              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--signal)]">Resume <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div>
            </Link>
          ) : next ? (
            <Link to={`/problems/${next.problem._id}`} className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]">
              <div className="mb-2 flex items-center justify-between"><Pill tone="green" icon={Target}>Next up</Pill><DiffPill difficulty={next.problem.difficulty} /></div>
              <div className="text-[16px] font-semibold text-zinc-100">{next.problem.title}</div>
              <div className="mt-1 text-[12px] text-zinc-500">{next.skill.name} · {Math.round(next.predictedSuccess * 100)}% predicted success</div>
              <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--signal)]">Start <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div>
            </Link>
          ) : (
            <Link to="/problems" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-[13px] text-zinc-300 hover:bg-white/[0.06]">Browse problems →</Link>
          )}
          {lastProblem && resume && lastProblem._id !== resume._id && (
            <div className="text-[11.5px] text-zinc-600">Last solved: <Link to={`/problems/${lastProblem._id}`} className="text-zinc-400 hover:text-zinc-200">{lastProblem.title}</Link></div>
          )}
        </div>
      </div>
    </div>
  );
}

export function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const d = Math.floor(hrs / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export function StreakWidget({ streak, activity }) {
  const days = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ key, label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], count: activity?.[key] || 0, today: i === 0 });
    }
    return out;
  }, [activity]);

  const hot = streak.streak > 0;
  return (
    <Card className="h-full overflow-hidden">
      <div className={cn('pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[50px]', hot ? 'bg-orange-500/[0.14]' : 'bg-white/[0.03]')} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <Label>Streak</Label>
          {streak.multiplier > 1 && <Pill tone="amber" icon={Zap}>×{streak.multiplier} XP</Pill>}
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            animate={hot ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', hot ? 'border-orange-400/30 bg-orange-400/10' : 'border-white/10 bg-white/[0.03]')}
          >
            <Flame className={cn('h-7 w-7', hot ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.7)]' : 'text-zinc-600')} strokeWidth={1.8} />
          </motion.div>
          <div>
            <div className="text-[34px] font-semibold leading-none tabular-nums text-zinc-100">{streak.streak}<span className="ml-1.5 text-[13px] font-normal text-zinc-500">day{streak.streak !== 1 ? 's' : ''}</span></div>
            <div className="mt-1 text-[11.5px] text-zinc-500">Best: {streak.longestStreak ?? streak.streak} days</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-1.5">
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <span className={cn('h-7 w-full rounded-md border transition-colors', d.count ? 'border-orange-400/40 bg-orange-400/25' : d.today ? 'border-dashed border-white/25 bg-white/[0.02]' : 'border-white/[0.06] bg-white/[0.02]')} title={`${d.count} submissions`} />
              <span className={cn('font-mono text-[9px]', d.today ? 'text-zinc-300' : 'text-zinc-600')}>{d.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-[11.5px]">
          {streak.atRisk ? (
            <span className="flex items-center gap-1.5 text-amber-300"><Timer className="h-3.5 w-3.5" /> {streak.hoursLeft != null ? `${streak.hoursLeft}h left` : 'Solve today'} to keep it alive</span>
          ) : streak.activeToday ? (
            <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Safe for today</span>
          ) : (
            <span className="text-zinc-500">Solve a problem to start a streak</span>
          )}
          <span className={cn('flex items-center gap-1 font-mono text-[10px]', streak.freezeAvailable ? 'text-sky-300' : 'text-zinc-600')} title="One free streak freeze per week — miss a day without losing your streak">
            <Snowflake className="h-3 w-3" /> {streak.freezeAvailable ? 'Freeze ready' : 'Freeze used'}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─── Daily challenge ─────────────────────────────────────────────────────────

const useCountdown = (iso) => {
  const [left, setLeft] = useState(() => Math.max(0, new Date(iso).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(iso).getTime() - Date.now())), 1000);
    return () => clearInterval(t);
  }, [iso]);
  const s = Math.floor(left / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export function DailyChallengeCard({ daily }) {
  const countdown = useCountdown(daily?.resetsAt || new Date(Date.now() + 3600000).toISOString());
  if (!daily) return <Card className="h-full"><Label>Daily challenge</Label><p className="mt-3 text-[12.5px] text-zinc-600">No challenge available yet — check back once problems are seeded.</p></Card>;
  const { problem } = daily;
  return (
    <Card className="relative h-full overflow-hidden">
      <div className="pointer-events-none absolute -left-10 -bottom-12 h-36 w-36 rounded-full bg-amber-400/[0.09] blur-[50px]" />
      <div className="relative flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <Label>Daily challenge</Label>
          <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-zinc-400"><Timer className="h-3 w-3" />{countdown}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold text-zinc-100">{problem.title}</div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-zinc-500">{problem.skill}<DiffPill difficulty={problem.difficulty} /></div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[20px] font-semibold text-amber-300"><Zap className="h-4 w-4" />{daily.totalXp}</div>
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-zinc-600">XP · {daily.baseXp}+{daily.bonusXp} bonus</div>
          </div>
        </div>
        {problem.companies?.length > 0 && (
          <div className="mt-4">
            <Label className="text-zinc-600">Asked at</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{problem.companies.slice(0, 5).map((c) => <span key={c} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400">{c}</span>)}</div>
          </div>
        )}
        <p className="mt-4 text-[11.5px] leading-relaxed text-zinc-600">Solve it today for a <b className="text-amber-300">×2.5 XP</b> bonus on top of your streak multiplier. A new challenge drops at midnight.</p>
        <div className="mt-auto pt-5">
          {daily.solvedToday ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-2.5 text-[12.5px] font-medium text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Completed — bonus banked. Come back tomorrow.</div>
          ) : (
            <Link to={`/problems/${problem._id}`} className="group flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 py-2.5 text-[12.5px] font-semibold text-black shadow-lg shadow-amber-500/15 transition-all hover:brightness-110">
              {daily.attemptsToday ? `Keep going · ${daily.attemptsToday} attempt${daily.attemptsToday > 1 ? 's' : ''} today` : 'Take the challenge'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Skill ledger (per-skill progression, prediction, cohort comparison) ─────

const TrendIcon = ({ trend }) => (trend === 'up' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : trend === 'down' ? <TrendingDown className="h-3.5 w-3.5 text-rose-400" /> : <Minus className="h-3.5 w-3.5 text-zinc-600" />);

const masteryColor = (p) => (p >= 0.85 ? '#34d399' : p >= 0.6 ? '#38bdf8' : p >= 0.35 ? '#fbbf24' : '#fb7185');

export function SkillLedger({ skills = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Skill', 'Mastery', 'vs Cohort', 'Trend', 'Time to mastery', 'Status'].map((h) => (
              <th key={h} className="pb-2.5 pr-4 font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-zinc-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((s, i) => {
            const locked = !s.isUnlocked && s.attempts === 0;
            return (
              <motion.tr key={s.skillId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[0.04] last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {locked && <Lock className="h-3 w-3 text-zinc-600" />}
                    <span className={cn('text-[13px] font-medium', locked ? 'text-zinc-600' : 'text-zinc-200')}>{s.name}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-600">{s.attempts} attempts</div>
                </td>
                <td className="w-[210px] py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Bar value={s.masteryP} max={1} color={masteryColor(s.masteryP)} height={6} className="flex-1" marker={0.85} />
                    <span className="w-10 text-right font-mono text-[12px] tabular-nums text-zinc-300">{Math.round(s.masteryP * 100)}%</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {s.cohortDelta !== null && s.cohortDelta !== undefined ? (
                    <span className={cn('font-mono text-[12px]', s.cohortDelta >= 0 ? 'text-emerald-400' : 'text-rose-400')} title={`Cohort average ${Math.round(s.cohortAvg * 100)}% across ${s.cohortPeers} students`}>
                      {s.cohortDelta >= 0 ? '+' : ''}{Math.round(s.cohortDelta * 100)} pts
                    </span>
                  ) : <span className="text-zinc-700">—</span>}
                </td>
                <td className="py-3 pr-4"><TrendIcon trend={s.trend} /></td>
                <td className="py-3 pr-4 text-[12px] text-zinc-400">
                  {s.isMastered ? <span className="text-emerald-400">Mastered</span>
                    : s.predictedAttemptsToMastery === null ? <span className="text-zinc-600">50+ attempts</span>
                    : <span title={`~${s.predictedAttemptsToMastery} solid attempts at your current pace`}>~{s.predictedDaysToMastery}d <span className="text-zinc-600">({s.predictedAttemptsToMastery} attempts)</span></span>}
                </td>
                <td className="py-3">
                  {s.reviewDue ? <Pill tone="amber" icon={RefreshCw}>Review due</Pill>
                    : s.isMastered ? <Pill tone="green">Mastered</Pill>
                    : locked ? <Pill tone="zinc" icon={Lock}>Locked</Pill>
                    : s.attempts === 0 ? <Pill tone="blue">Ready</Pill>
                    : <Pill tone="zinc">Learning</Pill>}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────────────────

const INSIGHT_ICON = { 'trending-up': TrendingUp, 'trending-down': TrendingDown, award: Award, target: Target, refresh: RefreshCw, clock: Clock, repeat: Repeat, users: Users, flame: Flame };
const INSIGHT_TONE = { positive: 'text-emerald-400 bg-emerald-400/10', warning: 'text-amber-400 bg-amber-400/10', focus: 'text-rose-400 bg-rose-400/10', review: 'text-sky-400 bg-sky-400/10', info: 'text-violet-400 bg-violet-400/10' };

export function InsightsPanel({ insights = [] }) {
  if (!insights.length) return <p className="text-[12.5px] text-zinc-600">Solve a few problems and personalised insights will appear here.</p>;
  return (
    <div className="space-y-2.5">
      {insights.map((ins, i) => {
        const Icon = INSIGHT_ICON[ins.icon] || Sparkles;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', INSIGHT_TONE[ins.type] || INSIGHT_TONE.info)}><Icon className="h-3.5 w-3.5" strokeWidth={1.8} /></span>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-zinc-200">{ins.title}</div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">{ins.text}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Recommendations ─────────────────────────────────────────────────────────

const KIND = { review: ['Review', 'blue', RefreshCw], unlock: ['Unlocks skill', 'violet', Lock], stretch: ['Stretch', 'red', Zap], practice: ['Practice', 'green', Target] };

export function RecommendationList({ recs = [] }) {
  if (!recs.length) return <p className="text-[12.5px] text-zinc-600">No recommendations yet — solve a problem to calibrate.</p>;
  return (
    <div className="space-y-2.5">
      {recs.map((r, i) => {
        const [label, tone, Icon] = KIND[r.kind] || KIND.practice;
        return (
          <motion.div key={r.problem._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/problems/${r.problem._id}`} className="group block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-all hover:border-white/[0.14] hover:bg-white/[0.045]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-zinc-100">{r.problem.title}</span>
                    <DiffPill difficulty={r.problem.difficulty} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-zinc-500">
                    <Pill tone={tone} icon={Icon}>{label}</Pill>{r.skill.name}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-[15px] tabular-nums text-zinc-200">{Math.round(r.predictedSuccess * 100)}%</div>
                    <div className="font-mono text-[8.5px] uppercase tracking-wider text-zinc-600">success</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-zinc-300" />
                </div>
              </div>
              {r.reasons?.length > 0 && (
                <ul className="mt-2.5 space-y-0.5 border-t border-white/[0.05] pt-2.5">
                  {r.reasons.slice(0, 3).map((reason, k) => <li key={k} className="flex gap-1.5 text-[11.5px] leading-snug text-zinc-500"><span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-zinc-600" />{reason}</li>)}
                </ul>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Achievements strip ──────────────────────────────────────────────────────

export function AchievementStrip({ achievements }) {
  if (!achievements) return null;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-zinc-500">{achievements.unlocked} of {achievements.total} unlocked</span>
        <Link to="/profile#badges" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[var(--signal)]">All badges <ArrowRight className="h-3 w-3" /></Link>
      </div>
      <Bar value={achievements.unlocked} max={achievements.total} height={5} color="linear-gradient(90deg,#a78bfa,#38bdf8)" />
      <div className="mt-4 flex flex-wrap gap-2.5">
        {achievements.recent?.length ? achievements.recent.map((a) => {
          const Icon = achievementIcon(a.icon);
          return (
            <div key={a.key} title={a.desc} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2', rarityStyle(a.rarity).ring)}>
              <Icon className="h-4 w-4" strokeWidth={1.7} />
              <span className="text-[12px] font-medium">{a.title}</span>
            </div>
          );
        }) : <span className="text-[12px] text-zinc-600">Solve your first problem to unlock <b className="text-zinc-400">First Blood</b>.</span>}
      </div>
    </div>
  );
}

export { SectionTitle, Bookmark };
