const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillState = require('../models/SkillState');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, publicUser } = require('../utils/token');
const { loadConfig } = require('../config/env');

// compared against when the email is unknown, so "no such user" and "wrong password" take equally long
const DUMMY_HASH = bcrypt.hashSync('cogni-timing-guard', 10);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    return sendSuccess(res, { token: signToken(user), user: publicUser(user) }, 201);
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
    const isPasswordMatch = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !isPasswordMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    logger.info(`User logged in: ${user.email}`);

    return sendSuccess(res, { token: signToken(user), user: publicUser(user) });
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
    const user = await User.findById(req.user.userId)
      .select('-passwordHash')
      .populate('collegeId', 'name shortName slug tier location verified')
      .populate('targetCompanyId', 'name slug tier');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Live prefix search — the first name behind an email as it is typed, for the greeting on the login screen
 * @route   GET /api/auth/search-name?q=supr
 * @access  Public (rate limited)
 * @returns {{ found: boolean, firstName: string|null, email?: string, exact: boolean }}
 */
const searchName = asyncHandler(async (req, res) => {
  const none = { found: false, firstName: null, exact: false };
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase().slice(0, 254) : '';
  if (!q) return res.json(none);

  // anchored prefix — uses the email index
  const user = await User.findOne({ email: { $regex: `^${escapeRegex(q)}`, $options: 'i' } }, { name: 1, email: 1, _id: 0 }).lean();
  if (!user?.name) return res.json(none);
  return res.json({ found: true, firstName: user.name.trim().split(/\s+/)[0], email: user.email, exact: user.email === q });
});

/**
 * @desc    Exact email lookup — the first name behind a complete email
 * @route   GET /api/auth/peek?email=user@example.com
 * @access  Public (rate limited)
 */
const peek = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (typeof email !== 'string' || !email.includes('@')) return res.json({ found: false, firstName: null });
  const user = await User.findOne({ email: email.toLowerCase().trim() }, { name: 1, _id: 0 }).lean();
  if (!user?.name) return res.json({ found: false, firstName: null });
  return res.json({ found: true, firstName: user.name.trim().split(/\s+/)[0] });
});

/**
 * @desc    Promote the caller to admin. Allowed for first-time setup (no admin exists yet) or, outside production, when
 *          ALLOW_ADMIN_BOOTSTRAP=true (powers the "Become admin" button in Profile). Returns a fresh token because the
 *          role is embedded in it.
 * @route   POST /api/auth/bootstrap-admin
 * @access  Protected
 */
const bootstrapAdmin = asyncHandler(async (req, res) => {
  const { allowAdminBootstrap } = loadConfig();
  const adminExists = (await User.countDocuments({ role: 'admin' })) > 0;
  if (adminExists && !allowAdminBootstrap) {
    throw new AppError('An admin already exists. Ask them to promote you from the admin panel.', 403);
  }
  const user = await User.findByIdAndUpdate(req.user.userId, { role: 'admin' }, { new: true, select: 'name email role xp level streak' });
  if (!user) throw new AppError('User not found', 404);
  logger.info(`User ${user.email} promoted to admin via bootstrap`);
  return res.json({ success: true, data: { user, token: signToken(user) }, message: 'You are now an admin.' });
});

module.exports = { register, login, getMe, searchName, peek, bootstrapAdmin };
