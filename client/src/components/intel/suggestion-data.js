/**
 * suggestion-data.js
 * All contextual chip suggestion dictionaries for the Guided Narrative Builder.
 * Sourced from research across Reddit r/cscareerquestions, r/developersIndia,
 * Blind, LeetCode discussions, and company-specific interview guides.
 */

// ─── Preparation Resources ───────────────────────────────────────────────────

export const PREP_SUGGESTIONS = [
  // DSA Sheets & Problem Lists
  { label: "Striver's A2Z Sheet",                   category: "DSA Sheets",      priority: 100 },
  { label: "NeetCode 150",                           category: "DSA Sheets",      priority: 95  },
  { label: "NeetCode All",                           category: "DSA Sheets",      priority: 80  },
  { label: "Grind 75",                               category: "DSA Sheets",      priority: 90  },
  { label: "Blind 75",                               category: "DSA Sheets",      priority: 88  },
  { label: "Love Babbar 450",                        category: "DSA Sheets",      priority: 82  },
  { label: "Fraz SDE Sheet",                         category: "DSA Sheets",      priority: 70  },
  { label: "LeetCode Top Interview 150",             category: "DSA Sheets",      priority: 85  },
  { label: "LeetCode Premium",                       category: "DSA Sheets",      priority: 75  },
  { label: "LeetCode Daily Challenges",              category: "DSA Sheets",      priority: 72  },
  { label: "InterviewBit",                           category: "DSA Sheets",      priority: 68  },
  { label: "GFG Practice",                           category: "DSA Sheets",      priority: 65  },

  // System Design
  { label: "Alex Xu Vol 1 (System Design Interview)", category: "System Design",  priority: 95  },
  { label: "Alex Xu Vol 2",                           category: "System Design",  priority: 90  },
  { label: "Grokking the System Design Interview",    category: "System Design",  priority: 92  },
  { label: "DDIA (Kleppmann)",                        category: "System Design",  priority: 88  },
  { label: "System Design Primer (GitHub)",           category: "System Design",  priority: 85  },
  { label: "ByteByteGo",                              category: "System Design",  priority: 80  },
  { label: "Gaurav Sen (YouTube)",                    category: "System Design",  priority: 78  },
  { label: "Codemia.io",                              category: "System Design",  priority: 65  },
  { label: "Exponent (System Design)",                category: "System Design",  priority: 70  },

  // CS Fundamentals
  { label: "Gate Smashers (YouTube)",     category: "CS Fundamentals", priority: 78 },
  { label: "GFG Articles",               category: "CS Fundamentals", priority: 75 },
  { label: "Operating Systems (Galvin)", category: "CS Fundamentals", priority: 72 },
  { label: "DBMS (Navathe)",             category: "CS Fundamentals", priority: 70 },
  { label: "Computer Networks (Kurose)", category: "CS Fundamentals", priority: 68 },
  { label: "OOP Concepts Practice",      category: "CS Fundamentals", priority: 74 },

  // Behavioral & Mock
  { label: "Amazon Leadership Principles",  category: "Behavioral & Mock", priority: 85 },
  { label: "STAR Method Practice",          category: "Behavioral & Mock", priority: 80 },
  { label: "Pramp Mock Interviews",         category: "Behavioral & Mock", priority: 75 },
  { label: "Exponent Mock Interviews",      category: "Behavioral & Mock", priority: 72 },
  { label: "interviewing.io",              category: "Behavioral & Mock", priority: 70 },

  // Competitive Programming
  { label: "Codeforces",               category: "Competitive",  priority: 70 },
  { label: "CodeChef",                 category: "Competitive",  priority: 68 },
  { label: "AtCoder",                  category: "Competitive",  priority: 65 },
  { label: "TLE Eliminators",          category: "Competitive",  priority: 72 },
  { label: "CP Handbook (Laaksonen)",  category: "Competitive",  priority: 60 },

  // Design / LLD
  { label: "LLD Practice (Parking Lot, Splitwise)",  category: "Design",   priority: 78 },
  { label: "Design Patterns (Head First)",            category: "Design",   priority: 72 },
  { label: "Clean Code (Robert C. Martin)",           category: "Design",   priority: 70 },
  { label: "SOLID Principles Practice",               category: "Design",   priority: 68 },
  { label: "Atlassian's 5 Values",                    category: "Design",   priority: 55 },
];

// ─── Round Types ─────────────────────────────────────────────────────────────

