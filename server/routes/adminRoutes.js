const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { getAllStudents, getSkillHeatmap, getDashboardStats } = require('../controllers/adminController');

const router = express.Router();

// GET /api/admin/students — Get all students with mastery data
router.get('/students', authenticateToken, adminAuth, getAllStudents);

// GET /api/admin/heatmap — Get cohort-level skill mastery heatmap
router.get('/heatmap', authenticateToken, adminAuth, getSkillHeatmap);

// GET /api/admin/stats — Get admin dashboard stats
router.get('/stats', authenticateToken, adminAuth, getDashboardStats);

module.exports = router;
