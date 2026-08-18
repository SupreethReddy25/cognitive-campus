const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getProblems, getProblemById, getAiNudge, proposeProblem, getReviewQueue, voteProblem } = require('../controllers/problemController');

const router = express.Router();

// GET /api/problems — List active, approved problems with optional filters
router.get('/', authenticateToken, getProblems);

// GET /api/problems/review-queue — Get waitlisted problems
router.get('/review-queue', authenticateToken, getReviewQueue);

// POST /api/problems/propose — Intel Engine: propose a problem from raw interview memory
router.post('/propose', authenticateToken, proposeProblem);

// GET /api/problems/:id — Get a single problem with masked hidden test cases
router.get('/:id', authenticateToken, getProblemById);

// POST /api/problems/:id/vote — Vote on a waitlisted problem
router.post('/:id/vote', authenticateToken, voteProblem);

// POST /api/problems/:id/nudge — Call Gemini AI mentor for a dynamic code hint
router.post('/:id/nudge', authenticateToken, getAiNudge);

module.exports = router;
