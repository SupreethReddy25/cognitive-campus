const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const { createSubmission, getHistory } = require('../controllers/submissionController');

const router = express.Router();

// POST /api/submissions — Submit code for a problem
router.post(
  '/',
  [
    authenticateToken,
    body('problemId')
      .notEmpty()
      .withMessage('Problem ID is required')
      .isMongoId()
      .withMessage('Invalid problem ID format'),
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isString()
      .withMessage('Code must be a string'),
    validate
  ],
  createSubmission
);

// GET /api/submissions/history — Get paginated submission history
router.get('/history', authenticateToken, getHistory);

module.exports = router;
