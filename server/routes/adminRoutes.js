const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const admin = require('../controllers/adminController');
const { createCollege, createPlacementRecord } = require('../controllers/collegeController');

const router = express.Router();

// Every admin route requires a valid session AND admin role (checked against the DB).
router.use(authenticateToken, adminAuth);

// Overview + analytics
router.get('/stats', admin.getDashboardStats);
router.get('/heatmap', admin.getSkillHeatmap);

// Students
router.get('/students', admin.getAllStudents);
router.get('/students/:id', admin.getStudentDetail);
router.patch('/users/:id/role', admin.updateUserRole);

// Experience moderation
router.get('/experiences', admin.getExperiences);
router.patch('/experiences/:id/verify', admin.moderateExperience);

// Problem curation
router.get('/problems', admin.getProblems);
router.patch('/problems/:id/status', admin.updateProblemStatus);

// Data entry
router.post('/colleges', createCollege);
router.post('/companies', admin.createCompany);
router.get('/placement-records', admin.getPlacementRecords);
router.post('/placement-records', createPlacementRecord);
router.delete('/placement-records/:id', admin.deletePlacementRecord);

module.exports = router;
