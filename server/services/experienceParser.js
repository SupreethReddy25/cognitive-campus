/**
 * Experience Parser — turns a raw interview "brain dump" into a structured
 * InterviewExperience draft.
 *
 * Pipeline
 *   1. AI extraction (Gemini/Groq via aiService) into a strict schema
 *   2. If the AI is missing / rate limited / returns junk → a deterministic heuristic parser
 *      (regex + keyword lexicon) produces the same shape, so the feature never dead-ends
 *   3. Company resolution against the Company collection (name, slug, common aliases)
 *   4. A server-side, deterministic quality score with a breakdown and concrete suggestions —
 *      we never trust the model to grade itself
 *
 * @module experienceParser
 */

const Company = require('../models/Company');
const ai = require('./aiService');
const { mapTopicToSkill } = require('./topicSkillMapper');
const logger = require('../utils/logger');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_RE = new RegExp(`\\b(${MONTHS.join('|')}|${MONTHS.map((m) => m.slice(0, 3)).join('|')})\\b\\.?`, 'i');

const ROUND_TYPES = [
  { re: /\b(online assessment|online test|\boa\b|hackerrank|codility|coding test|aptitude)/i, type: 'OA' },
  { re: /\b(group discussion|\bgd\b)/i, type: 'GD' },
  { re: /\b(hr|human resources?|culture fit|googlyness|behavio(u)?ral|leadership principles?)\b/i, type: 'HR' },
  { re: /\b(managerial|hiring manager|bar raiser|director)\b/i, type: 'Managerial' },
  { re: /\b(technical|coding|dsa|system design|whiteboard|interview|f2f|face to face|onsite)\b/i, type: 'Technical' }
];

const TOPIC_LEXICON = [
  'Arrays', 'Strings', 'Hashing', 'HashMap', 'Recursion', 'Backtracking', 'Sorting', 'Binary Search', 'Linked List', 'Stack', 'Queue',
  'Trees', 'Binary Tree', 'BST', 'Heap', 'Trie', 'Graphs', 'BFS', 'DFS', 'Dijkstra', 'Topological Sort', 'Union Find', 'Dynamic Programming', 'DP',
  'Greedy', 'Sliding Window', 'Two Pointers', 'Prefix Sum', 'Bit Manipulation', 'System Design', 'HLD', 'LLD', 'OOPs', 'DBMS', 'SQL', 'OS',
  'Operating Systems', 'Computer Networks', 'Design Patterns', 'Concurrency', 'Multithreading', 'REST', 'Caching', 'Machine Learning', 'Statistics'
];

const RESOURCE_LEXICON = ['LeetCode', 'GeeksforGeeks', 'GFG', 'Striver', 'NeetCode', 'Codeforces', 'CodeChef', 'HackerRank', 'InterviewBit', 'Blind 75', 'Grokking', 'Cracking the Coding Interview', 'CTCI', 'Educative', 'YouTube', 'Love Babbar', 'Apna College', 'Aditya Verma', 'Tech Interview Handbook', 'System Design Primer'];

