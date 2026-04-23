/**
 * Cognitive Campus — shared user + analytics data.
 * All values are deterministic mocks for the IDE-style dashboard.
 */

export const user = {
  name: "SUPREETH",
  fullName: "Supreeth Reddy",
  handle: "supreeth.r",
  initials: "SR",
  level: 27,
  tier: "ADEPT",
  xp: 24810,
  xpToNext: 30000,
  streak: 42,
  streakBest: 54,
  mastered: 186,
  totalProblems: 412,
  joined: "2024.03",
  location: "Hyderabad · IN",
  bio: "Distributed systems engineer focused on graph algorithms, adversarial invariants, and concurrent data structures. Deep work over busywork.",
  links: [{
    label: "github · /supreeth",
    href: "#"
  }, {
    label: "supreeth.dev",
    href: "#"
  }, {
    label: "arxiv · 2403.12344",
    href: "#"
  }]
};
export const heroMetrics = [{
  label: "TOTAL XP",
  value: "24,810",
  unit: "",
  delta: "+1,240",
  deltaLabel: "7D",
  deltaTone: "up",
  index: "01"
}, {
  label: "LEVEL",
  value: "27",
  unit: "/ 40",
  delta: "+1",
  deltaLabel: "THIS WEEK",
  deltaTone: "up",
  index: "02"
}, {
  label: "STREAK",
  value: "42",
  unit: "DAYS",
  delta: "BEST 54",
  deltaLabel: "ALL-TIME",
  deltaTone: "neutral",
  index: "03"
}, {
  label: "MASTERED",
  value: "186",
  unit: "/ 412",
  delta: "45.1%",
  deltaLabel: "COVERAGE",
  deltaTone: "up",
  index: "04"
}];
export const skills = [{
  key: "ARRAYS",
  score: 92
}, {
  key: "TREES",
  score: 84
}, {
  key: "GRAPHS",
  score: 76
}, {
  key: "DP",
  score: 68
}, {
  key: "STRINGS",
  score: 82
}, {
  key: "MATH",
  score: 71
}];

// 30-day XP series — deterministic pseudo-random
export const xpSeries = (() => {
  const base = [280, 310, 420, 180, 510, 620, 440, 390, 460, 510, 720, 380, 600, 540, 480, 610, 750, 830, 520, 440, 690, 810, 920, 640, 710, 880, 760, 540, 820, 910];
  return base;
})();
export const recommended = [{
  id: "CC-441",
  title: "Minimum Window Substring",
  pattern: "TWO POINTERS · SLIDING WINDOW",
  difficulty: "Hard",
  xp: 520,
  accuracy: 38,
  tags: ["STRINGS", "HASH"],
  bktGap: 0.28
}, {
  id: "CC-318",
  title: "Course Schedule III",
  pattern: "GREEDY · HEAP",
  difficulty: "Hard",
  xp: 480,
  accuracy: 41,
  tags: ["GREEDY", "HEAP"],
  bktGap: 0.22
}, {
  id: "CC-207",
  title: "LRU Cache",
  pattern: "HASH + DOUBLY LINKED LIST",
  difficulty: "Medium",
  xp: 320,
  accuracy: 54,
  tags: ["DESIGN", "HASH"],
  bktGap: 0.18
}, {
  id: "CC-684",
  title: "Redundant Connection",
  pattern: "UNION FIND",
  difficulty: "Medium",
  xp: 340,
  accuracy: 59,
  tags: ["GRAPH", "DSU"],
  bktGap: 0.15
}, {
  id: "CC-124",
  title: "Binary Tree Maximum Path Sum",
  pattern: "POST-ORDER DFS",
  difficulty: "Hard",
  xp: 510,
  accuracy: 36,
  tags: ["TREE", "DFS"],
  bktGap: 0.31
}];
export const leaderboard = [{
  rank: 1,
  handle: "anastasia.k",
  name: "Anastasia Kowalski",
  mastery: 98.4,
  percentile: 99.99,
  streak: 312,
  solved: 1842,
  level: 52,
  tier: "LEGEND",
  country: "PL"
}, {
  rank: 2,
  handle: "hiroshi.t",
  name: "Hiroshi Tanaka",
  mastery: 97.9,
  percentile: 99.98,
  streak: 201,
  solved: 1720,
  level: 49,
  tier: "LEGEND",
  country: "JP"
}, {
  rank: 3,
  handle: "isabelle.r",
  name: "Isabelle Rousseau",
  mastery: 97.1,
  percentile: 99.96,
  streak: 188,
  solved: 1611,
  level: 47,
  tier: "LEGEND",
  country: "FR"
}, {
  rank: 4,
  handle: "dmitri.v",
  name: "Dmitri Volkov",
  mastery: 95.6,
  percentile: 99.92,
  streak: 142,
  solved: 1488,
  level: 45,
  tier: "ARCHON",
  country: "RU"
}, {
  rank: 5,
  handle: "aarav.p",
  name: "Aarav Patel",
  mastery: 94.8,
  percentile: 99.88,
  streak: 120,
  solved: 1402,
  level: 44,
  tier: "ARCHON",
  country: "IN"
}, {
  rank: 6,
  handle: "chen.w",
  name: "Chen Wei",
  mastery: 93.7,
  percentile: 99.81,
  streak: 98,
  solved: 1310,
  level: 42,
  tier: "ARCHON",
  country: "CN"
}, {
  rank: 7,
  handle: "sofia.m",
  name: "Sofia Moretti",
  mastery: 92.3,
  percentile: 99.72,
  streak: 76,
  solved: 1244,
  level: 41,
  tier: "ARCHON",
  country: "IT"
}, {
  rank: 8,
  handle: "takeshi.i",
  name: "Takeshi Ito",
  mastery: 91.4,
  percentile: 99.64,
  streak: 64,
  solved: 1188,
  level: 40,
  tier: "ARCHON",
  country: "JP"
}, {
  rank: 9,
  handle: "lena.b",
  name: "Lena Björk",
  mastery: 90.1,
  percentile: 99.52,
  streak: 82,
  solved: 1102,
  level: 38,
  tier: "ADEPT",
  country: "SE"
}, {
  rank: 10,
  handle: "raphael.d",
  name: "Raphael DaSilva",
  mastery: 88.7,
  percentile: 99.38,
  streak: 50,
  solved: 1028,
  level: 37,
  tier: "ADEPT",
  country: "BR"
}, {
  rank: 11,
  handle: "noor.a",
  name: "Noor Al-Sayed",
  mastery: 87.2,
  percentile: 99.18,
  streak: 44,
  solved: 980,
  level: 36,
  tier: "ADEPT",
  country: "AE"
}, {
  rank: 12,
  handle: "kai.n",
  name: "Kai Nakamura",
  mastery: 86.0,
  percentile: 98.97,
  streak: 36,
  solved: 922,
  level: 35,
  tier: "ADEPT",
  country: "JP"
}, {
  rank: 13,
  handle: "olga.k",
  name: "Olga Karpenko",
  mastery: 84.9,
  percentile: 98.74,
  streak: 29,
  solved: 874,
  level: 34,
  tier: "ADEPT",
  country: "UA"
}, {
  rank: 14,
  handle: "marco.f",
  name: "Marco Ferreira",
  mastery: 83.6,
  percentile: 98.41,
  streak: 22,
  solved: 812,
  level: 33,
  tier: "ADEPT",
  country: "PT"
}, {
  rank: 15,
  handle: "zara.h",
  name: "Zara Hussain",
  mastery: 82.2,
  percentile: 98.02,
  streak: 18,
  solved: 766,
  level: 32,
  tier: "ADEPT",
  country: "PK"
}, {
  rank: 16,
  handle: "elias.w",
  name: "Elias Weiss",
  mastery: 80.8,
  percentile: 97.55,
  streak: 14,
  solved: 712,
  level: 31,
  tier: "ADEPT",
  country: "DE"
}, {
  rank: 17,
  handle: "supreeth.r",
  name: "Supreeth Reddy",
  mastery: 79.4,
  percentile: 96.91,
  streak: 42,
  solved: 186,
  level: 27,
  tier: "ADEPT",
  isYou: true,
  country: "IN"
}, {
  rank: 18,
  handle: "nadia.p",
  name: "Nadia Petrova",
  mastery: 77.9,
  percentile: 96.12,
  streak: 10,
  solved: 624,
  level: 29,
  tier: "APPRENTICE",
  country: "BG"
}, {
  rank: 19,
  handle: "jun.s",
  name: "Jun Suzuki",
  mastery: 76.3,
  percentile: 95.11,
  streak: 7,
  solved: 588,
  level: 28,
  tier: "APPRENTICE",
  country: "JP"
}, {
  rank: 20,
  handle: "maya.r",
  name: "Maya Rao",
  mastery: 74.8,
  percentile: 93.84,
  streak: 5,
  solved: 542,
  level: 27,
  tier: "APPRENTICE",
  country: "IN"
}];

