const mongoose = require('mongoose');

const skillStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required']
    },
    masteryP: {
      type: Number,
      default: 0.3,
      min: [0, 'Mastery probability cannot be negative'],
      max: [1, 'Mastery probability cannot exceed 1']
    },
    attempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    isUnlocked: {
      type: Boolean,
      default: false
    },
    isMastered: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Compound unique index: one state per user per skill
skillStateSchema.index({ userId: 1, skillId: 1 }, { unique: true });

const SkillState = mongoose.model('SkillState', skillStateSchema);

module.exports = SkillState;
