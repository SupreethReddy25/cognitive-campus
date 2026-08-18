/**
 * topicSkillMapper.js
 *
 * Maps free-text interview topics (from InterviewExperience.rounds.topics)
 * to the 12 BKT-tracked DSA skills in CognitiveCampus.
 *
 * This is the critical bridge between placement intelligence and adaptive learning.
 *
 * Topics that have no BKT equivalent (SQL, System Design, ML, etc.) are
 * classified as "untracked" and returned separately with a self-study note.
 *
 * @module topicSkillMapper
 */

/**
 * Maps normalized topic strings to BKT skill names.
 * Keys are lowercase.
 */
const TOPIC_TO_SKILL = {
  // Arrays
  'arrays': 'Arrays',
  'array': 'Arrays',
  'sliding window': 'Arrays',
  'two pointer': 'Arrays',
  'two pointers': 'Arrays',
  'prefix sum': 'Arrays',
  'kadane': 'Arrays',

  // Strings
  'strings': 'Strings',
  'string': 'Strings',
  'pattern matching': 'Strings',
  'palindrome': 'Strings',
  'anagram': 'Strings',

  // Hashing
  'hashing': 'Hashing',
  'hashmap': 'Hashing',
  'hash map': 'Hashing',
  'hashset': 'Hashing',
  'hash set': 'Hashing',
  'frequency count': 'Hashing',

  // Recursion / Backtracking
  'recursion': 'Recursion',
  'backtracking': 'Recursion',
  'memoization': 'Recursion',

  // Sorting
  'sorting': 'Sorting',
  'merge sort': 'Sorting',
  'quick sort': 'Sorting',
  'quicksort': 'Sorting',
  'heapsort': 'Sorting',
  'heap sort': 'Sorting',
  'comparators': 'Sorting',

  // Searching
  'searching': 'Searching',
  'binary search': 'Searching',
  'search': 'Searching',

  // Linked Lists
  'linked list': 'Linked Lists',
  'linked lists': 'Linked Lists',
  'linkedlist': 'Linked Lists',
  'doubly linked list': 'Linked Lists',

  // Stacks & Queues
  'stack': 'Stacks & Queues',
  'stacks': 'Stacks & Queues',
  'queue': 'Stacks & Queues',
  'queues': 'Stacks & Queues',
  'monotonic stack': 'Stacks & Queues',
  'deque': 'Stacks & Queues',

  // Trees
  'trees': 'Trees',
  'tree': 'Trees',
  'binary tree': 'Trees',
  'bst': 'Trees',
  'binary search tree': 'Trees',
  'heap': 'Trees',
  'priority queue': 'Trees',
  'trie': 'Trees',
  'segment tree': 'Trees',
  'avl': 'Trees',

  // Graphs
  'graphs': 'Graphs',
  'graph': 'Graphs',
  'bfs': 'Graphs',
  'dfs': 'Graphs',
  'dijkstra': 'Graphs',
  'shortest path': 'Graphs',
  'mst': 'Graphs',
  'minimum spanning tree': 'Graphs',
  'topological sort': 'Graphs',
  'union find': 'Graphs',
  'disjoint set': 'Graphs',

  // Dynamic Programming
  'dynamic programming': 'Dynamic Programming',
  'dp': 'Dynamic Programming',
  'lis': 'Dynamic Programming',
  'longest increasing subsequence': 'Dynamic Programming',
  'knapsack': 'Dynamic Programming',
  'edit distance': 'Dynamic Programming',
  'coin change': 'Dynamic Programming',

  // Greedy Algorithms
  'greedy': 'Greedy Algorithms',
  'greedy algorithms': 'Greedy Algorithms',
  'interval scheduling': 'Greedy Algorithms',
  'activity selection': 'Greedy Algorithms',
};

/**
 * Topics that are interview-relevant but NOT tracked by the BKT system.
 * These require self-study — CognitiveCampus cannot adapt for them yet.
 */
const UNTRACKED_SET = new Set([
  'sql', 'dbms', 'database', 'databases', 'mysql', 'postgresql', 'mongodb',
  'os', 'operating systems', 'operating system', 'process management', 'memory management',
  'networking', 'network', 'tcp/ip', 'http', 'dns',
  'oops', 'oop', 'object oriented', 'object-oriented', 'design patterns',
  'system design', 'hld', 'lld', 'high level design', 'low level design',
  'machine learning', 'ml', 'deep learning', 'neural networks', 'statistics',
  'probability', 'linear algebra', 'calculus',
  'python', 'java', 'c++', 'javascript', 'golang', 'rust',
  'leadership principles', 'behavioral', 'hr', 'soft skills',
  'data analytics', 'tableau', 'power bi', 'excel',
  'spark', 'hadoop', 'kafka', 'redis', 'elasticsearch',
  'aws', 'gcp', 'azure', 'devops', 'ci/cd', 'docker', 'kubernetes',
]);

/**
 * Maps a single free-text topic to either a tracked BKT skill or untracked category.
 *
 * @param {string} topic - Raw topic string from an interview experience
 * @returns {{ tracked: true, skillName: string } | { tracked: false, topic: string }}
 */
function mapTopicToSkill(topic) {
  if (!topic || typeof topic !== 'string') return { tracked: false, topic: topic || '' };

  const normalized = topic.toLowerCase().trim();

  // Exact match
  if (TOPIC_TO_SKILL[normalized]) {
    return { tracked: true, skillName: TOPIC_TO_SKILL[normalized] };
  }

  // Substring match — e.g. "DP/LIS" contains "dp"
  for (const [key, skillName] of Object.entries(TOPIC_TO_SKILL)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { tracked: true, skillName };
    }
  }

  // Untracked
  return { tracked: false, topic };
}

/**
 * Maps an array of topics and returns two partitioned lists.
 *
 * @param {string[]} topics
 * @returns {{ tracked: Map<string,string>, untracked: string[] }}
 *   tracked: Map of topic → skillName
 *   untracked: list of topics with no BKT equivalent
 */
function mapTopics(topics) {
  const tracked = new Map(); // topic → skillName
  const untracked = [];

  for (const topic of topics) {
    const result = mapTopicToSkill(topic);
    if (result.tracked) {
      tracked.set(topic, result.skillName);
    } else {
      untracked.push(topic);
    }
  }

  return { tracked, untracked };
}

module.exports = { mapTopicToSkill, mapTopics, TOPIC_TO_SKILL, UNTRACKED_SET };
