const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getProfile, getRecommendations } = require('../controllers/userController');

const router = express.Router();

// GET /api/users/profile — Get user profile with aggregated data
router.get('/profile', authenticateToken, getProfile);

// GET /api/users/recommendations — Get personalised problem recommendation
router.get('/recommendations', authenticateToken, getRecommendations);

module.exports = router;
