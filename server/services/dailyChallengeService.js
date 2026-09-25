/**
 * Daily Challenge Service
 *
 * One featured problem per calendar day, chosen deterministically from the approved
 * catalogue (same problem for everyone, rotating difficulty across the week). Solving it
 * for the first time that day grants bonus XP.
 *
 * @module dailyChallengeService
 */

const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const knowledge = require('./knowledgeService');

const BONUS_MULTIPLIER = 1.5; // extra XP on top of the normal award (×1.5 of base as bonus → 2.5× total)

const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// Weekly difficulty rhythm: gentle start, mid-week medium, hard on the weekend.
const WEEK_RHYTHM = ['easy', 'medium', 'medium', 'easy', 'medium', 'hard', 'hard']; // Mon..Sun mapping below

const hashString = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const endOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(24, 0, 0, 0);
  return x;
};

/** Picks today's challenge problem doc (lean) or null if the catalogue is empty. */
const pickDailyProblem = async (date = new Date()) => {
  const key = dayKey(date);
  return knowledge.remember(`daily:${key}`, 60 * 60 * 1000, async () => {
    const jsDay = date.getDay(); // 0 = Sun
    const wanted = WEEK_RHYTHM[(jsDay + 6) % 7];
    let pool = await Problem.find({ isActive: true, status: 'approved', difficulty: wanted })
      .select('title difficulty skillId xpReward companies description')
      .populate('skillId', 'name')
      .sort({ _id: 1 })
      .lean();
    if (pool.length === 0) {
      pool = await Problem.find({ isActive: true, status: 'approved' })
        .select('title difficulty skillId xpReward companies description')
        .populate('skillId', 'name')
        .sort({ _id: 1 })
        .lean();
    }
    if (pool.length === 0) return null;
    return pool[hashString(key) % pool.length];
  });
};

/**
 * Daily challenge payload for a user (adds solved flag + countdown).
 */
const getDailyChallenge = async (userId, now = new Date()) => {
  const problem = await pickDailyProblem(now);
  if (!problem) return null;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const [solvedToday, attemptsToday] = await Promise.all([
    Submission.findOne({ userId, problemId: problem._id, isCorrect: true, createdAt: { $gte: startOfToday } }).select('_id').lean(),
    Submission.countDocuments({ userId, problemId: problem._id, createdAt: { $gte: startOfToday } })
  ]);

  const base = problem.xpReward || { easy: 10, medium: 20, hard: 40 }[problem.difficulty] || 10;
  return {
    problem: {
      _id: problem._id,
      title: problem.title,
      difficulty: problem.difficulty,
      skill: problem.skillId?.name || null,
      companies: problem.companies || []
    },
    baseXp: base,
    bonusXp: Math.round(base * BONUS_MULTIPLIER),
    totalXp: base + Math.round(base * BONUS_MULTIPLIER),
    solvedToday: !!solvedToday,
    attemptsToday,
    resetsAt: endOfDay(now).toISOString(),
    date: dayKey(now)
  };
};

/** True when `problemId` is today's challenge and the user has not yet banked the bonus. */
const isBonusEligible = async (userId, problemId, now = new Date()) => {
  const problem = await pickDailyProblem(now);
  if (!problem || String(problem._id) !== String(problemId)) return false;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const already = await Submission.findOne({
    userId,
    problemId,
    isCorrect: true,
    isDailyChallenge: true,
    createdAt: { $gte: startOfToday }
  }).select('_id').lean();
  return !already;
};

module.exports = { getDailyChallenge, pickDailyProblem, isBonusEligible, BONUS_MULTIPLIER, dayKey };
