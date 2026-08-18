const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    xp: {
      type: Number,
      default: 0,
      min: [0, 'XP cannot be negative']
    },
    level: {
      type: Number,
      default: 1,
      min: [1, 'Level cannot be less than 1']
    },
    streak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: null
    },
    dailyNudgesUsed: {
      type: Number,
      default: 0
    },
    lastNudgeDate: {
      type: Date,
      default: Date.now
    },
    encryptedGeminiKey: {
      type: String,
      default: null
    },
    keyIv: {
      type: String,
      default: null
    },
    keyAuthTag: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    /**
     * College affiliation — links user to their institution.
     * Set via PATCH /api/users/profile. Null until user selects.
     */
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null
    },
    /**
     * Placement targets — optional, set by user for focused prep.
     */
    targetCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    targetRole: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

/**
 * Virtual field: levelProgress
 * Returns how far through the current level the user is (xp % 100).
 */
userSchema.virtual('levelProgress').get(function () {
  return this.xp % 100;
});

// Ensure virtuals are included in JSON and Object conversions
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
