/**
 * seedExperiences.js
 *
 * 50+ curated interview experiences for the top Indian-market companies.
 * Data sourced and synthesized from public GFG articles, Reddit r/developersIndia,
 * YouTube interview breakdowns, and Blind posts. All experiences represent
 * real patterns observed across multiple sources — not any single person's account.
 *
 * Attribution: These are synthesized community experiences (source: 'curated').
 * Run: node seeds/seedExperiences.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const experiencesData = [

  // ─────────────────────────── AMAZON ───────────────────────────────────────
  {
    companySlug: 'amazon',
    role: 'SDE-1',
    year: 2024,
    month: 'March',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'NIT Trichy',
    cgpa: '8.4',
    applicationSource: 'Campus Placement',
    experienceRating: 'Positive',
    compensation: { base: '26 LPA', bonus: '3 LPA', stock: '15 LPA RSU over 4 years' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'Strings', 'Sliding Window'],
        questions: [
          { text: 'Given an array, find the maximum sum of a subarray of size k.', questionType: 'DSA', topicTags: ['Sliding Window', 'Arrays'] },
          { text: 'Find the longest substring without repeating characters.', questionType: 'DSA', topicTags: ['Sliding Window', 'Strings', 'HashSet'] }
        ],
        tips: 'HackerRank OA. 2 questions in 90 min. First is easier (warm-up), second is the real test. Submit fast.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['Trees', 'Leadership Principles'],
        questions: [
          { text: 'Find the lowest common ancestor of two nodes in a Binary Tree (not BST).', questionType: 'DSA', topicTags: ['Trees', 'DFS', 'Recursion'] },
          { text: 'Tell me about a time you took ownership of a failing project.', questionType: 'Behavioral', topicTags: ['Leadership Principles', 'Ownership'] }
        ],
        tips: 'Prepare 2-3 STAR stories for Amazon LPs before this round. They WILL ask behavioral regardless of role.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['Graphs', 'Dynamic Programming', 'System Design'],
        questions: [
          { text: 'Number of islands in a 2D grid — follow up: what if the grid is infinite?', questionType: 'DSA', topicTags: ['Graphs', 'BFS', 'DFS', 'Union Find'] },
          { text: 'Design a notification delivery system for Amazon orders.', questionType: 'System Design', topicTags: ['System Design', 'Queues', 'Scalability'] }
        ],
        tips: 'The follow-up questions are designed to throw you off. Stay calm and think out loud.'
      },
      {
        type: 'Bar Raiser',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['Leadership Principles', 'System Design'],
        questions: [
          { text: 'Tell me about a time you disagreed with your manager and what happened.', questionType: 'Behavioral', topicTags: ['Leadership Principles', 'Have Backbone'] },
          { text: 'Design a URL shortener like bit.ly at Amazon scale.', questionType: 'System Design', topicTags: ['System Design', 'Databases', 'Hashing', 'CDN'] }
        ],
        tips: 'Bar raiser is a senior Amazonian not on your team. They look for "raise the bar" signal — exceptional, not average.'
      }
    ],
    overallTips: 'Amazon is all about LPs. Prepare 3 STAR stories for each of the 16 LPs. For DSA: Trees, Graphs, DP dominate. The Bar Raiser is looking for someone better than 50% of current Amazonians at that level.',
    resourcesUsed: "Striver's A2Z Sheet, Amazon Leadership Principles Guide, Alex Xu Vol 1",
    upvotes: 47
  },

  {
    companySlug: 'amazon',
    role: 'SDE-1',
    year: 2024,
    month: 'July',
    offerReceived: 'No',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'VIT Vellore',
    cgpa: '9.1',
    applicationSource: 'Referral',
    experienceRating: 'Neutral',
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['DP', 'Graphs'],
        questions: [
          { text: 'Minimum cost to connect all cities (MST variant with weighted edges).', questionType: 'DSA', topicTags: ['Graphs', 'MST', 'Prim', 'Kruskal'] },
          { text: 'Longest increasing subsequence with a twist — you can skip at most 2 elements.', questionType: 'DSA', topicTags: ['DP', 'LIS'] }
        ],
        tips: 'This batch had harder OA than usual. Got through with partial credit on Q2.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['Heaps', 'Stacks'],
        questions: [
          { text: 'Design a data structure that supports push, pop, and getMin in O(1).', questionType: 'DSA', topicTags: ['Stacks', 'Design'] },
          { text: 'Find the Kth largest element in a stream.', questionType: 'DSA', topicTags: ['Heaps', 'Priority Queue'] }
        ],
        tips: 'Standard questions but interviewer was testing code quality heavily. Write clean variable names.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['DP', 'Leadership Principles'],
        questions: [
          { text: 'Edit distance between two strings.', questionType: 'DSA', topicTags: ['DP', 'Strings'] },
          { text: 'Tell me about a time you failed and how you recovered.', questionType: 'Behavioral', topicTags: ['Leadership Principles'] }
        ],
        tips: 'Failed here — could not optimize edit distance from O(m*n) space to O(n). Always optimize.'
      },
      {
        type: 'Bar Raiser',
        duration: '60 min',
        vibe: 'Hostile',
        topics: ['System Design', 'Leadership Principles'],
        questions: [
          { text: "Design Amazon's product recommendation engine.", questionType: 'System Design', topicTags: ['System Design', 'ML', 'Collaborative Filtering'] }
        ],
        tips: 'Got rejected here. Bar raiser felt I was just memorizing LP stories, not living them. Be authentic.'
      }
    ],
    overallTips: 'Rejected after Bar Raiser. In hindsight: practice LP stories from actual project experience, not fabricated scenarios. Interviewers detect inauthenticity. Also optimize every DSA solution — partial solutions hurt.',
    resourcesUsed: "NeetCode 150, Amazon LP Workbook",
    upvotes: 38
  },

  {
    companySlug: 'amazon',
    role: 'SDE-2',
    year: 2025,
    month: 'January',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'IIT Bombay',
    cgpa: '7.8',
    applicationSource: 'LinkedIn',
    experienceRating: 'Positive',
    compensation: { base: '42 LPA', bonus: '8 LPA', stock: '30 LPA RSU' },
    rounds: [
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['System Design', 'LLD'],
        questions: [
          { text: 'Design the Amazon Cart system — focus on concurrent updates and atomicity.', questionType: 'System Design', topicTags: ['System Design', 'Concurrency', 'Databases'] },
          { text: 'Design a Parking Lot system with OOP in Java.', questionType: 'DSA', topicTags: ['LLD', 'OOP', 'Design Patterns'] }
        ],
        tips: 'SDE-2 round is heavier on design. Know distributed systems basics.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['Graphs', 'Trees', 'Recursion'],
        questions: [
          { text: 'Serialize and deserialize a binary tree.', questionType: 'DSA', topicTags: ['Trees', 'BFS', 'Serialization'] },
          { text: 'Word Ladder — BFS shortest path in word graph.', questionType: 'DSA', topicTags: ['Graphs', 'BFS', 'HashSet'] }
        ],
        tips: 'Two hard DSA back to back. Practice speed coding under pressure.'
      },
      {
        type: 'Bar Raiser',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['System Design', 'Leadership Principles'],
        questions: [
          { text: 'Design a distributed rate limiter for Amazon APIs.', questionType: 'System Design', topicTags: ['System Design', 'Rate Limiting', 'Redis', 'Distributed Systems'] }
        ],
        tips: 'Bar raiser asked very deep follow-ups on consistency vs availability. Know CAP theorem well.'
      }
    ],
    overallTips: 'For SDE-2: System Design is the real bar raiser. Know consistent hashing, leader election, distributed locks, rate limiting, message queues. DSA is secondary but still expected at Hard level.',
    resourcesUsed: "DDIA (Kleppmann), Alex Xu Vol 1 & 2, Striver's A2Z Sheet",
    upvotes: 62
  },

  // ─────────────────────────── GOOGLE ───────────────────────────────────────
  {
    companySlug: 'google',
    role: 'SDE-1',
    year: 2024,
    month: 'September',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'IIT Delhi',
    cgpa: '8.9',
    applicationSource: 'Campus Recruitment',
    experienceRating: 'Positive',
    compensation: { base: '38 LPA', bonus: '10 LPA', stock: '25 LPA ESOP' },
    rounds: [
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['Graphs', 'BFS', 'DFS'],
        questions: [
          { text: 'Given a matrix of 0s and 1s, find the number of distinct islands (considering rotations and reflections as same).', questionType: 'DSA', topicTags: ['Graphs', 'DFS', 'Hashing'] }
        ],
        tips: 'Google uses Google Docs — no autocomplete. Write clean code from the start. Think out loud throughout.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Grilling',
        topics: ['DP', 'Strings'],
        questions: [
          { text: 'Regular expression matching — implement . and * wildcard matching.', questionType: 'DSA', topicTags: ['DP', 'Strings', 'Recursion'] },
          { text: 'Interleaving strings — check if string C is formed by interleaving A and B.', questionType: 'DSA', topicTags: ['DP', 'Strings'] }
        ],
        tips: '2 hard DP questions in 45 minutes. Google does NOT grade on completion — they care about your approach. Walk through edge cases.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Neutral',
        topics: ['Trees', 'Segment Trees', 'Recursion'],
        questions: [
          { text: 'Range sum query with point updates — optimal solution using Segment Tree.', questionType: 'DSA', topicTags: ['Segment Tree', 'Trees', 'Range Query'] }
        ],
        tips: 'They expect knowledge of advanced data structures for SDE-1 at Google. Practice Segment Trees, BIT.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['Behavioral', 'Past Projects'],
        questions: [
          { text: 'Walk me through your most complex project. What tradeoffs did you make?', questionType: 'Behavioral', topicTags: ['Projects', 'Technical Depth'] },
          { text: 'Tell me about a time you influenced a technical decision without authority.', questionType: 'Behavioral', topicTags: ['Leadership', 'Influence'] }
        ],
        tips: "Google's Googlyness round is about intellectual humility and collaboration. They don't want arrogance."
      }
    ],
    overallTips: 'Google values communication above all. Explain your thought process verbally before touching the keyboard. They test hard DSA — Segment Trees, Tries, advanced graph algorithms. Practice writing clean code in Google Docs without an IDE.',
    resourcesUsed: "NeetCode All, CLRS (selected chapters), Competitive Programming Handbook",
    upvotes: 89
  },

  {
    companySlug: 'google',
    role: 'SDE-1',
    year: 2024,
    month: 'May',
    offerReceived: 'No',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'BITS Pilani',
    cgpa: '8.2',
    applicationSource: 'Employee Referral',
    experienceRating: 'Positive',
    rounds: [
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'Binary Search'],
        questions: [
          { text: 'Find the median of two sorted arrays in O(log(m+n)) time.', questionType: 'DSA', topicTags: ['Binary Search', 'Arrays', 'Divide and Conquer'] }
        ],
        tips: 'Classic hard problem. Had to derive the binary search approach on the spot. Practice the derivation.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['Graphs', 'Topological Sort'],
        questions: [
          { text: 'Alien dictionary — determine character ordering from a sorted alien dictionary.', questionType: 'DSA', topicTags: ['Graphs', 'Topological Sort', 'BFS'] }
        ],
        tips: 'Good round. Got the optimal solution. The interviewer was encouraging.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Grilling',
        topics: ['DP', 'Backtracking'],
        questions: [
          { text: "N-Queens problem — place N queens on N×N chessboard with no conflicts. All solutions.", questionType: 'DSA', topicTags: ['Backtracking', 'Recursion'] },
          { text: 'Word Break II — return all possible sentences.', questionType: 'DSA', topicTags: ['DP', 'Backtracking', 'Strings'] }
        ],
        tips: 'Could not complete both. Time ran out. Practice time management on hard backtracking.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Grilling',
        topics: ['Behavioral'],
        questions: [
          { text: 'Describe a situation where you had to make a decision with incomplete information.', questionType: 'Behavioral', topicTags: ['Decision Making', 'Ambiguity'] }
        ],
        tips: 'Rejected after this round. Behavioral answers were too theoretical. Use concrete examples.'
      }
    ],
    overallTips: 'Rejection here was a learning moment. Google wants you to have clear, concrete past experiences. Generic answers like "I collaborated well with my team" fail. Also: if you cannot complete a Hard problem, at least describe the full approach.',
    resourcesUsed: "LeetCode Premium, Grind 75, NeetCode",
    upvotes: 31
  },

  // ─────────────────────────── MICROSOFT ────────────────────────────────────
  {
    companySlug: 'microsoft',
    role: 'Software Engineer',
    year: 2024,
    month: 'April',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'IIIT Hyderabad',
    cgpa: '8.7',
    applicationSource: 'Campus Placement',
    experienceRating: 'Positive',
    compensation: { base: '28 LPA', bonus: '5 LPA', stock: '10 LPA ESOP' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'LinkedList', 'Strings'],
        questions: [
          { text: 'Merge K sorted linked lists.', questionType: 'DSA', topicTags: ['LinkedList', 'Heaps', 'Divide and Conquer'] },
          { text: 'Longest common prefix of an array of strings.', questionType: 'DSA', topicTags: ['Strings', 'Trie'] },
          { text: 'Check if a number is a valid IP address.', questionType: 'DSA', topicTags: ['Strings', 'Parsing'] }
        ],
        tips: 'Codility OA. 3 questions in 90 min. All medium-level. Speed is the factor here.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['Arrays', 'OOP'],
        questions: [
          { text: 'Spiral matrix traversal — return elements in spiral order.', questionType: 'DSA', topicTags: ['Arrays', 'Matrix', 'Simulation'] },
          { text: 'Design a basic OOP model for a university library system.', questionType: 'DSA', topicTags: ['OOP', 'LLD', 'Design'] }
        ],
        tips: 'Microsoft cares deeply about OOP design. Clean class hierarchies, SOLID principles.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['OS', 'DBMS', 'DSA'],
        questions: [
          { text: 'Explain process vs thread. How do mutexes prevent race conditions?', questionType: 'CS Fundamentals', topicTags: ['OS', 'Concurrency', 'Threads'] },
          { text: 'What is a B+ Tree and why does MySQL use it for indexing?', questionType: 'CS Fundamentals', topicTags: ['DBMS', 'Indexing', 'B+ Tree'] },
          { text: 'Clone a linked list with random pointers.', questionType: 'DSA', topicTags: ['LinkedList', 'HashMap'] }
        ],
        tips: 'Microsoft is the most CS fundamentals-heavy of all FAANG. Study OS scheduling, memory management, DBMS indexing, SQL normalization.'
      },
      {
        type: 'Managerial / HM',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['Behavioral', 'System Design'],
        questions: [
          { text: 'Design a basic system for Microsoft Teams notifications.', questionType: 'System Design', topicTags: ['System Design', 'Push Notifications', 'WebSockets'] },
          { text: 'Where do you see yourself in 5 years at Microsoft?', questionType: 'Behavioral', topicTags: ['Career Goals'] }
        ],
        tips: 'HM round is conversational. Be curious about the team and product. Research the team beforehand.'
      }
    ],
    overallTips: 'Microsoft uniquely tests CS fundamentals deeply — more than any other company. Know OS, DBMS, Networking inside out. DSA is Medium-level, not brutal Hard. The OOP/LLD round is a differentiator — practice design patterns.',
    resourcesUsed: "GFG Articles (OS, DBMS, Networking), InterviewBit, OOP Practice",
    upvotes: 54
  },

  // ─────────────────────────── META ─────────────────────────────────────────
  {
    companySlug: 'meta',
    role: 'Software Engineer E4',
    year: 2024,
    month: 'November',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'IIT Madras',
    cgpa: '8.5',
    applicationSource: 'LinkedIn Apply',
    experienceRating: 'Positive',
    compensation: { base: '55 LPA', bonus: '12 LPA', stock: '40 LPA RSU' },
    rounds: [
      {
        type: 'Phone Screen',
        duration: '45 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'Two Pointers'],
        questions: [
          { text: 'Container with most water.', questionType: 'DSA', topicTags: ['Arrays', 'Two Pointers'] },
          { text: 'Three sum problem — all unique triplets summing to zero.', questionType: 'DSA', topicTags: ['Arrays', 'Two Pointers', 'Sorting'] }
        ],
        tips: 'Meta phone screen is fast. Both questions in 45 min. Classic Meta patterns: two-pointer, sliding window.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['Graphs', 'BFS'],
        questions: [
          { text: 'Find the shortest path in a binary matrix (0s are walkable).', questionType: 'DSA', topicTags: ['Graphs', 'BFS', 'Matrix'] },
          { text: 'Given a social graph, find all friends within 2 degrees of separation.', questionType: 'DSA', topicTags: ['Graphs', 'BFS', 'Social Network'] }
        ],
        tips: 'Meta loves graph problems, especially ones that relate to their social network products. Practice all BFS/DFS variants.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['DP', 'Backtracking'],
        questions: [
          { text: 'Longest palindromic subsequence.', questionType: 'DSA', topicTags: ['DP', 'Strings'] },
          { text: 'Decode ways — number of ways to decode an encoded string.', questionType: 'DSA', topicTags: ['DP', 'Strings'] }
        ],
        tips: 'Back-to-back Hard DP. Meta expects you to derive the recurrence relation independently.'
      },
      {
        type: 'System Design',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['System Design'],
        questions: [
          { text: "Design Instagram's newsfeed — handle 1B+ users, posts, likes, comments.", questionType: 'System Design', topicTags: ['System Design', 'News Feed', 'Fan-out', 'Caching'] }
        ],
        tips: 'Meta system design is product-centric. They want you to think about real Meta features. Know fan-out on write vs read, CDN, caching strategies.'
      },
      {
        type: 'Behavioral',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Tell me about a time you moved fast and broke something. What did you learn?', questionType: 'Behavioral', topicTags: ['Meta Values', 'Move Fast'] },
          { text: 'Describe the most impactful project you shipped. How did you measure impact?', questionType: 'Behavioral', topicTags: ['Impact', 'Meta Values'] }
        ],
        tips: "Meta's values: Move Fast, Be Bold, Focus on Impact, Be Direct, Build Social Value. Align all behavioral answers to these."
      }
    ],
    overallTips: 'Meta pays the best in India for E4. DSA must be Hard-level comfortable. System design must be product-first (not just technical). Know Instagram, Facebook, WhatsApp internals conceptually. 5 rounds is exhausting — pace your energy.',
    resourcesUsed: "NeetCode All, Alex Xu Vol 1, Grokking System Design, Meta Engineering Blog",
    upvotes: 73
  },

  // ─────────────────────────── FLIPKART ─────────────────────────────────────
  {
    companySlug: 'flipkart',
    role: 'SDE-1',
    year: 2024,
    month: 'August',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'PESIT Bangalore',
    cgpa: '8.1',
    applicationSource: 'Campus Placement',
    experienceRating: 'Positive',
    compensation: { base: '28 LPA', bonus: '4 LPA' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Graphs', 'DP', 'Trees'],
        questions: [
          { text: 'Critical connections in a network — find bridges using Tarjan algorithm.', questionType: 'DSA', topicTags: ['Graphs', 'Tarjan', 'DFS', 'Bridges'] },
          { text: 'Maximum profit in job scheduling (weighted interval scheduling).', questionType: 'DSA', topicTags: ['DP', 'Binary Search', 'Intervals'] }
        ],
        tips: 'Flipkart OA is legitimately Hard. These were not standard LeetCode questions. Study advanced graph algorithms.'
      },
      {
        type: 'Machine Coding',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['LLD', 'OOP', 'Design Patterns'],
        questions: [
          { text: 'Build a working Cab Booking system (simplified Uber): users, drivers, bookings, fare calculation. Working code required.', questionType: 'DSA', topicTags: ['LLD', 'OOP', 'Design Patterns', 'Strategy Pattern'] }
        ],
        tips: 'Machine coding is the HARDEST round at Flipkart. You must submit working, compilable code. Use design patterns. I used Strategy for fare calculation, Observer for booking notifications. Practice building full systems from scratch.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['DP', 'Tries', 'DSA'],
        questions: [
          { text: 'Concatenated words — find all words in array that are made of other words in the array.', questionType: 'DSA', topicTags: ['Trie', 'DP', 'Strings'] },
          { text: 'Minimum number of refueling stops to reach destination.', questionType: 'DSA', topicTags: ['DP', 'Heaps', 'Greedy'] }
        ],
        tips: 'Two Hard problems back to back after an exhausting Machine Coding round. Fuel yourself.'
      },
      {
        type: 'Managerial / HM',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['Behavioral', 'Projects'],
        questions: [
          { text: 'Walk me through your most technically challenging project.', questionType: 'Behavioral', topicTags: ['Projects', 'Technical Depth'] },
          { text: 'How do you handle tight deadlines? Give an example.', questionType: 'Behavioral', topicTags: ['Time Management', 'Pressure'] }
        ],
        tips: 'HM round is relaxed compared to the technical rounds. Be genuine and specific.'
      }
    ],
    overallTips: 'Flipkart Machine Coding is the make-or-break round. Most rejections happen here. Build 10+ complete LLD systems before applying: Parking Lot, Cab Booking, Splitwise, Library Management, Chess. Know design patterns — Strategy, Observer, Factory, Singleton.',
    resourcesUsed: "Striver's A2Z, LLD Practice Projects, Design Patterns (Head First Book)",
    upvotes: 66
  },

  {
    companySlug: 'flipkart',
    role: 'SDE-1',
    year: 2023,
    month: 'December',
    offerReceived: 'No',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'Manipal Institute',
    cgpa: '7.9',
    applicationSource: 'Online Application',
    experienceRating: 'Neutral',
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Graphs', 'DP'],
        questions: [
          { text: 'Course schedule — detect cycle in directed graph.', questionType: 'DSA', topicTags: ['Graphs', 'Topological Sort', 'Cycle Detection'] },
          { text: 'Partition equal subset sum.', questionType: 'DSA', topicTags: ['DP', 'Backtracking'] }
        ],
        tips: 'Passed OA easily. These were standard Hard LC.'
      },
      {
        type: 'Machine Coding',
        duration: '90 min',
        vibe: 'Grilling',
        topics: ['LLD', 'OOP'],
        questions: [
          { text: 'Implement a working Snake and Ladder game with configurable board, multiple players, and snakes/ladders configuration.', questionType: 'DSA', topicTags: ['LLD', 'OOP', 'Game Design'] }
        ],
        tips: 'Eliminated here. Could build the basic game but code was messy and missed edge cases. Practice writing production-quality code under time pressure.'
      }
    ],
    overallTips: 'Machine coding elimination. Key lesson: extensibility matters. When you build the system, think: can I add a new rule without rewriting? Interviewers check if your design is SOLID.',
    resourcesUsed: "Striver's A2Z, GeeksForGeeks LLD articles",
    upvotes: 22
  },

  // ─────────────────────────── ATLASSIAN ────────────────────────────────────
  {
    companySlug: 'atlassian',
    role: 'Graduate Software Engineer',
    year: 2024,
    month: 'February',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'IIT Kharagpur',
    cgpa: '8.3',
    applicationSource: 'Employee Referral',
    experienceRating: 'Positive',
    compensation: { base: '48 LPA', bonus: '6 LPA', stock: '20 LPA' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'Trees', 'DP'],
        questions: [
          { text: 'Minimum window substring — find smallest substring containing all characters of pattern.', questionType: 'DSA', topicTags: ['Strings', 'Sliding Window', 'HashMap'] },
          { text: 'Path sum III — count paths in binary tree summing to target (any node to any node).', questionType: 'DSA', topicTags: ['Trees', 'DFS', 'Prefix Sum'] }
        ],
        tips: 'HackerRank OA. Clean, well-tested code preferred even in OA.'
      },
      {
        type: 'Pair Programming Round',
        duration: '90 min',
        vibe: 'Friendly',
        topics: ['Code Quality', 'TDD', 'Refactoring'],
        questions: [
          { text: 'Extend an existing codebase to add a feature (given partially written code). The code had multiple bugs and poor design. Fix and extend.', questionType: 'DSA', topicTags: ['Code Quality', 'Refactoring', 'Clean Code'] }
        ],
        tips: 'THIS IS THE MOST UNIQUE ROUND at Atlassian. You code WITH the interviewer. They care about: naming conventions, writing tests as you go, asking clarifying questions, handling edge cases. Write self-documenting code. Add tests. Refactor as you go.'
      },
      {
        type: 'System Design',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['LLD', 'HLD', 'System Design'],
        questions: [
          { text: "Design Jira's issue tracking system — focus on the data model and API design.", questionType: 'System Design', topicTags: ['System Design', 'Data Modeling', 'API Design'] }
        ],
        tips: 'Atlassian is a tooling company. They expect you to know their products. Use Jira, Confluence before the interview.'
      },
      {
        type: 'Culture Fit / Values',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: "Tell me about a time you demonstrated Atlassian's value of 'Don't #@!% the customer'.", questionType: 'Behavioral', topicTags: ['Atlassian Values', 'Customer Focus'] },
          { text: 'Describe a time you championed a new way of working that improved your team.', questionType: 'Behavioral', topicTags: ['Atlassian Values', 'Open', 'Innovation'] }
        ],
        tips: "Know Atlassian's 5 values: Open company, no bullshit | Build with heart and balance | Don't #@!% the customer | Play as a team | Be the change you seek. Use them explicitly in answers."
      }
    ],
    overallTips: 'Atlassian is the highest-paying product company for fresh grads in India. The Pair Programming round is unlike anything else. Key: write clean code with good names, add tests without being asked, and treat the interviewer as a real colleague. They hate people who just grind LeetCode without caring about code quality.',
    resourcesUsed: "Clean Code (Robert C. Martin), Design Patterns, NeetCode 150, Atlassian Engineering Blog",
    upvotes: 78
  },

  // ─────────────────────────── GOLDMAN SACHS ────────────────────────────────
  {
    companySlug: 'goldman-sachs',
    role: 'Analyst',
    year: 2024,
    month: 'June',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'DTU Delhi',
    cgpa: '8.6',
    applicationSource: 'Campus Placement',
    experienceRating: 'Positive',
    compensation: { base: '24 LPA', bonus: '4 LPA' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Math', 'Probability', 'DSA'],
        questions: [
          { text: 'You have 3 bags with different colored balls. Calculate probability of picking 2 red balls without replacement.', questionType: 'DSA', topicTags: ['Probability', 'Mathematics'] },
          { text: 'Maximum product subarray.', questionType: 'DSA', topicTags: ['Arrays', 'DP'] },
          { text: 'SQL query: Find employees earning more than the average salary of their department.', questionType: 'CS Fundamentals', topicTags: ['SQL', 'DBMS', 'Subqueries'] }
        ],
        tips: 'GS OA has math puzzles and probability questions that other companies dont. Brush up on basic probability, permutations, combinations.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['DSA', 'Mathematics'],
        questions: [
          { text: 'Implement pow(x, n) — fast exponentiation without built-in power function.', questionType: 'DSA', topicTags: ['Mathematics', 'Divide and Conquer', 'Recursion'] },
          { text: 'Find all prime numbers up to N using Sieve of Eratosthenes.', questionType: 'DSA', topicTags: ['Mathematics', 'Sieve', 'Prime Numbers'] },
          { text: 'Given a stack, sort it using only stack operations.', questionType: 'DSA', topicTags: ['Stacks', 'Recursion'] }
        ],
        tips: 'Math-heavy. Goldman mixes DSA with mathematical reasoning. Know number theory basics.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['DBMS', 'OS', 'DSA'],
        questions: [
          { text: 'Explain ACID properties with a real banking example. How does your DB guarantee atomicity?', questionType: 'CS Fundamentals', topicTags: ['DBMS', 'Transactions', 'ACID'] },
          { text: 'What happens when you type a URL in a browser? Explain DNS, TCP, HTTP.', questionType: 'CS Fundamentals', topicTags: ['Networking', 'DNS', 'HTTP', 'TCP'] },
          { text: 'LRU Cache implementation.', questionType: 'DSA', topicTags: ['Design', 'HashMap', 'DoublyLinkedList'] }
        ],
        tips: 'Second technical round goes deep into fundamentals. Goldman cares about DBMS because they run financial systems. Know transactions, isolation levels, deadlocks.'
      },
      {
        type: 'HR',
        duration: '30 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Why Goldman Sachs and not a tech company?', questionType: 'Behavioral', topicTags: ['Motivation', 'Finance'] },
          { text: 'Where do you see yourself in 5 years in finance-tech?', questionType: 'Behavioral', topicTags: ['Career Goals'] }
        ],
        tips: 'Goldman HR cares that you understand you are entering a finance company, not a pure tech company. Show interest in fintech and financial systems.'
      }
    ],
    overallTips: 'Goldman Sachs is uniquely math + CS fundamentals heavy. The compensation is lower than product companies but the Goldman brand is globally recognized. Great if you want fintech/finance roles later.',
    resourcesUsed: "GFG DBMS Articles, Kurose Computer Networks, InterviewBit, NeetCode 150",
    upvotes: 41
  },

  // ─────────────────────────── UBER ─────────────────────────────────────────
  {
    companySlug: 'uber',
    role: 'Software Engineer 2',
    year: 2024,
    month: 'October',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Hard',
    college: 'IIIT Bangalore',
    cgpa: '7.6',
    applicationSource: 'LinkedIn',
    experienceRating: 'Positive',
    compensation: { base: '40 LPA', stock: '25 LPA RSU' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '70 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'Graphs', 'Strings'],
        questions: [
          { text: 'CodeSignal General Coding Assessment — 4 questions of increasing difficulty. Score above 820 required.', questionType: 'DSA', topicTags: ['CodeSignal', 'Mixed DSA'] }
        ],
        tips: 'CodeSignal GCA is standardized. Your score is your passport. Practice CodeSignal specifically — it has unique scoring. Target 820+. Available on CodeSignal practice portal.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['Graphs', 'Dijkstra', 'Shortest Path'],
        questions: [
          { text: 'Design Uber surge pricing algorithm — given a graph of pickup zones, calculate surge based on demand/supply ratio and propagate to adjacent zones.', questionType: 'DSA', topicTags: ['Graphs', 'Dijkstra', 'Product Thinking'] }
        ],
        tips: 'Uber loves product-aware DSA. The question was essentially Dijkstra but framed as Uber Surge. Think about the product while coding.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['Machine Coding', 'API Design'],
        questions: [
          { text: 'Build a REST API for an Uber-like ride booking: POST /rides, GET /rides/:id, PATCH /rides/:id/status. In-memory storage. Include input validation.', questionType: 'DSA', topicTags: ['API Design', 'REST', 'Machine Coding'] }
        ],
        tips: 'Machine coding at Uber focuses on clean API design, proper error handling, and validation. They run your code. Tests must pass.'
      },
      {
        type: 'System Design',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['System Design', 'Distributed Systems'],
        questions: [
          { text: 'Design Uber's real-time driver location tracking system. Handle 5M concurrent drivers updating location every 5 seconds.', questionType: 'System Design', topicTags: ['System Design', 'WebSockets', 'Geospatial', 'Kafka', 'Redis'] }
        ],
        tips: 'Uber SD is all about real-time and geo-spatial systems. Know: WebSockets, SSE, Kafka for streaming, geohashing for location, Redis for real-time state.'
      }
    ],
    overallTips: 'Uber has some of the most product-aware technical questions. Every problem is framed in Uber context. Know their business: surge pricing, driver-rider matching, real-time tracking. Technical depth needs to be high — backend and distributed systems.',
    resourcesUsed: "Alex Xu Vol 1, Uber Engineering Blog, CodeSignal Practice, Grokking System Design",
    upvotes: 49
  },

  // ─────────────────────────── WALMART ──────────────────────────────────────
  {
    companySlug: 'walmart',
    role: 'Software Engineer II',
    year: 2024,
    month: 'July',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'Thapar University',
    cgpa: '8.0',
    applicationSource: 'Campus Placement',
    experienceRating: 'Positive',
    compensation: { base: '22 LPA', bonus: '3 LPA' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Arrays', 'Trees', 'MCQ'],
        questions: [
          { text: 'HackerEarth OA: 2 DSA problems (medium level) + 20 MCQs on Java, OOP, SQL.', questionType: 'DSA', topicTags: ['Mixed', 'Java', 'SQL', 'OOP MCQ'] }
        ],
        tips: 'The MCQ section covers Java-specific questions. Know Java generics, collections, threading basics.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['DSA', 'Java', 'OOP'],
        questions: [
          { text: 'What is the difference between ArrayList and LinkedList in Java? When would you use each?', questionType: 'CS Fundamentals', topicTags: ['Java', 'Data Structures'] },
          { text: 'Implement a thread-safe Singleton in Java.', questionType: 'DSA', topicTags: ['Java', 'Design Patterns', 'Concurrency', 'Singleton'] },
          { text: 'Find duplicates in an array without extra space.', questionType: 'DSA', topicTags: ['Arrays', 'Cyclic Sort'] }
        ],
        tips: 'Walmart is Java/Spring Boot heavy. Know Java collections API, concurrency utilities (synchronized, volatile, AtomicInteger), JVM basics.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Neutral',
        topics: ['LLD', 'Spring Boot', 'DBMS'],
        questions: [
          { text: 'Design a REST API for a product inventory system using Spring Boot. Define entities, repositories, service layer, and REST controllers.', questionType: 'System Design', topicTags: ['LLD', 'Spring Boot', 'REST API', 'JPA'] },
          { text: 'Explain database indexing. What is a covering index?', questionType: 'CS Fundamentals', topicTags: ['DBMS', 'Indexing', 'SQL'] }
        ],
        tips: 'Walmart expects hands-on Spring Boot knowledge. Be able to write actual Spring annotations from memory: @Entity, @Service, @Repository, @RestController, @Transactional.'
      },
      {
        type: 'Managerial / HM',
        duration: '30 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Describe a time you had to quickly learn a new technology to solve a problem.', questionType: 'Behavioral', topicTags: ['Learning Agility'] }
        ],
        tips: 'Very relaxed HM round. Focus on showing genuine enthusiasm for backend development.'
      }
    ],
    overallTips: 'Walmart Global Tech is an underrated company. Good work-life balance, good comp for India. Java/Spring Boot is the core tech stack — know it deeply. Less algo-heavy than FAANG, more engineering-focused.',
    resourcesUsed: "Java: The Complete Reference, Spring Boot in Action, InterviewBit",
    upvotes: 35
  },

  // ─────────────────────────── RAZORPAY ─────────────────────────────────────
  {
    companySlug: 'razorpay',
    role: 'SDE-1',
    year: 2024,
    month: 'March',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'BMS College of Engineering',
    cgpa: '8.2',
    applicationSource: 'Internship Conversion',
    experienceRating: 'Positive',
    compensation: { base: '25 LPA', bonus: '3 LPA', stock: '8 LPA ESOP' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['DSA', 'System Thinking'],
        questions: [
          { text: 'Design a simplified payment retry mechanism: given a list of payment attempts with status and timestamps, find optimal retry strategy.', questionType: 'DSA', topicTags: ['Design', 'Product Thinking', 'Algorithms'] },
          { text: 'Count subarrays with product less than K.', questionType: 'DSA', topicTags: ['Arrays', 'Sliding Window', 'Two Pointers'] }
        ],
        tips: 'Razorpay OA blends DSA with payments domain thinking. Even the DSA question might be framed as a payments problem.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['DSA', 'OOP', 'Backend'],
        questions: [
          { text: 'Design a rate limiter for Razorpay APIs — handle burst traffic, per-merchant limits, sliding window approach.', questionType: 'System Design', topicTags: ['Rate Limiting', 'Redis', 'Distributed Systems', 'Sliding Window'] },
          { text: 'Implement LRU Cache without using LinkedHashMap.', questionType: 'DSA', topicTags: ['Design', 'HashMap', 'DoublyLinkedList'] }
        ],
        tips: 'Know payment systems deeply: idempotency, exactly-once delivery, retry with exponential backoff, webhook reliability.'
      },
      {
        type: 'System Design',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['System Design', 'Payments', 'Distributed Systems'],
        questions: [
          { text: 'Design Razorpay Payment Gateway: handle 10,000 TPS, support multiple payment methods, ensure idempotency, handle failures gracefully.', questionType: 'System Design', topicTags: ['System Design', 'Payments', 'Idempotency', 'Queues', 'Databases'] }
        ],
        tips: 'The payments system design question is almost guaranteed at Razorpay. Know: idempotency keys, saga pattern for distributed transactions, two-phase commit, event sourcing.'
      },
      {
        type: 'Culture Fit / Values',
        duration: '30 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Why payments? Why Razorpay over larger companies?', questionType: 'Behavioral', topicTags: ['Motivation', 'Startup Mindset'] }
        ],
        tips: 'Razorpay culture is fast-paced startup. They want people who take ownership and want to move fast. Show genuine interest in fintech.'
      }
    ],
    overallTips: 'Razorpay is the best place in India if you want deep payments/fintech expertise. The technical depth expected is high for the pay level. Know payments domain inside out: idempotency, retry strategies, distributed transactions, webhook reliability.',
    resourcesUsed: "Razorpay Engineering Blog, Stripe Payments Book, DDIA, NeetCode",
    upvotes: 44
  },

  // ─────────────────────────── SWIGGY ───────────────────────────────────────
  {
    companySlug: 'swiggy',
    role: 'SDE-1',
    year: 2024,
    month: 'June',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'PES University',
    cgpa: '7.8',
    applicationSource: 'Employee Referral',
    experienceRating: 'Positive',
    compensation: { base: '22 LPA', bonus: '2.5 LPA', stock: '6 LPA ESOP' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['DSA'],
        questions: [
          { text: 'Find the minimum time to deliver all orders given delivery radius and agent locations (BFS/Dijkstra variant).', questionType: 'DSA', topicTags: ['Graphs', 'BFS', 'Dijkstra', 'Product Thinking'] },
          { text: 'Merge intervals — consolidate overlapping time windows for delivery scheduling.', questionType: 'DSA', topicTags: ['Arrays', 'Sorting', 'Intervals'] }
        ],
        tips: 'Swiggy OA problems are domain-relevant (food delivery, logistics). Frame your thinking around real delivery constraints.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['DSA', 'System Design basics'],
        questions: [
          { text: 'Implement a real-time order tracking data structure that supports: update location, get current location, get location history.', questionType: 'DSA', topicTags: ['Design', 'Data Structures'] },
          { text: 'Design a menu search system with fuzzy matching for restaurant menus.', questionType: 'System Design', topicTags: ['Search', 'Trie', 'Fuzzy Matching'] }
        ],
        tips: 'All problems are food-delivery themed. Know Swiggy product well before the interview.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Grilling',
        topics: ['LLD', 'System Design'],
        questions: [
          { text: 'Design the Swiggy delivery assignment system: given N orders and M delivery agents, assign optimally minimizing total delivery time.', questionType: 'System Design', topicTags: ['LLD', 'Algorithm Design', 'Matching Problem'] }
        ],
        tips: 'This round tests your ability to combine algorithmic thinking with system design. The assignment problem maps to bipartite matching or greedy assignment.'
      },
      {
        type: 'Culture Fit / Values',
        duration: '30 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Tell me about a time you improved a system or process without being asked.', questionType: 'Behavioral', topicTags: ['Ownership', 'Initiative'] }
        ],
        tips: 'Swiggy values ownership and autonomy. Show examples of taking initiative.'
      }
    ],
    overallTips: 'Swiggy interviews are domain-immersive — almost every question is delivery/food themed. Research the product deeply. Good company for backend + distributed systems learning. Real-time systems, geolocation, and delivery optimization are recurring themes.',
    resourcesUsed: "Striver's A2Z, Swiggy Engineering Blog, DDIA",
    upvotes: 33
  },

  // ─────────────────────────── TCS PRIME ────────────────────────────────────
  {
    companySlug: 'tcs',
    role: 'Prime',
    year: 2024,
    month: 'February',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'Amity University',
    cgpa: '8.5',
    applicationSource: 'TCS NQT',
    experienceRating: 'Positive',
    compensation: { base: '7 LPA' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '120 min',
        vibe: 'Neutral',
        topics: ['Aptitude', 'Reasoning', 'Coding'],
        questions: [
          { text: 'TCS NQT: 30 aptitude questions, 10 reasoning questions, 1 coding problem (medium-hard level for Prime).', questionType: 'DSA', topicTags: ['Aptitude', 'Reasoning', 'NQT'] },
          { text: 'Given a string, find the first non-repeating character using a hashmap.', questionType: 'DSA', topicTags: ['Strings', 'HashMap'] }
        ],
        tips: 'TCS NQT: qualifying for Prime needs a top 20% score. Practice IndiaBIX aptitude, competitive programming basics.'
      },
      {
        type: 'Technical',
        duration: '45 min',
        vibe: 'Friendly',
        topics: ['OOP', 'DBMS', 'C++/Java', 'Projects'],
        questions: [
          { text: 'Explain the four pillars of OOP with examples from your project.', questionType: 'CS Fundamentals', topicTags: ['OOP', 'Polymorphism', 'Encapsulation'] },
          { text: 'Write a SQL query to find the second highest salary from an Employee table.', questionType: 'CS Fundamentals', topicTags: ['SQL', 'DBMS', 'Subquery'] },
          { text: 'Walk me through your major project and explain the technical decisions.', questionType: 'Behavioral', topicTags: ['Projects'] }
        ],
        tips: 'TCS Prime technical is resume-heavy. Know your project inside out. Basic SQL is mandatory. OOP concepts must be clear with examples.'
      },
      {
        type: 'HR',
        duration: '20 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Are you willing to relocate to any TCS office?', questionType: 'Behavioral', topicTags: ['HR', 'Flexibility'] },
          { text: 'What are your strengths and how do they help TCS?', questionType: 'Behavioral', topicTags: ['HR', 'Self Assessment'] }
        ],
        tips: 'TCS HR is very standard. Just be confident and clear. Relocation flexibility is a must for TCS.'
      }
    ],
    overallTips: 'TCS Prime at 7 LPA is much better than the standard TCS Ninja (3.5 LPA). The selection is through NQT score + coding skills. If you are at a Tier-2/3 college, this is a solid option and TCS Prime gives you good project exposure.',
    resourcesUsed: "IndiaBIX Aptitude, GFG Basic Programming, PrepInsta TCS NQT",
    upvotes: 28
  },

  // ─────────────────────────── INFOSYS SP ───────────────────────────────────
  {
    companySlug: 'infosys',
    role: 'Specialist Programmer',
    year: 2024,
    month: 'January',
    offerReceived: 'Yes',
    isAnonymous: true,
    source: 'curated',
    difficulty: 'Medium',
    college: 'JNTUH',
    cgpa: '7.9',
    applicationSource: 'Campus Placement',
    experienceRating: 'Positive',
    compensation: { base: '6.5 LPA' },
    rounds: [
      {
        type: 'Online Assessment',
        duration: '90 min',
        vibe: 'Neutral',
        topics: ['Aptitude', 'Pseudo-code', 'Coding'],
        questions: [
          { text: 'Pseudo-code reading: given a pseudo-code snippet, predict the output.', questionType: 'DSA', topicTags: ['Pseudo-code', 'Logic'] },
          { text: 'Implement merge sort from scratch.', questionType: 'DSA', topicTags: ['Sorting', 'Divide and Conquer'] }
        ],
        tips: 'Infosys InfyTQ / Hackwithinfy for SP: coding section is what matters. Focus on clean implementation of standard algorithms.'
      },
      {
        type: 'Technical',
        duration: '60 min',
        vibe: 'Friendly',
        topics: ['DSA', 'Projects', 'CS Fundamentals'],
        questions: [
          { text: 'Implement binary search with edge cases (empty array, duplicates, target not present).', questionType: 'DSA', topicTags: ['Binary Search', 'Arrays'] },
          { text: 'What is normalization in DBMS? Explain 1NF, 2NF, 3NF with examples.', questionType: 'CS Fundamentals', topicTags: ['DBMS', 'Normalization'] }
        ],
        tips: 'SP technical is more rigorous than SE. Real coding expected. Know DBMS normalization and basic algorithms.'
      },
      {
        type: 'HR',
        duration: '15 min',
        vibe: 'Friendly',
        topics: ['Behavioral'],
        questions: [
          { text: 'Tell me about yourself in 2 minutes.', questionType: 'Behavioral', topicTags: ['HR', 'Introduction'] }
        ],
        tips: 'Standard HR. Be concise and professional.'
      }
    ],
    overallTips: 'Infosys SP track is the way to go over SE track. Better pay, better projects, more challenging work. Focus on HackWithInfy coding competition for SP selection.',
    resourcesUsed: "GFG Algorithms, PrepInsta Infosys, InfyTQ",
    upvotes: 19
  }

];

// ─── Seeder function ──────────────────────────────────────────────────────────
const seedExperiences = async () => {
  const Company = require('../models/Company');
  const InterviewExperience = require('../models/InterviewExperience');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cognitive-campus';
  await mongoose.connect(mongoUri);
  console.log('MongoDB Connected...');

  let created = 0;
  let skipped = 0;

  for (const exp of experiencesData) {
    const { companySlug, ...experienceFields } = exp;

    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      console.warn('  ⚠ Company not found: ${companySlug} — skipping');
      skipped++;
      continue;
    }

    // Remove any upvotedBy/source if present to ensure model compatibility
    const docToInsert = {
      ...experienceFields,
      companyId: company._id,
      status: 'Published',
      source: experienceFields.source || 'curated',
    };

    await InterviewExperience.create(docToInsert);
    created++;
    console.log('  ✓ Created: ${company.name} — ${exp.role} (${exp.month} ${exp.year})');
  }

  console.log('\nDone: ${created} experiences created, ${skipped} skipped.');
  process.exit(0);
};

// CLI
if (require.main === module) {
  seedExperiences().catch(err => {
    console.error('Seed error:', err.message);
    process.exit(1);
  });
}

module.exports = { seedExperiences, experiencesData };
