/**
 * Knowledge Service — DB-aware glue around the pure BKT engine.
 *
 * Responsibilities:
 *   - load / cache the learned per-skill BKT parameters (and refit them from real data)
 *   - replay a student's submissions into per-skill mastery trajectories
 *   - cohort statistics (average mastery per skill, percentile ranks)
 *   - forward predictions (attempts / days to mastery, review due dates)
 *
 * @module knowledgeService
 */

const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const BktParams = require('../models/BktParams');
const bkt = require('./bktEngine');
const logger = require('../utils/logger');

// ─── tiny TTL cache ───────────────────────────────────────────
const cache = new Map();
const remember = async (key, ttlMs, loader) => {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
};
const invalidate = (prefix) => {
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
};

const DAY = 86400000;

// ─── Parameters ───────────────────────────────────────────────

/** @returns {Promise<Map<string, object>>} skillId → {pL0,pT,pS,pG,fitted} */
const getParamsMap = () =>
  remember('bktParams', 5 * 60 * 1000, async () => {
    const rows = await BktParams.find({}).lean();
    return new Map(rows.map((r) => [String(r.skillId), { pL0: r.pL0, pT: r.pT, pS: r.pS, pG: r.pG, fitted: true, sequences: r.sequences, observations: r.observations }]));
  });

const paramsFor = (map, skillId) => map.get(String(skillId)) || { ...bkt.DEFAULT_PARAMS, fitted: false };

/** Problem catalogue (id → {difficulty, skillId, title}) cached for a minute. */
const getProblemIndex = () =>
  remember('problemIndex', 60 * 1000, async () => {
    const rows = await Problem.find({ isActive: true }).select('title difficulty skillId companies company status').lean();
    return new Map(rows.map((p) => [String(p._id), p]));
  });

const getSkills = () =>
  remember('skills', 5 * 60 * 1000, async () => Skill.find({}).populate('prerequisites', 'name order').sort({ order: 1 }).lean());

/**
 * Refit BKT parameters for every skill from the cohort's real attempt sequences.
 * Sequences are per (student, skill), ordered by time.
 *
 * @returns {Promise<Array>} summary rows
 */
const refitAllSkillParams = async () => {
  const skills = await Skill.find({}).lean();
  const rows = await Submission.find({}).select('userId skillId isCorrect createdAt').sort({ createdAt: 1 }).lean();

  const grouped = new Map(); // skillId → userId → outcomes[]
  for (const r of rows) {
    const sk = String(r.skillId);
    if (!grouped.has(sk)) grouped.set(sk, new Map());
    const byUser = grouped.get(sk);
    const uk = String(r.userId);
    if (!byUser.has(uk)) byUser.set(uk, []);
    byUser.get(uk).push(!!r.isCorrect);
  }

  const summary = [];
  for (const skill of skills) {
    const byUser = grouped.get(String(skill._id));
    const sequences = byUser ? [...byUser.values()] : [];
    const fit = bkt.fitParams(sequences);
    if (!fit.fitted) {
      summary.push({ skill: skill.name, fitted: false, sequences: fit.sequences, observations: fit.observations });
      continue;
    }
    await BktParams.updateOne(
      { skillId: skill._id },
      {
        $set: {
          ...fit.params,
          sequences: fit.sequences,
          observations: fit.observations,
          logLikelihood: fit.logLikelihood,
          baselineLogLikelihood: fit.baselineLogLikelihood,
          fittedAt: new Date()
        }
      },
      { upsert: true }
    );
    summary.push({
      skill: skill.name,
      fitted: true,
      params: fit.params,
      sequences: fit.sequences,
      observations: fit.observations,
      improvement: +(fit.logLikelihood - fit.baselineLogLikelihood).toFixed(2)
    });
  }
  invalidate('bktParams');
  logger.info(`BKT parameters refit for ${summary.filter((s) => s.fitted).length}/${skills.length} skills`);
  return summary;
};

// ─── Trajectories ─────────────────────────────────────────────

/**
 * Loads every submission for a user and replays it through BKT per skill.
 *
 * @returns {Promise<{bySkill: Map<string, Array>, all: Array}>}
 */
const getUserTrajectories = async (userId) => {
  const [subs, paramsMap, problemIdx] = await Promise.all([
    Submission.find({ userId }).select('skillId problemId isCorrect createdAt hintsUsed language timeTaken').sort({ createdAt: 1 }).lean(),
    getParamsMap(),
    getProblemIndex()
  ]);

  const perSkillAttempts = new Map();
  for (const s of subs) {
    const key = String(s.skillId);
    if (!perSkillAttempts.has(key)) perSkillAttempts.set(key, []);
    perSkillAttempts.get(key).push({
      correct: s.isCorrect,
      at: s.createdAt,
      difficulty: problemIdx.get(String(s.problemId))?.difficulty,
      hints: s.hintsUsed || 0
    });
  }

  const bySkill = new Map();
  for (const [skillId, attempts] of perSkillAttempts) {
    bySkill.set(skillId, bkt.replayTrajectory(attempts, paramsFor(paramsMap, skillId)));
  }
  return { bySkill, submissions: subs, paramsMap, problemIdx };
};

/**
 * Daily mastery timeline (average of tracked skills, step-carried forward) for the last N days,
 * plus per-skill series for the top movers.
 */
