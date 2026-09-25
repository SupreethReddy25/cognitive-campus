/**
 * Leaderboard Controller
 *
 * Global (or college-scoped) XP ranking. Mastered-skill counts come from a single aggregation
 * (no N+1) and results are cached in-process for 30 s — plenty for a leaderboard, no Redis needed.
 *
 * @module leaderboardController
 */

const User = require('../models/User');
const SkillState = require('../models/SkillState');
const knowledge = require('../services/knowledgeService');
const { sendSuccess } = require('../utils/responseHelper');

const TTL = 30 * 1000;

const loadBoard = (scopeKey, collegeId) =>
  knowledge.remember(`leaderboard:${scopeKey}`, TTL, async () => {
    const match = {};
    if (collegeId) match.collegeId = collegeId;
    const users = await User.find(match).select('name xp level streak collegeId').populate('collegeId', 'shortName').sort({ xp: -1, _id: 1 }).limit(100).lean();
    const mastered = await SkillState.aggregate([
      { $match: { userId: { $in: users.map((u) => u._id) }, isMastered: true } },
      { $group: { _id: '$userId', n: { $sum: 1 } } }
    ]);
    const masteredMap = new Map(mastered.map((m) => [String(m._id), m.n]));
    return users.map((u, i) => ({
      rank: i + 1,
      userId: String(u._id),
      name: u.name,
      level: u.level,
      xp: u.xp,
      streak: u.streak || 0,
      college: u.collegeId?.shortName || null,
      skillsMastered: masteredMap.get(String(u._id)) || 0
    }));
  });

/**
 * @route GET /api/leaderboard?scope=global|college
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const scope = req.query.scope === 'college' ? 'college' : 'global';

    let collegeId = null;
    const me = await User.findById(userId).select('name xp level streak collegeId role').populate('collegeId', 'shortName').lean();
    if (scope === 'college') collegeId = me?.collegeId?._id || null;

    const board = await loadBoard(scope === 'college' ? `c:${collegeId}` : 'global', collegeId);
    const top50 = board.slice(0, 50).map((e) => ({ ...e, isCurrentUser: e.userId === String(userId) }));

    // append the requester if they're outside the visible list
    if (me && !top50.some((e) => e.isCurrentUser)) {
      const filter = { xp: { $gt: me.xp } };
      if (collegeId) filter.collegeId = collegeId;
      const above = await User.countDocuments(filter);
      const mastered = await SkillState.countDocuments({ userId, isMastered: true });
      top50.push({ rank: above + 1, userId: String(userId), name: me.name, level: me.level, xp: me.xp, streak: me.streak || 0, college: me.collegeId?.shortName || null, skillsMastered: mastered, isCurrentUser: true });
    }

    return sendSuccess(res, { leaderboard: top50, scope, collegeAvailable: !!me?.collegeId, cached: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
