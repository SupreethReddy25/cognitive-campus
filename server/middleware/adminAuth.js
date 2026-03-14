/**
 * Admin Authorization Middleware
 *
 * Must run AFTER authenticateToken middleware.
 * Checks that the authenticated user has admin role.
 *
 * @module adminAuth
 */

const { sendError } = require('../utils/responseHelper');

/**
 * Verifies that the authenticated user has admin privileges.
 *
 * @param {import('express').Request} req - Express request with req.user set by authenticateToken
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Admin access required.', 403);
  }
  next();
};

module.exports = adminAuth;
