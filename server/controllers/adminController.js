/**
 * Admin Controller
 *
 * Provides admin-only endpoints for cohort analytics, student management,
 * and dashboard statistics.
 *
 * @module adminController
 */

const User = require('../models/User');
const SkillState = require('../models/SkillState');
const Submission = require('../models/Submission');
const Skill = require('../models/Skill');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Get all students with their mastered skill counts.
 *          Uses aggregation to avoid N+1 queries.
 * @route   GET /api/admin/students
 * @access  Protected + Admin
 * @param   {import('express').Request} req - Express request
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getAllStudents = async (req, res, next) => {
  try {
    // Get all students
    const students = await User.find({ role: 'student' })
      .select('name email xp level streak createdAt')
      .sort({ xp: -1 });

    // Get mastered skill counts for all students in one aggregation
    const masteredCounts = await SkillState.aggregate([
      { $match: { isMastered: true } },
      { $group: { _id: '$userId', skillsMastered: { $sum: 1 } } }
    ]);

    // Build a lookup map
    const masteredMap = new Map(
      masteredCounts.map((entry) => [entry._id.toString(), entry.skillsMastered])
    );

    // Merge mastered counts into student data
    const studentsWithMastery = students.map((student) => {
      const studentObj = student.toObject();
      studentObj.skillsMastered = masteredMap.get(student._id.toString()) || 0;
      return studentObj;
    });

    return sendSuccess(res, { students: studentsWithMastery });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get skill heatmap — cohort-level analytics showing which skills
 *          students are struggling with. Groups by skill and computes
 *          average mastery, student count, mastered count, and mastery rate.
 * @route   GET /api/admin/heatmap
 * @access  Protected + Admin
 * @param   {import('express').Request} req - Express request
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getSkillHeatmap = async (req, res, next) => {
  try {
    const heatmapAggregation = await SkillState.aggregate([
      {
        $group: {
          _id: '$skillId',
          avgMastery: { $avg: '$masteryP' },
          totalStudents: { $sum: 1 },
          masteredCount: {
            $sum: { $cond: [{ $eq: ['$isMastered', true] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'skills',
          localField: '_id',
          foreignField: '_id',
          as: 'skill'
        }
      },
      { $unwind: '$skill' },
      {
        $project: {
          _id: 0,
          skillId: '$_id',
          skillName: '$skill.name',
          order: '$skill.order',
          avgMastery: { $round: ['$avgMastery', 4] },
          totalStudents: 1,
          masteredCount: 1,
          masteryRate: {
            $round: [
              { $cond: [{ $eq: ['$totalStudents', 0] }, 0, { $divide: ['$masteredCount', '$totalStudents'] }] },
              4
            ]
          }
        }
      },
      { $sort: { avgMastery: 1 } }
    ]);

    return sendSuccess(res, { heatmap: heatmapAggregation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard overview stats for admin panel.
 *          Returns total students, submissions, distinct problems attempted,
 *          average XP, and the most attempted problem.
 * @route   GET /api/admin/stats
 * @access  Protected + Admin
 * @param   {import('express').Request} req - Express request
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalStudents, totalSubmissions, avgXPResult, mostAttemptedResult, distinctProblems] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Submission.countDocuments({}),
      User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: null, avgXP: { $avg: '$xp' } } }
      ]),
      Submission.aggregate([
        { $group: { _id: '$problemId', attemptCount: { $sum: 1 } } },
        { $sort: { attemptCount: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'problems',
            localField: '_id',
            foreignField: '_id',
            as: 'problem'
          }
        },
        { $unwind: { path: '$problem', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            title: '$problem.title',
            attemptCount: 1
          }
        }
      ]),
      Submission.distinct('problemId')
    ]);

    const averageXP = avgXPResult.length > 0 ? Math.round(avgXPResult[0].avgXP) : 0;
    const mostAttemptedProblem = mostAttemptedResult.length > 0
      ? mostAttemptedResult[0]
      : { title: 'N/A', attemptCount: 0 };

    return sendSuccess(res, {
      totalStudents,
      totalSubmissions,
      totalProblemsAttempted: distinctProblems.length,
      averageXP,
      mostAttemptedProblem
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllStudents, getSkillHeatmap, getDashboardStats };
