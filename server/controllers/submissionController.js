/**
 * Submission Controller
 *
 * Implements the complete 9-step submission flow:
 * 1. Extract data from request
 * 2. Validate problem exists and code is not empty
 * 3. Run test cases via code execution service
 * 4. Analyse code structure via AST analyser
 * 5. Fetch/create SkillState and compute BKT mastery update
 * 6. Apply hint penalty and update mastery state
 * 7. Calculate and award XP, update level and streak
 * 8. Check and unlock prerequisite-gated skills, generate nudges
 * 9. Get next recommendation, save submission, return response
 *
 * @module submissionController
 */

const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const SkillState = require('../models/SkillState');
const bktEngine = require('../services/bktEngine');
const astAnalyser = require('../services/astAnalyser');
const codeExecutionService = require('../services/codeExecutionService');
const recommendationEngine = require('../services/recommendationEngine');
const logger = require('../utils/logger');

/**
 * Determines if two dates represent consecutive calendar days.
 *
 * @param {Date} lastDate - The previous active date
 * @param {Date} currentDate - The current date
 * @returns {boolean} True if lastDate is exactly yesterday relative to currentDate
 */
const isConsecutiveDay = (lastDate, currentDate) => {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  last.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  const diffMs = current.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
};

/**
 * Determines if two dates are the same calendar day.
 *
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if both dates fall on the same calendar day
 */
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * @desc    Create a new submission — the full 9-step submission flow
 * @route   POST /api/submissions
 * @access  Protected
 * @param   {import('express').Request} req - Express request with code, problemId, hintsUsed, timeTaken in body
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const createSubmission = async (req, res, next) => {
  try {
    // ─── Step 1: Extract data ───
    const userId = req.user.userId;
    const { problemId, code, hintsUsed = 0, timeTaken = 0 } = req.body;

    // ─── Step 2: Validate ───
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found or is inactive'
      });
    }

    if (!code || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Code cannot be empty'
      });
    }

    const skillId = problem.skillId;

    // ─── Step 3: Run test cases ───
    const testResults = await codeExecutionService.runTestCases(code, problem.testCases);

    // ─── Step 4: Analyse code structure ───
    const astResult = astAnalyser.analyseCode(code);

    // ─── Step 5: Fetch or create SkillState ───
    let skillState = await SkillState.findOne({ userId, skillId });
    if (!skillState) {
      skillState = await SkillState.create({
        userId,
        skillId,
        masteryP: bktEngine.P_L0,
        isUnlocked: true
      });
    }

    // ─── Step 6: Compute new mastery via BKT ───
    const isCorrect = testResults.allPassed;
    let newMasteryP = bktEngine.updateMastery(skillState.masteryP, isCorrect);

    // Apply hint penalty if hints were used
    if (hintsUsed > 0) {
      newMasteryP = bktEngine.applyHintPenalty(newMasteryP, hintsUsed);
    }

    // Update SkillState
    skillState.masteryP = newMasteryP;
    skillState.attempts += 1;
    if (isCorrect) skillState.correctAttempts += 1;
    skillState.isMastered = bktEngine.isMastered(newMasteryP);
    skillState.lastUpdated = new Date();
    await skillState.save();

    // ─── Step 7: Calculate and award XP ───
    const xpMap = { easy: 10, medium: 20, hard: 40 };
    const fullXP = xpMap[problem.difficulty] || 10;
    let xpAwarded = 0;

    if (testResults.allPassed) {
      xpAwarded = fullXP;
    } else if (testResults.passed > 0) {
      xpAwarded = Math.floor(fullXP * 0.3);
    }

    // Update User: XP, level, streak
    const user = await User.findById(userId);
    user.xp += xpAwarded;
    user.level = Math.floor(user.xp / 100) + 1;

    const today = new Date();
    if (user.lastActiveDate) {
      if (isConsecutiveDay(user.lastActiveDate, today)) {
        user.streak += 1;
      } else if (!isSameDay(user.lastActiveDate, today)) {
        user.streak = 1;
      }
      // If same day → streak unchanged
    } else {
      user.streak = 1;
    }
    user.lastActiveDate = today;
    await user.save();

    // ─── Step 8: Check and unlock new skills + generate nudges ───
    const newlyUnlockedSkills = await recommendationEngine.checkAndUnlockSkills(userId);

    let nudge = null;
    if (astResult.antiPatternDetected) {
      nudge = astResult.antiPatternDescription;
    }

    // Check if this is 3rd+ failed attempt on same problem
    if (testResults.passed === 0) {
      const failedAttemptCount = await Submission.countDocuments({
        userId,
        problemId,
        isCorrect: false
      });

      if (failedAttemptCount >= 2) {
        nudge = nudge
          ? `${nudge} Also, consider trying a simpler problem or using hints.`
          : 'You have struggled with this problem multiple times. Consider trying a simpler problem or using hints.';
      }
    }

    // ─── Step 9: Get recommendation, save submission, return response ───
    const nextRecommendation = await recommendationEngine.getRecommendation(userId);

    const submission = await Submission.create({
      userId,
      problemId,
      skillId,
      code,
      isCorrect,
      passedTestCases: testResults.passed,
      totalTestCases: testResults.total,
      xpAwarded,
      astResult,
      timeTaken,
      hintsUsed,
      executionTime: testResults.results.length > 0 ? testResults.results[0].executionTime : 0,
      memoryUsed: 0,
      nudge
    });

    logger.info(`Submission created: user=${userId} problem=${problemId} correct=${isCorrect} xp=${xpAwarded}`);

    return res.status(201).json({
      success: true,
      data: {
        submission: {
          id: submission._id,
          isCorrect,
          passedTestCases: testResults.passed,
          totalTestCases: testResults.total,
          xpAwarded
        },
        testResults,
        astFeedback: astResult,
        newMastery: newMasteryP,
        xpEarned: xpAwarded,
        newLevel: user.level,
        newStreak: user.streak,
        newlyUnlockedSkills,
        nextRecommendation,
        nudge
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated submission history for the authenticated user
 * @route   GET /api/submissions/history
 * @access  Protected
 * @param   {import('express').Request} req - Express request with optional page/limit query params
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [submissions, totalCount] = await Promise.all([
      Submission.find({ userId })
        .populate('problemId', 'title difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments({ userId })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSubmission, getHistory };
