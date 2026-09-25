/**
 * User Controller
 *
 * Profile, personalised recommendations, BYOK AI key management, dashboard quote,
 * and placement-profile updates.
 *
 * @module userController
 */

const User = require('../models/User');
const SkillState = require('../models/SkillState');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const College = require('../models/College');
const Company = require('../models/Company');
const recommendationEngine = require('../services/recommendationEngine');
const aiMentorService = require('../services/aiMentorService');
const aiService = require('../services/aiService');
const encryptionService = require('../services/encryptionService');
const streakService = require('../services/streakService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @route GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [user, skillStates, submissionCount, recentSubmissions, aiStatus] = await Promise.all([
      User.findById(userId)
        .select('-passwordHash -encryptedGeminiKey -keyIv -keyAuthTag')
        .populate('collegeId', 'name shortName slug tier location verified')
        .populate('targetCompanyId', 'name slug tier logo'),
      SkillState.find({ userId }).populate('skillId', 'name description order'),
      Submission.countDocuments({ userId }),
      Submission.find({ userId }).select('-code -astResult').populate('problemId', 'title difficulty').sort({ createdAt: -1 }).limit(10),
      aiService.getStatus(userId)
    ]);

    if (!user) return sendError(res, 'User not found', 404);

    const userObj = user.toObject();
    userObj.streakInfo = streakService.describeStreak(user);
    userObj.hasByok = aiStatus.byok;

    return sendSuccess(res, { user: userObj, skillStates, submissionCount, recentSubmissions, aiStatus });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ranked, explained recommendations. `recommendation` (singular) kept for older clients.
 * @route   GET /api/users/recommendations?limit=
 */
const getRecommendations = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 12);
    const recommendations = await recommendationEngine.getRecommendations(req.user.userId, { limit });
    return sendSuccess(res, { recommendations, recommendation: recommendations[0] || null });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save (encrypted) or wipe the BYOK Gemini key; verifies the key with Google.
 * @route   POST /api/users/config-key
 */
const configGeminiKey = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { apiKey } = req.body;

    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', 404);

    if (!apiKey || apiKey.trim() === '') {
      user.encryptedGeminiKey = null;
      user.keyIv = null;
      user.keyAuthTag = null;
      user.hasByok = false;
      await user.save();
      return sendSuccess(res, { message: 'API key removed.', configured: false, verified: null });
    }

    const key = apiKey.trim();
    if (key.length < 20 || /\s/.test(key)) return sendError(res, 'That does not look like a valid API key.');

    const check = await aiService.validateGeminiKey(key);
    if (check.valid === false) return sendError(res, check.message, 422);

    const { encryptedData, iv, authTag } = encryptionService.encryptKey(key);
    user.encryptedGeminiKey = encryptedData;
    user.keyIv = iv;
    user.keyAuthTag = authTag;
    user.hasByok = true;
    await user.save();

    return sendSuccess(res, { message: check.valid ? 'Key verified and stored encrypted. AI features now run on your own quota.' : check.message, configured: true, verified: check.valid });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/users/dashboard-quote
 */
const getDashboardQuote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { context = {} } = req.body || {};

    const [user, states, lastSub] = await Promise.all([
      User.findById(userId).select('name level streak lastActiveDate streakFreeze'),
      SkillState.find({ userId, attempts: { $gt: 0 } }).populate('skillId', 'name').lean(),
      Submission.findOne({ userId }).sort({ createdAt: -1 }).select('problemId isCorrect').populate('problemId', 'title').lean()
    ]);
    if (!user) return sendError(res, 'User not found', 404);

    const weakest = [...states].sort((a, b) => a.masteryP - b.masteryP)[0];
    const streak = streakService.describeStreak(user);

    const ctx = {
      firstName: (user.name || '').split(' ')[0],
      level: user.level,
      streak: streak.streak,
      streakAtRisk: streak.atRisk,
      weakest: weakest?.skillId ? { name: weakest.skillId.name, masteryP: weakest.masteryP } : null,
      lastProblemTitle: lastSub && !lastSub.isCorrect ? lastSub.problemId?.title || null : null
    };

    const quote = await aiMentorService.generateDashboardQuote(userId, ctx);

    // Make the headline clickable when it references a problem the student was just working on
    let contextPath = null;
    if (ctx.lastProblemTitle && lastSub?.problemId?._id) contextPath = `/problems/${lastSub.problemId._id}`;
    else if (context.lastPath && /^\/problems\/[a-f0-9]{24}$/.test(context.lastPath)) contextPath = context.lastPath;

    return res.status(200).json({ success: true, data: { ...quote, contextPath: quote.highlight === ctx.lastProblemTitle ? contextPath : null } });
  } catch (error) {
    logger.error('Error fetching dashboard quote', { error: error.message });
    return res.status(200).json({ success: true, data: aiMentorService.contextualFallback({}) });
  }
};

/**
 * @desc    Update placement profile (college, target company, target role)
 * @route   PATCH /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { collegeId, targetCompanyId, targetRole } = req.body;
    const updates = {};

    if (collegeId !== undefined) {
      if (collegeId === null || collegeId === '') updates.collegeId = null;
      else {
        const college = await College.findById(collegeId).lean();
        if (!college) return sendError(res, 'College not found', 404);
        updates.collegeId = collegeId;
      }
    }

    if (targetCompanyId !== undefined) {
      if (targetCompanyId === null || targetCompanyId === '') updates.targetCompanyId = null;
      else {
        const company = await Company.findById(targetCompanyId).lean();
        if (!company) return sendError(res, 'Company not found', 404);
        updates.targetCompanyId = targetCompanyId;
      }
    }

    if (targetRole !== undefined) updates.targetRole = targetRole?.trim() || null;

    if (Object.keys(updates).length === 0) return sendError(res, 'No valid fields provided to update');

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, select: '-passwordHash -encryptedGeminiKey -keyIv -keyAuthTag' })
      .populate('collegeId', 'name shortName slug tier')
      .populate('targetCompanyId', 'name slug tier logo');
    if (!user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public-safe list of a user's problems solved count etc. is served by analytics; this
 *          endpoint returns the problems the user has bookmarked/attempted for quick lookups.
 * @route   GET /api/users/attempted
 */
const getAttempted = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const rows = await Submission.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(String(userId)) } },
      { $group: { _id: '$problemId', attempts: { $sum: 1 }, solved: { $max: { $cond: ['$isCorrect', 1, 0] } }, lastAt: { $max: '$createdAt' } } }
    ]);
    const map = {};
    rows.forEach((r) => { map[String(r._id)] = { attempts: r.attempts, solved: !!r.solved, lastAt: r.lastAt }; });
    return sendSuccess(res, { attempted: map });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, getRecommendations, configGeminiKey, getDashboardQuote, updateProfile, getAttempted };
