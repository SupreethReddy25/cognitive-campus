/**
 * Achievement Service — badge catalogue + evaluation.
 *
 * Each achievement is a pure predicate over an "achievement context" built from the user's
 * stats. `evaluate(userId)` computes the context, unlocks anything newly earned, persists it on
 * the user and returns just the new unlocks (so the API can toast them).
 *
 * @module achievementService
 */

const User = require('../models/User');
const Submission = require('../models/Submission');
const SkillState = require('../models/SkillState');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const InterviewExperience = require('../models/InterviewExperience');
const ArenaRating = require('../models/ArenaRating');
const logger = require('../utils/logger');

/** rarity → xp bonus granted on unlock */
const RARITY_XP = { common: 10, rare: 25, epic: 50, legendary: 100 };

/**
 * Static catalogue. `check(ctx)` must be synchronous; `progress(ctx)` (optional) returns
 * [current, target] for progress bars on locked badges.
 */
const CATALOGUE = [
  { key: 'first-solve', title: 'First Blood', desc: 'Solve your first problem', icon: 'zap', rarity: 'common', progress: (c) => [c.solved, 1] },
  { key: 'solve-10', title: 'Getting Warm', desc: 'Solve 10 problems', icon: 'flame', rarity: 'common', progress: (c) => [c.solved, 10] },
  { key: 'solve-25', title: 'Quarter Century', desc: 'Solve 25 problems', icon: 'target', rarity: 'rare', progress: (c) => [c.solved, 25] },
  { key: 'solve-50', title: 'Half-Century', desc: 'Solve 50 problems', icon: 'trophy', rarity: 'epic', progress: (c) => [c.solved, 50] },
  { key: 'all-easy', title: 'Clean Sweep', desc: 'Solve every Easy problem', icon: 'sparkles', rarity: 'rare', progress: (c) => [c.solvedByDifficulty.easy, Math.max(c.totalByDifficulty.easy, 1)] },
  { key: 'first-hard', title: 'Into the Deep', desc: 'Solve your first Hard problem', icon: 'mountain', rarity: 'rare', progress: (c) => [c.solvedByDifficulty.hard, 1] },
  { key: 'hard-5', title: 'Hard Mode', desc: 'Solve 5 Hard problems', icon: 'skull', rarity: 'epic', progress: (c) => [c.solvedByDifficulty.hard, 5] },
  { key: 'streak-3', title: 'On a Roll', desc: 'Reach a 3-day streak', icon: 'flame', rarity: 'common', progress: (c) => [c.longestStreak, 3] },
  { key: 'streak-7', title: 'Week Warrior', desc: 'Reach a 7-day streak', icon: 'flame', rarity: 'rare', progress: (c) => [c.longestStreak, 7] },
  { key: 'streak-30', title: 'Unbreakable', desc: 'Reach a 30-day streak', icon: 'flame', rarity: 'legendary', progress: (c) => [c.longestStreak, 30] },
  { key: 'no-hints-10', title: 'Lone Wolf', desc: 'Solve 10 problems without hints', icon: 'brain', rarity: 'rare', progress: (c) => [c.solvedNoHints, 10] },
  { key: 'comeback', title: 'Comeback Kid', desc: 'Solve a problem after 3+ failed attempts', icon: 'refresh', rarity: 'common', progress: (c) => [c.comebacks, 1] },
  { key: 'polyglot', title: 'Polyglot', desc: 'Solve problems in 3 different languages', icon: 'code', rarity: 'rare', progress: (c) => [c.languagesSolved, 3] },
  { key: 'speedster', title: 'Speedster', desc: 'Solve a problem in under 5 minutes', icon: 'timer', rarity: 'common', progress: (c) => [c.fastSolves, 1] },
  { key: 'daily-3', title: 'Daily Driver', desc: 'Complete 3 daily challenges', icon: 'calendar', rarity: 'rare', progress: (c) => [c.dailySolves, 3] },
  { key: 'night-owl', title: 'Night Owl', desc: 'Solve a problem between midnight and 4 AM', icon: 'moon', rarity: 'common', progress: (c) => [c.nightSolves, 1] },
  { key: 'level-5', title: 'Level 5', desc: 'Reach level 5', icon: 'star', rarity: 'common', progress: (c) => [c.level, 5] },
  { key: 'level-10', title: 'Level 10', desc: 'Reach level 10', icon: 'star', rarity: 'epic', progress: (c) => [c.level, 10] },
  { key: 'skills-3', title: 'Well Rounded', desc: 'Master 3 skills', icon: 'layers', rarity: 'rare', progress: (c) => [c.masteredCount, 3] },
  { key: 'skills-all', title: 'Grandmaster', desc: 'Master all 12 skills', icon: 'crown', rarity: 'legendary', progress: (c) => [c.masteredCount, 12] },
  { key: 'contributor', title: 'Intel Contributor', desc: 'Share an interview experience', icon: 'book', rarity: 'rare', progress: (c) => [c.experiences, 1] },
  { key: 'bookworm', title: 'Bookworm', desc: 'Bookmark 5 problems', icon: 'bookmark', rarity: 'common', progress: (c) => [c.bookmarks, 5] },
  { key: 'arena-win', title: 'Arena Victor', desc: 'Win a 1v1 arena match', icon: 'swords', rarity: 'rare', progress: (c) => [c.arenaWins, 1] }
];

