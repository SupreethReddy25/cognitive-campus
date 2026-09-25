/**
 * Bayesian Knowledge Tracing (BKT) Engine — v2 "adaptive hybrid"
 *
 * Pure function module — no database calls, no imports from other project files.
 *
 * Why BKT is kept (and not swapped for DKT):
 *   - Deep Knowledge Tracing needs tens of thousands of interaction sequences to beat BKT;
 *     a campus cohort produces hundreds. With that little data DKT overfits and is opaque.
 *   - BKT gives a *probability a student has learned a skill*, which maps 1:1 onto the
 *     mastery / unlock thresholds the product is built around, and it is explainable.
 *
 * What v2 adds on top of the textbook model (the "hybrid"):
 *   1. Learned parameters — P(L0), P(T), P(S), P(G) are fitted per skill from real attempt
 *      sequences (`fitParams`: Bayesian-regularised maximum likelihood via coordinate grid search).
 *   2. Difficulty-aware evidence — guess/slip are modulated by problem difficulty, so solving
 *      a hard problem is stronger evidence of mastery than solving an easy one (PFA-flavoured).
 *   3. Forgetting — mastery decays with idle time on an Ebbinghaus-style curve whose stability
 *      grows with repetition; this drives spaced-repetition scheduling.
 *   4. Forward prediction — P(next attempt correct), expected attempts to mastery.
 *
 * All of it degrades gracefully to the original textbook maths: `updateMastery(p, correct)`
 * with no params is exactly the classic P(L0)=0.3, P(T)=0.09, P(S)=0.1, P(G)=0.2 update.
 *
 * @module bktEngine
 */

// ─── Default BKT parameters (textbook / prior) ──────────────────
const P_L0 = 0.3;
const P_T = 0.09;
const P_S = 0.1;
const P_G = 0.2;

const MASTERY_THRESHOLD = 0.85;
const UNLOCK_THRESHOLD = 0.70;

const DEFAULT_PARAMS = Object.freeze({ pL0: P_L0, pT: P_T, pS: P_S, pG: P_G });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Normalises a partial params object onto the defaults and clamps into the
 * identifiable region (guess + slip < 1 keeps BKT from degenerating).
 */
const normaliseParams = (params = {}) => {
  const p = { ...DEFAULT_PARAMS, ...params };
  const pS = clamp(p.pS, 0.01, 0.35);
  const pG = clamp(p.pG, 0.02, 0.4);
  return {
    pL0: clamp(p.pL0, 0.02, 0.9),
    pT: clamp(p.pT, 0.01, 0.5),
    pS,
    pG: Math.min(pG, 0.95 - pS)
  };
};

/**
 * Difficulty-aware guess/slip. Easy problems are easier to guess/pass by pattern-matching
 * (higher guess, lower slip); hard problems are the reverse.
 */
const DIFFICULTY_ADJUST = {
  easy: { g: 1.25, s: 0.7 },
  medium: { g: 1.0, s: 1.0 },
  hard: { g: 0.55, s: 1.3 }
};

const paramsForDifficulty = (params, difficulty) => {
  const base = normaliseParams(params);
  const adj = DIFFICULTY_ADJUST[difficulty];
  if (!adj) return base;
  return normaliseParams({ ...base, pG: base.pG * adj.g, pS: base.pS * adj.s });
};

/**
 * Applies the BKT update equation for one attempt.
 *
 * @param {number} currentMasteryP - P(Ln)
 * @param {boolean} isCorrect
 * @param {object} [params] - {pL0,pT,pS,pG}; defaults to the textbook values
 * @returns {number} P(Ln+1), clamped to [0,1]
 */
const updateMastery = (currentMasteryP, isCorrect, params = DEFAULT_PARAMS) => {
  const { pT, pS, pG } = params === DEFAULT_PARAMS ? DEFAULT_PARAMS : normaliseParams(params);
  let evidence;

  if (isCorrect) {
    const numerator = currentMasteryP * (1 - pS);
    const denominator = numerator + (1 - currentMasteryP) * pG;
    evidence = denominator === 0 ? 0 : numerator / denominator;
  } else {
    const numerator = currentMasteryP * pS;
    const denominator = numerator + (1 - currentMasteryP) * (1 - pG);
    evidence = denominator === 0 ? 0 : numerator / denominator;
  }

  const newMastery = evidence + (1 - evidence) * pT;
  return clamp(newMastery, 0, 1);
};

