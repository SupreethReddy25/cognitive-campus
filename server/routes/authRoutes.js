const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, getMe } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    authLimiter,
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validate
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    authLimiter,
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate
  ],
  login
);

// GET /api/auth/me
router.get('/me', authenticateToken, getMe);

module.exports = router;
