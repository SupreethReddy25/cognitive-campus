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
    }
  },
  { timestamps: true }
);

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
