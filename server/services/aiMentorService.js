/**
 * AI Mentor Service
 * 
 * Invokes Gemini 1.5 Flash to act as a DSA coach providing strict, context-aware nudges.
 * Enforces daily usage quotas and utilizes MongoDB caching to prevent redundant LLM queries.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const logger = require('../utils/logger');
const User = require('../models/User');
const AiNudgeCache = require('../models/AiNudgeCache');

const getFallbackHint = (problem) => {
  if (problem.hints && problem.hints.length > 0) {
    const randomIndex = Math.floor(Math.random() * problem.hints.length);
    return { nudgeText: problem.hints[randomIndex], targetLine: null };
  }
  return { nudgeText: 'The Mentor is currently resting. Review your loop constraints and edge cases.', targetLine: null };
};

/**
 * Sends code to Gemini and retrieves a tiny, non-solution nudge.
 * 
 * @param {string} userId - User making the request
 * @param {object} problem - Mongoose Problem doc
 * @param {string} userCode - Code submitted by the user
 * @param {string} language - Language key
 */
const getMentorNudge = async (userId, problem, userCode, language, nudgeDepth = 1, lastError = null) => {
  try {
    // 1. Quota Enforcement
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 1. Check for Bring Your Own Key (BYOK)
    let finalApiKey = process.env.GEMINI_API_KEY;
    let usingBYOK = false;

    if (user.encryptedGeminiKey && user.keyIv && user.keyAuthTag) {
      const encryptionService = require('./encryptionService');
      try {
        finalApiKey = encryptionService.decryptKey(user.encryptedGeminiKey, user.keyIv, user.keyAuthTag);
        usingBYOK = true;
        logger.info(`User ${userId} using BYOK for AI Mentor.`);
      } catch (err) {
        logger.error('Failed to decrypt BYOK API key', { error: err.message });
      }
    }

    // 2. Quota Enforcement (Bypassed if using BYOK)
    if (!usingBYOK) {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastNudgeDay = user.lastNudgeDate ? new Date(user.lastNudgeDate).setHours(0, 0, 0, 0) : null;

      if (today !== lastNudgeDay) {
        user.dailyNudgesUsed = 0;
        user.lastNudgeDate = new Date();
        await user.save();
      }

      if (user.level < 1 || user.dailyNudgesUsed >= 5) {
        logger.info(`User ${userId} hit nudge limit or level restriction.`);
        return getFallbackHint(problem);
      }
    }

    // 2. Cache Check (Hash the code string alongside the progressive depth to break cache locks)
    const codeHashStr = userCode.trim() + '_' + nudgeDepth + '_' + (lastError || 'None');
    const codeHash = crypto.createHash('sha256').update(codeHashStr).digest('hex');
    const cachedNudge = await AiNudgeCache.findOne({ 
      problemId: problem._id, 
      language, 
      codeHash 
    });

    if (cachedNudge) {
      logger.info('Returning AI Nudge from Cache');
      if (!usingBYOK) {
        user.dailyNudgesUsed += 1;
        await user.save();
      }
      return { nudgeText: cachedNudge.nudgeText, targetLine: cachedNudge.targetLine };
    }

    // 4. Gemini Execution
    if (!finalApiKey) {
      logger.warn('Skipping AI mentor: No API key available (BYOK or System)');
      return getFallbackHint(problem);
    }

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are the Socratic Mentor for Cogni. You have access to the user's current code and the problem description.

YOUR LOGIC FLOW:
1. **Check for Correctness:** User's current code is: ${userCode}. If this is correct, do NOT give a hint. Ask a follow-up question about complexity.
2. **Check for Specific Errors:** If there is a bug, ask a Socratic question about the error.
3. **Check for Redundancy:** If the user has already implemented a logic (like tracking minPrice), do NOT suggest they do it. Move to the NEXT logical step they are missing.

PROGRESSIVE NUDGING:
Nudge Depth: ${nudgeDepth}/3.
If depth is 1, give a high-level conceptual hint.
If depth is 2, point to the specific logic flaw.
If depth is 3, practically tell them what to type without writing the raw code.

[CRITICAL EVALUATION]:
${lastError ? `An execution error occurred: "${lastError.substring(0, 250)}". DO NOT analyze Big O complexity. Point the Lighthouse (targetLine) directly to the line causing the syntax/runtime crash and explain the compiler error in plain English.` : `If no error is provided, analyze the logic for bugs. If perfect, ask a complexity question.`}

STRICT RULE: Max 2 sentences. No code blocks. 
TONE: Speak like a senior CS student helping a friend. Use highly conversational, simple English. Avoid overly academic phrasing. Example: Instead of saying 'Is your array adequately sized for all lowercase characters?', say 'Are there only 20 letters in the alphabet? Look closely at your array size.' Be direct, punchy, and student-friendly.

IMPORTANT OUTPUT FORMAT: Return your response strictly as a JSON object: { "nudgeText": "...", "targetLine": number | null }. 
targetLine represents the line number (1-indexed) of the user's code where the logical error occurs. If the code is correct, return null.

Problem Description:
${problem.description}

Language: ${language}

Your Analysis:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(response.text().trim());
    } catch (parseErr) {
      logger.warn('Failed to parse Gemini JSON output', { raw: response.text() });
      parsedResult = { nudgeText: response.text().trim() || 'Syntax error encountered.', targetLine: null };
    }
    
    // Ensure the key maps closely
    const finalNudgeText = parsedResult.nudgeText || parsedResult.nudge || parsedResult.hint || 'Mentor generated an empty response.';
    const finalTargetLine = typeof parsedResult.targetLine === 'number' ? parsedResult.targetLine : null;

    // 5. Save Cache & Quota
    await AiNudgeCache.create({
      problemId: problem._id,
      codeHash,
      language,
      nudgeText: finalNudgeText,
      targetLine: finalTargetLine
    });

    if (!usingBYOK) {
      user.dailyNudgesUsed += 1;
      await user.save();
    }

    return { nudgeText: finalNudgeText, targetLine: finalTargetLine };
  } catch (error) {
    logger.error('Gemini API Error in AI Mentor', { error: error.message });
    return getFallbackHint(problem);
  }
};

