const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getProblems, getProblemById, getAiNudge, proposeProblem } = require('../controllers/problemController');

const router = express.Router();

// GET /api/problems — List active, approved problems with optional filters
router.get('/', authenticateToken, getProblems);

// POST /api/problems/propose — Intel Engine: propose a problem from raw interview memory
router.post('/propose', authenticateToken, proposeProblem);

// GET /api/problems/:id — Get a single problem with masked hidden test cases
router.get('/:id', authenticateToken, getProblemById);

// POST /api/problems/:id/nudge — Call Gemini AI mentor for a dynamic code hint
router.post('/:id/nudge', authenticateToken, getAiNudge);

module.exports = router;
