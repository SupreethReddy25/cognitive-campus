const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, getMe, searchName, peek, bootstrapAdmin } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Strict limiter for login/register (brute-force protection)
// nameLimiter for public read-only name endpoints
const nameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,              // 60/min — enough for peek (full-email lookups)
  standardHeaders: true,
  legacyHeaders: false,
  message: { found: false, firstName: null },
});

// More generous limiter for live-search (fires on every keystroke)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,             // 240/min ≈ 4 keystrokes/sec sustained — comfortable
  standardHeaders: true,
  legacyHeaders: false,
  message: { found: false, firstName: null, exact: false },
});

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
      .trim()
      .customSanitizer(value => value.toLowerCase())
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
      .trim()
      .customSanitizer(value => value.toLowerCase())
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

// GET /api/auth/search-name?q=supr — live first-name greeting while the email is typed
router.get('/search-name', searchLimiter, searchName);

// GET /api/auth/peek?email=… — exact-email variant
router.get('/peek', nameLimiter, peek);

// POST /api/auth/bootstrap-admin — first-time setup / dev convenience (see controller)
router.post('/bootstrap-admin', authenticateToken, bootstrapAdmin);

module.exports = router;
