const ProblemSheet = require('../models/ProblemSheet');
const UserSheetProgress = require('../models/UserSheetProgress');

// @desc    Get all sheets (with optional per-user progress if authenticated)
// @route   GET /api/sheets
// @access  Public
exports.getSheets = async (req, res) => {
  try {
    const sheets = await ProblemSheet.find().select('-problems').lean();

    // If user is authenticated, merge their progress into each sheet
    if (req.user?.userId) {
      const progressRecords = await UserSheetProgress.find({
        userId: req.user.userId,
        sheetId: { $in: sheets.map(s => s._id) }
      }).select('sheetId completed').lean();

      const progressMap = {};
      progressRecords.forEach(p => { progressMap[p.sheetId.toString()] = p.completed?.length || 0; });

      const enriched = sheets.map(s => ({
        ...s,
        userProgress: {
          solved: progressMap[s._id.toString()] || 0,
          total: s.totalProblems || 0
        }
      }));
      return res.status(200).json({ success: true, count: enriched.length, data: enriched });
    }

    res.status(200).json({ success: true, count: sheets.length, data: sheets });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


// @desc    Get single sheet with progress (if logged in)
// @route   GET /api/sheets/:slug
// @access  Public / Private (optional)
exports.getSheet = async (req, res) => {
  try {
    const sheet = await ProblemSheet.findOne({ slug: req.params.slug });
    
    if (!sheet) {
      return res.status(404).json({ success: false, error: 'Sheet not found' });
    }

    let progress = null;
    if (req.user) {
      progress = await UserSheetProgress.findOne({ userId: req.user._id, sheetId: sheet._id });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        sheet,
        progress: progress ? progress.completed : []
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark problem as completed in a sheet
// @route   POST /api/sheets/:slug/progress
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { problemIdentifier, completed } = req.body; // problemIdentifier can be _id or title string
    
    const sheet = await ProblemSheet.findOne({ slug: req.params.slug });
    if (!sheet) {
      return res.status(404).json({ success: false, error: 'Sheet not found' });
    }

    let progress = await UserSheetProgress.findOne({ userId: req.user._id, sheetId: sheet._id });
    
    if (!progress) {
      progress = new UserSheetProgress({
        userId: req.user._id,
        sheetId: sheet._id,
        completed: []
      });
    }

    if (completed) {
      // Add if not exists
      if (!progress.completed.includes(problemIdentifier)) {
        progress.completed.push(problemIdentifier);
      }
    } else {
      // Remove
      progress.completed = progress.completed.filter(id => id !== problemIdentifier);
    }

    await progress.save();

    res.status(200).json({ success: true, data: progress.completed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
