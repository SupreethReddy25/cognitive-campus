/**
 * Experience Controller — community interview experiences.
 *
 * @module experienceController
 */

const InterviewExperience = require('../models/InterviewExperience');
const Company = require('../models/Company');
const College = require('../models/College');
const User = require('../models/User');
const experienceParser = require('../services/experienceParser');
const companyIntel = require('../services/companyIntelService');
const achievementService = require('../services/achievementService');
const logger = require('../utils/logger');

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard', 'Smooth', 'Challenging', 'Grueling', 'Brain-melting'];

/** Public shape of an experience — never leaks userId/upvotedBy. */
const present = (exp, viewerId) => {
  const uid = viewerId ? String(viewerId) : null;
  const up = (exp.upvotedBy || []).some((id) => String(id) === uid);
  const down = (exp.downvotedBy || []).some((id) => String(id) === uid);
  const { upvotedBy, downvotedBy, userId, ...rest } = exp;
  return {
    ...rest,
    author: exp.isAnonymous ? null : userId?.name || null,
    upvotes: exp.upvotes || 0,
    downvotes: exp.downvotes || 0,
    userVote: up ? 'up' : down ? 'down' : null,
    isMine: !!(uid && userId && String(userId._id || userId) === uid)
  };
};

// @desc    Get all published experiences for a company (with filters)
// @route   GET /api/companies/:slug/experiences?role=&year=&offer=&sort=
exports.getCompanyExperiences = async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    const { role, year, offer, sort = 'recent' } = req.query;
    const filter = { companyId: company._id, status: 'Published' };
    if (role) filter.role = role;
    if (year) filter.year = Number(year);
    if (offer) filter.offerReceived = offer;

    const sortSpec = sort === 'top' ? { upvotes: -1, createdAt: -1 } : sort === 'quality' ? { qualityScore: -1, createdAt: -1 } : { year: -1, createdAt: -1 };
    const experiences = await InterviewExperience.find(filter).populate('userId', 'name').populate('collegeId', 'name shortName').sort(sortSpec).lean();

    res.status(200).json({ success: true, count: experiences.length, data: experiences.map((e) => present(e, req.user?.userId)) });
  } catch (error) {
    logger.error('getCompanyExperiences failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Submit new experience
// @route   POST /api/experiences
// @access  Private
exports.createExperience = async (req, res) => {
  try {
    const b = req.body || {};
    const userId = req.user.userId;

    if (!b.companyId || !b.role || !b.offerReceived) {
      return res.status(400).json({ success: false, error: 'companyId, role and offerReceived are required' });
    }
    const company = await Company.findById(b.companyId).select('_id name slug');
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    const now = new Date();
    const doc = {
      companyId: company._id,
      userId, // always stored for moderation; hidden from the public via isAnonymous
      isAnonymous: !!b.isAnonymous,
      role: String(b.role).trim().slice(0, 60),
      year: Number(b.year) || now.getFullYear(),
      month: String(b.month || now.toLocaleString('en-US', { month: 'long' })),
      offerReceived: ['Yes', 'No', 'Pending'].includes(b.offerReceived) ? b.offerReceived : 'Pending',
      compensation: b.compensation && typeof b.compensation === 'object' ? { base: String(b.compensation.base || ''), bonus: String(b.compensation.bonus || ''), stock: String(b.compensation.stock || '') } : undefined,
      timeline: b.timeline ? String(b.timeline).slice(0, 200) : undefined,
      difficulty: DIFFICULTIES.includes(b.difficulty) ? b.difficulty : undefined,
      experienceRating: ['Positive', 'Neutral', 'Negative'].includes(b.experienceRating) ? b.experienceRating : undefined,
      applicationSource: b.applicationSource ? String(b.applicationSource).slice(0, 80) : undefined,
      college: b.college ? String(b.college).slice(0, 120) : undefined,
      cgpa: b.cgpa ? String(b.cgpa).slice(0, 10) : undefined,
      rounds: (Array.isArray(b.rounds) ? b.rounds : []).slice(0, 10).map((r) => ({
        type: String(r.type || 'Technical'),
        duration: r.duration ? String(r.duration) : undefined,
        vibe: r.vibe ? String(r.vibe) : undefined,
        tips: r.tips || r.notes ? String(r.tips || r.notes).slice(0, 1500) : undefined,
        topics: (Array.isArray(r.topics) ? r.topics : []).map(String).slice(0, 12),
        questions: (Array.isArray(r.questions) ? r.questions : []).slice(0, 12).map((q) => ({
          text: String(q.text || '').slice(0, 1200),
          questionType: q.questionType ? String(q.questionType) : undefined,
          topicTags: (Array.isArray(q.topicTags) ? q.topicTags : []).map(String).slice(0, 6)
        }))
      })),
      overallTips: b.overallTips ? String(b.overallTips).slice(0, 4000) : undefined,
      resourcesUsed: b.resourcesUsed ? String(b.resourcesUsed).slice(0, 600) : undefined,
      source: 'self-reported'
    };

    // college: explicit choice → profile fallback
    let collegeId = b.collegeId || null;
    if (!collegeId) {
      const u = await User.findById(userId).select('collegeId').lean();
      collegeId = u?.collegeId || null;
    }
    if (collegeId && (await College.exists({ _id: collegeId }))) doc.collegeId = collegeId;

    const quality = experienceParser.scoreQuality(doc);
    doc.qualityScore = quality.score;
    // very thin submissions wait for a moderator instead of polluting the stats
    doc.status = quality.score < 25 ? 'Draft' : 'Published';

    const before = await companyIntel.getCompanyIntel(company._id);
    const experience = await InterviewExperience.create(doc);

    // XP scales with quality: 60 base + up to 140
    const xpEarned = doc.status === 'Published' ? 60 + Math.round(quality.score * 1.4) : 20;
    const user = await User.findById(userId);
    user.xp += xpEarned;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save();
    const achievements = await achievementService.evaluate(userId);

    // how does this submission move the community knowledge base?
    const after = doc.status === 'Published' ? await companyIntel.getCompanyIntel(company._id) : before;
    const beforeTopics = new Set(before.topTopics.map((t) => t.topic));
    const newTopics = after.topTopics.filter((t) => !beforeTopics.has(t.topic)).map((t) => t.topic);
    const questionCount = doc.rounds.reduce((n, r) => n + (r.questions?.length || 0), 0);

    res.status(201).json({
      success: true,
      data: experience,
      impact: {
        xpEarned,
        status: doc.status,
        quality,
        company: { name: company.name, slug: company.slug },
        companyReportsBefore: before.totalReports,
        companyReportsAfter: after.totalReports,
        dataConfidenceBefore: before.dataConfidence,
        dataConfidenceAfter: after.dataConfidence,
        questionsContributed: questionCount,
        roundsContributed: doc.rounds.length,
        newTopics,
        offerRate: after.offerRate,
        newLevel: user.level,
        achievements
      }
    });
  } catch (error) {
    logger.error('createExperience failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.name === 'ValidationError' ? error.message : 'Server Error' });
  }
};

// @desc    Toggle upvote (legacy route — kept for older clients)
// @route   POST /api/experiences/:id/upvote
exports.upvoteExperience = async (req, res) => {
  req.body = { ...(req.body || {}), vote: 'up' };
  return exports.voteExperience(req, res);
};

// @desc    Up/down vote an experience (toggle; switching flips the vote)
// @route   POST /api/experiences/:id/vote   body: { vote: 'up' | 'down' }
exports.voteExperience = async (req, res) => {
  try {
    const userId = String(req.user.userId);
    const vote = req.body?.vote === 'down' ? 'down' : 'up';
    const exp = await InterviewExperience.findById(req.params.id);
    if (!exp) return res.status(404).json({ success: false, error: 'Experience not found' });

    const hasUp = exp.upvotedBy.some((id) => String(id) === userId);
    const hasDown = exp.downvotedBy.some((id) => String(id) === userId);

    if (vote === 'up') {
      if (hasUp) { exp.upvotedBy = exp.upvotedBy.filter((id) => String(id) !== userId); }
      else {
        exp.upvotedBy.push(userId);
        if (hasDown) exp.downvotedBy = exp.downvotedBy.filter((id) => String(id) !== userId);
      }
    } else if (hasDown) {
      exp.downvotedBy = exp.downvotedBy.filter((id) => String(id) !== userId);
    } else {
      exp.downvotedBy.push(userId);
      if (hasUp) exp.upvotedBy = exp.upvotedBy.filter((id) => String(id) !== userId);
    }
    exp.upvotes = exp.upvotedBy.length;
    exp.downvotes = exp.downvotedBy.length;
    await exp.save();

    const userVote = exp.upvotedBy.some((id) => String(id) === userId) ? 'up' : exp.downvotedBy.some((id) => String(id) === userId) ? 'down' : null;
    res.status(200).json({ success: true, data: { upvotes: exp.upvotes, downvotes: exp.downvotes, userVote, userUpvoted: userVote === 'up' } });
  } catch (error) {
    logger.error('voteExperience failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Parse a raw interview dump into a structured draft (AI with heuristic fallback)
// @route   POST /api/experiences/ai-parse
exports.parseRawDump = async (req, res) => {
  try {
    const { rawText, companyHint } = req.body || {};
    if (!rawText || String(rawText).trim().length < 40) {
      return res.status(400).json({ success: false, error: 'Please paste at least a couple of sentences about your interview.' });
    }
    const result = await experienceParser.parseExperience(rawText, { userId: req.user?.userId, companyHint });
    res.status(200).json({ success: true, data: result.parsed, company: result.company, quality: result.quality, source: result.source, ai: result.ai, skillCoverage: result.skillCoverage });
  } catch (error) {
    logger.error('parseRawDump failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to parse the text. Try the guided builder instead.' });
  }
};

// @desc    Live quality score for a draft (used by the meter while typing)
// @route   POST /api/experiences/score
exports.scoreDraft = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: experienceParser.scoreQuality(req.body || {}) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
