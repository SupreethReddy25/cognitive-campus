const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const analytics = require('../controllers/analyticsController');
const engagement = require('../controllers/engagementController');

const router = express.Router();

// ─── Analytics (student-scoped) ───
router.get('/analytics/dashboard', authenticateToken, analytics.getDashboard);
router.get('/analytics/profile', authenticateToken, analytics.getLearningProfile);
router.get('/analytics/peers', authenticateToken, analytics.getPeers);
router.get('/analytics/model', authenticateToken, analytics.getModel);
router.post('/analytics/model/refit', authenticateToken, adminAuth, analytics.refitModel);

// ─── Engagement ───
router.get('/engagement/daily', authenticateToken, engagement.getDaily);
router.get('/engagement/achievements', authenticateToken, engagement.getAchievements);
router.get('/engagement/streak', authenticateToken, engagement.getStreak);
router.get('/engagement/bookmarks', authenticateToken, engagement.getBookmarks);
router.post('/engagement/bookmarks/:problemId', authenticateToken, engagement.toggleBookmark);
router.get('/engagement/editorial/:problemId', authenticateToken, engagement.getEditorial);
router.get('/engagement/ai-status', authenticateToken, engagement.getAiStatus);

module.exports = router;
