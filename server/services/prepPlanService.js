/**
 * Prep Plan Service — a personalised, company-specific study plan.
 *
 * Inputs: the company's real interview statistics (topic frequency %, difficulty, rounds) and
 * the student's live BKT mastery.
 *
 * A deterministic planner ALWAYS builds the plan skeleton and links real problems from the
 * catalogue:
 *   priority(skill) = topic frequency × (1 − mastery)      ← "high demand, low mastery" first
 *   days are allocated in proportion to priority, then split into Foundation → Company patterns
 *   → Mock & polish phases.
 * If an AI provider is available it rewrites the narrative (summary, phase goals, task wording,
 * tips) on top of that skeleton; if it fails the deterministic text is used as-is.
 *
 * @module prepPlanService
 */

const Company = require('../models/Company');
const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const intel = require('./companyIntelService');
const knowledge = require('./knowledgeService');
const bkt = require('./bktEngine');
const ai = require('./aiService');
const logger = require('../utils/logger');

const NON_DSA = {
  'System Design': { verb: 'Study', detail: 'high-level design: requirements → APIs → data model → scaling. Practise 2 classic designs (URL shortener, chat).' },
  OOP: { verb: 'Revise', detail: 'SOLID principles and 2 low-level design problems (parking lot, elevator).' },
  DBMS: { verb: 'Revise', detail: 'normalisation, transactions/ACID, indexing, joins. Solve 10 SQL queries.' },
  SQL: { verb: 'Practise', detail: 'joins, window functions, group-by. Solve 10-15 SQL problems.' },
  'Operating Systems': { verb: 'Revise', detail: 'processes vs threads, scheduling, deadlocks, virtual memory.' },
  'Computer Networks': { verb: 'Revise', detail: 'TCP/IP, HTTP/HTTPS, DNS, what happens when you type a URL.' },
  Behavioral: { verb: 'Prepare', detail: '5-6 STAR stories (conflict, failure, leadership, ownership).' }
};

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * Deterministic plan.
 */
