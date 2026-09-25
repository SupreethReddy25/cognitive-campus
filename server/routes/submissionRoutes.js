const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiter');
const { createSubmission, getHistory, getRuntimes } = require('../controllers/submissionController');

const router = express.Router();

// POST /api/submissions — Submit code for a problem
router.post(
  '/',
  [
    authenticateToken,
    submissionLimiter,
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
    body('language')
      .optional()
      .isIn(['javascript', 'python', 'java', 'cpp'])
      .withMessage('Unsupported language'),
    validate
  ],
  createSubmission
);

// GET /api/submissions/runtimes — which languages can execute (piston / local runner)
router.get('/runtimes', authenticateToken, getRuntimes);

// GET /api/submissions/history — Get paginated submission history (all problems)
router.get('/history', authenticateToken, getHistory);

// GET /api/submissions/recent/:problemId — Get recent submissions for a specific problem
router.get('/recent/:problemId', authenticateToken, require('../controllers/submissionController').getRecentSubmissions);

// POST /api/submissions/run — Execute code without saving mastery/xp (for custom runs and testing)
router.post(
  '/run',
  [
    authenticateToken,
    submissionLimiter,
    body('problemId').notEmpty().isMongoId(),
    body('code').notEmpty().isString(),
    validate
  ],
  require('../controllers/submissionController').runCode
);

module.exports = router;
