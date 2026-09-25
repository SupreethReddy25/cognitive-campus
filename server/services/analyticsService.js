/**
 * Analytics Service — everything the dashboard / profile / placement pages need to tell a
 * *story* about a student, computed from real submissions + BKT state.
 *
 * @module analyticsService
 */

const User = require('../models/User');
const SkillState = require('../models/SkillState');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const bkt = require('./bktEngine');
const knowledge = require('./knowledgeService');
const streakService = require('./streakService');
const dailyChallenge = require('./dailyChallengeService');
const achievementService = require('./achievementService');
const recommendationEngine = require('./recommendationEngine');

const DAY = 86400000;
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Per-skill enriched states for a user (all 12 skills, even untouched).
 */
const getSkillOverview = async (userId, ctx = {}) => {
  const [skills, states, cohort, traj] = await Promise.all([
    knowledge.getSkills(),
    SkillState.find({ userId }).lean(),
    knowledge.getCohortSkillStats(),
    ctx.trajectories ? Promise.resolve(ctx.trajectories) : knowledge.getUserTrajectories(userId)
  ]);
  const stateBySkill = new Map(states.map((s) => [String(s.skillId), s]));

  // attempts per active day over the last 14 days → pace for time-to-mastery predictions
  const since = Date.now() - 14 * DAY;
  const recent = traj.submissions.filter((s) => new Date(s.createdAt).getTime() >= since);
  const activeDays = new Set(recent.map((s) => dayKey(s.createdAt))).size;
  const attemptsPerDay = activeDays ? recent.length / 14 : 0.5;

  const overview = skills.map((skill) => {
    const sid = String(skill._id);
    const state = stateBySkill.get(sid) || { masteryP: knowledge.paramsFor(traj.paramsMap, sid).pL0 ?? bkt.P_L0, attempts: 0, correctAttempts: 0, isUnlocked: (skill.prerequisites || []).length === 0, isMastered: false };
    return {
      ...knowledge.describeSkillState({
        state,
        skill,
        trajectory: traj.bySkill.get(sid),
        params: knowledge.paramsFor(traj.paramsMap, sid),
        cohort: cohort.get(sid),
        attemptsPerDay
      }),
      prerequisites: (skill.prerequisites || []).map((p) => ({ _id: String(p._id), name: p.name })),
      description: skill.description
    };
  });

  return { skills: overview, attemptsPerDay, trajectories: traj };
};

/**
 * XP timeline for the last `days` days plus annotations (level-ups, streak milestones, firsts).
 */
const buildXpTimeline = (subs, user, days = 30) => {
  const start = new Date(startOfToday().getTime() - (days - 1) * DAY);
  const xpByDay = new Map();
  for (const s of subs) {
    const k = dayKey(s.createdAt);
    xpByDay.set(k, (xpByDay.get(k) || 0) + (s.xpAwarded || 0));
  }

  // walk backwards from current XP so the last point always equals user.xp
  const points = [];
  let cumulative = user.xp || 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() + i * DAY);
    const k = dayKey(d);
    const xp = xpByDay.get(k) || 0;
    points.unshift({ date: k, xp, cumulative });
    cumulative -= xp;
  }

  const annotations = [];
  // level-ups
  points.forEach((p, i) => {
    const prev = i === 0 ? p.cumulative - p.xp : points[i - 1].cumulative;
    const lvlBefore = Math.floor(Math.max(0, prev) / 100) + 1;
    const lvlAfter = Math.floor(p.cumulative / 100) + 1;
    if (lvlAfter > lvlBefore) annotations.push({ date: p.date, type: 'level', label: `Level ${lvlAfter}` });
  });

  // streak milestones from the active-day runs
  const activeDays = [...new Set(subs.map((s) => dayKey(s.createdAt)))].sort();
  let run = 0;
  let prevDay = null;
  const milestones = new Set(streakService.MILESTONES);
  activeDays.forEach((k) => {
    const d = new Date(`${k}T00:00:00`);
    run = prevDay && Math.round((d - prevDay) / DAY) === 1 ? run + 1 : 1;
    prevDay = d;
    if (milestones.has(run) && points.some((p) => p.date === k)) annotations.push({ date: k, type: 'streak', label: `${run}-day streak` });
  });

  // first solve / first hard in window
  const firstCorrect = subs.find((s) => s.isCorrect);
  if (firstCorrect && points.some((p) => p.date === dayKey(firstCorrect.createdAt))) annotations.push({ date: dayKey(firstCorrect.createdAt), type: 'milestone', label: 'First solve' });

  return { points, annotations: annotations.sort((a, b) => a.date.localeCompare(b.date)) };
};

