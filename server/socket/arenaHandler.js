/**
 * Arena Socket Handler — /arena namespace
 *
 * Manages real-time multiplayer rooms for Versus and Co-op coding modes.
 * Runs on a dedicated Socket.io namespace to isolate from single-player events.
 *
 * Room lifecycle: create → join → start → progress → finish
 * Strict 2-player cap per room.
 *
 * @module arenaHandler
 */

const logger = require('../utils/logger');
const crypto = require('crypto');

// ─── In-Memory Room Store ───────────────────────────────────
// Production: migrate to Redis. For MVP, memory is fine for <100 concurrent rooms.
const rooms = new Map();

/**
 * Generate a 6-character alphanumeric room code.
 * Retries if collision detected.
 */
function generateRoomCode() {
  let code;
  do {
    code = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F1B2"
  } while (rooms.has(code));
  return code;
}

/**
 * Build a sanitized room snapshot for client consumption.
 */
function roomSnapshot(room) {
  return {
    code: room.code,
    mode: room.mode,
    problemId: room.problemId,
    status: room.status,
    hostId: room.hostId,
    players: Array.from(room.players.values()).map(p => ({
      userId: p.userId,
      name: p.name,
      progress: p.progress,
      totalTests: p.totalTests,
      finished: p.finished
    })),
    createdAt: room.createdAt
  };
}

/**
 * Initialise the Arena socket namespace.
 * Attaches all room management events to the /arena namespace.
 *
 * @param {import('socket.io').Server} io - The Socket.io server instance
 */
