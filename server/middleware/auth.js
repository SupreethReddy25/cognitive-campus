const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHelper');

/**
 * JWT authentication middleware.
 * Extracts Bearer token from the Authorization header,
 * verifies it, and attaches decoded { userId, email, role } to req.user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No token.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role || 'student' };
    next();
  } catch (error) {
    return sendError(res, 'Invalid token.', 401);
  }
};

module.exports = authenticateToken;
