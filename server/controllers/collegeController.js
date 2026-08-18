/**
 * collegeController.js
 *
 * Handles all college-specific placement intelligence endpoints.
 *
 * Routes:
 *   GET /api/colleges                                    → getColleges
 *   GET /api/colleges/:slug                              → getCollege
 *   GET /api/colleges/:slug/dashboard                    → getCollegeDashboard
 *   GET /api/colleges/:slug/companies/:companySlug       → getCollegeCompanyIntel
 *
 * @module collegeController
 */

const College = require('../models/College');
const CollegePlacementRecord = require('../models/CollegePlacementRecord');
const Company = require('../models/Company');
const InterviewExperience = require('../models/InterviewExperience');
const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const { mapTopics } = require('../services/topicSkillMapper');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes data confidence level from experience count.
 * Drives UI confidence badges and whether stats like offer rate are shown.
 */
function getDataConfidence(count) {
  if (count === 0) return 'none';
  if (count <= 2) return 'low';
  if (count <= 9) return 'medium';
  return 'high';
}

/**
 * Aggregates topic frequency across an array of InterviewExperience documents.
 * Returns sorted array of { topic, count }.
 */
function aggregateTopics(experiences) {
  const topicMap = {};
  experiences.forEach(exp => {
    exp.rounds?.forEach(round => {
      // round.topics[] — array of topic strings
      round.topics?.forEach(t => {
        if (t) topicMap[t] = (topicMap[t] || 0) + 1;
      });
      // round.questions[].topicTags[] — half weight (more specific)
      round.questions?.forEach(q => {
        q.topicTags?.forEach(t => {
          if (t) topicMap[t] = (topicMap[t] || 0) + 0.5;
        });
      });
    });
  });

  return Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({ topic, count: Math.round(count) }));
}

/**
 * Aggregates round-type frequency across experiences.
 */
