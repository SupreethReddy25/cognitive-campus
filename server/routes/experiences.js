const express = require('express');
const { createExperience, parseRawDump, upvoteExperience, voteExperience, scoreDraft, getPulse, getMine, deleteMine } = require('../controllers/experienceController');
const authenticateToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { aiLimiter, writeLimiter } = require('../middleware/rateLimiter');

const router = express.Router({ mergeParams: true });

router.route('/').post(authenticateToken, writeLimiter, createExperience);
router.route('/pulse').get(getPulse);
router.route('/mine').get(authenticateToken, getMine);
router.route('/ai-parse').post(optionalAuth, aiLimiter, parseRawDump);
router.route('/score').post(scoreDraft);
router.route('/:id/upvote').post(authenticateToken, upvoteExperience);
router.route('/:id/vote').post(authenticateToken, voteExperience);
router.route('/:id').delete(authenticateToken, deleteMine);

// The nested route /api/companies/:slug/experiences is served by the company router.
module.exports = router;