export const ROUND_TYPE_SUGGESTIONS = [
  { label: "Online Assessment (OA)",  priority: 100 },
  { label: "Technical",               priority: 95  },
  { label: "Machine Coding",          priority: 85  },
  { label: "System Design (HLD)",     priority: 82  },
  { label: "Low-Level Design (LLD)",  priority: 80  },
  { label: "Managerial / HM",         priority: 78  },
  { label: "Bar Raiser",              priority: 75  },
  { label: "Phone Screen",            priority: 72  },
  { label: "HR",                      priority: 70  },
  { label: "Pair Programming",        priority: 68  },
  { label: "Culture Fit / Values",    priority: 65  },
  { label: "Group Discussion",        priority: 60  },
  { label: "Case Study",              priority: 58  },
  { label: "Take-Home Assignment",    priority: 55  },
  { label: "Recruiter Screen",        priority: 50  },
];

// ─── Duration Suggestions ────────────────────────────────────────────────────

export const DURATION_SUGGESTIONS = [
  { label: "15 min",    priority: 40  },
  { label: "30 min",    priority: 70  },
  { label: "45 min",    priority: 90  },
  { label: "60 min",    priority: 100 },
  { label: "90 min",    priority: 80  },
  { label: "2 hours",   priority: 50  },
  { label: "2+ hours",  priority: 30  },
];

// ─── DSA & Technical Topic Tags ──────────────────────────────────────────────

export const TOPIC_SUGGESTIONS = [
  // DSA — sorted by interview frequency
  { label: "Arrays",                    category: "DSA",          priority: 100 },
  { label: "Strings",                   category: "DSA",          priority: 98  },
  { label: "Hash Maps",                 category: "DSA",          priority: 95  },
  { label: "Trees",                     category: "DSA",          priority: 93  },
  { label: "Graphs",                    category: "DSA",          priority: 90  },
  { label: "Dynamic Programming",       category: "DSA",          priority: 88  },
  { label: "BFS/DFS",                   category: "DSA",          priority: 85  },
  { label: "Binary Search",             category: "DSA",          priority: 85  },
  { label: "Two Pointers",              category: "DSA",          priority: 83  },
  { label: "Sliding Window",            category: "DSA",          priority: 80  },
  { label: "Linked Lists",              category: "DSA",          priority: 78  },
  { label: "Stacks/Queues",             category: "DSA",          priority: 76  },
  { label: "Recursion",                 category: "DSA",          priority: 74  },
  { label: "Backtracking",              category: "DSA",          priority: 72  },
  { label: "Greedy",                    category: "DSA",          priority: 70  },
  { label: "Heap/Priority Queue",       category: "DSA",          priority: 68  },
  { label: "Prefix Sum",                category: "DSA",          priority: 65  },
  { label: "Sorting Algorithms",        category: "DSA",          priority: 65  },
  { label: "Tries",                     category: "DSA",          priority: 60  },
  { label: "Bit Manipulation",          category: "DSA",          priority: 55  },
  { label: "Union-Find",                category: "DSA",          priority: 52  },
  { label: "Segment Trees",             category: "DSA",          priority: 45  },
  { label: "Math/Number Theory",        category: "DSA",          priority: 50  },

  // System Design
  { label: "System Design (HLD)",       category: "System Design", priority: 90 },
  { label: "Low-Level Design (LLD)",    category: "System Design", priority: 85 },
  { label: "Scalability",               category: "System Design", priority: 80 },
  { label: "Database Design",           category: "System Design", priority: 78 },
  { label: "API Design",                category: "System Design", priority: 76 },
  { label: "Caching",                   category: "System Design", priority: 74 },
  { label: "Load Balancing",            category: "System Design", priority: 70 },
  { label: "Message Queues",            category: "System Design", priority: 68 },
  { label: "Microservices",             category: "System Design", priority: 65 },
  { label: "Rate Limiting",             category: "System Design", priority: 60 },
  { label: "Consistent Hashing",        category: "System Design", priority: 55 },

  // CS Core
  { label: "OOP/OOAD",                  category: "CS Core",       priority: 85 },
  { label: "DBMS/SQL",                  category: "CS Core",       priority: 85 },
  { label: "OS Concepts",               category: "CS Core",       priority: 80 },
  { label: "Computer Networks",         category: "CS Core",       priority: 72 },
  { label: "Machine Coding",            category: "CS Core",       priority: 78 },
  { label: "Clean Code / Testing",      category: "CS Core",       priority: 62 },
  { label: "SQL Queries",               category: "CS Core",       priority: 72 },

  // Behavioral
  { label: "Leadership Principles",     category: "Behavioral",    priority: 85 },
  { label: "Project Deep-Dive",         category: "Behavioral",    priority: 80 },
  { label: "Conflict Resolution",       category: "Behavioral",    priority: 70 },
  { label: "Why This Company?",         category: "Behavioral",    priority: 65 },
  { label: "Behavioral (STAR)",         category: "Behavioral",    priority: 75 },
  { label: "Culture Fit",               category: "Behavioral",    priority: 60 },

  // Other
  { label: "Puzzles / Estimation",      category: "Other",         priority: 55 },
  { label: "Code Review",               category: "Other",         priority: 50 },
  { label: "Math/Probability",          category: "Other",         priority: 58 },
];