/**
 * Hint penalty: each hint used costs 1.5 percentage points of mastery.
 */
const applyHintPenalty = (masteryP, hintsUsed) => clamp(masteryP - (hintsUsed * 0.015), 0, 1);

const isMastered = (masteryP) => masteryP >= MASTERY_THRESHOLD;
const isUnlockable = (masteryP) => masteryP >= UNLOCK_THRESHOLD;

/**
 * Batch update kept for backwards compatibility.
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

// ─── Forgetting curve (spaced repetition) ───────────────────────

/**
 * Memory stability in days for a skill practised `attempts` times.
 * Stability doubles-ish with each successful repetition (SM-2 / Ebbinghaus style)
 * and is capped so nothing is remembered "forever".
 */
const stabilityDays = (correctAttempts = 0) => clamp(2 * Math.pow(1.7, Math.max(0, correctAttempts)), 2, 120);

/**
 * Applies forgetting: mastery decays toward the prior P(L0) with retention
 * R = exp(-t / stability). Never decays below the prior.
 */
const applyForgetting = (masteryP, daysSinceLastPractice, correctAttempts = 0, params = DEFAULT_PARAMS) => {
  if (!daysSinceLastPractice || daysSinceLastPractice <= 0) return masteryP;
  const floor = normaliseParams(params).pL0;
  if (masteryP <= floor) return masteryP;
  const retention = Math.exp(-daysSinceLastPractice / stabilityDays(correctAttempts));
  return floor + (masteryP - floor) * retention;
};

/**
 * Days until retention of the skill drops to `targetRetention` — i.e. when a
 * spaced-repetition review is due.
 */
const daysUntilReview = (correctAttempts = 0, targetRetention = 0.8) =>
  -Math.log(targetRetention) * stabilityDays(correctAttempts);

// ─── Forward predictions ────────────────────────────────────────

/** P(next attempt correct | mastery, params). */
const predictCorrect = (masteryP, params = DEFAULT_PARAMS) => {
  const { pS, pG } = normaliseParams(params);
  return masteryP * (1 - pS) + (1 - masteryP) * pG;
};

/**
 * Expected number of *practice attempts* until mastery crosses the threshold,
 * computed by rolling the expected-mastery trajectory forward (mean-field: each step
 * blends the correct/incorrect posteriors by their predicted probability).
 *
 * @returns {number|null} attempts, 0 if already mastered, null if > cap
 */
const attemptsToMastery = (masteryP, params = DEFAULT_PARAMS, threshold = MASTERY_THRESHOLD, cap = 60) => {
  if (masteryP >= threshold) return 0;
  const norm = normaliseParams(params);
  let p = masteryP;
  for (let n = 1; n <= cap; n++) {
    const pc = predictCorrect(p, norm);
    p = pc * updateMastery(p, true, norm) + (1 - pc) * updateMastery(p, false, norm);
    if (p >= threshold) return n;
  }
  return null;
};

// ─── Parameter learning ─────────────────────────────────────────

/**
 * Log-likelihood of one outcome sequence under the given params (forward algorithm).
 *
 * @param {boolean[]} outcomes - chronological correct/incorrect
 */
const sequenceLogLikelihood = (outcomes, params) => {
  const { pL0, pT, pS, pG } = normaliseParams(params);
  let p = pL0;
  let ll = 0;
  for (const correct of outcomes) {
    const pc = p * (1 - pS) + (1 - p) * pG;
    ll += Math.log(Math.max(1e-9, correct ? pc : 1 - pc));
    p = updateMastery(p, correct, { pL0, pT, pS, pG });
  }
  return ll;
};

const totalLogLikelihood = (sequences, params) =>
  sequences.reduce((sum, seq) => sum + sequenceLogLikelihood(seq, params), 0);

/**
 * Bayesian-regularised parameter fit.
 *
 * Maximises  logLik(sequences | θ) + Σ log Beta-ish prior(θᵢ)  by coordinate ascent over a
 * grid. The prior pulls each parameter toward the textbook default with strength
 * `priorStrength` pseudo-observations, so a skill with 5 sequences barely moves while one
 * with 500 is governed by the data.
 *
 * @param {boolean[][]} sequences - chronological outcomes per student for one skill
 * @param {object} [prior=DEFAULT_PARAMS]
 * @param {object} [opts]
 * @returns {{params: object, logLikelihood: number, baselineLogLikelihood: number, observations: number, sequences: number}}
 */
