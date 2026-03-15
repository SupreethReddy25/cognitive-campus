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
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required']
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
      required: [true, 'Starter code is required']
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
    }
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
