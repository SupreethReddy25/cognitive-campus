const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const College = require('./models/College');
const Company = require('./models/Company');
const Problem = require('./models/Problem');
const InterviewExperience = require('./models/InterviewExperience');
const Skill = require('./models/Skill');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cognitive-campus', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('Clearing old mock data...');
    // We won't delete users or skills to avoid breaking auth/progression
    await College.deleteMany({});
    await Company.deleteMany({});
    await Problem.deleteMany({});
    await InterviewExperience.deleteMany({});

    console.log('Seeding Colleges...');
    const college = await College.create({
      name: 'Amrita Vishwa Vidyapeetham',
      shortName: 'Amrita',
      slug: 'amrita',
      location: 'Coimbatore, Tamil Nadu',
      tier: 'Private',
      website: 'https://amrita.edu',
      verified: true
    });

    console.log('Seeding Companies...');
    const google = await Company.create({
      name: 'Google',
      slug: 'google',
      tier: 'FAANG',
      logo: 'https://logo.clearbit.com/google.com',
      avgCTC: '35 LPA'
    });

    const amazon = await Company.create({
      name: 'Amazon',
      slug: 'amazon',
      tier: 'FAANG',
      logo: 'https://logo.clearbit.com/amazon.com',
      avgCTC: '25 LPA'
    });

    console.log('Seeding Skills...');
    // Make sure we have some skills
    let arraysSkill = await Skill.findOne({ name: 'Arrays' });
    if (!arraysSkill) {
      arraysSkill = await Skill.create({ name: 'Arrays', description: 'Array manipulation', order: 1 });
    }

    console.log('Seeding Problems...');
    await Problem.create([
      {
        title: 'Two Sum',
        difficulty: 'easy',
        description: 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.',
        status: 'approved',
        isActive: true,
        skillId: arraysSkill._id,
        company: 'Google',
        round: 'Phone Screen',
        testCases: [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false }
        ]
      },
      {
        title: 'Merge Intervals',
        difficulty: 'medium',
        description: 'Given an array of intervals, merge all overlapping intervals.',
        status: 'approved',
        isActive: true,
        skillId: arraysSkill._id,
        company: 'Amazon',
        round: 'Onsite',
        testCases: [
          { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false }
        ]
      },
      {
        title: 'Trapping Rain Water',
        difficulty: 'hard',
        description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        status: 'waitlisted',
        isActive: false,
        skillId: arraysSkill._id,
        company: 'Google',
        round: 'Onsite',
        testCases: [
          { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', isHidden: false }
        ]
      }
    ]);

    console.log('Seeding Experiences...');
    await InterviewExperience.create({
      collegeId: college._id,
      companyId: google._id,
      role: 'Software Engineer',
      year: 2024,
      month: 'August',
      offerReceived: 'Yes',
      difficulty: 'Challenging',
      status: 'Published',
      isVerified: true,
      cgpa: '8.5',
      overallTips: 'Focus on Graphs and Dynamic Programming. Be very communicative during the interview.',
      rounds: [
        {
          roundNumber: 1,
          type: 'Technical',
          duration: 45,
          topics: ['Arrays', 'Hash Tables'],
          details: 'Standard LC medium questions.',
          questions: [
            { questionText: 'Two Sum variant', difficulty: 'easy' }
          ]
        }
      ]
    });

    console.log('✅ Mock Data Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

connectDB().then(seedData);
