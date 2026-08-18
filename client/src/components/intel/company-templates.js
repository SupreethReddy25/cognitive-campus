/**
 * company-templates.js
 * Company-aware interview round templates derived from seed data + research.
 * When a user selects a company, Step 3 auto-populates known round structures
 * and boosts relevant topic/resource suggestions to the top.
 */

export const COMPANY_TEMPLATES = {
  'amazon': {
    hint: "Amazon's 16 Leadership Principles are non-negotiable. Prepare 2-3 STAR stories for each.",
    priorityTopics: ['Leadership Principles', 'Trees', 'Arrays', 'Graphs', 'Dynamic Programming', 'System Design (HLD)'],
    priorityResources: ["Amazon Leadership Principles", "Striver's A2Z Sheet", "Grokking the System Design Interview"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '70 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Trees', 'Graphs', 'Dynamic Programming'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['System Design (HLD)', 'Leadership Principles'], vibe: '' },
      { type: 'Bar Raiser',             duration: '60 min', defaultTopics: ['Leadership Principles', 'System Design (HLD)'], vibe: '' },
    ],
  },

  'google': {
    hint: "Google evaluates HOW you think, not just the final answer. Explain your approach before coding.",
    priorityTopics: ['Graphs', 'Dynamic Programming', 'Trees', 'Binary Search', 'BFS/DFS', 'Arrays', 'Strings'],
    priorityResources: ["NeetCode 150", "LeetCode Premium", "Grind 75"],
    autoRounds: [
      { type: 'Phone Screen',              duration: '45 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',                 duration: '45 min', defaultTopics: ['Graphs', 'Dynamic Programming', 'Trees'], vibe: '' },
      { type: 'Technical',                 duration: '45 min', defaultTopics: ['Dynamic Programming', 'Binary Search', 'Recursion'], vibe: '' },
      { type: 'Culture Fit / Values',      duration: '45 min', defaultTopics: ['Behavioral (STAR)', 'Culture Fit'], vibe: '' },
    ],
  },

  'meta': {
    hint: "Meta expects Hard LeetCode. Must be comfortable solving complex graph/DP under time pressure.",
    priorityTopics: ['Graphs', 'Dynamic Programming', 'Backtracking', 'Arrays', 'System Design (HLD)', 'Scalability'],
    priorityResources: ["LeetCode Premium", "NeetCode 150", "Alex Xu Vol 1 (System Design Interview)"],
    autoRounds: [
      { type: 'Recruiter Screen',    duration: '30 min', defaultTopics: [], vibe: '' },
      { type: 'Technical',           duration: '45 min', defaultTopics: ['Graphs', 'Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',           duration: '45 min', defaultTopics: ['Dynamic Programming', 'Backtracking', 'Trees'], vibe: '' },
      { type: 'System Design (HLD)', duration: '45 min', defaultTopics: ['Scalability', 'API Design'], vibe: '' },
      { type: 'Culture Fit / Values',duration: '45 min', defaultTopics: ['Behavioral (STAR)', 'Culture Fit'], vibe: '' },
    ],
  },

  'microsoft': {
    hint: "Microsoft tests CS fundamentals more than most. Know OS, DBMS, networking inside-out.",
    priorityTopics: ['OS Concepts', 'DBMS/SQL', 'Computer Networks', 'OOP/OOAD', 'Arrays', 'Trees'],
    priorityResources: ["InterviewBit", "GFG Articles", "Striver's A2Z Sheet", "Operating Systems (Galvin)"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '60 min', defaultTopics: ['Arrays', 'Strings', 'Trees'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Arrays', 'Trees', 'OOP/OOAD'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['OS Concepts', 'DBMS/SQL', 'Computer Networks'], vibe: '' },
      { type: 'Managerial / HM',        duration: '45 min', defaultTopics: ['System Design (HLD)', 'Behavioral (STAR)'], vibe: '' },
    ],
  },

  'flipkart': {
    hint: "Machine Coding is the biggest eliminator at Flipkart. Practice building working systems in 90 minutes.",
    priorityTopics: ['OOP/OOAD', 'Low-Level Design (LLD)', 'Machine Coding', 'Trees', 'Dynamic Programming'],
    priorityResources: ["Striver's A2Z Sheet", "LLD Practice (Parking Lot, Splitwise)", "Design Patterns (Head First)"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '90 min', defaultTopics: ['Trees', 'Graphs', 'Dynamic Programming'], vibe: '' },
      { type: 'Machine Coding',         duration: '90 min', defaultTopics: ['OOP/OOAD', 'Low-Level Design (LLD)'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Arrays', 'Dynamic Programming', 'Graphs'], vibe: '' },
      { type: 'Managerial / HM',        duration: '45 min', defaultTopics: ['Behavioral (STAR)', 'Project Deep-Dive'], vibe: '' },
    ],
  },

  'uber': {
    hint: "CodeSignal bar is brutal — practice speed. Hard DSA is the norm at Uber.",
    priorityTopics: ['Arrays', 'Graphs', 'Dynamic Programming', 'System Design (HLD)', 'Machine Coding'],
    priorityResources: ["LeetCode Premium", "NeetCode 150", "Alex Xu Vol 1 (System Design Interview)"],
    autoRounds: [
      { type: 'Online Assessment (OA)',  duration: '70 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',               duration: '60 min', defaultTopics: ['Graphs', 'Dynamic Programming'], vibe: '' },
      { type: 'Machine Coding',          duration: '60 min', defaultTopics: ['Machine Coding', 'API Design'], vibe: '' },
      { type: 'System Design (HLD)',     duration: '60 min', defaultTopics: ['System Design (HLD)', 'Scalability'], vibe: '' },
    ],
  },

  'goldman-sachs': {
    hint: "Probability and math puzzles appear frequently at Goldman. Know your DBMS and OS fundamentals well.",
    priorityTopics: ['Math/Probability', 'DBMS/SQL', 'Arrays', 'OS Concepts', 'Puzzles / Estimation'],
    priorityResources: ["InterviewBit", "GFG Articles", "DBMS (Navathe)"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '60 min', defaultTopics: ['Arrays', 'Strings', 'Math/Probability'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Arrays', 'Strings', 'Hash Maps'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['DBMS/SQL', 'OS Concepts', 'Dynamic Programming'], vibe: '' },
      { type: 'HR',                     duration: '30 min', defaultTopics: ['Behavioral (STAR)', 'Why This Company?'], vibe: '' },
    ],
  },

  'walmart': {
    hint: "Core Java, Spring Boot, and OOP design are heavily tested. Know DBMS well.",
    priorityTopics: ['OOP/OOAD', 'DBMS/SQL', 'OS Concepts', 'Low-Level Design (LLD)', 'Arrays'],
    priorityResources: ["InterviewBit", "GFG Articles", "DBMS (Navathe)", "Striver's A2Z Sheet"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '60 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Arrays', 'OS Concepts', 'DBMS/SQL'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Low-Level Design (LLD)', 'OOP/OOAD'], vibe: '' },
      { type: 'Managerial / HM',        duration: '45 min', defaultTopics: ['Behavioral (STAR)', 'Project Deep-Dive'], vibe: '' },
    ],
  },

  'atlassian': {
    hint: "Write clean, modular, well-named code with tests. Atlassian deeply values code quality over brute-force.",
    priorityTopics: ['Clean Code / Testing', 'OOP/OOAD', 'Low-Level Design (LLD)', 'Scalability', 'Culture Fit'],
    priorityResources: ["Clean Code (Robert C. Martin)", "SOLID Principles Practice", "Alex Xu Vol 1 (System Design Interview)"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '60 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Pair Programming',       duration: '60 min', defaultTopics: ['Clean Code / Testing', 'OOP/OOAD'], vibe: '' },
      { type: 'System Design (HLD)',    duration: '60 min', defaultTopics: ['Scalability', 'API Design'], vibe: '' },
      { type: 'Culture Fit / Values',   duration: '45 min', defaultTopics: ['Culture Fit', 'Behavioral (STAR)'], vibe: '' },
    ],
  },

  'tcs': {
    hint: "Know your resume well. Basic SQL queries, OOP concepts in Java/C++ are a must for TCS.",
    priorityTopics: ['OOP/OOAD', 'DBMS/SQL', 'OS Concepts', 'Arrays', 'Strings'],
    priorityResources: ["GFG Articles", "InterviewBit", "GFG Practice"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '90 min', defaultTopics: ['Arrays', 'Strings', 'Math/Number Theory'], vibe: '' },
      { type: 'Technical',              duration: '45 min', defaultTopics: ['OOP/OOAD', 'DBMS/SQL', 'OS Concepts'], vibe: '' },
      { type: 'HR',                     duration: '30 min', defaultTopics: ['Behavioral (STAR)', 'Why This Company?'], vibe: '' },
    ],
  },

  'infosys': {
    hint: "For Specialist Programmer track, focus on competitive programming. For Systems Engineer, basics and projects are enough.",
    priorityTopics: ['OOP/OOAD', 'DBMS/SQL', 'Project Deep-Dive', 'Arrays', 'Strings'],
    priorityResources: ["GFG Articles", "InterviewBit", "Codeforces"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '90 min', defaultTopics: ['Arrays', 'Strings', 'OS Concepts'], vibe: '' },
      { type: 'Technical',              duration: '45 min', defaultTopics: ['OOP/OOAD', 'DBMS/SQL', 'Project Deep-Dive'], vibe: '' },
      { type: 'HR',                     duration: '30 min', defaultTopics: ['Behavioral (STAR)', 'Why This Company?'], vibe: '' },
    ],
  },

  'razorpay': {
    hint: "Know payment systems concepts — idempotency, exactly-once semantics, distributed transactions.",
    priorityTopics: ['System Design (HLD)', 'Database Design', 'API Design', 'Microservices', 'Arrays'],
    priorityResources: ["Alex Xu Vol 1 (System Design Interview)", "DDIA (Kleppmann)", "Striver's A2Z Sheet"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '60 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Arrays', 'OOP/OOAD'], vibe: '' },
      { type: 'System Design (HLD)',    duration: '60 min', defaultTopics: ['System Design (HLD)', 'Database Design', 'API Design'], vibe: '' },
      { type: 'Culture Fit / Values',   duration: '45 min', defaultTopics: ['Culture Fit', 'Behavioral (STAR)'], vibe: '' },
    ],
  },

  'swiggy': {
    hint: "Real-time and distributed systems knowledge is valued. LLD of delivery or food systems is common.",
    priorityTopics: ['System Design (HLD)', 'Low-Level Design (LLD)', 'Graphs', 'Arrays', 'Dynamic Programming'],
    priorityResources: ["DDIA (Kleppmann)", "Striver's A2Z Sheet", "Grokking the System Design Interview"],
    autoRounds: [
      { type: 'Online Assessment (OA)', duration: '60 min', defaultTopics: ['Arrays', 'Strings'], vibe: '' },
      { type: 'Technical',              duration: '60 min', defaultTopics: ['Arrays', 'Graphs', 'Dynamic Programming'], vibe: '' },
      { type: 'Machine Coding',         duration: '60 min', defaultTopics: ['Low-Level Design (LLD)', 'OOP/OOAD'], vibe: '' },
      { type: 'Culture Fit / Values',   duration: '45 min', defaultTopics: ['Culture Fit', 'Project Deep-Dive'], vibe: '' },
    ],
  },
};

export const DEFAULT_TEMPLATE = {
  hint: null,
  priorityTopics: [],
  priorityResources: [],
  autoRounds: [
    { type: '', duration: '', defaultTopics: [], vibe: '' },
  ],
};

export function getCompanyTemplate(slug) {
  return COMPANY_TEMPLATES[slug] || DEFAULT_TEMPLATE;
}

export function makeEmptyRound() {
  return { type: '', duration: '', vibe: '', topics: [], questions: [], notes: '' };
}
