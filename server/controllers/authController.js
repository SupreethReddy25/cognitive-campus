const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillState = require('../models/SkillState');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 * @param   {import('express').Request} req - Express request with name, email, password in body
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already exists', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user document
    const user = await User.create({
      name,
      email,
      passwordHash
    });

    // Create SkillState documents for all 12 skills
    const allSkills = await Skill.find({}).sort({ order: 1 });
    const entryPointSkills = ['Arrays', 'Strings'];

    const skillStatePromises = allSkills.map((skill) => {
      return SkillState.create({
        userId: user._id,
        skillId: skill._id,
        masteryP: 0.3,
        isUnlocked: entryPointSkills.includes(skill.name)
      });
    });

    await Promise.all(skillStatePromises);

    logger.info(`New user registered: ${user.email}`);

    // Sign JWT — include role for admin authorization
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return sendSuccess(res, {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        role: user.role
      }
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login an existing user
 * @route   POST /api/auth/login
 * @access  Public
 * @param   {import('express').Request} req - Express request with email, password in body
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email (include passwordHash for comparison)
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    logger.info(`User logged in: ${user.email}`);

    // Sign JWT — include role for admin authorization
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return sendSuccess(res, {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Protected
 * @param   {import('express').Request} req - Express request with req.user set by auth middleware
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
