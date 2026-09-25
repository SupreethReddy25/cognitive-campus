/**
 * Analytics Controller — dashboard, learning profile, peer comparison and BKT model transparency.
 *
 * @module analyticsController
 */

const analytics = require('../services/analyticsService');
const knowledge = require('../services/knowledgeService');
const bkt = require('../services/bktEngine');
const BktParams = require('../models/BktParams');
const Skill = require('../models/Skill');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/** @route GET /api/analytics/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const data = await analytics.getDashboard(req.user.userId);
    if (!data) return sendError(res, 'User not found', 404);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/analytics/profile — learning velocity, strengths/weaknesses, insights */
const getLearningProfile = async (req, res, next) => {
  try {
    const data = await analytics.getLearningProfile(req.user.userId);
    if (!data) return sendError(res, 'User not found', 404);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @route GET /api/analytics/peers — anonymised college / global comparison */
const getPeers = async (req, res, next) => {
  try {
    return sendSuccess(res, await analytics.getPeerComparison(req.user.userId));
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/analytics/model
 * The learned BKT parameters vs textbook defaults — shown in the UI so the "intelligence" is inspectable.
 */
const getModel = async (req, res, next) => {
  try {
    const [skills, rows] = await Promise.all([Skill.find({}).sort({ order: 1 }).lean(), BktParams.find({}).lean()]);
    const byId = new Map(rows.map((r) => [String(r.skillId), r]));
    return sendSuccess(res, {
      defaults: bkt.DEFAULT_PARAMS,
      masteryThreshold: bkt.MASTERY_THRESHOLD,
      unlockThreshold: bkt.UNLOCK_THRESHOLD,
      skills: skills.map((s) => {
        const r = byId.get(String(s._id));
        return {
          skillId: s._id,
          name: s.name,
          fitted: !!r,
          params: r ? { pL0: r.pL0, pT: r.pT, pS: r.pS, pG: r.pG } : bkt.DEFAULT_PARAMS,
          sequences: r?.sequences || 0,
          observations: r?.observations || 0,
          logLikelihoodGain: r ? +(r.logLikelihood - r.baselineLogLikelihood).toFixed(2) : 0,
          fittedAt: r?.fittedAt || null
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/analytics/model/refit — admin only (route-level guard) */
const refitModel = async (req, res, next) => {
  try {
    const summary = await knowledge.refitAllSkillParams();
    return sendSuccess(res, { summary });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getLearningProfile, getPeers, getModel, refitModel };
