require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const morgan = require('morgan');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const connectDB = require('./utils/connectDB');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { initSocket } = require('./socket/socketHandler');
const { initArenaSocket } = require('./socket/arenaHandler');

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
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Initialise Socket.io connection handling
initSocket(io);
initArenaSocket(io);

// Make io accessible to controllers via app
app.set('io', io);

// --------------- Middleware Stack ---------------
app.use(helmet());
app.use(cors({ origin: "*" }));
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
    message: 'Cogni API running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Global error handler — must be AFTER all routes
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  // ── Auto-seed companies if collection is empty ──────────────────
  try {
    const Company = require('./models/Company');
    const count = await Company.countDocuments();
    if (count === 0) {
      const { seedCompaniesData } = require('./seeds/seedCompanies');
      await Company.insertMany(seedCompaniesData);
      logger.info('Auto-seeded ' + seedCompaniesData.length + ' companies');
    }
  } catch (e) {
    logger.warn('Company auto-seed skipped: ' + e.message);
  }

  // ── Auto-seed experiences if collection is empty ─────────────────
  try {
    const InterviewExperience = require('./models/InterviewExperience');
    const expCount = await InterviewExperience.countDocuments();
    if (expCount === 0) {
      const Company = require('./models/Company');
      let seedMod;
      try {
        seedMod = require('./seeds/seedExperiences');
      } catch (parseErr) {
        logger.warn('Experience seed file has a syntax error — skipping auto-seed. Run manually: node seeds/seedExperiences.js');
        seedMod = null;
      }
      if (seedMod && seedMod.experiencesData) {
        const { experiencesData } = seedMod;
        let created = 0;
        for (const exp of experiencesData) {
          const { companySlug, ...fields } = exp;
          const company = await Company.findOne({ slug: companySlug });
          if (!company) continue;
          await InterviewExperience.create({
            ...fields,
            companyId: company._id,
            status: 'Published',
            source: fields.source || 'curated',
          });
          created++;
        }
        logger.info(`Auto-seeded ${created} interview experiences`);
      }
    }
  } catch (e) {
    logger.warn('Experience auto-seed skipped: ' + e.message);
  }

  // ── Auto-seed colleges if collection is empty ────────────────────
  try {
    const College = require('./models/College');
    const collegeCount = await College.countDocuments();
    if (collegeCount === 0) {
      const { COLLEGES } = require('./seeds/collegeSeed');
      await College.insertMany(COLLEGES);
      logger.info('Auto-seeded ' + COLLEGES.length + ' colleges');
    }
  } catch (e) {
    logger.warn('College auto-seed skipped: ' + e.message);
  }

  // ── Backfill collegeId on experiences that have college string ───
  // Runs every boot but is fast — only processes docs with null collegeId.
  try {
    const InterviewExperience = require('./models/InterviewExperience');
    const College = require('./models/College');
    const unmigratedCount = await InterviewExperience.countDocuments({
      college: { $exists: true, $ne: '' },
      collegeId: null
    });
    if (unmigratedCount > 0) {
      const { COLLEGES } = require('./seeds/collegeSeed');
      // Build name/shortName → _id map from DB (post-seed)
      const colleges = await College.find().lean();
      const nameMap = {};
      colleges.forEach(c => {
        nameMap[c.name.toLowerCase()] = c._id;
        nameMap[c.shortName.toLowerCase()] = c._id;
        nameMap[c.slug.toLowerCase()] = c._id;
      });
      const ALIASES = {
        'nit trichy': 'nit-trichy', 'nitt': 'nit-trichy',
        'vit vellore': 'vit-vellore', 'vit': 'vit-vellore',
        'iit bombay': 'iit-bombay', 'iitb': 'iit-bombay',
        'iit delhi': 'iit-delhi', 'iitd': 'iit-delhi',
        'iit madras': 'iit-madras', 'iitm': 'iit-madras',
        'nit warangal': 'nit-warangal', 'nitw': 'nit-warangal',
        'bits pilani': 'bits-pilani', 'bits': 'bits-pilani',
        'iiit hyderabad': 'iiit-hyderabad', 'iiith': 'iiit-hyderabad',
        'pes university': 'pes-university',
        'nit surathkal': 'nit-surathkal', 'nitk': 'nit-surathkal',
        'dtu': 'dtu-delhi', 'dtu delhi': 'dtu-delhi',
        'manipal': 'mit-manipal', 'mit manipal': 'mit-manipal',
        'coep': 'coep-pune', 'nit calicut': 'nit-calicut', 'nitc': 'nit-calicut',
        'amrita': 'amrita', 'amrita vishwa vidyapeetham': 'amrita',
        'thapar': 'thapar', 'nsut': 'nsut-delhi', 'psg tech': 'psg-tech',
      };
      const slugToId = {};
      colleges.forEach(c => { slugToId[c.slug] = c._id; });

      const exps = await InterviewExperience.find({
        college: { $exists: true, $ne: '' }, collegeId: null
      }).select('_id college').lean();

      let backfilled = 0;
      for (const exp of exps) {
        const key = (exp.college || '').toLowerCase().trim();
        const slug = ALIASES[key] || key;
        const id = slugToId[slug] || nameMap[key];
        if (id) {
          await InterviewExperience.updateOne({ _id: exp._id }, { $set: { collegeId: id } });
          backfilled++;
        }
      }
      if (backfilled > 0) logger.info(`Backfilled collegeId on ${backfilled} experiences`);
    }
  } catch (e) {
    logger.warn('College backfill skipped: ' + e.message);
  }
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
