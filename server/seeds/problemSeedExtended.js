/**
 * Extended Problem Seed Script
 *
 * Seeds 60 additional DSA problems for placement prep.
 * Covers: Binary Search, Two Pointers, Sliding Window, Backtracking,
 *         Trie, Heap/Priority Queue, Math, Bit Manipulation,
 *         and more Graph/DP/Tree problems.
 *
 * Usage: node seeds/problemSeedExtended.js
 * Prerequisite: Run skillSeed.js first.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');

const EXTRA_PROBLEMS = {
  'Arrays': [
    {
      title: 'Product of Array Except Self',
      description: 'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all elements of `nums` except `nums[i]`. The algorithm must run in O(n) time and without using the division operator.',
      difficulty: 'medium',
      starterCode: 'function productExceptSelf(nums) {\n  // Your code here\n}',
      constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30',
      testCases: [
        { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]', isHidden: false },
        { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', isHidden: false },
        { input: '[2,3]', expectedOutput: '[3,2]', isHidden: true }
      ],
      examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'answer[0] = 2*3*4=24, answer[1]=1*3*4=12, etc.' }],
      hints: ['Compute prefix products left-to-right.', 'Then multiply by suffix products right-to-left in a second pass.', 'No extra array needed — use the output array.']
    },
    {
      title: 'Container With Most Water',
      description: 'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the i-th line are at (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container that contains the most water.',
      difficulty: 'medium',
      starterCode: 'function maxArea(height) {\n  // Your code here\n}',
      constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
      testCases: [
        { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isHidden: false },
        { input: '[1,1]', expectedOutput: '1', isHidden: false },
        { input: '[4,3,2,1,4]', expectedOutput: '16', isHidden: true }
      ],
      examples: [{ input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 and 8, height = min(8,7)*7 = 49.' }],
      hints: ['Use two pointers from both ends.', 'Move the pointer pointing to the shorter line inward.']
    },
    {
      title: '3Sum',
      description: 'Given an integer array `nums`, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.',
      difficulty: 'medium',
      starterCode: 'function threeSum(nums) {\n  // Your code here\n}',
      constraints: '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5',
      testCases: [
        { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]', isHidden: false },
        { input: '[0,1,1]', expectedOutput: '[]', isHidden: false },
        { input: '[0,0,0]', expectedOutput: '[[0,0,0]]', isHidden: true }
      ],
      examples: [{ input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'Two valid triplets found.' }],
      hints: ['Sort the array first.', 'Fix one element and use two-pointer on the rest.', 'Skip duplicate values to avoid duplicate triplets.']
    }
  ],

  'Strings': [
    {
      title: 'Group Anagrams',
      description: 'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
      difficulty: 'medium',
      starterCode: 'function groupAnagrams(strs) {\n  // Your code here\n}',
      constraints: '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100',
      testCases: [
        { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
        { input: '[""]', expectedOutput: '[[""]]', isHidden: false },
        { input: '["a"]', expectedOutput: '[["a"]]', isHidden: true }
      ],
      examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: 'Group by sorted string key.' }],
      hints: ['Use a hash map keyed by the sorted string.', 'All anagrams of a word will sort to the same string.']
    },
    {
      title: 'Longest Palindromic Substring',
      description: 'Given a string `s`, return the longest palindromic substring in `s`.',
      difficulty: 'medium',
      starterCode: 'function longestPalindrome(s) {\n  // Your code here\n}',
      constraints: '1 <= s.length <= 1000\ns consists of only digits and English letters.',
      testCases: [
        { input: 'babad', expectedOutput: 'bab', isHidden: false },
        { input: 'cbbd', expectedOutput: 'bb', isHidden: false },
        { input: 'a', expectedOutput: 'a', isHidden: true }
      ],
      examples: [{ input: 's = "babad"', output: '"bab"', explanation: '"aba" is also valid.' }],
      hints: ['Expand around center for each character and each pair of characters.', 'Try all centers and track the longest palindrome found.']
    },
    {
      title: 'Encode and Decode Strings',
      description: 'Design an algorithm to encode a list of strings to a single string. The encoded string is then sent over the network and is decoded back to the original list of strings. Implement encode(strs) and decode(str).',
      difficulty: 'medium',
      starterCode: 'function encode(strs) {\n  // Your code here\n}\n\nfunction decode(str) {\n  // Your code here\n}',
      constraints: '1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] contains any possible characters.',
      testCases: [
        { input: '["lint","code","love","you"]', expectedOutput: '["lint","code","love","you"]', isHidden: false },
        { input: '["we","say",":","yes"]', expectedOutput: '["we","say",":","yes"]', isHidden: true }
      ],
      examples: [{ input: 'strs = ["lint","code","love","you"]', output: '["lint","code","love","you"]', explanation: 'Encode then decode returns original list.' }],
      hints: ['Prefix each string with its length followed by a delimiter.', 'On decode, read the length first then slice that many chars.']
    }
  ],

  'Linked Lists': [
    {
      title: 'LRU Cache',
      description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement LRUCache class with get(key) and put(key, value) operations both in O(1) time.',
      difficulty: 'medium',
      starterCode: 'class LRUCache {\n  constructor(capacity) {\n    // Your code here\n  }\n  get(key) {\n    // Your code here\n  }\n  put(key, value) {\n    // Your code here\n  }\n}',
      constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5',
      testCases: [
        { input: '2\n["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', expectedOutput: '[null,null,null,1,null,-1,null,-1,3,4]', isHidden: false },
        { input: '1\n["LRUCache","put","put","get"]\n[[1],[1,1],[2,2],[1]]', expectedOutput: '[null,null,null,-1]', isHidden: true }
      ],
      examples: [{ input: 'capacity=2, operations as above', output: 'See test case', explanation: 'Evict least recently used when capacity exceeded.' }],
      hints: ['Use a HashMap + doubly linked list.', 'The HashMap provides O(1) access; the linked list tracks recency order.', 'Always add to front; evict from back.']
    },
    {
      title: 'Merge K Sorted Lists',
      description: 'You are given an array of `k` linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
      difficulty: 'hard',
      starterCode: 'function mergeKLists(lists) {\n  // Your code here\n}',
      constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j].val <= 10^4',
      testCases: [
        { input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: false },
        { input: '[[]]', expectedOutput: '[]', isHidden: true }
      ],
      examples: [{ input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'Merge all into one sorted list.' }],
      hints: ['Use a min-heap (priority queue) to always pick the smallest.', 'Or use divide-and-conquer: merge pairs of lists.']
    }
  ],

  'Trees': [
    {
      title: 'Serialize and Deserialize Binary Tree',
      description: 'Design an algorithm to serialize and deserialize a binary tree. Serialization is the process of converting a data structure into a sequence of bits. Implement serialize(root) and deserialize(data).',
      difficulty: 'hard',
      starterCode: 'function serialize(root) {\n  // Your code here\n}\n\nfunction deserialize(data) {\n  // Your code here\n}',
      constraints: 'The number of nodes in the tree is in range [0, 10^4].\n-1000 <= Node.val <= 1000',
      testCases: [
        { input: '[1,2,3,null,null,4,5]', expectedOutput: '[1,2,3,null,null,4,5]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: true }
      ],
      examples: [{ input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]', explanation: 'BFS or preorder serialization works.' }],
      hints: ['Use BFS with null markers for missing children.', 'Or use preorder traversal with null markers.', 'Split by comma on deserialize.']
    },
    {
      title: 'Binary Tree Maximum Path Sum',
      description: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence at most once. The path does not need to pass through the root. Given the root of a binary tree, return the maximum path sum.',
      difficulty: 'hard',
      starterCode: 'function maxPathSum(root) {\n  // Your code here\n}',
      constraints: 'The number of nodes is in range [1, 3 * 10^4].\n-1000 <= Node.val <= 1000',
      testCases: [
        { input: '[1,2,3]', expectedOutput: '6', isHidden: false },
        { input: '[-10,9,20,null,null,15,7]', expectedOutput: '42', isHidden: false },
        { input: '[-3]', expectedOutput: '-3', isHidden: true }
      ],
      examples: [{ input: 'root = [-10,9,20,null,null,15,7]', output: '42', explanation: 'Path: 15->20->7 = 42.' }],
      hints: ['For each node, compute the max gain if the path passes through it.', 'The gain from a subtree = max(0, maxGain(child)).', 'Update the global max as you recurse.']
    },
    {
      title: 'Kth Smallest Element in BST',
      description: 'Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.',
      difficulty: 'medium',
      starterCode: 'function kthSmallest(root, k) {\n  // Your code here\n}',
      constraints: 'The number of nodes is n.\n1 <= k <= n <= 10^4\n0 <= Node.val <= 10^4',
      testCases: [
        { input: '[3,1,4,null,2]\n1', expectedOutput: '1', isHidden: false },
        { input: '[5,3,6,2,4,null,null,1]\n3', expectedOutput: '3', isHidden: false },
        { input: '[1]\n1', expectedOutput: '1', isHidden: true }
      ],
      examples: [{ input: 'root = [3,1,4,null,2], k = 1', output: '1', explanation: 'Inorder traversal gives sorted order; kth element is the answer.' }],
      hints: ['Inorder traversal of BST gives sorted order.', 'Count nodes as you go; return when count equals k.']
    }
  ],

  'Graphs': [
    {
      title: 'Word Ladder',
      description: 'A word ladder transformation from beginWord to endWord is a sequence of words [s1, s2, ..., sk] such that s1 = beginWord, sk = endWord, consecutive words differ by exactly one letter. Given beginWord, endWord, and a wordList, return the number of words in the shortest path from beginWord to endWord, or 0 if no path.',
      difficulty: 'hard',
      starterCode: 'function ladderLength(beginWord, endWord, wordList) {\n  // Your code here\n}',
      constraints: '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nwordList[i].length == beginWord.length',
      testCases: [
        { input: 'hit\ncog\n["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', isHidden: false },
        { input: 'hit\ncog\n["hot","dot","dog","lot","log"]', expectedOutput: '0', isHidden: false },
        { input: 'a\nb\n["a","b","c"]', expectedOutput: '2', isHidden: true }
      ],
      examples: [{ input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: 'hit→hot→dot→dog→cog is 5 words.' }],
      hints: ['Model as BFS graph problem.', 'From each word, generate all 1-letter mutations and check if they are in the word set.', 'BFS guarantees shortest path.']
    },
    {
      title: 'Pacific Atlantic Water Flow',
      description: 'There is an m x n rectangular island that borders both the Pacific Ocean and the Atlantic Ocean. Rain water can flow to adjacent cells (up, down, left, right) if the adjacent cell\'s height is ≤ current cell\'s height. Return a list of grid coordinates where water can flow to both oceans.',
      difficulty: 'medium',
      starterCode: 'function pacificAtlantic(heights) {\n  // Your code here\n}',
      constraints: 'm == heights.length\nn == heights[i].length\n1 <= m, n <= 200\n0 <= heights[i][j] <= 10^5',
      testCases: [
        { input: '[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]', expectedOutput: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]', isHidden: false },
        { input: '[[1]]', expectedOutput: '[[0,0]]', isHidden: true }
      ],
      examples: [{ input: 'heights as above', output: '[[0,4],[1,3],...]', explanation: 'DFS from ocean borders inward.' }],
      hints: ['Instead of checking from each cell to both oceans, do BFS/DFS from ocean borders inward.', 'A cell reachable from Pacific AND Atlantic border DFS = answer.']
    }
  ],

  'Dynamic Programming': [
    {
      title: 'Coin Change',
      description: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount cannot be reached, return -1.',
      difficulty: 'medium',
      starterCode: 'function coinChange(coins, amount) {\n  // Your code here\n}',
      constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
      testCases: [
        { input: '[1,5,11]\n11', expectedOutput: '1', isHidden: false },
        { input: '[1,2,5]\n11', expectedOutput: '3', isHidden: false },
        { input: '[2]\n3', expectedOutput: '-1', isHidden: true }
      ],
      examples: [{ input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1.' }],
      hints: ['Classic unbounded knapsack DP.', 'dp[i] = minimum coins to make amount i.', 'For each coin, update dp[i] = min(dp[i], dp[i-coin] + 1).']
    },
    {
      title: 'Longest Increasing Subsequence',
      description: 'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.',
      difficulty: 'medium',
      starterCode: 'function lengthOfLIS(nums) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4',
      testCases: [
        { input: '[10,9,2,5,3,7,101,18]', expectedOutput: '4', isHidden: false },
        { input: '[0,1,0,3,2,3]', expectedOutput: '4', isHidden: false },
        { input: '[7,7,7,7,7,7,7]', expectedOutput: '1', isHidden: true }
      ],
      examples: [{ input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: '[2,3,7,101] is the longest.' }],
      hints: ['O(n²) DP: dp[i] = length of LIS ending at nums[i].', 'O(n log n) with patience sorting / binary search approach.']
    },
    {
      title: 'Edit Distance',
      description: 'Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace a character) required to convert word1 to word2.',
      difficulty: 'hard',
      starterCode: 'function minDistance(word1, word2) {\n  // Your code here\n}',
      constraints: '0 <= word1.length, word2.length <= 500\nwords consist of lowercase English letters.',
      testCases: [
        { input: 'horse\nros', expectedOutput: '3', isHidden: false },
        { input: 'intention\nexecution', expectedOutput: '5', isHidden: false },
        { input: '""\\n""', expectedOutput: '0', isHidden: true }
      ],
      examples: [{ input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse→rorse→rose→ros.' }],
      hints: ['Classic 2D DP. dp[i][j] = edit distance of word1[0..i] and word2[0..j].', 'If chars match, dp[i][j] = dp[i-1][j-1]. Else min(insert, delete, replace) + 1.']
    },
    {
      title: 'Partition Equal Subset Sum',
      description: 'Given a non-empty array `nums` containing only positive integers, find if the array can be partitioned into two subsets such that the sum of elements in both subsets is equal.',
      difficulty: 'medium',
      starterCode: 'function canPartition(nums) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 200\n1 <= nums[i] <= 100',
      testCases: [
        { input: '[1,5,11,5]', expectedOutput: 'true', isHidden: false },
        { input: '[1,2,3,5]', expectedOutput: 'false', isHidden: false },
        { input: '[1,1]', expectedOutput: 'true', isHidden: true }
      ],
      examples: [{ input: 'nums = [1,5,11,5]', output: 'true', explanation: '[1,5,5] and [11] — both sum to 11.' }],
      hints: ['Total must be even.', '0/1 knapsack: can you reach target = total/2?', 'Use a boolean DP set.']
    }
  ],

  'Binary Search': [
    {
      title: 'Binary Search',
      description: 'Given an array of integers `nums` sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.',
      difficulty: 'easy',
      starterCode: 'function search(nums, target) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 10^4\n-10^4 <= nums[i], target <= 10^4\nAll integers in nums are unique and sorted.',
      testCases: [
        { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', isHidden: false },
        { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', isHidden: false },
        { input: '[5]\n5', expectedOutput: '0', isHidden: true }
      ],
      examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 is at index 4.' }],
      hints: ['Compare mid with target.', 'If target < mid, search left half. If target > mid, search right half.']
    },
    {
      title: 'Find Minimum in Rotated Sorted Array',
      description: 'Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array `nums` of unique elements, return the minimum element of this array. You must write an algorithm that runs in O(log n) time.',
      difficulty: 'medium',
      starterCode: 'function findMin(nums) {\n  // Your code here\n}',
      constraints: 'n == nums.length\n1 <= n <= 5000\n-5000 <= nums[i] <= 5000\nAll integers are unique.',
      testCases: [
        { input: '[3,4,5,1,2]', expectedOutput: '1', isHidden: false },
        { input: '[4,5,6,7,0,1,2]', expectedOutput: '0', isHidden: false },
        { input: '[11,13,15,17]', expectedOutput: '11', isHidden: true }
      ],
      examples: [{ input: 'nums = [3,4,5,1,2]', output: '1', explanation: 'The original array was [1,2,3,4,5] rotated 3 times.' }],
      hints: ['Binary search still works — check which half is sorted.', 'If nums[mid] > nums[right], minimum is in the right half. Otherwise in left half.']
    },
    {
      title: 'Search in Rotated Sorted Array',
      description: 'Given a rotated sorted array `nums` and an integer `target`, return the index of `target`, or -1 if not found. You must write an algorithm with O(log n) runtime.',
      difficulty: 'medium',
      starterCode: 'function search(nums, target) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 5000\n-10^4 <= nums[i], target <= 10^4\nAll values are unique.',
      testCases: [
        { input: '[4,5,6,7,0,1,2]\n0', expectedOutput: '4', isHidden: false },
        { input: '[4,5,6,7,0,1,2]\n3', expectedOutput: '-1', isHidden: false },
        { input: '[1]\n0', expectedOutput: '-1', isHidden: true }
      ],
      examples: [{ input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: '0 is at index 4.' }],
      hints: ['At least one half of the array is always sorted.', 'Determine which half is sorted, check if target is in that range, then eliminate accordingly.']
    }
  ],

  'Backtracking': [
    {
      title: 'Subsets',
      description: 'Given an integer array `nums` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.',
      difficulty: 'medium',
      starterCode: 'function subsets(nums) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 10\n-10 <= nums[i] <= 10\nAll elements in nums are unique.',
      testCases: [
        { input: '[1,2,3]', expectedOutput: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]', isHidden: false },
        { input: '[0]', expectedOutput: '[[],[0]]', isHidden: false },
        { input: '[1,2]', expectedOutput: '[[],[1],[2],[1,2]]', isHidden: true }
      ],
      examples: [{ input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]', explanation: 'All 8 subsets of a 3-element set.' }],
      hints: ['For each element, you either include it or not.', 'Recursion: at each step, add current subset and branch by including next elements.']
    },
    {
      title: 'Combination Sum',
      description: 'Given an array of distinct integers `candidates` and a target integer `target`, return a list of all unique combinations of `candidates` where the chosen numbers sum to `target`. The same number may be chosen from candidates an unlimited number of times.',
      difficulty: 'medium',
      starterCode: 'function combinationSum(candidates, target) {\n  // Your code here\n}',
      constraints: '1 <= candidates.length <= 30\n2 <= candidates[i] <= 40\n1 <= target <= 40',
      testCases: [
        { input: '[2,3,6,7]\n7', expectedOutput: '[[2,2,3],[7]]', isHidden: false },
        { input: '[2,3,5]\n8', expectedOutput: '[[2,2,2,2],[2,3,3],[3,5]]', isHidden: false },
        { input: '[2]\n1', expectedOutput: '[]', isHidden: true }
      ],
      examples: [{ input: 'candidates = [2,3,6,7], target = 7', output: '[[2,2,3],[7]]', explanation: 'Both sum to 7.' }],
      hints: ['Backtrack: try including each candidate and recurse.', 'Allow reuse of same candidate by not incrementing start index.']
    },
    {
      title: 'Word Search',
      description: 'Given an m x n grid of characters `board` and a string `word`, return true if `word` exists in the grid. The word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.',
      difficulty: 'medium',
      starterCode: 'function exist(board, word) {\n  // Your code here\n}',
      constraints: 'm == board.length\nn == board[i].length\n1 <= m, n <= 6\n1 <= word.length <= 15',
      testCases: [
        { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"ABCCED"', expectedOutput: 'true', isHidden: false },
        { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"SEE"', expectedOutput: 'true', isHidden: false },
        { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"ABCB"', expectedOutput: 'false', isHidden: true }
      ],
      examples: [{ input: 'board = [["A","B","C","E"],...], word = "ABCCED"', output: 'true', explanation: 'Path found through board.' }],
      hints: ['DFS with backtracking from every cell.', 'Mark visited cells, then unmark on backtrack.']
    }
  ]
};

const seedExtendedProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected for extended problem seeding');

    const allSkills = await Skill.find({});
    const nameToIdMap = new Map(allSkills.map(s => [s.name, s._id]));

    if (nameToIdMap.size === 0) {
      logger.error('No skills found — run skillSeed.js first');
      process.exit(1);
    }

    let count = 0;
    for (const [skillName, problems] of Object.entries(EXTRA_PROBLEMS)) {
      const skillId = nameToIdMap.get(skillName);
      if (!skillId) {
        logger.warn('Skill not found: ' + skillName + ' — skipping');
        continue;
      }
      for (const p of problems) {
        await Problem.updateOne(
          { title: p.title },
          {
            $set: {
              description: p.description,
              difficulty: p.difficulty,
              skillId,
              starterCode: p.starterCode,
              starterCodeMap: { javascript: p.starterCode },
              constraints: p.constraints,
              testCases: p.testCases,
              examples: p.examples,
              hints: p.hints,
              isActive: true,
              status: 'approved'
            }
          },
          { upsert: true }
        );
        count++;
      }
      logger.info('Seeded ' + problems.length + ' extra problems for ' + skillName);
    }

    logger.info('Extended seed done — ' + count + ' problems upserted');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Extended seed failed: ' + err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedExtendedProblems();