// One "Master of X" badge per skill, generated so new skills automatically get a badge.
const skillBadgeKey = (name) => `master-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const buildCatalogue = (skills) => {
  const skillBadges = skills.map((s) => ({
    key: skillBadgeKey(s.name),
    title: `Master of ${s.name}`,
    desc: `Reach 85% mastery in ${s.name}`,
    icon: 'award',
    rarity: 'rare',
    skillName: s.name,
    progress: (c) => [Math.round((c.masteryByName[s.name] || 0) * 100), 85]
  }));
  return [...CATALOGUE, ...skillBadges];
};

const buildContext = async (user) => {
  const userId = user._id;
  const [subs, skillStates, skills, problems, experiences, arena] = await Promise.all([
    Submission.find({ userId }).select('problemId isCorrect language timeTaken hintsUsed createdAt isDailyChallenge').sort({ createdAt: 1 }).lean(),
    SkillState.find({ userId }).populate('skillId', 'name').lean(),
    Skill.find({}).select('name').lean(),
    Problem.find({ isActive: true, status: 'approved' }).select('difficulty').lean(),
    InterviewExperience.countDocuments({ userId }),
    ArenaRating.findOne({ userId }).select('wins').lean()
  ]);

  const diffOf = new Map(problems.map((p) => [String(p._id), p.difficulty]));
  const totalByDifficulty = { easy: 0, medium: 0, hard: 0 };
  problems.forEach((p) => { if (totalByDifficulty[p.difficulty] !== undefined) totalByDifficulty[p.difficulty]++; });

  const solvedSet = new Set();
  const failsBefore = new Map();
  const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
  const solvedNoHints = new Set();
  const langs = new Set();
  let comebacks = 0;
  let fastSolves = 0;
  let nightSolves = 0;
  let dailySolves = 0;

  for (const s of subs) {
    const pid = String(s.problemId);
    if (!s.isCorrect) {
      failsBefore.set(pid, (failsBefore.get(pid) || 0) + 1);
      continue;
    }
    if (s.language) langs.add(s.language);
    if (s.isDailyChallenge) dailySolves++;
    const hr = new Date(s.createdAt).getHours();
    if (hr >= 0 && hr < 4) nightSolves++;
    if (s.timeTaken && s.timeTaken > 0 && s.timeTaken < 300) fastSolves++;
    if (!solvedSet.has(pid)) {
      solvedSet.add(pid);
      const d = diffOf.get(pid);
      if (solvedByDifficulty[d] !== undefined) solvedByDifficulty[d]++;
      if (!s.hintsUsed) solvedNoHints.add(pid);
      if ((failsBefore.get(pid) || 0) >= 3) comebacks++;
    }
  }

  const masteryByName = {};
  let masteredCount = 0;
  skillStates.forEach((st) => {
    if (st.skillId?.name) masteryByName[st.skillId.name] = st.masteryP;
    if (st.masteryP >= 0.85) masteredCount++;
  });

  return {
    solved: solvedSet.size,
    solvedByDifficulty,
    totalByDifficulty,
    solvedNoHints: solvedNoHints.size,
    comebacks,
    fastSolves,
    nightSolves,
    dailySolves,
    languagesSolved: langs.size,
    longestStreak: Math.max(user.longestStreak || 0, user.streak || 0),
    level: user.level || 1,
    masteredCount,
    masteryByName,
    experiences,
    bookmarks: (user.bookmarks || []).length,
    arenaWins: arena?.wins || 0,
    skills
  };
};

/**
 * Full catalogue view for a user (unlocked flags + progress).
 */
const describeForUser = async (userDoc) => {
  const ctx = await buildContext(userDoc);
  const catalogue = buildCatalogue(ctx.skills);
  const unlockedMap = new Map((userDoc.achievements || []).map((a) => [a.key, a.unlockedAt]));
  return catalogue.map((a) => {
    const [cur, target] = a.progress ? a.progress(ctx) : [0, 1];
    const unlocked = unlockedMap.has(a.key);
    return {
      key: a.key,
      title: a.title,
      desc: a.desc,
      icon: a.icon,
      rarity: a.rarity,
      unlocked,
      unlockedAt: unlockedMap.get(a.key) || null,
      progress: { current: Math.min(cur, target), target },
      xp: RARITY_XP[a.rarity]
    };
  });
};

/**
 * Evaluate the catalogue against current stats; persist and return new unlocks.
 * Awards each badge's rarity XP.
 *
 * @param {string} userId
 * @returns {Promise<Array<{key,title,desc,icon,rarity,xp}>>}
 */
const evaluate = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];
    const ctx = await buildContext(user);
    const catalogue = buildCatalogue(ctx.skills);
    const have = new Set((user.achievements || []).map((a) => a.key));

    const fresh = [];
    for (const a of catalogue) {
      if (have.has(a.key)) continue;
      const [cur, target] = a.progress ? a.progress(ctx) : [0, 1];
      if (cur >= target) fresh.push(a);
    }
    if (fresh.length === 0) return [];

    let bonusXp = 0;
    fresh.forEach((a) => {
      user.achievements.push({ key: a.key, unlockedAt: new Date() });
      bonusXp += RARITY_XP[a.rarity] || 0;
    });
    user.xp += bonusXp;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save();

    logger.info(`Achievements unlocked for ${userId}: ${fresh.map((f) => f.key).join(', ')} (+${bonusXp} XP)`);
    return fresh.map((a) => ({ key: a.key, title: a.title, desc: a.desc, icon: a.icon, rarity: a.rarity, xp: RARITY_XP[a.rarity] }));
  } catch (err) {
    logger.error('Achievement evaluation failed', { error: err.message, userId });
    return [];
  }
};

module.exports = { evaluate, describeForUser, buildCatalogue, skillBadgeKey, RARITY_XP, CATALOGUE };