const buildHeuristicPlan = async ({ company, stats, states, skills, userId, days }) => {
  const skillByName = new Map(skills.map((s) => [s.name, s]));
  const masteryByName = {};
  states.forEach((st) => {
    const sk = skills.find((s) => String(s._id) === String(st.skillId));
    if (sk) masteryByName[sk.name] = st.masteryP;
  });

  // ── skill demand from topic stats ──
  const demand = new Map(); // skillName → max pct
  const untracked = [];
  stats.topTopics.forEach((t) => {
    if (t.skill) demand.set(t.skill, Math.max(demand.get(t.skill) || 0, t.pct));
    else if (NON_DSA[t.topic]) untracked.push(t);
  });

  // No community data yet → infer demand from the company's tier
  if (demand.size === 0) {
    ['Arrays', 'Strings', 'Hashing', 'Trees', 'Graphs', 'Dynamic Programming'].forEach((s, i) => demand.set(s, 80 - i * 8));
  }

  const focusAreas = [...demand.entries()]
    .map(([skill, freqPct]) => {
      const mastery = masteryByName[skill] ?? bkt.P_L0;
      const priority = (freqPct / 100) * (1 - mastery);
      return { skill, frequencyPct: freqPct, mastery: +mastery.toFixed(3), priority: +priority.toFixed(3), level: priority > 0.35 ? 'high' : priority > 0.15 ? 'medium' : 'low' };
    })
    .sort((a, b) => b.priority - a.priority);

  // ── allocate practice days ──
  const practiceDays = Math.max(3, Math.round(days * 0.72));
  const totalPriority = focusAreas.reduce((n, f) => n + Math.max(f.priority, 0.03), 0) || 1;
  focusAreas.forEach((f) => { f.days = Math.max(1, Math.round((Math.max(f.priority, 0.03) / totalPriority) * practiceDays)); });

  // ── catalogue problems per focus skill (unsolved first, ramped easy → hard) ──
  const solved = new Set((await Submission.find({ userId, isCorrect: true }).select('problemId').lean()).map((s) => String(s.problemId)));
  const problemsBySkill = {};
  for (const f of focusAreas) {
    const sk = skillByName.get(f.skill);
    if (!sk) continue;
    const list = await Problem.find({ skillId: sk._id, isActive: true, status: 'approved' }).select('title difficulty').lean();
    const order = { easy: 0, medium: 1, hard: 2 };
    list.sort((a, b) => (solved.has(String(a._id)) ? 1 : 0) - (solved.has(String(b._id)) ? 1 : 0) || order[a.difficulty] - order[b.difficulty]);
    problemsBySkill[f.skill] = list.slice(0, 5).map((p) => ({ _id: p._id, title: p.title, difficulty: p.difficulty, solved: solved.has(String(p._id)) }));
  }

  // ── phases ──
  const foundationDays = Math.max(2, Math.round(days * 0.3));
  const patternDays = Math.max(2, Math.round(days * 0.42));
  const mockDays = Math.max(1, days - foundationDays - patternDays);

  const weak = focusAreas.filter((f) => f.mastery < 0.6).slice(0, 3);
  const foundationSkills = weak.length ? weak : focusAreas.slice(0, 2);
  const patternSkills = focusAreas.slice(0, 5);

  const taskForSkill = (f, intensity) => {
    const probs = (problemsBySkill[f.skill] || []).filter((p) => !p.solved).slice(0, intensity);
    return {
      type: 'practice',
      skill: f.skill,
      text: `${f.skill}: ${probs.length ? `solve ${probs.length} platform problem${probs.length > 1 ? 's' : ''}` : 'review solved problems and re-derive the patterns'} — appears in ${f.frequencyPct}% of ${company.name} reports${f.mastery < 0.5 ? `; your mastery is ${Math.round(f.mastery * 100)}%` : ''}.`,
      problems: probs
    };
  };

  const phases = [
    {
      name: 'Foundation',
      days: `1-${foundationDays}`,
      goal: `Close your biggest gaps before drilling ${company.name}-style questions.`,
      tasks: [
        ...foundationSkills.map((f) => taskForSkill(f, 3)),
        { type: 'review', text: 'Daily 20-min review: re-solve one previously failed problem without hints.' }
      ]
    },
    {
      name: `${company.name} patterns`,
      days: `${foundationDays + 1}-${foundationDays + patternDays}`,
      goal: `Practise the topics that show up most in real ${company.name} interviews.`,
      tasks: [
        ...patternSkills.map((f) => taskForSkill(f, 2)),
        ...untracked.slice(0, 3).map((t) => ({ type: 'study', text: `${NON_DSA[t.topic].verb} ${t.topic} — ${NON_DSA[t.topic].detail} (${t.pct}% of reports).` })),
        ...(stats.sampleQuestions[0] ? [{ type: 'read', text: `Read 3 real questions: e.g. “${stats.sampleQuestions[0].text.slice(0, 140)}…”` }] : [])
      ]
    },
    {
      name: 'Mock & polish',
      days: `${foundationDays + patternDays + 1}-${days}`,
      goal: 'Simulate the real process under time pressure.',
      tasks: [
        { type: 'mock', text: `Do ${Math.max(2, Math.round(mockDays / 2))} timed mock rounds (${stats.avgRounds ? Math.round(stats.avgRounds) : 3}-round format): 45 min each, talk out loud.` },
        { type: 'behavioral', text: 'Rehearse your top behavioural stories and your "why ' + company.name + '" answer.' },
        { type: 'review', text: 'Re-solve 1 hard problem from each of your top 3 focus skills, then stop — sleep matters more on the last day.' }
      ]
    }
  ];

  // ── readiness ──
  const weightSum = focusAreas.reduce((n, f) => n + f.frequencyPct, 0) || 1;
  const readiness = Math.round(100 * focusAreas.reduce((n, f) => n + (f.frequencyPct / weightSum) * f.mastery, 0));

  const top = focusAreas[0];
  return {
    company: { name: company.name, slug: company.slug, logo: company.logo },
    days,
    readiness,
    summary: top
      ? `${company.name} ${stats.totalReports ? `(${stats.totalReports} real reports)` : ''} leans hardest on ${focusAreas.slice(0, 3).map((f) => f.skill).join(', ')}. Your biggest opportunity is ${top.skill} (${Math.round(top.mastery * 100)}% mastery, ${top.frequencyPct}% of reports). Estimated readiness: ${readiness}%.`
      : `A balanced ${days}-day plan for ${company.name}.`,
    focusAreas,
    phases,
    tips: [
      stats.difficultyBuckets.find((b) => b.pct >= 50)
        ? `Most candidates rate the process ${stats.difficultyBuckets.find((b) => b.pct >= 50).label.toLowerCase()} — calibrate practice difficulty accordingly.`
        : 'Mix medium and hard problems — reports rate the difficulty as varied.',
      stats.topResources[0] ? `Most-used prep resource in reports: ${stats.topResources[0].resource}.` : 'Explain your thinking out loud — interviewers grade the process as much as the answer.',
      'Re-check your weakest skill every 3 days — spaced repetition beats cramming.'
    ]
  };
};