/**
 * Rule-based, data-backed insights ("your accuracy is up 12 points…").
 */
const buildInsights = ({ skills, subs, user, streak, peers }) => {
  const insights = [];
  const touched = skills.filter((s) => s.attempts > 0);

  // accuracy trend: last 7d vs previous 7d
  const now = Date.now();
  const inRange = (from, to) => subs.filter((s) => { const t = new Date(s.createdAt).getTime(); return t >= now - from * DAY && t < now - to * DAY; });
  const cur = inRange(7, 0);
  const prev = inRange(14, 7);
  const acc = (arr) => (arr.length ? arr.filter((s) => s.isCorrect).length / arr.length : null);
  if (cur.length >= 3 && prev.length >= 3) {
    const delta = Math.round((acc(cur) - acc(prev)) * 100);
    if (Math.abs(delta) >= 5) {
      insights.push({ type: delta > 0 ? 'positive' : 'warning', icon: delta > 0 ? 'trending-up' : 'trending-down', title: delta > 0 ? 'Accuracy is climbing' : 'Accuracy dipped this week', text: `Your pass rate is ${Math.round(acc(cur) * 100)}% this week vs ${Math.round(acc(prev) * 100)}% last week (${delta > 0 ? '+' : ''}${delta} pts).` });
    }
  }

  // strongest / weakest
  if (touched.length >= 2) {
    const sorted = [...touched].sort((a, b) => b.masteryP - a.masteryP);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.masteryP >= 0.6) insights.push({ type: 'positive', icon: 'award', title: `${best.name} is your superpower`, text: `${Math.round(best.masteryP * 100)}% mastery${best.cohortDelta !== null && best.cohortDelta > 0.05 ? `, ${Math.round(best.cohortDelta * 100)} pts above the cohort average` : ''}.` });
    if (worst.masteryP < 0.55 && worst.skillId !== best.skillId) insights.push({ type: 'focus', icon: 'target', title: `Focus area: ${worst.name}`, text: `At ${Math.round(worst.masteryP * 100)}% it's your weakest tracked skill${worst.predictedAttemptsToMastery ? ` — roughly ${worst.predictedAttemptsToMastery} more solid attempts to master` : ''}.` });
  }

  // spaced repetition
  const due = skills.filter((s) => s.reviewDue).sort((a, b) => (a.reviewInDays ?? 0) - (b.reviewInDays ?? 0));
  if (due.length) insights.push({ type: 'review', icon: 'refresh', title: `${due.length} skill${due.length > 1 ? 's' : ''} due for review`, text: `${due.slice(0, 3).map((s) => s.name).join(', ')} — memory fades on a forgetting curve; a short refresh now locks it in.` });

  // best time of day
  const byHour = {};
  subs.forEach((s) => {
    const h = new Date(s.createdAt).getHours();
    const bucket = h < 6 ? 'late night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
    byHour[bucket] = byHour[bucket] || { n: 0, ok: 0 };
    byHour[bucket].n++;
    if (s.isCorrect) byHour[bucket].ok++;
  });
  const buckets = Object.entries(byHour).filter(([, v]) => v.n >= 6).map(([k, v]) => ({ k, rate: v.ok / v.n, n: v.n })).sort((a, b) => b.rate - a.rate);
  if (buckets.length >= 2 && buckets[0].rate - buckets[buckets.length - 1].rate >= 0.15) {
    insights.push({ type: 'info', icon: 'clock', title: `You solve best in the ${buckets[0].k}`, text: `${Math.round(buckets[0].rate * 100)}% pass rate vs ${Math.round(buckets[buckets.length - 1].rate * 100)}% in the ${buckets[buckets.length - 1].k}. Schedule hard problems then.` });
  }

  // grit: attempts per solved problem
  const solvedIds = new Set(subs.filter((s) => s.isCorrect).map((s) => String(s.problemId)));
  if (solvedIds.size >= 5) {
    const attemptsOnSolved = subs.filter((s) => solvedIds.has(String(s.problemId))).length;
    const avg = attemptsOnSolved / solvedIds.size;
    insights.push({ type: 'info', icon: 'repeat', title: `${avg.toFixed(1)} attempts per solve`, text: avg < 1.8 ? 'You usually get it right first time — try harder problems to keep growing.' : 'Iterating is fine — using hints earlier could cut this down.' });
  }

  // peers
  if (peers && peers.overallPercentile !== null && peers.peerCount >= 5) {
    insights.push({ type: peers.overallPercentile >= 60 ? 'positive' : 'info', icon: 'users', title: `Top ${Math.max(1, 100 - peers.overallPercentile)}% at ${peers.scope}`, text: `Your average mastery beats ${peers.overallPercentile}% of ${peers.peerCount} peers.` });
  }

  if (streak.atRisk) insights.unshift({ type: 'warning', icon: 'flame', title: 'Streak at risk', text: streak.brokenBy ? `You missed a day — a streak freeze will cover it if you solve something today.` : `Solve one problem${streak.hoursLeft ? ` in the next ${streak.hoursLeft}h` : ' today'} to keep your ${streak.streak}-day streak.` });

  return insights.slice(0, 6);
};

