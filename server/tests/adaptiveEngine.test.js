/**
 * Tests for the adaptive-intelligence layer: BKT v2, streaks, judge comparison, quality scoring,
 * offer-rate confidence intervals and the placement visit-probability model.
 * Everything here is pure — no database.
 */

const bkt = require('../services/bktEngine');
const streak = require('../services/streakService');
const { outputsMatch } = require('../services/codeExecutionService');
const { scoreQuality, heuristicParse } = require('../services/experienceParser');
const { wilson, summariseExperiences } = require('../services/companyIntelService');
const { visitProbability } = require('../services/placementAnalyticsService');

describe('BKT v2', () => {
  test('default params reproduce the textbook update exactly', () => {
    expect(bkt.updateMastery(0.3, true)).toBeCloseTo(0.6893, 4);
    expect(bkt.updateMastery(0.3, true, bkt.DEFAULT_PARAMS)).toBeCloseTo(0.6893, 4);
    expect(bkt.updateMastery(0.5, false)).toBeCloseTo(0.1911, 4);
  });

  test('a faster learner (higher pT) gains more from the same evidence', () => {
    const slow = bkt.updateMastery(0.3, true, { pT: 0.03 });
    const fast = bkt.updateMastery(0.3, true, { pT: 0.3 });
    expect(fast).toBeGreaterThan(slow);
  });

  test('solving a hard problem is stronger evidence than solving an easy one', () => {
    const easy = bkt.updateMastery(0.4, true, bkt.paramsForDifficulty(bkt.DEFAULT_PARAMS, 'easy'));
    const hard = bkt.updateMastery(0.4, true, bkt.paramsForDifficulty(bkt.DEFAULT_PARAMS, 'hard'));
    expect(hard).toBeGreaterThan(easy);
  });

  test('parameters are clamped into the identifiable region', () => {
    const p = bkt.normaliseParams({ pS: 0.9, pG: 0.9, pT: 5, pL0: -1 });
    expect(p.pS + p.pG).toBeLessThan(1);
    expect(p.pT).toBeLessThanOrEqual(0.5);
    expect(p.pL0).toBeGreaterThan(0);
  });

  test('forgetting decays mastery toward the prior and never below it', () => {
    const after = bkt.applyForgetting(0.9, 30, 1);
    expect(after).toBeLessThan(0.9);
    expect(after).toBeGreaterThanOrEqual(bkt.P_L0);
    expect(bkt.applyForgetting(0.9, 0, 1)).toBe(0.9);
  });

  test('repetition makes memory more durable (longer stability, later review)', () => {
    expect(bkt.stabilityDays(5)).toBeGreaterThan(bkt.stabilityDays(1));
    expect(bkt.daysUntilReview(5)).toBeGreaterThan(bkt.daysUntilReview(1));
  });

  test('attemptsToMastery is 0 when mastered, finite when not, and shrinks as mastery grows', () => {
    expect(bkt.attemptsToMastery(0.9)).toBe(0);
    const a = bkt.attemptsToMastery(0.3);
    const b = bkt.attemptsToMastery(0.6);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(0);
  });

  test('replayTrajectory ends where iterated updates end (no timestamps)', () => {
    const attempts = [true, true, false, true].map((c) => ({ correct: c }));
    const traj = bkt.replayTrajectory(attempts, bkt.DEFAULT_PARAMS, { forgetting: false });
    let p = bkt.P_L0;
    attempts.forEach((a) => { p = bkt.updateMastery(p, a.correct); });
    expect(traj[traj.length - 1].masteryP).toBeCloseTo(p, 10);
  });

  test('fitParams recovers a clearly faster learning rate from simulated data', () => {
    // deterministic pseudo-random simulation with true pT = 0.35 (much higher than the 0.09 default)
    let seed = 42;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const truth = { pL0: 0.2, pT: 0.35, pS: 0.08, pG: 0.2 };
    const sequences = [];
    for (let s = 0; s < 80; s++) {
      let known = rand() < truth.pL0;
      const seq = [];
      for (let t = 0; t < 8; t++) {
        seq.push(rand() < (known ? 1 - truth.pS : truth.pG));
        if (!known && rand() < truth.pT) known = true;
      }
      sequences.push(seq);
    }
    const fit = bkt.fitParams(sequences);
    expect(fit.fitted).toBe(true);
    expect(fit.params.pT).toBeGreaterThan(0.15); // well above the 0.09 default, despite prior shrinkage
    expect(fit.logLikelihood).toBeGreaterThan(fit.baselineLogLikelihood);
  });

  test('fitParams refuses to overfit tiny datasets and returns the prior', () => {
    const fit = bkt.fitParams([[true, false]]);
    expect(fit.fitted).toBe(false);
    expect(fit.params).toEqual(bkt.normaliseParams(bkt.DEFAULT_PARAMS));
  });

  test('learningVelocity is positive for improving trajectories and negative for declining ones', () => {
    const up = [0.3, 0.4, 0.5, 0.6, 0.7].map((m) => ({ masteryP: m }));
    const down = [0.7, 0.6, 0.5, 0.4, 0.3].map((m) => ({ masteryP: m }));
    expect(bkt.learningVelocity(up)).toBeGreaterThan(0);
    expect(bkt.learningVelocity(down)).toBeLessThan(0);
  });
});

