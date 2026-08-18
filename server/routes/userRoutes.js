const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getProfile, getRecommendations } = require('../controllers/userController');

const router = express.Router();

// GET /api/users/profile — Get user profile with aggregated data
router.get('/profile', authenticateToken, getProfile);

// GET /api/users/recommendations — Get personalised problem recommendation
router.get('/recommendations', authenticateToken, require('../controllers/userController').getRecommendations);

// POST /api/users/config-key — Securely encrypt and store BYOK Gemini key
router.post('/config-key', authenticateToken, require('../controllers/userController').configGeminiKey);

// POST /api/users/dashboard-quote — Get AI generated quote with context payload
router.post('/dashboard-quote', authenticateToken, require('../controllers/userController').getDashboardQuote);

// PATCH /api/users/profile — Update placement profile (college, targetCompany, targetRole)
router.patch('/profile', authenticateToken, require('../controllers/userController').updateProfile);

module.exports = router;
