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
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
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
  max: 120,
  message: { success: false, message: 'Submission rate limit reached. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General rate limiter — applied globally to all /api routes.
 * 500 requests per 1 minute per IP (raised to prevent dashboard load from hitting limits).
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * AI limiter — protects the (metered) LLM endpoints: 12 requests per minute per IP.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { success: false, message: 'Too many AI requests. Give it a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, submissionLimiter, generalLimiter, aiLimiter };
