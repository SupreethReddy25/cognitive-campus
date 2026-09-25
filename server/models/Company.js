const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
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
    founded: { type: Number, default: null },
    website: { type: String, default: '' },
    logo: {
      type: String, // URL to logo
      default: ''
    },
    tier: {
      type: String,
      enum: ['FAANG', 'Product', 'Finance', 'Service', 'Startup', 'Other'],
      default: 'Other'
    },
    avgCTC: {
      type: String, // e.g., "15-25 LPA"
      default: 'Not disclosed'
    },
    /** Numeric CTC range in LPA — powers the range filter on the Intel Hub. */
    ctcMin: { type: Number, default: null },
    ctcMax: { type: Number, default: null },
    domain: { type: String, default: '' },
    description: { type: String, default: '' },
    headquarters: { type: String, default: '' },
    viewCount: { type: Number, default: 0 },
    roles: [{
      type: String // e.g., "SDE-1", "Data Analyst"
    }],
    interviewProcess: {
      rounds: [{
        name: String,        // e.g., "Online Assessment"
        description: String,
        duration: String,    // e.g., "90 min"
      }],
      tipsSummary: String,
      difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
