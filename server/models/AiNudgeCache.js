const mongoose = require('mongoose');

const AiNudgeCacheSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true
    },
    codeHash: {
      type: String,
      required: true,
      index: true
    },
    nudgeText: {
      type: String,
      required: true
    },
    targetLine: {
      type: Number,
      default: null
    },
    language: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Compound index for fast lookup
AiNudgeCacheSchema.index({ problemId: 1, language: 1, codeHash: 1 }, { unique: true });

const AiNudgeCache = mongoose.model('AiNudgeCache', AiNudgeCacheSchema);
module.exports = AiNudgeCache;
