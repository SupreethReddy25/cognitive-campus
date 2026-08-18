const express = require('express');
const authRoutes = require('./authRoutes');
const skillRoutes = require('./skillRoutes');
const problemRoutes = require('./problemRoutes');
const submissionRoutes = require('./submissionRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const companyRoutes = require('./companies');
const experienceRoutes = require('./experiences');
const sheetRoutes = require('./sheets');
const arenaRoutes = require('./arenaRoutes');
const collegeRoutes = require('./collegeRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/skills', skillRoutes);
router.use('/problems', problemRoutes);
router.use('/submissions', submissionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/companies', companyRoutes);
router.use('/experiences', experienceRoutes);
router.use('/sheets', sheetRoutes);
router.use('/arena', arenaRoutes);
router.use('/colleges', collegeRoutes);

module.exports = router;
