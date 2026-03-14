/**
 * Problem Seed Script
 *
 * Seeds 36 real DSA problems: 3 per skill (1 easy, 1 medium, 1 hard) × 12 skills.
 * Uses upsert on title so it is safe to run multiple times.
 *
 * Usage: node seeds/problemSeed.js
 * Prerequisite: Run skillSeed.js first so Skill documents exist.
 *
 * @module problemSeed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');

/**
 * Returns all 36 problem definitions keyed by skill name.
 * Each skill has exactly 3 problems: easy, medium, hard.
 *
 * @returns {object} Map of skill name → array of problem definitions
 */
const getProblemsBySkill = () => ({
  'Arrays': [
    {
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume each input has exactly one solution, and you may not use the same element twice.',
      difficulty: 'easy',
      starterCode: 'function twoSum(nums, target) {\n  // Your code here\n}',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
      testCases: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
        { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false },
        { input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true }
      ],
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' }
      ],
      hints: ['Try using a hash map to store values you\'ve already seen.', 'For each element, check if target - element exists in the map.']
    },
    {
      title: 'Maximum Subarray',
      description: 'Given an integer array `nums`, find the subarray with the largest sum and return its sum. A subarray is a contiguous non-empty sequence of elements.',
      difficulty: 'medium',
      starterCode: 'function maxSubArray(nums) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
      testCases: [
        { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
        { input: '[1]', expectedOutput: '1', isHidden: false },
        { input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true }
      ],
      examples: [
        { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum = 6.' }
      ],
      hints: ['Consider Kadane\'s algorithm.', 'Track the current subarray sum — reset to the current element if the running sum drops below it.', 'Keep a global max alongside the running sum.']
    },
    {
      title: 'Trapping Rain Water',
      description: 'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
      difficulty: 'hard',
      starterCode: 'function trap(height) {\n  // Your code here\n}',
      constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
      testCases: [
        { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', isHidden: false },
        { input: '[4,2,0,3,2,5]', expectedOutput: '9', isHidden: false },
        { input: '[1,0,1]', expectedOutput: '1', isHidden: true }
      ],
      examples: [
        { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '6 units of rain water are trapped between the bars.' }
      ],
      hints: ['Think about how much water each position can hold.', 'Water at position i = min(maxLeft, maxRight) - height[i].', 'Use a two-pointer approach for O(n) time and O(1) space.']
    }
  ],

  'Strings': [
    {
      title: 'Valid Anagram',
      description: 'Given two strings `s` and `t`, return true if `t` is an anagram of `s`, and false otherwise. An anagram uses all the original letters exactly once.',
      difficulty: 'easy',
      starterCode: 'function isAnagram(s, t) {\n  // Your code here\n}',
      constraints: '1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.',
      testCases: [
        { input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false },
        { input: 'rat\ncar', expectedOutput: 'false', isHidden: false },
        { input: 'listen\nsilent', expectedOutput: 'true', isHidden: true }
      ],
      examples: [
        { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Both strings contain the same letters with the same frequencies.' }
      ],
      hints: ['Count the frequency of each character in both strings.', 'If all frequencies match, the strings are anagrams.']
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
      difficulty: 'medium',
      starterCode: 'function lengthOfLongestSubstring(s) {\n  // Your code here\n}',
      constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
      testCases: [
        { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
        { input: 'bbbbb', expectedOutput: '1', isHidden: false },
        { input: 'pwwkew', expectedOutput: '3', isHidden: true }
      ],
      examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: 'The longest substring without repeating characters is "abc" with length 3.' }
      ],
      hints: ['Use the sliding window technique.', 'Maintain a set of characters in the current window.', 'When a duplicate is found, shrink the window from the left.']
    },
    {
      title: 'Minimum Window Substring',
      description: 'Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. Return "" if no such window exists.',
      difficulty: 'hard',
      starterCode: 'function minWindow(s, t) {\n  // Your code here\n}',
      constraints: '1 <= s.length, t.length <= 10^5\ns and t consist of uppercase and lowercase English letters.',
      testCases: [
        { input: 'ADOBECODEBANC\nABC', expectedOutput: 'BANC', isHidden: false },
        { input: 'a\na', expectedOutput: 'a', isHidden: false },
        { input: 'a\naa', expectedOutput: '', isHidden: true }
      ],
      examples: [
        { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'The minimum window containing A, B, and C is "BANC".' }
      ],
      hints: ['Use a sliding window with two pointers.', 'Track character frequencies needed vs. found.', 'Contract the window when all characters are found, and track the minimum.']
    }
  ],

  'Hashing': [
    {
      title: 'Contains Duplicate',
      description: 'Given an integer array `nums`, return true if any value appears at least twice in the array, and false if every element is distinct.',
      difficulty: 'easy',
      starterCode: 'function containsDuplicate(nums) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
      testCases: [
        { input: '[1,2,3,1]', expectedOutput: 'true', isHidden: false },
        { input: '[1,2,3,4]', expectedOutput: 'false', isHidden: false },
        { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true', isHidden: true }
      ],
      examples: [
        { input: 'nums = [1,2,3,1]', output: 'true', explanation: 'The element 1 appears at index 0 and 3.' }
      ],
      hints: ['Use a Set to track seen elements.', 'If an element is already in the Set, return true.']
    },
    {
      title: 'Group Anagrams',
      description: 'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
      difficulty: 'medium',
      starterCode: 'function groupAnagrams(strs) {\n  // Your code here\n}',
      constraints: '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.',
      testCases: [
        { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["eat","tea","ate"],["tan","nat"],["bat"]]', isHidden: false },
        { input: '[""]', expectedOutput: '[[""]]', isHidden: false },
        { input: '["a"]', expectedOutput: '[["a"]]', isHidden: true }
      ],
      examples: [
        { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["eat","tea","ate"],["tan","nat"],["bat"]]', explanation: 'Anagrams are grouped together by sorted character key.' }
      ],
      hints: ['Sort each string to create a canonical key.', 'Use a hash map with the sorted string as key and group members as value.']
    },
    {
      title: 'Longest Consecutive Sequence',
      description: 'Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence. Your algorithm must run in O(n) time.',
      difficulty: 'hard',
      starterCode: 'function longestConsecutive(nums) {\n  // Your code here\n}',
      constraints: '0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
      testCases: [
        { input: '[100,4,200,1,3,2]', expectedOutput: '4', isHidden: false },
        { input: '[0,3,7,2,5,8,4,6,0,1]', expectedOutput: '9', isHidden: false },
        { input: '[]', expectedOutput: '0', isHidden: true }
      ],
      examples: [
        { input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: 'The longest consecutive sequence is [1,2,3,4], length 4.' }
      ],
      hints: ['Put all numbers in a Set for O(1) lookup.', 'Only start counting from a number if num-1 is NOT in the set (it is the start of a sequence).', 'Count forward from each sequence start.']
    }
  ],

  'Recursion': [
    {
      title: 'Power of Three',
      description: 'Given an integer `n`, return true if it is a power of three. Otherwise, return false. An integer n is a power of three if there exists an integer x such that n == 3^x.',
      difficulty: 'easy',
      starterCode: 'function isPowerOfThree(n) {\n  // Your code here\n}',
      constraints: '-2^31 <= n <= 2^31 - 1',
      testCases: [
        { input: '27', expectedOutput: 'true', isHidden: false },
        { input: '0', expectedOutput: 'false', isHidden: false },
        { input: '9', expectedOutput: 'true', isHidden: true }
      ],
      examples: [
        { input: 'n = 27', output: 'true', explanation: '27 = 3^3' }
      ],
      hints: ['Base case: n === 1 returns true.', 'If n is not divisible by 3, return false.', 'Recursively check n / 3.']
    },
    {
      title: 'Generate Parentheses',
      description: 'Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses.',
      difficulty: 'medium',
      starterCode: 'function generateParenthesis(n) {\n  // Your code here\n}',
      constraints: '1 <= n <= 8',
      testCases: [
        { input: '3', expectedOutput: '["((()))","(()())","(())()","()(())","()()()"]', isHidden: false },
        { input: '1', expectedOutput: '["()"]', isHidden: false },
        { input: '2', expectedOutput: '["(())","()()"]', isHidden: true }
      ],
      examples: [
        { input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]', explanation: 'All valid combinations of 3 pairs of parentheses.' }
      ],
      hints: ['Use backtracking with open and close counters.', 'You can add "(" if open < n.', 'You can add ")" if close < open.']
    },
    {
      title: 'N-Queens',
      description: 'Place n queens on an n×n chessboard so that no two queens threaten each other. Return all distinct solutions, where each solution is a board configuration represented as an array of strings.',
      difficulty: 'hard',
      starterCode: 'function solveNQueens(n) {\n  // Your code here\n}',
      constraints: '1 <= n <= 9',
      testCases: [
        { input: '4', expectedOutput: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]', isHidden: false },
        { input: '1', expectedOutput: '[["Q"]]', isHidden: false },
        { input: '2', expectedOutput: '[]', isHidden: true }
      ],
      examples: [
        { input: 'n = 4', output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]', explanation: 'Two valid placements for 4 queens on a 4×4 board.' }
      ],
      hints: ['Place queens row by row using backtracking.', 'Track columns and both diagonals to check conflicts.', 'Use sets for O(1) conflict checking.']
    }
  ],

  'Sorting': [
    {
      title: 'Sort Colors',
      description: 'Given an array `nums` with n objects colored red (0), white (1), or blue (2), sort them in-place so that objects of the same color are adjacent, in the order red, white, blue.',
      difficulty: 'easy',
      starterCode: 'function sortColors(nums) {\n  // Your code here — sort in-place\n  // Return the sorted array\n}',
      constraints: 'n == nums.length\n1 <= n <= 300\nnums[i] is 0, 1, or 2.',
      testCases: [
        { input: '[2,0,2,1,1,0]', expectedOutput: '[0,0,1,1,2,2]', isHidden: false },
        { input: '[2,0,1]', expectedOutput: '[0,1,2]', isHidden: false },
        { input: '[0]', expectedOutput: '[0]', isHidden: true }
      ],
      examples: [
        { input: 'nums = [2,0,2,1,1,0]', output: '[0,0,1,1,2,2]', explanation: 'The Dutch National Flag algorithm sorts in one pass.' }
      ],
      hints: ['Use the Dutch National Flag algorithm with three pointers.', 'low pointer for 0s, mid for current, high for 2s.']
    },
    {
      title: 'Merge Intervals',
      description: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of non-overlapping intervals.',
      difficulty: 'medium',
      starterCode: 'function merge(intervals) {\n  // Your code here\n}',
      constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4',
      testCases: [
        { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false },
        { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: false },
        { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]', isHidden: true }
      ],
      examples: [
        { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, merged into [1,6].' }
      ],
      hints: ['Sort intervals by start time.', 'Iterate and merge if the current interval overlaps with the previous one.']
    },
    {
      title: 'Kth Largest Element in an Array',
      description: 'Given an integer array `nums` and an integer `k`, return the kth largest element in the array. Note: it is the kth largest element in sorted order, not the kth distinct element.',
      difficulty: 'hard',
      starterCode: 'function findKthLargest(nums, k) {\n  // Your code here\n}',
      constraints: '1 <= k <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
      testCases: [
        { input: '[3,2,1,5,6,4]\n2', expectedOutput: '5', isHidden: false },
        { input: '[3,2,3,1,2,4,5,5,6]\n4', expectedOutput: '4', isHidden: false },
        { input: '[1]\n1', expectedOutput: '1', isHidden: true }
      ],
      examples: [
        { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5', explanation: 'Sorted: [1,2,3,4,5,6]. The 2nd largest is 5.' }
      ],
      hints: ['You could sort and pick the kth from end.', 'For optimal: use Quickselect (partition-based selection).', 'Average O(n) time with Quickselect.']
    }
  ],

  'Searching': [
    {
      title: 'Binary Search',
      description: 'Given a sorted array of integers `nums` and a target value, return the index of the target if found, otherwise return -1. You must write an algorithm with O(log n) runtime complexity.',
      difficulty: 'easy',
      starterCode: 'function search(nums, target) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.',
      testCases: [
        { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', isHidden: false },
        { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', isHidden: false },
        { input: '[5]\n5', expectedOutput: '0', isHidden: true }
      ],
      examples: [
        { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists at index 4.' }
      ],
      hints: ['Use two pointers: left = 0, right = length - 1.', 'Compare the middle element with target.', 'Narrow the search to the appropriate half.']
    },
    {
      title: 'Search in Rotated Sorted Array',
      description: 'Given an integer array `nums` sorted in ascending order (with distinct values) that has been rotated at an unknown pivot, and a target, return the index of target or -1. Algorithm must be O(log n).',
      difficulty: 'medium',
      starterCode: 'function search(nums, target) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4\nAll values of nums are unique.\nnums is a rotated sorted array.',
      testCases: [
        { input: '[4,5,6,7,0,1,2]\n0', expectedOutput: '4', isHidden: false },
        { input: '[4,5,6,7,0,1,2]\n3', expectedOutput: '-1', isHidden: false },
        { input: '[1]\n0', expectedOutput: '-1', isHidden: true }
      ],
      examples: [
        { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: '0 is found at index 4.' }
      ],
      hints: ['Modified binary search.', 'Determine which half is sorted and check if target falls in that range.', 'Adjust left or right accordingly.']
    },
    {
      title: 'Median of Two Sorted Arrays',
      description: 'Given two sorted arrays `nums1` and `nums2`, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).',
      difficulty: 'hard',
      starterCode: 'function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}',
      constraints: 'nums1.length == m, nums2.length == n\n0 <= m, n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6',
      testCases: [
        { input: '[1,3]\n[2]', expectedOutput: '2', isHidden: false },
        { input: '[1,2]\n[3,4]', expectedOutput: '2.5', isHidden: false },
        { input: '[0,0]\n[0,0]', expectedOutput: '0', isHidden: true }
      ],
      examples: [
        { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'Merged = [1,2,3], median = 2.' }
      ],
      hints: ['Binary search on the shorter array.', 'Partition both arrays such that left halves are ≤ right halves.', 'The median is the average of max(leftA, leftB) and min(rightA, rightB) for even total length.']
    }
  ],

  'Linked Lists': [
    {
      title: 'Reverse Linked List',
      description: 'Given the head of a singly linked list, reverse the list and return the reversed list. Represent the linked list as an array for I/O.',
      difficulty: 'easy',
      starterCode: 'function reverseList(head) {\n  // head is an array representing the linked list\n  // Return the reversed array\n}',
      constraints: 'The number of nodes in the list is in range [0, 5000].\n-5000 <= Node.val <= 5000',
      testCases: [
        { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
        { input: '[1,2]', expectedOutput: '[2,1]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: true }
      ],
      examples: [
        { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reverse the pointers of each node.' }
      ],
      hints: ['Use three pointers: prev, current, next.', 'Iterate and reverse each pointer.']
    },
    {
      title: 'Linked List Cycle Detection',
      description: 'Given the head of a linked list (represented as an array with a cycle position), determine if the linked list has a cycle. Output true/false.',
      difficulty: 'medium',
      starterCode: 'function hasCycle(nodes, pos) {\n  // nodes: array of values, pos: index where tail connects (-1 if no cycle)\n  // Return true if cycle exists, false otherwise\n}',
      constraints: 'The number of nodes is in range [0, 10^4].\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index.',
      testCases: [
        { input: '[3,2,0,-4]\n1', expectedOutput: 'true', isHidden: false },
        { input: '[1,2]\n0', expectedOutput: 'true', isHidden: false },
        { input: '[1]\n-1', expectedOutput: 'false', isHidden: true }
      ],
      examples: [
        { input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'Tail connects to node at index 1, forming a cycle.' }
      ],
      hints: ['Use Floyd\'s cycle detection (tortoise and hare).', 'Slow pointer moves 1 step, fast moves 2 steps.', 'If they meet, a cycle exists.']
    },
    {
      title: 'Merge k Sorted Lists',
      description: 'Given an array of k sorted linked lists (each represented as a sorted array), merge all into one sorted list and return it.',
      difficulty: 'hard',
      starterCode: 'function mergeKLists(lists) {\n  // lists: array of sorted arrays\n  // Return a single merged sorted array\n}',
      constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nlists[i] is sorted in ascending order.',
      testCases: [
        { input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: false },
        { input: '[[]]', expectedOutput: '[]', isHidden: true }
      ],
      examples: [
        { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'Merge all lists into one sorted list.' }
      ],
      hints: ['Use divide and conquer: merge pairs of lists.', 'Alternatively, use a min-heap/priority queue.', 'Merge two lists at a time and combine results.']
    }
  ],

  'Stacks & Queues': [
    {
      title: 'Valid Parentheses',
      description: 'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. Open brackets must be closed in the correct order.',
      difficulty: 'easy',
      starterCode: 'function isValid(s) {\n  // Your code here\n}',
      constraints: '1 <= s.length <= 10^4\ns consists of parentheses only: ()[]{}.',
      testCases: [
        { input: '()', expectedOutput: 'true', isHidden: false },
        { input: '()[]{}', expectedOutput: 'true', isHidden: false },
        { input: '(]', expectedOutput: 'false', isHidden: true }
      ],
      examples: [
        { input: 's = "()"', output: 'true', explanation: 'Opening "(" is matched by closing ")".' }
      ],
      hints: ['Use a stack to track opening brackets.', 'When you encounter a closing bracket, check if it matches the top of the stack.']
    },
    {
      title: 'Daily Temperatures',
      description: 'Given an array of integers `temperatures`, return an array where answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day, set it to 0.',
      difficulty: 'medium',
      starterCode: 'function dailyTemperatures(temperatures) {\n  // Your code here\n}',
      constraints: '1 <= temperatures.length <= 10^5\n30 <= temperatures[i] <= 100',
      testCases: [
        { input: '[73,74,75,71,69,72,76,73]', expectedOutput: '[1,1,4,2,1,1,0,0]', isHidden: false },
        { input: '[30,40,50,60]', expectedOutput: '[1,1,1,0]', isHidden: false },
        { input: '[30,60,90]', expectedOutput: '[1,1,0]', isHidden: true }
      ],
      examples: [
        { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]', explanation: 'Use a monotonic decreasing stack to find the next warmer day.' }
      ],
      hints: ['Use a monotonic stack storing indices.', 'Pop elements from the stack when the current temperature is higher.', 'The difference in indices gives the number of days to wait.']
    },
    {
      title: 'Largest Rectangle in Histogram',
      description: 'Given an array of integers `heights` representing the histogram bar heights where the width of each bar is 1, return the area of the largest rectangle in the histogram.',
      difficulty: 'hard',
      starterCode: 'function largestRectangleArea(heights) {\n  // Your code here\n}',
      constraints: '1 <= heights.length <= 10^5\n0 <= heights[i] <= 10^4',
      testCases: [
        { input: '[2,1,5,6,2,3]', expectedOutput: '10', isHidden: false },
        { input: '[2,4]', expectedOutput: '4', isHidden: false },
        { input: '[1]', expectedOutput: '1', isHidden: true }
      ],
      examples: [
        { input: 'heights = [2,1,5,6,2,3]', output: '10', explanation: 'The largest rectangle has area = 5 * 2 = 10 (bars at index 2 and 3).' }
      ],
      hints: ['Use a stack to track indices of increasing heights.', 'When a shorter bar is found, pop and calculate area.', 'The width extends from the new top of stack to the current index.']
    }
  ],

  'Trees': [
    {
      title: 'Maximum Depth of Binary Tree',
      description: 'Given the root of a binary tree (represented as an array in level-order, null for missing nodes), return its maximum depth. Maximum depth is the number of nodes along the longest path from root to leaf.',
      difficulty: 'easy',
      starterCode: 'function maxDepth(tree) {\n  // tree: level-order array, e.g. [3,9,20,null,null,15,7]\n  // Return the maximum depth\n}',
      constraints: 'The number of nodes is in range [0, 10^4].\n-100 <= Node.val <= 100',
      testCases: [
        { input: '[3,9,20,null,null,15,7]', expectedOutput: '3', isHidden: false },
        { input: '[1,null,2]', expectedOutput: '2', isHidden: false },
        { input: '[]', expectedOutput: '0', isHidden: true }
      ],
      examples: [
        { input: 'root = [3,9,20,null,null,15,7]', output: '3', explanation: 'The longest path is root → 20 → 15 (or 7), depth = 3.' }
      ],
      hints: ['Use recursion: depth = 1 + max(left depth, right depth).', 'Base case: null node returns 0.']
    },
    {
      title: 'Validate Binary Search Tree',
      description: 'Given the root of a binary tree (level-order array), determine if it is a valid BST. A valid BST has left children < node < right children for every node.',
      difficulty: 'medium',
      starterCode: 'function isValidBST(tree) {\n  // tree: level-order array\n  // Return true or false\n}',
      constraints: 'The number of nodes is in range [1, 10^4].\n-2^31 <= Node.val <= 2^31 - 1',
      testCases: [
        { input: '[2,1,3]', expectedOutput: 'true', isHidden: false },
        { input: '[5,1,4,null,null,3,6]', expectedOutput: 'false', isHidden: false },
        { input: '[1]', expectedOutput: 'true', isHidden: true }
      ],
      examples: [
        { input: 'root = [2,1,3]', output: 'true', explanation: '1 < 2 < 3 — valid BST.' }
      ],
      hints: ['Pass min and max bounds through recursion.', 'Each node must be within (min, max) range.', 'Update bounds when going left (max = node.val) or right (min = node.val).']
    },
    {
      title: 'Serialize and Deserialize Binary Tree',
      description: 'Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree. Use any format you like — the test will serialize then deserialize and compare the result.',
      difficulty: 'hard',
      starterCode: 'function serialize(tree) {\n  // tree: level-order array\n  // Return a string representation\n}\n\nfunction deserialize(data) {\n  // data: string from serialize()\n  // Return the level-order array\n}',
      constraints: 'The number of nodes is in range [0, 10^4].\n-1000 <= Node.val <= 1000',
      testCases: [
        { input: '[1,2,3,null,null,4,5]', expectedOutput: '[1,2,3,null,null,4,5]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: false },
        { input: '[1]', expectedOutput: '[1]', isHidden: true }
      ],
      examples: [
        { input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]', explanation: 'Serialize then deserialize returns the same tree.' }
      ],
      hints: ['Use pre-order traversal with a special marker for null nodes.', 'Serialize: visit node, then left, then right, using comma separation.', 'Deserialize: use a queue/index to reconstruct the tree.']
    }
  ],

  'Graphs': [
    {
      title: 'Number of Islands',
      description: 'Given an m×n 2D grid of "1"s (land) and "0"s (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.',
      difficulty: 'easy',
      starterCode: 'function numIslands(grid) {\n  // grid: 2D array of "1"s and "0"s\n  // Return the number of islands\n}',
      constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is "0" or "1".',
      testCases: [
        { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1', isHidden: false },
        { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3', isHidden: false },
        { input: '[["0"]]', expectedOutput: '0', isHidden: true }
      ],
      examples: [
        { input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: '2', explanation: 'Two separate groups of connected "1"s.' }
      ],
      hints: ['Use DFS or BFS to explore each island.', 'Mark visited cells to avoid counting them again.', 'Increment island count each time you start a new traversal.']
    },
    {
      title: 'Course Schedule',
      description: 'There are `numCourses` courses labeled 0 to numCourses-1. You are given prerequisites pairs where [a,b] means you must take b before a. Return true if you can finish all courses (no cycles in the prerequisite graph).',
      difficulty: 'medium',
      starterCode: 'function canFinish(numCourses, prerequisites) {\n  // Return true or false\n}',
      constraints: '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2\n0 <= a_i, b_i < numCourses',
      testCases: [
        { input: '2\n[[1,0]]', expectedOutput: 'true', isHidden: false },
        { input: '2\n[[1,0],[0,1]]', expectedOutput: 'false', isHidden: false },
        { input: '3\n[[1,0],[2,1]]', expectedOutput: 'true', isHidden: true }
      ],
      examples: [
        { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0 first, then course 1.' }
      ],
      hints: ['Model as a directed graph and check for cycles.', 'Use topological sort (Kahn\'s algorithm with BFS) or DFS with coloring.', 'If you can process all courses in topological order, return true.']
    },
    {
      title: 'Word Ladder',
      description: 'Given two words beginWord and endWord and a dictionary wordList, find the length of the shortest transformation sequence from beginWord to endWord, changing one letter at a time. Each transformed word must exist in the wordList. Return 0 if no such sequence.',
      difficulty: 'hard',
      starterCode: 'function ladderLength(beginWord, endWord, wordList) {\n  // Return the length of shortest transformation\n}',
      constraints: '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nAll words have the same length.\nAll words consist of lowercase English letters.',
      testCases: [
        { input: 'hit\ncog\n["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', isHidden: false },
        { input: 'hit\ncog\n["hot","dot","dog","lot","log"]', expectedOutput: '0', isHidden: false },
        { input: 'a\nc\n["a","b","c"]', expectedOutput: '2', isHidden: true }
      ],
      examples: [
        { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: 'hit → hot → dot → dog → cog, sequence length = 5.' }
      ],
      hints: ['Use BFS for shortest path.', 'For each word, try changing each character to a-z and check if it\'s in the word list.', 'Use a Set for O(1) word lookup and track visited words.']
    }
  ],

  'Dynamic Programming': [
    {
      title: 'Climbing Stairs',
      description: 'You are climbing a staircase that takes `n` steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      difficulty: 'easy',
      starterCode: 'function climbStairs(n) {\n  // Your code here\n}',
      constraints: '1 <= n <= 45',
      testCases: [
        { input: '2', expectedOutput: '2', isHidden: false },
        { input: '3', expectedOutput: '3', isHidden: false },
        { input: '5', expectedOutput: '8', isHidden: true }
      ],
      examples: [
        { input: 'n = 3', output: '3', explanation: 'Three ways: 1+1+1, 1+2, 2+1.' }
      ],
      hints: ['This is the Fibonacci sequence.', 'dp[i] = dp[i-1] + dp[i-2].', 'Base cases: dp[1] = 1, dp[2] = 2.']
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
      examples: [
        { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'LIS is [2,3,7,101] with length 4.' }
      ],
      hints: ['O(n²) DP: dp[i] = length of LIS ending at index i.', 'For each i, check all j < i where nums[j] < nums[i].', 'For O(n log n): use patience sorting with binary search.']
    },
    {
      title: 'Edit Distance',
      description: 'Given two strings `word1` and `word2`, return the minimum number of operations required to convert word1 to word2. You can insert, delete, or replace a character.',
      difficulty: 'hard',
      starterCode: 'function minDistance(word1, word2) {\n  // Your code here\n}',
      constraints: '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
      testCases: [
        { input: 'horse\nros', expectedOutput: '3', isHidden: false },
        { input: 'intention\nexecution', expectedOutput: '5', isHidden: false },
        { input: '\na', expectedOutput: '1', isHidden: true }
      ],
      examples: [
        { input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse → rorse → rose → ros (3 operations).' }
      ],
      hints: ['Use 2D DP where dp[i][j] = edit distance of word1[0..i-1] and word2[0..j-1].', 'If characters match: dp[i][j] = dp[i-1][j-1].', 'Otherwise: min(insert, delete, replace) = 1 + min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1]).']
    }
  ],

  'Greedy Algorithms': [
    {
      title: 'Best Time to Buy and Sell Stock',
      description: 'Given an array `prices` where prices[i] is the price of a stock on the ith day, find the maximum profit from one buy-sell transaction. If no profit is possible, return 0.',
      difficulty: 'easy',
      starterCode: 'function maxProfit(prices) {\n  // Your code here\n}',
      constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
      testCases: [
        { input: '[7,1,5,3,6,4]', expectedOutput: '5', isHidden: false },
        { input: '[7,6,4,3,1]', expectedOutput: '0', isHidden: false },
        { input: '[2,4,1]', expectedOutput: '2', isHidden: true }
      ],
      examples: [
        { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 5.' }
      ],
      hints: ['Track the minimum price seen so far.', 'At each price, calculate potential profit = price - minPrice.', 'Track the maximum profit.']
    },
    {
      title: 'Jump Game',
      description: 'Given an integer array `nums` where nums[i] represents the maximum jump length from position i, determine if you can reach the last index starting from the first index.',
      difficulty: 'medium',
      starterCode: 'function canJump(nums) {\n  // Your code here\n}',
      constraints: '1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5',
      testCases: [
        { input: '[2,3,1,1,4]', expectedOutput: 'true', isHidden: false },
        { input: '[3,2,1,0,4]', expectedOutput: 'false', isHidden: false },
        { input: '[0]', expectedOutput: 'true', isHidden: true }
      ],
      examples: [
        { input: 'nums = [2,3,1,1,4]', output: 'true', explanation: 'Jump 1 step from index 0 to 1, then 3 steps to index 4.' }
      ],
      hints: ['Track the farthest index you can reach.', 'At each index i, update farthest = max(farthest, i + nums[i]).', 'If farthest >= last index, return true. If i > farthest, return false.']
    },
    {
      title: 'Minimum Number of Platforms',
      description: 'Given arrival and departure times of trains, find the minimum number of platforms required so that no train waits. Return the count.',
      difficulty: 'hard',
      starterCode: 'function minPlatforms(arrivals, departures) {\n  // Your code here\n}',
      constraints: '1 <= n <= 10^5\nTime is given as integers (e.g., 900 for 9:00, 2359 for 23:59).',
      testCases: [
        { input: '[900,940,950,1100,1500,1800]\n[910,1200,1120,1130,1900,2000]', expectedOutput: '3', isHidden: false },
        { input: '[900,1100,1235]\n[1000,1200,1240]', expectedOutput: '1', isHidden: false },
        { input: '[100,200]\n[150,250]', expectedOutput: '2', isHidden: true }
      ],
      examples: [
        { input: 'arrivals = [900,940,950,1100,1500,1800], departures = [910,1200,1120,1130,1900,2000]', output: '3', explanation: 'At peak, 3 trains are at the station simultaneously.' }
      ],
      hints: ['Sort arrivals and departures separately.', 'Use two pointers to simulate trains arriving and departing.', 'Track the current platform count and maximum.']
    }
  ]
});

/**
 * Runs the problem seed: looks up skill ObjectIds by name,
 * then upserts 3 problems per skill (36 total).
 */
const seedProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected for problem seeding');

    const allSkills = await Skill.find({});
    const nameToIdMap = new Map(allSkills.map((skill) => [skill.name, skill._id]));

    if (nameToIdMap.size === 0) {
      logger.error('No skills found — run skillSeed.js first');
      process.exit(1);
    }

    const problemsBySkill = getProblemsBySkill();
    let totalUpserted = 0;

    for (const [skillName, problems] of Object.entries(problemsBySkill)) {
      const skillId = nameToIdMap.get(skillName);
      if (!skillId) {
        logger.error(`Skill "${skillName}" not found in database — skipping`);
        continue;
      }

      for (const problemData of problems) {
        await Problem.updateOne(
          { title: problemData.title },
          {
            $set: {
              description: problemData.description,
              difficulty: problemData.difficulty,
              skillId,
              starterCode: problemData.starterCode,
              constraints: problemData.constraints,
              testCases: problemData.testCases,
              examples: problemData.examples,
              hints: problemData.hints,
              isActive: true
            }
          },
          { upsert: true }
        );
        totalUpserted++;
      }

      logger.info(`Seeded ${problems.length} problems for ${skillName}`);
    }

    logger.info(`Problem seeding finished — ${totalUpserted} problems upserted`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Problem seeding failed', { error: error.message });
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedProblems();
