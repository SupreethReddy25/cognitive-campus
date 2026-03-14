/**
 * Response Helper
 *
 * Centralised response utilities ensuring 100% consistent response shapes.
 *
 * @module responseHelper
 */

/**
 * Sends a success response with the standard { success: true, data } shape.
 *
 * @param {import('express').Response} res - Express response object
 * @param {object} data - The data payload to include in the response
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {import('express').Response} The Express response
 */
const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

/**
 * Sends an error response with the standard { success: false, message } shape.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} message - The error message
 * @param {number} [statusCode=400] - HTTP status code
 * @returns {import('express').Response} The Express response
 */
const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
