const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getProblems, getProblemById } = require('../controllers/problemController');

const router = express.Router();

// GET /api/problems — List active problems with optional filters
router.get('/', authenticateToken, getProblems);

// GET /api/problems/:id — Get a single problem with masked hidden test cases
router.get('/:id', authenticateToken, getProblemById);

module.exports = router;
