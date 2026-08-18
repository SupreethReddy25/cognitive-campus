const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ProblemSheet = require('../models/ProblemSheet');
const Problem = require('../models/Problem');

// Load env vars
dotenv.config({ path: '../.env' });

const seedSheets = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cognitive-campus';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');

    // Just grab a few existing problems to map to if possible, otherwise we will just insert dummies
    const problems = await Problem.find().limit(5);

    const blind75 = {
      name: 'Blind 75',
      slug: 'blind-75',
      description: 'The classic 75 questions to get you started with LeetCode. Highly curated for FAANG prep.',
      source: 'Blind',
      totalProblems: 75,
      problems: [
        {
          title: 'Two Sum',
          difficulty: 'easy',
          topics: ['Array', 'Hash Table'],
          isAvailable: false,
          externalUrl: 'https://leetcode.com/problems/two-sum/'
        },
        {
          title: 'Best Time to Buy and Sell Stock',
          difficulty: 'easy',
          topics: ['Array', 'Dynamic Programming'],
          isAvailable: false,
          externalUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'
        },
        {
          title: 'Contains Duplicate',
          difficulty: 'easy',
          topics: ['Array', 'Hash Table'],
          isAvailable: false,
          externalUrl: 'https://leetcode.com/problems/contains-duplicate/'
        }
      ]
    };

    // If we have some local problems, randomly assign them to make them "Available" on our platform
    if (problems.length > 0) {
      blind75.problems.push({
        problemId: problems[0]._id,
        title: problems[0].title,
        difficulty: problems[0].difficulty || 'easy',
        topics: ['Array'],
        isAvailable: true,
        externalUrl: ''
      });
    }

    const neetcode150 = {
      name: 'NeetCode 150',
      slug: 'neetcode-150',
      description: 'An expanded version of Blind 75 with more practice per pattern.',
      source: 'NeetCode',
      totalProblems: 150,
      problems: [
        {
          title: 'Group Anagrams',
          difficulty: 'medium',
          topics: ['String', 'Hash Table'],
          isAvailable: false,
          externalUrl: 'https://leetcode.com/problems/group-anagrams/'
        }
      ]
    };

    if (problems.length > 1) {
      neetcode150.problems.push({
        problemId: problems[1]._id,
        title: problems[1].title,
        difficulty: problems[1].difficulty || 'medium',
        topics: ['String'],
        isAvailable: true,
        externalUrl: ''
      });
    }

    const striverA2Z = {
      name: "Striver's A2Z DSA Sheet",
      slug: 'strivers-a2z',
      description: 'Comprehensive 450+ question sheet covering every topic from basics to advanced.',
      source: 'Striver',
      totalProblems: 450,
      problems: [
        {
          title: 'Largest Element in Array',
          difficulty: 'easy',
          topics: ['Array'],
          isAvailable: false,
          externalUrl: 'https://takeuforward.org/data-structure/find-the-largest-element-in-an-array/'
        }
      ]
    };

    if (problems.length > 2) {
      striverA2Z.problems.push({
        problemId: problems[2]._id,
        title: problems[2].title,
        difficulty: problems[2].difficulty || 'easy',
        topics: ['Array'],
        isAvailable: true,
        externalUrl: ''
      });
    }

    await ProblemSheet.deleteMany({});
    console.log('Cleared existing sheets');

    await ProblemSheet.insertMany([blind75, neetcode150, striverA2Z]);
    console.log('Sheets seeded successfully!');

    process.exit();
  } catch (error) {
    console.error('Error with data import:', error);
    process.exit(1);
  }
};

seedSheets();
