/**
 * Engagement Controller — daily challenge, achievements, bookmarks, editorials, AI status.
 *
 * @module engagementController
 */

const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const dailyChallenge = require('../services/dailyChallengeService');
const achievementService = require('../services/achievementService');
const streakService = require('../services/streakService');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/** @route GET /api/engagement/daily */
const getDaily = async (req, res, next) => {
  try {
    const daily = await dailyChallenge.getDailyChallenge(req.user.userId);
    return sendSuccess(res, { daily });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/engagement/achievements */
const getAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return sendError(res, 'User not found', 404);
    // evaluating first means badges earned by non-submission events (e.g. bookmarks) show up
    await achievementService.evaluate(req.user.userId);
    const fresh = await User.findById(req.user.userId);
    const list = await achievementService.describeForUser(fresh);
    return sendSuccess(res, {
      achievements: list,
      unlocked: list.filter((a) => a.unlocked).length,
      total: list.length
    });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/engagement/streak */
const getStreak = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('streak longestStreak lastActiveDate streakFreeze');
    if (!user) return sendError(res, 'User not found', 404);
    const s = streakService.describeStreak(user);
    return sendSuccess(res, { ...s, longestStreak: Math.max(user.longestStreak || 0, s.streak), multiplier: streakService.streakMultiplier(s.streak), milestones: streakService.MILESTONES });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/engagement/bookmarks */
const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('bookmarks').populate({
      path: 'bookmarks',
      select: 'title difficulty skillId companies',
      populate: { path: 'skillId', select: 'name' }
    });
    if (!user) return sendError(res, 'User not found', 404);
    const solved = new Set((await Submission.find({ userId: req.user.userId, isCorrect: true }).select('problemId').lean()).map((s) => String(s.problemId)));
    const bookmarks = (user.bookmarks || []).filter(Boolean).map((p) => ({
      _id: p._id,
      title: p.title,
      difficulty: p.difficulty,
      skill: p.skillId?.name || null,
      companies: p.companies || [],
      solved: solved.has(String(p._id))
    }));
    return sendSuccess(res, { bookmarks, ids: bookmarks.map((b) => String(b._id)) });
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/engagement/bookmarks/:problemId — toggles */
const toggleBookmark = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const problem = await Problem.findById(problemId).select('_id');
    if (!problem) return sendError(res, 'Problem not found', 404);

    const user = await User.findById(req.user.userId);
    const has = user.bookmarks.some((id) => String(id) === String(problemId));
    if (has) user.bookmarks = user.bookmarks.filter((id) => String(id) !== String(problemId));
    else user.bookmarks.push(problem._id);
    await user.save();

    const achievements = has ? [] : await achievementService.evaluate(req.user.userId);
    return sendSuccess(res, { bookmarked: !has, count: user.bookmarks.length, achievements });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Editorial for a problem. Unlocked once the student has solved it or failed 3+ times.
 * @route   GET /api/engagement/editorial/:problemId
 */
const getEditorial = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const userId = req.user.userId;
    const problem = await Problem.findById(problemId).select('title difficulty editorial editorialText hints skillId').populate('skillId', 'name');
    if (!problem) return sendError(res, 'Problem not found', 404);

    const [solved, fails] = await Promise.all([
      Submission.exists({ userId, problemId, isCorrect: true }),
      Submission.countDocuments({ userId, problemId, isCorrect: false })
    ]);
    const unlocked = !!solved || fails >= 3 || req.user.role === 'admin';
    if (!unlocked) {
      return res.status(403).json({
        success: false,
        message: `Editorial unlocks after you solve this problem or make 3 attempts (${fails}/3 so far).`,
        data: { locked: true, failedAttempts: fails, attemptsNeeded: 3 }
      });
    }

    const ed = problem.editorial || {};
    const hasStructured = !!(ed.approach || (ed.steps && ed.steps.length) || ed.code?.javascript);
    if (!hasStructured && !problem.editorialText) {
      return sendSuccess(res, { locked: false, available: false, title: problem.title, message: 'No editorial has been written for this problem yet.' });
    }

    return sendSuccess(res, {
      locked: false,
      available: true,
      title: problem.title,
      difficulty: problem.difficulty,
      skill: problem.skillId?.name || null,
      editorial: hasStructured ? ed : { approach: problem.editorialText },
      solved: !!solved
    });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/engagement/ai-status */
const getAiStatus = async (req, res, next) => {
  try {
    return sendSuccess(res, await aiService.getStatus(req.user.userId));
  } catch (error) {
    next(error);
  }
};

module.exports = { getDaily, getAchievements, getStreak, getBookmarks, toggleBookmark, getEditorial, getAiStatus };
