const mongoose = require('mongoose');

/**
 * CollegePlacementRecord Model
 *
 * Admin-curated structured placement history.
 * Represents: "Company X visited College Y in Year Z and hired for Role W."
 *
 * This is NOT a user-submitted interview experience.
 * It's a structured factual record from the placement cell or verified alumni.
 *
 * @module CollegePlacementRecord
 */
const collegePlacementRecordSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required']
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required']
    },
    hiringYear: {
      type: Number,
      required: [true, 'Hiring year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year must be realistic']
    },
    hiringSeason: {
      type: String,
      enum: ['On-Campus', 'Off-Campus', 'Pool-Campus', 'Internship'],
      default: 'On-Campus'
    },
    roles: [{
      type: String,
      trim: true
    }],
    eligibility: {
      minCGPA: {
        type: String,   // e.g., "7.0" — stored as string for display flexibility
        default: null
      },
      branches: [{
        type: String    // e.g., "CSE", "IT", "ECE"
      }]
    },
    /**
     * Approximate number of students hired from this college this year.
     * null means not available.
     */
    studentsHired: {
      type: Number,
      default: null
    },
    packageOffered: {
      ctc: {
        type: String,   // e.g., "12 LPA"
        default: null
      },
      breakdown: {
        type: String,   // e.g., "8 base + 2 bonus + 2 stock"
        default: null
      }
    },
    /**
     * High-level stages the company ran at this college (not individual round detail).
     * Round detail comes from InterviewExperience.rounds.
     */
    assessmentStages: [{
      type: String    // e.g., "Online Test", "Group Discussion", "Technical Interview"
    }],
    /**
     * verified: true = confirmed by admin or placement cell.
     * false = alumni-reported, treat with lower confidence.
     */
    verified: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      enum: ['admin', 'placement-cell', 'alumni-report'],
      default: 'admin'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Primary query paths
collegePlacementRecordSchema.index({ collegeId: 1, companyId: 1, hiringYear: -1 });
collegePlacementRecordSchema.index({ collegeId: 1, hiringYear: -1 });

const CollegePlacementRecord = mongoose.model('CollegePlacementRecord', collegePlacementRecordSchema);

module.exports = CollegePlacementRecord;
