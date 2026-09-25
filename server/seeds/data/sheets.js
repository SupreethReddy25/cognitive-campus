/**
 * Curated problem sheets. Entries use the compact form  "Title|difficulty(e/m/h)|Topic,Topic".
 * At seed time an entry is linked to a platform problem when its title (or an alias) matches;
 * otherwise it becomes an external LeetCode reference.
 */

const SHEETS = [
  {
    name: "Striver's SDE Sheet", slug: 'strivers-sde-sheet', source: 'Striver (Take U Forward)',
    description: 'A compact, interview-tested list covering every major pattern — arrays, linked lists, recursion, binary search, stacks, trees, graphs and DP. Work through it top to bottom.',
    entries: [
      'Two Sum|e|Array,Hashing', 'Sort Colors|m|Array,Two Pointers', 'Best Time to Buy and Sell Stock|e|Array,Greedy', 'Maximum Subarray|m|Array,DP', 'Rotate Image|m|Matrix',
      'Merge Intervals|m|Array,Intervals', 'Set Matrix Zeroes|m|Matrix', 'Pascal\'s Triangle|e|Array,DP', 'Next Permutation|m|Array', 'Container With Most Water|m|Two Pointers',
      'Product of Array Except Self|m|Array,Prefix Sum', '3Sum|m|Array,Two Pointers', 'Longest Consecutive Sequence|m|Hashing', 'Reverse Linked List|e|Linked List', 'Linked List Cycle Detection|m|Linked List',
      'Merge k Sorted Lists|h|Linked List,Heap', 'Remove Nth Node From End of List|m|Linked List', 'Palindrome Linked List|e|Linked List', 'Middle of the Linked List|e|Linked List',
      'Subsets|m|Recursion,Backtracking', 'Combination Sum|m|Recursion,Backtracking', 'Permutations|m|Recursion,Backtracking', 'N-Queens|h|Backtracking', 'Word Search|m|Backtracking',
      'Binary Search|e|Binary Search', 'Search in Rotated Sorted Array|m|Binary Search', 'Median of Two Sorted Arrays|h|Binary Search', 'Koko Eating Bananas|m|Binary Search',
      'Valid Parentheses|e|Stack', 'Daily Temperatures|m|Monotonic Stack', 'Largest Rectangle in Histogram|h|Monotonic Stack', 'Evaluate Reverse Polish Notation|m|Stack',
      'Maximum Depth of Binary Tree|e|Tree,DFS', 'Validate Binary Search Tree|m|Tree,BST', 'Binary Tree Level Order Traversal|m|Tree,BFS', 'Binary Tree Maximum Path Sum|h|Tree,DP', 'Lowest Common Ancestor of a BST|m|Tree,BST',
      'Number of Islands|m|Graph,DFS', 'Course Schedule|m|Graph,Topological Sort', 'Word Ladder|h|Graph,BFS', 'Rotting Oranges|m|Graph,BFS',
      'Climbing Stairs|e|DP', 'Coin Change|m|DP', 'Longest Increasing Subsequence|m|DP', 'Longest Common Subsequence|m|DP', 'Edit Distance|h|DP,String', 'House Robber|e|DP',
      'Jump Game|m|Greedy', 'Non-overlapping Intervals|m|Greedy,Intervals', 'Gas Station|m|Greedy'
    ]
  },
  {
    name: 'Blind 75', slug: 'blind-75', source: 'Blind',
    description: 'The legendary 75 questions that cover ~90% of what interviewers ask. If you only have four weeks, do this sheet.',
    entries: [
      'Two Sum|e|Array,Hashing', 'Best Time to Buy and Sell Stock|e|Array,Greedy', 'Contains Duplicate|e|Array,Hashing', 'Product of Array Except Self|m|Array', 'Maximum Subarray|m|Array,DP',
      'Maximum Product Subarray|m|Array,DP', 'Find Minimum in Rotated Sorted Array|m|Binary Search', 'Search in Rotated Sorted Array|m|Binary Search', '3Sum|m|Array,Two Pointers', 'Container With Most Water|m|Two Pointers',
      'Sum of Two Integers|m|Bit Manipulation', 'Number of 1 Bits|e|Bit Manipulation', 'Counting Bits|e|Bit Manipulation', 'Missing Number|e|Bit Manipulation', 'Reverse Bits|e|Bit Manipulation',
      'Climbing Stairs|e|DP', 'Coin Change|m|DP', 'Longest Increasing Subsequence|m|DP', 'Longest Common Subsequence|m|DP', 'Word Break|m|DP', 'Combination Sum IV|m|DP', 'House Robber|e|DP', 'House Robber II|m|DP',
      'Decode Ways|m|DP', 'Unique Paths|m|DP', 'Jump Game|m|Greedy',
      'Clone Graph|m|Graph', 'Course Schedule|m|Graph', 'Pacific Atlantic Water Flow|m|Graph', 'Number of Islands|m|Graph', 'Longest Consecutive Sequence|m|Graph,Hashing', 'Alien Dictionary|h|Graph', 'Graph Valid Tree|m|Graph', 'Number of Connected Components in an Undirected Graph|m|Graph',
      'Insert Interval|m|Intervals', 'Merge Intervals|m|Intervals', 'Non-overlapping Intervals|m|Intervals', 'Meeting Rooms|e|Intervals', 'Meeting Rooms II|m|Intervals',
      'Reverse Linked List|e|Linked List', 'Linked List Cycle Detection|e|Linked List', 'Merge Two Sorted Lists|e|Linked List', 'Merge k Sorted Lists|h|Linked List', 'Remove Nth Node From End of List|m|Linked List', 'Reorder List|m|Linked List',
      'Set Matrix Zeroes|m|Matrix', 'Spiral Matrix|m|Matrix', 'Rotate Image|m|Matrix', 'Word Search|m|Matrix,Backtracking',
      'Longest Substring Without Repeating Characters|m|String', 'Longest Repeating Character Replacement|m|String', 'Minimum Window Substring|h|String', 'Valid Anagram|e|String', 'Group Anagrams|m|String',
      'Valid Parentheses|e|String,Stack', 'Valid Palindrome|e|String', 'Longest Palindromic Substring|m|String', 'Palindromic Substrings|m|String', 'Encode and Decode Strings|m|String',
      'Maximum Depth of Binary Tree|e|Tree', 'Same Tree|e|Tree', 'Invert Binary Tree|e|Tree', 'Binary Tree Maximum Path Sum|h|Tree', 'Binary Tree Level Order Traversal|m|Tree', 'Serialize and Deserialize Binary Tree|h|Tree',
      'Subtree of Another Tree|e|Tree', 'Construct Binary Tree from Preorder and Inorder Traversal|m|Tree', 'Validate Binary Search Tree|m|Tree', 'Kth Smallest Element in a BST|m|Tree', 'Lowest Common Ancestor of a Binary Search Tree|m|Tree',
      'Implement Trie (Prefix Tree)|m|Trie', 'Design Add and Search Words Data Structure|m|Trie', 'Word Search II|h|Trie',
      'Top K Frequent Elements|m|Heap', 'Find Median from Data Stream|h|Heap'
    ]
  },
  {
    name: 'Top 50 Array Problems', slug: 'top-50-array-problems', source: 'Cognitive Campus',
    description: 'Arrays are the foundation of every interview. Two pointers, sliding window, prefix sums, in-place tricks — 50 problems that build real fluency.',
    entries: [
      'Two Sum|e|Array,Hashing', 'Contains Duplicate|e|Array', 'Move Zeroes|e|Array,Two Pointers', 'Missing Number|e|Array,Math', 'Best Time to Buy and Sell Stock|e|Array', 'Remove Duplicates from Sorted Array|e|Array,Two Pointers',
      'Merge Sorted Array|e|Array,Two Pointers', 'Plus One|e|Array,Math', 'Single Number|e|Array,Bit Manipulation', 'Majority Element|e|Array', 'Intersection of Two Arrays II|e|Array,Hashing', 'Squares of a Sorted Array|e|Two Pointers',
      'Maximum Subarray|m|Array,DP', 'Product of Array Except Self|m|Array', 'Container With Most Water|m|Two Pointers', '3Sum|m|Two Pointers', '3Sum Closest|m|Two Pointers', '4Sum|m|Two Pointers',
      'Rotate Array|m|Array', 'Rotate Image|m|Matrix', 'Set Matrix Zeroes|m|Matrix', 'Spiral Matrix|m|Matrix', 'Subarray Sum Equals K|m|Prefix Sum,Hashing', 'Sort Colors|m|Two Pointers', 'Next Permutation|m|Array',
      'Find All Duplicates in an Array|m|Array', 'Find the Duplicate Number|m|Array,Binary Search', 'Top K Frequent Elements|m|Hashing,Heap', 'Kth Largest Element in an Array|m|Heap', 'Find Peak Element|m|Binary Search',
      'Search in Rotated Sorted Array|m|Binary Search', 'Find Minimum in Rotated Sorted Array|m|Binary Search', 'Merge Intervals|m|Intervals', 'Insert Interval|m|Intervals', 'Non-overlapping Intervals|m|Intervals',
      'Jump Game|m|Greedy', 'Gas Station|m|Greedy', 'Longest Consecutive Sequence|m|Hashing', 'Maximum Product Subarray|m|Array,DP', 'Subsets|m|Backtracking',
      'Trapping Rain Water|h|Two Pointers', 'First Missing Positive|h|Array', 'Median of Two Sorted Arrays|h|Binary Search', 'Largest Rectangle in Histogram|h|Stack', 'Sliding Window Maximum|h|Sliding Window',
      'Minimum Window Substring|h|Sliding Window', 'Maximal Rectangle|h|DP,Stack', 'Count of Smaller Numbers After Self|h|Binary Indexed Tree', 'Longest Increasing Path in a Matrix|h|DFS,DP', 'Candy|h|Greedy'
    ]
  },
  {
    name: 'Google Interview Prep', slug: 'google-interview-prep', source: 'Cognitive Campus',
    description: 'The problems and patterns reported most often in Google loops: graphs with extra state, DP variants, tricky strings and clean interval handling. Practise talking through trade-offs.',
    entries: [
      'Number of Islands|m|Graph,DFS', 'Word Ladder|h|Graph,BFS', 'Course Schedule|m|Graph,Topological Sort', 'Pacific Atlantic Water Flow|m|Graph', 'Rotting Oranges|m|Graph,BFS', 'Number of Provinces|m|Graph,Union Find',
      'Longest Substring Without Repeating Characters|m|Sliding Window', 'Minimum Window Substring|h|Sliding Window', 'Median of Two Sorted Arrays|h|Binary Search', 'Trapping Rain Water|h|Two Pointers',
      'Merge Intervals|m|Intervals', 'Meeting Rooms|e|Intervals', 'Longest Increasing Subsequence|m|DP', 'Edit Distance|h|DP', 'Coin Change|m|DP', 'Word Break|m|DP', 'Longest Common Subsequence|m|DP',
      'N-Queens|h|Backtracking', 'Word Search|m|Backtracking', 'Generate Parentheses|m|Backtracking', 'Koko Eating Bananas|m|Binary Search', 'Find Peak Element|m|Binary Search',
      'Binary Tree Maximum Path Sum|h|Tree', 'Decode String|m|Stack', 'Daily Temperatures|m|Monotonic Stack', 'Largest Rectangle in Histogram|h|Monotonic Stack',
      'Accounts Merge|m|Union Find', 'Network Delay Time|m|Graph,Dijkstra', 'Cheapest Flights Within K Stops|m|Graph', 'Alien Dictionary|h|Graph'
    ]
  },
  {
    name: 'Dynamic Programming Mastery', slug: 'dynamic-programming-mastery', source: 'Cognitive Campus',
    description: 'DP is the topic that separates offers from rejections. Progress from 1-D to grids, strings, subsequences and knapsack — each problem introduces one new idea.',
    entries: [
      'Climbing Stairs|e|DP,1D', 'House Robber|e|DP,1D', 'Min Cost Climbing Stairs|e|DP,1D', 'Fibonacci Number|e|DP,1D', 'Maximum Subarray|m|DP,1D', 'Maximum Product Subarray|m|DP,1D', 'Decode Ways|m|DP,1D', 'Word Break|m|DP,String',
      'Unique Paths|m|DP,Grid', 'Unique Paths II|m|DP,Grid', 'Minimum Path Sum|m|DP,Grid', 'Triangle|m|DP,Grid', 'Maximal Square|m|DP,Grid',
      'Longest Increasing Subsequence|m|DP,Subsequence', 'Longest Common Subsequence|m|DP,Subsequence', 'Longest Palindromic Substring|m|DP,String', 'Palindromic Substrings|m|DP,String', 'Edit Distance|h|DP,String',
      'Coin Change|m|DP,Knapsack', 'Coin Change II|m|DP,Knapsack', 'Partition Equal Subset Sum|m|DP,Knapsack', 'Target Sum|m|DP,Knapsack', 'Ones and Zeroes|m|DP,Knapsack',
      'Best Time to Buy and Sell Stock with Cooldown|m|DP,State Machine', 'Best Time to Buy and Sell Stock III|h|DP,State Machine', 'Interleaving String|m|DP,String', 'Distinct Subsequences|h|DP,String',
      'Regular Expression Matching|h|DP,String', 'Burst Balloons|h|DP,Interval', 'Longest Increasing Path in a Matrix|h|DP,Grid'
    ]
  },
  {
    name: 'Beginner Friendly 30', slug: 'beginner-friendly-30', source: 'Cognitive Campus',
    description: 'New to DSA? Start here. Thirty gentle problems that teach loops, arrays, strings, hashing and recursion one idea at a time — no prior pattern knowledge needed.',
    entries: [
      'Two Sum|e|Array,Hashing', 'Contains Duplicate|e|Hashing', 'Valid Anagram|e|Strings,Hashing', 'Valid Palindrome|e|Strings', 'Longest Common Prefix|e|Strings', 'Move Zeroes|e|Array', 'Missing Number|e|Array',
      'Best Time to Buy and Sell Stock|e|Array', 'Binary Search|e|Binary Search', 'Search Insert Position|e|Binary Search', 'Valid Parentheses|e|Stack', 'Climbing Stairs|e|DP', 'House Robber|e|DP',
      'Power of Three|e|Math,Recursion', 'Sort Colors|e|Sorting', 'Meeting Rooms|e|Sorting', 'Reverse Linked List|e|Linked List', 'Middle of the Linked List|e|Linked List', 'Palindrome Linked List|e|Linked List',
      'Maximum Depth of Binary Tree|e|Tree', 'Diameter of Binary Tree|e|Tree', 'Find if Path Exists in Graph|e|Graph', 'Assign Cookies|e|Greedy', 'Fizz Buzz|e|Math', 'Single Number|e|Bit Manipulation',
      'Merge Two Sorted Lists|e|Linked List', 'Invert Binary Tree|e|Tree', 'Same Tree|e|Tree', 'Number of 1 Bits|e|Bit Manipulation', 'Roman to Integer|e|Strings'
    ]
  },
  {
    name: 'Amazon Top 40', slug: 'amazon-top-40', source: 'Cognitive Campus',
    description: 'Frequently reported in Amazon OAs and onsite loops: BFS/DFS on grids, LRU-style design, intervals, heaps, and tree traversals — pair this with your Leadership Principle stories.',
    entries: [
      'Two Sum|e|Array', 'Number of Islands|m|Graph', 'Rotting Oranges|m|Graph,BFS', 'Merge Intervals|m|Intervals', 'Trapping Rain Water|h|Two Pointers', 'LRU Cache|m|Design', 'Merge k Sorted Lists|h|Heap',
      'Word Break|m|DP', 'Coin Change|m|DP', 'House Robber|e|DP', 'Product of Array Except Self|m|Array', 'Group Anagrams|m|Hashing', 'Top K Frequent Elements|m|Heap', 'Kth Largest Element in an Array|m|Heap',
      'Binary Tree Level Order Traversal|m|Tree', 'Lowest Common Ancestor of a BST|m|Tree', 'Validate Binary Search Tree|m|Tree', 'Subarray Sum Equals K|m|Prefix Sum', 'Decode String|m|Stack',
      'Longest Substring Without Repeating Characters|m|Sliding Window', 'Minimum Window Substring|h|Sliding Window', 'Course Schedule|m|Graph', 'Word Ladder|h|Graph', 'Permutations|m|Backtracking',
      'Subsets|m|Backtracking', 'Combination Sum|m|Backtracking', 'Search in Rotated Sorted Array|m|Binary Search', 'Koko Eating Bananas|m|Binary Search', 'Gas Station|m|Greedy', 'Jump Game|m|Greedy'
    ]
  }
];