// ─── AI narrative layer ───────────────────────────────────────

const aiRewrite = async ({ userId, plan, company, stats }) => {
  const prompt = `You are an expert placement coach. Below is a computed ${plan.days}-day interview prep plan skeleton for ${company.name}, built from real interview reports and the student's skill mastery.

Rewrite ONLY the narrative so it is motivating, specific and concise. Keep the same phases and the same number of tasks per phase (task "type" values must be preserved). Do not invent statistics.

Real data:
- reports: ${stats.totalReports}, offer rate: ${stats.offerRate ?? 'n/a'}%
- top topics: ${stats.topTopics.slice(0, 6).map((t) => `${t.topic} ${t.pct}%`).join(', ') || 'n/a'}
- student focus (skill: frequency%, mastery): ${plan.focusAreas.slice(0, 6).map((f) => `${f.skill}: ${f.frequencyPct}%, ${Math.round(f.mastery * 100)}%`).join(' | ')}

Skeleton JSON:
${JSON.stringify({ summary: plan.summary, phases: plan.phases.map((p) => ({ name: p.name, goal: p.goal, tasks: p.tasks.map((t) => ({ type: t.type, text: t.text })) })), tips: plan.tips })}

Return ONLY JSON: {"summary": string (2-3 sentences), "phases": [{"goal": string, "tasks": [{"text": string}]}], "tips": [string, string, string]}`;

  const out = await ai.complete({ userId, prompt, json: true, temperature: 0.5, maxTokens: 2500, timeoutMs: 30000 });
  const d = out.data;
  if (!d || !Array.isArray(d.phases) || d.phases.length !== plan.phases.length) throw new ai.AiError('BAD_RESPONSE', 'Plan shape mismatch');

  const merged = {
    ...plan,
    summary: typeof d.summary === 'string' && d.summary.length > 20 ? d.summary : plan.summary,
    tips: Array.isArray(d.tips) && d.tips.length ? d.tips.map(String).slice(0, 5) : plan.tips,
    phases: plan.phases.map((p, i) => ({
      ...p,
      goal: typeof d.phases[i].goal === 'string' && d.phases[i].goal ? d.phases[i].goal : p.goal,
      tasks: p.tasks.map((t, j) => ({ ...t, text: typeof d.phases[i].tasks?.[j]?.text === 'string' && d.phases[i].tasks[j].text ? d.phases[i].tasks[j].text : t.text }))
    }))
  };
  return { plan: merged, provider: out.provider, model: out.model, byok: out.byok };
};

/**
 * @param {{userId:string, slug:string, days?:number}} opts
 * @returns {Promise<object|null>} plan + ai meta, or null if the company doesn't exist
 */
const generatePrepPlan = async ({ userId, slug, days = 30 }) => {
  const company = await Company.findOne({ slug }).lean();
  if (!company) return null;
  const numDays = clamp(parseInt(days, 10) || 30, 7, 90);

  const [stats, states, skills] = await Promise.all([
    intel.getCompanyIntel(company._id),
    SkillState.find({ userId }).lean(),
    knowledge.getSkills()
  ]);

  const base = await buildHeuristicPlan({ company, stats, states, skills, userId, days: numDays });

  try {
    const { plan, provider, model, byok } = await aiRewrite({ userId, plan: base, company, stats });
    return { ...plan, generatedBy: 'ai', ai: { used: true, provider, model, byok } };
  } catch (err) {
    const code = err instanceof ai.AiError ? err.code : 'UNAVAILABLE';
    if (!(err instanceof ai.AiError)) logger.error('Prep plan AI error', { error: err.message, stack: err.stack });
    return { ...base, generatedBy: 'heuristic', ai: { used: false, reason: code, message: ai.friendly(code), needsKey: code === 'NO_KEY' } };
  }
};

module.exports = { generatePrepPlan, buildHeuristicPlan };
