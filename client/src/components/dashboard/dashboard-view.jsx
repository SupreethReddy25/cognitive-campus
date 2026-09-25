import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Snowflake } from 'lucide-react';
import { analyticsService, usersService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSessionTracker } from '../../hooks/useSessionTracker';
import { ActivityHeatmap } from '../ui/activity-heatmap';
import { LeaderboardView } from '../leaderboard/leaderboard-view';
import { CountUp, Reveal, Skeleton, ErrorNote, cn } from '../ui/kit';
import { MasteryTrendChart } from './charts';
import { InsightsPanel, AchievementStrip, timeAgo, tierFor } from './widgets';
import { Constellation } from './constellation';

const QUOTE_CACHE = 'cached_ai_quote_v2';

function useCountdown(iso) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, new Date(iso).getTime() - Date.now());
      const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000); const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return left;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const dayKey = (d) => d.toLocaleDateString('en-CA');

/** The last seven days as a row of small suns — filled when you practised. */
function WeekDots({ activity = {} }) {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  return (
    <div className="flex items-end gap-2.5">
      {days.map((d, i) => {
        const n = activity[dayKey(d)] || 0;
        const today = i === 6;
        const size = n ? 10 + Math.min(n, 6) * 1.5 : 10;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5" title={`${d.toLocaleDateString('en', { weekday: 'long' })}: ${n} submission${n === 1 ? '' : 's'}`}>
            <span className={cn('block rounded-full transition-all', n ? 'bg-[var(--ember)]' : 'border border-[var(--line-strong)]', today && !n && 'border-dashed')} style={{ width: size, height: size }} />
            <span className={cn('text-[10px]', today ? 'text-zinc-300' : 'text-zinc-600')}>{d.toLocaleDateString('en', { weekday: 'narrow' })}</span>
          </div>
        );
      })}
    </div>
  );
}

function Skeletons() {
  return (
    <div className="space-y-10 px-6 py-14 md:px-14">
      <Skeleton className="h-24 w-2/3" /><Skeleton className="h-8 w-1/2" /><Skeleton className="h-[380px] w-full rounded-sm" />
    </div>
  );
}

const TABS = [['progress', 'Progress'], ['activity', 'Activity'], ['ranks', 'Leaderboard'], ['badges', 'Badges']];

