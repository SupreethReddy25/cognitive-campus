/**
 * Bayesian Knowledge Tracing (BKT) Engine
 *
 * Pure function module — no database calls, no imports from other project files.
 * Implements the standard BKT model for tracking student knowledge mastery.
 *
 * @module bktEngine
 */

// ─── BKT Parameters ────────────────────────────────────────────
/** @constant {number} P_L0 - Initial knowledge probability */
const P_L0 = 0.3;

/** @constant {number} P_T - Learning/transition probability */
const P_T = 0.09;

/** @constant {number} P_S - Slip probability (knows skill but answers wrong) */
const P_S = 0.1;

/** @constant {number} P_G - Guess probability (doesn't know but answers right) */
const P_G = 0.2;

/** @constant {number} MASTERY_THRESHOLD - Mastery is achieved at or above this value */
const MASTERY_THRESHOLD = 0.85;

/** @constant {number} UNLOCK_THRESHOLD - Prerequisite skill is considered "met" at this value */
const UNLOCK_THRESHOLD = 0.70;

/**
 * Clamps a numeric value between a minimum and maximum.
 *
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} The clamped value
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Applies the BKT update equation to compute a new mastery probability
 * after a single attempt.
 *
 * If correct:
 *   evidence = (P(Ln) * (1 - P_S)) / ((P(Ln) * (1 - P_S)) + ((1 - P(Ln)) * P_G))
 * If incorrect:
 *   evidence = (P(Ln) * P_S) / ((P(Ln) * P_S) + ((1 - P(Ln)) * (1 - P_G)))
 * Then:
 *   newMastery = evidence + (1 - evidence) * P_T
 *
 * @param {number} currentMasteryP - Current mastery probability P(Ln), between 0 and 1
 * @param {boolean} isCorrect - Whether the student answered correctly
 * @returns {number} The updated mastery probability, clamped between 0 and 1
 */
const updateMastery = (currentMasteryP, isCorrect) => {
  let evidence;

  if (isCorrect) {
    const numerator = currentMasteryP * (1 - P_S);
    const denominator = (currentMasteryP * (1 - P_S)) + ((1 - currentMasteryP) * P_G);
    evidence = numerator / denominator;
  } else {
    const numerator = currentMasteryP * P_S;
    const denominator = (currentMasteryP * P_S) + ((1 - currentMasteryP) * (1 - P_G));
    evidence = numerator / denominator;
  }

  const newMastery = evidence + (1 - evidence) * P_T;
  return clamp(newMastery, 0, 1);
};

/**
 * Applies a hint penalty to the mastery probability.
 * Each hint used reduces mastery by 1.5 percentage points (0.015).
 *
 * @param {number} masteryP - Current mastery probability
 * @param {number} hintsUsed - Number of hints the student used
 * @returns {number} Adjusted mastery probability, clamped between 0 and 1
 */
const applyHintPenalty = (masteryP, hintsUsed) => {
  const adjusted = masteryP - (hintsUsed * 0.015);
  return clamp(adjusted, 0, 1);
};

/**
 * Checks whether the given mastery probability meets or exceeds the mastery threshold.
 *
 * @param {number} masteryP - The mastery probability to check
 * @returns {boolean} True if masteryP >= MASTERY_THRESHOLD (0.85)
 */
const isMastered = (masteryP) => masteryP >= MASTERY_THRESHOLD;

/**
 * Checks whether the given mastery probability meets or exceeds the unlock threshold.
 *
 * @param {number} masteryP - The mastery probability to check
 * @returns {boolean} True if masteryP >= UNLOCK_THRESHOLD (0.70)
 */
const isUnlockable = (masteryP) => masteryP >= UNLOCK_THRESHOLD;

/**
 * Computes BKT updates for a batch of skill states given corresponding submission results.
 *
 * @param {Array<{skillId: string, masteryP: number}>} skillStates - Current skill states
 * @param {Array<{skillId: string, isCorrect: boolean}>} submissionResults - Submission outcomes
 * @returns {Array<{skillId: string, newMasteryP: number, wasMastered: boolean, wasUnlocked: boolean}>}
 *   Updated skill state data with mastery and unlock flags
 */
const computeBatchUpdate = (skillStates, submissionResults) => {
  const stateMap = new Map(skillStates.map((state) => [state.skillId, state.masteryP]));

  return submissionResults.map((result) => {
    const currentMasteryP = stateMap.get(result.skillId) || P_L0;
    const newMasteryP = updateMastery(currentMasteryP, result.isCorrect);

    return {
      skillId: result.skillId,
      newMasteryP,
      wasMastered: isMastered(newMasteryP),
      wasUnlocked: isUnlockable(newMasteryP)
    };
  });
};

module.exports = {
  P_L0,
  P_T,
  P_S,
  P_G,
  MASTERY_THRESHOLD,
  UNLOCK_THRESHOLD,
  updateMastery,
  applyHintPenalty,
  isMastered,
  isUnlockable,
  computeBatchUpdate
};