const initArenaSocket = (io) => {
  const arena = io.of('/arena');

  arena.on('connection', (socket) => {
    logger.info(`[Arena] Socket connected: ${socket.id}`);

    // ─── CREATE ROOM ──────────────────────────────────
    socket.on('arena:create', ({ userId, name, mode, problemId }) => {
      if (!userId || !mode || !problemId) {
        return socket.emit('arena:error', { message: 'Missing required fields: userId, mode, problemId' });
      }

      const code = generateRoomCode();
      const room = {
        code,
        hostId: userId,
        mode,         // 'versus' | 'coop-shared' | 'coop-split'
        problemId,
        status: 'waiting',
        players: new Map(),
        // Yjs document state — binary Uint8Array snapshots relayed via socket
        yjsState: null,
        createdAt: new Date()
      };

      // Add host as first player
      room.players.set(socket.id, {
        userId,
        name: name || 'Player 1',
        socketId: socket.id,
        progress: 0,
        totalTests: 0,
        code: '',
        finished: false
      });

      rooms.set(code, room);
      socket.join(`arena:${code}`);
      socket.arenaRoom = code;

      logger.info(`[Arena] Room ${code} created by ${name} (${userId}). Mode: ${mode}`);
      socket.emit('arena:room_created', { code, room: roomSnapshot(room) });
    });

    // ─── JOIN ROOM ────────────────────────────────────
    socket.on('arena:join', ({ userId, name, code }) => {
      const roomCode = code?.toUpperCase();
      const room = rooms.get(roomCode);

      if (!room) {
        return socket.emit('arena:error', { message: `Room "${roomCode}" not found.` });
      }
      if (room.status !== 'waiting') {
        return socket.emit('arena:error', { message: 'Match already in progress.' });
      }
      if (room.players.size >= 2) {
        return socket.emit('arena:error', { message: 'Room is full (2/2).' });
      }

      // Check duplicate user
      for (const p of room.players.values()) {
        if (p.userId === userId) {
          return socket.emit('arena:error', { message: 'You are already in this room.' });
        }
      }

      room.players.set(socket.id, {
        userId,
        name: name || 'Player 2',
        socketId: socket.id,
        progress: 0,
        totalTests: 0,
        code: '',
        finished: false
      });

      socket.join(`arena:${roomCode}`);
      socket.arenaRoom = roomCode;

      logger.info(`[Arena] ${name} (${userId}) joined room ${roomCode}`);

      // Notify the joining player directly
      socket.emit('arena:join_success', { code: roomCode, room: roomSnapshot(room) });

      // Notify everyone in the room
      arena.to(`arena:${roomCode}`).emit('arena:player_joined', {
        room: roomSnapshot(room),
        newPlayer: { userId, name }
      });
    });

    // ─── START MATCH ──────────────────────────────────
    socket.on('arena:start_match', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('arena:error', { message: 'Room not found.' });
      
      // Only host can start
      const player = room.players.get(socket.id);
      if (!player || player.userId !== room.hostId) {
        return socket.emit('arena:error', { message: 'Only the host can start the match.' });
      }
      if (room.players.size < 2) {
        return socket.emit('arena:error', { message: 'Need 2 players to start.' });
      }

      room.status = 'active';
      room.startedAt = new Date();

      logger.info(`[Arena] Match started in room ${roomId}. Mode: ${room.mode}`);
      arena.to(`arena:${roomId}`).emit('arena:match_started', { roomId });
    });

    // ─── CODE SYNC (Co-op & Split) ────────────────────
    // Adapted from prototype: socket.to(roomId).emit('code-update', code)
    // with isRemoteChange guard pattern
    socket.on('arena:code_sync', ({ roomId, code }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Store code for the player
      player.code = code;

      if (room.mode === 'coop-shared' || room.mode === 'coop-split') {
        // Broadcast to partner (they see it in read-only pane or shared doc)
        socket.to(`arena:${roomId}`).emit('arena:code_update', {
          code,
          fromUserId: player.userId,
          fromName: player.name
        });
      }
      // Versus mode: code is stored but NOT broadcast (blind competition)
    });

    // ─── CURSOR SYNC ──────────────────────────────────
    // Extracted from prototype: cursor-move → { roomId, username, position }
    // with deltaDecorations + ContentWidget on client side
    socket.on('arena:cursor', ({ roomId, position, selection }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Only relay cursors in co-op modes
      if (room.mode === 'coop-shared' || room.mode === 'coop-split') {
        socket.to(`arena:${roomId}`).emit('arena:cursor_update', {
          userId: player.userId,
          name: player.name,
          position,
          selection
        });
      }
    });

    // ─── UNIFIED Yjs SYNC RELAY (primary channel) ─────
    // Transparent binary pipe: relay Yjs updates to all other clients in the room.
    // Uses socket.arenaRoom (set during join) so no roomId param needed.
    socket.on('arena:sync_update', ({ update }) => {
      const roomId = socket.arenaRoom;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      // Broadcast to everyone else in the room — transparent pipe
      socket.to(`arena:${roomId}`).emit('arena:sync_update', { update });
    });

    // ─── Legacy Yjs CRDT Update Relay ────────────────────────
    socket.on('arena:yjs_update', ({ roomId, update }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.to(`arena:${roomId}`).emit('arena:yjs_update', { update });
    });

    // ─── Yjs Awareness Update (cursor position, selection) ───
    socket.on('arena:yjs_awareness', ({ roomId, update }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.to(`arena:${roomId}`).emit('arena:yjs_awareness', { update });
    });

    // ─── TEST CASE PASSED ─────────────────────────────
    socket.on('arena:test_passed', ({ roomId, testIndex, total }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.progress = testIndex + 1;
      player.totalTests = total;

      logger.info(`[Arena] Room ${roomId}: ${player.name} passed test ${testIndex + 1}/${total}`);

      // Broadcast progress to ALL in room (even in versus — they see the bar, not the code)
      arena.to(`arena:${roomId}`).emit('arena:progress_update', {
        userId: player.userId,
        name: player.name,
        progress: player.progress,
        total: player.totalTests
      });
    });

    // ─── SUBMISSION COMPLETE ──────────────────────────
    socket.on('arena:submitted', ({ roomId, passed, total, allPassed }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.finished = true;
      player.progress = passed;
      player.totalTests = total;

      logger.info(`[Arena] Room ${roomId}: ${player.name} submitted. ${passed}/${total} passed.`);

      arena.to(`arena:${roomId}`).emit('arena:submission_update', {
        userId: player.userId,
        name: player.name,
        passed,
        total,
        allPassed: !!allPassed
      });

      // Check if match is over
      const players = Array.from(room.players.values());
      const allFinished = players.every(p => p.finished);
      const anyAced = players.find(p => p.finished && p.progress === p.totalTests);

      if (allFinished || (room.mode === 'versus' && anyAced)) {
        room.status = 'finished';
        const winner = players.reduce((best, p) => {
          if (!best) return p;
          return p.progress > best.progress ? p : best;
        }, null);

        logger.info(`[Arena] Room ${roomId} FINISHED. Winner: ${winner?.name}`);

        arena.to(`arena:${roomId}`).emit('arena:match_finished', {
          room: roomSnapshot(room),
          winner: winner ? { userId: winner.userId, name: winner.name, progress: winner.progress, total: winner.totalTests } : null
        });
      }
    });

    // ─── LANGUAGE SYNC ────────────────────────────────
    socket.on('arena:language_change', ({ roomId, language }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.get(socket.id);
      socket.to(`arena:${roomId}`).emit('arena:language_update', {
        language,
        userId: player?.userId,
        name: player?.name
      });
    });

    // ─── REJOIN ROOM (after refresh/disconnect) ──────
    socket.on('arena:rejoin', ({ userId, name, roomId }) => {
      const room = rooms.get(roomId);
      if (!room) {
        return socket.emit('arena:error', { message: 'Room no longer exists.' });
      }

      // Check if this user was in the grace period
      if (room.graceTimers && room.graceTimers.has(userId)) {
        // Cancel the forfeit timer
        clearTimeout(room.graceTimers.get(userId));
        room.graceTimers.delete(userId);
        logger.info(`[Arena] ${name} (${userId}) REJOINED room ${roomId} within grace period!`);
      }

      // Remove from offline set
      if (room.offlinePlayers) {
        room.offlinePlayers.delete(userId);
      }

      // Re-add as a player
      room.players.set(socket.id, {
        userId,
        name: name || 'Player',
        socketId: socket.id,
        progress: 0,
        totalTests: 0,
        code: '',
        finished: false
      });

      socket.join(`arena:${roomId}`);
      socket.arenaRoom = roomId;

      // Send full room state back to the rejoining player
      socket.emit('arena:rejoin_success', {
        code: roomId,
        room: roomSnapshot(room)
      });

      // Notify the partner that the player is back online
      socket.to(`arena:${roomId}`).emit('arena:player_reconnected', {
        room: roomSnapshot(room),
        userId,
        name
      });
    });

    // ─── LEAVE ROOM (voluntary — immediate) ──────────
    socket.on('arena:leave', ({ roomId }) => {
      handleVoluntaryLeave(socket, arena, roomId);
    });

    // ─── DISCONNECT (involuntary — grace period) ─────
    socket.on('disconnect', () => {
      logger.info(`[Arena] Socket disconnected: ${socket.id}`);
      if (socket.arenaRoom) {
        handleDisconnect(socket, arena, socket.arenaRoom);
      }
    });
  });

  // ─── Periodic Room Cleanup ───────────────────────────
  // Remove stale rooms older than 2 hours
  setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [code, room] of rooms) {
      if (room.createdAt.getTime() < cutoff) {
        // Clear any grace timers
        if (room.graceTimers) {
          for (const timer of room.graceTimers.values()) clearTimeout(timer);
        }
        rooms.delete(code);
        logger.info(`[Arena] Cleaned up stale room ${code}`);
      }
    }
  }, 10 * 60 * 1000);

  logger.info('[Arena] /arena namespace initialised');
  return arena;
};