describe('streakService', () => {
  const day = (offset, base = new Date('2026-09-21T12:00:00')) => // a Monday, so +0..+4 stay in one ISO week
     new Date(base.getTime() + offset * 86400000);
  const fresh = () => ({ streak: 0, longestStreak: 0, lastActiveDate: null, streakFreeze: { available: 1, lastRefillWeek: null, lastUsedAt: null } });

  test('consecutive days extend the streak; same day does not', () => {
    const u = fresh();
    streak.recordActivity(u, day(0));
    streak.recordActivity(u, day(0));
    expect(u.streak).toBe(1);
    streak.recordActivity(u, day(1));
    expect(u.streak).toBe(2);
  });

  test('a single missed day is covered by the weekly freeze', () => {
    const u = fresh();
    streak.recordActivity(u, day(0));
    streak.recordActivity(u, day(1));
    const r = streak.recordActivity(u, day(3)); // skipped day 2
    expect(r.freezeUsed).toBe(true);
    expect(u.streak).toBe(3);
    expect(u.streakFreeze.available).toBe(0);
  });

  test('a second missed day in the same week resets the streak', () => {
    const u = fresh();
    streak.recordActivity(u, day(0));
    streak.recordActivity(u, day(2)); // uses the freeze
    const r = streak.recordActivity(u, day(4)); // no freeze left
    expect(r.freezeUsed).toBe(false);
    expect(u.streak).toBe(1);
  });

  test('multiplier steps at 3 / 7 / 14 / 30 days', () => {
    expect([0, 2, 3, 7, 14, 30].map(streak.streakMultiplier)).toEqual([1, 1, 1.1, 1.25, 1.5, 2]);
  });

  test('describeStreak flags an at-risk streak and a broken one', () => {
    const now = new Date('2026-09-25T20:00:00');
    const base = { streak: 5, lastActiveDate: new Date('2026-09-24T10:00:00'), streakFreeze: { available: 1, lastRefillWeek: streak.isoWeekKey(now) } };
    expect(streak.describeStreak(base, now)).toMatchObject({ streak: 5, atRisk: true });
    const broken = { ...base, lastActiveDate: new Date('2026-09-20T10:00:00') };
    expect(streak.describeStreak(broken, now).streak).toBe(0);
  });
});

describe('judge output comparison', () => {
  test('exact requires the same trimmed string', () => {
    expect(outputsMatch('[1,2]\n', { expectedOutput: '[1,2]' })).toBe(true);
    expect(outputsMatch('[2,1]', { expectedOutput: '[1,2]' })).toBe(false);
  });
  test('unordered compares nested arrays as multisets', () => {
    expect(outputsMatch('[[3,2],[1]]', { expectedOutput: '[[1],[2,3]]' }, 'unordered')).toBe(true);
    expect(outputsMatch('[[3,2],[1,4]]', { expectedOutput: '[[1],[2,3]]' }, 'unordered')).toBe(false);
  });
  test('numeric tolerates floating-point noise', () => {
    expect(outputsMatch('2.5000001', { expectedOutput: '2.5' }, 'numeric')).toBe(true);
    expect(outputsMatch('2.6', { expectedOutput: '2.5' }, 'numeric')).toBe(false);
  });
  test('alternatives accept any listed answer', () => {
    expect(outputsMatch('aba', { expectedOutput: 'bab', alternatives: ['aba'] })).toBe(true);
  });
});

