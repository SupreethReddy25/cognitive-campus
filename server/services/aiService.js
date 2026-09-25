/**
 * AI Service — one place for every LLM call in the platform.
 *
 * Provider chain (first that works wins):
 *   1. The student's own Gemini key (BYOK, decrypted server-side only)
 *   2. The platform Gemini key (GEMINI_API_KEY)
 *   3. Groq (GROQ_API_KEY) as a fast fallback when Gemini is overloaded (503/429)
 *
 * Failure handling — callers never see raw provider errors. `complete()` throws an `AiError`
 * whose `.code` is one of:
 *   NO_KEY        no provider is configured at all (UI should point at Profile → BYOK)
 *   RATE_LIMITED  every configured provider is rate limiting us
 *   UNAVAILABLE   providers errored / timed out
 *   BAD_RESPONSE  the model returned unparseable output (JSON mode)
 *
 * Every feature built on this ships a deterministic fallback so the product still works with
 * no AI at all.
 *
 * @module aiService
 */

const axios = require('axios');
const User = require('../models/User');
const encryptionService = require('./encryptionService');
const logger = require('../utils/logger');

const GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-flash-latest,gemini-3.1-flash-lite').split(',').map((s) => s.trim()).filter(Boolean);
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

class AiError extends Error {
  constructor(code, message, meta = {}) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.meta = meta;
  }
}

/** Human-friendly explanation for each failure code (shown in the UI). */
const FRIENDLY = {
  NO_KEY: 'AI is not configured. Add your free Gemini API key in Profile → AI Settings to unlock AI features.',
  RATE_LIMITED: 'The AI provider is rate-limiting requests right now. Try again in a minute, or add your own Gemini key in Profile for dedicated quota.',
  UNAVAILABLE: 'The AI service is temporarily unavailable. Showing a smart offline answer instead.',
  BAD_RESPONSE: 'The AI returned an unexpected response. Showing a smart offline answer instead.'
};

const friendly = (code) => FRIENDLY[code] || FRIENDLY.UNAVAILABLE;

/** Strip ``` fences and pull the first JSON object/array out of a model reply. */
const extractJSON = (raw) => {
  let text = String(raw || '').trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    const obj = text.match(/\{[\s\S]*\}/);
    const arr = text.match(/\[[\s\S]*\]/);
    const candidate = obj && (!arr || obj.index <= arr.index) ? obj[0] : arr && arr[0];
    if (candidate) {
      try { return JSON.parse(candidate); } catch { /* fallthrough */ }
    }
    throw new AiError('BAD_RESPONSE', 'Model returned malformed JSON', { excerpt: text.slice(0, 200) });
  }
};

/** Resolve the BYOK key for a user (or null). */
const getUserKey = async (userId) => {
  if (!userId) return null;
  try {
    const user = await User.findById(userId).select('encryptedGeminiKey keyIv keyAuthTag').lean();
    if (user?.encryptedGeminiKey && user.keyIv && user.keyAuthTag) {
      return encryptionService.decryptKey(user.encryptedGeminiKey, user.keyIv, user.keyAuthTag);
    }
  } catch (err) {
    logger.warn('BYOK key decryption failed', { error: err.message });
  }
  return null;
};

/** Describe which AI paths are usable for a user (drives UI badges). */
const getStatus = async (userId) => {
  const byok = await getUserKey(userId);
  return {
    byok: !!byok,
    platformGemini: !!process.env.GEMINI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    available: !!(byok || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callGemini = async ({ key, model, system, prompt, json, temperature, maxTokens, timeoutMs }) => {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: 'application/json' } : {}),
      thinkingConfig: { thinkingBudget: 0 }
    }
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, body, {
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    timeout: timeoutMs
  });
  const text = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new AiError('BAD_RESPONSE', 'Empty Gemini response');
  return text;
};

const callGroq = async ({ system, prompt, json, temperature, maxTokens, timeoutMs }) => {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {})
    },
    { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: timeoutMs }
  );
  const text = res.data?.choices?.[0]?.message?.content || '';
  if (!text) throw new AiError('BAD_RESPONSE', 'Empty Groq response');
  return text;
};

