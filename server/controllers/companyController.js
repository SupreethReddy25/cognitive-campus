/**
 * Company Controller — the Intel Hub's data layer.
 *
 * @module companyController
 */

const Company = require('../models/Company');
const InterviewExperience = require('../models/InterviewExperience');
const Problem = require('../models/Problem');
const Skill = require('../models/Skill');
const Submission = require('../models/Submission');
const companyIntel = require('../services/companyIntelService');
const prepPlan = require('../services/prepPlanService');
const logger = require('../utils/logger');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Parse "30–40 LPA" style strings into [min, max]. */
const parseCtc = (str) => {
  const nums = String(str || '').match(/\d+(?:\.\d+)?/g);
  if (!nums) return [null, null];
  const v = nums.map(Number);
  return [Math.min(...v), Math.max(...v)];
};

// @desc    List companies with community stats, filters and trending
// @route   GET /api/companies?q=&tier=&minCtc=&maxCtc=&minExperiences=&sort=
exports.getCompanies = async (req, res) => {
  try {
    const { q, tier, minCtc, maxCtc, minExperiences, sort = 'name' } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { roles: { $regex: escapeRegex(q), $options: 'i' } }];
    if (tier) filter.tier = { $in: String(tier).split(',') };

    const [companies, statRows] = await Promise.all([
      Company.find(filter).lean(),
      InterviewExperience.aggregate([
        { $match: { status: 'Published' } },
        {
          $group: {
            _id: '$companyId',
            experienceCount: { $sum: 1 },
            offers: { $sum: { $cond: [{ $eq: ['$offerReceived', 'Yes'] }, 1, 0] } },
            known: { $sum: { $cond: [{ $ne: ['$offerReceived', 'Pending'] }, 1, 0] } },
            lastAt: { $max: '$createdAt' },
            recent: { $sum: { $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 45 * 86400000)] }, 1, 0] } }
          }
        }
      ])
    ]);
    const stats = new Map(statRows.map((r) => [String(r._id), r]));

    let data = companies.map((c) => {
      const s = stats.get(String(c._id));
      const [min, max] = c.ctcMin != null ? [c.ctcMin, c.ctcMax] : parseCtc(c.avgCTC);
      return {
        ...c,
        ctcMin: min,
        ctcMax: max,
        experienceCount: s?.experienceCount || 0,
        recentExperiences: s?.recent || 0,
        offerRate: s && s.known >= 3 ? Math.round((s.offers / s.known) * 100) : null,
        lastReportAt: s?.lastAt || null
      };
    });

    if (minCtc) data = data.filter((c) => (c.ctcMax ?? 0) >= Number(minCtc));
    if (maxCtc) data = data.filter((c) => (c.ctcMin ?? Infinity) <= Number(maxCtc));
    if (minExperiences) data = data.filter((c) => c.experienceCount >= Number(minExperiences));

    const trending = {
      mostViewed: [...data].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5).map((c) => c._id),
      mostSubmitted: [...data].sort((a, b) => b.recentExperiences - a.recentExperiences || b.experienceCount - a.experienceCount).slice(0, 5).map((c) => c._id)
    };

    const sorters = {
      name: (a, b) => a.name.localeCompare(b.name),
      experiences: (a, b) => b.experienceCount - a.experienceCount,
      ctc: (a, b) => (b.ctcMax ?? 0) - (a.ctcMax ?? 0),
      trending: (a, b) => b.recentExperiences - a.recentExperiences || (b.viewCount || 0) - (a.viewCount || 0)
    };
    data.sort(sorters[sort] || sorters.name);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      meta: { trending, tiers: ['FAANG', 'Product', 'Finance', 'Service', 'Startup', 'Other'], totalExperiences: statRows.reduce((n, r) => n + r.experienceCount, 0) }
    });
  } catch (error) {
    logger.error('getCompanies failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single company by slug (counts a view)
// @route   GET /api/companies/:slug
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate({ slug: req.params.slug }, { $inc: { viewCount: 1 } }, { new: true }).lean();
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    const [min, max] = company.ctcMin != null ? [company.ctcMin, company.ctcMax] : parseCtc(company.avgCTC);
    res.status(200).json({ success: true, data: { ...company, ctcMin: min, ctcMax: max } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Statistical dossier for a company
// @route   GET /api/companies/:slug/stats
exports.getCompanyStats = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug }).select('_id name').lean();
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    const s = await companyIntel.getCompanyIntel(company._id);

    const asMap = (arr) => Object.fromEntries(arr.map((x) => [x.label, x.count]));
    res.status(200).json({
      success: true,
      data: {
        ...s,
        // legacy map-shaped fields
        questionTypeDistribution: asMap(s.questionTypeDistribution),
        roundTypeDistribution: asMap(s.roundTypeDistribution),
        difficultyDistribution: asMap(s.difficultyDistribution)
      }
    });
  } catch (error) {
    logger.error('getCompanyStats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Platform problems that match the company's reported topics
// @route   GET /api/companies/:slug/related-problems
exports.getRelatedProblems = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug }).lean();
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    const stats = await companyIntel.getCompanyIntel(company._id);
    const skillNames = [...new Set(stats.topTopics.filter((t) => t.skill).map((t) => t.skill))];
    const skills = skillNames.length ? await Skill.find({ name: { $in: skillNames } }).select('_id name').lean() : [];
    const skillFreq = new Map(stats.topTopics.filter((t) => t.skill).map((t) => [t.skill, t.pct]));

    const problems = await Problem.find({
      isActive: true,
      status: 'approved',
      $or: [{ skillId: { $in: skills.map((s) => s._id) } }, { companies: { $regex: `^${escapeRegex(company.name)}$`, $options: 'i' } }]
    })
      .select('_id title difficulty skillId companies')
      .populate('skillId', 'name')
      .lean();

    let solved = new Set();
    if (req.user?.userId) {
      solved = new Set((await Submission.find({ userId: req.user.userId, isCorrect: true }).select('problemId').lean()).map((s) => String(s.problemId)));
    }
    const diffRank = { easy: 0, medium: 1, hard: 2 };
    const ranked = problems
      .map((p) => ({
        ...p,
        askedHere: (p.companies || []).some((c) => c.toLowerCase() === company.name.toLowerCase()),
        relevance: (skillFreq.get(p.skillId?.name) || 0) + ((p.companies || []).some((c) => c.toLowerCase() === company.name.toLowerCase()) ? 50 : 0),
        solved: solved.has(String(p._id))
      }))
      .sort((a, b) => Number(a.solved) - Number(b.solved) || b.relevance - a.relevance || diffRank[a.difficulty] - diffRank[b.difficulty])
      .slice(0, 12);

    res.status(200).json({ success: true, count: ranked.length, matchedTopics: stats.topTopics.slice(0, 8).map((t) => t.topic), data: ranked });
  } catch (error) {
    logger.error('getRelatedProblems failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Generate a personalised prep plan (AI narrative over a deterministic, data-driven skeleton)
// @route   POST /api/companies/:slug/prep-plan   body: { days }
exports.generatePrepPlan = async (req, res) => {
  try {
    const plan = await prepPlan.generatePrepPlan({ userId: req.user.userId, slug: req.params.slug, days: req.body?.days });
    if (!plan) return res.status(404).json({ success: false, error: 'Company not found' });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    logger.error('generatePrepPlan failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Could not build a prep plan right now.' });
  }
};
