const express = require('express');
const { createExperience, parseRawDump, upvoteExperience, voteExperience, scoreDraft } = require('../controllers/experienceController');
const authenticateToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router({ mergeParams: true });

router.route('/').post(authenticateToken, createExperience);
router.route('/ai-parse').post(optionalAuth, aiLimiter, parseRawDump);
router.route('/score').post(scoreDraft);
router.route('/:id/upvote').post(authenticateToken, upvoteExperience);
router.route('/:id/vote').post(authenticateToken, voteExperience);

// The nested route /api/companies/:slug/experiences is served by the company router.
module.exports = router;
