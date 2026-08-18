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
 * 7. Calculate and award XP, update level and streak, emit XP event
 * 8. Check and unlock prerequisite-gated skills, generate nudges, emit skill events
 * 9. Get next recommendation, save submission, emit leaderboard refresh
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
const { generateNudge } = require('../services/nudgeService');
const { emitXPUpdate, emitLeaderboardUpdate, emitSkillUnlocked } = require('../socket/socketHandler');
const { sendSuccess, sendError } = require('../utils/responseHelper');
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
    const { problemId, code, hintsUsed = 0, timeTaken = 0, language = 'javascript' } = req.body;

    // ─── Step 2: Validate ───
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return sendError(res, 'Problem not found or is inactive', 404);
    }

    if (!code || code.trim().length === 0) {
      return sendError(res, 'Code cannot be empty');
    }

    const skillId = problem.skillId;

    // ─── Step 3: Run test cases ───
    const testResults = await codeExecutionService.runTestCases(code, problem.testCases, language, problem);

    // ─── Step 4: Analyse code structure ───
    const astResult = astAnalyser.analyseCode(code, language);

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
    const passRate = testResults.passed / testResults.total;
    const isSignificant = passRate > 0.5;
    const isCorrect = testResults.allPassed;
    
    // Fall back to false if the user submits code that passes <= 50% (prevents leaking)
    let newMasteryP = bktEngine.updateMastery(skillState.masteryP, isSignificant ? isCorrect : false);

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
    } else if (isSignificant) {
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

    // Emit XP update via Socket.io (lazy require to avoid circular dependency)
    const { io } = require('../index');
    if (xpAwarded > 0) {
      emitXPUpdate(io, {
        userId: userId.toString(),
        userName: user.name,
        xpEarned: xpAwarded,
        newXP: user.xp,
        newLevel: user.level,
        newStreak: user.streak
      });
    }

    // ─── Step 8: Check and unlock new skills + generate nudges ───
    const newlyUnlockedSkills = await recommendationEngine.checkAndUnlockSkills(userId);

    // Emit skill unlocked events for each newly unlocked skill
    for (const skillName of newlyUnlockedSkills) {
      emitSkillUnlocked(io, userId.toString(), {
        skillName,
        newMasteryP
      });
    }

    // Get skill name for nudge context
    const skill = await Skill.findById(skillId).select('name');
    const skillName = skill ? skill.name : 'this skill';

    // Count prior failed attempts on this problem
    const failedAttemptCount = await Submission.countDocuments({
      userId,
      problemId,
      isCorrect: false
    });

    // Generate nudge using centralised nudge service
    const nudge = generateNudge(astResult, failedAttemptCount, skillName, newMasteryP);

    // ─── Step 9: Get recommendation, save submission, return response ───
    const nextRecommendation = await recommendationEngine.getRecommendation(userId);

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
      nudge
    });

    logger.info(`Submission created: user=${userId} problem=${problemId} correct=${isCorrect} xp=${xpAwarded}`);

    // Emit leaderboard refresh signal
    emitLeaderboardUpdate(io);

    return sendSuccess(res, {
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
    }, 201);
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

    return sendSuccess(res, {
      submissions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the 3 most recent submissions for a specific problem to enable state persistence
 * @route   GET /api/submissions/recent/:problemId
 * @access  Protected
 */
const getRecentSubmissions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { problemId } = req.params;

    const submissions = await Submission.find({ userId, problemId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('code language isCorrect passedTestCases totalTestCases createdAt');

    return sendSuccess(res, { submissions });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run code against custom inputs or public test cases without affecting mastery/XP
 * @route   POST /api/submissions/run
 * @access  Protected
 */
const runCode = async (req, res, next) => {
  try {
    const { problemId, code, customInput, language = 'javascript' } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return sendError(res, 'Problem not found or is inactive', 404);
    }

    if (!code || code.trim().length === 0) {
      return sendError(res, 'Code cannot be empty');
    }

    let rawTestCases = [];
    
    // If user provided a custom input, map it structure-wise cleanly for the Piston Execution loop
    if (customInput !== undefined && customInput !== null) {
      rawTestCases = [{ input: customInput, expectedOutput: null }];
    } else {
      // Limit dry runs to just the "public" examples so users don't extract hidden validation tests
      rawTestCases = problem.testCases.filter(tc => !tc.isHidden) || [];
      if (rawTestCases.length === 0) {
          rawTestCases = [problem.testCases[0]]; // Fallback if all are hidden
      }
    }

    // Run custom test cases
    const testResults = await codeExecutionService.runTestCases(code, rawTestCases, language, problem);

    // Completely bypass DB (no Submission create, no XP, no SkillState changes)
    return sendSuccess(res, {
      testResults,
      customInputRun: customInput !== undefined && customInput !== null
    }, 200);

  } catch (error) {
    next(error);
  }
};

module.exports = { createSubmission, getHistory, getRecentSubmissions, runCode };