/**
 * One-shot payload for the dashboard "mission control".
 */
const getDashboard = async (userId) => {
  const [user, traj] = await Promise.all([
    User.findById(userId).select('-passwordHash -encryptedGeminiKey -keyIv -keyAuthTag').populate('collegeId', 'name shortName slug').lean(),
    knowledge.getUserTrajectories(userId)
  ]);
  if (!user) return null;

  const { skills } = await getSkillOverview(userId, { trajectories: traj });
  const subs = traj.submissions; // chronological, lean
  const today = startOfToday();
  const todaysSubs = subs.filter((s) => new Date(s.createdAt) >= today);
  const problemIdx = traj.problemIdx;

  const [daily, recs, totalStudents, usersAbove, achievementDefs] = await Promise.all([
    dailyChallenge.getDailyChallenge(userId),
    recommendationEngine.getRecommendations(userId, { limit: 4 }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', xp: { $gt: user.xp || 0 } }),
    achievementService.describeForUser(await User.findById(userId))
  ]);

  const streak = streakService.describeStreak(user);
  const timeline = knowledge.buildMasteryTimeline(traj.bySkill, 30, skills.length || 12);
  const xpTimeline = buildXpTimeline(subs, user, 30);

  // ── last problem / continue ──
  const bestByProblem = new Map();
  subs.forEach((s) => {
    const k = String(s.problemId);
    const e = bestByProblem.get(k) || { attempts: 0, solved: false, last: null };
    e.attempts++;
    if (s.isCorrect) e.solved = true;
    e.last = s.createdAt;
    bestByProblem.set(k, e);
  });
  const lastSub = subs[subs.length - 1];
  let lastProblem = null;
  if (lastSub) {
    const p = problemIdx.get(String(lastSub.problemId));
    const stat = bestByProblem.get(String(lastSub.problemId));
    if (p) lastProblem = { _id: p._id, title: p.title, difficulty: p.difficulty, solved: stat.solved, attempts: stat.attempts, lastAttemptAt: lastSub.createdAt };
  }
  // most recent unsolved attempt (last 14 days) — the one worth resuming
  let resume = null;
  for (let i = subs.length - 1; i >= 0; i--) {
    const s = subs[i];
    if (Date.now() - new Date(s.createdAt).getTime() > 14 * DAY) break;
    const stat = bestByProblem.get(String(s.problemId));
    if (stat && !stat.solved) {
      const p = problemIdx.get(String(s.problemId));
      if (p) { resume = { _id: p._id, title: p.title, difficulty: p.difficulty, attempts: stat.attempts, lastAttemptAt: s.createdAt }; break; }
    }
  }

  // ── peers (college) ──
  const peers = await getPeerComparison(userId, { user, skills });

  const insights = buildInsights({ skills, subs, user, streak, peers });

  const weakest = skills.filter((s) => s.isUnlocked && s.attempts > 0).sort((a, b) => a.masteryP - b.masteryP)[0] || null;
  const reviewDue = skills.find((s) => s.reviewDue) || null;

  const recent = await Submission.find({ userId }).sort({ createdAt: -1 }).limit(8).select('-code -astResult').populate('problemId', 'title difficulty').lean();

  const solvedSet = new Set(subs.filter((s) => s.isCorrect).map((s) => String(s.problemId)));
  const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
  solvedSet.forEach((id) => { const d = problemIdx.get(id)?.difficulty; if (d && solvedByDifficulty[d] !== undefined) solvedByDifficulty[d]++; });

  const totalCatalogue = problemIdx.size;

  return {
    user: {
      _id: user._id,
      name: user.name,
      firstName: (user.name || '').split(' ')[0],
      xp: user.xp,
      level: user.level,
      levelProgress: (user.xp || 0) % 100,
      streak: streak.streak,
      longestStreak: Math.max(user.longestStreak || 0, streak.streak),
      college: user.collegeId || null,
      targetRole: user.targetRole || null,
      role: user.role
    },
    streak: { ...streak, multiplier: streakService.streakMultiplier(streak.streak), freeze: { available: streak.freezeAvailable, lastUsedAt: user.streakFreeze?.lastUsedAt || null } },
    today: {
      attempts: todaysSubs.length,
      solved: new Set(todaysSubs.filter((s) => s.isCorrect).map((s) => String(s.problemId))).size,
      xp: todaysSubs.reduce((n, s) => n + (s.xpAwarded || 0), 0)
    },
    rank: { position: usersAbove + 1, total: totalStudents, percentile: totalStudents > 1 ? Math.round((1 - usersAbove / totalStudents) * 100) : 100 },
    totals: { solved: solvedSet.size, attempts: subs.length, catalogue: totalCatalogue, solvedByDifficulty, mastered: skills.filter((s) => s.isMastered).length, skillCount: skills.length },
    skills,
    masteryTimeline: timeline.map((t) => ({ date: t.date, avgMastery: t.avgMastery, touchedSkills: t.touchedSkills, perSkill: t.perSkill })),
    xpTimeline,
    dailyChallenge: daily,
    lastProblem,
    resume,
    recommendations: recs,
    recentSubmissions: recent,
    insights,
    peers,
    achievements: { unlocked: achievementDefs.filter((a) => a.unlocked).length, total: achievementDefs.length, recent: achievementDefs.filter((a) => a.unlocked).sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)).slice(0, 4) },
    context: {
      firstName: (user.name || '').split(' ')[0],
      level: user.level,
      streak: streak.streak,
      streakAtRisk: streak.atRisk,
      weakest: weakest ? { name: weakest.name, masteryP: weakest.masteryP } : null,
      reviewDue: reviewDue ? reviewDue.name : null,
      lastProblemTitle: resume?.title || null
    },
    activity: buildActivityMap(subs)
  };
};

