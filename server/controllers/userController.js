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
      User.findById(userId)
        .select('-passwordHash')
        .populate('collegeId', 'name shortName slug tier location verified')
        .populate('targetCompanyId', 'name slug tier'),
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

const getDashboardQuote = async (req, res) => {
  try {
    const { context } = req.body;
    const aiMentorService = require('../services/aiMentorService');
    const quote = await aiMentorService.generateDashboardQuote(req.user.userId, context);
    
    if (quote && quote.text && quote.highlight) {
      return res.status(200).json({ success: true, data: quote });
    }
    
    // Final failsafe
    res.status(200).json({ 
      success: true, 
      data: { text: "Keep pushing the ", highlight: "limits", highlightColor: "#3b82f6", suffix: "." }
    });
  } catch (error) {
    logger.error('Error fetching dashboard quote', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch quote' });
  }
};

/**
 * @desc    Update user's placement profile (college, target company, target role)
 * @route   PATCH /api/users/profile
 * @access  Protected
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { collegeId, targetCompanyId, targetRole } = req.body;

    const updates = {};

    // Validate and set collegeId
    if (collegeId !== undefined) {
      if (collegeId === null || collegeId === '') {
        updates.collegeId = null;
      } else {
        const College = require('../models/College');
        const college = await College.findById(collegeId).lean();
        if (!college) return sendError(res, 'College not found', 404);
        updates.collegeId = collegeId;
      }
    }

    // Validate and set targetCompanyId
    if (targetCompanyId !== undefined) {
      if (targetCompanyId === null || targetCompanyId === '') {
        updates.targetCompanyId = null;
      } else {
        const Company = require('../models/Company');
        const company = await Company.findById(targetCompanyId).lean();
        if (!company) return sendError(res, 'Company not found', 404);
        updates.targetCompanyId = targetCompanyId;
      }
    }

    // Set targetRole (free-text, no validation needed)
    if (targetRole !== undefined) {
      updates.targetRole = targetRole?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 'No valid fields provided to update');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, select: '-passwordHash' }
    ).populate('collegeId', 'name shortName slug tier').populate('targetCompanyId', 'name slug tier');

    if (!user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, getRecommendations, configGeminiKey, getDashboardQuote, updateProfile };
