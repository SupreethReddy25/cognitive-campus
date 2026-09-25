/**
 * AI Mentor Service
 *
 * 1. `getMentorNudge` — progressive, Socratic help in three depths:
 *      depth 1  HINT         a conceptual nudge, no algorithm named
 *      depth 2  APPROACH     the technique + where the student's logic goes wrong
 *      depth 3  PSEUDOCODE   step-by-step plan in plain language (never final code)
 *    Results are cached per (problem, language, code, depth). Free users get a daily AI budget;
 *    BYOK users are unmetered. When the AI is unavailable the mentor degrades to the problem's own
 *    curated hints / editorial so a hint is *always* delivered.
 *
 * 2. `generateDashboardQuote` — personalised greeting + study tip for the dashboard.
 *
 * @module aiMentorService
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const User = require('../models/User');
const Problem = require('../models/Problem');
const AiNudgeCache = require('../models/AiNudgeCache');
const ai = require('./aiService');

const FREE_DAILY_NUDGES = parseInt(process.env.AI_DAILY_NUDGES || '15', 10);

const DEPTH_LABEL = { 1: 'hint', 2: 'approach', 3: 'pseudocode' };

// ─── Deterministic fallback ladder ────────────────────────────

const fallbackNudge = (problem, depth, lastError) => {
  const hints = problem.hints || [];
  const ed = problem.editorial || {};
  let text;

  if (lastError) {
    text = `Your last run crashed: "${String(lastError).split('\n')[0].slice(0, 160)}". Fix that first — read the line number in the message and check for undefined variables, off-by-one indexes and missing returns.`;
  } else if (depth === 1) {
    text = hints[0] || ed.intuition || 'Re-read the constraints, then trace the first example by hand. What do you do at each step that a program could repeat?';
  } else if (depth === 2) {
    text = hints[1] || ed.approach || hints[0] || 'Think about which data structure makes the repeated operation cheap, then check your loop against the smallest and largest inputs.';
  } else {
    const steps = ed.steps && ed.steps.length ? ed.steps : hints.slice(2);
    text = steps.length
      ? `Plan:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : hints[hints.length - 1] || 'Write the brute force first, then find what work repeats and cache or reorder it.';
  }
  return { nudgeText: text, targetLine: null };
};

// ─── Nudge ────────────────────────────────────────────────────

const PROMPT_RULES = {
  1: 'Give ONE high-level conceptual hint (max 2 sentences). Do NOT name the algorithm or data structure outright; guide them to notice the key observation.',
  2: 'Name the approach/technique to use and point at the specific flaw or missing step in THEIR code (max 3 sentences). No code.',
  3: 'Give a numbered pseudocode plan of 4-8 short steps in plain English describing exactly what to implement. NO real code, no code blocks. Keep it under 90 words.'
};

/**
 * @returns {Promise<{nudgeText:string, targetLine:number|null, depth:number, label:string, source:'ai'|'curated'|'cache', ai:object, remaining:number|null}>}
 */
