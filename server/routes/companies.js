const express = require('express');
const authenticateToken = require('../middleware/auth');
const {
  getCompanies,
  getCompany,
  getCompanyStats,
  getRelatedProblems,
  generatePrepPlan
} = require('../controllers/companyController');
const { getCompanyExperiences } = require('../controllers/experienceController');

const router = express.Router();

router.route('/').get(getCompanies);
router.route('/:slug').get(getCompany);
router.route('/:slug/experiences').get(getCompanyExperiences);
router.route('/:slug/stats').get(getCompanyStats);
router.route('/:slug/related-problems').get(getRelatedProblems);
router.route('/:slug/prep-plan').post(authenticateToken, generatePrepPlan);

module.exports = router;
