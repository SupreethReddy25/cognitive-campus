/**
 * Shared dashboard/profile pieces: tier names, relative time, the skill ledger, model insights and the badge shelf.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import { achievementIcon, cn } from '../ui/kit';
import { starColor } from './constellation';

const TIERS = [[40, 'Legend'], [30, 'Archon'], [15, 'Adept'], [1, 'Apprentice']];
export const tierFor = (level) => (TIERS.find(([min]) => level >= min) || TIERS[TIERS.length - 1])[1];

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

// ─── Skill ledger ────────────────────────────────────────────────────────────

const TREND = { up: ['↑ rising', 'text-emerald-400'], down: ['↓ slipping', 'text-rose-400'], flat: ['→ steady', 'text-zinc-500'] };

export function SkillLedger({ skills = [] }) {
  return (
    <div>
      {skills.map((s, i) => {
        const locked = !s.isUnlocked && s.attempts === 0;
        const p = s.currentP ?? s.masteryP;
        const [trendLabel, trendTone] = TREND[s.trend] || TREND.flat;
        return (
          <motion.div key={s.skillId} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-2 border-b border-[var(--line)] py-4 md:grid-cols-[minmax(180px,1.1fr)_2fr_120px_150px]">
            <div className="flex items-center gap-2.5">
              {locked && <Lock className="h-3.5 w-3.5 text-zinc-600" />}
              <div>
                <div className={cn('display text-[20.8px] leading-none', locked ? 'text-zinc-600' : 'text-zinc-100')}>{s.name}</div>
                <div className="mt-1 text-[12px] text-zinc-600">{s.attempts} attempt{s.attempts === 1 ? '' : 's'}{s.reviewDue && <span className="text-[var(--ember)]"> · review due</span>}</div>
              </div>
            </div>
            <div className="order-last col-span-2 flex items-center gap-4 md:order-none md:col-span-1">
              <div className="relative h-[3px] flex-1 rounded-full bg-white/[0.07]">
                <motion.div className="h-full rounded-full" style={{ background: starColor(p, s.attempts) }} initial={{ width: 0 }} whileInView={{ width: `${p * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }} />
                <span className="absolute -top-[3px] h-[9px] w-px bg-white/25" style={{ left: '85%' }} title="mastery threshold" />
              </div>
              <span className="display w-14 text-right text-[22.4px] leading-none tnum text-zinc-100">{Math.round(p * 100)}<span className="text-[14px] text-zinc-500">%</span></span>
            </div>
            <div className="hidden text-right text-[13px] md:block">
              {s.cohortDelta != null && s.attempts > 0 ? <span className={cn('tnum', s.cohortDelta >= 0 ? 'text-zinc-300' : 'text-zinc-500')} title={`Cohort average ${Math.round((s.cohortAvg || 0) * 100)}% across ${s.cohortPeers} students`}>{s.cohortDelta >= 0 ? '+' : ''}{Math.round(s.cohortDelta * 100)} vs peers</span> : <span className="text-zinc-700">—</span>}
            </div>
            <div className="text-right text-[13px]">
              {s.isMastered ? <span className="text-[var(--star)]">Mastered</span>
                : locked ? <span className="text-zinc-600">Locked</span>
                : s.attempts === 0 ? <span className="text-zinc-500">Ready to start</span>
                : <span className="text-zinc-500"><span className={trendTone}>{trendLabel}</span>{s.predictedAttemptsToMastery ? <><br /><span className="text-[12px] text-zinc-600">~{s.predictedAttemptsToMastery} solves to master</span></> : null}</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────────────────

const TONE = { positive: 'bg-emerald-400', warning: 'bg-amber-400', focus: 'bg-rose-400', review: 'bg-[var(--ember)]', info: 'bg-sky-400' };

export function InsightsPanel({ insights = [] }) {
  if (!insights.length) return <p className="text-[14px] text-zinc-600">Solve a few problems and personalised insights will appear here.</p>;
  return (
    <ul>
      {insights.map((ins, i) => (
        <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07 * i }} className="flex gap-4 border-b border-[var(--line)] py-4 last:border-0">
          <span className={cn('mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full', TONE[ins.type] || TONE.info)} />
          <div>
            <div className="text-[16px] font-medium text-zinc-100">{ins.title}</div>
            <div className="mt-1 text-[14px] leading-relaxed text-zinc-500">{ins.text}</div>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

// ─── Badge shelf ─────────────────────────────────────────────────────────────

const RARITY_RING = { common: '#9a9384', rare: '#38bdf8', epic: '#a78bfa', legendary: '#fbbf24' };

export function Badge({ a, size = 72 }) {
  const Icon = achievementIcon(a.icon);
  const ring = RARITY_RING[a.rarity] || RARITY_RING.common;
  return (
    <div className="group flex w-[112px] flex-col items-center text-center" title={a.desc}>
      <div className="relative flex items-center justify-center rounded-full transition-transform duration-300 group-hover:-translate-y-1" style={{ width: size, height: size, border: `1px ${a.unlocked ? 'solid' : 'dashed'} ${a.unlocked ? ring : 'rgba(236,230,216,0.16)'}`, boxShadow: a.unlocked ? `0 0 0 5px ${ring}14, inset 0 0 26px ${ring}22` : 'none' }}>
        {a.unlocked ? <Icon className="h-7 w-7" style={{ color: ring }} strokeWidth={1.4} /> : <Lock className="h-5 w-5 text-zinc-700" />}
      </div>
      <div className={cn('mt-3 text-[13px] font-medium leading-tight', a.unlocked ? 'text-zinc-200' : 'text-zinc-600')}>{a.title}</div>
      {!a.unlocked && a.progress && <div className="mt-1.5 h-[2px] w-14 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-zinc-500" style={{ width: `${(a.progress.current / a.progress.target) * 100}%` }} /></div>}
      {!a.unlocked && a.progress && <div className="mt-1 text-[10.5px] tnum text-zinc-700">{a.progress.current}/{a.progress.target}</div>}
    </div>
  );
}

export function AchievementStrip({ achievements }) {
  if (!achievements) return null;
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="text-[14px] text-zinc-500"><span className="display text-[32px] tnum text-zinc-50">{achievements.unlocked}</span> <span className="text-zinc-600">of {achievements.total} earned</span></div>
        <Link to="/profile#badges" className="flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-[var(--ember)]">The whole shelf <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      {achievements.recent?.length ? (
        <div className="flex flex-wrap gap-8">{achievements.recent.map((a) => <Badge key={a.key} a={{ ...a, unlocked: true }} />)}</div>
      ) : <span className="text-[14px] text-zinc-600">Solve your first problem to earn <b className="text-zinc-400">First Blood</b>.</span>}
    </div>
  );
}
