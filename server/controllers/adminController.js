/**
 * Admin Controller — the placement cell's control room.
 *
 * Overview analytics, curriculum heatmap, student management, experience moderation,
 * problem curation and data entry (colleges, companies, placement records).
 *
 * @module adminController
 */

const User = require('../models/User');
const SkillState = require('../models/SkillState');
const Submission = require('../models/Submission');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const Company = require('../models/Company');
const College = require('../models/College');
const InterviewExperience = require('../models/InterviewExperience');
const CollegePlacementRecord = require('../models/CollegePlacementRecord');
const knowledge = require('../services/knowledgeService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const DAY = 86400000;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/**
 * @route GET /api/admin/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const since14 = new Date(Date.now() - 14 * DAY);
    const since1 = new Date(Date.now() - DAY);
    const since7 = new Date(Date.now() - 7 * DAY);
    const since30 = new Date(Date.now() - 30 * DAY);

    const [
      totalStudents, totalAdmins, totalSubmissions, correctSubmissions, avgXPResult, distinctProblems,
      problemStatus, experienceStatus, companies, colleges, placementRecords,
      active1, active7, active30, perDay, topProblems, signups, xpBuckets
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      Submission.countDocuments({}),
      Submission.countDocuments({ isCorrect: true }),
      User.aggregate([{ $match: { role: 'student' } }, { $group: { _id: null, avgXP: { $avg: '$xp' }, totalXP: { $sum: '$xp' } } }]),
      Submission.distinct('problemId').then((ids) => Problem.countDocuments({ _id: { $in: ids } })),
      Problem.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      InterviewExperience.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Company.countDocuments({}),
      College.countDocuments({}),
      CollegePlacementRecord.countDocuments({}),
      Submission.distinct('userId', { createdAt: { $gte: since1 } }),
      Submission.distinct('userId', { createdAt: { $gte: since7 } }),
      Submission.distinct('userId', { createdAt: { $gte: since30 } }),
      Submission.aggregate([
        { $match: { createdAt: { $gte: since14 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, submissions: { $sum: 1 }, correct: { $sum: { $cond: ['$isCorrect', 1, 0] } }, users: { $addToSet: '$userId' } } },
        { $project: { _id: 0, date: '$_id', submissions: 1, correct: 1, activeUsers: { $size: '$users' } } },
        { $sort: { date: 1 } }
      ]),
      Submission.aggregate([
        { $group: { _id: '$problemId', attempts: { $sum: 1 }, solved: { $sum: { $cond: ['$isCorrect', 1, 0] } } } },
        { $sort: { attempts: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'problems', localField: '_id', foreignField: '_id', as: 'problem' } },
        { $unwind: { path: '$problem', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, title: '$problem.title', difficulty: '$problem.difficulty', attempts: 1, solved: 1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { role: 'student' } },
        { $bucket: { groupBy: '$xp', boundaries: [0, 50, 200, 500, 1000, 100000], default: 'other', output: { n: { $sum: 1 } } } }
      ])
    ]);

    // fill missing days so the chart never has holes
    const perDayMap = new Map(perDay.map((d) => [d.date, d]));
    const series = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      series.push(perDayMap.get(d) || { date: d, submissions: 0, correct: 0, activeUsers: 0 });
    }

    const statusMap = (rows) => Object.fromEntries(rows.map((r) => [r._id || 'unknown', r.n]));
    const problems = statusMap(problemStatus);
    const experiences = statusMap(experienceStatus);

    return sendSuccess(res, {
      totalStudents,
      totalAdmins,
      totalSubmissions,
      passRate: totalSubmissions ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0,
      totalProblemsAttempted: distinctProblems,
      averageXP: avgXPResult.length ? Math.round(avgXPResult[0].avgXP) : 0,
      totalXP: avgXPResult.length ? avgXPResult[0].totalXP : 0,
      mostAttemptedProblem: topProblems[0] ? { title: topProblems[0].title, attemptCount: topProblems[0].attempts } : { title: 'N/A', attemptCount: 0 },
      topProblems,
      active: { day: active1.length, week: active7.length, month: active30.length },
      submissionsPerDay: series,
      signupsPerDay: signups.map((s) => ({ date: s._id, count: s.n })),
      xpDistribution: xpBuckets.map((b) => ({ bucket: b._id, students: b.n })),
      content: {
        companies, colleges, placementRecords,
        problems: { total: Object.values(problems).reduce((a, b) => a + b, 0), ...problems },
        experiences: { total: Object.values(experiences).reduce((a, b) => a + b, 0), ...experiences }
      },
      moderation: { pendingExperiences: experiences.Draft || 0, waitlistedProblems: problems.waitlisted || 0, quarantinedProblems: problems.quarantine || 0 }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/heatmap?collegeId=
 * Cohort skill heatmap with a mastery distribution per skill — the curriculum signal.
 */
const getSkillHeatmap = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const match = { attempts: { $gt: 0 } };
    if (collegeId) {
      const ids = (await User.find({ collegeId }).select('_id').lean()).map((u) => u._id);
      match.userId = { $in: ids };
    }
    const [skills, states] = await Promise.all([Skill.find({}).sort({ order: 1 }).lean(), SkillState.find(match).select('skillId masteryP isMastered attempts correctAttempts').lean()]);

    const bySkill = new Map();
    states.forEach((s) => {
      const k = String(s.skillId);
      if (!bySkill.has(k)) bySkill.set(k, []);
      bySkill.get(k).push(s);
    });

    const heatmap = skills.map((skill) => {
      const arr = bySkill.get(String(skill._id)) || [];
      const n = arr.length;
      const avg = n ? arr.reduce((a, s) => a + s.masteryP, 0) / n : 0;
      const attempts = arr.reduce((a, s) => a + s.attempts, 0);
      const correct = arr.reduce((a, s) => a + s.correctAttempts, 0);
      const bins = [0, 0, 0, 0, 0]; // <20, 20-40, 40-60, 60-85, mastered
      arr.forEach((s) => { bins[s.masteryP < 0.2 ? 0 : s.masteryP < 0.4 ? 1 : s.masteryP < 0.6 ? 2 : s.masteryP < 0.85 ? 3 : 4]++; });
      return {
        skillId: skill._id,
        skillName: skill.name,
        order: skill.order,
        avgMastery: +avg.toFixed(4),
        totalStudents: n,
        masteredCount: arr.filter((s) => s.isMastered).length,
        masteryRate: n ? +(arr.filter((s) => s.isMastered).length / n).toFixed(4) : 0,
        accuracy: attempts ? +(correct / attempts).toFixed(3) : null,
        distribution: bins
      };
    });

    heatmap.sort((a, b) => (a.totalStudents === 0) - (b.totalStudents === 0) || a.avgMastery - b.avgMastery);
    const weakest = heatmap.filter((h) => h.totalStudents > 0).slice(0, 3).map((h) => h.skillName);
    return sendSuccess(res, {
      heatmap,
      recommendation: weakest.length ? `Curriculum focus: ${weakest.join(', ')} — the lowest average mastery across ${collegeId ? 'this college' : 'all students'}.` : 'No skill data yet.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/students?q=&sort=xp|recent|mastery&limit=
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { q, sort = 'xp', role } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const filter = {};
    if (role === 'admin' || role === 'student') filter.role = role;
    if (q) filter.$or = [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { email: { $regex: escapeRegex(q), $options: 'i' } }];

    const sortSpec = sort === 'recent' ? { createdAt: -1 } : sort === 'active' ? { lastActiveDate: -1 } : { xp: -1 };
    const students = await User.find(filter)
      .select('name email xp level streak role createdAt lastActiveDate collegeId')
      .populate('collegeId', 'shortName name')
      .sort(sortSpec)
      .limit(limit)
      .lean();

    const ids = students.map((s) => s._id);
    const [mastered, subs] = await Promise.all([
      SkillState.aggregate([{ $match: { userId: { $in: ids }, isMastered: true } }, { $group: { _id: '$userId', n: { $sum: 1 } } }]),
      Submission.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', n: { $sum: 1 }, ok: { $sum: { $cond: ['$isCorrect', 1, 0] } } } }])
    ]);
    const masteredMap = new Map(mastered.map((m) => [String(m._id), m.n]));
    const subMap = new Map(subs.map((s) => [String(s._id), s]));

    const rows = students.map((s) => ({
      ...s,
      skillsMastered: masteredMap.get(String(s._id)) || 0,
      submissions: subMap.get(String(s._id))?.n || 0,
      passRate: subMap.get(String(s._id))?.n ? Math.round((subMap.get(String(s._id)).ok / subMap.get(String(s._id)).n) * 100) : null
    }));

    return sendSuccess(res, { students: rows, total: await User.countDocuments(filter) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/students/:id — profile drill-down
 */
const getStudentDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -encryptedGeminiKey -keyIv -keyAuthTag').populate('collegeId', 'name shortName').populate('targetCompanyId', 'name').lean();
    if (!user) return sendError(res, 'User not found', 404);
    const [states, recent, totals] = await Promise.all([
      SkillState.find({ userId: user._id }).populate('skillId', 'name order').lean(),
      Submission.find({ userId: user._id }).select('-code -astResult').populate('problemId', 'title difficulty').sort({ createdAt: -1 }).limit(10).lean(),
      Submission.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, n: { $sum: 1 }, ok: { $sum: { $cond: ['$isCorrect', 1, 0] } } } }])
    ]);
    return sendSuccess(res, {
      user,
      skills: states.filter((s) => s.skillId).sort((a, b) => a.skillId.order - b.skillId.order).map((s) => ({ name: s.skillId.name, masteryP: s.masteryP, attempts: s.attempts, isMastered: s.isMastered, isUnlocked: s.isUnlocked })),
      recentSubmissions: recent,
      totals: { submissions: totals[0]?.n || 0, passRate: totals[0]?.n ? Math.round((totals[0].ok / totals[0].n) * 100) : null }
    });
  } catch (error) {
    next(error);
  }
};

/** @route PATCH /api/admin/users/:id/role */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) return sendError(res, 'role must be student or admin');
    if (String(req.params.id) === String(req.user.userId) && role !== 'admin') {
      const admins = await User.countDocuments({ role: 'admin' });
      if (admins <= 1) return sendError(res, 'You are the only admin — promote someone else first.');
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: 'name email role xp level createdAt' });
    if (!user) return sendError(res, 'User not found', 404);
    logger.info(`Admin ${req.user.userId} set role=${role} for ${user.email}`);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/admin/experiences?status=&q=&limit=&skip= */
