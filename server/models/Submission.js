const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem ID is required']
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required']
    },
    code: {
      type: String,
      required: [true, 'Code is required']
    },
    language: {
      type: String,
      default: 'javascript',
      enum: ['javascript', 'python', 'java', 'cpp']
    },
    isCorrect: {
      type: Boolean,
      required: [true, 'isCorrect flag is required']
    },
    passedTestCases: {
      type: Number,
      default: 0
    },
    totalTestCases: {
      type: Number,
      default: 0
    },
    xpAwarded: {
      type: Number,
      default: 0
    },
    astResult: {
      loopTypes: [String],
      nestingDepth: { type: Number },
      hasRecursion: { type: Boolean },
      auxiliaryStructures: [String],
      algorithmClass: { type: String },
      antiPatternDetected: { type: Boolean },
      antiPatternDescription: { type: String }
    },
    timeTaken: {
      type: Number
    },
    hintsUsed: {
      type: Number,
      default: 0
    },
    executionTime: {
      type: Number
    },
    memoryUsed: {
      type: Number
    },
    nudge: {
      type: String
    },
    /** Mastery of the skill immediately after this attempt (drives the mastery-over-time charts). */
    masteryAfter: { type: Number, default: null },
    masteryBefore: { type: Number, default: null },
    isDailyChallenge: { type: Boolean, default: false },
    bonusXp: { type: Number, default: 0 },
    streakMultiplier: { type: Number, default: 1 }
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, skillId: 1, createdAt: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
