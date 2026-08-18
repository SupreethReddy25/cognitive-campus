const mongoose = require('mongoose');

/**
 * College Model
 *
 * Represents a real educational institution as a first-class entity.
 * Used to associate students, experiences, and placement records
 * with a specific college/university.
 *
 * @module College
 */
const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      unique: true,
      trim: true,
      maxlength: [150, 'College name must not exceed 150 characters']
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
      maxlength: [20, 'Short name must not exceed 20 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only']
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    tier: {
      type: String,
      enum: ['IIT', 'NIT', 'BITS', 'IIIT', 'Deemed', 'State', 'Private', 'Other'],
      default: 'Other'
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    /**
     * verified: true means an admin has confirmed this is a real institution.
     * Seeded colleges are pre-verified. User-suggested colleges default to false.
     */
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Text index for search (typeahead in CollegeSelector)
collegeSchema.index({ name: 'text', shortName: 'text' });

const College = mongoose.model('College', collegeSchema);

module.exports = College;
