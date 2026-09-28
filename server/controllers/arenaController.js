/**
 * Arena Controller — competitive rating, history and the ladder.
 *
 * @module arenaController
 */

const ArenaRating = require('../models/ArenaRating');
const { sendSuccess } = require('../utils/responseHelper');

const START_ELO = 1000;
const TIERS = [['Legend', 1600], ['Archon', 1400], ['Gold', 1200], ['Silver', 1000], ['Bronze', 0]];
const rankFor = (elo) => TIERS.find(([, min]) => elo >= min)[0];

/**
 * @desc    The signed-in user's Elo, rank tier, record and recent matches
 * @route   GET /api/arena/rating
 * @access  Protected
 */
const getRating = async (req, res, next) => {
  try {
    const rating = await ArenaRating.findOne({ userId: req.user.userId })
      .populate('matchHistory.opponentId', 'name')
      .populate('matchHistory.problemId', 'title difficulty')
      .lean();

    if (!rating) {
      return sendSuccess(res, { elo: START_ELO, rank: rankFor(START_ELO), wins: 0, losses: 0, draws: 0, matchHistory: [] });
    }
    return sendSuccess(res, { ...rating, rank: rankFor(rating.elo) });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    The top of the ladder, plus the signed-in user's position when they are not in it
 * @route   GET /api/arena/leaderboard
 * @access  Protected
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const userId = String(req.user.userId);
    const top = await ArenaRating.find({}).sort({ elo: -1, wins: -1 }).limit(8)
      .populate({ path: 'userId', select: 'name collegeId', populate: { path: 'collegeId', select: 'shortName' } })
      .lean();

    const rows = top.filter((r) => r.userId).map((r, i) => ({
      rank: i + 1,
      userId: String(r.userId._id),
      name: r.userId.name,
      college: r.userId.collegeId?.shortName || null,
      elo: r.elo,
      tier: rankFor(r.elo),
      wins: r.wins,
      losses: r.losses,
      isCurrentUser: String(r.userId._id) === userId
    }));

    let me = rows.find((r) => r.isCurrentUser) || null;
    if (!me) {
      const mine = await ArenaRating.findOne({ userId }).lean();
      if (mine) {
        const above = await ArenaRating.countDocuments({ elo: { $gt: mine.elo } });
        me = { rank: above + 1, userId, name: 'You', elo: mine.elo, tier: rankFor(mine.elo), wins: mine.wins, losses: mine.losses, isCurrentUser: true };
      }
    }
    const total = await ArenaRating.countDocuments({});
    return sendSuccess(res, { leaderboard: rows, me, total });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRating, getLeaderboard, rankFor };