// ─── Advice Tips ─────────────────────────────────────────────────────────────

export const ADVICE_SUGGESTIONS = [
  { label: "Think out loud during coding",                priority: 100 },
  { label: "Clarify requirements before jumping in",      priority: 95  },
  { label: "Explain approach before writing any code",    priority: 92  },
  { label: "Focus on fundamentals over quantity",         priority: 90  },
  { label: "Stay calm if you get stuck",                  priority: 88  },
  { label: "Communicate trade-offs explicitly",           priority: 85  },
  { label: "Study the company's specific interview style",priority: 85  },
  { label: "Ask good questions at the end",               priority: 82  },
  { label: "Prepare 2-3 STAR stories per LP (Amazon)",    priority: 80  },
  { label: "Brush up OS/DBMS/CN fundamentals",            priority: 78  },
  { label: "Write clean, production-quality code",        priority: 76  },
  { label: "Do at least 5 mock interviews",               priority: 74  },
  { label: "Don't memorize — understand patterns",        priority: 72  },
  { label: "Time-box each section of the problem",        priority: 65  },
  { label: "Practice on paper/whiteboard",                priority: 60  },
  { label: "Don't lie about what you don't know",         priority: 58  },
  { label: "Practice coding without IDE autocomplete",    priority: 55  },
  { label: "Read the JD carefully and match keywords",    priority: 68  },
];

// ─── Prep Duration ───────────────────────────────────────────────────────────

export const PREP_DURATION_SUGGESTIONS = [
  { label: "< 1 week"     },
  { label: "1-2 weeks"    },
  { label: "1 month"      },
  { label: "2-3 months"   },
  { label: "3-6 months"   },
  { label: "6+ months"    },
];

// ─── Application Source ──────────────────────────────────────────────────────

export const APPLICATION_SOURCE_SUGGESTIONS = [
  { label: "On-Campus Placement"     },
  { label: "Employee Referral"       },
  { label: "LinkedIn"                },
  { label: "Company Career Page"     },
  { label: "Recruiter Reached Out"   },
  { label: "Naukri / Indeed"         },
  { label: "AngelList / Wellfound"   },
  { label: "Internship PPO"          },
  { label: "College Placement Cell"  },
  { label: "Hackathon → Hire"        },
];

// ─── Overall Experience Feel ─────────────────────────────────────────────────

export const OVERALL_FEEL_SUGGESTIONS = [
  { label: "Straightforward"  },
  { label: "Fair"             },
  { label: "Intense"          },
  { label: "Exhausting"       },
  { label: "Fun"              },
  { label: "Frustrating"      },
  { label: "Well-organized"   },
  { label: "Chaotic"          },
  { label: "Respectful"       },
  { label: "Dehumanizing"     },
];

// ─── Utility: Fuzzy Match ────────────────────────────────────────────────────

export function fuzzyMatch(query, text) {
  if (!query) return { match: true, score: 0 };
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();

  if (t.startsWith(q)) return { match: true, score: 100 };
  if (t.includes(q)) return { match: true, score: 80 };

  // Acronym: "dp" matches "Dynamic Programming"
  const acronym = text.split(/[\s\/\-\(\)]+/).map(w => w[0] || '').join('').toLowerCase();
  if (acronym.startsWith(q)) return { match: true, score: 90 };
  if (acronym.includes(q)) return { match: true, score: 70 };

  // Character subsequence
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  if (qi === q.length) return { match: true, score: 50 };

  return { match: false, score: 0 };
}

// ─── Utility: Reorder by priority + company context ──────────────────────────

export function reorderSuggestions(suggestions, priorityLabels = []) {
  const prioritySet = new Set(priorityLabels.map(l => l.toLowerCase()));
  return [...suggestions]
    .map(s => ({
      ...s,
      _boost: prioritySet.has(s.label.toLowerCase()) ? 50 : 0
    }))
    .sort((a, b) => ((b.priority || 0) + b._boost) - ((a.priority || 0) + a._boost));
}