const buildActivityMap = (subs) => {
  const map = {};
  const from = Date.now() - 365 * DAY;
  subs.forEach((s) => {
    if (new Date(s.createdAt).getTime() < from) return;
    const k = dayKey(s.createdAt);
    map[k] = (map[k] || 0) + 1;
  });
  return map;
};

/**
 * Compare a student's mastery against college (or global) peers — anonymised.
 */
const getPeerComparison = async (userId, pre = {}) => {
  const user = pre.user || (await User.findById(userId).select('collegeId').populate('collegeId', 'name shortName').lean());
  const skills = pre.skills || (await getSkillOverview(userId)).skills;
  const collegeId = user.collegeId?._id || user.collegeId || null;

  const peerUsers = await User.find(collegeId ? { collegeId, role: 'student' } : { role: 'student' }).select('_id').lean();
  const peerIds = peerUsers.map((u) => u._id);
  const scope = collegeId ? (user.collegeId?.shortName || 'your college') : 'the platform';

  // one aggregation: avg mastery per user (attempted skills only), plus per-skill distributions
  const states = await SkillState.find({ userId: { $in: peerIds }, attempts: { $gt: 0 } }).select('userId skillId masteryP').lean();
  const bySkill = new Map();
  const byUser = new Map();
  states.forEach((s) => {
    const k = String(s.skillId);
    if (!bySkill.has(k)) bySkill.set(k, []);
    bySkill.get(k).push({ u: String(s.userId), p: s.masteryP });
    if (!byUser.has(String(s.userId))) byUser.set(String(s.userId), []);
    byUser.get(String(s.userId)).push(s.masteryP);
  });

  const me = String(userId);
  const perSkill = skills.map((s) => {
    const arr = bySkill.get(s.skillId) || [];
    const others = arr.filter((x) => x.u !== me);
    const mine = arr.find((x) => x.u === me);
    const p = mine ? mine.p : s.masteryP;
    const below = others.filter((x) => x.p < p).length;
    const avg = others.length ? others.reduce((n, x) => n + x.p, 0) / others.length : null;
    return {
      skillId: s.skillId,
      name: s.name,
      mastery: p,
      peerAvg: avg === null ? null : +avg.toFixed(4),
      percentile: others.length >= 3 && s.attempts > 0 ? Math.round((below / others.length) * 100) : null,
      peers: others.length
    };
  });

  const avgOf = (a) => a.reduce((n, x) => n + x, 0) / a.length;
  const myAvg = byUser.get(me) ? avgOf(byUser.get(me)) : null;
  const others = [...byUser.entries()].filter(([u]) => u !== me).map(([, v]) => avgOf(v));
  const overallPercentile = myAvg !== null && others.length >= 3 ? Math.round((others.filter((x) => x < myAvg).length / others.length) * 100) : null;

  return {
    scope,
    scopeType: collegeId ? 'college' : 'global',
    peerCount: others.length,
    overallPercentile,
    myAvgMastery: myAvg === null ? null : +myAvg.toFixed(4),
    peerAvgMastery: others.length ? +avgOf(others).toFixed(4) : null,
    perSkill
  };
};

