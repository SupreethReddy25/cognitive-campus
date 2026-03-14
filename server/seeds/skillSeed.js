/**
 * Skill Seed Script
 *
 * Inserts all 12 DSA skills with correct prerequisite relationships
 * as defined in AGENT.md. Uses upsert (updateOne + upsert) so it is
 * safe to run multiple times without creating duplicates.
 *
 * Usage: node seeds/skillSeed.js
 *
 * @module skillSeed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const logger = require('../utils/logger');

/**
 * Skill definitions with prerequisite names.
 * Prerequisites will be resolved to ObjectIds after initial upsert pass.
 */
const SKILLS = [
  {
    name: 'Arrays',
    description: 'Fundamental data structure for storing ordered collections. Covers traversal, manipulation, two-pointer technique, sliding window, and in-place operations.',
    difficultyWeight: 1,
    order: 1,
    prerequisites: []
  },
  {
    name: 'Strings',
    description: 'Character sequence manipulation including pattern matching, palindromes, anagram detection, and string transformation algorithms.',
    difficultyWeight: 1,
    order: 2,
    prerequisites: []
  },
  {
    name: 'Hashing',
    description: 'Hash maps and hash sets for O(1) lookups. Covers frequency counting, duplicate detection, and two-sum style problems.',
    difficultyWeight: 2,
    order: 3,
    prerequisites: ['Arrays']
  },
  {
    name: 'Recursion',
    description: 'Breaking problems into smaller subproblems. Covers base cases, recursive tree exploration, backtracking, and memoization foundations.',
    difficultyWeight: 3,
    order: 4,
    prerequisites: ['Arrays']
  },
  {
    name: 'Sorting',
    description: 'Comparison-based and distribution sorting algorithms. Covers bubble sort, merge sort, quicksort, and custom comparators.',
    difficultyWeight: 2,
    order: 5,
    prerequisites: ['Arrays']
  },
  {
    name: 'Searching',
    description: 'Efficient element lookup using binary search and its variations. Covers sorted array search, search space reduction, and boundary finding.',
    difficultyWeight: 2,
    order: 6,
    prerequisites: ['Arrays', 'Sorting']
  },
  {
    name: 'Linked Lists',
    description: 'Node-based sequential data structures. Covers singly and doubly linked lists, pointer manipulation, cycle detection, and list reversal.',
    difficultyWeight: 3,
    order: 7,
    prerequisites: ['Arrays']
  },
  {
    name: 'Stacks & Queues',
    description: 'LIFO and FIFO data structures. Covers expression evaluation, monotonic stacks, BFS with queues, and stack-based parsing.',
    difficultyWeight: 3,
    order: 8,
    prerequisites: ['Linked Lists']
  },
  {
    name: 'Trees',
    description: 'Hierarchical data structures including binary trees, BSTs, and tree traversals. Covers DFS, BFS, height calculation, and path problems.',
    difficultyWeight: 4,
    order: 9,
    prerequisites: ['Recursion', 'Linked Lists']
  },
  {
    name: 'Graphs',
    description: 'Network structures with vertices and edges. Covers adjacency representations, DFS, BFS, connected components, and shortest paths.',
    difficultyWeight: 5,
    order: 10,
    prerequisites: ['Trees']
  },
  {
    name: 'Dynamic Programming',
    description: 'Optimal substructure and overlapping subproblems. Covers 1D/2D DP, tabulation vs memoization, knapsack, and sequence problems.',
    difficultyWeight: 5,
    order: 11,
    prerequisites: ['Recursion']
  },
  {
    name: 'Greedy Algorithms',
    description: 'Locally optimal choices leading to global optimum. Covers activity selection, interval scheduling, Huffman coding, and greedy proofs.',
    difficultyWeight: 4,
    order: 12,
    prerequisites: ['Dynamic Programming']
  }
];

/**
 * Runs the skill seed: upserts all 12 skills, then resolves prerequisite
 * names to ObjectIds and updates each skill.
 */
const seedSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected for skill seeding');

    // Pass 1: Upsert all skills without prerequisites
    for (const skillData of SKILLS) {
      await Skill.updateOne(
        { name: skillData.name },
        {
          $set: {
            description: skillData.description,
            difficultyWeight: skillData.difficultyWeight,
            order: skillData.order
          },
          $setOnInsert: { prerequisites: [] }
        },
        { upsert: true }
      );
    }

    logger.info('Pass 1 complete: all 12 skills upserted');

    // Pass 2: Resolve prerequisite names to ObjectIds and update
    const allSkills = await Skill.find({});
    const nameToIdMap = new Map(allSkills.map((skill) => [skill.name, skill._id]));

    for (const skillData of SKILLS) {
      if (skillData.prerequisites.length > 0) {
        const prerequisiteIds = skillData.prerequisites.map((prereqName) => {
          const prereqId = nameToIdMap.get(prereqName);
          if (!prereqId) {
            logger.error(`Prerequisite "${prereqName}" not found for skill "${skillData.name}"`);
          }
          return prereqId;
        }).filter(Boolean);

        await Skill.updateOne(
          { name: skillData.name },
          { $set: { prerequisites: prerequisiteIds } }
        );
      }
    }

    logger.info('Pass 2 complete: prerequisites resolved and linked');
    logger.info('Skill seeding finished successfully — 12 skills ready');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Skill seeding failed', { error: error.message });
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedSkills();