const getMentorNudge = async (userId, problem, userCode, language, nudgeDepth = 1, lastError = null) => {
  const depth = Math.min(3, Math.max(1, parseInt(nudgeDepth, 10) || 1));
  const base = { depth, label: DEPTH_LABEL[depth] };

  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const status = await ai.getStatus(userId);

    // ── quota (free users only) ──
    let remaining = null;
    if (!status.byok) {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastDay = user.lastNudgeDate ? new Date(user.lastNudgeDate).setHours(0, 0, 0, 0) : null;
      if (today !== lastDay) {
        user.dailyNudgesUsed = 0;
        user.lastNudgeDate = new Date();
        await user.save();
      }
      remaining = Math.max(0, FREE_DAILY_NUDGES - user.dailyNudgesUsed);
    }

    // ── cache ──
    const hashInput = `${userCode.trim()}_${depth}_${lastError || 'none'}`;
    const codeHash = crypto.createHash('sha256').update(hashInput).digest('hex');
    const cached = await AiNudgeCache.findOne({ problemId: problem._id, language, codeHash }).lean();
    if (cached) {
      return { ...base, nudgeText: cached.nudgeText, targetLine: cached.targetLine, source: 'cache', ai: { used: true, cached: true }, remaining };
    }

    // ── AI unavailable / over quota → curated ladder ──
    if (!status.available) {
      const f = fallbackNudge(problem, depth, lastError);
      return { ...base, ...f, source: 'curated', ai: { used: false, reason: 'NO_KEY', message: ai.friendly('NO_KEY'), needsKey: true }, remaining };
    }
    if (remaining !== null && remaining <= 0) {
      const f = fallbackNudge(problem, depth, lastError);
      return {
        ...base,
        ...f,
        source: 'curated',
        ai: { used: false, reason: 'QUOTA', message: `You've used today's ${FREE_DAILY_NUDGES} free AI hints. Add your own free Gemini key in Profile for unlimited hints — showing the curated hint instead.`, needsKey: true },
        remaining: 0
      };
    }

    const numbered = userCode.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n');
    const errorBlock = lastError
      ? `The student's last run failed with:\n"${String(lastError).slice(0, 400)}"\nPoint targetLine at the line causing the crash and explain the error in plain English. Do not discuss complexity.`
      : 'If their code is already correct, do not hint — ask one follow-up question about time/space complexity instead and set targetLine to null.';

    const prompt = `Problem: ${problem.title}
${String(problem.description).slice(0, 1800)}

Language: ${language}
Student's current code (line-numbered):
${numbered.slice(0, 4000)}

${errorBlock}

Nudge level ${depth}/3 (${DEPTH_LABEL[depth]}): ${PROMPT_RULES[depth]}
Tone: a senior CS student helping a friend — direct, warm, no jargon dumps. Never reveal a full solution.
Respond ONLY as JSON: {"nudgeText": string, "targetLine": number|null}  (targetLine is the 1-indexed line of the student's code where the main issue is, or null).`;

    let out;
    try {
      out = await ai.complete({
        userId,
        system: 'You are Cogni, a Socratic coding mentor. You give progressively more specific help but never write the final solution.',
        prompt,
        json: true,
        temperature: 0.4,
        maxTokens: 500,
        timeoutMs: 20000
      });
    } catch (err) {
      const code = err instanceof ai.AiError ? err.code : 'UNAVAILABLE';
      const f = fallbackNudge(problem, depth, lastError);
      return { ...base, ...f, source: 'curated', ai: { used: false, reason: code, message: ai.friendly(code), needsKey: code === 'NO_KEY' }, remaining };
    }

    const d = out.data || {};
    const nudgeText = String(d.nudgeText || d.nudge || d.hint || '').trim();
    if (!nudgeText) {
      const f = fallbackNudge(problem, depth, lastError);
      return { ...base, ...f, source: 'curated', ai: { used: false, reason: 'BAD_RESPONSE', message: ai.friendly('BAD_RESPONSE') }, remaining };
    }
    const lineCount = userCode.split('\n').length;
    const targetLine = Number.isInteger(d.targetLine) && d.targetLine >= 1 && d.targetLine <= lineCount ? d.targetLine : null;

    await AiNudgeCache.create({ problemId: problem._id, codeHash, language, nudgeText, targetLine }).catch(() => {});

    if (!out.byok) {
      user.dailyNudgesUsed += 1;
      await user.save();
      if (remaining !== null) remaining = Math.max(0, remaining - 1);
    }

    return { ...base, nudgeText, targetLine, source: 'ai', ai: { used: true, provider: out.provider, model: out.model, byok: out.byok }, remaining };
  } catch (error) {
    logger.error('Mentor nudge failed', { error: error.message, stack: error.stack });
    const f = fallbackNudge(problem, depth, lastError);
    return { ...base, ...f, source: 'curated', ai: { used: false, reason: 'UNAVAILABLE', message: ai.friendly('UNAVAILABLE') }, remaining: null };
  }
};

// ─── Dashboard quote ──────────────────────────────────────────

const COLORS = { intense: '#ef4444', growth: '#34d399', victory: '#fbbf24', power: '#a78bfa', clarity: '#38bdf8', urgency: '#f97316' };

/**
 * Deterministic, context-aware greeting so the dashboard is always personal — with or without AI.
 */
