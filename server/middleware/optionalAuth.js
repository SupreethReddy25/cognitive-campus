const jwt = require('jsonwebtoken');

/**
 * Optional JWT middleware.
 * If a valid Bearer token is present, attaches decoded user to req.user.
 * If missing or invalid, continues without blocking the request.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role || 'student' };
    } catch {
      // Invalid token — treat as unauthenticated, don't block
      req.user = null;
    }
  }
  next();
};

module.exports = optionalAuth;
