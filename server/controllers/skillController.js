/**
 * Skill Controller
 *
 * Handles fetching the skill tree and per-user skill mastery states.
 *
 * @module skillController
 */

const Skill = require('../models/Skill');
const SkillState = require('../models/SkillState');
const logger = require('../utils/logger');

/**
 * @desc    Get all 12 skills with prerequisite details populated
 * @route   GET /api/skills
 * @access  Protected
 * @param   {import('express').Request} req - Express request
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getAllSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({})
      .populate('prerequisites', 'name order')
      .sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: { skills }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all SkillStates for the authenticated user, populated with skill details
 * @route   GET /api/skills/my-states
 * @access  Protected
 * @param   {import('express').Request} req - Express request with req.user set by auth middleware
 * @param   {import('express').Response} res - Express response
 * @param   {import('express').NextFunction} next - Express next function
 */
const getUserSkillStates = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const skillStates = await SkillState.find({ userId })
      .populate('skillId', 'name description order difficultyWeight')
      .sort({ 'skillId.order': 1 });

    return res.status(200).json({
      success: true,
      data: { skillStates }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllSkills, getUserSkillStates };
