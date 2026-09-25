/**
 * Sheet Controller — curated problem lists with per-user progress.
 *
 * A sheet entry is "done" when either
 *   - it maps to a platform problem the student has actually solved (auto-tracked), or
 *   - the student ticked it manually (external links / self-reported).
 *
 * @module sheetController
 */

const ProblemSheet = require('../models/ProblemSheet');
const UserSheetProgress = require('../models/UserSheetProgress');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');

/** identifier used for manual ticks: platform id when available, otherwise the title */
const entryKey = (p) => (p.problemId ? String(p.problemId) : p.title);

const solvedProblemIds = async (userId) => new Set((await Submission.find({ userId, isCorrect: true }).select('problemId').lean()).map((s) => String(s.problemId)));

// @route GET /api/sheets
exports.getSheets = async (req, res) => {
  try {
    const sheets = await ProblemSheet.find().lean();

    let progressMap = {};
    let solved = new Set();
    if (req.user?.userId) {
      const [records, s] = await Promise.all([
        UserSheetProgress.find({ userId: req.user.userId, sheetId: { $in: sheets.map((x) => x._id) } }).lean(),
        solvedProblemIds(req.user.userId)
      ]);
      solved = s;
      records.forEach((r) => { progressMap[String(r.sheetId)] = new Set(r.completed || []); });
    }

    const data = sheets.map((sheet) => {
      const entries = sheet.problems || [];
      const total = entries.length;
      const available = entries.filter((p) => p.problemId).length;
      const byDifficulty = { easy: 0, medium: 0, hard: 0 };
      const topics = {};
      entries.forEach((p) => {
        if (byDifficulty[p.difficulty] !== undefined) byDifficulty[p.difficulty]++;
        (p.topics || []).forEach((t) => { topics[t] = (topics[t] || 0) + 1; });
      });
      const done = req.user?.userId
        ? entries.filter((p) => (p.problemId && solved.has(String(p.problemId))) || progressMap[String(sheet._id)]?.has(entryKey(p))).length
        : 0;
      const { problems, ...rest } = sheet;
      return {
        ...rest,
        totalProblems: total,
        availableProblems: available,
        byDifficulty,
        topTopics: Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t),
        userProgress: { solved: done, total }
      };
    });

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    logger.error('getSheets failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @route GET /api/sheets/:slug
exports.getSheet = async (req, res) => {
  try {
    const sheet = await ProblemSheet.findOne({ slug: req.params.slug }).lean();
    if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });

    // attach live platform-problem metadata (skill name etc.)
    const ids = (sheet.problems || []).filter((p) => p.problemId).map((p) => p.problemId);
    const platform = await Problem.find({ _id: { $in: ids } }).select('title difficulty skillId').populate('skillId', 'name').lean();
    const platformMap = new Map(platform.map((p) => [String(p._id), p]));
    sheet.problems = (sheet.problems || []).map((p) => {
      const live = p.problemId ? platformMap.get(String(p.problemId)) : null;
      return { ...p, isAvailable: !!live, skill: live?.skillId?.name || null, difficulty: live?.difficulty || p.difficulty };
    });

    let progress = [];
    let autoSolved = [];
    if (req.user?.userId) {
      const [record, solved] = await Promise.all([
        UserSheetProgress.findOne({ userId: req.user.userId, sheetId: sheet._id }).lean(),
        solvedProblemIds(req.user.userId)
      ]);
      progress = record?.completed || [];
      autoSolved = sheet.problems.filter((p) => p.problemId && solved.has(String(p.problemId))).map((p) => String(p.problemId));
    }

    res.status(200).json({ success: true, data: { sheet, progress, autoSolved } });
  } catch (error) {
    logger.error('getSheet failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @route POST /api/sheets/:slug/progress   body: { problemIdentifier, completed }
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { problemIdentifier, completed } = req.body;
    if (!problemIdentifier) return res.status(400).json({ success: false, error: 'problemIdentifier is required' });

    const sheet = await ProblemSheet.findOne({ slug: req.params.slug });
    if (!sheet) return res.status(404).json({ success: false, error: 'Sheet not found' });

    let progress = await UserSheetProgress.findOne({ userId, sheetId: sheet._id });
    if (!progress) progress = new UserSheetProgress({ userId, sheetId: sheet._id, completed: [] });

    const id = String(problemIdentifier);
    if (completed) {
      if (!progress.completed.includes(id)) progress.completed.push(id);
    } else {
      progress.completed = progress.completed.filter((x) => x !== id);
    }
    await progress.save();

    res.status(200).json({ success: true, data: progress.completed });
  } catch (error) {
    logger.error('updateProgress failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
