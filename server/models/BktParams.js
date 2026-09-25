const mongoose = require('mongoose');

/**
 * BktParams — per-skill Bayesian Knowledge Tracing parameters learned from the
 * cohort's real attempt sequences (see services/knowledgeService.js#refitSkillParams).
 * Falls back to the engine defaults when a skill has too little data.
 */
const bktParamsSchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, unique: true },
    pL0: { type: Number, required: true },
    pT: { type: Number, required: true },
    pS: { type: Number, required: true },
    pG: { type: Number, required: true },
    sequences: { type: Number, default: 0 },
    observations: { type: Number, default: 0 },
    logLikelihood: { type: Number, default: 0 },
    baselineLogLikelihood: { type: Number, default: 0 },
    fittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BktParams', bktParamsSchema);