/**
 * Run a completion through the provider chain.
 *
 * @param {object} opts
 * @param {string} [opts.userId]      enables BYOK lookup
 * @param {string} [opts.system]
 * @param {string} opts.prompt
 * @param {boolean} [opts.json=false] request + parse JSON
 * @param {number} [opts.temperature=0.4]
 * @param {number} [opts.maxTokens=2048]
 * @param {number} [opts.timeoutMs=25000]
 * @returns {Promise<{text:string, data:any, provider:string, model:string, byok:boolean}>}
 * @throws {AiError}
 */
const complete = async (opts) => {
  const { userId, system, prompt, json = false, temperature = 0.4, maxTokens = 2048, timeoutMs = 25000 } = opts;
  const byokKey = await getUserKey(userId);

  const attempts = [];
  if (byokKey) GEMINI_MODELS.forEach((m) => attempts.push({ provider: 'gemini', model: m, key: byokKey, byok: true }));
  if (process.env.GEMINI_API_KEY) GEMINI_MODELS.slice(0, 2).forEach((m) => attempts.push({ provider: 'gemini', model: m, key: process.env.GEMINI_API_KEY, byok: false }));
  if (process.env.GROQ_API_KEY) attempts.push({ provider: 'groq', model: GROQ_MODEL, byok: false });

  if (attempts.length === 0) throw new AiError('NO_KEY', friendly('NO_KEY'));

  let sawRateLimit = false;
  let lastErr = null;
  const deadKeys = new Set(); // don't retry a key the API says is invalid

  for (const a of attempts) {
    if (a.key && deadKeys.has(a.key)) continue;
    try {
      const args = { key: a.key, model: a.model, system, prompt, json, temperature, maxTokens, timeoutMs };
      const text = a.provider === 'gemini' ? await callGemini(args) : await callGroq(args);
      const data = json ? extractJSON(text) : null;
      return { text, data, provider: a.provider, model: a.model, byok: a.byok };
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (status === 429) sawRateLimit = true;
      if (status === 400 || status === 401 || status === 403) {
        // Bad/expired key or invalid request — skip other models on the same key.
        if (a.key) deadKeys.add(a.key);
        logger.warn(`AI ${a.provider} auth/request error (${status})`, { model: a.model, byok: a.byok, body: JSON.stringify(err.response?.data || '').slice(0, 200) });
        continue;
      }
      if (status === 503 || status === 500) await sleep(400);
      if (err instanceof AiError && err.code === 'BAD_RESPONSE') {
        logger.warn('AI returned malformed output', { provider: a.provider, model: a.model });
        continue;
      }
      logger.warn(`AI ${a.provider}/${a.model} failed`, { status, error: err.message });
    }
  }

  if (sawRateLimit) throw new AiError('RATE_LIMITED', friendly('RATE_LIMITED'));
  if (lastErr instanceof AiError && lastErr.code === 'BAD_RESPONSE') throw lastErr;
  throw new AiError('UNAVAILABLE', friendly('UNAVAILABLE'), { cause: lastErr?.message });
};

/**
 * Cheap key check: listing one model costs nothing and distinguishes a bad key (400/403)
 * from a network problem.
 * @returns {Promise<{valid:boolean|null, message:string}>} valid=null means "couldn't tell"
 */
const validateGeminiKey = async (key) => {
  try {
    await axios.get('https://generativelanguage.googleapis.com/v1beta/models', { params: { pageSize: 1 }, headers: { 'x-goog-api-key': key }, timeout: 8000 });
    return { valid: true, message: 'Key verified with Google.' };
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 401 || status === 403) return { valid: false, message: 'Google rejected this key. Create a free one at aistudio.google.com/apikey and paste it again.' };
    return { valid: null, message: 'Saved, but we could not reach Google to verify the key right now.' };
  }
};

/**
 * Wrapper for features with a deterministic fallback: tries the AI, returns
 * `{ ...fallbackResult, ai: {used:false, reason, message} }` if it can't.
 */
const withFallback = async (aiRunner, fallbackRunner) => {
  try {
    const result = await aiRunner();
    return { result, ai: { used: true, provider: result?.__provider || null } };
  } catch (err) {
    const code = err instanceof AiError ? err.code : 'UNAVAILABLE';
    if (!(err instanceof AiError)) logger.error('Unexpected AI runner error', { error: err.message, stack: err.stack });
    const result = await fallbackRunner();
    return { result, ai: { used: false, reason: code, message: friendly(code), needsKey: code === 'NO_KEY' } };
  }
};

module.exports = { complete, getStatus, getUserKey, validateGeminiKey, withFallback, extractJSON, AiError, friendly };
