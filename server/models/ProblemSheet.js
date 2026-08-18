const mongoose = require('mongoose');

const problemSheetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      default: '' // e.g. "Striver", "NeetCode"
    },
    totalProblems: {
      type: Number,
      default: 0
    },
    problems: [{
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        default: null
      },
      externalUrl: {
        type: String,
        default: ''
      },
      title: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard']
      },
      topics: [String],
      isAvailable: {
        type: Boolean,
        default: false // True if available on our platform
      }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProblemSheet', problemSheetSchema);
