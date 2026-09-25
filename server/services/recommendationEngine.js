/**
 * Recommendation Engine v2 — multi-factor, explainable.
 *
 * For every unlocked skill we compute a *skill priority* from:
 *   need        1 − forgetting-adjusted mastery
 *   urgency     spaced-repetition: how overdue a review is (only for skills already learned)
 *   decline     performance trend — falling recent accuracy raises priority
 *   demand      how often the skill shows up in interviews at the student's target company / college
 *   unlock      cross-skill reinforcement: strengthening a prerequisite that gates a nearly-unlocked skill
 *
 * Then every candidate problem in the top skills is scored by
 *   skill priority · zone-of-proximal-development fit (target ≈ 65 % predicted success)
 *   · novelty (unsolved / productive struggle) · company relevance
 * with a difficulty *ramp* (never more than one level above the hardest thing already solved in
 * that skill) and diversification (max two per skill, review problems interleaved).
 *
 * Every recommendation carries human-readable `reasons` so the UI can explain itself.
 *
 * @module recommendationEngine
 */

const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const InterviewExperience = require('../models/InterviewExperience');
const bkt = require('./bktEngine');
const knowledge = require('./knowledgeService');
const { mapTopicToSkill } = require('./topicSkillMapper');
const logger = require('../utils/logger');

const DAY = 86400000;
const DIFF_SCORE = { easy: 1, medium: 2, hard: 3 };
const SCORE_DIFF = { 1: 'easy', 2: 'medium', 3: 'hard' };
const TARGET_SUCCESS = 0.65;

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/**
 * skillName → 0..1 demand, from interview experiences at the user's target company and college.
 * Target company counts double.
 */
const getSkillDemand = async (user) => {
  const demand = {};
  const add = (experiences, weight) => {
    experiences.forEach((exp) => {
      exp.rounds?.forEach((r) => {
        (r.topics || []).forEach((t) => {
          const m = mapTopicToSkill(t);
          if (m.tracked) demand[m.skillName] = (demand[m.skillName] || 0) + weight;
        });
        (r.questions || []).forEach((q) => (q.topicTags || []).forEach((t) => {
          const m = mapTopicToSkill(t);
          if (m.tracked) demand[m.skillName] = (demand[m.skillName] || 0) + weight * 0.5;
        }));
      });
    });
  };

  const jobs = [];
  if (user.targetCompanyId) {
    jobs.push(InterviewExperience.find({ companyId: user.targetCompanyId, status: 'Published' }).select('rounds').lean().then((e) => add(e, 2)));
  }
  if (user.collegeId) {
    jobs.push(InterviewExperience.find({ collegeId: user.collegeId, status: 'Published' }).select('rounds').lean().then((e) => add(e, 1)));
  }
  await Promise.all(jobs);

  const max = Math.max(0, ...Object.values(demand));
  if (max === 0) return {};
  Object.keys(demand).forEach((k) => { demand[k] = demand[k] / max; });
  return demand;
};

/**
 * Ranked, explained recommendations.
 *
 * @param {string} userId
 * @param {{limit?:number, excludeProblemIds?:string[]}} [opts]
 * @returns {Promise<Array>} recommendations, best first
 */
