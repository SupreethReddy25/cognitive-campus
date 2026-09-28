const logger = require('../utils/logger');

/**
 * Translates an error into `{ success: false, message }`.
 *
 * Known failures (validation, bad ids, bad tokens, duplicates, malformed bodies, `AppError`) get a precise 4xx. Everything
 * else is a bug: it is logged in full but, in production, the client only sees a generic message.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const send = (status, message, extra = {}) => res.status(status).json({ success: false, message, requestId: req.id, ...extra });
  const logMeta = { requestId: req.id, path: req.originalUrl, method: req.method, userId: req.user?.userId };

  if (res.headersSent) return next(err);

  // errors the API raises on purpose
  if (err.isOperational) {
    logger.warn(err.message, logMeta);
    return send(err.statusCode || 400, err.message, err.details ? { errors: err.details } : {});
  }

  // Mongoose schema validation → 400 with field-level messages
  if (err.name === 'ValidationError' && err.errors) {
    logger.warn('Validation failed', { ...logMeta, fields: Object.keys(err.errors) });
    return send(400, 'Validation failed', { errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })) });
  }

  // invalid ObjectId
  if (err.name === 'CastError') return send(404, 'Resource not found');

  if (err.name === 'JsonWebTokenError') return send(401, 'Invalid token.');
  if (err.name === 'TokenExpiredError') return send(401, 'Token has expired.');

  // unique index violation
  if (err.code === 11000) return send(409, `${Object.keys(err.keyValue || {}).join(', ') || 'Value'} already exists`);

  // body-parser: unparseable or oversized JSON
  if (err.type === 'entity.parse.failed') return send(400, 'Malformed JSON body');
  if (err.type === 'entity.too.large') return send(413, 'Request body too large');

  // anything else is a bug
  logger.error(err.message, { ...logMeta, stack: err.stack });
  const status = err.statusCode || err.status || 500;
  if (status < 500) return send(status, err.message);
  const body = { message: isProd ? 'Internal server error' : err.message || 'Internal server error' };
  return send(500, body.message, isProd ? {} : { stack: err.stack });
};

module.exports = errorHandler;
