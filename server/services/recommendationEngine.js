/**
 * Recommendation Engine
 *
 * Provides adaptive problem recommendations based on student mastery levels
 * and handles skill unlocking when prerequisites are met.
 *
 * @module recommendationEngine
 */

const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');

/** @constant {object} DIFFICULTY_SCORE - Numeric scores for difficulty levels */
const DIFFICULTY_SCORE = { easy: 1, medium: 2, hard: 3 };

/**
 * Determines the target difficulty level based on current mastery probability.
 *
 * @param {number} masteryP - Current mastery probability (0-1)
 * @returns {number} Target difficulty score: 1 (easy), 2 (medium), or 3 (hard)
 */
const getTargetDifficulty = (masteryP) => {
  if (masteryP < 0.4) return 1; // easy
  if (masteryP < 0.7) return 2; // medium
  return 3; // hard
};

/**
 * Gets a personalised problem recommendation for a student.
 *
 * Strategy:
 * 1. Find all unlocked skills for the user
 * 2. Pick the skill with the lowest mastery probability (weakest area)
 * 3. Within that skill, score each active problem by difficulty match
 * 4. Return the best-matching problem
 *
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {Promise<{problem: object|null, targetSkill: object|null, reason: string}>}
 *   The recommended problem, target skill, and explanation string
 */
const getRecommendation = async (userId) => {
  try {
    // Fetch all SkillStates for this user, populated with skill details
    const skillStates = await SkillState.find({ userId })
      .populate('skillId', 'name description order')
      .sort({ masteryP: 1 });

    // Filter to unlocked skills only
    const unlockedStates = skillStates.filter((state) => state.isUnlocked);

    // Cold start: if no unlocked skills, default to Arrays
    if (unlockedStates.length === 0) {
      const arraysSkill = await Skill.findOne({ name: 'Arrays' });
      if (!arraysSkill) {
        return { problem: null, targetSkill: null, reason: 'No skills available. Please run the seed script.' };
      }

      const easyProblem = await Problem.findOne({ skillId: arraysSkill._id, isActive: true, difficulty: 'easy' });
      return {
        problem: easyProblem,
        targetSkill: arraysSkill,
        reason: 'Starting with an easy Arrays problem as your first challenge.'
      };
    }

    // Find the skill with the lowest masteryP among unlocked, non-mastered skills
    const nonMasteredStates = unlockedStates.filter((state) => !state.isMastered);
    const targetState = nonMasteredStates.length > 0 ? nonMasteredStates[0] : unlockedStates[0];

    const targetSkill = targetState.skillId;
    const targetDifficulty = getTargetDifficulty(targetState.masteryP);

    // Fetch all active problems for the target skill
    const problems = await Problem.find({ skillId: targetSkill._id, isActive: true });

    if (problems.length === 0) {
      return {
        problem: null,
        targetSkill,
        reason: `No problems available for ${targetSkill.name}. More content coming soon.`
      };
    }

    // Score each problem by difficulty match
    const scoredProblems = problems.map((problem) => {
      const problemDifficulty = DIFFICULTY_SCORE[problem.difficulty] || 1;
      const matchScore = 1 / (1 + Math.abs(problemDifficulty - targetDifficulty));
      return { problem, matchScore };
    });

    // Sort by match score descending, pick the highest
    scoredProblems.sort((a, b) => b.matchScore - a.matchScore);
    const bestMatch = scoredProblems[0];

    const difficultyLabel = targetDifficulty === 1 ? 'easy' : targetDifficulty === 2 ? 'medium' : 'hard';

    return {
      problem: bestMatch.problem,
      targetSkill,
      reason: `Recommended a ${bestMatch.problem.difficulty} ${targetSkill.name} problem. ` +
        `Your mastery is ${(targetState.masteryP * 100).toFixed(0)}%, targeting ${difficultyLabel} difficulty.`
    };
  } catch (error) {
    logger.error('Recommendation engine error', { error: error.message, userId });
    return { problem: null, targetSkill: null, reason: 'Unable to generate recommendation at this time.' };
  }
};

/**
 * Checks all locked skills for a user and unlocks any whose prerequisites
 * are ALL met (prerequisite skill masteryP >= 0.70).
 *
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {Promise<string[]>} Array of newly unlocked skill names
 */
const checkAndUnlockSkills = async (userId) => {
  try {
    // Fetch all skill states for the user, populate skill details including prerequisites
    const skillStates = await SkillState.find({ userId }).populate({
      path: 'skillId',
      populate: { path: 'prerequisites', select: 'name _id' }
    });

    // Build a map of skillId → masteryP for quick lookup
    const masteryMap = new Map();
    skillStates.forEach((state) => {
      if (state.skillId) {
        masteryMap.set(state.skillId._id.toString(), state.masteryP);
      }
    });

    const newlyUnlocked = [];

    for (const state of skillStates) {
      // Skip already-unlocked skills
      if (state.isUnlocked) continue;
      if (!state.skillId || !state.skillId.prerequisites) continue;

      // Check if ALL prerequisites have masteryP >= 0.70
      const prerequisites = state.skillId.prerequisites;

      if (prerequisites.length === 0) {
        // No prerequisites — should already be unlocked (Arrays, Strings),
        // but unlock just in case
        state.isUnlocked = true;
        await state.save();
        newlyUnlocked.push(state.skillId.name);
        continue;
      }

      const allPrerequisitesMet = prerequisites.every((prereq) => {
        const prereqMastery = masteryMap.get(prereq._id.toString());
        return prereqMastery !== undefined && prereqMastery >= 0.70;
      });

      if (allPrerequisitesMet) {
        state.isUnlocked = true;
        await state.save();
        newlyUnlocked.push(state.skillId.name);
        logger.info(`Skill unlocked: ${state.skillId.name} for user ${userId}`);
      }
    }

    return newlyUnlocked;
  } catch (error) {
    logger.error('Skill unlock check error', { error: error.message, userId });
    return [];
  }
};

module.exports = { getRecommendation, checkAndUnlockSkills };
