const express = require('express');
const { getSheets, getSheet, updateProgress } = require('../controllers/sheetController');
const authenticateToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.route('/').get(optionalAuth, getSheets);
router.route('/:slug').get(getSheet);
router.route('/:slug/progress').post(authenticateToken, updateProgress);

module.exports = router;