describe('experience quality scoring & heuristic parsing', () => {
  test('an empty draft scores low and asks for the essentials', () => {
    const q = scoreQuality({});
    expect(q.score).toBeLessThan(25);
    expect(q.suggestions.length).toBeGreaterThan(0);
  });

  test('a rich, specific draft scores high', () => {
    const q = scoreQuality({
      role: 'SDE-1', year: 2025, month: 'August', offerReceived: 'Yes',
      rounds: [1, 2, 3].map(() => ({ type: 'Technical', duration: '60 minutes', vibe: 'Friendly', topics: ['Graphs', 'DP'], questions: [{ text: 'Find the shortest path in a weighted grid with teleporters', topicTags: ['Graphs'] }, { text: 'Count palindromic partitions of a string modulo 1e9+7', topicTags: ['DP'] }] })),
      overallTips: 'Practise graph problems with extra state and explain your reasoning aloud before writing code. Test with your own edge cases every time you finish a solution.',
      resourcesUsed: 'LeetCode, NeetCode'
    });
    expect(q.score).toBeGreaterThanOrEqual(80);
  });

  test('heuristic parser extracts year, month, outcome, role and rounds from prose', () => {
    const p = heuristicParse(`I interviewed at Amazon in August 2024 for SDE-1. I got the offer!\n\nRound 1: Online Assessment (90 minutes)\nGiven an array, find the longest subarray with sum k?\nImplement an LRU cache.\n\nRound 2: Technical interview\nDesign a parking lot. Tip: practise OOP and Leadership Principles.`);
    expect(p.year).toBe(2024);
    expect(p.month).toBe('August');
    expect(p.offerReceived).toBe('Yes');
    expect(p.role).toBe('SDE-1');
    expect(p.rounds.length).toBeGreaterThanOrEqual(2);
    expect(p.rounds[0].type).toBe('OA');
  });
});

describe('statistics helpers', () => {
  test('Wilson interval is wide for small n and narrows as n grows', () => {
    const small = wilson(3, 5);
    const large = wilson(60, 100);
    expect(small.high - small.low).toBeGreaterThan(large.high - large.low);
    expect(wilson(0, 0)).toBeNull();
  });

  test('summariseExperiences reports topic percentages of reports, not raw mentions', () => {
    const exps = [
      { offerReceived: 'Yes', difficulty: 'Hard', year: 2024, role: 'SDE-1', rounds: [{ type: 'Technical', topics: ['Graphs', 'Graphs'], questions: [] }] },
      { offerReceived: 'No', difficulty: 'Medium', year: 2024, role: 'SDE-1', rounds: [{ type: 'OA', topics: ['Arrays'], questions: [] }] }
    ];
    const s = summariseExperiences(exps);
    expect(s.topTopics.find((t) => t.topic === 'Graphs').pct).toBe(50);
    expect(s.offerRate).toBe(50);
    expect(s.offerRateCI.low).toBeLessThan(50);
    expect(s.offerRateCI.high).toBeGreaterThan(50);
  });

  test('visitProbability rewards recency and consecutive visits, and is never 0 or 1', () => {
    const consistent = visitProbability(new Set([2022, 2023, 2024, 2025, 2026]), 2026);
    const lapsed = visitProbability(new Set([2022, 2023]), 2026);
    const once = visitProbability(new Set([2026]), 2026);
    expect(consistent).toBeGreaterThan(once);
    expect(once).toBeGreaterThan(lapsed);
    expect(consistent).toBeLessThan(1);
    expect(lapsed).toBeGreaterThan(0);
  });
});
