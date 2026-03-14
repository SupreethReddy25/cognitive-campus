/**
 * BKT Engine Unit Tests
 *
 * Comprehensive Jest tests for the Bayesian Knowledge Tracing engine.
 * All functions are pure — no mocking needed.
 */

const {
  updateMastery,
  applyHintPenalty,
  isMastered,
  isUnlockable,
  computeBatchUpdate,
  P_L0,
  P_T,
  P_S,
  P_G,
  MASTERY_THRESHOLD,
  UNLOCK_THRESHOLD
} = require('../services/bktEngine');

describe('BKT Engine', () => {
  describe('updateMastery', () => {
    test('correct answer increases masteryP', () => {
      const initial = 0.3;
      const updated = updateMastery(initial, true);
      expect(updated).toBeGreaterThan(initial);
    });

    test('incorrect answer decreases masteryP', () => {
      const initial = 0.5;
      const updated = updateMastery(initial, false);
      expect(updated).toBeLessThan(initial);
    });

    test('result is always clamped between 0 and 1', () => {
      // Even with extreme values
      const veryHigh = updateMastery(0.99, true);
      expect(veryHigh).toBeGreaterThanOrEqual(0);
      expect(veryHigh).toBeLessThanOrEqual(1);

      const veryLow = updateMastery(0.01, false);
      expect(veryLow).toBeGreaterThanOrEqual(0);
      expect(veryLow).toBeLessThanOrEqual(1);
    });

    test('verify exact mathematical output for known inputs — correct answer at P(Ln)=0.3', () => {
      // Manual calculation:
      // evidence = (0.3 * 0.9) / ((0.3 * 0.9) + (0.7 * 0.2))
      //          = 0.27 / (0.27 + 0.14)
      //          = 0.27 / 0.41
      //          ≈ 0.6585365853658537
      // newMastery = 0.6585365853658537 + (1 - 0.6585365853658537) * 0.09
      //            = 0.6585365853658537 + 0.3414634146341463 * 0.09
      //            = 0.6585365853658537 + 0.030731707317073166
      //            ≈ 0.6892682926829268
      const result = updateMastery(0.3, true);
      expect(result).toBeCloseTo(0.6893, 4);
    });

    test('verify exact mathematical output for known inputs — incorrect answer at P(Ln)=0.5', () => {
      // Manual calculation:
      // evidence = (0.5 * 0.1) / ((0.5 * 0.1) + (0.5 * 0.8))
      //          = 0.05 / (0.05 + 0.4)
      //          = 0.05 / 0.45
      //          ≈ 0.1111111111111111
      // newMastery = 0.1111111111111111 + (1 - 0.1111111111111111) * 0.09
      //            = 0.1111111111111111 + 0.8888888888888889 * 0.09
      //            ≈ 0.1911111111111111
      const result = updateMastery(0.5, false);
      expect(result).toBeCloseTo(0.1911, 4);
    });

    test('starting from P_L0 (0.3), multiple correct answers approach mastery', () => {
      let mastery = P_L0;
      for (let i = 0; i < 10; i++) {
        mastery = updateMastery(mastery, true);
      }
      expect(mastery).toBeGreaterThan(MASTERY_THRESHOLD);
    });
  });

  describe('applyHintPenalty', () => {
    test('0 hints changes nothing', () => {
      const mastery = 0.5;
      const adjusted = applyHintPenalty(mastery, 0);
      expect(adjusted).toBe(mastery);
    });

    test('3 hints reduces mastery by 0.045', () => {
      const mastery = 0.5;
      const adjusted = applyHintPenalty(mastery, 3);
      expect(adjusted).toBeCloseTo(0.455, 4);
    });

    test('result never goes below 0', () => {
      const adjusted = applyHintPenalty(0.01, 100);
      expect(adjusted).toBe(0);
    });

    test('result never exceeds 1', () => {
      const adjusted = applyHintPenalty(1.0, 0);
      expect(adjusted).toBeLessThanOrEqual(1);
    });
  });

  describe('isMastered', () => {
    test('returns true at exactly 0.85', () => {
      expect(isMastered(0.85)).toBe(true);
    });

    test('returns false at 0.84', () => {
      expect(isMastered(0.84)).toBe(false);
    });

    test('returns true above 0.85', () => {
      expect(isMastered(0.95)).toBe(true);
    });
  });

  describe('isUnlockable', () => {
    test('returns true at exactly 0.70', () => {
      expect(isUnlockable(0.70)).toBe(true);
    });

    test('returns false at 0.69', () => {
      expect(isUnlockable(0.69)).toBe(false);
    });

    test('returns true above 0.70', () => {
      expect(isUnlockable(0.80)).toBe(true);
    });
  });

  describe('computeBatchUpdate', () => {
    test('processes multiple skill updates correctly', () => {
      const skillStates = [
        { skillId: 'skill1', masteryP: 0.3 },
        { skillId: 'skill2', masteryP: 0.5 }
      ];
      const submissionResults = [
        { skillId: 'skill1', isCorrect: true },
        { skillId: 'skill2', isCorrect: false }
      ];

      const results = computeBatchUpdate(skillStates, submissionResults);

      expect(results).toHaveLength(2);
      expect(results[0].skillId).toBe('skill1');
      expect(results[0].newMasteryP).toBeGreaterThan(0.3);
      expect(results[1].skillId).toBe('skill2');
      expect(results[1].newMasteryP).toBeLessThan(0.5);
    });

    test('returns wasMastered and wasUnlocked flags correctly', () => {
      const skillStates = [
        { skillId: 'skill1', masteryP: 0.84 }
      ];
      const submissionResults = [
        { skillId: 'skill1', isCorrect: true }
      ];

      const results = computeBatchUpdate(skillStates, submissionResults);
      expect(results[0].wasMastered).toBe(true);
      expect(results[0].wasUnlocked).toBe(true);
    });
  });

  describe('Constants', () => {
    test('BKT parameters have correct values', () => {
      expect(P_L0).toBe(0.3);
      expect(P_T).toBe(0.09);
      expect(P_S).toBe(0.1);
      expect(P_G).toBe(0.2);
      expect(MASTERY_THRESHOLD).toBe(0.85);
      expect(UNLOCK_THRESHOLD).toBe(0.70);
    });
  });
});
