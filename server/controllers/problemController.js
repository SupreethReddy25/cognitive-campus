/**
 * Problem Controller
 *
 * Handles listing, fetching individual DSA problems,
 * AI mentoring nudges, and the Interview Intel Engine proposal pipeline.
 *
 * @module problemController
 */

const Problem = require('../models/Problem');
const Skill = require('../models/Skill');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const aiMentorService = require('../services/aiMentorService');
const intelService = require('../services/intelService');
const { runTestCases, SUPPORTED_LANGUAGES } = require('../services/codeExecutionService');

/**
 * @desc    Get paginated list of active, APPROVED problems with optional filters
 * @route   GET /api/problems
 * @access  Protected
 */
const getProblems = async (req, res, next) => {
  try {
    const { skillId, difficulty } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Only active AND approved problems (Intel Engine backward compat)
    const filter = { isActive: true, status: 'approved' };
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
 *          and user attempt history. Populates authorId for Intel tab.
 * @route   GET /api/problems/:id
 * @access  Protected
 */
const getProblemById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const problemId = req.params.id;

    const problem = await Problem.findById(problemId)
      .populate('skillId', 'name description')
      .populate('authorId', 'name');

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

/**
 * @desc    Get an AI-generated mentoring nudge for the user's code
 * @route   POST /api/problems/:id/nudge
 * @access  Protected
 */
const getAiNudge = async (req, res, next) => {
  try {
    const problemId = req.params.id;
    const { code, language, nudgeDepth, lastError } = req.body;

    if (!code) return sendError(res, 'Code is required to generate a nudge', 400);

    const problem = await Problem.findById(problemId);
    if (!problem) return sendError(res, 'Problem not found', 404);

    const nudge = await aiMentorService.getMentorNudge(
      req.user.userId,
      problem,
      code,
      language || 'javascript',
      nudgeDepth || 1,
      lastError || null
    );

    return sendSuccess(res, { nudge });
  } catch (error) {
    next(error);
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * INTERVIEW INTEL ENGINE — The "Editor-in-Chief" Pipeline
 * ═══════════════════════════════════════════════════════════════
 *
 * @desc    Propose a new problem from a raw interview memory dump.
 *          Step A: Gemini refines the raw description into a structured problem.
 *          Step B: Piston verifies the student's reference code against test cases.
 *          Step C: If verified → save as 'waitlisted'. If not → return errors.
 *
 * @route   POST /api/problems/propose
 * @access  Protected
 */
const proposeProblem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { rawDescription, company, round, warStory, confidence, referenceCode, language } = req.body;

    // ─── Validation ───
    if (!rawDescription || rawDescription.trim().length < 20) {
      return sendError(res, 'Raw description must be at least 20 characters. Tell us more about the problem.', 400);
    }
    if (!referenceCode || referenceCode.trim().length < 10) {
      return sendError(res, 'Reference code is required. Paste your working solution.', 400);
    }
    const lang = language || 'javascript';
    if (!SUPPORTED_LANGUAGES[lang]) {
      return sendError(res, `Unsupported language: ${lang}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`, 400);
    }

    // ─── Resolve API key (BYOK or system) ───
    let apiKey = process.env.GEMINI_API_KEY;
    const user = await User.findById(userId);
    if (user?.encryptedGeminiKey && user?.keyIv && user?.keyAuthTag) {
      try {
        const encryptionService = require('../services/encryptionService');
        apiKey = encryptionService.decryptKey(user.encryptedGeminiKey, user.keyIv, user.keyAuthTag);
        logger.info(`[Intel] User ${userId} using BYOK for Intel pipeline.`);
      } catch (err) {
        logger.warn('[Intel] BYOK decryption failed, falling back to system key');
      }
    }

    if (!apiKey) {
      return sendError(res, 'No Gemini API key configured. Add one in your profile settings.', 503);
    }

    // ─── Step A: AI Framing — Gemini refines the raw intel ───
    logger.info(`[Intel] Step A: Refining raw intel for user ${userId}`);

    const existingSkills = await Skill.find({}).select('name').lean();
    const skillNames = existingSkills.map(s => s.name);

    let refined;
    try {
      refined = await intelService.refineRawIntel(
        rawDescription.trim(),
        company?.trim() || null,
        round?.trim() || null,
        confidence || 50,
        skillNames,
        apiKey
      );
    } catch (aiError) {
      logger.error('[Intel] Gemini refinement failed', { error: aiError.message });
      return sendError(res, `AI refinement failed: ${aiError.message}`, 422);
    }

    // ─── Match skill from Gemini's suggestion ───
    let matchedSkillId = null;
    if (refined.skillMatch) {
      const matchName = refined.skillMatch.toLowerCase();
      const match = existingSkills.find(s => s.name.toLowerCase() === matchName);
      if (match) {
        matchedSkillId = match._id;
      } else {
        // Fuzzy: find the closest containing match
        const fuzzy = existingSkills.find(s =>
          s.name.toLowerCase().includes(matchName) || matchName.includes(s.name.toLowerCase())
        );
        if (fuzzy) matchedSkillId = fuzzy._id;
      }
    }

    // ─── Determine starter code for the language ───
    const starterCode = refined.starterCode?.[lang] || refined.starterCode?.javascript || null;

    // ─── Step B: Automated Verification — Piston runs the reference code ───
    logger.info(`[Intel] Step B: Verifying reference code against ${refined.testCases.length} test cases (${lang})`);

    // Build a temporary problem-like object for the wrapper system
    const tempProblem = {
      starterCode: starterCode,
      starterCodeMap: refined.starterCode || {}
    };

    let verificationResult;
    try {
      verificationResult = await runTestCases(
        referenceCode.trim(),
        refined.testCases,
        lang,
        tempProblem
      );
    } catch (execError) {
      logger.error('[Intel] Piston execution failed', { error: execError.message });
      return sendError(res, `Code execution engine error: ${execError.message}`, 503);
    }

    // ─── Step C: The Quarantine Gate ───
    if (!verificationResult.allPassed) {
      logger.info(`[Intel] Verification FAILED: ${verificationResult.passed}/${verificationResult.total} tests passed`);

      return res.status(422).json({
        success: false,
        message: `Verification failed: ${verificationResult.passed}/${verificationResult.total} test cases passed. Fix your code and try again.`,
        data: {
          refinedProblem: {
            title: refined.title,
            description: refined.description,
            difficulty: refined.difficulty,
            constraints: refined.constraints,
            testCases: refined.testCases
          },
          verificationResults: verificationResult.results
        }
      });
    }

    // ─── All tests passed → Save as 'waitlisted' ───
    logger.info(`[Intel] Verification PASSED: All ${verificationResult.total} tests passed. Saving as waitlisted.`);

    const newProblem = await Problem.create({
      title: refined.title,
      description: refined.description,
      difficulty: refined.difficulty,
      constraints: refined.constraints,
      skillId: matchedSkillId,
      testCases: refined.testCases,
      starterCode: starterCode,
      starterCodeMap: refined.starterCode || {},
      hints: [],
      isActive: true,
      // Intel fields
      authorId: userId,
      status: 'waitlisted',
      company: company?.trim() || null,
      round: round?.trim() || null,
      warStory: warStory?.trim() || null,
      confidenceLevel: confidence || 50
    });

    // Populate for response
    await newProblem.populate('skillId', 'name');
    await newProblem.populate('authorId', 'name');

    return sendSuccess(res, {
      message: 'Intel accepted. Problem waitlisted for review.',
      problem: {
        _id: newProblem._id,
        title: newProblem.title,
        description: newProblem.description,
        difficulty: newProblem.difficulty,
        constraints: newProblem.constraints,
        company: newProblem.company,
        round: newProblem.round,
        status: newProblem.status,
        skillId: newProblem.skillId,
        testCaseCount: newProblem.testCases.length
      },
      verificationResults: verificationResult.results
    }, 201);
  } catch (error) {
    logger.error('[Intel] Unexpected error in proposeProblem', { error: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * @desc    Get waitlisted problems for the Community Review Queue.
 *          Only shows problems that have passed Piston verification.
 *          Accessible to users Level 5+ (enforced client-side; add middleware if needed).
 * @route   GET /api/problems/review-queue
 * @access  Protected
 */
const getReviewQueue = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [problems, totalCount] = await Promise.all([
      Problem.find({ status: 'waitlisted', isActive: true })
        .select('-testCases') // Don't expose hidden test cases
        .populate('skillId', 'name')
        .populate('authorId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Problem.countDocuments({ status: 'waitlisted', isActive: true })
    ]);

    // Annotate each problem with whether the current user has voted
    const annotated = problems.map(p => {
      const obj = p.toObject();
      const existingVote = p.votedBy?.find(v => v.userId?.toString() === userId.toString());
      obj.userVote = existingVote ? existingVote.vote : null;
      obj.netVotes = (p.upvotes || 0) - (p.downvotes || 0);
      return obj;
    });

    return sendSuccess(res, {
      problems: annotated,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vote on a waitlisted problem. Idempotent — voting again toggles off.
 *          Auto-promotes to 'approved' when net votes >= +3.
 *          Awards 50 XP to the problem author on promotion.
 * @route   POST /api/problems/:id/vote
 * @access  Protected
 */
const voteProblem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { vote } = req.body; // 'up' or 'down'

    if (!['up', 'down'].includes(vote)) {
      return sendError(res, 'Vote must be "up" or "down"', 400);
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) return sendError(res, 'Problem not found', 404);
    if (problem.status !== 'waitlisted') {
      return sendError(res, 'Only waitlisted problems can be voted on', 400);
    }

    // Check for existing vote
    const existingIdx = problem.votedBy.findIndex(v => v.userId?.toString() === userId.toString());

    if (existingIdx !== -1) {
      const existing = problem.votedBy[existingIdx];
      if (existing.vote === vote) {
        // Toggle off (remove vote)
        problem.votedBy.splice(existingIdx, 1);
        if (vote === 'up') problem.upvotes = Math.max(0, problem.upvotes - 1);
        else problem.downvotes = Math.max(0, problem.downvotes - 1);
      } else {
        // Flip vote
        if (vote === 'up') { problem.upvotes++; problem.downvotes = Math.max(0, problem.downvotes - 1); }
        else { problem.downvotes++; problem.upvotes = Math.max(0, problem.upvotes - 1); }
        problem.votedBy[existingIdx].vote = vote;
      }
    } else {
      // New vote
      problem.votedBy.push({ userId, vote });
      if (vote === 'up') problem.upvotes++;
      else problem.downvotes++;
    }

    const netVotes = problem.upvotes - problem.downvotes;

    // ─── Auto-promote at net +3 ───
    let promoted = false;
    if (netVotes >= 3 && problem.status === 'waitlisted') {
      problem.status = 'approved';
      promoted = true;
      logger.info(`[ReviewBoard] Problem "${problem.title}" auto-promoted to approved with ${netVotes} net votes.`);

      // Award 150 XP to the author
      if (problem.authorId) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(problem.authorId, { $inc: { xp: 150 } });
        logger.info(`[ReviewBoard] Awarded 150 XP to author ${problem.authorId}`);
      }
    }

    await problem.save();

    return sendSuccess(res, {
      upvotes: problem.upvotes,
      downvotes: problem.downvotes,
      netVotes,
      userVote: problem.votedBy.find(v => v.userId?.toString() === userId.toString())?.vote || null,
      promoted,
      newStatus: problem.status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProblems, getProblemById, getAiNudge, proposeProblem, getReviewQueue, voteProblem };
