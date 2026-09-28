/**
 * Database connection with retry and exponential back-off.
 *
 * Throws once the attempts are exhausted; deciding to exit the process is the bootstrap's job, not a utility's.
 *
 * @module connectDB
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {string} uri - MongoDB connection string
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (uri = process.env.MONGO_URI) => {
  mongoose.set('strictQuery', true);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      logger.info(`MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
      logger.info('MongoDB connected successfully');
      return mongoose;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt} failed`, { error: error.message });
      if (attempt === MAX_ATTEMPTS) throw new Error(`Could not connect to MongoDB after ${MAX_ATTEMPTS} attempts: ${error.message}`, { cause: error });
      const wait = BASE_DELAY_MS * 2 ** (attempt - 1);
      logger.info(`Retrying in ${wait / 1000}s...`);
      await delay(wait);
    }
  }
  return mongoose;
};

module.exports = connectDB;
