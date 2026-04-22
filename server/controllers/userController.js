/**
 * User Controller
 *
 * Provides user profile with aggregated data and personalised recommendations.
 *
 * @module userController
 */

const User = require('../models/User');
const SkillState = require('../models/SkillState');
const Submission = require('../models/Submission');
const recommendationEngine = require('../services/recommendationEngine');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Get the full profile for the authenticated user, including
 *          skill states, submission count, and 5 most recent submissions
 * @route   GET /api/users/profile
 * @access  Protected
 * @param   {import('express').Request} req - Express request with req.user set by auth middleware
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [user, skillStates, submissionCount, recentSubmissions] = await Promise.all([
      User.findById(userId).select('-passwordHash'),
      SkillState.find({ userId }).populate('skillId', 'name description order'),
      Submission.countDocuments({ userId }),
      Submission.find({ userId })
        .populate('problemId', 'title difficulty')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      user,
      skillStates,
      submissionCount,
      recentSubmissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a personalised problem recommendation for the authenticated user
 * @route   GET /api/users/recommendations
 * @access  Protected
 * @param   {import('express').Request} req - Express request with req.user set by auth middleware
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const recommendation = await recommendationEngine.getRecommendation(userId);

    return sendSuccess(res, { recommendation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Configure and securely encrypt the user's BYOK Gemini API key
 * @route   POST /api/users/config-key
 * @access  Protected
 */
const configGeminiKey = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { apiKey } = req.body;

    const User = require('../models/User');
    const encryptionService = require('../services/encryptionService');

    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', 404);

    if (!apiKey || apiKey.trim() === '') {
      user.encryptedGeminiKey = null;
      user.keyIv = null;
      user.keyAuthTag = null;
      await user.save();
      return sendSuccess(res, { message: 'API key wiped successfully.' });
    }

    const { encryptedData, iv, authTag } = encryptionService.encryptKey(apiKey.trim());
    
    user.encryptedGeminiKey = encryptedData;
    user.keyIv = iv;
    user.keyAuthTag = authTag;
    await user.save();

    return sendSuccess(res, { message: 'API key encrypted and stored securely.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, getRecommendations, configGeminiKey };