/**
 * Handle a VOLUNTARY leave (user clicks Exit/Leave).
 * Immediately removes the player and ends the match.
 */
function handleVoluntaryLeave(socket, arena, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.get(socket.id);
  if (!player) return;

  room.players.delete(socket.id);
  socket.leave(`arena:${roomId}`);
  socket.arenaRoom = null;

  logger.info(`[Arena] ${player.name} voluntarily left room ${roomId}.`);

  if (room.players.size === 0) {
    if (room.graceTimers) {
      for (const timer of room.graceTimers.values()) clearTimeout(timer);
    }
    rooms.delete(roomId);
    return;
  }

  arena.to(`arena:${roomId}`).emit('arena:player_left', {
    room: roomSnapshot(room),
    leftPlayer: { userId: player.userId, name: player.name }
  });

  // If active match, end it immediately — voluntary leave = forfeit
  if (room.status === 'active') {
    room.status = 'finished';
    const remaining = Array.from(room.players.values())[0];
    arena.to(`arena:${roomId}`).emit('arena:match_finished', {
      room: roomSnapshot(room),
      winner: remaining ? { userId: remaining.userId, name: remaining.name, progress: remaining.progress, total: remaining.totalTests } : null,
      reason: 'opponent_left'
    });
  }
}

/**
 * Handle an INVOLUNTARY disconnect (refresh, network drop, tab close).
 * Starts a 30-second grace period before declaring forfeit.
 */
