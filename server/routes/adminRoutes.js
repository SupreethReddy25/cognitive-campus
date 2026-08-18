const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { getAllStudents, getSkillHeatmap, getDashboardStats } = require('../controllers/adminController');
const {
  createCollege,
  createPlacementRecord,
  verifyExperience
} = require('../controllers/collegeController');

const router = express.Router();

// GET /api/admin/students — Get all students with mastery data
router.get('/students', authenticateToken, adminAuth, getAllStudents);

// GET /api/admin/heatmap — Get cohort-level skill mastery heatmap
router.get('/heatmap', authenticateToken, adminAuth, getSkillHeatmap);

// GET /api/admin/stats — Get admin dashboard stats
router.get('/stats', authenticateToken, adminAuth, getDashboardStats);

// POST /api/admin/colleges — Create a new college (admin only)
router.post('/colleges', authenticateToken, adminAuth, createCollege);

// POST /api/admin/placement-records — Add a structured placement record
router.post('/placement-records', authenticateToken, adminAuth, createPlacementRecord);

// PATCH /api/admin/experiences/:id/verify — Verify or reject an experience
router.patch('/experiences/:id/verify', authenticateToken, adminAuth, verifyExperience);

// ─── New admin routes ─────────────────────────────────────────────────────────

// GET /api/admin/experiences — All experiences (for review)
router.get('/experiences', authenticateToken, adminAuth, async (req, res) => {
  try {
    const InterviewExperience = require('../models/InterviewExperience');
    const { status = 'Published', limit = 50, skip = 0 } = req.query;
    const filter = status === 'all' ? {} : { status };
    const [experiences, total] = await Promise.all([
      InterviewExperience.find(filter)
        .populate('companyId', 'name slug tier')
        .populate('userId', 'name email')
        .populate('collegeId', 'name shortName')
        .sort({ createdAt: -1 })
        .limit(+limit)
        .skip(+skip)
        .lean(),
      InterviewExperience.countDocuments(filter)
    ]);
    return res.json({ success: true, data: experiences, total });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/problems/:id/status — Change problem status (quarantine→waitlisted→approved)
router.patch('/problems/:id/status', authenticateToken, adminAuth, async (req, res) => {
  try {
    const Problem = require('../models/Problem');
    const { status } = req.body;
    const valid = ['quarantine', 'waitlisted', 'approved'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be one of: ' + valid.join(', ') });
    }
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { status, isActive: status === 'approved' },
      { new: true }
    );
    if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });
    return res.json({ success: true, data: problem });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/problems — All problems including quarantine/waitlisted
router.get('/problems', authenticateToken, adminAuth, async (req, res) => {
  try {
    const Problem = require('../models/Problem');
    const { status = 'all', limit = 50 } = req.query;
    const filter = status === 'all' ? {} : { status };
    const problems = await Problem.find(filter)
      .populate('skillId', 'name')
      .select('title difficulty status isActive skillId company round createdAt upvotes downvotes')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .lean();
    return res.json({ success: true, data: problems });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/users/:id/role — Promote/demote user role
router.patch('/users/:id/role', authenticateToken, adminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'role must be student or admin' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: 'name email role xp level createdAt' }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