const LINK_ALIASES = {
  'kth smallest element in a bst': 'Kth Smallest Element in BST',
  'lowest common ancestor of a binary search tree': 'Lowest Common Ancestor of a BST',
  'linked list cycle': 'Linked List Cycle Detection',
  'merge k sorted lists': 'Merge k Sorted Lists',
  '3sum': '3Sum'
};

const slugFor = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const DIFF = { e: 'easy', m: 'medium', h: 'hard' };

/**
 * @param {Map<string, {_id, difficulty, title}>} platformByTitle lower-cased title → problem
 */
const buildSheets = (platformByTitle) =>
  SHEETS.map((sheet) => {
    const problems = sheet.entries.map((raw) => {
      const [title, d, topics] = raw.split('|');
      const key = title.toLowerCase();
      const platform = platformByTitle.get(key) || platformByTitle.get((LINK_ALIASES[key] || '').toLowerCase());
      return {
        problemId: platform ? platform._id : null,
        title: platform ? platform.title : title,
        difficulty: platform ? platform.difficulty : DIFF[d],
        topics: (topics || '').split(',').map((t) => t.trim()).filter(Boolean),
        isAvailable: !!platform,
        externalUrl: platform ? '' : `https://leetcode.com/problems/${slugFor(title)}/`
      };
    });
    return { name: sheet.name, slug: sheet.slug, description: sheet.description, source: sheet.source, totalProblems: problems.length, problems };
  });

module.exports = { SHEETS, buildSheets };
