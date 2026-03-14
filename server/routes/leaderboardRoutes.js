const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

// GET /api/leaderboard — Get global leaderboard (top 50)
router.get('/', authenticateToken, getLeaderboard);

module.exports = router;
