/**
 * Submission Controller
 *
 * The submission pipeline:
 *  1. validate problem + code
 *  2. execute against every test case (hidden ones are masked in the response)
 *  3. static analysis (AST) for complexity feedback
 *  4. adaptive BKT update (learned per-skill params, difficulty-aware evidence, forgetting)
 *  5. XP: first-solve only (no farming), streak multiplier, daily-challenge bonus
 *  6. streak + weekly freeze, level-ups
 *  7. skill unlocks + achievement evaluation
 *  8. next recommendation + toast-ready `notifications`
 *
 * @module submissionController
 */

const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const bktEngine = require('../services/bktEngine');
const astAnalyser = require('../services/astAnalyser');
const codeExecutionService = require('../services/codeExecutionService');
const recommendationEngine = require('../services/recommendationEngine');
const knowledge = require('../services/knowledgeService');
const streakService = require('../services/streakService');
const dailyChallenge = require('../services/dailyChallengeService');
const achievementService = require('../services/achievementService');
const { generateNudge } = require('../services/nudgeService');
const { emitXPUpdate, emitLeaderboardUpdate, emitSkillUnlocked } = require('../socket/socketHandler');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const XP_BY_DIFFICULTY = { easy: 10, medium: 20, hard: 40 };
const DAY = 86400000;

/**
 * Removes anything that would leak hidden test cases from an execution result and tags each
 * row with a stable id. Hidden rows keep only pass/fail + timing.
 */
const maskResults = (testResults, problem, { hideExpected = true } = {}) => {
  const results = (testResults.results || []).map((r, idx) => {
    const tc = problem.testCases[idx];
    const hidden = !!tc?.isHidden;
    if (hidden && hideExpected) {
      return { id: String(idx), index: idx, hidden: true, passed: r.passed, executionTime: r.executionTime, input: null, expectedOutput: null, actualOutput: null };
    }
    return { id: String(idx), index: idx, hidden: false, ...r };
  });
  return { ...testResults, results };
};

/**
 * @route POST /api/submissions
 */