function handleDisconnect(socket, arena, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.get(socket.id);
  if (!player) return;

  const userId = player.userId;
  const playerName = player.name;

  // Remove from active players
  room.players.delete(socket.id);
  socket.leave(`arena:${roomId}`);
  socket.arenaRoom = null;

  logger.info(`[Arena] ${playerName} disconnected from room ${roomId}. Starting grace period.`);

  if (room.players.size === 0) {
    // Both disconnected — clean up
    if (room.graceTimers) {
      for (const timer of room.graceTimers.values()) clearTimeout(timer);
    }
    rooms.delete(roomId);
    return;
  }

  if (room.status === 'active' || room.status === 'waiting') {
    // ─── GRACE PERIOD: 30 seconds to rejoin ───
    if (!room.offlinePlayers) room.offlinePlayers = new Map();
    if (!room.graceTimers) room.graceTimers = new Map();

    room.offlinePlayers.set(userId, { userId, name: playerName, disconnectedAt: Date.now() });

    // Warn the remaining player
    arena.to(`arena:${roomId}`).emit('arena:player_offline', {
      userId,
      name: playerName,
      graceSeconds: 30
    });

    // Start the 30-second timer
    const graceTimer = setTimeout(() => {
      // Check if they reconnected during the grace period
      if (room.offlinePlayers && room.offlinePlayers.has(userId)) {
        room.offlinePlayers.delete(userId);
        room.graceTimers.delete(userId);
        logger.info(`[Arena] Grace period expired for ${playerName} in room ${roomId}. Forfeiting.`);

        if (room.status === 'active') {
          room.status = 'finished';
          const remaining = Array.from(room.players.values())[0];
          arena.to(`arena:${roomId}`).emit('arena:match_finished', {
            room: roomSnapshot(room),
            winner: remaining ? { userId: remaining.userId, name: remaining.name, progress: remaining.progress, total: remaining.totalTests } : null,
            reason: 'opponent_disconnected'
          });
        } else {
          // Was in waiting state — just notify
          arena.to(`arena:${roomId}`).emit('arena:player_left', {
            room: roomSnapshot(room),
            leftPlayer: { userId, name: playerName }
          });
        }
      }
    }, 30000);

    room.graceTimers.set(userId, graceTimer);
  } else {
    // Not in an active/waiting match, immediate cleanup
    arena.to(`arena:${roomId}`).emit('arena:player_left', {
      room: roomSnapshot(room),
      leftPlayer: { userId, name: playerName }
    });
  }
}

module.exports = { initArenaSocket };

