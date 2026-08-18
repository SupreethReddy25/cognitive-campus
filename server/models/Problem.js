const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Problem description is required']
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard'
      }
    },
    companies: [{
      type: String,
      trim: true
    }],
    frequency: {
      type: Number,
      default: 0
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      default: null
    },
    testCases: {
      type: [
        {
          input: { type: String },
          expectedOutput: { type: String },
          isHidden: { type: Boolean, default: false }
        }
      ],
      validate: {
        validator: (testCases) => testCases.length >= 1,
        message: 'At least 1 test case is required'
      }
    },
    starterCode: {
      type: String,
      default: null
    },
    starterCodeMap: {
      javascript: { type: String },
      python: { type: String },
      java: { type: String },
      cpp: { type: String }
    },
    constraints: {
      type: String
    },
    examples: [
      {
        input: { type: String },
        output: { type: String },
        explanation: { type: String }
      }
    ],
    hints: [String],
    xpReward: {
      type: Number
    },
    isActive: {
      type: Boolean,
      default: true
    },

    // ─── Interview Intel Engine fields ───
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['quarantine', 'waitlisted', 'approved'],
      default: 'approved'
    },
    company: {
      type: String,
      trim: true,
      default: null
    },
    round: {
      type: String,
      trim: true,
      default: null
    },
    warStory: {
      type: String,
      default: null
    },
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    // ─── Review Board fields ───
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    votedBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['up', 'down'] }
    }],
    editorialText: { type: String, default: null },
    frequency: { type: Number, default: 0 }
  },
  { timestamps: true }
);

/**
 * Pre-save hook: auto-compute xpReward based on difficulty.
 * easy → 10, medium → 20, hard → 40
 */
problemSchema.pre('save', function (next) {
  const xpMap = { easy: 10, medium: 20, hard: 40 };
  this.xpReward = xpMap[this.difficulty] || 10;
  next();
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
