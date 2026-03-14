/**
 * Problem Controller
 *
 * Handles listing and fetching individual DSA problems
 * with skill population and hidden test case masking.
 *
 * @module problemController
 */

const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Get paginated list of active problems with optional filters
 * @route   GET /api/problems
 * @access  Protected
 * @param   {import('express').Request} req - Express request with optional skillId, difficulty, page, limit query params
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getProblems = async (req, res, next) => {
  try {
    const { skillId, difficulty } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Build filter — only active problems
    const filter = { isActive: true };
    if (skillId) filter.skillId = skillId;
    if (difficulty) filter.difficulty = difficulty;

    const [problems, totalCount] = await Promise.all([
      Problem.find(filter)
        .select('-testCases')
        .populate('skillId', 'name difficultyWeight')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Problem.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      problems,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single problem by ID with masked hidden test cases
 *          and user attempt history
 * @route   GET /api/problems/:id
 * @access  Protected
 * @param   {import('express').Request} req - Express request with :id param
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getProblemById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const problemId = req.params.id;

    const problem = await Problem.findById(problemId)
      .populate('skillId', 'name description');

    if (!problem) {
      return sendError(res, 'Problem not found', 404);
    }

    // Mask hidden test cases: return input but replace expectedOutput with null
    const maskedTestCases = problem.testCases.map((tc) => {
      if (tc.isHidden) {
        return { input: tc.input, expectedOutput: null, isHidden: true };
      }
      return tc;
    });

    // Query user's attempt history for this problem
    const [userAttempts, bestSubmission] = await Promise.all([
      Submission.countDocuments({ userId, problemId }),
      Submission.findOne({ userId, problemId })
        .sort({ passedTestCases: -1 })
        .select('passedTestCases totalTestCases')
    ]);

    const userBestScore = bestSubmission && bestSubmission.totalTestCases > 0
      ? bestSubmission.passedTestCases / bestSubmission.totalTestCases
      : 0;

    // Build response object with masked test cases
    const problemResponse = problem.toObject();
    problemResponse.testCases = maskedTestCases;
    problemResponse.userAttempts = userAttempts;
    problemResponse.userBestScore = userBestScore;

    return sendSuccess(res, { problem: problemResponse });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProblems, getProblemById };
