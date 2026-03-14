/**
 * Rate Limiter Middleware
 *
 * Provides three express-rate-limit instances for different API zones.
 *
 * @module rateLimiter
 */

const rateLimit = require('express-rate-limit');

/**
 * Auth rate limiter — applied to register and login endpoints.
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Submission rate limiter — applied to code submission endpoint.
 * 30 requests per 10 minutes per IP.
 */
const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Submission rate limit reached. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General rate limiter — applied globally to all /api routes.
 * 100 requests per 1 minute per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, submissionLimiter, generalLimiter };
