/**
 * Client-side mirror of server/services/experienceParser.js#scoreQuality — same weights, so the
 * live meter matches the score the server will store. Kept dependency-free for instant feedback.
 */
export function scoreQuality(exp = {}) {
  const rounds = exp.rounds || [];
  const questions = rounds.flatMap((r) => r.questions || []).filter((q) => (q.text || '').trim().length > 8);
  const specific = questions.filter((q) => (q.text || '').trim().length > 25);
  const topics = new Set(rounds.flatMap((r) => [...(r.topics || []), ...(r.questions || []).flatMap((q) => q.topicTags || [])]));
  const tips = (exp.overallTips || '').trim();
  const resources = (exp.resourcesUsed || '').split(/,|;/).map((s) => s.trim()).filter(Boolean);

  const parts = [
    { label: 'Basics (role, date, outcome)', max: 15, points: (exp.role ? 5 : 0) + (exp.year ? 3 : 0) + (exp.month ? 3 : 0) + (exp.offerReceived ? 4 : 0) },
    { label: 'Round-by-round structure', max: 20, points: Math.min(rounds.length, 4) * 5 },
    { label: 'Round details (type, duration, vibe)', max: 15, points: Math.min(15, rounds.slice(0, 4).reduce((n, r) => n + (r.type ? 1 : 0) + (r.duration ? 1.5 : 0) + (r.vibe ? 1.25 : 0), 0)) },
    { label: 'Concrete questions', max: 20, points: Math.min(20, questions.length * 4 + specific.length) },
    { label: 'Topics covered', max: 10, points: Math.min(10, topics.size * 2.5) },
    { label: 'Advice for candidates', max: 12, points: tips.length > 160 ? 12 : tips.length > 60 ? 8 : tips.length > 15 ? 4 : 0 },
    { label: 'Prep resources', max: 8, points: Math.min(8, resources.length * 4) }
  ].map((p) => ({ ...p, points: Math.round(p.points), done: p.points >= p.max * 0.7 }));

  const score = Math.min(100, parts.reduce((n, p) => n + p.points, 0));
  const suggestions = [];
  if (!rounds.length) suggestions.push('Add at least one interview round — round structure is the most valuable part.');
  else if (rounds.length < 2) suggestions.push('Most processes have 3-4 rounds. Add the others, even briefly.');
  if (questions.length < 3) suggestions.push('Quote the actual questions you were asked (even paraphrased).');
  if (!topics.size) suggestions.push('Tag topics (Graphs, DP, System Design…) to feed topic-frequency analytics.');
  if (rounds.some((r) => !r.duration)) suggestions.push('Add durations for each round.');
  if (tips.length < 60) suggestions.push('Finish with 2-3 sentences of advice: what would you do differently?');
  if (!resources.length) suggestions.push('Mention the resources you used.');

  const grade = score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 40 ? 'Fair' : 'Needs detail';
  return { score, grade, breakdown: parts, suggestions: suggestions.slice(0, 4) };
}

/** XP the server will award for a published submission with this score. */
export const estimateXp = (score) => (score < 25 ? 20 : 60 + Math.round(score * 1.4));
