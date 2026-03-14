/**
 * Nudge Service
 *
 * Generates contextual nudge messages based on submission context,
 * AST analysis results, attempt history, and mastery level.
 *
 * @module nudgeService
 */

/**
 * Generates a contextual nudge message based on submission context.
 * Returns the first matching nudge from the priority list, or null.
 *
 * Priority order:
 * 1. Anti-pattern detected in AST analysis
 * 2. 5+ failed attempts → suggest reviewing theory
 * 3. 3+ failed attempts → suggest using hints
 * 4. Low mastery (< 0.3) → suggest easier problems
 *
 * @param {object} astResult - The AST analysis result object
 * @param {number} failedAttempts - Number of prior failed attempts on this problem
 * @param {string} skillName - Name of the skill being assessed
 * @param {number} masteryP - Current mastery probability for this skill
 * @returns {string|null} A nudge message string, or null if no nudge is warranted
 */
const generateNudge = (astResult, failedAttempts, skillName, masteryP) => {
  // Priority 1: Anti-pattern detected
  if (astResult && astResult.antiPatternDetected) {
    return `${astResult.antiPatternDescription} Try optimising your approach.`;
  }

  // Priority 2: 5+ failed attempts
  if (failedAttempts >= 5) {
    return `You've tried this ${failedAttempts} times. Step back and review ${skillName} theory before attempting again.`;
  }

  // Priority 3: 3+ failed attempts
  if (failedAttempts >= 3) {
    return 'You\'re close — try reading the hints for this problem.';
  }

  // Priority 4: Low mastery
  if (masteryP < 0.3) {
    return `Your ${skillName} mastery is still building. Consider trying an easier problem first.`;
  }

  // No nudge warranted
  return null;
};

module.exports = { generateNudge };
