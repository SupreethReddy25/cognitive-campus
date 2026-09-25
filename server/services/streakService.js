/**
 * Streak Service — streak counting, weekly streak freeze, and XP multiplier.
 *
 * Rules
 *   - Solving anything on consecutive calendar days extends the streak.
 *   - One "streak freeze" is granted per ISO week. Missing exactly one day consumes it
 *     automatically instead of resetting the streak.
 *   - Streak multiplier on XP: 3d ×1.1, 7d ×1.25, 14d ×1.5, 30d ×2.0.
 *
 * Pure functions over a plain user object; the caller persists.
 *
 * @module streakService
 */

const DAY = 86400000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const dayDiff = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY);

/** ISO week key like 2026-W39. */
const isoWeekKey = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const MILESTONES = [3, 7, 14, 30, 50, 100];

const streakMultiplier = (streak) => {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1;
};

/** Refills the weekly freeze when a new ISO week has started (mutates the freeze object). */
const refillFreeze = (freeze, now = new Date()) => {
  const week = isoWeekKey(now);
  if (freeze.lastRefillWeek !== week) {
    freeze.available = 1;
    freeze.lastRefillWeek = week;
  }
  return freeze;
};

/**
 * Non-mutating view of the streak as it should be *displayed* right now.
 *
 * @returns {{streak:number, atRisk:boolean, brokenBy:number, freezeAvailable:boolean, hoursLeft:number|null, activeToday:boolean}}
 */
const describeStreak = (user, now = new Date()) => {
  const freezeAvail = (() => {
    const f = user.streakFreeze || {};
    const week = isoWeekKey(now);
    return f.lastRefillWeek !== week ? true : (f.available || 0) > 0;
  })();

  if (!user.lastActiveDate || !user.streak) {
    return { streak: 0, atRisk: false, brokenBy: 0, freezeAvailable: freezeAvail, hoursLeft: null, activeToday: false };
  }
  const diff = dayDiff(user.lastActiveDate, now);
  if (diff <= 0) return { streak: user.streak, atRisk: false, brokenBy: 0, freezeAvailable: freezeAvail, hoursLeft: null, activeToday: true };
  const midnight = startOfDay(now).getTime() + DAY;
  if (diff === 1) {
    return { streak: user.streak, atRisk: true, brokenBy: 0, freezeAvailable: freezeAvail, hoursLeft: Math.max(0, Math.round((midnight - now.getTime()) / 3600000)), activeToday: false };
  }
  if (diff === 2 && freezeAvail) {
    return { streak: user.streak, atRisk: true, brokenBy: 1, freezeAvailable: true, hoursLeft: Math.max(0, Math.round((midnight - now.getTime()) / 3600000)), activeToday: false };
  }
  return { streak: 0, atRisk: false, brokenBy: diff, freezeAvailable: freezeAvail, hoursLeft: null, activeToday: false };
};

/**
 * Records activity for `now`, mutating `user` (streak, longestStreak, lastActiveDate, streakFreeze).
 *
 * @returns {{streakBefore:number, streakAfter:number, freezeUsed:boolean, milestone:number|null, extended:boolean, multiplier:number}}
 */
const recordActivity = (user, now = new Date()) => {
  if (!user.streakFreeze) user.streakFreeze = { available: 1, lastRefillWeek: null, lastUsedAt: null };
  refillFreeze(user.streakFreeze, now);

  const before = user.streak || 0;
  let freezeUsed = false;
  let extended = false;

  if (!user.lastActiveDate) {
    user.streak = 1;
    extended = true;
  } else {
    const diff = dayDiff(user.lastActiveDate, now);
    if (diff === 0) {
      // same day — unchanged
    } else if (diff === 1) {
      user.streak = before + 1;
      extended = true;
    } else if (diff === 2 && user.streakFreeze.available > 0) {
      user.streakFreeze.available -= 1;
      user.streakFreeze.lastUsedAt = now;
      user.streak = before + 1;
      freezeUsed = true;
      extended = true;
    } else {
      user.streak = 1;
      extended = before !== 1;
    }
  }

  user.lastActiveDate = now;
  user.longestStreak = Math.max(user.longestStreak || 0, user.streak);
  const milestone = extended && MILESTONES.includes(user.streak) ? user.streak : null;

  return {
    streakBefore: before,
    streakAfter: user.streak,
    freezeUsed,
    milestone,
    extended,
    multiplier: streakMultiplier(user.streak)
  };
};

module.exports = { recordActivity, describeStreak, streakMultiplier, isoWeekKey, dayDiff, MILESTONES };
