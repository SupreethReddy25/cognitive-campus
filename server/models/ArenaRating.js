const mongoose = require('mongoose');

/**
 * ArenaRating — stores a user's competitive Elo rating and match history.
 *
 * Elo is computed using the standard K=32 formula after each versus match.
 * Rank tiers: Bronze (<1000), Silver (1000-1199), Gold (1200-1399),
 *             Archon (1400-1599), Legend (1600+)
 */
const arenaRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    elo: {
      type: Number,
      default: 1000,
      min: 0
    },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    matchHistory: [
      {
        opponentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        opponentName: String,
        result: { type: String, enum: ['win', 'loss', 'draw', 'forfeit'] },
        eloChange: Number,
        problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
        playedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

/**
 * Virtual: rank tier based on Elo.
 */
arenaRatingSchema.virtual('rank').get(function () {
  if (this.elo >= 1600) return 'Legend';
  if (this.elo >= 1400) return 'Archon';
  if (this.elo >= 1200) return 'Gold';
  if (this.elo >= 1000) return 'Silver';
  return 'Bronze';
});

arenaRatingSchema.set('toJSON', { virtuals: true });
arenaRatingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ArenaRating', arenaRatingSchema);
