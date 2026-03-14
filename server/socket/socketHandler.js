/**
 * Socket.io Handler
 *
 * Sets up all real-time communication for the Cognitive Campus platform.
 * Provides targeted room-based notifications and broadcast events.
 *
 * @module socketHandler
 */

const logger = require('../utils/logger');

/**
 * Initialises Socket.io connection handling.
 * Sets up join:user room subscriptions and logging.
 *
 * @param {import('socket.io').Server} io - The Socket.io server instance
 * @returns {import('socket.io').Server} The io instance
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client sends { userId } to join their private room
    socket.on('join:user', ({ userId }) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emits an XP update event to ALL connected clients (for live leaderboard feed).
 *
 * @param {import('socket.io').Server} io - The Socket.io server instance
 * @param {object} payload - XP update data
 * @param {string} payload.userId - User who earned XP
 * @param {string} payload.userName - Display name
 * @param {number} payload.xpEarned - Amount of XP earned
 * @param {number} payload.newXP - User's new total XP
 * @param {number} payload.newLevel - User's new level
 * @param {number} payload.newStreak - User's updated streak
 */
const emitXPUpdate = (io, { userId, userName, xpEarned, newXP, newLevel, newStreak }) => {
  if (!io) return;
  io.emit('xp:update', { userId, userName, xpEarned, newXP, newLevel, newStreak });
};

/**
 * Emits a leaderboard refresh signal to ALL clients.
 * No payload — the frontend should refetch the leaderboard data.
 *
 * @param {import('socket.io').Server} io - The Socket.io server instance
 */
const emitLeaderboardUpdate = (io) => {
  if (!io) return;
  io.emit('leaderboard:refresh');
};

/**
 * Emits a skill unlocked notification to a specific user's private room.
 *
 * @param {import('socket.io').Server} io - The Socket.io server instance
 * @param {string} userId - The userId whose room to target
 * @param {object} payload - Skill unlock data
 * @param {string} payload.skillName - Name of the unlocked skill
 * @param {number} payload.newMasteryP - Mastery that triggered the unlock
 */
const emitSkillUnlocked = (io, userId, { skillName, newMasteryP }) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('skill:unlocked', { skillName, newMasteryP });
};

module.exports = { initSocket, emitXPUpdate, emitLeaderboardUpdate, emitSkillUnlocked };
