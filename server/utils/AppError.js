/**
 * An error the client is allowed to see. Throw it from a controller or service and the global error handler turns it into
 * `{ success: false, message }` with the right status code; anything else is treated as a bug and reported as a 500.
 */
class AppError extends Error {
  /**
   * @param {string} message - Safe-to-show explanation
   * @param {number} [statusCode=400] - HTTP status
   * @param {object} [details] - Optional machine-readable extras (e.g. field errors)
   */
  constructor(message, statusCode = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = AppError;
