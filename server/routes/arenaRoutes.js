const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getRating, getLeaderboard } = require('../controllers/arenaController');

const router = express.Router();

// @desc    Get user's Arena Rating (Elo, rank, history)
// @route   GET /api/arena/rating
// @access  Protected
router.get('/rating', authenticateToken, getRating);

// @desc    Top of the Arena ladder
// @route   GET /api/arena/leaderboard
// @access  Protected
router.get('/leaderboard', authenticateToken, getLeaderboard);

module.exports = router;