const contextualFallback = (ctx) => {
  const hour = new Date().getHours();
  const part = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
  const name = ctx.firstName || 'there';
  const pool = [];

  if (ctx.streak >= 7) pool.push({ text: `${ctx.streak} days deep. Stay `, highlight: 'relentless', highlightColor: COLORS.intense, suffix: '.' });
  else if (ctx.streak >= 3) pool.push({ text: `${ctx.streak}-day streak — keep the `, highlight: 'fire', highlightColor: COLORS.urgency, suffix: ' alive.' });
  if (ctx.streakAtRisk) pool.push({ text: 'Your streak needs you ', highlight: 'today', highlightColor: COLORS.urgency, suffix: '.' });
  if (ctx.weakest && ctx.weakest.masteryP < 0.5) pool.push({ text: `Time to tame `, highlight: ctx.weakest.name, highlightColor: COLORS.power, suffix: '.' });
  if (ctx.lastProblemTitle) pool.push({ text: 'Unfinished business with ', highlight: ctx.lastProblemTitle, highlightColor: COLORS.clarity, suffix: '?' });
  pool.push(
    { text: `Good ${part}, ${name}. Let's `, highlight: 'build', highlightColor: COLORS.growth, suffix: '.' },
    { text: 'Ready to ', highlight: 'conquer', highlightColor: COLORS.victory, suffix: '?' },
    { text: 'Logic is ', highlight: 'power', highlightColor: COLORS.power, suffix: '.' }
  );
  const pick = pool[Math.floor(Date.now() / 3600000) % pool.length];

  let tip;
  if (ctx.reviewDue) tip = `${ctx.reviewDue} is due for review — a 10-minute refresh now saves an hour later (spaced repetition).`;
  else if (ctx.weakest && ctx.weakest.masteryP < 0.6) tip = `Your ${ctx.weakest.name} mastery is ${Math.round(ctx.weakest.masteryP * 100)}%. Two focused problems today would move it noticeably.`;
  else if (ctx.streakAtRisk) tip = 'One solved problem keeps your streak alive — even an Easy counts.';
  else tip = 'Trace the first example by hand before coding. It exposes the pattern in under two minutes.';

  return { ...pick, tip, source: 'contextual' };
};

const quoteCache = new Map();

/**
 * @param {string} userId
 * @param {object} ctx  from analytics: {firstName, streak, streakAtRisk, weakest{name,masteryP}, reviewDue, lastProblemTitle, lastPath, level}
 */
const generateDashboardQuote = async (userId, ctx = {}) => {
  const fallback = () => contextualFallback(ctx);
  const cacheKey = `${userId}:${new Date().toISOString().slice(0, 13)}`;
  if (quoteCache.has(cacheKey)) return quoteCache.get(cacheKey);

  try {
    const prompt = `Write a short dashboard greeting for a student on a DSA / placement-prep platform.
Student: ${ctx.firstName || 'the student'}, level ${ctx.level || 1}, streak ${ctx.streak || 0} days${ctx.streakAtRisk ? ' (at risk today)' : ''}.
${ctx.weakest ? `Weakest skill: ${ctx.weakest.name} (${Math.round(ctx.weakest.masteryP * 100)}% mastery).` : ''}
${ctx.reviewDue ? `Due for spaced-repetition review: ${ctx.reviewDue}.` : ''}
${ctx.lastProblemTitle ? `Was last working on: "${ctx.lastProblemTitle}".` : ''}
Local time of day: ${new Date().getHours()}:00.

Return ONLY JSON:
{"text": "prefix text ending with a space", "highlight": "exactly one word", "highlightColor": "#hex", "suffix": "punctuation or short tail", "tip": "one concrete, actionable study tip for THIS student in <= 28 words"}
The greeting (text + highlight + suffix) must be 3-7 words. highlightColor by mood: #ef4444 intense, #34d399 growth, #fbbf24 victory, #a78bfa power, #38bdf8 clarity, #f97316 urgency. Be varied and never cheesy.`;
    const out = await ai.complete({ userId, prompt, json: true, temperature: 1, maxTokens: 300, timeoutMs: 9000 });
    const d = out.data;
    if (d && d.text && d.highlight && /^#[0-9a-f]{6}$/i.test(d.highlightColor || '')) {
      const quote = {
        text: String(d.text),
        highlight: String(d.highlight).split(/\s+/)[0],
        highlightColor: d.highlightColor,
        suffix: String(d.suffix || '.'),
        tip: String(d.tip || fallback().tip),
        source: 'ai'
      };
      quoteCache.set(cacheKey, quote);
      return quote;
    }
    throw new ai.AiError('BAD_RESPONSE', 'quote shape');
  } catch (err) {
    if (!(err instanceof ai.AiError)) logger.error('Dashboard quote failed', { error: err.message });
    const q = fallback();
    quoteCache.set(cacheKey, q);
    return q;
  }
};

module.exports = { getMentorNudge, generateDashboardQuote, contextualFallback, fallbackNudge };
