/**
 * migrateExperienceColleges.js
 *
 * Idempotent migration script that backfills collegeId on existing
 * InterviewExperience documents that have a college (String) value
 * but no collegeId (ObjectId ref).
 *
 * Strategy:
 *   1. Load all College documents into a lookup map (slug/shortName/name → _id)
 *   2. For each experience with college string but no collegeId:
 *      a. Try to find matching College by name, shortName, or known aliases
 *      b. If found → set collegeId
 *      c. If not found → log for manual review (do NOT create colleges silently)
 *   3. Print summary
 *
 * Safe to run multiple times — skips experiences that already have collegeId.
 * Run: node seeds/migrateExperienceColleges.js
 *
 * @module migrateExperienceColleges
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Known aliases that may appear in seed data
const ALIASES = {
  'nit trichy': 'nit-trichy',
  'national institute of technology tiruchirappalli': 'nit-trichy',
  'nitt': 'nit-trichy',
  'vit vellore': 'vit-vellore',
  'vit': 'vit-vellore',
  'iit bombay': 'iit-bombay',
  'iitb': 'iit-bombay',
  'iit delhi': 'iit-delhi',
  'iitd': 'iit-delhi',
  'iit madras': 'iit-madras',
  'iitm': 'iit-madras',
  'nit warangal': 'nit-warangal',
  'nitw': 'nit-warangal',
  'bits pilani': 'bits-pilani',
  'bits': 'bits-pilani',
  'srm': 'srm',
  'srm university': 'srm',
  'iiit hyderabad': 'iiit-hyderabad',
  'iiith': 'iiit-hyderabad',
  'pes university': 'pes-university',
  'nit surathkal': 'nit-surathkal',
  'nitk': 'nit-surathkal',
  'dtu': 'dtu-delhi',
  'dtu delhi': 'dtu-delhi',
  'delhi technological university': 'dtu-delhi',
  'manipal': 'mit-manipal',
  'mit manipal': 'mit-manipal',
  'coep': 'coep-pune',
  'amrita': 'amrita',
  'amrita vishwa vidyapeetham': 'amrita',
  'nit calicut': 'nit-calicut',
  'nitc': 'nit-calicut',
  'thapar': 'thapar',
  'thapar university': 'thapar',
  'nsut': 'nsut-delhi',
  'psg tech': 'psg-tech',
  'psg college of technology': 'psg-tech',
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for experience college migration\n');

    const College = require('../models/College');
    const InterviewExperience = require('../models/InterviewExperience');

    // Build slug → _id lookup
    const colleges = await College.find().lean();
    const slugToId = {};
    colleges.forEach(c => { slugToId[c.slug] = c._id; });

    // Find all experiences with college string but no collegeId
    const unmigratedExps = await InterviewExperience.find({
      college: { $exists: true, $ne: null, $ne: '' },
      collegeId: null
    }).select('_id college').lean();

    console.log(`Found ${unmigratedExps.length} experiences to migrate\n`);

    let matched = 0;
    let unmatched = 0;
    const unmatchedColleges = new Set();

    for (const exp of unmigratedExps) {
      const normalized = (exp.college || '').toLowerCase().trim();
      const slug = ALIASES[normalized];

      if (slug && slugToId[slug]) {
        await InterviewExperience.updateOne(
          { _id: exp._id },
          { $set: { collegeId: slugToId[slug] } }
        );
        matched++;
      } else {
        unmatchedColleges.add(exp.college);
        unmatched++;
      }
    }

    console.log(`✓ Migrated: ${matched} experiences`);
    console.log(`✗ Unmatched: ${unmatched} experiences`);

    if (unmatchedColleges.size > 0) {
      console.log('\nUnmatched college strings (add to ALIASES or create College docs):');
      unmatchedColleges.forEach(c => console.log(`  - "${c}"`));
    }

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
