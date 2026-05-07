/**
 * Intel Service — "The Editor-in-Chief"
 *
 * Takes a raw, potentially messy interview memory dump and uses
 * Gemini 2.0 Flash to refine it into a professional, LeetCode-quality
 * DSA problem with test cases, constraints, and starter code.
 *
 * @module intelService
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Strips markdown code fences and extracts JSON from a Gemini response.
 * Handles cases where Gemini wraps output in ```json ... ``` blocks.
 *
 * @param {string} raw - Raw text response from Gemini
 * @returns {object} Parsed JSON object
 * @throws {Error} If JSON cannot be extracted or parsed
 */
const extractJSON = (raw) => {
  let cleaned = raw.trim();

  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt to find the first { ... } block
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (e2) {
        throw new Error(`Gemini returned malformed JSON. Raw excerpt: ${cleaned.substring(0, 300)}`);
      }
    }
    throw new Error(`No JSON object found in Gemini response. Raw excerpt: ${cleaned.substring(0, 300)}`);
  }
};

/**
 * Validates the structure returned by Gemini, filling in defaults for
 * any missing fields to ensure downstream code doesn't crash.
 *
 * @param {object} parsed - The parsed JSON from Gemini
 * @returns {object} Validated and sanitized problem structure
 */
const validateGeminiOutput = (parsed) => {
  const result = {
    title: parsed.title || 'Untitled Problem',
    description: parsed.description || '',
    difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty?.toLowerCase())
      ? parsed.difficulty.toLowerCase()
      : 'medium',
    constraints: parsed.constraints || '',
    skillMatch: parsed.skillMatch || null,
    testCases: [],
    starterCode: parsed.starterCode || {}
  };

  // Validate test cases
  if (Array.isArray(parsed.testCases)) {
    result.testCases = parsed.testCases
      .filter(tc => tc && tc.input !== undefined && tc.expectedOutput !== undefined)
      .map((tc, i) => ({
        input: String(tc.input),
        expectedOutput: String(tc.expectedOutput),
        isHidden: i >= 2 // First 2 visible, rest hidden
      }));
  }

  if (result.testCases.length === 0) {
    throw new Error('Gemini generated zero valid test cases. The raw description may be too vague.');
  }

  if (!result.description) {
    throw new Error('Gemini could not generate a problem description from the input.');
  }

  return result;
};

/**
 * Calls Gemini 2.0 Flash to refine a raw interview memory dump into
 * a professional DSA problem with test cases and starter code.
 *
 * @param {string} rawDescription - The student's raw memory dump
 * @param {string} company - Company name (optional)
 * @param {string} round - Interview round (optional)
 * @param {number} confidence - Student's confidence level 0-100
 * @param {string[]} existingSkills - Array of skill names from the DB
 * @param {string} apiKey - Gemini API key to use
 * @returns {Promise<object>} Structured problem JSON
 */
const refineRawIntel = async (rawDescription, company, round, confidence, existingSkills, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const skillsList = existingSkills.length > 0
    ? `Available DSA skill categories (pick the BEST match): ${existingSkills.join(', ')}`
    : 'Infer the most relevant DSA skill category.';

  const confidenceNote = confidence < 50
    ? 'The reporter has LOW confidence in their memory. You MUST infer realistic constraints and fill in any gaps with reasonable assumptions for a competitive programming problem.'
    : 'The reporter is fairly confident in their memory. Stick closely to what they described.';

  const contextLine = company
    ? `This was asked at ${company}${round ? `, ${round}` : ''}.`
    : '';

  const prompt = `You are a SENIOR DSA PROBLEM EDITOR at a top competitive programming platform (like LeetCode).

A student just came out of a coding interview and is reporting what they remember. Your job is to take their raw, potentially messy memory dump and transform it into a PROFESSIONAL, publication-quality coding challenge.

${contextLine}
${confidenceNote}

${skillsList}

STUDENT'S RAW MEMORY DUMP:
---
${rawDescription}
---

YOUR TASK:
1. Clean up the English. Fix grammar, clarify ambiguities.
2. Frame this as a professional DSA challenge with a clear problem statement.
3. Infer realistic constraints (array size limits, value ranges, time complexity expectations).
4. Generate at least 4 test cases covering: basic case, edge case (empty/single element), large input pattern, and a tricky case.
5. Generate starter code templates for JavaScript, Python, and Java with the correct function/method signature.
6. Determine the difficulty level (easy/medium/hard) based on the problem's complexity.

OUTPUT STRICT JSON (no markdown, no explanation, ONLY the JSON object):
{
  "title": "Problem Title (concise, LeetCode-style)",
  "description": "Full problem description with examples formatted in markdown. Include:\\n- Problem statement\\n- Input/output format\\n- At least one worked example with explanation",
  "difficulty": "easy|medium|hard",
  "constraints": "Bullet-pointed constraints, e.g.:\\n- 1 <= nums.length <= 10^5\\n- -10^9 <= nums[i] <= 10^9",
  "skillMatch": "The single best matching skill category name from the list above",
  "testCases": [
    { "input": "exact stdin input (one arg per line for multi-param functions)", "expectedOutput": "exact expected stdout output" }
  ],
  "starterCode": {
    "javascript": "function solutionName(param1, param2) {\\n  // Your code here\\n}",
    "python": "def solution_name(param1, param2):\\n    # Your code here\\n    pass",
    "java": "class Main {\\n    public ReturnType solutionName(Type1 param1, Type2 param2) {\\n        // Your code here\\n    }\\n}"
  }
}`;

  logger.info('[Intel] Calling Gemini to refine raw intel', {
    descriptionLength: rawDescription.length,
    company,
    confidence
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  logger.debug('[Intel] Gemini raw response length', { length: responseText.length });

  const parsed = extractJSON(responseText);
  const validated = validateGeminiOutput(parsed);

  logger.info('[Intel] Gemini refinement successful', {
    title: validated.title,
    difficulty: validated.difficulty,
    testCaseCount: validated.testCases.length,
    skillMatch: validated.skillMatch
  });

  return validated;
};

module.exports = { refineRawIntel, extractJSON, validateGeminiOutput };
