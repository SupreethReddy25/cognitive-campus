/**
 * Company Intel Service — statistics over published interview experiences.
 *
 * All percentages are "share of reports", and proportions carry a Wilson score interval so the
 * UI can be honest about small samples ("offer rate 62% (95% CI 38–82%, n=8)").
 *
 * @module companyIntelService
 */

const InterviewExperience = require('../models/InterviewExperience');
const { mapTopicToSkill } = require('./topicSkillMapper');

const DIFFICULTY_ORDER = ['Easy', 'Smooth', 'Medium', 'Challenging', 'Hard', 'Very Hard', 'Grueling', 'Brain-melting'];
const DIFFICULTY_SCORE = { Easy: 1, Smooth: 1, Medium: 2, Challenging: 3, Hard: 3, 'Very Hard': 4, Grueling: 4, 'Brain-melting': 5 };
/** Collapse the 8-value enum to 3 buckets for the pie chart. */
const DIFFICULTY_BUCKET = { Easy: 'Easy', Smooth: 'Easy', Medium: 'Medium', Challenging: 'Hard', Hard: 'Hard', 'Very Hard': 'Hard', Grueling: 'Hard', 'Brain-melting': 'Hard' };

/**
 * Wilson score interval for a binomial proportion (z = 1.96 → 95%).
 * @returns {{low:number, high:number}} as fractions, or null if n = 0
 */
const wilson = (successes, n, z = 1.96) => {
  if (!n) return null;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { low: Math.max(0, (centre - margin) / denom), high: Math.min(1, (centre + margin) / denom) };
};

const pct = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0);

const canonicalTopic = (t) => {
  const raw = String(t || '').trim();
  if (!raw) return null;
  const mapped = mapTopicToSkill(raw);
  // Keep the student's own label but fold obvious aliases together.
  const key = raw.toLowerCase();
  const alias = { dp: 'Dynamic Programming', 'dynamic programming': 'Dynamic Programming', hld: 'System Design', lld: 'System Design', 'system design (hld)': 'System Design', 'system design (lld)': 'System Design', 'system design': 'System Design', oops: 'OOP', oop: 'OOP', dbms: 'DBMS', sql: 'SQL', os: 'Operating Systems', 'operating system': 'Operating Systems', 'linked list': 'Linked Lists', linkedlist: 'Linked Lists', hashmap: 'Hashing', 'hash map': 'Hashing', 'hash table': 'Hashing', array: 'Arrays', string: 'Strings', tree: 'Trees', 'binary tree': 'Trees', graph: 'Graphs', stack: 'Stacks & Queues', queue: 'Stacks & Queues', greedy: 'Greedy Algorithms', 'binary search': 'Binary Search', behavioral: 'Behavioral', behavioural: 'Behavioral', hr: 'Behavioral' };
  const label = alias[key] || (raw.length <= 3 ? raw.toUpperCase() : raw.charAt(0).toUpperCase() + raw.slice(1));
  return { label, skill: mapped.tracked ? mapped.skillName : (alias[key] && mapTopicToSkill(alias[key]).tracked ? mapTopicToSkill(alias[key]).skillName : null) };
};

/**
 * @param {object[]} experiences lean InterviewExperience docs
 */