const buildMasteryTimeline = (trajectories, days = 30, allSkillCount = 12) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const start = new Date(today.getTime() - (days - 1) * DAY);
  start.setHours(0, 0, 0, 0);

  const timeline = [];
  const prior = bkt.P_L0;
  for (let i = 0; i < days; i++) {
    const dayEnd = new Date(start.getTime() + i * DAY);
    dayEnd.setHours(23, 59, 59, 999);
    const perSkill = {};
    let sum = 0;
    let touched = 0;
    for (const [skillId, traj] of trajectories) {
      let last = null;
      for (const t of traj) {
        if (new Date(t.at) <= dayEnd) last = t; else break;
      }
      if (last) {
        perSkill[skillId] = last.masteryP;
        sum += last.masteryP;
        touched++;
      }
    }
    // Untouched skills sit at the prior, so the average reflects overall progress, not just touched skills.
    const avg = (sum + (allSkillCount - touched) * prior) / allSkillCount;
    timeline.push({
      date: dayEnd.toISOString().slice(0, 10),
      avgMastery: +avg.toFixed(4),
      touchedSkills: touched,
      perSkill
    });
  }
  return timeline;
};

// ─── Cohort ───────────────────────────────────────────────────

/** skillId → {avg, n, mastered} across students that have actually attempted the skill. */
const getCohortSkillStats = () =>
  remember('cohortStats', 60 * 1000, async () => {
    const rows = await SkillState.aggregate([
      { $match: { attempts: { $gt: 0 } } },
      { $group: { _id: '$skillId', avg: { $avg: '$masteryP' }, n: { $sum: 1 }, mastered: { $sum: { $cond: ['$isMastered', 1, 0] } } } }
    ]);
    return new Map(rows.map((r) => [String(r._id), { avg: r.avg, n: r.n, mastered: r.mastered }]));
  });

/**
 * Percentile of `masteryP` among peers for a skill (0-100, higher is better).
 * Peers = students with ≥1 attempt on the skill, optionally restricted to a college.
 */
const skillPercentile = async (skillId, masteryP, collegeId = null) => {
  const userFilter = collegeId ? { collegeId } : {};
  const userIds = collegeId ? (await User.find(userFilter).select('_id').lean()).map((u) => u._id) : null;
  const match = { skillId, attempts: { $gt: 0 } };
  if (userIds) match.userId = { $in: userIds };
  const [below, total] = await Promise.all([
    SkillState.countDocuments({ ...match, masteryP: { $lt: masteryP } }),
    SkillState.countDocuments(match)
  ]);
  if (total <= 1) return { percentile: null, peers: total };
  return { percentile: Math.round((below / (total - 1)) * 100), peers: total };
};

// ─── Predictions ──────────────────────────────────────────────

/**
 * Enriches a SkillState with forgetting-adjusted mastery, trend, review timing and
 * time-to-mastery predictions.
 */
const describeSkillState = ({ state, skill, trajectory, params, cohort, attemptsPerDay, now = Date.now() }) => {
  const stored = state.masteryP;
  const lastAt = state.attempts > 0 ? new Date(state.lastUpdated || state.updatedAt).getTime() : null;
  const idleDays = lastAt ? Math.max(0, (now - lastAt) / DAY) : 0;
  const currentP = lastAt ? bkt.applyForgetting(stored, idleDays, state.correctAttempts || 0, params) : stored;
  const velocity = trajectory ? bkt.learningVelocity(trajectory) : 0;
  const reviewInDays = lastAt ? bkt.daysUntilReview(state.correctAttempts || 0) - idleDays : null;
  const attemptsToGo = bkt.attemptsToMastery(currentP, params);
  const rate = Math.max(0.3, attemptsPerDay || 1);

  return {
    skillId: String(skill._id),
    name: skill.name,
    order: skill.order,
    masteryP: stored,
    currentP,
    attempts: state.attempts || 0,
    correctAttempts: state.correctAttempts || 0,
    isUnlocked: !!state.isUnlocked,
    isMastered: !!state.isMastered,
    lastPracticedAt: lastAt ? new Date(lastAt).toISOString() : null,
    idleDays: lastAt ? +idleDays.toFixed(1) : null,
    trend: velocity > 0.012 ? 'up' : velocity < -0.012 ? 'down' : 'flat',
    velocity: +velocity.toFixed(4),
    reviewDue: reviewInDays !== null && reviewInDays <= 0 && stored >= 0.5,
    reviewInDays: reviewInDays === null ? null : +reviewInDays.toFixed(1),
    predictedAttemptsToMastery: attemptsToGo,
    predictedDaysToMastery: attemptsToGo === null ? null : attemptsToGo === 0 ? 0 : Math.max(1, Math.ceil(attemptsToGo / rate)),
    successProbability: +bkt.predictCorrect(currentP, params).toFixed(3),
    cohortAvg: cohort ? +cohort.avg.toFixed(4) : null,
    cohortPeers: cohort ? cohort.n : 0,
    cohortDelta: cohort ? +(stored - cohort.avg).toFixed(4) : null,
    params: { pL0: params.pL0, pT: params.pT, pS: params.pS, pG: params.pG, learnedFromData: !!params.fitted }
  };
};

module.exports = {
  getParamsMap,
  paramsFor,
  getProblemIndex,
  getSkills,
  refitAllSkillParams,
  getUserTrajectories,
  buildMasteryTimeline,
  getCohortSkillStats,
  skillPercentile,
  describeSkillState,
  invalidate,
  remember
};
