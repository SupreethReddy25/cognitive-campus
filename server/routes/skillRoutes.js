const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getAllSkills, getUserSkillStates } = require('../controllers/skillController');

const router = express.Router();

// GET /api/skills — Get all skills with prerequisites
router.get('/', authenticateToken, getAllSkills);

// GET /api/skills/my-states — Get user's skill mastery states
router.get('/my-states', authenticateToken, getUserSkillStates);

module.exports = router;
