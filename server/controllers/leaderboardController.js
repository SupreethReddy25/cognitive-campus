/**
 * Leaderboard Controller
 *
 * Provides global leaderboard with Redis caching and per-user rank insertion.
 * If Redis is unavailable or throws, silently falls back to MongoDB.
 *
 * @module leaderboardController
 */

const Redis = require('ioredis');
const User = require('../models/User');
const SkillState = require('../models/SkillState');
const { sendSuccess } = require('../utils/responseHelper');
const logger = require('../utils/logger');

let redis = null;
let redisReady = false;

/**
 * Gets the Redis client, creating it lazily to handle environments without Redis.
 * Tracks connection readiness so callers don't attempt operations on a broken client.
 *
 * @returns {object|null} Redis client instance or null if unavailable
 */
const getRedisClient = () => {
  if (redis && redisReady) return redis;
  if (redis) return null; // connection pending or failed

  try {
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        lazyConnect: true
      });

      redis.on('ready', () => {
        redisReady = true;
        logger.info('Redis connected for leaderboard cache');
      });

      redis.on('error', (err) => {
        logger.warn('Redis error — leaderboard will use MongoDB fallback', { error: err.message });
        redisReady = false;
      });

      redis.on('close', () => {
        redisReady = false;
      });

      redis.connect().catch((err) => {
        logger.warn('Redis connect failed — using MongoDB fallback', { error: err.message });
        redisReady = false;
      });
    }
  } catch (error) {
    logger.warn('Redis initialization failed — using MongoDB fallback', { error: error.message });
    redis = null;
    redisReady = false;
  }

  return null; // not ready on first call — will be ready on subsequent calls
};

/**
 * @desc    Get the global leaderboard (top 50 users by XP).
 *          Checks Redis cache first (60s TTL). If cache miss or Redis unavailable,
 *          queries MongoDB, counts mastered skills, and caches the result.
 *          Always appends the requesting user's own rank if not already in top 50.
 * @route   GET /api/leaderboard
 * @access  Protected
 * @param   {import('express').Request} req - Express request with req.user set by auth middleware
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cacheKey = 'leaderboard:top50';
    const redisClient = getRedisClient();

    // ─── Try Redis cache ───
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const leaderboard = JSON.parse(cachedData);
          const userInTop = leaderboard.find((entry) => entry.userId === userId);

          if (!userInTop) {
            const userRank = await getUserRank(userId);
            if (userRank) {
              leaderboard.push(userRank);
            }
          } else {
            userInTop.isCurrentUser = true;
          }

          return sendSuccess(res, { leaderboard, cached: true });
        }
      } catch (cacheError) {
        logger.warn('Redis cache read failed — falling back to MongoDB', {
          error: cacheError.message
        });
        // Fall through to MongoDB query below
      }
    }

    // ─── MongoDB fallback ───
    const topUsers = await User.find({})
      .select('-passwordHash')
      .sort({ xp: -1 })
      .limit(50);

    // Build leaderboard even if only 1 user exists
    const leaderboard = await Promise.all(
      topUsers.map(async (user, index) => {
        const masteredCount = await SkillState.countDocuments({
          userId: user._id,
          isMastered: true
        });

        return {
          rank: index + 1,
          userId: user._id.toString(),
          name: user.name,
          level: user.level,
          xp: user.xp,
          skillsMastered: masteredCount,
          isCurrentUser: user._id.toString() === userId
        };
      })
    );

    // ─── Try to cache the result ───
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(leaderboard), 'EX', 60);
      } catch (cacheError) {
        logger.warn('Redis cache write failed — result not cached', {
          error: cacheError.message
        });
      }
    }

    // Add requesting user's rank if not in top 50
    const userInTop = leaderboard.find((entry) => entry.userId === userId);
    if (!userInTop) {
      const userRank = await getUserRank(userId);
      if (userRank) {
        leaderboard.push(userRank);
      }
    }

    return sendSuccess(res, { leaderboard, cached: false });
  } catch (error) {
    next(error);
  }
};

/**
 * Computes the rank for a specific user by counting how many users have higher XP.
 *
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {Promise<object|null>} The user's leaderboard entry, or null if not found
 */
const getUserRank = async (userId) => {
  try {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return null;

    const usersAbove = await User.countDocuments({ xp: { $gt: user.xp } });
    const masteredCount = await SkillState.countDocuments({ userId, isMastered: true });

    return {
      rank: usersAbove + 1,
      userId: user._id.toString(),
      name: user.name,
      level: user.level,
      xp: user.xp,
      skillsMastered: masteredCount,
      isCurrentUser: true
    };
  } catch (error) {
    logger.error('getUserRank error', { error: error.message, userId });
    return null;
  }
};

module.exports = { getLeaderboard };
