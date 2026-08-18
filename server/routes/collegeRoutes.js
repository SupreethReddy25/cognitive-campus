const express = require('express');
const authenticateToken = require('../middleware/auth');
const {
  getColleges,
  getCollege,
  getCollegeDashboard,
  getCollegeCompanyIntel
} = require('../controllers/collegeController');

const router = express.Router();

// Public routes — no auth needed for browse/search
router.get('/', getColleges);
router.get('/:slug', getCollege);

// Protected — requires auth so BKT data can be merged into prep priorities
router.get('/:slug/dashboard', authenticateToken, getCollegeDashboard);
router.get('/:slug/companies/:companySlug', authenticateToken, getCollegeCompanyIntel);

module.exports = router;
