/**
 * Admin Authorization Middleware
 *
 * Must run AFTER authenticateToken middleware.
 * Checks that the authenticated user has admin role.
 *
 * @module adminAuth
 */

const { sendError } = require('../utils/responseHelper');
const User = require('../models/User');

/**
 * Verifies admin privileges against the DATABASE (not just the JWT claim) so promotions
 * and demotions take effect immediately without forcing a re-login.
 *
 * @param {import('express').Request} req - Express request with req.user set by authenticateToken
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user?.userId) return sendError(res, 'Admin access required.', 403);
    const user = await User.findById(req.user.userId).select('role').lean();
    if (!user || user.role !== 'admin') return sendError(res, 'Admin access required.', 403);
    req.user.role = 'admin';
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminAuth;