// Heatmap: 52 weeks × 7 days, intensity 0..4. Deterministic.
export const heatmap = (() => {
  const cells = [];
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 52 * 7; i++) {
    const r = rnd();
    // last quarter gets denser to imply recent activity
    const boost = i > 52 * 7 - 80 ? 0.25 : 0;
    const v = r + boost;
    if (v < 0.45) cells.push(0);else if (v < 0.7) cells.push(1);else if (v < 0.85) cells.push(2);else if (v < 0.95) cells.push(3);else cells.push(4);
  }
  return cells;
})();
export const recentSolves = [{
  id: "CC-212",
  title: "Word Search II",
  difficulty: "Hard",
  pattern: "TRIE · BACKTRACK",
  date: "2 D AGO",
  runtime: "96 ms",
  percentile: 94.1
}, {
  id: "CC-297",
  title: "Serialize and Deserialize Binary Tree",
  difficulty: "Hard",
  pattern: "BFS · DESIGN",
  date: "3 D AGO",
  runtime: "48 ms",
  percentile: 88.7
}, {
  id: "CC-332",
  title: "Reconstruct Itinerary",
  difficulty: "Hard",
  pattern: "EULERIAN PATH · DFS",
  date: "5 D AGO",
  runtime: "64 ms",
  percentile: 82.4
}, {
  id: "CC-1568",
  title: "Minimum Number of Days to Disconnect Island",
  difficulty: "Hard",
  pattern: "GRAPH · TARJAN",
  date: "8 D AGO",
  runtime: "212 ms",
  percentile: 76.9
}, {
  id: "CC-839",
  title: "Similar String Groups",
  difficulty: "Hard",
  pattern: "UNION FIND",
  date: "11 D AGO",
  runtime: "88 ms",
  percentile: 71.0
}, {
  id: "CC-847",
  title: "Shortest Path Visiting All Nodes",
  difficulty: "Hard",
  pattern: "BITMASK · BFS",
  date: "14 D AGO",
  runtime: "124 ms",
  percentile: 80.2
}];
export const activity = {
  solves: 186,
  perWeekAvg: 11.4,
  bestStreak: 54,
  currentStreak: 42,
  acceptanceRate: 71.8,
  avgRuntimeMs: 72,
  totalHours: 487,
  contestsRated: 28
};