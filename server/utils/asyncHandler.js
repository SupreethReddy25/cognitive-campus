/**
 * Wraps an async route handler so a rejected promise reaches the global error handler.
 * Removes the try/catch-and-`next(error)` boilerplate from controllers.
 *
 * @param {Function} fn - `(req, res, next) => Promise`
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