const getRecommendations = async (userId, opts = {}) => {
  const { limit = 6, excludeProblemIds = [] } = opts;
  const now = Date.now();
  try {
    const [user, states, skills, paramsMap, problems, subs] = await Promise.all([
      User.findById(userId).select('targetCompanyId collegeId').populate('targetCompanyId', 'name').lean(),
      SkillState.find({ userId }).lean(),
      knowledge.getSkills(),
      knowledge.getParamsMap(),
      Problem.find({ isActive: true, status: 'approved', skillId: { $ne: null } })
        .select('title difficulty skillId companies company xpReward')
        .lean(),
      Submission.find({ userId }).select('problemId skillId isCorrect createdAt').sort({ createdAt: 1 }).lean()
    ]);
    if (!user) return [];

    const demand = await getSkillDemand(user);
    const targetCompanyName = user.targetCompanyId?.name || null;
    const skillById = new Map(skills.map((s) => [String(s._id), s]));
    const stateBySkill = new Map(states.map((s) => [String(s.skillId), s]));

    // ── per-problem history ──
    const history = new Map(); // problemId → {attempts, fails, solved, lastAt}
    const solvedMaxDiff = new Map(); // skillId → hardest solved difficulty score
    const recentOutcomes = new Map(); // skillId → outcomes[] chronological
    const problemById = new Map(problems.map((p) => [String(p._id), p]));
    for (const s of subs) {
      const pid = String(s.problemId);
      const h = history.get(pid) || { attempts: 0, fails: 0, solved: false, lastAt: 0 };
      h.attempts++;
      if (s.isCorrect) h.solved = true; else h.fails++;
      h.lastAt = new Date(s.createdAt).getTime();
      history.set(pid, h);

      const sk = String(s.skillId);
      if (!recentOutcomes.has(sk)) recentOutcomes.set(sk, []);
      recentOutcomes.get(sk).push(!!s.isCorrect);
      if (s.isCorrect) {
        const d = DIFF_SCORE[problemById.get(pid)?.difficulty] || 0;
        solvedMaxDiff.set(sk, Math.max(solvedMaxDiff.get(sk) || 0, d));
      }
    }

    // ── unlocked skill set (entry skills unlocked by default for brand-new users) ──
    const unlockedIds = new Set(states.filter((s) => s.isUnlocked).map((s) => String(s.skillId)));
    if (unlockedIds.size === 0) {
      skills.filter((s) => (s.prerequisites || []).length === 0).forEach((s) => unlockedIds.add(String(s._id)));
    }

    // ── locked skills that are one prerequisite away → reinforce that prerequisite ──
    const unlockBoost = new Map();
    for (const skill of skills) {
      const sid = String(skill._id);
      if (unlockedIds.has(sid)) continue;
      const prereqs = skill.prerequisites || [];
      const unmet = prereqs.filter((p) => (stateBySkill.get(String(p._id))?.masteryP ?? bkt.P_L0) < bkt.UNLOCK_THRESHOLD);
      if (unmet.length === 1) {
        const pid = String(unmet[0]._id);
        const p = stateBySkill.get(pid)?.masteryP ?? bkt.P_L0;
        const proximity = clamp01(p / bkt.UNLOCK_THRESHOLD);
        unlockBoost.set(pid, { boost: Math.max(unlockBoost.get(pid)?.boost || 0, 0.4 + 0.6 * proximity), unlocks: skill.name });
      }
    }

    // ── skill priority ──
    const skillPriority = [];
    for (const sid of unlockedIds) {
      const skill = skillById.get(sid);
      if (!skill) continue;
      const state = stateBySkill.get(sid) || { masteryP: bkt.P_L0, attempts: 0, correctAttempts: 0, lastUpdated: null };
      const params = knowledge.paramsFor(paramsMap, sid);
      const lastAt = state.attempts > 0 ? new Date(state.lastUpdated || state.updatedAt).getTime() : null;
      const idle = lastAt ? (now - lastAt) / DAY : 0;
      const pNow = lastAt ? bkt.applyForgetting(state.masteryP, idle, state.correctAttempts, params) : state.masteryP;

      const need = 1 - pNow;
      const dueIn = lastAt ? bkt.daysUntilReview(state.correctAttempts) : Infinity;
      const urgency = lastAt && state.masteryP >= 0.5 ? clamp01(idle / Math.max(dueIn, 0.5) - 0.5) : 0;

      const outcomes = recentOutcomes.get(sid) || [];
      const last5 = outcomes.slice(-5);
      const prev5 = outcomes.slice(-10, -5);
      const acc = (a) => (a.length ? a.filter(Boolean).length / a.length : null);
      const a1 = acc(last5);
      const a0 = acc(prev5);
      const decline = a1 !== null && a0 !== null && a1 < a0 ? clamp01(a0 - a1) : (a1 !== null && a1 < 0.4 ? 0.3 : 0);

      const dem = demand[skill.name] || 0;
      const ub = unlockBoost.get(sid);

      const score = 0.38 * need + 0.2 * urgency + 0.14 * decline + 0.16 * dem + 0.12 * (ub?.boost || 0);
      const reasons = [];
      if (state.attempts === 0) reasons.push('New skill — a calibration problem sets your baseline');
      else if (need > 0.55) reasons.push(`Weak spot: ${Math.round(pNow * 100)}% mastery`);
      if (urgency > 0.3) reasons.push(`Review due — you last practised ${Math.round(idle)}d ago`);
      if (decline > 0.15) reasons.push('Recent accuracy is trending down');
      if (dem > 0.5) reasons.push(targetCompanyName ? `Frequently asked at ${targetCompanyName}` : 'Frequently asked in your college placements');
      if (ub) reasons.push(`Strengthening this unlocks ${ub.unlocks}`);

      skillPriority.push({ sid, skill, state, params, pNow, score, need, urgency, reasons, unlocks: ub?.unlocks || null });
    }

    skillPriority.sort((a, b) => b.score - a.score);
    const focusSkills = skillPriority.slice(0, 5);

    // ── candidate problems ──
    const candidates = [];
    for (const sp of focusSkills) {
      const inSkill = problems.filter((p) => String(p.skillId) === sp.sid);
      const hardestSolved = solvedMaxDiff.get(sp.sid) || 0;

      for (const problem of inSkill) {
        const pid = String(problem._id);
        if (excludeProblemIds.includes(pid)) continue;
        const h = history.get(pid);
        const diff = DIFF_SCORE[problem.difficulty] || 2;
        const isReview = !!h?.solved;

        // solved problems are only eligible as spaced-repetition reviews
        if (isReview && !(sp.urgency > 0.35 && sp.pNow < 0.85)) continue;
        // don't re-serve something attempted in the last 20 minutes
        if (h && now - h.lastAt < 20 * 60 * 1000) continue;

        const params = bkt.paramsForDifficulty(sp.params, problem.difficulty);
        const pSuccess = bkt.predictCorrect(sp.pNow, params);
        const zpd = clamp01(1 - Math.abs(pSuccess - TARGET_SUCCESS) / TARGET_SUCCESS);

        let ramp = 1;
        if (!isReview) {
          if (diff > hardestSolved + 1) ramp = 0.35; // don't jump easy → hard
          if (diff === 3 && hardestSolved < 2) ramp = Math.min(ramp, 0.3);
        }

        let novelty = 0;
        if (!h) novelty = 0.15;
        else if (!h.solved && h.fails >= 1 && h.fails < 4) novelty = 0.1; // productive struggle
        else if (!h.solved && h.fails >= 4) novelty = -0.2; // stuck — suggest something else first

        const companyBonus = targetCompanyName && (problem.companies || []).some((c) => c.toLowerCase() === targetCompanyName.toLowerCase()) ? 0.1 : 0;

        const total = (0.55 * sp.score + 0.3 * zpd + novelty + companyBonus) * ramp;

        const reasons = [...sp.reasons];
        if (companyBonus) reasons.push(`Asked at ${targetCompanyName}`);
        reasons.push(`~${Math.round(pSuccess * 100)}% predicted success${zpd > 0.75 ? ' — right in your growth zone' : ''}`);
        if (isReview) reasons.unshift('Spaced-repetition review');
        else if (h && !h.solved) reasons.push(`Retry — ${h.fails} failed attempt${h.fails !== 1 ? 's' : ''} so far`);
        if (ramp < 1) reasons.push('Stretch problem');

        candidates.push({
          problem: { _id: problem._id, title: problem.title, difficulty: problem.difficulty, companies: problem.companies || [], xpReward: problem.xpReward },
          skill: { _id: sp.skill._id, name: sp.skill.name },
          score: +total.toFixed(4),
          predictedSuccess: +pSuccess.toFixed(3),
          kind: isReview ? 'review' : sp.unlocks && sp.need > 0.3 ? 'unlock' : ramp < 1 ? 'stretch' : 'practice',
          masteryP: sp.state.masteryP,
          reasons: reasons.slice(0, 4)
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    // ── diversify: at most 2 per skill ──
    const perSkill = new Map();
    const picked = [];
    for (const c of candidates) {
      const k = String(c.skill._id);
      if ((perSkill.get(k) || 0) >= 2) continue;
      perSkill.set(k, (perSkill.get(k) || 0) + 1);
      picked.push(c);
      if (picked.length >= limit) break;
    }
    return picked;
  } catch (error) {
    logger.error('Recommendation engine error', { error: error.message, stack: error.stack, userId });
    return [];
  }
};

/**
 * Back-compat single recommendation used by the submission flow.
 */
const getRecommendation = async (userId) => {
  const recs = await getRecommendations(userId, { limit: 1 });
  if (recs.length === 0) {
    return { problem: null, targetSkill: null, reason: 'No suitable problems found yet — check back once more content is added.' };
  }
  const r = recs[0];
  return {
    problem: { _id: r.problem._id, title: r.problem.title, difficulty: r.problem.difficulty },
    targetSkill: r.skill,
    reason: r.reasons.join(' · '),
    kind: r.kind,
    predictedSuccess: r.predictedSuccess
  };
};

/**
 * Checks all locked skills for a user and unlocks any whose prerequisites are ALL met
 * (mastery ≥ UNLOCK_THRESHOLD). Creates missing SkillState documents on the fly.
 *
 * @returns {Promise<string[]>} names of newly unlocked skills
 */
const checkAndUnlockSkills = async (userId) => {
  try {
    const [skills, states] = await Promise.all([
      Skill.find({}).populate('prerequisites', 'name _id').sort({ order: 1 }),
      SkillState.find({ userId })
    ]);
    const byId = new Map(states.map((s) => [String(s.skillId), s]));
    const newlyUnlocked = [];

    for (const skill of skills) {
      let state = byId.get(String(skill._id));
      if (!state) {
        state = new SkillState({ userId, skillId: skill._id, masteryP: bkt.P_L0, isUnlocked: false });
        byId.set(String(skill._id), state);
      }
      if (state.isUnlocked) continue;

      const prereqs = skill.prerequisites || [];
      const allMet = prereqs.every((p) => (byId.get(String(p._id))?.masteryP ?? 0) >= bkt.UNLOCK_THRESHOLD);
      if (allMet) {
        state.isUnlocked = true;
        await state.save();
        if (prereqs.length > 0) newlyUnlocked.push(skill.name);
        logger.info(`Skill unlocked: ${skill.name} for user ${userId}`);
      } else if (state.isNew) {
        await state.save();
      }
    }
    return newlyUnlocked;
  } catch (error) {
    logger.error('Skill unlock check error', { error: error.message, userId });
    return [];
  }
};

module.exports = { getRecommendations, getRecommendation, checkAndUnlockSkills, getSkillDemand, SCORE_DIFF };
