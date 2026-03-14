const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      }
    ],
    difficultyWeight: {
      type: Number,
      required: [true, 'Difficulty weight is required'],
      min: [1, 'Difficulty weight must be at least 1'],
      max: [5, 'Difficulty weight must not exceed 5']
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    order: {
      type: Number,
      required: [true, 'Display order is required']
    }
  },
  { timestamps: true }
);

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
