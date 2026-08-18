/**
 * Company seed data — also used by server/index.js for auto-seeding on empty DB.
 * Export: seedCompaniesData (array) + default seedCompanies() function for CLI use.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const seedCompaniesData = [
  {
    name: 'Google',
    slug: 'google',
    tier: 'FAANG',
    avgCTC: '30–40 LPA',
    roles: ['SDE-1', 'SDE-2', 'Data Engineer', 'ML Engineer', 'Product Manager'],
    interviewProcess: {
      rounds: [
        { name: 'Phone Screen',      description: 'Recruiter call + basic DSA/CS fundamentals', duration: '30 min' },
        { name: 'Technical Round 1', description: 'Medium-Hard DSA on Google Docs — think aloud is key', duration: '45 min' },
        { name: 'Technical Round 2', description: 'Hard DSA or System Design for senior roles', duration: '45 min' },
        { name: 'Googlyness Round',  description: 'Behavioral — cultural fit, past conflicts, leadership', duration: '45 min' }
      ],
      tipsSummary: 'Focus heavily on Graphs, DP, and Trees. Explain your thought process clearly before writing a single line. Google evaluates how you think, not just the final answer.',
      difficulty: 'Hard'
    }
  },
  {
    name: 'Amazon',
    slug: 'amazon',
    tier: 'FAANG',
    avgCTC: '25–35 LPA',
    roles: ['SDE-1', 'SDE-2', 'Applied Scientist', 'SDM'],
    interviewProcess: {
      rounds: [
        { name: 'Online Assessment', description: '2 coding questions on HackerRank + Workstyle assessment', duration: '90 min' },
        { name: 'Technical 1',       description: 'DSA (Medium) + 1–2 Leadership Principle behavioral questions', duration: '60 min' },
        { name: 'Technical 2',       description: 'DSA/System Design + more LP questions', duration: '60 min' },
        { name: 'Bar Raiser',        description: 'Deep behavioral dive into LPs + System Design — a senior employee not on your team', duration: '60 min' }
      ],
      tipsSummary: "Amazon's 16 Leadership Principles are non-negotiable. Prepare 2–3 STAR stories for each LP. For DSA, Trees, Arrays, and Graphs dominate.",
      difficulty: 'Medium'
    }
  },
  {
    name: 'Microsoft',
    slug: 'microsoft',
    tier: 'FAANG',
    avgCTC: '20–30 LPA',
    roles: ['Software Engineer', 'Data Scientist', 'Program Manager', 'SDE-2'],
    interviewProcess: {
      rounds: [
        { name: 'Online Assessment',       description: '3 coding questions on Codility — time-boxed', duration: '90 min' },
        { name: 'Technical 1',             description: 'DSA — arrays, strings, trees, OOP design', duration: '60 min' },
        { name: 'Technical 2',             description: 'DSA + CS Fundamentals (OS, DBMS, Networking)', duration: '60 min' },
        { name: 'As-Appropriate (AA) / HM', description: 'System Design or Architecture + behavioral', duration: '60 min' }
      ],
      tipsSummary: 'Microsoft tests CS fundamentals more than most. Know OS, DBMS, networking well. DSA difficulty is Medium-level typically.',
      difficulty: 'Medium'
    }
  },
  {
    name: 'Meta',
    slug: 'meta',
    tier: 'FAANG',
    avgCTC: '40–55 LPA',
    roles: ['Software Engineer E3', 'Software Engineer E4', 'Research Scientist'],
    interviewProcess: {
      rounds: [
        { name: 'Recruiter Screen', description: 'Background + experience discussion', duration: '30 min' },
        { name: 'Coding 1',         description: 'Hard DSA — often graph problems or complex array manipulation', duration: '60 min' },
        { name: 'Coding 2',         description: 'Hard DSA — DP or Backtracking', duration: '60 min' },
        { name: 'System Design',    description: 'Scale a product feature — e.g. Design Instagram Feed', duration: '60 min' },
        { name: 'Behavioral',       description: 'Meta values: move fast, focus on impact, be direct', duration: '45 min' }
      ],
      tipsSummary: 'Meta expects Hard LeetCode. Must be comfortable with System Design for senior roles. Behavioral focuses on impact and velocity.',
      difficulty: 'Hard'
    }
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    tier: 'Product',
    avgCTC: '25–32 LPA',
    roles: ['SDE-1', 'UI Engineer', 'SDE-2'],
    interviewProcess: {
      rounds: [
        { name: 'Online Assessment', description: '2–3 DSA questions on HackerRank — Medium to Hard', duration: '90 min' },
        { name: 'Machine Coding',    description: 'Design and implement a working system in 90 mins (e.g. Parking Lot, Cab Booking)', duration: '90 min' },
        { name: 'PSDS Round',        description: 'Problem Solving & DSA — standard Hard DSA', duration: '60 min' },
        { name: 'Hiring Manager',    description: 'Past projects, behavioral, cultural fit and potential', duration: '45 min' }
      ],
      tipsSummary: 'Machine Coding round is the biggest eliminator. Practice Low-Level Design — Parking Lot, Cab Booking, Library Management. Think OOP.',
      difficulty: 'Hard'
    }
  },
  {
    name: 'Uber',
    slug: 'uber',
    tier: 'Product',
    avgCTC: '35–45 LPA',
    roles: ['Software Engineer 1', 'Software Engineer 2', 'Senior SWE'],
    interviewProcess: {
      rounds: [
        { name: 'CodeSignal OA',               description: 'Automatic assessment — score > 820 often required', duration: '70 min' },
        { name: 'Technical 1 — DSA',           description: 'Hard graph or DP problem. Speed and correctness both matter.', duration: '60 min' },
        { name: 'Technical 2 — Machine Coding', description: 'Build a working API or feature from scratch', duration: '60 min' },
        { name: 'System Design / HM Round',    description: 'Design Uber Surge Pricing, or similar real-world feature', duration: '60 min' }
      ],
      tipsSummary: 'CodeSignal bar is brutal — practice speed. Hard DSA is the norm. Be prepared to write clean, runnable code under pressure.',
      difficulty: 'Hard'
    }
  },
  {
    name: 'Goldman Sachs',
    slug: 'goldman-sachs',
    tier: 'Product',
    avgCTC: '22–26 LPA',
    roles: ['Analyst', 'Associate', 'VP'],
    interviewProcess: {
      rounds: [
        { name: 'Online Assessment', description: 'Math/Probability puzzles, CS fundamentals, 2 Coding questions', duration: '90 min' },
        { name: 'Technical 1',       description: 'Arrays, Strings, Hashmaps + Math puzzles', duration: '60 min' },
        { name: 'Technical 2',       description: 'Advanced DSA + OS/DBMS deep dive', duration: '60 min' },
        { name: 'HR / Behavioral',   description: 'Why finance? Why Goldman? Leadership examples.', duration: '30 min' }
      ],
      tipsSummary: 'Probability and math puzzles appear frequently. Be strong with standard DSA and know your DBMS. They also value communication.',
      difficulty: 'Medium'
    }
  },
  {
    name: 'Walmart Global Tech',
    slug: 'walmart',
    tier: 'Product',
    avgCTC: '20–25 LPA',
    roles: ['Software Engineer II', 'Software Engineer III', 'Data Engineer'],
    interviewProcess: {
      rounds: [
        { name: 'Online Assessment', description: 'HackerEarth test with 2 DSA questions + MCQ', duration: '90 min' },
        { name: 'Technical 1',       description: 'DSA (Medium) + CS Fundamentals (OS, DBMS, Networking)', duration: '60 min' },
        { name: 'Technical 2',       description: 'Low Level Design (LLD) or Core Java/Spring Boot', duration: '60 min' },
        { name: 'Hiring Manager',    description: 'Behavioral discussion + project deep-dive', duration: '30 min' }
      ],
      tipsSummary: 'Core Java, Spring Boot, and OOP design are heavily tested. Know DBMS well. LLD practice (design patterns, SOLID) is important.',
      difficulty: 'Medium'
    }
  },
  {
    name: 'TCS',
    slug: 'tcs',
    tier: 'Service',
    avgCTC: '3.5–7 LPA',
    roles: ['Ninja', 'Digital', 'Prime'],
    interviewProcess: {
      rounds: [
        { name: 'NQT (National Qualifier Test)', description: 'Aptitude, English verbal, basic programming logic', duration: '120 min' },
        { name: 'Technical Interview',           description: 'Basic CS concepts (OOP, DBMS, SQL), resume-based projects', duration: '45 min' },
        { name: 'HR Interview',                  description: 'Basic behavioral — strengths, weaknesses, relocate?', duration: '20 min' }
      ],
      tipsSummary: 'Know your resume well. Basic SQL queries, OOP concepts in Java/C++ are a must. For TCS Prime, practice competitive programming.',
      difficulty: 'Easy'
    }
  },
  {
    name: 'Infosys',
    slug: 'infosys',
    tier: 'Service',
    avgCTC: '3.6–8 LPA',
    roles: ['Systems Engineer', 'Specialist Programmer', 'Digital Specialist Engineer'],
    interviewProcess: {
      rounds: [
        { name: 'Online Test',         description: 'Aptitude, pseudo-code, reasoning, basic coding', duration: '90 min' },
        { name: 'Technical Interview', description: 'Projects deep-dive, basic programming, DBMS fundamentals', duration: '60 min' },
        { name: 'HR Interview',        description: 'General HR questions — career goals, flexibility, communication', duration: '15 min' }
      ],
      tipsSummary: 'For the SP (Specialist Programmer) track, focus on competitive programming. For Systems Engineer, basics and projects are enough.',
      difficulty: 'Easy'
    }
  },
  {
    name: 'Atlassian',
    slug: 'atlassian',
    tier: 'Product',
    avgCTC: '40–50 LPA',
    roles: ['Graduate Software Engineer', 'Software Engineer', 'Senior SWE'],
    interviewProcess: {
      rounds: [
        { name: 'HackerRank OA',         description: 'Time-boxed coding assessment', duration: '90 min' },
        { name: 'Pair Programming Round', description: 'Code with an interviewer — focuses on clean, readable, tested code', duration: '90 min' },
        { name: 'System Design',          description: 'LLD or HLD depending on experience level', duration: '60 min' },
        { name: 'Values Interview',       description: "Behavioral aligned to Atlassian's 5 values", duration: '45 min' }
      ],
      tipsSummary: "Write clean, modular, well-named code. Add tests if time allows. Atlassian deeply values code quality over brute-force solutions. Know their 5 values.",
      difficulty: 'Hard'
    }
  },
  {
    name: 'Razorpay',
    slug: 'razorpay',
    tier: 'Startup',
    avgCTC: '20–35 LPA',
    roles: ['SDE-1', 'SDE-2', 'Backend Engineer'],
    interviewProcess: {
      rounds: [
        { name: 'Online Test',  description: 'Platform-based DSA test — Medium difficulty', duration: '90 min' },
        { name: 'Technical 1', description: 'Core DSA + OOP design discussion', duration: '60 min' },
        { name: 'Technical 2', description: 'System Design — payments-focused (idempotency, retries, consistency)', duration: '60 min' },
        { name: 'Culture Fit', description: 'Startup mindset, ownership, and rapid iteration', duration: '30 min' }
      ],
      tipsSummary: 'Know payment systems concepts — idempotency, exactly-once semantics, distributed transactions. Strong backend and system design skills are key.',
      difficulty: 'Medium'
    }
  },
  {
    name: 'Swiggy',
    slug: 'swiggy',
    tier: 'Startup',
    avgCTC: '20–30 LPA',
    roles: ['SDE-1', 'SDE-2', 'Data Engineer'],
    interviewProcess: {
      rounds: [
        { name: 'Online Coding Round',  description: 'HackerRank — 2 Medium/Hard questions', duration: '90 min' },
        { name: 'Technical 1',          description: 'DSA + backend architecture discussion', duration: '60 min' },
        { name: 'Technical 2',          description: 'Machine Coding or LLD — delivery tracking, real-time updates', duration: '90 min' },
        { name: 'Leadership / Culture', description: 'Ownership, autonomy, growth mindset', duration: '30 min' }
      ],
      tipsSummary: 'Real-time and distributed systems knowledge is valued. LLD of delivery or food systems is common. Fast iteration and ownership mindset matter.',
      difficulty: 'Medium'
    }
  }
];

// CLI seed function
const seedCompanies = async () => {
  try {
    const Company = require('../models/Company');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cognitive-campus';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
    await Company.deleteMany({});
    await Company.insertMany(seedCompaniesData);
    console.log('Seeded ' + seedCompaniesData.length + ' companies successfully!');
    process.exit();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

module.exports = { seedCompaniesData };

// Only run if this file is executed directly (node seeds/seedCompanies.js)
if (require.main === module) {
  seedCompanies();
}