export function DashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { getLastSession } = useSessionTracker();
  const lastSession = useMemo(() => getLastSession(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('progress');
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

  useEffect(() => {
    if (!data?.streak?.atRisk || sessionStorage.getItem('cc_streak_nudge')) return;
    sessionStorage.setItem('cc_streak_nudge', '1');
    toast.push({ type: 'warning', title: `Your ${data.streak.streak}-day streak is on the line`, message: data.streak.hoursLeft != null ? `${data.streak.hoursLeft}h left today — one solved problem keeps it alive.` : 'Solve one problem today to keep it alive.' });
  }, [data, toast]);

  const daily = data?.dailyChallenge;
  const countdown = useCountdown(daily?.resetsAt || new Date(Date.now() + 3600000).toISOString());

  if (!data && !error) return <div className="h-full overflow-y-auto scrollbar-surgical"><Skeletons /></div>;
  if (error && !data) return <div className="p-10"><ErrorNote>{error}</ErrorNote></div>;

  const { skills, totals, today, rank, resume, recommendations = [] } = data;
  const next = resume ? { id: resume._id, title: resume.title, verb: 'Resume', note: `${resume.attempts} attempt${resume.attempts === 1 ? '' : 's'} so far` }
    : recommendations[0] ? { id: recommendations[0].problem._id, title: recommendations[0].problem.title, verb: 'Start', note: recommendations[0].skill.name } : null;
  const mastered = skills.filter((s) => (s.currentP ?? s.masteryP) >= 0.85 && s.attempts > 0).length;
  const due = skills.filter((s) => s.reviewDue).length;
  const rawQ = quote || { text: 'Ready when you are, ', highlight: "let's go", highlightColor: '#34d399', suffix: '.' };
  // the hero already greets by name — drop a leading "Good morning, Aarav." from the AI line
  const trimmed = (rawQ.text || '').replace(/^\s*(good (morning|afternoon|evening|night)|hey|hi|hello|welcome back|still up)[^.!?]*[.!?]\s*/i, '');
  const q = { ...rawQ, text: trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : rawQ.text };
  const level = data.user.level;

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="mx-auto max-w-[1320px] px-6 md:px-14">
        {/* ═══ Hero — one sentence, one action ═══ */}
        <header className="pt-4 md:pt-8">
          <Reveal>
            <div className="tag">{new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })} · Level {level}, {tierFor(level)}</div>
            <h1 className="display mt-5 text-[clamp(45px,7.6vw,106px)] text-zinc-50">
              {greeting()},<br /><em className="text-[var(--ember)]">{data.user.firstName || user?.name}</em><span className="text-zinc-600">.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p
              onClick={() => q.contextPath && navigate(q.contextPath)}
              className={cn('mt-8 max-w-2xl text-[19px] leading-[1.55] text-zinc-400 md:text-[22px]', q.contextPath && 'cursor-pointer hover:text-zinc-300')}
            >
              {q.text?.trimEnd()}{' '}
              <span className="display text-[1.25em] italic" style={{ color: q.highlightColor || 'var(--ember)' }}>{q.highlight}</span>
              {q.suffix && /^[a-zA-Z]/.test(q.suffix) ? ` ${q.suffix}` : q.suffix}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              {next ? (
                <Link to={`/problems/${next.id}`} className="btn-line group">
                  <span className="text-[16px] font-semibold">{next.verb} {next.title}</span>
                  <span className="flex items-center justify-center"><ArrowRight className="h-[18px] w-[18px]" /></span>
                </Link>
              ) : (
                <Link to="/problems" className="btn-line group">Choose a problem</Link>
              )}
              {daily && !daily.solvedToday && (
                <Link to={`/problems/${daily.problem._id}`} className="group text-[14px] text-zinc-400 transition-colors hover:text-zinc-100">
                  <span className="text-zinc-200">Daily challenge</span> · {daily.problem.title} · <span className="tnum">{countdown}</span> left · <span className="text-[var(--star)]">+{daily.totalXp} XP</span>
                  <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              )}
              {daily?.solvedToday && <span className="text-[14px] text-zinc-500">Daily challenge done — bonus banked.</span>}
            </div>
            {next?.note && <div className="mt-3 pl-1 text-[12.5px] text-zinc-600">{next.note}</div>}
          </Reveal>
        </header>

        {/* ═══ Your sky ═══ */}
        <section className="mt-20 md:mt-28 pb-6">
          <Reveal>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
              <h2 className="display text-[32px] text-zinc-100 md:text-[41.6px]">Your <em>sky</em></h2>
              <div className="tag text-right !leading-[1.9]">
                <span className="text-zinc-200">{mastered}</span> of {skills.length} mastered{due > 0 && <> · <span className="text-[var(--signal)]">{due} fading</span></>}
                <br />hover a star to explore
              </div>
            </div>
          </Reveal>
          <Constellation skills={skills} />
        </section>

        {/* ═══ Tonight ═══ */}
        <section className="mt-16 grid gap-x-14 gap-y-14 border-t border-[var(--line-strong)] pt-12 lg:grid-cols-[1.35fr_1fr_1fr]">
          <Reveal>
            <h3 className="text-[13px] font-medium text-zinc-500">Up next, and why</h3>
            <ol className="mt-5">
              {recommendations.slice(0, 3).map((r, i) => (
                <li key={r.problem._id} className="border-b border-[var(--line)] last:border-0">
                  <Link to={`/problems/${r.problem._id}`} className="group flex items-start gap-5 py-4">
                    <span className="display w-6 pt-0.5 text-[19.2px] text-zinc-600">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[18px] font-medium text-zinc-100 transition-colors group-hover:text-[var(--ember)]">{r.problem.title}</span>
                      <span className="mt-1 block text-[13px] leading-snug text-zinc-500">{r.reasons?.[0] || `Builds ${r.skill.name}`}</span>
                    </span>
                    <span className="shrink-0 pt-1 text-right"><span className="display block text-[19.2px] tnum text-zinc-300">{Math.round(r.predictedSuccess * 100)}<span className="text-[13px]">%</span></span><span className="text-[10.5px] text-zinc-600">likely</span></span>
                  </Link>
                </li>
              ))}
              {!recommendations.length && <li className="py-4 text-[14px] text-zinc-600">Solve one problem and I&apos;ll start recommending.</li>}
            </ol>
          </Reveal>

          <Reveal delay={0.06}>
            <h3 className="text-[13px] font-medium text-zinc-500">Streak</h3>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="display text-[96px] leading-[0.9] tnum text-zinc-50"><CountUp value={data.streak.streak} /></span>
              <span className="text-[15px] text-zinc-500">day{data.streak.streak === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-6"><WeekDots activity={data.activity} /></div>
            <p className="mt-5 text-[13px] leading-relaxed text-zinc-500">
              {data.streak.atRisk
                ? <span className="text-[var(--ember)]">One solved problem keeps it alive{data.streak.hoursLeft != null ? ` — ${data.streak.hoursLeft}h left` : ''}.</span>
                : data.streak.multiplier > 1 ? <>Your streak multiplies today&apos;s XP by <span className="text-zinc-200">×{data.streak.multiplier}</span>.</> : 'Reach 3 days for an XP multiplier.'}
              {data.streak.freeze?.available && <span className="ml-2 inline-flex items-center gap-1 text-zinc-600"><Snowflake className="h-3 w-3" />freeze ready</span>}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <h3 className="text-[13px] font-medium text-zinc-500">Standing</h3>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="display text-[96px] leading-[0.9] tnum text-zinc-50">#{rank.position}</span>
              <span className="text-[15px] text-zinc-500">of {rank.total}</span>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-[12px] text-zinc-500"><span>Level {level}</span><span className="tnum">{100 - data.user.levelProgress} XP to {level + 1}</span></div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.08]"><motion.div className="h-full rounded-full bg-[var(--ember)]" initial={{ width: 0 }} animate={{ width: `${data.user.levelProgress}%` }} transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }} /></div>
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-zinc-500">
              {today.solved ? <>Today: <span className="text-zinc-200">{today.solved} solved</span>, +{today.xp} XP.</> : 'Nothing solved yet today.'} {totals.solved} of {totals.catalogue} problems overall.
            </p>
          </Reveal>
        </section>

        {/* ═══ Look closer ═══ */}
        <section className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line-strong)]">
            <h2 className="display pb-3 text-[32px] text-zinc-100 md:text-[41.6px]">Look <em>closer</em></h2>
            <div className="flex gap-1 pb-3">
              {TABS.map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={cn('relative rounded-sm px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', tab === k ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>
                  {tab === k && <motion.span layoutId="dash-tab" className="absolute inset-0 rounded-sm bg-white/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <span className="relative">{l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-10">
            {tab === 'progress' && (
              <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  <div className="mb-4 text-[13px] text-zinc-500">Average mastery, last 30 days — replayed from every attempt, forgetting included.</div>
                  <MasteryTrendChart timeline={data.masteryTimeline} skills={skills} height={300} />
                </div>
                <div>
                  <div className="mb-4 text-[13px] text-zinc-500">What the model noticed</div>
                  <InsightsPanel insights={(data.insights || []).slice(0, 4)} />
                  <Link to="/profile" className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-[var(--ember)]">Full skill breakdown <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                </div>
              </div>
            )}
            {tab === 'activity' && (
              <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
                <div>
                  <div className="mb-4 text-[13px] text-zinc-500"><span className="text-zinc-200">{Object.values(data.activity).reduce((a, b) => a + b, 0)}</span> submissions in the last year</div>
                  <ActivityHeatmap dateMap={data.activity} />
                </div>
                <div>
                  <div className="mb-3 text-[13px] text-zinc-500">Recent</div>
                  {data.recentSubmissions.slice(0, 6).map((s) => (
                    <Link key={s._id} to={`/problems/${s.problemId?._id}`} className="group flex items-center justify-between gap-3 border-b border-[var(--line)] py-3 last:border-0">
                      <span className="flex min-w-0 items-center gap-3"><span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', s.isCorrect ? 'bg-emerald-400' : 'bg-zinc-600')} /><span className="truncate text-[14px] text-zinc-300 group-hover:text-zinc-50">{s.problemId?.title || 'Problem'}</span></span>
                      <span className="shrink-0 text-[12px] text-zinc-600">{timeAgo(s.createdAt)}</span>
                    </Link>
                  ))}
                  {!data.recentSubmissions.length && <p className="text-[13px] text-zinc-600">Nothing yet.</p>}
                </div>
              </div>
            )}
            {tab === 'ranks' && <LeaderboardView />}
            {tab === 'badges' && <AchievementStrip achievements={data.achievements} />}
          </div>
        </section>

        <footer className="mt-28 flex items-center justify-between border-t border-[var(--line)] py-8 text-[12px] text-zinc-700">
          <span className="display text-[14.4px] italic text-zinc-600">cogni.</span>
          <span>Bayesian knowledge tracing · every solve moves a star</span>
        </footer>
      </div>
    </div>
  );
}
