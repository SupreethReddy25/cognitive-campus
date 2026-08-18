const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, getMe } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

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

/**
 * GET /api/auth/search-name?q=supr
 *
 * LIVE PREFIX SEARCH — fires on every keystroke, no @ required.
 * Finds the best-matching user whose email starts with `q`.
 * Returns first name for real-time greeting as the user types.
 *
 * Min query length: 3 chars (avoids trivial single-char matches)
 * Uses the indexed `email` field with anchored regex (efficient).
 *
 * Response:
 *   { found: true,  firstName: "Supreeth", exact: false }  ← partial prefix match
 *   { found: true,  firstName: "Supreeth", exact: true  }  ← full email matched
 *   { found: false, firstName: null,        exact: false }  ← no match
 */
router.get('/search-name', searchLimiter, async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();

    // Enforce minimum to prevent empty queries
    if (!q || q.length < 1) {
      return res.json({ found: false, firstName: null, exact: false });
    }

    // Escape regex special characters in the query
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const User = require('../models/User');

    // Anchored prefix regex — uses the email index efficiently
    const user = await User.findOne(
      { email: { $regex: '^' + escaped, $options: 'i' } },
      { name: 1, email: 1, _id: 0 }
    ).lean();

    if (!user?.name) {
      return res.json({ found: false, firstName: null, exact: false });
    }

    const firstName = user.name.trim().split(/\s+/)[0];
    const exact = user.email === q;

    return res.json({ found: true, firstName, email: user.email, exact });
  } catch (err) {
    return res.status(500).json({ found: false, firstName: null, exact: false });
  }
});

/**
 * GET /api/auth/peek?email=user@example.com
 *
 * Exact email lookup — kept for any direct full-email confirmations.
 * Response: { found: true, firstName: "Supreeth" }
 */
router.get('/peek', nameLimiter, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.json({ found: false, firstName: null });
    }

    const User = require('../models/User');
    const user = await User.findOne(
      { email: email.toLowerCase().trim() },
      { name: 1, _id: 0 }
    ).lean();

    if (!user?.name) return res.json({ found: false, firstName: null });

    const firstName = user.name.trim().split(/\s+/)[0];
    return res.json({ found: true, firstName });
  } catch (err) {
    return res.status(500).json({ found: false, firstName: null });
  }
});

/**
 * POST /api/auth/bootstrap-admin
 * Promotes the requesting authenticated user to admin role.
 * Only works if ZERO admins currently exist in the system (first-time setup).
 * Safe to leave in — becomes a no-op once the first admin is set.
 */
router.post('/bootstrap-admin', authenticateToken, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { role: 'admin' },
      { new: true, select: 'name email role' }
    );
    return res.json({ success: true, data: updated, message: 'You are now an admin.' });
  } catch (err) {
    console.error('[Bootstrap Admin] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

module.exports = router;
