const express = require('express');
const authenticateToken = require('../middleware/auth');
const ArenaRating = require('../models/ArenaRating');

const router = express.Router();

// @desc    Get user's Arena Rating (Elo, rank, history)
// @route   GET /api/arena/rating
// @access  Protected
router.get('/rating', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let rating = await ArenaRating.findOne({ userId })
      .populate('matchHistory.opponentId', 'name')
      .populate('matchHistory.problemId', 'title')
      .lean();

    if (!rating) {
      // Return default unranked state
      rating = {
        elo: 1000,
        rank: 'Bronze',
        wins: 0,
        losses: 0,
        draws: 0,
        matchHistory: []
      };
    } else {
      // compute virtual
      const elo = rating.elo;
      let rank = 'Bronze';
      if (elo >= 1600) rank = 'Legend';
      else if (elo >= 1400) rank = 'Archon';
      else if (elo >= 1200) rank = 'Gold';
      else if (elo >= 1000) rank = 'Silver';
      rating.rank = rank;
    }

    res.json({ success: true, data: rating });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
