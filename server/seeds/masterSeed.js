/**
 * masterSeed.js — populate a Cognitive Campus database with rich, realistic data.
 *
 *   node seeds/masterSeed.js            # everything
 *   node seeds/masterSeed.js --quick    # skip the (slower) demo-cohort simulation
 *
 * IDEMPOTENT — safe to run any number of times:
 *   • catalogue data (skills, colleges, companies, problems, sheets, placement records,
 *     experiences) is UPSERTED on stable natural keys, never duplicated;
 *   • the demo cohort's *derived* data (submissions, skill states, arena ratings) is deleted and
 *     regenerated deterministically — and only for cohort accounts (demo emails), never for real users.
 *
 * Demo logins (password for all: Demo@12345)
 *   demo@cognitivecampus.dev   featured student (streak, resume-able problem, review due)
 *   admin@cognitivecampus.dev  placement-cell admin
 *   <name>@demo.cognitivecampus.dev   62 more students across 18 colleges
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Skill = require('../models/Skill');
const College = require('../models/College');
const Company = require('../models/Company');
const Problem = require('../models/Problem');
const ProblemSheet = require('../models/ProblemSheet');
const CollegePlacementRecord = require('../models/CollegePlacementRecord');
const InterviewExperience = require('../models/InterviewExperience');
const User = require('../models/User');
const Submission = require('../models/Submission');
const SkillState = require('../models/SkillState');
const ArenaRating = require('../models/ArenaRating');
const UserSheetProgress = require('../models/UserSheetProgress');
const BktParams = require('../models/BktParams');

const bkt = require('../services/bktEngine');
const knowledge = require('../services/knowledgeService');
const streakService = require('../services/streakService');
const achievementService = require('../services/achievementService');
const logger = require('../utils/logger');

const { SKILLS } = require('./skillSeed');
const { COLLEGES } = require('./collegeSeed');
const companies = require('./data/companies');
const { getCatalog } = require('./data/problemCatalog');
const { buildSheets } = require('./data/sheets');
const { buildPlacementRecords } = require('./data/placementRecords');
const { simulateCohort, mulberry32 } = require('./data/cohort');
const experiences = [...require('./data/experiencesA'), ...require('./data/experiencesB'), ...require('./data/experiencesC')];

const DEMO_PASSWORD = 'Demo@12345';
const QUICK = process.argv.includes('--quick');

const say = (msg) => { logger.info(`[seed] ${msg}`); };

// ─── 1. Skills ───────────────────────────────────────────────────────────────
const seedSkills = async () => {
  for (const s of SKILLS) {
    await Skill.updateOne({ name: s.name }, { $set: { description: s.description, difficultyWeight: s.difficultyWeight, order: s.order } }, { upsert: true });
  }
  const all = await Skill.find({});
  const idByName = new Map(all.map((s) => [s.name, s._id]));
  for (const s of SKILLS) {
    await Skill.updateOne({ name: s.name }, { $set: { prerequisites: s.prerequisites.map((p) => idByName.get(p)).filter(Boolean) } });
  }
  say(`skills: ${all.length}`);
  return Skill.find({}).sort({ order: 1 });
};

// ─── 2. Colleges ─────────────────────────────────────────────────────────────
const seedColleges = async () => {
  for (const c of COLLEGES) {
    await College.updateOne({ slug: c.slug }, { $set: { ...c, verified: true } }, { upsert: true });
  }
  const all = await College.find({});
  say(`colleges: ${all.length}`);
  return new Map(all.map((c) => [c.slug, c]));
};

// ─── 3. Companies ────────────────────────────────────────────────────────────
const seedCompanies = async () => {
  for (const c of companies) {
    await Company.updateOne({ slug: c.slug }, { $set: c, $setOnInsert: { viewCount: 0 } }, { upsert: true });
  }
  // plausible starting popularity so "trending" isn't empty
  const rand = mulberry32(7);
  const tierBoost = { FAANG: 900, Product: 450, Finance: 500, Service: 300, Startup: 250, Other: 100 };
  for (const c of await Company.find({ viewCount: { $lte: 0 } })) {
    c.viewCount = Math.round((tierBoost[c.tier] || 200) * (0.5 + rand()));
    await c.save();
  }
  const all = await Company.find({});
  say(`companies: ${all.length}`);
  return new Map(all.map((c) => [c.slug, c]));
};

// ─── 4. Problems ─────────────────────────────────────────────────────────────
const seedProblems = async (skills) => {
  const skillId = new Map(skills.map((s) => [s.name, s._id]));
  const skillOrder = new Map(skills.map((s) => [s.name, s.order]));
  const diffRank = { easy: 0, medium: 1, hard: 2 };
  const catalog = getCatalog().sort((a, b) => skillOrder.get(a.skill) - skillOrder.get(b.skill) || diffRank[a.difficulty] - diffRank[b.difficulty] || a.title.localeCompare(b.title));
  const xpMap = { easy: 10, medium: 20, hard: 40 };

  for (const p of catalog) {
    const doc = {
      description: p.description,
      difficulty: p.difficulty,
      skillId: skillId.get(p.skill),
      starterCode: p.starterCode,
      starterCodeMap: p.starterCodeMap,
      constraints: p.constraints,
      testCases: p.testCases,
      examples: p.examples,
      hints: p.hints,
      companies: p.companies,
      tags: p.tags,
      frequency: p.frequency,
      checker: p.checker,
      xpReward: xpMap[p.difficulty],
      isActive: true,
      status: 'approved'
    };
    if (p.editorial) doc.editorial = p.editorial;
    await Problem.updateOne({ title: p.title }, { $set: doc }, { upsert: true });
  }
  const all = await Problem.find({ status: 'approved' }).populate('skillId', 'name').lean();
  say(`problems: ${all.length} approved (${catalog.length} in catalogue)`);
  return { catalog, problems: all };
};

// ─── 5. Sheets ───────────────────────────────────────────────────────────────
const seedSheets = async (problems) => {
  const byTitle = new Map(problems.map((p) => [p.title.toLowerCase(), p]));
  const sheets = buildSheets(byTitle);
  for (const s of sheets) await ProblemSheet.updateOne({ slug: s.slug }, { $set: s }, { upsert: true });
  say(`sheets: ${sheets.length} (${sheets.map((s) => `${s.name}: ${s.problems.filter((p) => p.isAvailable).length}/${s.totalProblems} on-platform`).join('; ')})`);
};

// ─── 6. Placement records ────────────────────────────────────────────────────
const seedPlacementRecords = async (collegeBySlug, companyBySlug) => {
  const rows = buildPlacementRecords();
  let n = 0;
  for (const r of rows) {
    const college = collegeBySlug.get(r.collegeSlug);
    const company = companyBySlug.get(r.companySlug);
    if (!college || !company) continue;
    const { collegeSlug, companySlug, ...rest } = r;
    await CollegePlacementRecord.updateOne(
      { collegeId: college._id, companyId: company._id, hiringYear: r.hiringYear, hiringSeason: r.hiringSeason },
      { $set: { ...rest, collegeId: college._id, companyId: company._id } },
      { upsert: true }
    );
    n++;
  }
  say(`placement records: ${n}`);
};

// ─── 7. Demo cohort ──────────────────────────────────────────────────────────
const seedCohort = async ({ skills, problems, collegeBySlug, companyBySlug, catalog }) => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const editorialByTitle = new Map(catalog.map((c) => [c.title, c.editorial?.code || {}]));

  // shape the simulator's inputs
  const skillDocs = skills.map((s) => ({ name: s.name, prerequisites: (s.prerequisites || []).map((pid) => skills.find((x) => String(x._id) === String(pid))?.name).filter(Boolean) }));
  const problemInputs = problems.filter((p) => p.skillId).map((p) => ({ _id: p._id, title: p.title, difficulty: p.difficulty, skillName: p.skillId.name, testCount: (p.testCases || []).length || 3 }));

  const sim = simulateCohort({ problems: problemInputs, skills: skillDocs, now: new Date() });
  say(`cohort simulated: ${sim.length} students, ${sim.reduce((n, s) => n + s.attempts.length, 0)} submissions`);

  // users -------------------------------------------------------------
  const userIds = new Map();
  for (const s of sim) {
    const college = collegeBySlug.get(s.college);
    const company = s.targetCompany ? companyBySlug.get(s.targetCompany) : null;
    const created = new Date(Date.now() - (s.joinedDaysAgo + 2) * 86400000);
    const doc = await User.findOneAndUpdate(
      { email: s.email },
      {
        $set: { name: s.name, passwordHash, role: 'student', collegeId: college?._id || null, targetCompanyId: company?._id || null, targetRole: s.targetRole, xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: null, achievements: [], bookmarks: [] },
        $setOnInsert: { createdAt: created }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    userIds.set(s.key, doc._id);
  }
  // placement-cell admin
  await User.findOneAndUpdate(
    { email: 'admin@cognitivecampus.dev' },
    { $set: { name: 'Priya Nair (Placement Cell)', passwordHash, role: 'admin', collegeId: collegeBySlug.get('nit-trichy')?._id || null, xp: 0, level: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const ids = [...userIds.values()];
  await Promise.all([
    Submission.deleteMany({ userId: { $in: ids } }),
    SkillState.deleteMany({ userId: { $in: ids } }),
    ArenaRating.deleteMany({ userId: { $in: ids } }),
    UserSheetProgress.deleteMany({ userId: { $in: ids } })
  ]);

  // submissions + xp + streak ----------------------------------------
  const problemById = new Map(problems.map((p) => [String(p._id), p]));
  const skillIdByName = new Map(skills.map((s) => [s.name, s._id]));
  const submissionDocs = [];
  const userStates = new Map();

  for (const s of sim) {
    const userId = userIds.get(s.key);
    const u = { streak: 0, longestStreak: 0, lastActiveDate: null, streakFreeze: { available: 1, lastRefillWeek: null, lastUsedAt: null } };
    let xp = 0;
    const paidBase = new Map(); // problemId → base XP already awarded
    const solvedOnce = new Set();
    let lastDay = null;

    for (const a of s.attempts) {
      const dayKeyStr = a.at.toDateString();
      if (dayKeyStr !== lastDay) { streakService.recordActivity(u, a.at); lastDay = dayKeyStr; }
      const problem = problemById.get(String(a.problemId));
      const fullXP = problem?.xpReward || 10;
      const earnedTotal = a.correct ? fullXP : a.passed / a.total > 0.5 ? Math.floor(fullXP * 0.3) : 0;
      const already = paidBase.get(String(a.problemId)) || 0;
      const base = solvedOnce.has(String(a.problemId)) ? 0 : Math.max(0, earnedTotal - already);
      const mult = streakService.streakMultiplier(u.streak);
      const award = Math.round(base * mult);
      if (base) paidBase.set(String(a.problemId), already + base);
      if (a.correct) solvedOnce.add(String(a.problemId));
      xp += award;

      const codeByLang = editorialByTitle.get(a.title) || {};
      let code;
      if (a.correct) {
        code = a.language === 'python' ? codeByLang.python : a.language === 'javascript' ? codeByLang.javascript : `// ${a.language} solution for ${a.title}\n// (accepted)`;
      }
      if (!code) {
        code = a.language === 'python' ? `def solution(*args):\n    # attempt for ${a.title}\n    pass` : `function solution() {\n  // attempt for ${a.title}\n}`;
        if (a.correct) code = a.language === 'python' ? codeByLang.python || code : codeByLang.javascript || code;
      }

      submissionDocs.push({
        userId, problemId: a.problemId, skillId: skillIdByName.get(a.skillName), code: code.slice(0, 4000), language: a.language,
        isCorrect: a.correct, passedTestCases: a.passed, totalTestCases: a.total, xpAwarded: award, timeTaken: a.timeTaken, hintsUsed: a.hints,
        executionTime: Math.round(40 + Math.random() * 180), streakMultiplier: mult, createdAt: a.at, updatedAt: a.at
      });
    }
    userStates.set(s.key, { userId, xp, ...u });
  }

  if (submissionDocs.length) await Submission.collection.insertMany(submissionDocs.map((d) => ({ ...d, _id: new mongoose.Types.ObjectId(), __v: 0 })), { ordered: false });
  say(`submissions inserted: ${submissionDocs.length}`);

  // learn BKT parameters from this real(istic) data ------------------
  const fit = await knowledge.refitAllSkillParams();
  say(`BKT refit: ${fit.filter((f) => f.fitted).length}/${fit.length} skills fitted; e.g. ${fit.filter((f) => f.fitted).slice(0, 3).map((f) => `${f.skill} pT=${f.params.pT}`).join(', ')}`);
  const paramsMap = await knowledge.getParamsMap();

  // replay attempts with the fitted parameters → masteries + skill states
  const bySkillUser = new Map(); // `${userId}:${skillId}` → [{sub}]
  const stored = await Submission.find({ userId: { $in: ids } }).select('userId skillId problemId isCorrect hintsUsed createdAt').sort({ createdAt: 1 }).lean();
  stored.forEach((sub) => {
    const k = `${sub.userId}:${sub.skillId}`;
    if (!bySkillUser.has(k)) bySkillUser.set(k, []);
    bySkillUser.get(k).push(sub);
  });

  const subOps = [];
  const stateDocs = [];
  const masteryByUserSkill = new Map();
  for (const [k, subs] of bySkillUser) {
    const [uid, sid] = k.split(':');
    const params = knowledge.paramsFor(paramsMap, sid);
    const traj = bkt.replayTrajectory(subs.map((sub) => ({ correct: sub.isCorrect, at: sub.createdAt, difficulty: problemById.get(String(sub.problemId))?.difficulty, hints: sub.hintsUsed })), params);
    let prev = params.pL0;
    subs.forEach((sub, i) => {
      subOps.push({ updateOne: { filter: { _id: sub._id }, update: { $set: { masteryBefore: prev, masteryAfter: traj[i].masteryP } } } });
      prev = traj[i].masteryP;
    });
    const last = subs[subs.length - 1];
    const finalP = traj[traj.length - 1].masteryP;
    masteryByUserSkill.set(k, finalP);
    stateDocs.push({
      userId: new mongoose.Types.ObjectId(uid), skillId: new mongoose.Types.ObjectId(sid), masteryP: finalP, attempts: subs.length, correctAttempts: subs.filter((x) => x.isCorrect).length,
      lastUpdated: last.createdAt, isMastered: finalP >= bkt.MASTERY_THRESHOLD, isUnlocked: true, createdAt: subs[0].createdAt, updatedAt: last.createdAt
    });
  }
  if (subOps.length) await Submission.bulkWrite(subOps, { ordered: false });

  // untouched skills + unlock rules
  const skillById = new Map(skills.map((s) => [String(s._id), s]));
  const have = new Set(stateDocs.map((d) => `${d.userId}:${d.skillId}`));
  for (const userId of ids) {
    for (const skill of skills) {
      const k = `${userId}:${skill._id}`;
      if (have.has(k)) continue;
      stateDocs.push({ userId, skillId: skill._id, masteryP: knowledge.paramsFor(paramsMap, skill._id).pL0 ?? bkt.P_L0, attempts: 0, correctAttempts: 0, lastUpdated: new Date(), isMastered: false, isUnlocked: false, createdAt: new Date(), updatedAt: new Date() });
    }
  }
  const stateByKey = new Map(stateDocs.map((d) => [`${d.userId}:${d.skillId}`, d]));
  for (const d of stateDocs) {
    if (d.attempts > 0) continue;
    const prereqs = skillById.get(String(d.skillId)).prerequisites || [];
    d.isUnlocked = prereqs.every((pid) => (stateByKey.get(`${d.userId}:${pid}`)?.masteryP ?? 0) >= bkt.UNLOCK_THRESHOLD);
  }
  await SkillState.collection.insertMany(stateDocs.map((d) => ({ ...d, _id: new mongoose.Types.ObjectId(), __v: 0 })), { ordered: false });
  say(`skill states: ${stateDocs.length}`);

  // users: xp / level / streak -----------------------------------------
  const userOps = [];
  for (const s of sim) {
    const st = userStates.get(s.key);
    const last = s.attempts[s.attempts.length - 1];
    userOps.push({
      updateOne: {
        filter: { _id: st.userId },
        update: { $set: { xp: st.xp, level: Math.floor(st.xp / 100) + 1, streak: st.streak, longestStreak: st.longestStreak, lastActiveDate: last ? last.at : null, streakFreeze: st.streakFreeze } }
      }
    });
  }
  await User.bulkWrite(userOps);

  // achievements (adds their bonus XP) ---------------------------------
  let badgeCount = 0;
  for (const id of ids) badgeCount += (await achievementService.evaluate(id)).length;
  say(`achievements unlocked across cohort: ${badgeCount}`);

  // arena ratings -------------------------------------------------------
  const rand = mulberry32(99);
  const names = new Map(sim.map((s) => [userIds.get(s.key).toString(), s.name]));
  const arena = [];
  const activeIds = sim.filter((s) => s.attempts.length > 12).map((s) => userIds.get(s.key));
  for (const s of sim) {
    if (s.attempts.length < 10) continue;
    const uid = userIds.get(s.key);
    const games = 2 + Math.floor(rand() * 14);
    let elo = 1000;
    const history = [];
    let wins = 0, losses = 0, draws = 0;
    for (let g = 0; g < games; g++) {
      const opp = activeIds[Math.floor(rand() * activeIds.length)];
      if (String(opp) === String(uid)) continue;
      const strength = clamp01(0.5 + s.ability * 0.18);
      const r = rand();
      const result = r < strength ? 'win' : r < strength + 0.06 ? 'draw' : 'loss';
      const change = result === 'win' ? 12 + Math.floor(rand() * 20) : result === 'draw' ? 0 : -(8 + Math.floor(rand() * 18));
      elo = Math.max(600, elo + change);
      if (result === 'win') wins++; else if (result === 'loss') losses++; else draws++;
      const prob = problems[Math.floor(rand() * problems.length)];
      history.push({ opponentId: opp, opponentName: names.get(String(opp)) || 'Player', result, eloChange: change, problemId: prob._id, playedAt: new Date(Date.now() - (games - g) * 86400000 * (1 + rand() * 2)) });
    }
    arena.push({ userId: uid, elo, wins, losses, draws, matchHistory: history.slice(-10) });
  }
  if (arena.length) await ArenaRating.insertMany(arena);
  say(`arena ratings: ${arena.length}`);

  return { sim, userIds };
};

const clamp01 = (x) => Math.max(0.05, Math.min(0.95, x));

// ─── 8. Interview experiences ────────────────────────────────────────────────
const seedExperiences = async ({ companyBySlug, collegeBySlug, sim, userIds }) => {
  const rand = mulberry32(31337);
  const byCollege = new Map();
  sim.forEach((s) => { if (!byCollege.has(s.college)) byCollege.set(s.college, []); byCollege.get(s.college).push(userIds.get(s.key)); });
  const allUsers = [...userIds.values()];

  const sortedTs = experiences.map((x) => Date.UTC(x.year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(x.month), 12)).sort((a, b) => a - b);
  const RECENT_CUTOFF = sortedTs[Math.floor(sortedTs.length * 0.67)];
  let created = 0;
  for (const e of experiences) {
    const company = companyBySlug.get(e.company);
    const college = collegeBySlug.get(e.college);
    if (!company) { logger.warn(`[seed] experience skipped — unknown company ${e.company}`); continue; }

    const seedKey = `seed:${e.company}:${e.college}:${e.role}:${e.year}:${e.month}`;
    const pool = byCollege.get(e.college) || allUsers;
    const author = pool[Math.floor(rand() * pool.length)];
    const isAnonymous = e.anonymous !== undefined ? e.anonymous : rand() < 0.3;

    const upN = Math.min(allUsers.length - 1, Math.round((e.upvotes || 5) * 0.6));
    const upvoters = [...allUsers].sort(() => rand() - 0.5).slice(0, upN);
    const remaining = allUsers.filter((u) => !upvoters.includes(u));
    const downN = Math.floor(rand() * (e.upvotes > 40 ? 4 : 2));
    const downvoters = remaining.sort(() => rand() - 0.5).slice(0, downN);

    const doc = {
      companyId: company._id,
      userId: author,
      isAnonymous,
      role: e.role, year: e.year, month: e.month, offerReceived: e.offerReceived,
      compensation: e.compensation, difficulty: e.difficulty, experienceRating: e.experienceRating,
      applicationSource: e.applicationSource, isVerified: !!e.isVerified,
      college: college?.name, collegeId: college?._id || null, cgpa: e.cgpa,
      rounds: e.rounds.map((r) => ({ type: r.type, duration: r.duration, vibe: r.vibe, topics: r.topics, tips: r.tips, questions: r.questions })),
      overallTips: e.overallTips, resourcesUsed: e.resourcesUsed,
      upvotes: upvoters.length, upvotedBy: upvoters, downvotes: downvoters.length, downvotedBy: downvoters,
      source: 'curated', status: 'Published', seedKey
    };
    // quality score for the sort-by-quality option
    const { scoreQuality } = require('../services/experienceParser');
    doc.qualityScore = scoreQuality(doc).score;

    // posted-at: the newest third of reports land inside the last ~45 days so "this month"/trending views are alive
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const interviewed = Date.UTC(e.year, MONTHS.indexOf(e.month), 12);
    const isRecent = interviewed >= RECENT_CUTOFF;
    const postedAt = new Date(Math.min(Date.now(), isRecent ? Date.now() - Math.floor(rand() * 45) * 86400000 : interviewed + (5 + Math.floor(rand() * 40)) * 86400000));
    const res = await InterviewExperience.updateOne({ seedKey }, { $set: doc, $setOnInsert: { createdAt: postedAt } }, { upsert: true });
    // createdAt is immutable in mongoose update paths — set it on the raw collection so re-seeds also repair old rows
    await InterviewExperience.collection.updateOne({ seedKey }, { $set: { createdAt: postedAt } });
    if (res.upsertedCount) created++;
  }
  // a handful of pending / low-quality submissions so the moderation queue has real content
  const google = companyBySlug.get('google');
  const pendingSeed = [
    { seedKey: 'seed:pending:1', text: 'It was ok. They asked some array questions and I answered a few. Then HR.', role: 'SDE-1', offer: 'No', rounds: [{ type: 'Technical', duration: '', vibe: '', topics: [], questions: [{ text: 'some array questions', questionType: 'DSA', topicTags: [] }], tips: '' }] },
    { seedKey: 'seed:pending:2', text: '', role: 'SDE-1', offer: 'Pending', rounds: [{ type: 'OA', duration: '60 minutes', vibe: 'Neutral', topics: ['Arrays'], questions: [{ text: 'Two sum variant with sorted input', questionType: 'DSA', topicTags: ['Arrays'] }], tips: '' }] }
  ];
  for (const p of pendingSeed) {
    await InterviewExperience.updateOne({ seedKey: p.seedKey }, {
      $set: { companyId: google._id, userId: allUsers[3], isAnonymous: true, role: p.role, year: 2026, month: 'August', offerReceived: p.offer, rounds: p.rounds, overallTips: p.text, college: 'NIT Trichy', collegeId: collegeBySlug.get('nit-trichy')._id, source: 'self-reported', status: 'Draft', qualityScore: 15, seedKey: p.seedKey }
    }, { upsert: true });
  }
  say(`interview experiences: ${experiences.length} curated (${created} new) + ${pendingSeed.length} pending-moderation samples`);
};

// ─── 9. Community-proposed problems (for the review queue) ───────────────────
const seedCommunityProblems = async ({ skills, userIds, sim }) => {
  const arrays = skills.find((s) => s.name === 'Arrays');
  const graphs = skills.find((s) => s.name === 'Graphs');
  const author = [...userIds.values()][5];
  const proposals = [
    { title: 'Minimum Cost to Connect Servers', skill: graphs, difficulty: 'medium', company: 'Uber', round: 'Technical', status: 'waitlisted', description: 'Given `n` servers labelled 0..n-1 and a list of possible cables `[a, b, cost]`, return the minimum total cost to connect all servers so every pair can communicate, or `-1` if impossible.\n\n(Reported in an Uber OA — modelled as a minimum spanning tree.)', constraints: '1 <= n <= 10^4\n0 <= cables.length <= 10^5', up: 2, down: 0 },
    { title: 'Longest Balanced Window', skill: arrays, difficulty: 'hard', company: 'Google', round: 'OA', status: 'waitlisted', description: 'Given a binary array, return the length of the longest contiguous window that contains an equal number of 0s and 1s.', constraints: '1 <= n <= 10^5', up: 1, down: 1 },
    { title: 'Merge Overlapping Bookings', skill: arrays, difficulty: 'easy', company: 'Amazon', round: 'Phone Screen', status: 'quarantine', description: 'Merge overlapping hotel bookings.', constraints: 'n <= 100', up: 0, down: 1 }
  ];
  for (const p of proposals) {
    await Problem.updateOne({ title: p.title }, {
      $set: {
        description: p.description, difficulty: p.difficulty, skillId: p.skill._id, constraints: p.constraints, company: p.company, round: p.round, status: p.status, isActive: p.status === 'approved',
        authorId: author, upvotes: p.up, downvotes: p.down, confidenceLevel: 70, xpReward: { easy: 10, medium: 20, hard: 40 }[p.difficulty],
        testCases: [{ input: '[1,2,3]', expectedOutput: '6', isHidden: false }], starterCode: 'function solve(nums) {\n  // Your code here\n}', starterCodeMap: { javascript: 'function solve(nums) {\n  // Your code here\n}' }
      }
    }, { upsert: true });
  }
  say(`community proposals: ${proposals.length}`);
};

// ─── main ────────────────────────────────────────────────────────────────────
const main = async () => {
  const started = Date.now();
  await mongoose.connect(process.env.MONGO_URI);
  say(`connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const skills = await seedSkills();
  const collegeBySlug = await seedColleges();
  const companyBySlug = await seedCompanies();
  const { catalog, problems } = await seedProblems(skills);
  await seedSheets(problems);
  await seedPlacementRecords(collegeBySlug, companyBySlug);

  if (!QUICK) {
    const skillsWithPrereq = await Skill.find({}).sort({ order: 1 }).lean();
    const problemsPop = await Problem.find({ status: 'approved' }).populate('skillId', 'name').lean();
    const { sim, userIds } = await seedCohort({ skills: skillsWithPrereq, problems: problemsPop, collegeBySlug, companyBySlug, catalog });
    await seedExperiences({ companyBySlug, collegeBySlug, sim, userIds });
    await seedCommunityProblems({ skills: skillsWithPrereq, userIds, sim });
  }

  if (!QUICK) {
    // arena + experiences are seeded after the cohort, so badges tied to them are evaluated last
    const cohortUsers = await User.find({ email: /@(demo\.)?cognitivecampus\.dev$/ }).select('_id').lean();
    let more = 0;
    for (const u of cohortUsers) more += (await achievementService.evaluate(u._id)).length;
    say(`achievements unlocked in final pass: ${more}`);
  }

  // summary
  const counts = {};
  for (const [name, model] of Object.entries({ skills: Skill, colleges: College, companies: Company, problems: Problem, sheets: ProblemSheet, placementRecords: CollegePlacementRecord, experiences: InterviewExperience, users: User, submissions: Submission, skillStates: SkillState, arenaRatings: ArenaRating, bktParams: BktParams })) {
    counts[name] = await model.countDocuments();
  }
  say(`DONE in ${((Date.now() - started) / 1000).toFixed(1)}s — ${JSON.stringify(counts)}`);
  await mongoose.disconnect();
};

if (require.main === module) {
  main().then(() => process.exit(0)).catch(async (err) => {
    logger.error('[seed] FAILED', { error: err.message, stack: err.stack });
    try { await mongoose.disconnect(); } catch { /* ignore */ }
    process.exit(1);
  });
}

module.exports = { main };
