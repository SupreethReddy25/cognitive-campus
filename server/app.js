/**
 * The Express application — middleware, routes, error handling. No port, no database, no sockets: those belong to the
 * bootstrap in index.js, which keeps this module importable from tests.
 *
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const routes = require('./routes');
const requestId = require('./middleware/requestId');
const sanitize = require('./middleware/sanitize');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { loadConfig } = require('./config/env');

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/** Liveness plus a database check — what a load balancer or uptime monitor should call. */
const health = (req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  res.status(db === 'connected' ? 200 : 503).json({
    success: db === 'connected',
    message: 'Cogni API running',
    data: { status: db === 'connected' ? 'ok' : 'degraded', db, uptimeSeconds: Math.round(process.uptime()) },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
};

/**
 * @param {object} [config=loadConfig()] - Resolved configuration
 * @returns {import('express').Express}
 */
function createApp(config = loadConfig()) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs (rate limiting) behind a reverse proxy

  app.use(requestId);
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '512kb' }));
  app.use(sanitize);
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: { write: (msg) => logger.info(msg.trim()) }, skip: (req) => req.path === '/health' }));

  app.get('/health', health);
  app.use('/api', generalLimiter);
  app.get('/api/health', health);
  app.use('/api', routes);
  app.use('/api', notFound);

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