const COMPANY_ALIASES = {
  google: ['google', 'alphabet'],
  amazon: ['amazon', 'aws', 'amzn'],
  microsoft: ['microsoft', 'msft'],
  meta: ['meta', 'facebook', 'fb'],
  apple: ['apple'],
  netflix: ['netflix'],
  flipkart: ['flipkart'],
  razorpay: ['razorpay'],
  zerodha: ['zerodha'],
  atlassian: ['atlassian'],
  adobe: ['adobe'],
  'goldman-sachs': ['goldman sachs', 'goldman', 'gs'],
  'morgan-stanley': ['morgan stanley'],
  'jp-morgan': ['jp morgan', 'jpmorgan', 'jpmc', 'j.p. morgan'],
  uber: ['uber'],
  oracle: ['oracle'],
  salesforce: ['salesforce'],
  intuit: ['intuit'],
  paypal: ['paypal'],
  'walmart-labs': ['walmart labs', 'walmart global tech', 'walmart']
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Find the company mentioned in free text. */
const resolveCompany = async (text, hint = '') => {
  const haystack = `${hint} ${text}`.toLowerCase();
  const companies = await Company.find({}).select('name slug logo tier').lean();
  const scored = [];
  for (const c of companies) {
    const aliases = new Set([c.name.toLowerCase(), c.slug.replace(/-/g, ' '), ...(COMPANY_ALIASES[c.slug] || [])]);
    let hits = 0;
    for (const a of aliases) {
      const m = haystack.match(new RegExp(`\\b${escapeRe(a)}\\b`, 'g'));
      if (m) hits += m.length * (a.length > 3 ? 2 : 1);
    }
    if (hits) scored.push({ company: c, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);
  const best = scored[0];
  return best ? { _id: best.company._id, name: best.company.name, slug: best.company.slug, logo: best.company.logo, confidence: Math.min(1, best.hits / 4) } : null;
};

// ─── Heuristic parser ─────────────────────────────────────────

const detectRoundType = (chunk) => {
  for (const { re, type } of ROUND_TYPES) if (re.test(chunk)) return type;
  return 'Technical';
};

const findTopics = (text) => {
  const found = new Set();
  for (const t of TOPIC_LEXICON) {
    if (new RegExp(`\\b${escapeRe(t)}\\b`, 'i').test(text)) found.add(t === 'DP' ? 'Dynamic Programming' : t === 'HashMap' ? 'Hashing' : t);
  }
  return [...found];
};

const inferQuestionType = (q) => {
  const s = q.toLowerCase();
  if (/system design|hld|lld|design (a|an|the)\b|architecture|scal/.test(s)) return 'System Design';
  if (/\b(sql|query|dbms|os\b|deadlock|process|thread|tcp|http|normali[sz]ation|index)/.test(s)) return 'CS Fundamentals';
  if (/tell me about|conflict|leadership|challenge|failure|why (google|amazon|us|this)|strength|weakness/.test(s)) return 'Behavioral';
  return 'DSA';
};

const heuristicParse = (raw) => {
  const text = raw.replace(/\r/g, '');

  const yearMatch = text.match(/\b(20(?:2[0-9]))\b/);
  const monthMatch = text.match(MONTH_RE);
  let month = '';
  if (monthMatch) {
    const key = monthMatch[1].slice(0, 3).toLowerCase();
    month = MONTHS.find((m) => m.slice(0, 3).toLowerCase() === key) || '';
  }

  let role = '';
  const roleMatch = text.match(/\b(SDE[- ]?(?:1|2|3|I{1,3})|SDE|SWE|Software (?:Development )?Engineer(?: (?:II|I|2|1))?|Data (?:Analyst|Engineer|Scientist)|Product Manager|PM|Analyst|Intern(?:ship)?|Frontend|Backend|Full[- ]?Stack|ML Engineer)\b/i);
  if (roleMatch) {
    role = roleMatch[1].replace(/^SDE[- ]?I{1}$/i, 'SDE-1').replace(/^SDE\s?1$/i, 'SDE-1').replace(/^SDE\s?2$/i, 'SDE-2');
    if (/^sde$/i.test(role)) role = 'SDE-1';
  }

  let offerReceived = 'Pending';
  if (/\b(got (the )?offer|received (an )?offer|offer letter|selected|cleared all|converted|i (was )?hired|accepted|joined|placed)\b/i.test(text) && !/\b(not selected|didn'?t get|did not get|rejected|no offer)\b/i.test(text)) offerReceived = 'Yes';
  else if (/\b(rejected|not selected|didn'?t (get|clear|make)|did not (get|clear|make)|no offer|couldn'?t clear|failed to clear|eliminated|ghosted)\b/i.test(text)) offerReceived = 'No';

  const cgpaMatch = text.match(/\bcgpa[^\d]{0,12}(\d(?:\.\d{1,2})?)/i) || text.match(/\b(\d\.\d{1,2})\s*(?:\/\s*10|cgpa)/i);

  // ── split into rounds ──
  const roundSplit = /(?:^|\n)\s*(?:round\s*(\d+)|(?:r|round)-?(\d)\b|(?:(?:\d+)(?:st|nd|rd|th)\s+round)|(?:oa|online assessment|technical round|hr round|managerial round|gd round|final round|bar raiser)\b)[^\n]*/gi;
  const marks = [];
  let mm;
  while ((mm = roundSplit.exec(text))) marks.push(mm.index);

  const chunks = [];
  if (marks.length >= 1) {
    marks.forEach((start, i) => chunks.push(text.slice(start, marks[i + 1] ?? text.length)));
  } else {
    // fall back to paragraphs mentioning "round"/"interview"
    const paras = text.split(/\n{2,}/).filter((p) => p.trim().length > 40);
    const roundParas = paras.filter((p) => /round|interview|oa|test|discussion|questions?/i.test(p));
    chunks.push(...(roundParas.length ? roundParas : paras.slice(0, 3)));
  }

  const rounds = chunks.slice(0, 6).map((chunk) => {
    const durationMatch = chunk.match(/(\d{2,3})\s*(?:-|to)?\s*(\d{2,3})?\s*(min(?:ute)?s?|hrs?|hours?)/i);
    const questions = [];
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    lines.forEach((l) => {
      const bullet = l.replace(/^[-*•\d.)\s]+/, '');
      const isQ = /\?$/.test(bullet) || /^(given|find|implement|design|write|reverse|check|merge|count|explain|what|why|how|tell me|determine|print|return|detect|validate|serialize|solve)\b/i.test(bullet);
      if (isQ && bullet.length > 12 && bullet.length < 300) {
        questions.push({ text: bullet, questionType: inferQuestionType(bullet), topicTags: findTopics(bullet).slice(0, 3) });
      }
    });
    const topics = findTopics(chunk).slice(0, 8);
    const tipLine = lines.find((l) => /\b(tip|advice|suggest|recommend|make sure|focus|important|remember)\b/i.test(l));
    const vibe = /grill|intense|tough|aggressive|hostile|stern/i.test(chunk) ? 'Grilling' : /friendly|chill|casual|conversational|helpful|warm/i.test(chunk) ? 'Friendly' : /neutral|professional/i.test(chunk) ? 'Neutral' : '';
    return {
      type: detectRoundType(chunk.slice(0, 200)),
      duration: durationMatch ? `${durationMatch[1]}${durationMatch[2] ? '-' + durationMatch[2] : ''} ${/h/i.test(durationMatch[3]) ? 'hours' : 'minutes'}` : '',
      questions: questions.slice(0, 8),
      topics,
      tips: tipLine ? tipLine.replace(/^[-*•\s]+/, '') : '',
      vibe
    };
  });

  const resources = RESOURCE_LEXICON.filter((r) => new RegExp(`\\b${escapeRe(r)}\\b`, 'i').test(text));
  const tipSentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => /\b(tip|advice|suggest|recommend|make sure|focus on|practice|don'?t|should|prepare)\b/i.test(s))
    .slice(0, 4);

  return {
    role,
    year: yearMatch ? Number(yearMatch[1]) : new Date().getFullYear(),
    month,
    offerReceived,
    college: '',
    cgpa: cgpaMatch ? cgpaMatch[1] : '',
    rounds,
    overallTips: tipSentences.join(' '),
    resourcesUsed: resources.join(', ')
  };
};

// ─── Quality score (deterministic) ────────────────────────────

/**
 * Scores an experience draft 0-100 with a transparent breakdown.
 *
 * @param {object} exp - { role, year, month, offerReceived, rounds[], overallTips, resourcesUsed, difficulty }
 * @returns {{score:number, grade:string, breakdown:Array<{label:string, points:number, max:number, done:boolean}>, suggestions:string[]}}
 */
const scoreQuality = (exp = {}) => {
  const rounds = exp.rounds || [];
  const questions = rounds.flatMap((r) => r.questions || []).filter((q) => (q.text || '').trim().length > 8);
  const specificQuestions = questions.filter((q) => (q.text || '').trim().length > 25);
  const topics = new Set(rounds.flatMap((r) => [...(r.topics || []), ...(r.questions || []).flatMap((q) => q.topicTags || [])]));
  const tips = (exp.overallTips || '').trim();
  const resources = (exp.resourcesUsed || '').split(/,|;/).map((s) => s.trim()).filter(Boolean);

  const parts = [
    { label: 'Basics (role, date, outcome)', max: 15, points: (exp.role ? 5 : 0) + (exp.year ? 3 : 0) + (exp.month ? 3 : 0) + (exp.offerReceived ? 4 : 0) },
    { label: 'Round-by-round structure', max: 20, points: Math.min(rounds.length, 4) * 5 },
    { label: 'Round details (type, duration, vibe)', max: 15, points: Math.min(15, rounds.slice(0, 4).reduce((n, r) => n + (r.type ? 1 : 0) + (r.duration ? 1.5 : 0) + (r.vibe ? 1.25 : 0), 0)) },
    { label: 'Concrete questions', max: 20, points: Math.min(20, questions.length * 4 + specificQuestions.length * 1) },
    { label: 'Topics covered', max: 10, points: Math.min(10, topics.size * 2.5) },
    { label: 'Advice for candidates', max: 12, points: tips.length > 160 ? 12 : tips.length > 60 ? 8 : tips.length > 15 ? 4 : 0 },
    { label: 'Prep resources', max: 8, points: Math.min(8, resources.length * 4) }
  ].map((p) => ({ ...p, points: Math.round(p.points), done: p.points >= p.max * 0.7 }));

  const score = Math.min(100, parts.reduce((n, p) => n + p.points, 0));
  const suggestions = [];
  if (!rounds.length) suggestions.push('Add at least one interview round — round structure is the most valuable part.');
  else if (rounds.length < 2) suggestions.push('Most processes have 3-4 rounds. Add the others, even briefly.');
  if (questions.length < 3) suggestions.push('Quote the actual questions you were asked (even paraphrased) — that is what others search for.');
  if (!topics.size) suggestions.push('Tag topics (Graphs, DP, System Design…) so this feeds the topic-frequency analytics.');
  if (rounds.some((r) => !r.duration)) suggestions.push('Add durations for each round so candidates can plan their day.');
  if (tips.length < 60) suggestions.push('Finish with 2-3 sentences of advice: what would you do differently?');
  if (!resources.length) suggestions.push('Mention the resources you used (LeetCode lists, YouTube channels, books).');
  if (!exp.month || !exp.year) suggestions.push('Add the month and year — recency matters for interview-pattern trends.');

  const grade = score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 40 ? 'Fair' : 'Needs detail';
  return { score, grade, breakdown: parts, suggestions: suggestions.slice(0, 4) };
};

// ─── AI parse ─────────────────────────────────────────────────

const AI_SYSTEM = `You extract structured data from students' raw interview experiences for a placement-intelligence database.
Rules: never invent facts not in the text; leave unknown strings empty ("") and unknown lists empty ([]).
Quote actual questions as written. Use concise topic tags such as Arrays, Graphs, Dynamic Programming, System Design, SQL, OS, DBMS, OOP, Behavioral.
Respond with ONLY a JSON object.`;

const buildAiPrompt = (raw) => `Extract the interview experience below into this JSON schema:
{
  "companyName": "string",
  "role": "string (e.g. SDE-1, SDE-2, Data Analyst, Product Manager)",
  "year": number,
  "month": "full month name",
  "offerReceived": "Yes | No | Pending",
  "college": "string",
  "cgpa": "string",
  "difficulty": "Easy | Medium | Hard | Very Hard",
  "rounds": [
    {
      "type": "OA | Technical | Managerial | HR | GD",
      "duration": "e.g. 60 minutes",
      "vibe": "Friendly | Neutral | Grilling",
      "topics": ["string"],
      "questions": [{ "text": "string", "questionType": "DSA | System Design | CS Fundamentals | Behavioral | Role-specific", "topicTags": ["string"] }],
      "tips": "string"
    }
  ],
  "overallTips": "string",
  "resourcesUsed": "comma separated string"
}

RAW TEXT:
"""
${raw.slice(0, 9000)}
"""`;

const normaliseParsed = (p = {}) => {
  const validOffer = ['Yes', 'No', 'Pending'];
  const validDiff = ['Easy', 'Medium', 'Hard', 'Very Hard'];
  const validRound = ['OA', 'Technical', 'Managerial', 'HR', 'GD'];
  const rounds = (Array.isArray(p.rounds) ? p.rounds : []).slice(0, 8).map((r) => ({
    type: validRound.find((t) => t.toLowerCase() === String(r.type || '').toLowerCase()) || (r.type ? detectRoundType(String(r.type)) : 'Technical'),
    duration: String(r.duration || ''),
    vibe: String(r.vibe || ''),
    topics: (Array.isArray(r.topics) ? r.topics : []).map(String).slice(0, 10),
    questions: (Array.isArray(r.questions) ? r.questions : []).slice(0, 10).map((q) => ({
      text: String(q.text || ''),
      questionType: ['DSA', 'System Design', 'CS Fundamentals', 'Behavioral', 'Role-specific'].includes(q.questionType) ? q.questionType : inferQuestionType(String(q.text || '')),
      topicTags: (Array.isArray(q.topicTags) ? q.topicTags : []).map(String).slice(0, 4)
    })),
    tips: String(r.tips || '')
  }));
  const yr = Number(p.year);
  return {
    companyName: String(p.companyName || ''),
    role: String(p.role || ''),
    year: yr >= 2015 && yr <= 2100 ? yr : new Date().getFullYear(),
    month: MONTHS.find((m) => m.toLowerCase() === String(p.month || '').toLowerCase()) || '',
    offerReceived: validOffer.includes(p.offerReceived) ? p.offerReceived : 'Pending',
    college: String(p.college || ''),
    cgpa: String(p.cgpa || ''),
    difficulty: validDiff.includes(p.difficulty) ? p.difficulty : '',
    rounds,
    overallTips: Array.isArray(p.overallTips) ? p.overallTips.join(' ') : String(p.overallTips || ''),
    resourcesUsed: Array.isArray(p.resourcesUsed) ? p.resourcesUsed.join(', ') : String(p.resourcesUsed || '')
  };
};

/**
 * Parse raw text. Always resolves — degrades to the heuristic parser on any AI failure.
 *
 * @returns {Promise<{parsed:object, company:object|null, quality:object, source:'ai'|'heuristic', ai:object, skillCoverage:object}>}
 */
const parseExperience = async (rawText, { userId, companyHint = '' } = {}) => {
  const raw = String(rawText || '').trim();
  let parsed;
  let source = 'ai';
  let aiMeta = { used: true };

  try {
    const out = await ai.complete({ userId, system: AI_SYSTEM, prompt: buildAiPrompt(raw), json: true, temperature: 0.1, maxTokens: 3500, timeoutMs: 30000 });
    parsed = normaliseParsed(out.data);
    aiMeta = { used: true, provider: out.provider, model: out.model, byok: out.byok };
    // If the model returned an empty husk, don't trust it.
    if (!parsed.rounds.length && !parsed.role) throw new ai.AiError('BAD_RESPONSE', 'Empty extraction');
  } catch (err) {
    const code = err instanceof ai.AiError ? err.code : 'UNAVAILABLE';
    if (!(err instanceof ai.AiError)) logger.error('Experience parse error', { error: err.message, stack: err.stack });
    parsed = { companyName: '', difficulty: '', ...heuristicParse(raw) };
    source = 'heuristic';
    aiMeta = { used: false, reason: code, message: ai.friendly(code), needsKey: code === 'NO_KEY' };
  }

  const company = await resolveCompany(raw, `${parsed.companyName} ${companyHint}`);
  const quality = scoreQuality(parsed);

  // Which tracked skills does this experience feed?
  const tracked = new Set();
  parsed.rounds.forEach((r) => [...(r.topics || []), ...(r.questions || []).flatMap((q) => q.topicTags || [])].forEach((t) => {
    const m = mapTopicToSkill(t);
    if (m.tracked) tracked.add(m.skillName);
  }));

  return {
    parsed: {
      ...parsed,
      // legacy keys consumed by older UI code
      qualityScore: quality.score,
      validationMessage: quality.suggestions[0] || 'Looks complete — great detail!'
    },
    company,
    quality,
    source,
    ai: aiMeta,
    skillCoverage: { tracked: [...tracked] }
  };
};

module.exports = { parseExperience, scoreQuality, heuristicParse, resolveCompany, normaliseParsed };