const getExperiences = async (req, res, next) => {
  try {
    const { status = 'all', q } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = parseInt(req.query.skip, 10) || 0;
    const filter = status === 'all' ? {} : { status };
    if (q) {
      const companies = await Company.find({ name: { $regex: escapeRegex(q), $options: 'i' } }).select('_id').lean();
      filter.$or = [{ companyId: { $in: companies.map((c) => c._id) } }, { role: { $regex: escapeRegex(q), $options: 'i' } }];
    }
    const [experiences, total, counts] = await Promise.all([
      InterviewExperience.find(filter)
        .populate('companyId', 'name slug tier logo')
        .populate('userId', 'name email')
        .populate('collegeId', 'name shortName')
        .sort({ status: 1, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      InterviewExperience.countDocuments(filter),
      InterviewExperience.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])
    ]);
    return sendSuccess(res, { experiences, total, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
  } catch (error) {
    next(error);
  }
};

/** @route PATCH /api/admin/experiences/:id/verify  body:{action:'verify'|'reject'|'restore'} */
const moderateExperience = async (req, res, next) => {
  try {
    const { action } = req.body;
    const updates = { verify: { isVerified: true, status: 'Published' }, reject: { isVerified: false, status: 'Rejected' }, restore: { status: 'Published' } };
    if (!updates[action]) return sendError(res, 'action must be verify, reject or restore');
    const experience = await InterviewExperience.findByIdAndUpdate(req.params.id, updates[action], { new: true });
    if (!experience) return sendError(res, 'Experience not found', 404);
    return sendSuccess(res, { experience });
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/admin/problems?status= */
const getProblems = async (req, res, next) => {
  try {
    const { status = 'all', q } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 300);
    const filter = status === 'all' ? {} : { status };
    if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
    const [problems, counts] = await Promise.all([
      Problem.find(filter)
        .populate('skillId', 'name')
        .populate('authorId', 'name')
        .select('title difficulty status isActive skillId authorId company round createdAt upvotes downvotes description confidenceLevel')
        .sort({ status: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      Problem.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])
    ]);
    return sendSuccess(res, { problems, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
  } catch (error) {
    next(error);
  }
};

/** @route PATCH /api/admin/problems/:id/status */
const updateProblemStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['quarantine', 'waitlisted', 'approved'];
    if (!valid.includes(status)) return sendError(res, `Status must be one of: ${valid.join(', ')}`);
    const problem = await Problem.findByIdAndUpdate(req.params.id, { status, isActive: status === 'approved' }, { new: true });
    if (!problem) return sendError(res, 'Problem not found', 404);
    if (status === 'approved' && problem.authorId) {
      await User.findByIdAndUpdate(problem.authorId, { $inc: { xp: 150 } });
    }
    knowledge.invalidate('problemIndex');
    return sendSuccess(res, { problem });
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/admin/companies */
const createCompany = async (req, res, next) => {
  try {
    const { name, tier, avgCTC, roles, domain, description, headquarters, ctcMin, ctcMax } = req.body;
    if (!name || !String(name).trim()) return sendError(res, 'name is required');
    const slug = slugify(name);
    const cleanDomain = String(domain || '').trim();
    const company = await Company.create({
      name: String(name).trim(),
      slug,
      tier: ['FAANG', 'Product', 'Finance', 'Service', 'Startup', 'Other'].includes(tier) ? tier : 'Other',
      avgCTC: avgCTC || 'Not disclosed',
      ctcMin: ctcMin === '' || ctcMin == null ? null : Number(ctcMin),
      ctcMax: ctcMax === '' || ctcMax == null ? null : Number(ctcMax),
      roles: Array.isArray(roles) ? roles : String(roles || '').split(',').map((r) => r.trim()).filter(Boolean),
      domain: cleanDomain,
      description: description || '',
      headquarters: headquarters || '',
      logo: cleanDomain ? `https://logo.clearbit.com/${cleanDomain}` : ''
    });
    return sendSuccess(res, { company }, 201);
  } catch (error) {
    if (error.code === 11000) return sendError(res, 'A company with this name already exists');
    next(error);
  }
};

/** @route GET /api/admin/placement-records?collegeId= */
const getPlacementRecords = async (req, res, next) => {
  try {
    const filter = req.query.collegeId ? { collegeId: req.query.collegeId } : {};
    const records = await CollegePlacementRecord.find(filter).populate('collegeId', 'shortName').populate('companyId', 'name').sort({ hiringYear: -1, createdAt: -1 }).limit(100).lean();
    return sendSuccess(res, { records });
  } catch (error) {
    next(error);
  }
};

/** @route DELETE /api/admin/placement-records/:id */
const deletePlacementRecord = async (req, res, next) => {
  try {
    const r = await CollegePlacementRecord.findByIdAndDelete(req.params.id);
    if (!r) return sendError(res, 'Record not found', 404);
    return sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats, getSkillHeatmap, getAllStudents, getStudentDetail, updateUserRole,
  getExperiences, moderateExperience, getProblems, updateProblemStatus,
  createCompany, getPlacementRecords, deletePlacementRecord
};