const createSubmission = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { problemId, code, hintsUsed = 0, timeTaken = 0, language = 'javascript' } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) return sendError(res, 'Problem not found or is inactive', 404);
    if (!code || code.trim().length === 0) return sendError(res, 'Code cannot be empty');
    if (!problem.skillId) return sendError(res, 'This problem is not linked to a skill yet', 422);

    const skillId = problem.skillId;

    // ─── Execute ───
    const testResults = await codeExecutionService.runTestCases(code, problem.testCases, language, problem);
    const astResult = astAnalyser.analyseCode(code, language);
    const isCorrect = testResults.allPassed;
    const passRate = testResults.total ? testResults.passed / testResults.total : 0;

    // ─── Prior history on this problem (for XP top-up + editorial gating) ───
    const prior = await Submission.find({ userId, problemId }).select('isCorrect xpAwarded bonusXp').lean();
    const alreadySolved = prior.some((s) => s.isCorrect);
    const priorFails = prior.filter((s) => !s.isCorrect).length;
    const priorBaseXp = prior.reduce((sum, s) => sum + Math.max(0, (s.xpAwarded || 0) - (s.bonusXp || 0)), 0);

    // ─── Adaptive BKT ───
    const paramsMap = await knowledge.getParamsMap();
    const params = knowledge.paramsFor(paramsMap, skillId);

    let skillState = await SkillState.findOne({ userId, skillId });
    if (!skillState) {
      skillState = new SkillState({ userId, skillId, masteryP: params.pL0 ?? bktEngine.P_L0, isUnlocked: true });
    }
    const masteryBefore = skillState.masteryP;

    let priorP = skillState.masteryP;
    if (skillState.attempts > 0) {
      const idle = (Date.now() - new Date(skillState.lastUpdated || skillState.updatedAt).getTime()) / DAY;
      priorP = bktEngine.applyForgetting(priorP, idle, skillState.correctAttempts, params);
    }
    let newMasteryP = bktEngine.updateMastery(priorP, isCorrect, bktEngine.paramsForDifficulty(params, problem.difficulty));
    if (hintsUsed > 0) newMasteryP = bktEngine.applyHintPenalty(newMasteryP, hintsUsed);

    const wasMastered = skillState.isMastered;
    skillState.masteryP = newMasteryP;
    skillState.attempts += 1;
    if (isCorrect) skillState.correctAttempts += 1;
    skillState.isMastered = bktEngine.isMastered(newMasteryP);
    skillState.lastUpdated = new Date();
    skillState.isUnlocked = true;
    await skillState.save();
    knowledge.invalidate('cohortStats');

    // ─── XP (first-solve only; partial credit tops up) ───
    const fullXP = problem.xpReward || XP_BY_DIFFICULTY[problem.difficulty] || 10;
    let earnedTotal = 0;
    if (isCorrect) earnedTotal = fullXP;
    else if (passRate > 0.5) earnedTotal = Math.floor(fullXP * 0.3);
    const baseXp = alreadySolved ? 0 : Math.max(0, earnedTotal - priorBaseXp);

    const user = await User.findById(userId);
    const levelBefore = user.level;
    const streakInfo = streakService.recordActivity(user, new Date());
    const multiplier = streakService.streakMultiplier(user.streak);
    const boostedXp = Math.round(baseXp * multiplier);

    let bonusXp = 0;
    let isDaily = false;
    if (isCorrect && (await dailyChallenge.isBonusEligible(userId, problemId))) {
      isDaily = true;
      bonusXp = Math.round(fullXP * dailyChallenge.BONUS_MULTIPLIER);
    }
    const xpAwarded = boostedXp + bonusXp;

    user.xp += xpAwarded;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save();

    // ─── Skill unlocks, nudge, recommendation ───
    const newlyUnlockedSkills = await recommendationEngine.checkAndUnlockSkills(userId);
    const skill = await Skill.findById(skillId).select('name').lean();
    const skillName = skill ? skill.name : 'this skill';
    const nudge = generateNudge(astResult, priorFails + (isCorrect ? 0 : 1), skillName, newMasteryP);

    const submission = await Submission.create({
      userId,
      problemId,
      skillId,
      code,
      language,
      isCorrect,
      passedTestCases: testResults.passed,
      totalTestCases: testResults.total,
      xpAwarded,
      astResult,
      timeTaken,
      hintsUsed,
      executionTime: testResults.results.length > 0 ? testResults.results[0].executionTime : 0,
      memoryUsed: 0,
      nudge,
      masteryBefore,
      masteryAfter: newMasteryP,
      isDailyChallenge: isDaily,
      bonusXp,
      streakMultiplier: multiplier
    });

    // ─── Achievements (after the submission exists so counts are right) ───
    const achievements = await achievementService.evaluate(userId);
    const achievementXp = achievements.reduce((n, a) => n + (a.xp || 0), 0);
    const fresh = achievementXp ? await User.findById(userId).select('xp level') : user;

    const nextRecommendations = await recommendationEngine.getRecommendations(userId, { limit: 3, excludeProblemIds: [String(problemId)] });

    // ─── Notifications (toast-ready) ───
    const notifications = [];
    if (fresh.level > levelBefore) notifications.push({ type: 'level_up', level: fresh.level, title: `Level ${fresh.level} reached!`, message: 'Your rank climbs. Keep the momentum.' });
    if (streakInfo.freezeUsed) notifications.push({ type: 'streak_freeze', title: 'Streak freeze used', message: `You missed a day — your ${user.streak}-day streak is safe. Freeze recharges next week.` });
    if (streakInfo.milestone) notifications.push({ type: 'streak_milestone', streak: streakInfo.milestone, title: `${streakInfo.milestone}-day streak!`, message: `XP multiplier is now ×${multiplier}.` });
    if (isDaily) notifications.push({ type: 'daily_bonus', xp: bonusXp, title: 'Daily challenge complete', message: `+${bonusXp} bonus XP` });
    if (!wasMastered && skillState.isMastered) notifications.push({ type: 'skill_mastered', skill: skillName, title: `${skillName} mastered`, message: 'You crossed the 85% mastery line.' });
    newlyUnlockedSkills.forEach((n) => notifications.push({ type: 'skill_unlocked', skill: n, title: `Skill unlocked: ${n}`, message: 'New problems are waiting.' }));
    achievements.forEach((a) => notifications.push({ type: 'achievement', achievement: a, title: `Badge earned: ${a.title}`, message: a.desc }));

    logger.info(`Submission: user=${userId} problem=${problemId} correct=${isCorrect} xp=${xpAwarded} mastery=${masteryBefore.toFixed(2)}→${newMasteryP.toFixed(2)}`);

    // ─── Sockets ───
    const { io } = require('../index');
    if (xpAwarded > 0) {
      emitXPUpdate(io, { userId: String(userId), userName: user.name, xpEarned: xpAwarded, newXP: fresh.xp, newLevel: fresh.level, newStreak: user.streak });
    }
    for (const name of newlyUnlockedSkills) emitSkillUnlocked(io, String(userId), { skillName: name, newMasteryP });
    emitLeaderboardUpdate(io);

    const editorialUnlocked = isCorrect || alreadySolved || priorFails + 1 >= 3;

    return sendSuccess(res, {
      submission: {
        id: submission._id,
        isCorrect,
        passedTestCases: testResults.passed,
        totalTestCases: testResults.total,
        xpAwarded,
        createdAt: submission.createdAt
      },
      testResults: maskResults(testResults, problem),
      astFeedback: astResult,
      masteryBefore,
      newMastery: newMasteryP,
      masteryDelta: +(newMasteryP - masteryBefore).toFixed(4),
      xpBreakdown: { base: baseXp, streakMultiplier: multiplier, boosted: boostedXp, dailyBonus: bonusXp, total: xpAwarded, alreadySolved },
      xpEarned: xpAwarded,
      newXP: fresh.xp,
      newLevel: fresh.level,
      newStreak: user.streak,
      streak: { value: user.streak, freezeUsed: streakInfo.freezeUsed, multiplier },
      newlyUnlockedSkills,
      achievements,
      notifications,
      editorialUnlocked,
      failedAttempts: priorFails + (isCorrect ? 0 : 1),
      nextRecommendation: nextRecommendations[0] || null,
      nextRecommendations,
      nudge
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/submissions/history?page&limit&problemId
 */
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 1000);
    const skip = (page - 1) * limit;
    const filter = { userId };
    if (req.query.problemId) filter.problemId = req.query.problemId;

    const [submissions, totalCount] = await Promise.all([
      Submission.find(filter)
        .select('-code -astResult')
        .populate('problemId', 'title difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      submissions,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/submissions/recent/:problemId?limit=
 */
const getRecentSubmissions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { problemId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 3, 30);

    const submissions = await Submission.find({ userId, problemId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('code language isCorrect passedTestCases totalTestCases xpAwarded executionTime timeTaken hintsUsed masteryBefore masteryAfter createdAt');

    return sendSuccess(res, { submissions });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dry-run against public examples or a custom input — no mastery/XP effects
 * @route   POST /api/submissions/run
 */
const runCode = async (req, res, next) => {
  try {
    const { problemId, code, customInput, language = 'javascript' } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) return sendError(res, 'Problem not found or is inactive', 404);
    if (!code || code.trim().length === 0) return sendError(res, 'Code cannot be empty');

    const isCustom = customInput !== undefined && customInput !== null && String(customInput).trim() !== '';
    let cases;
    if (isCustom) {
      cases = [{ input: String(customInput), expectedOutput: null, isHidden: false }];
    } else {
      cases = problem.testCases.filter((tc) => !tc.isHidden);
      if (cases.length === 0) cases = [{ ...problem.testCases[0].toObject(), isHidden: false }];
    }

    const testResults = await codeExecutionService.runTestCases(code, cases, language, problem);
    const results = (testResults.results || []).map((r, idx) => ({ id: String(idx), index: idx, hidden: false, ...r }));

    return sendSuccess(res, { testResults: { ...testResults, results }, customInputRun: isCustom });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Which languages can actually execute right now (and through which engine)
 * @route   GET /api/submissions/runtimes
 */
const getRuntimes = async (req, res, next) => {
  try {
    return sendSuccess(res, { runtimes: await codeExecutionService.getRuntimeStatus() });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSubmission, getHistory, getRecentSubmissions, runCode, getRuntimes, maskResults };
