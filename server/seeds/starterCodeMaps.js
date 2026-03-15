/**
 * Starter code templates for all 36 problems in 4 languages.
 * Keyed by problem title.
 * @module starterCodeMaps
 */

const maps = {
  // ─── Arrays ───
  'Two Sum': {
    javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
    python: 'def two_sum(nums, target):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n    }\n};'
  },
  'Maximum Subarray': {
    javascript: 'function maxSubArray(nums) {\n  // Your code here\n}',
    python: 'def max_sub_array(nums):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  'Trapping Rain Water': {
    javascript: 'function trap(height) {\n  // Your code here\n}',
    python: 'def trap(height):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int trap(int[] height) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  // ─── Strings ───
  'Valid Anagram': {
    javascript: 'function isAnagram(s, t) {\n  // Your code here\n}',
    python: 'def is_anagram(s, t):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Your code here\n        return false;\n    }\n}',
    cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Your code here\n        return false;\n    }\n};'
  },
  'Longest Substring Without Repeating Characters': {
    javascript: 'function lengthOfLongestSubstring(s) {\n  // Your code here\n}',
    python: 'def length_of_longest_substring(s):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  'Minimum Window Substring': {
    javascript: 'function minWindow(s, t) {\n  // Your code here\n}',
    python: 'def min_window(s, t):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public String minWindow(String s, String t) {\n        // Your code here\n        return "";\n    }\n}',
    cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    string minWindow(string s, string t) {\n        // Your code here\n        return "";\n    }\n};'
  },
  // ─── Hashing ───
  'Contains Duplicate': {
    javascript: 'function containsDuplicate(nums) {\n  // Your code here\n}',
    python: 'def contains_duplicate(nums):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Your code here\n        return false;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Your code here\n        return false;\n    }\n};'
  },
  'Group Anagrams': {
    javascript: 'function groupAnagrams(strs) {\n  // Your code here\n}',
    python: 'def group_anagrams(strs):\n    # Your code here\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}',
    cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Your code here\n        return {};\n    }\n};'
  },
  'Longest Consecutive Sequence': {
    javascript: 'function longestConsecutive(nums) {\n  // Your code here\n}',
    python: 'def longest_consecutive(nums):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int longestConsecutive(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  // ─── Recursion ───
  'Power of Three': {
    javascript: 'function isPowerOfThree(n) {\n  // Your code here\n}',
    python: 'def is_power_of_three(n):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public boolean isPowerOfThree(int n) {\n        // Your code here\n        return false;\n    }\n}',
    cpp: 'class Solution {\npublic:\n    bool isPowerOfThree(int n) {\n        // Your code here\n        return false;\n    }\n};'
  },
  'Generate Parentheses': {
    javascript: 'function generateParenthesis(n) {\n  // Your code here\n}',
    python: 'def generate_parenthesis(n):\n    # Your code here\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public List<String> generateParenthesis(int n) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}',
    cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<string> generateParenthesis(int n) {\n        // Your code here\n        return {};\n    }\n};'
  },
  'N-Queens': {
    javascript: 'function solveNQueens(n) {\n  // Your code here\n}',
    python: 'def solve_n_queens(n):\n    # Your code here\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public List<List<String>> solveNQueens(int n) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}',
    cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<string>> solveNQueens(int n) {\n        // Your code here\n        return {};\n    }\n};'
  },
  // ─── Sorting ───
  'Sort Colors': {
    javascript: 'function sortColors(nums) {\n  // Your code here — sort in-place\n  // Return the sorted array\n}',
    python: 'def sort_colors(nums):\n    # Your code here — sort in-place\n    pass',
    java: 'class Solution {\n    public void sortColors(int[] nums) {\n        // Your code here — sort in-place\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    void sortColors(vector<int>& nums) {\n        // Your code here — sort in-place\n    }\n};'
  },
  'Merge Intervals': {
    javascript: 'function merge(intervals) {\n  // Your code here\n}',
    python: 'def merge(intervals):\n    # Your code here\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public int[][] merge(int[][] intervals) {\n        // Your code here\n        return new int[][]{};\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Your code here\n        return {};\n    }\n};'
  },
  'Kth Largest Element in an Array': {
    javascript: 'function findKthLargest(nums, k) {\n  // Your code here\n}',
    python: 'def find_kth_largest(nums, k):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  // ─── Searching ───
  'Binary Search': {
    javascript: 'function search(nums, target) {\n  // Your code here\n}',
    python: 'def search(nums, target):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Your code here\n        return -1;\n    }\n};'
  },
  'Search in Rotated Sorted Array': {
    javascript: 'function search(nums, target) {\n  // Your code here\n}',
    python: 'def search(nums, target):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Your code here\n        return -1;\n    }\n};'
  },
  'Median of Two Sorted Arrays': {
    javascript: 'function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}',
    python: 'def find_median_sorted_arrays(nums1, nums2):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Your code here\n        return 0.0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Your code here\n        return 0.0;\n    }\n};'
  },
  // ─── Linked Lists ───
  'Reverse Linked List': {
    javascript: 'function reverseList(head) {\n  // head is an array representing the linked list\n  // Return the reversed array\n}',
    python: 'def reverse_list(head):\n    # head is a list representing the linked list\n    # Return the reversed list\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public int[] reverseList(int[] head) {\n        // Return the reversed array\n        return new int[]{};\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        // Return the reversed vector\n        return {};\n    }\n};'
  },
  'Linked List Cycle Detection': {
    javascript: 'function hasCycle(nodes, pos) {\n  // nodes: array of values, pos: index where tail connects (-1 if no cycle)\n  // Return true if cycle exists, false otherwise\n}',
    python: 'def has_cycle(nodes, pos):\n    # nodes: list of values, pos: index where tail connects (-1 if no cycle)\n    # Return True if cycle exists\n    pass',
    java: 'class Solution {\n    public boolean hasCycle(int[] nodes, int pos) {\n        // Return true if cycle exists\n        return false;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool hasCycle(vector<int>& nodes, int pos) {\n        // Return true if cycle exists\n        return false;\n    }\n};'
  },
  'Merge k Sorted Lists': {
    javascript: 'function mergeKLists(lists) {\n  // lists: array of sorted arrays\n  // Return a single merged sorted array\n}',
    python: 'def merge_k_lists(lists):\n    # lists: list of sorted lists\n    # Return a single merged sorted list\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public int[] mergeKLists(int[][] lists) {\n        // Return merged sorted array\n        return new int[]{};\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> mergeKLists(vector<vector<int>>& lists) {\n        // Return merged sorted vector\n        return {};\n    }\n};'
  },
  // ─── Stacks & Queues ───
  'Valid Parentheses': {
    javascript: 'function isValid(s) {\n  // Your code here\n}',
    python: 'def is_valid(s):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}',
    cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Your code here\n        return false;\n    }\n};'
  },
  'Daily Temperatures': {
    javascript: 'function dailyTemperatures(temperatures) {\n  // Your code here\n}',
    python: 'def daily_temperatures(temperatures):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Your code here\n        return new int[]{};\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Your code here\n        return {};\n    }\n};'
  },
  'Largest Rectangle in Histogram': {
    javascript: 'function largestRectangleArea(heights) {\n  // Your code here\n}',
    python: 'def largest_rectangle_area(heights):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int largestRectangleArea(int[] heights) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  // ─── Trees ───
  'Maximum Depth of Binary Tree': {
    javascript: 'function maxDepth(tree) {\n  // tree: level-order array, e.g. [3,9,20,null,null,15,7]\n  // Return the maximum depth\n}',
    python: 'def max_depth(tree):\n    # tree: level-order list, e.g. [3,9,20,None,None,15,7]\n    # Return the maximum depth\n    pass',
    java: 'class Solution {\n    public int maxDepth(int[] tree) {\n        // tree: level-order array\n        // Return the maximum depth\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxDepth(vector<int>& tree) {\n        // tree: level-order vector\n        // Return the maximum depth\n        return 0;\n    }\n};'
  },
  'Validate Binary Search Tree': {
    javascript: 'function isValidBST(tree) {\n  // tree: level-order array\n  // Return true or false\n}',
    python: 'def is_valid_bst(tree):\n    # tree: level-order list\n    # Return True or False\n    pass',
    java: 'class Solution {\n    public boolean isValidBST(int[] tree) {\n        // tree: level-order array\n        return false;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValidBST(vector<int>& tree) {\n        // tree: level-order vector\n        return false;\n    }\n};'
  },
  'Serialize and Deserialize Binary Tree': {
    javascript: 'function serialize(tree) {\n  // tree: level-order array\n  // Return a string representation\n}\n\nfunction deserialize(data) {\n  // data: string from serialize()\n  // Return the level-order array\n}',
    python: 'def serialize(tree):\n    # tree: level-order list\n    # Return a string representation\n    pass\n\ndef deserialize(data):\n    # data: string from serialize()\n    # Return the level-order list\n    pass',
    java: 'class Solution {\n    public String serialize(int[] tree) {\n        // Return a string representation\n        return "";\n    }\n    public int[] deserialize(String data) {\n        // Return the level-order array\n        return new int[]{};\n    }\n}',
    cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    string serialize(vector<int>& tree) {\n        // Return a string representation\n        return "";\n    }\n    vector<int> deserialize(string data) {\n        // Return the level-order vector\n        return {};\n    }\n};'
  },
  // ─── Graphs ───
  'Number of Islands': {
    javascript: 'function numIslands(grid) {\n  // grid: 2D array of "1"s and "0"s\n  // Return the number of islands\n}',
    python: 'def num_islands(grid):\n    # grid: 2D list of "1"s and "0"s\n    # Return the number of islands\n    pass',
    java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        // Return the number of islands\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        // Return the number of islands\n        return 0;\n    }\n};'
  },
  'Course Schedule': {
    javascript: 'function canFinish(numCourses, prerequisites) {\n  // Return true or false\n}',
    python: 'def can_finish(num_courses, prerequisites):\n    # Return True or False\n    pass',
    java: 'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Return true or false\n        return false;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Return true or false\n        return false;\n    }\n};'
  },
  'Word Ladder': {
    javascript: 'function ladderLength(beginWord, endWord, wordList) {\n  // Return the length of shortest transformation\n}',
    python: 'def ladder_length(begin_word, end_word, word_list):\n    # Return the length of shortest transformation\n    pass',
    java: 'import java.util.*;\nclass Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        // Return the length of shortest transformation\n        return 0;\n    }\n}',
    cpp: '#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        // Return the length of shortest transformation\n        return 0;\n    }\n};'
  },
  // ─── Dynamic Programming ───
  'Climbing Stairs': {
    javascript: 'function climbStairs(n) {\n  // Your code here\n}',
    python: 'def climb_stairs(n):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int climbStairs(int n) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  'Longest Increasing Subsequence': {
    javascript: 'function lengthOfLIS(nums) {\n  // Your code here\n}',
    python: 'def length_of_lis(nums):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int lengthOfLIS(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  'Edit Distance': {
    javascript: 'function minDistance(word1, word2) {\n  // Your code here\n}',
    python: 'def min_distance(word1, word2):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int minDistance(String word1, String word2) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  // ─── Greedy Algorithms ───
  'Best Time to Buy and Sell Stock': {
    javascript: 'function maxProfit(prices) {\n  // Your code here\n}',
    python: 'def max_profit(prices):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int maxProfit(int[] prices) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Your code here\n        return 0;\n    }\n};'
  },
  'Jump Game': {
    javascript: 'function canJump(nums) {\n  // Your code here\n}',
    python: 'def can_jump(nums):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public boolean canJump(int[] nums) {\n        // Your code here\n        return false;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        // Your code here\n        return false;\n    }\n};'
  },
  'Minimum Number of Platforms': {
    javascript: 'function minPlatforms(arrivals, departures) {\n  // Your code here\n}',
    python: 'def min_platforms(arrivals, departures):\n    # Your code here\n    pass',
    java: 'class Solution {\n    public int minPlatforms(int[] arrivals, int[] departures) {\n        // Your code here\n        return 0;\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int minPlatforms(vector<int>& arrivals, vector<int>& departures) {\n        // Your code here\n        return 0;\n    }\n};'
  }
};

module.exports = maps;