const fitParams = (sequences, prior = DEFAULT_PARAMS, opts = {}) => {
  const { priorStrength = 12, sweeps = 3 } = opts;
  const usable = sequences.filter((s) => s.length >= 2);
  const observations = usable.reduce((n, s) => n + s.length, 0);
  const base = normaliseParams(prior);
  const baselineLL = totalLogLikelihood(usable, base);

  if (usable.length < 3 || observations < 12) {
    return { params: base, logLikelihood: baselineLL, baselineLogLikelihood: baselineLL, observations, sequences: usable.length, fitted: false };
  }

  const grids = {
    pL0: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7],
    pT: [0.02, 0.04, 0.06, 0.08, 0.1, 0.13, 0.16, 0.2, 0.25, 0.3, 0.4],
    pS: [0.02, 0.05, 0.08, 0.1, 0.13, 0.16, 0.2, 0.25, 0.3],
    pG: [0.03, 0.06, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35]
  };

  // Gaussian-ish log prior centred on the default; strength scales with priorStrength.
  const spread = { pL0: 0.2, pT: 0.1, pS: 0.08, pG: 0.1 };
  const logPrior = (name, value) => {
    const z = (value - base[name]) / spread[name];
    return -0.5 * priorStrength * z * z;
  };

  let best = { ...base };
  const score = (theta) => {
    const t = normaliseParams(theta);
    return totalLogLikelihood(usable, t) + Object.keys(grids).reduce((s, k) => s + logPrior(k, t[k]), 0);
  };
  let bestScore = score(best);

  for (let sweep = 0; sweep < sweeps; sweep++) {
    for (const name of Object.keys(grids)) {
      for (const candidate of grids[name]) {
        const trial = { ...best, [name]: candidate };
        const s = score(trial);
        if (s > bestScore + 1e-9) {
          bestScore = s;
          best = normaliseParams(trial);
        }
      }
    }
  }

  return {
    params: best,
    logLikelihood: totalLogLikelihood(usable, best),
    baselineLogLikelihood: baselineLL,
    observations,
    sequences: usable.length,
    fitted: true
  };
};

/**
 * Replays a chronological list of attempts through BKT, returning the mastery
 * trajectory. Applies forgetting between attempts if timestamps are supplied.
 *
 * @param {Array<{correct:boolean, at?:Date|string|number, difficulty?:string, hints?:number}>} attempts
 * @param {object} [params]
 * @param {{forgetting?: boolean}} [opts]
 * @returns {Array<{at:any, masteryP:number, correct:boolean}>}
 */
const replayTrajectory = (attempts, params = DEFAULT_PARAMS, opts = {}) => {
  const { forgetting = true } = opts;
  const norm = normaliseParams(params);
  let p = norm.pL0;
  let correctCount = 0;
  let lastAt = null;
  const out = [];

  for (const a of attempts) {
    const at = a.at ? new Date(a.at).getTime() : null;
    if (forgetting && lastAt && at) {
      const days = (at - lastAt) / 86400000;
      p = applyForgetting(p, days, correctCount, norm);
    }
    p = updateMastery(p, !!a.correct, paramsForDifficulty(norm, a.difficulty));
    if (a.hints) p = applyHintPenalty(p, a.hints);
    if (a.correct) correctCount++;
    if (at) lastAt = at;
    out.push({ at: a.at, masteryP: p, correct: !!a.correct });
  }
  return out;
};

/**
 * Learning velocity: mastery points gained per attempt, via least-squares slope
 * over the trailing window of a trajectory.
 */
const learningVelocity = (trajectory, window = 8) => {
  const pts = trajectory.slice(-window).map((t) => t.masteryP);
  if (pts.length < 3) return 0;
  const n = pts.length;
  const xMean = (n - 1) / 2;
  const yMean = pts.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  pts.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
};

module.exports = {
  P_L0,
  P_T,
  P_S,
  P_G,
  MASTERY_THRESHOLD,
  UNLOCK_THRESHOLD,
  DEFAULT_PARAMS,
  normaliseParams,
  paramsForDifficulty,
  updateMastery,
  applyHintPenalty,
  isMastered,
  isUnlockable,
  computeBatchUpdate,
  stabilityDays,
  applyForgetting,
  daysUntilReview,
  predictCorrect,
  attemptsToMastery,
  sequenceLogLikelihood,
  fitParams,
  replayTrajectory,
  learningVelocity
};
