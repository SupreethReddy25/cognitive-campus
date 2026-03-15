require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const connectDB = require('./utils/connectDB');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { initSocket } = require('./socket/socketHandler');

// ─── Uncaught Exception Handler ───
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Socket.io attached to HTTP server with CORS config
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialise Socket.io connection handling
initSocket(io);

// Make io accessible to controllers via app
app.set('io', io);

// --------------- Middleware Stack ---------------
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// General rate limiter — before all API routes
app.use('/api', generalLimiter);

// --------------- Routes ---------------
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cognitive Campus API running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Global error handler — must be AFTER all routes
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});

// ─── Unhandled Rejection Handler ───
process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION — shutting down', { reason: reason?.message || reason });
  server.close(() => {
    process.exit(1);
  });
});

// ─── Graceful Shutdown ───
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Export app and io for testing and controller access
module.exports = { app, io };
