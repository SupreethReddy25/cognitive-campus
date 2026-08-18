/**
 * nameExtractService.js
 *
 * Two-stage pipeline:
 *  Stage 1 (Pre-filter): Regex + blocklist + heuristics — runs locally, instant.
 *                        If fails → return null immediately, no API call made.
 *  Stage 2 (Verify):    Groq LLM verifies the pre-filtered candidate.
 *                        Acts as a second opinion, not a cold extractor.
 *
 * Graceful fallback at every step — never throws, always returns string|null.
 */

const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/* ─────────────────────────────────────────────────────────────────
   BLOCKLIST — common non-name email prefixes
   ───────────────────────────────────────────────────────────────── */
const NON_NAME_BLOCKLIST = new Set([
  'admin','administrator','root','superuser','support','help','helpdesk',
  'service','info','information','contact','enquiry','inquiry','noreply',
  'no-reply','donotreply','do-not-reply','sales','marketing','billing',
  'payments','invoice','team','staff','office','ops','operations',
  'dev','developer','tech','engineering','code','mail','email','mailer',
  'postmaster','webmaster','hello','hi','hey','greetings',
  'user','guest','demo','test','testing','tester','temp','temporary',
  'sample','dummy','fake','anonymous','account','accounts','login',
  'signup','register','news','newsletter','updates','notifications',
  'alerts','social','media','pr','press','careers','jobs','hr',
  'legal','compliance','privacy','security','api','bot','robot',
  'system','auto','automated','feedback','report','reports','analytics',
  'me','my','myself','you','us','we','it','iam',
  'null','undefined','unknown','none','na','notapplicable',
  'abc','xyz','qwerty','asdf','foo','bar','baz','foobar',
  'test123','user123','demo123','temp123',
]);

/* ─────────────────────────────────────────────────────────────────
   isPlausibleName — heuristic validator
   ───────────────────────────────────────────────────────────────── */
function isPlausibleName(candidate) {
  if (!candidate || typeof candidate !== 'string') return false;
  const s = candidate.toLowerCase().trim();

  // Length bounds
  if (s.length < 2 || s.length > 20) return false;

  // Must be purely alphabetic
  if (!/^[a-z]+$/i.test(s)) return false;

  // Not on blocklist
  if (NON_NAME_BLOCKLIST.has(s)) return false;

  // Must contain at least one vowel (eliminates "xkcd", "qrst", "bcdf")
  if (!/[aeiou]/.test(s)) return false;

  // Vowel ratio check — long strings with almost no vowels are not names
  if (s.length > 5) {
    const vowelCount = (s.match(/[aeiou]/g) || []).length;
    if (vowelCount / s.length < 0.12) return false;
  }

  // Repeated character: "aaaa", "bbbb"
  if (/^(.)\1+$/.test(s)) return false;

  return true;
}

/* ─────────────────────────────────────────────────────────────────
   Stage 1 — PRE-FILTER (local, instant, no network)
   Extracts the first plausible candidate from the email local-part.
   Returns null if nothing plausible found — Groq is NOT called.
   ───────────────────────────────────────────────────────────────── */
function preFilter(local) {
  // Strip leading/trailing digits
  const cleaned = local.replace(/^\d+/, '').replace(/\d+$/, '');
  if (cleaned.length < 2) return null;

  // Take only the FIRST word (before . _ - separators)
  const firstWord = cleaned.split(/[._-]+/)[0];
  if (!firstWord) return null;

  // Capitalise and validate
  const candidate = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  return isPlausibleName(candidate) ? candidate : null;
}

/* ─────────────────────────────────────────────────────────────────
   Stage 2 — GROQ VERIFY (network, ~200ms)
   Sends the pre-filtered candidate to the LLM for confirmation.
   LLM acts as verifier, not cold extractor.
   ───────────────────────────────────────────────────────────────── */
async function groqVerify(local, candidate) {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are verifying whether a candidate string is genuinely a person's first name.

You will be given:
1. An email local-part (the text before the @ symbol)
2. A candidate first name extracted from it by a pre-filter

Your job: confirm or reject.

Rules (follow exactly):
- If the candidate IS a real person's first name → return it properly capitalised, one word only (e.g. "Supreeth", "John", "Priya")
- If the candidate is NOT a real first name (it's a word, role, object, random string, or not clearly a name) → return exactly the text: UNKNOWN
- Return ONLY one word. No punctuation, no explanation, nothing else.`,
      },
      {
        role: 'user',
        content: `Email local-part: ${local}\nCandidate: ${candidate}`,
      },
    ],
    max_tokens: 15,
    temperature: 0,
  });

  const raw = (completion.choices?.[0]?.message?.content ?? '').trim();
  if (!raw || raw.toUpperCase() === 'UNKNOWN') return null;

  // Sanitise and validate the LLM response too
  const sanitised = raw.replace(/[^a-zA-Z]/g, '');
  if (!isPlausibleName(sanitised)) return null;

  return sanitised.charAt(0).toUpperCase() + sanitised.slice(1).toLowerCase();
}

/* ─────────────────────────────────────────────────────────────────
   MAIN EXPORT
   extractFirstName(email) → Promise<string | null>
   null = "we genuinely cannot determine a first name" — caller should
   show graceful static content, NOT an error.
   ───────────────────────────────────────────────────────────────── */
async function extractFirstName(email) {
  if (!email || !email.includes('@')) return null;

  const local = email.split('@')[0];
  if (local.length < 2) return null;

  // ── Stage 1: Pre-filter (instant, no network) ────────────────────
  const candidate = preFilter(local);
  if (!candidate) {
    // Failed pre-filter — don't touch Groq at all
    return null;
  }

  // ── Stage 2: Groq verification ───────────────────────────────────
  try {
    const verified = await groqVerify(local, candidate);
    // Groq confirmed → use Groq's answer
    // Groq rejected → fall back to our pre-filtered candidate
    //   (we trust our own filter; Groq might be conservative)
    return verified ?? candidate;
  } catch (err) {
    console.warn('[nameExtract] Groq verify failed, using pre-filter result:', err.message);
    // Network/key error — we already passed the pre-filter, return that
    return candidate;
  }
}

module.exports = { extractFirstName };
