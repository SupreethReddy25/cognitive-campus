/**
 * Problem catalogue — merges the original seed problems, the extended set and the new problems into
 * one normalised list with starter code for every supported language, company tags, editorials,
 * and the right answer-checker per problem.
 *
 * Pure data + builders: no database access (masterSeed.js persists it, verifyProblems.js tests it).
 */

const { getProblemsBySkill } = require('../problemSeed');
const { EXTRA_PROBLEMS } = require('../problemSeedExtended');
const starterCodeMaps = require('../starterCodeMaps');
const editorialsA = require('./editorialsA');
const editorialsB = require('./editorialsB');
const { EDITORIALS: editorialsC, JS_TREE_HELPER, PY_TREE_HELPER } = require('./editorialsC');
const extra = require('./problemsExtra');

// ─── metadata for the original problems ──────────────────────────────────────
const META = {
  'Two Sum': { c: ['Amazon', 'Google', 'Microsoft', 'Facebook', 'Apple', 'Adobe', 'Goldman Sachs', 'Flipkart'], f: 99, t: ['Hash Map', 'Array'] },
  'Maximum Subarray': { c: ['Amazon', 'Microsoft', 'Apple', 'Google', 'JP Morgan'], f: 89, t: ['Kadane', 'DP', 'Array'] },
  'Trapping Rain Water': { c: ['Amazon', 'Google', 'Goldman Sachs', 'Microsoft', 'Facebook', 'Flipkart'], f: 94, t: ['Two Pointers', 'Stack'] },
  'Valid Anagram': { c: ['Amazon', 'Microsoft', 'Apple', 'Adobe'], f: 70, t: ['Hash Map', 'String'] },
  'Longest Substring Without Repeating Characters': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber', 'Adobe', 'Salesforce'], f: 97, t: ['Sliding Window', 'Hash Map'] },
  'Minimum Window Substring': { c: ['Facebook', 'Amazon', 'Google', 'Uber', 'Microsoft', 'Atlassian'], f: 85, t: ['Sliding Window', 'Hash Map'] },
  'Contains Duplicate': { c: ['Amazon', 'Microsoft', 'Apple', 'Adobe'], f: 60, t: ['Hash Set', 'Array'] },
  'Group Anagrams': { c: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Uber', 'Goldman Sachs'], f: 88, t: ['Hash Map', 'String', 'Sorting'] },
  'Longest Consecutive Sequence': { c: ['Google', 'Amazon', 'Facebook', 'Microsoft', 'Oracle'], f: 80, t: ['Hash Set', 'Array'] },
  'Power of Three': { c: ['Amazon', 'Microsoft'], f: 40, t: ['Math', 'Recursion'] },
  'Generate Parentheses': { c: ['Google', 'Amazon', 'Facebook', 'Microsoft', 'Uber', 'Adobe'], f: 90, t: ['Backtracking'] },
  'N-Queens': { c: ['Google', 'Amazon', 'Microsoft', 'Goldman Sachs'], f: 66, t: ['Backtracking'] },
  'Sort Colors': { c: ['Microsoft', 'Amazon', 'Facebook', 'Apple', 'Adobe'], f: 75, t: ['Two Pointers', 'Sorting'] },
  'Merge Intervals': { c: ['Google', 'Facebook', 'Amazon', 'Microsoft', 'Uber', 'Bloomberg', 'Salesforce', 'Adobe'], f: 96, t: ['Sorting', 'Intervals'] },
  'Kth Largest Element in an Array': { c: ['Facebook', 'Amazon', 'Google', 'Microsoft', 'Uber', 'Apple'], f: 86, t: ['Heap', 'Quickselect'] },
  'Binary Search': { c: ['Amazon', 'Microsoft', 'Apple', 'Google'], f: 68, t: ['Binary Search'] },
  'Search in Rotated Sorted Array': { c: ['Facebook', 'Amazon', 'Google', 'Microsoft', 'Uber', 'Apple'], f: 95, t: ['Binary Search'] },
  'Median of Two Sorted Arrays': { c: ['Google', 'Amazon', 'Microsoft', 'Goldman Sachs', 'Apple', 'Adobe'], f: 87, t: ['Binary Search', 'Divide and Conquer'] },
  'Reverse Linked List': { c: ['Amazon', 'Microsoft', 'Facebook', 'Apple', 'Adobe', 'Flipkart'], f: 92, t: ['Linked List', 'Two Pointers'] },
  'Linked List Cycle Detection': { c: ['Amazon', 'Microsoft', 'Apple', 'Adobe', 'Oracle'], f: 83, t: ['Linked List', 'Fast/Slow Pointers'] },
  'Merge k Sorted Lists': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber', 'Airbnb', 'Salesforce'], f: 91, t: ['Heap', 'Linked List', 'Divide and Conquer'] },
  'Valid Parentheses': { c: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Bloomberg', 'JP Morgan', 'Goldman Sachs'], f: 98, t: ['Stack', 'String'] },
  'Daily Temperatures': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Salesforce'], f: 77, t: ['Monotonic Stack'] },
  'Largest Rectangle in Histogram': { c: ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Adobe', 'Uber'], f: 82, t: ['Monotonic Stack'] },
  'Maximum Depth of Binary Tree': { c: ['Amazon', 'Microsoft', 'Apple', 'Google', 'Adobe'], f: 85, t: ['DFS', 'Tree'] },
  'Validate Binary Search Tree': { c: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'Apple', 'Bloomberg'], f: 91, t: ['DFS', 'BST'] },
  'Number of Islands': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber', 'Flipkart', 'Salesforce'], f: 97, t: ['DFS', 'BFS', 'Matrix'] },
  'Course Schedule': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber', 'Flipkart'], f: 92, t: ['Topological Sort', 'Graph'] },
  'Word Ladder': { c: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Uber', 'Airbnb'], f: 86, t: ['BFS', 'Graph'] },
  'Climbing Stairs': { c: ['Amazon', 'Microsoft', 'Google', 'Apple', 'Adobe', 'Goldman Sachs'], f: 95, t: ['DP', 'Fibonacci'] },
  'Longest Increasing Subsequence': { c: ['Amazon', 'Google', 'Microsoft', 'Facebook', 'Uber', 'Oracle'], f: 89, t: ['DP', 'Binary Search'] },
  'Edit Distance': { c: ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Uber', 'Adobe'], f: 82, t: ['DP', 'String'] },
  'Best Time to Buy and Sell Stock': { c: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'Goldman Sachs', 'Morgan Stanley', 'Bloomberg', 'JP Morgan'], f: 98, t: ['Greedy', 'Array'] },
  'Jump Game': { c: ['Amazon', 'Google', 'Microsoft', 'Facebook', 'Adobe', 'Flipkart'], f: 88, t: ['Greedy'] },
  'Minimum Number of Platforms': { c: ['Amazon', 'Flipkart', 'Microsoft', 'Goldman Sachs', 'Morgan Stanley', 'Walmart Labs', 'Oracle'], f: 72, t: ['Greedy', 'Sorting', 'Intervals'] },
  'Product of Array Except Self': { c: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'Apple', 'Adobe', 'Uber', 'Flipkart'], f: 94, t: ['Prefix Sum', 'Array'] },
  'Container With Most Water': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Goldman Sachs', 'Adobe'], f: 90, t: ['Two Pointers'] },
  '3Sum': { c: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'Apple', 'Adobe', 'Bloomberg'], f: 96, t: ['Two Pointers', 'Sorting'] },
  'Longest Palindromic Substring': { c: ['Amazon', 'Microsoft', 'Google', 'Facebook', 'Adobe', 'Oracle'], f: 93, t: ['DP', 'Two Pointers', 'String'] },
  'Binary Tree Maximum Path Sum': { c: ['Facebook', 'Google', 'Amazon', 'Microsoft', 'Uber'], f: 78, t: ['DFS', 'Tree', 'DP'] },
  'Kth Smallest Element in BST': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber'], f: 80, t: ['BST', 'Inorder'] },
  'Pacific Atlantic Water Flow': { c: ['Google', 'Amazon', 'Microsoft', 'Facebook'], f: 65, t: ['DFS', 'BFS', 'Matrix'] },
  'Coin Change': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber', 'Goldman Sachs', 'Flipkart', 'Razorpay'], f: 96, t: ['DP'] },
  'Partition Equal Subset Sum': { c: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Goldman Sachs'], f: 84, t: ['DP', 'Knapsack'] },
  'Find Minimum in Rotated Sorted Array': { c: ['Amazon', 'Microsoft', 'Facebook', 'Apple', 'Google'], f: 81, t: ['Binary Search'] },
  'Subsets': { c: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'Apple', 'Adobe'], f: 87, t: ['Backtracking', 'Bit Manipulation'] },
  'Combination Sum': { c: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Uber', 'Airbnb'], f: 89, t: ['Backtracking'] },
  'Word Search': { c: ['Amazon', 'Microsoft', 'Facebook', 'Google', 'Bloomberg', 'Uber'], f: 85, t: ['Backtracking', 'Matrix'] }
};

const DROP = new Set(['LRU Cache', 'Encode and Decode Strings', 'Serialize and Deserialize Binary Tree']);
const SKILL_ALIAS = { 'Binary Search': 'Searching', Backtracking: 'Recursion' };
const TREE_TITLES = new Set(['Maximum Depth of Binary Tree', 'Validate Binary Search Tree', 'Binary Tree Maximum Path Sum', 'Kth Smallest Element in BST']);
const JS_PY_ONLY_OLD = new Set([...TREE_TITLES]);

// problems whose valid output is not unique / order-sensitive
// corrections to bugs found by verifyProblems.js in the original seed data
const TEST_FIXES = {
  'Minimum Number of Platforms': { '[100,200]\n[150,250]': '1' } // trains 100-150 and 200-250 never overlap
};

const CHECKERS = {
  'Group Anagrams': 'unordered', 'Generate Parentheses': 'unordered', 'N-Queens': 'unordered', '3Sum': 'unordered',
  Subsets: 'unordered', 'Combination Sum': 'unordered', 'Pacific Atlantic Water Flow': 'unordered',
  'Median of Two Sorted Arrays': 'numeric'
};
const ALTERNATIVES = { 'Longest Palindromic Substring': { babad: ['aba'] } };

// signatures for the extended problems that ship only a JS starter
const EXT_SIGS = {
  'Product of Array Except Self': { name: 'productExceptSelf', params: [['nums', 'int[]']], returns: 'int[]' },
  'Container With Most Water': { name: 'maxArea', params: [['height', 'int[]']], returns: 'int' },
  '3Sum': { name: 'threeSum', params: [['nums', 'int[]']], returns: 'int[][]' },
  'Longest Palindromic Substring': { name: 'longestPalindrome', params: [['s', 'String']], returns: 'String' },
  'Binary Tree Maximum Path Sum': { name: 'maxPathSum', params: [['root', 'int[]']], returns: 'int' },
  'Kth Smallest Element in BST': { name: 'kthSmallest', params: [['root', 'int[]'], ['k', 'int']], returns: 'int' },
  'Pacific Atlantic Water Flow': { name: 'pacificAtlantic', params: [['heights', 'int[][]']], returns: 'int[][]' },
  'Coin Change': { name: 'coinChange', params: [['coins', 'int[]'], ['amount', 'int']], returns: 'int' },
  'Partition Equal Subset Sum': { name: 'canPartition', params: [['nums', 'int[]']], returns: 'boolean' },
  'Find Minimum in Rotated Sorted Array': { name: 'findMin', params: [['nums', 'int[]']], returns: 'int' },
  Subsets: { name: 'subsets', params: [['nums', 'int[]']], returns: 'int[][]' },
  'Combination Sum': { name: 'combinationSum', params: [['candidates', 'int[]'], ['target', 'int']], returns: 'int[][]' },
  'Word Search': { name: 'exist', params: [['board', 'char[][]'], ['word', 'String']], returns: 'boolean' }
};

// ─── starter-code generation ────────────────────────────────────────────────

const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();

const JAVA_DEFAULT = { int: '0', boolean: 'false', String: '""', 'int[]': 'new int[]{}', 'int[][]': 'new int[][]{}', double: '0.0', 'String[]': 'new String[]{}', 'char[][]': 'new char[][]{}' };
const CPP_TYPE = { int: 'int', boolean: 'bool', String: 'string', 'int[]': 'vector<int>&', 'int[][]': 'vector<vector<int>>&', double: 'double', 'String[]': 'vector<string>&', 'char[][]': 'vector<vector<char>>&' };
const CPP_RET = { int: 'int', boolean: 'bool', String: 'string', 'int[]': 'vector<int>', 'int[][]': 'vector<vector<int>>', double: 'double', void: 'void', 'String[]': 'vector<string>' };
const CPP_DEFAULT = { int: '0', bool: 'false', string: '""', double: '0.0' };

const makeStarters = (sig, { jsPyOnly = false } = {}) => {
  const jsParams = sig.params.map(([n]) => n).join(', ');
  const js = `function ${sig.name}(${jsParams}) {\n  // Your code here${sig.returns === 'void' ? ' — modify the input in place' : ''}\n}`;
  const py = `def ${snake(sig.name)}(${sig.params.map(([n]) => snake(n)).join(', ')}):\n    # Your code here\n    pass`;
  const map = { javascript: js, python: py };
  if (!jsPyOnly) {
    const jParams = sig.params.map(([n, t]) => `${t} ${n}`).join(', ');
    const jRet = sig.returns;
    const jBody = jRet === 'void' ? '' : `\n        return ${JAVA_DEFAULT[jRet] || 'null'};`;
    map.java = `import java.util.*;\nclass Main {\n    public ${jRet} ${sig.name}(${jParams}) {\n        // Your code here${jBody}\n    }\n}`;
    const cParams = sig.params.map(([n, t]) => `${CPP_TYPE[t]} ${n}`).join(', ');
    const cRet = CPP_RET[sig.returns] || 'int';
    const cBody = cRet === 'void' ? '' : `\n        return ${CPP_DEFAULT[cRet] || '{}'};`;
    map.cpp = `#include <vector>\n#include <string>\nusing namespace std;\nclass Main {\npublic:\n    ${cRet} ${sig.name}(${cParams}) {\n        // Your code here${cBody}\n    }\n};`;
  }
  return map;
};

const withTreeHelpers = (map) => ({
  ...map,
  javascript: `${map.javascript}\n${JS_TREE_HELPER}`,
  python: `${map.python}\n${PY_TREE_HELPER}`
});

// ─── build ──────────────────────────────────────────────────────────────────

const allEditorials = { ...editorialsA, ...editorialsB, ...editorialsC };

const toEditorial = (ed) => ed && {
  intuition: ed.intuition,
  approach: ed.approach,
  steps: ed.steps,
  timeComplexity: ed.timeComplexity,
  spaceComplexity: ed.spaceComplexity,
  pitfalls: ed.pitfalls,
  code: { javascript: ed.js, python: ed.py }
};

const getCatalog = () => {
  const out = [];
  const seen = new Set();

  const pushOld = (skill, p, isExtended) => {
    if (DROP.has(p.title) || seen.has(p.title.toLowerCase())) return;
    seen.add(p.title.toLowerCase());
    const sig = EXT_SIGS[p.title];
    const jsPyOnly = JS_PY_ONLY_OLD.has(p.title);

    let starterMap;
    if (starterCodeMaps[p.title]) {
      starterMap = { ...starterCodeMaps[p.title] };
    } else if (sig) {
      starterMap = makeStarters(sig, { jsPyOnly });
      starterMap.javascript = p.starterCode || starterMap.javascript;
    } else {
      starterMap = { javascript: p.starterCode };
    }
    if (jsPyOnly) { delete starterMap.java; delete starterMap.cpp; }
    if (TREE_TITLES.has(p.title)) starterMap = withTreeHelpers(starterMap);

    const meta = META[p.title] || { c: [], f: 50, t: [] };
    const testCases = p.testCases.map((tc, i) => {
      const alt = ALTERNATIVES[p.title]?.[tc.input];
      const fixed = TEST_FIXES[p.title]?.[tc.input];
      return { input: tc.input, expectedOutput: fixed !== undefined ? fixed : tc.expectedOutput, isHidden: !!tc.isHidden, ...(alt ? { alternatives: alt } : {}) };
    });

    out.push({
      title: p.title,
      skill: SKILL_ALIAS[skill] || skill,
      difficulty: p.difficulty,
      description: p.description,
      constraints: p.constraints,
      starterCode: starterMap.javascript,
      starterCodeMap: starterMap,
      testCases,
      examples: p.examples || [],
      hints: p.hints || [],
      companies: meta.c,
      tags: meta.t,
      frequency: meta.f,
      checker: CHECKERS[p.title] || 'exact',
      editorial: toEditorial(allEditorials[p.title]),
      isExtended
    });
  };

  Object.entries(getProblemsBySkill()).forEach(([skill, list]) => list.forEach((p) => pushOld(skill, p, false)));
  Object.entries(EXTRA_PROBLEMS).forEach(([skill, list]) => list.forEach((p) => pushOld(skill, p, true)));

  extra.forEach((p) => {
    if (seen.has(p.title.toLowerCase())) return;
    seen.add(p.title.toLowerCase());
    const starters = makeStarters(p.sig, { jsPyOnly: !!p.jsPyOnly });
    const isTree = ['Diameter of Binary Tree', 'Binary Tree Level Order Traversal', 'Lowest Common Ancestor of a BST'].includes(p.title);
    const starterMap = isTree ? withTreeHelpers(starters) : starters;
    out.push({
      title: p.title,
      skill: p.skill,
      difficulty: p.difficulty,
      description: p.description,
      constraints: p.constraints,
      starterCode: starterMap.javascript,
      starterCodeMap: starterMap,
      testCases: p.tests,
      examples: p.examples,
      hints: p.hints,
      companies: p.companies,
      tags: p.tags,
      frequency: p.frequency,
      checker: p.checker || 'exact',
      editorial: toEditorial(p.editorial),
      isExtended: true
    });
  });

  return out;
};

module.exports = { getCatalog, makeStarters, snake };
