/**
 * Database Connection Utility
 *
 * Establishes a MongoDB connection with retry logic.
 * Attempts up to 3 connections with a 5-second delay between retries.
 * Logs each attempt via Winston and exits on total failure.
 *
 * @module connectDB
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Waits for the specified number of milliseconds.
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MongoDB with retry logic.
 * Tries up to MAX_RETRIES times with RETRY_DELAY_MS between attempts.
 * Exits the process after all attempts are exhausted.
 *
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`MongoDB connection attempt ${attempt}/${MAX_RETRIES}`);
      await mongoose.connect(process.env.MONGO_URI);
      logger.info('MongoDB connected successfully');
      return;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt} failed`, {
        error: error.message
      });

      if (attempt === MAX_RETRIES) {
        logger.error('All MongoDB connection attempts exhausted — exiting');
        process.exit(1);
      }

      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await delay(RETRY_DELAY_MS);
    }
  }
};

module.exports = connectDB;
