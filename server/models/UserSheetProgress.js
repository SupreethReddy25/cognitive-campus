const mongoose = require('mongoose');

const userSheetProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemSheet',
      required: true
    },
    completed: [{
      type: String // Stores either Problem ID (if internal) or external URL/title identifier
    }]
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per user per sheet
userSheetProgressSchema.index({ userId: 1, sheetId: 1 }, { unique: true });

module.exports = mongoose.model('UserSheetProgress', userSheetProgressSchema);
