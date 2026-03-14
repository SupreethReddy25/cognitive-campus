const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * Catches common Mongoose, JWT, and application errors and returns
 * a consistent { success: false, message } response shape.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });

  // Mongoose validation error → 400 with field-level messages
  if (err.name === 'ValidationError') {
    const fieldErrors = Object.values(err.errors).map((fieldErr) => ({
      field: fieldErr.path,
      message: fieldErr.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: fieldErrors
    });
  }

  // Mongoose CastError (invalid ObjectId) → 404
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired.'
    });
  }

  // MongoDB duplicate key error → 409
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue).join(', ');
    return res.status(409).json({
      success: false,
      message: `${duplicateField} already exists`
    });
  }

  // All other errors → 500
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(err.statusCode || 500).json(response);
};

module.exports = errorHandler;
