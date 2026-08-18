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
    logo: {
      type: String, // URL to logo
      default: ''
    },
    tier: {
      type: String,
      enum: ['FAANG', 'Product', 'Service', 'Startup', 'Other'],
      default: 'Other'
    },
    avgCTC: {
      type: String, // e.g., "15-25 LPA"
      default: 'Not disclosed'
    },
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