const FALLBACK_QUOTES = [
  { text: "System optimal. Let's ", highlight: "build", highlightColor: "#4a7c59", suffix: "." },
  { text: "Back for ", highlight: "blood", highlightColor: "#ef4444", suffix: "?" },
  { text: "Ready to ", highlight: "conquer", highlightColor: "#eab308", suffix: "?" },
  { text: "Logic is ", highlight: "power", highlightColor: "#a855f7", suffix: "." },
  { text: "Think. Code. ", highlight: "Dominate", highlightColor: "#ef4444", suffix: "." },
  { text: "Your compiler ", highlight: "awaits", highlightColor: "#64748b", suffix: "." }
];

/**
 * /**
 * Generates a contextual, 3-6 word dashboard quote with a highlighted word.
 * Uses Groq API (fast, free) for reliable low-latency generation.
 */
const generateDashboardQuote = async (userId, context = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];

    // Build contextual nudge based on last visited problem — only 30% of the time to keep variety
    let contextualNudge = "";
    let usedContextPath = null;
    const useContext = Math.random() < 0.3;
    if (useContext && context.lastPath && context.lastPath.startsWith('/problems/')) {
      try {
        const problemId = context.lastPath.split('/problems/')[1];
        if (problemId) {
          const Problem = require('../models/Problem');
          const problem = await Problem.findById(problemId);
          if (problem) {
            contextualNudge = `The user was recently working on a problem called "${problem.title}". Make the quote a subtle, poetic nudge to jump back in and finish it.`;
            usedContextPath = context.lastPath;
          }
        }
      } catch(e) {}
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    }

    const systemPrompt = `You are an elite DSA coach. Generate a short, punchy 3-6 word motivational dashboard greeting.
${contextualNudge}
Return ONLY a single-line valid JSON object with no markdown, no code blocks, no explanation:
{"text": "prefix text ", "highlight": "oneword", "highlightColor": "#hexcolor", "suffix": "?or."}
Rules:
- highlight must be exactly ONE word with strong emotional or thematic resonance
- highlightColor must match the mood: #ef4444 for intense/blood/fire, #4a7c59 for growth/build, #eab308 for victory/conquer, #a855f7 for power/logic, #3b82f6 for clarity/code, #f97316 for urgency/return
- text is everything BEFORE the highlight word, suffix is everything AFTER
- Vary the quotes. Never repeat examples.
Examples (do not copy these):
{"text": "Back for ", "highlight": "blood", "highlightColor": "#ef4444", "suffix": "?"}
{"text": "Logic never ", "highlight": "sleeps", "highlightColor": "#3b82f6", "suffix": "."}
{"text": "Your next ", "highlight": "breakthrough", "highlightColor": "#a855f7", "suffix": " awaits."}`;

    const axios = require('axios');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a fresh quote for ${user.name || 'the user'} (Level ${user.level || 1}).` }
        ],
        temperature: 1.1,
        max_tokens: 80,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response from Groq');

    // Safely extract JSON
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}') + 1;
    const json = JSON.parse(content.substring(start, end));

    if (json.text && json.highlight && json.highlightColor) {
      // Attach contextPath so frontend knows to make quote clickable
      if (usedContextPath) json.contextPath = usedContextPath;
      return json;
    }
    throw new Error('Invalid JSON shape from Groq');
  } catch (error) {
    logger.error('Failed to generate dashboard quote, using fallback', { error: error.message });
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  }
};

module.exports = {
  getMentorNudge,
  generateDashboardQuote
};
