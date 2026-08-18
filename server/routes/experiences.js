const express = require('express');
const { createExperience, parseRawDump, getCompanyExperiences, upvoteExperience } = require('../controllers/experienceController');
const authenticateToken = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // Enable merging params for nested routes

// Direct routes
router.route('/').post(createExperience); // Maybe protect this later, keeping public/semi-public for ease
router.route('/ai-parse').post(parseRawDump);
router.route('/:id/upvote').post(upvoteExperience);

// This handles the nested route from companies (e.g. /api/companies/:slug/experiences)
// We need a separate router or handle it in the company route, actually let's just export getCompanyExperiences for the company router.

module.exports = router;
