const mongoose = require('mongoose');

const interviewExperienceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    month: {
      type: String,
      required: true
    },
    offerReceived: {
      type: String,
      enum: ['Yes', 'No', 'Pending'],
      required: true
    },
    compensation: {
      base: String,
      bonus: String,
      stock: String
    },
    timeline: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Very Hard', 'Smooth', 'Challenging', 'Grueling', 'Brain-melting']
    },
    experienceRating: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative']
    },
    applicationSource: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    /**
     * college (String) — legacy free-text field from before College was a model.
     * Kept for backward compatibility with existing seed/curated data.
     * New submissions populate collegeId instead (backfilled by migration script).
     */
    college: {
      type: String
    },
    /**
     * collegeId — structured ref to the College model.
     * null for legacy data not yet migrated.
     * Set at submission time from user’s profile or explicit form selection.
     */
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null
    },
    cgpa: {
      type: String
    },
    rounds: [{
      type: {
        type: String, // e.g., "OA", "Technical", "Managerial", "HR", "GD"
        required: true
      },
      duration: String, // e.g., "60 minutes"
      questions: [{
        text: String,
        questionType: String, // "DSA", "System Design", "CS Fundamentals", "Behavioral", "Role-specific"
        topicTags: [String], // e.g., ["DP", "Graphs"]
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Problem'
        }
      }],
      tips: String,
      vibe: String, // e.g., "Friendly", "Neutral", "Grilling", "Hostile"
      topics: [String], // e.g., ["DP", "Graphs", "System Design (HLD)"]
    }],
    overallTips: String,
    resourcesUsed: String,
    upvotes: {
      type: Number,
      default: 0
    },
    upvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    source: {
      type: String,
      enum: ['self-reported', 'community', 'curated', 'gfg-archive'],
      default: 'self-reported'
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Rejected'],
      default: 'Published' // Auto-publish for now based on user's implicit direction to not block
    }
  },
  { timestamps: true }
);

// Primary index for college-scoped aggregation queries
interviewExperienceSchema.index({ collegeId: 1, companyId: 1, status: 1 });
interviewExperienceSchema.index({ collegeId: 1, status: 1 });

module.exports = mongoose.model('InterviewExperience', interviewExperienceSchema);