function aggregateRoundTypes(experiences) {
  const map = {};
  experiences.forEach(exp => {
    exp.rounds?.forEach(round => {
      if (round.type) map[round.type] = (map[round.type] || 0) + 1;
    });
  });
  return map;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    List/search colleges (for typeahead selector)
 * @route   GET /api/colleges
 * @access  Public
 */
exports.getColleges = async (req, res) => {
  try {
    const { q, tier, limit = 20 } = req.query;
    const query = {};

    if (q) {
      // Text search for typeahead (requires text index on name + shortName)
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortName: { $regex: q, $options: 'i' } }
      ];
    }
    if (tier) query.tier = tier;

    const colleges = await College.find(query)
      .select('name shortName slug tier location verified')
      .sort('name')
      .limit(parseInt(limit));

    return sendSuccess(res, { colleges, count: colleges.length });
  } catch (err) {
    console.error('getColleges error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};

/**
 * @desc    Get a single college with overview stats
 * @route   GET /api/colleges/:slug
 * @access  Public
 */
exports.getCollege = async (req, res) => {
  try {
    const college = await College.findOne({ slug: req.params.slug });
    if (!college) return sendError(res, 'College not found', 404);

    const [expCount, recordCount] = await Promise.all([
      InterviewExperience.countDocuments({ collegeId: college._id, status: 'Published' }),
      CollegePlacementRecord.countDocuments({ collegeId: college._id })
    ]);

    return sendSuccess(res, {
      college: {
        ...college.toObject(),
        experienceCount: expCount,
        placementRecordCount: recordCount,
        dataConfidence: getDataConfidence(expCount)
      }
    });
  } catch (err) {
    console.error('getCollege error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};

/**
 * @desc    College Placement Intelligence Dashboard
 * @route   GET /api/colleges/:slug/dashboard
 * @access  Protected
 *
 * Aggregates all placement data for a college:
 * - companies that recruited here (from experiences + placement records)
 * - top topics across all experiences
 * - round type distribution
 * - recent experiences
 * - year distribution
 * - overall stats
 */
exports.getCollegeDashboard = async (req, res) => {
  try {
    const college = await College.findOne({ slug: req.params.slug });
    if (!college) return sendError(res, 'College not found', 404);

    // Fetch all published experiences and placement records for this college
    const [experiences, placementRecords] = await Promise.all([
      InterviewExperience.find({ collegeId: college._id, status: 'Published' })
        .populate('companyId', 'name slug tier logo avgCTC')
        .sort({ createdAt: -1 })
        .lean(),
      CollegePlacementRecord.find({ collegeId: college._id })
        .populate('companyId', 'name slug tier logo')
        .sort({ hiringYear: -1 })
        .lean()
    ]);

    const totalExperiences = experiences.length;
    const confidence = getDataConfidence(totalExperiences);

    // ── Build company-level aggregation ───────────────────────────────────────
    const companyMap = {}; // companyId string → aggregated data

    // From experiences
    experiences.forEach(exp => {
      if (!exp.companyId) return;
      const cid = exp.companyId._id.toString();
      if (!companyMap[cid]) {
        companyMap[cid] = {
          company: exp.companyId,
          yearsSet: new Set(),
          roles: new Set(),
          experienceCount: 0,
          recordCount: 0,
          offerYes: 0,
          offerTotal: 0,
          avgPackage: null,
          topicsFromExp: {}
        };
      }
      const c = companyMap[cid];
      c.experienceCount++;
      if (exp.year) c.yearsSet.add(exp.year);
      if (exp.role) c.roles.add(exp.role);
      if (exp.offerReceived === 'Yes') c.offerYes++;
      if (exp.offerReceived !== 'Pending') c.offerTotal++;
      exp.rounds?.forEach(round => {
        round.topics?.forEach(t => {
          if (t) c.topicsFromExp[t] = (c.topicsFromExp[t] || 0) + 1;
        });
      });
    });

    // From placement records
    placementRecords.forEach(rec => {
      if (!rec.companyId) return;
      const cid = rec.companyId._id.toString();
      if (!companyMap[cid]) {
        companyMap[cid] = {
          company: rec.companyId,
          yearsSet: new Set(),
          roles: new Set(),
          experienceCount: 0,
          recordCount: 0,
          offerYes: 0,
          offerTotal: 0,
          avgPackage: null,
          topicsFromExp: {}
        };
      }
      const c = companyMap[cid];
      c.recordCount++;
      if (rec.hiringYear) c.yearsSet.add(rec.hiringYear);
      rec.roles?.forEach(r => c.roles.add(r));
      if (rec.packageOffered?.ctc) c.avgPackage = rec.packageOffered.ctc;
    });

    // Serialize company entries
    const companies = Object.values(companyMap)
      .map(c => ({
        company: c.company,
        yearsActive: [...c.yearsSet].sort((a, b) => b - a),
        roles: [...c.roles],
        experienceCount: c.experienceCount,
        recordCount: c.recordCount,
        // Only show offer rate if >= 3 experiences (confidence rule)
        latestOfferRate: c.offerTotal >= 3
          ? Math.round((c.offerYes / c.offerTotal) * 100)
          : null,
        avgPackage: c.avgPackage,
        topTopics: Object.entries(c.topicsFromExp)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([topic, count]) => ({ topic, count }))
      }))
      .sort((a, b) => b.experienceCount - a.experienceCount);

    // ── Global topic aggregation ───────────────────────────────────────────────
    const topTopics = aggregateTopics(experiences).slice(0, 15);

    // ── Round type distribution ───────────────────────────────────────────────
    const commonRoundTypes = aggregateRoundTypes(experiences);

    // ── Year distribution ─────────────────────────────────────────────────────
    const yearMap = {};
    experiences.forEach(exp => {
      if (exp.year) yearMap[exp.year] = (yearMap[exp.year] || 0) + 1;
    });

    // ── Overall offer rate (only if confidence >= medium) ────────────────────
    const offerYes = experiences.filter(e => e.offerReceived === 'Yes').length;
    const offerTotal = experiences.filter(e => e.offerReceived !== 'Pending').length;
    const overallOfferRate = confidence !== 'none' && confidence !== 'low' && offerTotal > 0
      ? Math.round((offerYes / offerTotal) * 100)
      : null;

    // ── Recent experiences (5 latest, limited fields for privacy) ────────────
    const recentExperiences = experiences.slice(0, 5).map(exp => ({
      _id: exp._id,
      company: exp.companyId,
      role: exp.role,
      year: exp.year,
      month: exp.month,
      offerReceived: exp.offerReceived,
      difficulty: exp.difficulty,
      isAnonymous: exp.isAnonymous,
      source: exp.source,
      isVerified: exp.isVerified,
      roundCount: exp.rounds?.length || 0
    }));

    return sendSuccess(res, {
      college: {
        _id: college._id,
        name: college.name,
        shortName: college.shortName,
        slug: college.slug,
        tier: college.tier,
        location: college.location,
        verified: college.verified
      },
      companies,
      topTopics,
      commonRoundTypes,
      yearDistribution: yearMap,
      recentExperiences,
      stats: {
        totalExperiences,
        totalCompanies: companies.length,
        totalRecords: placementRecords.length,
        overallOfferRate,
        topHiringSeason: placementRecords[0]?.hiringSeason || null
      },
      dataConfidence: confidence
    });
  } catch (err) {
    console.error('getCollegeDashboard error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};

/**
 * @desc    Company × College Intelligence View
 * @route   GET /api/colleges/:slug/companies/:companySlug
 * @access  Protected
 *
 * The most important endpoint — scopes company intelligence to a specific college.
 * Also computes preparation priorities by merging topic frequency with BKT mastery.
 */
exports.getCollegeCompanyIntel = async (req, res) => {
  try {
    const { slug, companySlug } = req.params;
    const userId = req.user?.userId;

    const [college, company] = await Promise.all([
      College.findOne({ slug }),
      Company.findOne({ slug: companySlug })
    ]);

    if (!college) return sendError(res, 'College not found', 404);
    if (!company) return sendError(res, 'Company not found', 404);

    // Fetch experiences and placement records scoped to this college + company
    const [experiences, placementRecords] = await Promise.all([
      InterviewExperience.find({
        collegeId: college._id,
        companyId: company._id,
        status: 'Published'
      })
        .populate('userId', 'name')
        .sort({ year: -1, createdAt: -1 })
        .lean(),
      CollegePlacementRecord.find({
        collegeId: college._id,
        companyId: company._id
      })
        .sort({ hiringYear: -1 })
        .lean()
    ]);

    const totalReports = experiences.length;
    const confidence = getDataConfidence(totalReports);

    // ── Topic aggregation ─────────────────────────────────────────────────────
    const allTopicsSorted = aggregateTopics(experiences);

    // ── Round type distribution ───────────────────────────────────────────────
    const roundTypeDistribution = aggregateRoundTypes(experiences);

    // ── Question type distribution ────────────────────────────────────────────
    const qTypeMap = {};
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.questions?.forEach(q => {
          if (q.questionType) qTypeMap[q.questionType] = (qTypeMap[q.questionType] || 0) + 1;
        });
      });
    });

    // ── Difficulty distribution ───────────────────────────────────────────────
    const diffMap = {};
    experiences.forEach(exp => {
      if (exp.difficulty) diffMap[exp.difficulty] = (diffMap[exp.difficulty] || 0) + 1;
    });

    // ── Offer rate (only for confidence >= medium) ───────────────────────────
    const offerYes = experiences.filter(e => e.offerReceived === 'Yes').length;
    const offerTotal = experiences.filter(e => e.offerReceived !== 'Pending').length;
    const offerRate = confidence !== 'none' && confidence !== 'low' && offerTotal > 0
      ? Math.round((offerYes / offerTotal) * 100)
      : null;

    // ── Roles and years ───────────────────────────────────────────────────────
    const rolesSet = new Set();
    const yearsSet = new Set();
    experiences.forEach(exp => {
      if (exp.role) rolesSet.add(exp.role);
      if (exp.year) yearsSet.add(exp.year);
    });
    placementRecords.forEach(rec => {
      rec.roles?.forEach(r => rolesSet.add(r));
      if (rec.hiringYear) yearsSet.add(rec.hiringYear);
    });

    // ── BKT Integration — Preparation Priorities ─────────────────────────────
    const topTopicStrings = allTopicsSorted.slice(0, 20).map(t => t.topic);
    const { tracked: trackedTopicMap, untracked: untrackedTopics } = mapTopics(topTopicStrings);

    // Build skillName → frequency map
    const skillFreqMap = {}; // skillName → total frequency from topics
    const skillTopicsMap = {}; // skillName → [topic strings that mapped to it]
    for (const [topic, skillName] of trackedTopicMap.entries()) {
      const freq = allTopicsSorted.find(t => t.topic === topic)?.count || 0;
      skillFreqMap[skillName] = (skillFreqMap[skillName] || 0) + freq;
      if (!skillTopicsMap[skillName]) skillTopicsMap[skillName] = [];
      skillTopicsMap[skillName].push(topic);
    }

    // Fetch user's SkillStates for tracked skills
    let skillStates = [];
    if (userId) {
      const skills = await Skill.find({
        name: { $in: Object.keys(skillFreqMap) }
      }).lean();
      const skillIds = skills.map(s => s._id);
      skillStates = await SkillState.find({
        userId,
        skillId: { $in: skillIds }
      }).populate('skillId', 'name').lean();
    }

    // masteryP lookup
    const masteryMap = {}; // skillName → masteryP
    skillStates.forEach(ss => {
      if (ss.skillId?.name) masteryMap[ss.skillId.name] = ss.masteryP;
    });

    // Build tracked priority items
    const trackedPriorities = Object.entries(skillFreqMap).map(([skillName, freq]) => {
      const mastery = masteryMap[skillName] ?? 0; // 0 if no SkillState = never practiced
      // Priority score: frequency × (1 - mastery)
      // High freq + low mastery = high priority
      const score = freq * (1 - mastery);
      const priority = score > 4 ? 'high' : score > 1.5 ? 'medium' : 'low';

      return {
        skillName,
        relatedTopics: skillTopicsMap[skillName] || [],
        frequency: freq,
        frequencyLabel: `Appeared in ${freq} topic mention${freq !== 1 ? 's' : ''} across ${totalReports} report${totalReports !== 1 ? 's' : ''}`,
        mastery: userId ? mastery : null,
        masteryLabel: userId ? `${Math.round(mastery * 100)}% mastery` : null,
        hasSkillState: userId ? masteryMap[skillName] !== undefined : null,
        priority,
        priorityScore: Math.round(score * 10) / 10,
        recommendation: priority === 'high'
          ? 'High frequency + needs practice → prioritize this'
          : priority === 'medium'
            ? 'Moderately frequent → review and reinforce'
            : 'Already strong or infrequent → light review sufficient'
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);

    // Untracked topics
    const untrackedPriorities = untrackedTopics.map(topic => {
      const freq = allTopicsSorted.find(t => t.topic === topic)?.count || 0;
      return {
        topic,
        frequency: freq,
        frequencyLabel: `Appeared in ${freq} topic mention${freq !== 1 ? 's' : ''} across ${totalReports} report${totalReports !== 1 ? 's' : ''}`,
        note: 'Not tracked by the adaptive learning system — self-study recommended'
      };
    }).sort((a, b) => b.frequency - a.frequency);

    // Preparation summary sentence
    const highItems = trackedPriorities.filter(p => p.priority === 'high');
    const prepSummary = highItems.length > 0
      ? `Focus on ${highItems.slice(0, 2).map(p => p.skillName).join(' and ')} — high frequency in reports${userId ? ', and your current mastery needs improvement' : ''}.`
      : trackedPriorities.length > 0
        ? `Your strongest prep areas match what ${company.name} tests at ${college.shortName}.`
        : `No DSA-aligned topics found yet in ${totalReports} report${totalReports !== 1 ? 's' : ''}. Contribute your experience to help others.`;

    // ── Sanitize experience fields for privacy ────────────────────────────────
    const sanitizedExperiences = experiences.map(exp => ({
      _id: exp._id,
      role: exp.role,
      year: exp.year,
      month: exp.month,
      offerReceived: exp.offerReceived,
      difficulty: exp.difficulty,
      experienceRating: exp.experienceRating,
      rounds: exp.rounds,
      overallTips: exp.overallTips,
      resourcesUsed: exp.resourcesUsed,
      isAnonymous: exp.isAnonymous,
      isVerified: exp.isVerified,
      source: exp.source,
      upvotes: exp.upvotes,
      // Only include author name if they opted in
      author: exp.isAnonymous ? null : exp.userId?.name || null,
      createdAt: exp.createdAt
    }));

    return sendSuccess(res, {
      college: {
        _id: college._id,
        name: college.name,
        shortName: college.shortName,
        slug: college.slug
      },
      company: {
        _id: company._id,
        name: company.name,
        slug: company.slug,
        tier: company.tier,
        avgCTC: company.avgCTC,
        roles: company.roles,
        logo: company.logo
      },
      stats: {
        totalReports,
        offerRate,
        topTopics: allTopicsSorted.slice(0, 10),
        questionTypeDistribution: qTypeMap,
        roundTypeDistribution,
        difficultyDistribution: diffMap,
        commonRoles: [...rolesSet],
        yearsActive: [...yearsSet].sort((a, b) => b - a)
      },
      experiences: sanitizedExperiences,
      placementRecords,
      prepPriorities: {
        tracked: trackedPriorities,
        untracked: untrackedPriorities,
        summary: prepSummary,
        totalReports,
        dataConfidence: confidence
      },
      dataConfidence: confidence
    });
  } catch (err) {
    console.error('getCollegeCompanyIntel error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};

/**
 * @desc    Create a college (admin only)
 * @route   POST /api/admin/colleges
 * @access  Admin
 */
exports.createCollege = async (req, res) => {
  try {
    const { name, shortName, slug, location, tier, website } = req.body;
    if (!name || !shortName || !slug) {
      return sendError(res, 'name, shortName, and slug are required');
    }

    const college = await College.create({
      name: name.trim(),
      shortName: shortName.trim(),
      slug: slug.toLowerCase().trim(),
      location: location?.trim() || '',
      tier: tier || 'Other',
      website: website?.trim() || '',
      verified: true // admin-created colleges are pre-verified
    });

    return sendSuccess(res, { college }, 201);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 'A college with this name or slug already exists');
    console.error('createCollege error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};

/**
 * @desc    Create a placement record (admin only)
 * @route   POST /api/admin/placement-records
 * @access  Admin
 */
exports.createPlacementRecord = async (req, res) => {
  try {
    const {
      collegeId, companyId, hiringYear, hiringSeason,
      roles, eligibility, studentsHired, packageOffered,
      assessmentStages, verified, source, notes
    } = req.body;

    if (!collegeId || !companyId || !hiringYear) {
      return sendError(res, 'collegeId, companyId, and hiringYear are required');
    }

    const record = await CollegePlacementRecord.create({
      collegeId, companyId, hiringYear, hiringSeason,
      roles, eligibility, studentsHired, packageOffered,
      assessmentStages, verified, source, notes
    });

    const populated = await record.populate(['collegeId', 'companyId']);
    return sendSuccess(res, { record: populated }, 201);
  } catch (err) {
    console.error('createPlacementRecord error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};

/**
 * @desc    Verify/reject a community experience (admin only)
 * @route   PATCH /api/admin/experiences/:id/verify
 * @access  Admin
 */
exports.verifyExperience = async (req, res) => {
  try {
    const { action } = req.body; // 'verify' | 'reject'
    if (!['verify', 'reject'].includes(action)) {
      return sendError(res, 'action must be "verify" or "reject"');
    }

    const update = action === 'verify'
      ? { isVerified: true, status: 'Published' }
      : { isVerified: false, status: 'Rejected' };

    const experience = await InterviewExperience.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!experience) return sendError(res, 'Experience not found', 404);
    return sendSuccess(res, { experience });
  } catch (err) {
    console.error('verifyExperience error:', err.message);
    return sendError(res, 'Server error', 500);
  }
};