/**
 * Profile-level "learning intelligence": velocity, consistency, strengths/weaknesses.
 */
const getLearningProfile = async (userId) => {
  const dash = await getDashboard(userId);
  if (!dash) return null;
  const { skills, masteryTimeline, activity } = dash;

  const last = masteryTimeline[masteryTimeline.length - 1];
  const weekAgo = masteryTimeline[Math.max(0, masteryTimeline.length - 8)];
  const monthAgo = masteryTimeline[0];
  const activeDays14 = Object.keys(activity).filter((k) => Date.now() - new Date(`${k}T00:00:00`).getTime() < 14 * DAY).length;
  const solvedPerWeek = dash.recentSubmissions.filter((s) => s.isCorrect && Date.now() - new Date(s.createdAt) < 7 * DAY).length;

  const touched = skills.filter((s) => s.attempts > 0);
  const strengths = [...touched].sort((a, b) => b.masteryP - a.masteryP).slice(0, 3);
  const weaknesses = [...touched].sort((a, b) => a.masteryP - b.masteryP).slice(0, 3);

  const fastest = [...touched].filter((s) => s.trend === 'up').sort((a, b) => b.velocity - a.velocity)[0] || null;

  return {
    velocity: {
      masteryPerWeek: +(last.avgMastery - weekAgo.avgMastery).toFixed(4),
      masteryPerMonth: +(last.avgMastery - monthAgo.avgMastery).toFixed(4),
      activeDaysLast14: activeDays14,
      consistency: Math.round((activeDays14 / 14) * 100),
      solvedThisWeek: solvedPerWeek,
      fastestGrowing: fastest ? { name: fastest.name, velocity: fastest.velocity } : null
    },
    strengths: strengths.map((s) => ({ name: s.name, masteryP: s.masteryP, cohortDelta: s.cohortDelta })),
    weaknesses: weaknesses.map((s) => ({ name: s.name, masteryP: s.masteryP, predictedAttemptsToMastery: s.predictedAttemptsToMastery })),
    insights: dash.insights,
    skills,
    masteryTimeline,
    peers: dash.peers,
    streak: dash.streak,
    totals: dash.totals,
    activity
  };
};

module.exports = { getDashboard, getSkillOverview, getPeerComparison, getLearningProfile, buildInsights, buildXpTimeline };
