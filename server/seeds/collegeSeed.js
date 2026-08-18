/**
 * collegeSeed.js
 *
 * Seeds 20 real Indian colleges as first-class entities.
 * These are real institutions — no fake data.
 * Run: node seeds/collegeSeed.js
 *
 * Also exported as COLLEGES array for auto-seed in server/index.js.
 *
 * @module collegeSeed
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const COLLEGES = [
  {
    name: 'Amrita Vishwa Vidyapeetham',
    shortName: 'Amrita',
    slug: 'amrita',
    location: 'Coimbatore, Tamil Nadu',
    tier: 'Deemed',
    website: 'https://www.amrita.edu',
    verified: true
  },
  {
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IIT Bombay',
    slug: 'iit-bombay',
    location: 'Mumbai, Maharashtra',
    tier: 'IIT',
    website: 'https://www.iitb.ac.in',
    verified: true
  },
  {
    name: 'Indian Institute of Technology Delhi',
    shortName: 'IIT Delhi',
    slug: 'iit-delhi',
    location: 'New Delhi',
    tier: 'IIT',
    website: 'https://www.iitd.ac.in',
    verified: true
  },
  {
    name: 'Indian Institute of Technology Madras',
    shortName: 'IIT Madras',
    slug: 'iit-madras',
    location: 'Chennai, Tamil Nadu',
    tier: 'IIT',
    website: 'https://www.iitm.ac.in',
    verified: true
  },
  {
    name: 'National Institute of Technology Tiruchirappalli',
    shortName: 'NIT Trichy',
    slug: 'nit-trichy',
    location: 'Tiruchirappalli, Tamil Nadu',
    tier: 'NIT',
    website: 'https://www.nitt.edu',
    verified: true
  },
  {
    name: 'National Institute of Technology Warangal',
    shortName: 'NIT Warangal',
    slug: 'nit-warangal',
    location: 'Warangal, Telangana',
    tier: 'NIT',
    website: 'https://www.nitw.ac.in',
    verified: true
  },
  {
    name: 'BITS Pilani',
    shortName: 'BITS Pilani',
    slug: 'bits-pilani',
    location: 'Pilani, Rajasthan',
    tier: 'BITS',
    website: 'https://www.bits-pilani.ac.in',
    verified: true
  },
  {
    name: 'VIT Vellore',
    shortName: 'VIT',
    slug: 'vit-vellore',
    location: 'Vellore, Tamil Nadu',
    tier: 'Deemed',
    website: 'https://vit.ac.in',
    verified: true
  },
  {
    name: 'SRM Institute of Science and Technology',
    shortName: 'SRM',
    slug: 'srm',
    location: 'Chennai, Tamil Nadu',
    tier: 'Deemed',
    website: 'https://www.srmist.edu.in',
    verified: true
  },
  {
    name: 'IIIT Hyderabad',
    shortName: 'IIIT-H',
    slug: 'iiit-hyderabad',
    location: 'Hyderabad, Telangana',
    tier: 'IIIT',
    website: 'https://www.iiit.ac.in',
    verified: true
  },
  {
    name: 'PES University',
    shortName: 'PES',
    slug: 'pes-university',
    location: 'Bengaluru, Karnataka',
    tier: 'Private',
    website: 'https://pes.edu',
    verified: true
  },
  {
    name: 'National Institute of Technology Karnataka Surathkal',
    shortName: 'NIT Surathkal',
    slug: 'nit-surathkal',
    location: 'Mangaluru, Karnataka',
    tier: 'NIT',
    website: 'https://www.nitk.ac.in',
    verified: true
  },
  {
    name: 'Delhi Technological University',
    shortName: 'DTU',
    slug: 'dtu-delhi',
    location: 'New Delhi',
    tier: 'State',
    website: 'https://www.dtu.ac.in',
    verified: true
  },
  {
    name: 'Manipal Institute of Technology',
    shortName: 'MIT Manipal',
    slug: 'mit-manipal',
    location: 'Manipal, Karnataka',
    tier: 'Deemed',
    website: 'https://manipal.edu/mit',
    verified: true
  },
  {
    name: 'College of Engineering Pune',
    shortName: 'COEP',
    slug: 'coep-pune',
    location: 'Pune, Maharashtra',
    tier: 'State',
    website: 'https://www.coep.org.in',
    verified: true
  },
  {
    name: 'National Institute of Technology Calicut',
    shortName: 'NIT Calicut',
    slug: 'nit-calicut',
    location: 'Kozhikode, Kerala',
    tier: 'NIT',
    website: 'https://www.nitc.ac.in',
    verified: true
  },
  {
    name: 'Vellore Institute of Technology Chennai',
    shortName: 'VIT Chennai',
    slug: 'vit-chennai',
    location: 'Chennai, Tamil Nadu',
    tier: 'Deemed',
    website: 'https://chennai.vit.ac.in',
    verified: true
  },
  {
    name: 'Thapar Institute of Engineering and Technology',
    shortName: 'Thapar',
    slug: 'thapar',
    location: 'Patiala, Punjab',
    tier: 'Deemed',
    website: 'https://www.thapar.edu',
    verified: true
  },
  {
    name: 'Netaji Subhas University of Technology',
    shortName: 'NSUT',
    slug: 'nsut-delhi',
    location: 'New Delhi',
    tier: 'State',
    website: 'https://www.nsut.ac.in',
    verified: true
  },
  {
    name: 'PSG College of Technology',
    shortName: 'PSG Tech',
    slug: 'psg-tech',
    location: 'Coimbatore, Tamil Nadu',
    tier: 'Private',
    website: 'https://www.psgtech.edu',
    verified: true
  }
];

/**
 * Seeds colleges using upsert (safe to run multiple times).
 */
async function seedColleges() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for college seeding');

    const College = require('../models/College');

    let created = 0;
    let skipped = 0;

    for (const collegeData of COLLEGES) {
      const result = await College.updateOne(
        { slug: collegeData.slug },
        { $set: collegeData },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        created++;
        console.log(`  ✓ Created: ${collegeData.name}`);
      } else {
        skipped++;
      }
    }

    console.log(`\nDone: ${created} colleges created, ${skipped} already existed.`);
  } catch (err) {
    console.error('College seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { COLLEGES };

// Run directly: node seeds/collegeSeed.js
if (require.main === module) {
  seedColleges();
}