const summariseExperiences = (experiences) => {
  const total = experiences.length;
  const offerKnown = experiences.filter((e) => e.offerReceived !== 'Pending');
  const offerYes = experiences.filter((e) => e.offerReceived === 'Yes').length;
  const offerN = offerKnown.length;
  const ci = wilson(offerYes, offerN);

  // ── difficulty ──
  const diffCounts = {};
  const bucketCounts = { Easy: 0, Medium: 0, Hard: 0 };
  let diffScoreSum = 0;
  let diffScoreN = 0;
  experiences.forEach((e) => {
    if (!e.difficulty) return;
    diffCounts[e.difficulty] = (diffCounts[e.difficulty] || 0) + 1;
    bucketCounts[DIFFICULTY_BUCKET[e.difficulty] || 'Medium']++;
    diffScoreSum += DIFFICULTY_SCORE[e.difficulty] || 2;
    diffScoreN++;
  });
  const bucketTotal = bucketCounts.Easy + bucketCounts.Medium + bucketCounts.Hard;

  // ── topics: share of reports mentioning each ──
  const topicReports = new Map(); // label → Set(expIdx)
  const topicSkill = new Map();
  const roundTypeCounts = {};
  const qTypeCounts = {};
  const roleCounts = {};
  const resourceCounts = {};
  const sampleQuestions = [];
  let roundTotal = 0;

  experiences.forEach((e, idx) => {
    if (e.role) roleCounts[e.role] = (roleCounts[e.role] || 0) + 1;
    (e.rounds || []).forEach((r) => {
      roundTotal++;
      if (r.type) roundTypeCounts[r.type] = (roundTypeCounts[r.type] || 0) + 1;
      const tags = [...(r.topics || []), ...(r.questions || []).flatMap((q) => q.topicTags || [])];
      tags.forEach((t) => {
        const c = canonicalTopic(t);
        if (!c) return;
        if (!topicReports.has(c.label)) topicReports.set(c.label, new Set());
        topicReports.get(c.label).add(idx);
        if (c.skill) topicSkill.set(c.label, c.skill);
      });
      (r.questions || []).forEach((q) => {
        if (q.questionType) qTypeCounts[q.questionType] = (qTypeCounts[q.questionType] || 0) + 1;
        if (q.text && q.text.length > 25 && sampleQuestions.length < 400) {
          sampleQuestions.push({ text: q.text, type: q.questionType || 'DSA', round: r.type, year: e.year, tags: q.topicTags || [] });
        }
      });
    });
    String(e.resourcesUsed || '').split(/,|;/).map((s) => s.trim()).filter(Boolean).forEach((r) => {
      resourceCounts[r] = (resourceCounts[r] || 0) + 1;
    });
  });

  const topTopics = [...topicReports.entries()]
    .map(([topic, set]) => ({ topic, count: set.size, pct: pct(set.size, total), skill: topicSkill.get(topic) || null }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

  // ── year trend ──
  const byYear = {};
  experiences.forEach((e) => {
    if (!e.year) return;
    byYear[e.year] = byYear[e.year] || { year: e.year, reports: 0, offers: 0, known: 0 };
    byYear[e.year].reports++;
    if (e.offerReceived !== 'Pending') byYear[e.year].known++;
    if (e.offerReceived === 'Yes') byYear[e.year].offers++;
  });
  const yearTrend = Object.values(byYear)
    .sort((a, b) => a.year - b.year)
    .map((y) => ({ year: y.year, reports: y.reports, offerRate: y.known ? Math.round((y.offers / y.known) * 100) : null }));

  const toDist = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count, pct: pct(count, n) }));

  return {
    totalReports: total,
    offerYes,
    offerKnown: offerN,
    offerRate: offerN ? Math.round((offerYes / offerN) * 100) : null,
    offerRateCI: ci ? { low: Math.round(ci.low * 100), high: Math.round(ci.high * 100), level: 95 } : null,
    dataConfidence: total === 0 ? 'none' : total <= 2 ? 'low' : total <= 9 ? 'medium' : 'high',
    difficultyDistribution: DIFFICULTY_ORDER.filter((d) => diffCounts[d]).map((d) => ({ label: d, count: diffCounts[d], pct: pct(diffCounts[d], diffScoreN) })),
    difficultyBuckets: ['Easy', 'Medium', 'Hard'].map((label) => ({ label, count: bucketCounts[label], pct: pct(bucketCounts[label], bucketTotal) })),
    avgDifficultyScore: diffScoreN ? +(diffScoreSum / diffScoreN).toFixed(2) : null,
    topTopics,
    roundTypeDistribution: toDist(roundTypeCounts, roundTotal),
    questionTypeDistribution: toDist(qTypeCounts, Object.values(qTypeCounts).reduce((a, b) => a + b, 0)),
    roleDistribution: toDist(roleCounts, total),
    avgRounds: total ? +(roundTotal / total).toFixed(1) : 0,
    yearTrend,
    topResources: Object.entries(resourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([resource, count]) => ({ resource, count, pct: pct(count, total) })),
    sampleQuestions: sampleQuestions.slice(0, 12)
  };
};

const getCompanyIntel = async (companyId) => {
  const experiences = await InterviewExperience.find({ companyId, status: 'Published' })
    .select('role year month offerReceived difficulty rounds resourcesUsed source isVerified')
    .lean();
  return summariseExperiences(experiences);
};

module.exports = { getCompanyIntel, summariseExperiences, wilson, canonicalTopic, DIFFICULTY_BUCKET };
