/**
 * Server bootstrap: validate the environment, connect the database, attach sockets, listen, and shut down cleanly.
 * The application itself lives in app.js.
 */

require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const { loadConfig } = require('./config/env');

let config;
try {
  config = loadConfig();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

const connectDB = require('./utils/connectDB');
const { createApp } = require('./app');
const { initSocket } = require('./socket/socketHandler');
const { initArenaSocket } = require('./socket/arenaHandler');

const app = createApp(config);
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] } });
initSocket(io);
initArenaSocket(io);
app.set('io', io); // controllers reach the socket server through req.app.get('io')

// ─── Process-level safety nets ───
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', { error: error.message, stack: error.stack });
  process.exit(1);
});

// A stray rejected promise should not take a development API down; in production the supervisor restarts us.
process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION', { reason: reason?.message || String(reason), stack: reason?.stack });
  if (config.isProd) shutdown('unhandledRejection', 1);
});

let closing = false;
/** Stops accepting connections, lets in-flight work finish, closes the database, then exits. */
function shutdown(signal, code = 0) {
  if (closing) return;
  closing = true;
  logger.info(`${signal} received — shutting down gracefully`);
  const force = setTimeout(() => { logger.error('Shutdown timed out — forcing exit'); process.exit(1); }, 10000);
  force.unref();
  io.close(() => server.close(async () => {
    await mongoose.connection.close().catch(() => {});
    logger.info('MongoDB connection closed');
    process.exit(code);
  }));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

connectDB(config.mongoUri)
  .then(async () => {
    server.listen(config.port, () => logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`));
    try {
      await require('./services/knowledgeService').getParamsMap(); // warm the learned BKT parameters
    } catch (e) {
      logger.warn(`BKT parameter warm-up skipped: ${e.message}`);
    }
  })
  .catch((error) => {
    logger.error(error.message);
    process.exit(1);
  });

module.exports = { app, io, server };
