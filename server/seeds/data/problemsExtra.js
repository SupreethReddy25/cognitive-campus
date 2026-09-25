/**
 * Additional problems (30) with full editorials. Each `sig` drives starter-code generation for
 * JavaScript / Python / Java / C++ (see problemCatalog.js). `jsPyOnly` marks problems whose inputs
 * contain nulls or other shapes the typed Java/C++ harnesses do not model.
 *
 * Tests: the first two are public, the rest hidden. Every reference solution is verified against
 * every test by seeds/verifyProblems.js.
 */

const T = (input, expectedOutput, hidden = false, alternatives) => ({ input, expectedOutput, isHidden: hidden, ...(alternatives ? { alternatives } : {}) });

const JS_TREE_HELPER = `
// Helper: rebuild linked nodes from the level-order array
function buildTree(arr) {
  if (!arr.length || arr[0] === null) return null;
  const root = { val: arr[0], left: null, right: null };
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const node = q.shift();
    if (i < arr.length && arr[i] !== null) { node.left = { val: arr[i], left: null, right: null }; q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = { val: arr[i], left: null, right: null }; q.push(node.right); }
    i++;
  }
  return root;
}`;

const PY_TREE_HELPER = `
# Helper: rebuild linked nodes from the level-order array
from collections import deque

class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def build_tree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root`;

module.exports = [
  // ───────────────────────── Arrays ─────────────────────────
  {
    title: 'Move Zeroes', skill: 'Arrays', difficulty: 'easy',
    description: 'Given an integer array `nums`, move all `0`s to the end while keeping the relative order of the non-zero elements. Do it **in-place** without making a copy of the array.',
    constraints: '1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1',
    sig: { name: 'moveZeroes', params: [['nums', 'int[]']], returns: 'void' },
    tests: [T('[0,1,0,3,12]', '[1,3,12,0,0]'), T('[0]', '[0]'), T('[1,2,3]', '[1,2,3]', true), T('[0,0,1]', '[1,0,0]', true)],
    examples: [{ input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]', explanation: 'Non-zero elements keep their order; zeroes are pushed to the end.' }],
    hints: ['Keep a "write" pointer for the next non-zero slot.', 'When you see a non-zero, swap it with the write slot and advance.'],
    companies: ['Facebook', 'Amazon', 'Microsoft', 'Google'], tags: ['Two Pointers', 'In-place'], frequency: 82,
    editorial: {
      intuition: 'Everything left of the write pointer is already the compacted non-zero prefix. Each new non-zero belongs right after it.',
      approach: 'Single pass with a write index. Swap every non-zero into the write slot; zeroes drift to the tail automatically.',
      steps: ['w = 0.', 'For each i: if nums[i] != 0 swap nums[i] with nums[w]; w++.', 'The array is modified in place.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['Do not build a new array — the problem asks for in-place.', 'Swapping (not overwriting) keeps zeroes intact without a second loop.'],
      js: `function moveZeroes(nums) {
  let w = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) { [nums[w], nums[i]] = [nums[i], nums[w]]; w++; }
  }
}`,
      py: `def move_zeroes(nums):
    w = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[w], nums[i] = nums[i], nums[w]
            w += 1`
    }
  },
  {
    title: 'Missing Number', skill: 'Arrays', difficulty: 'easy',
    description: 'Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array.',
    constraints: 'n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n\nAll values are unique.',
    sig: { name: 'missingNumber', params: [['nums', 'int[]']], returns: 'int' },
    tests: [T('[3,0,1]', '2'), T('[0,1]', '2'), T('[9,6,4,2,3,5,7,0,1]', '8', true), T('[0]', '1', true)],
    examples: [{ input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3 so the range is [0,3]; 2 is missing.' }],
    hints: ['What is the sum of 0..n?', 'Compare it with the sum of the array.'],
    companies: ['Amazon', 'Microsoft', 'Apple'], tags: ['Math', 'Bit Manipulation'], frequency: 64,
    editorial: {
      intuition: 'The sum 0 + 1 + … + n is known in closed form (n(n+1)/2). Whatever is missing from the actual sum is the answer.',
      approach: 'Compute the expected sum with Gauss\' formula and subtract the array\'s sum. XOR of all indices and values also works and cannot overflow.',
      steps: ['n = nums.length.', 'expected = n(n+1)/2.', 'Return expected − sum(nums).'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['The range is [0, n] — n+1 values for n slots.', 'In fixed-width languages prefer the XOR variant to avoid overflow.'],
      js: `function missingNumber(nums) {
  const n = nums.length;
  return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);
}`,
      py: `def missing_number(nums):
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)`
    }
  },
  {
    title: 'Rotate Image', skill: 'Arrays', difficulty: 'medium',
    description: 'You are given an `n x n` 2D matrix representing an image. Rotate the image by **90 degrees clockwise**, in-place.',
    constraints: 'n == matrix.length == matrix[i].length\n1 <= n <= 20\n-1000 <= matrix[i][j] <= 1000',
    sig: { name: 'rotate', params: [['matrix', 'int[][]']], returns: 'void' },
    tests: [T('[[1,2,3],[4,5,6],[7,8,9]]', '[[7,4,1],[8,5,2],[9,6,3]]'), T('[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]'), T('[[1]]', '[[1]]', true), T('[[1,2],[3,4]]', '[[3,1],[4,2]]', true)],
    examples: [{ input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]' }],
    hints: ['A clockwise rotation = transpose, then reverse every row.', 'Do both steps in place.'],
    companies: ['Amazon', 'Microsoft', 'Apple', 'Adobe'], tags: ['Matrix', 'In-place'], frequency: 71,
    editorial: {
      intuition: 'Rotating 90° clockwise sends element (r, c) to (c, n−1−r). That equals a transpose (swap across the diagonal) followed by mirroring each row.',
      approach: 'Transpose in place, then reverse each row.',
      steps: ['For i < j: swap matrix[i][j] and matrix[j][i].', 'Reverse every row.'],
      timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
      pitfalls: ['Only swap above the diagonal (j > i) or you undo the transpose.', 'Reverse rows for clockwise; reverse columns first for counter-clockwise.'],
      js: `function rotate(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
  for (const row of matrix) row.reverse();
}`,
      py: `def rotate(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()`
    }
  },

  // ───────────────────────── Strings ─────────────────────────
  {
    title: 'Valid Palindrome', skill: 'Strings', difficulty: 'easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing every non-alphanumeric character, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome.',
    constraints: '1 <= s.length <= 2 * 10^5\ns consists of printable ASCII characters.',
    sig: { name: 'isPalindrome', params: [['s', 'String']], returns: 'boolean' },
    tests: [T('A man, a plan, a canal: Panama', 'true'), T('race a car', 'false'), T('No lemon, no melon', 'true', true), T('ab_a', 'true', true)],
    examples: [{ input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' }],
    hints: ['Use two pointers moving inward.', 'Skip characters that are not letters or digits.'],
    companies: ['Facebook', 'Microsoft', 'Amazon', 'Apple'], tags: ['Two Pointers', 'String'], frequency: 78,
    editorial: {
      intuition: 'Compare characters from both ends toward the middle, ignoring anything that is not alphanumeric.',
      approach: 'Two pointers l and r. Advance each past non-alphanumerics, then compare lowercased characters.',
      steps: ['l = 0, r = n−1.', 'Skip non-alphanumerics on both sides.', 'If lowercase chars differ return false.', 'Move inward; return true at the end.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['Underscore is NOT alphanumeric.', 'Guard l < r inside the skipping loops.'],
      js: `function isPalindrome(s) {
  const alnum = (c) => /[a-z0-9]/i.test(c);
  let l = 0, r = s.length - 1;
  while (l < r) {
    while (l < r && !alnum(s[l])) l++;
    while (l < r && !alnum(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}`,
      py: `def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum():
            l += 1
        while l < r and not s[r].isalnum():
            r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l += 1
        r -= 1
    return True`
    }
  },
  {
    title: 'Longest Common Prefix', skill: 'Strings', difficulty: 'easy',
    description: 'Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.',
    constraints: '1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] consists of lowercase English letters.',
    sig: { name: 'longestCommonPrefix', params: [['strs', 'String[]']], returns: 'String' },
    tests: [T('["flower","flow","flight"]', 'fl'), T('["dog","racecar","car"]', ''), T('["a"]', 'a', true), T('["ab","abc","abd"]', 'ab', true)],
    examples: [{ input: 'strs = ["flower","flow","flight"]', output: '"fl"' }],
    hints: ['The prefix can never be longer than the shortest string.', 'Compare column by column.'],
    companies: ['Google', 'Amazon', 'Microsoft', 'Adobe'], tags: ['String'], frequency: 55,
    editorial: {
      intuition: 'Take the first string as the candidate prefix and shorten it until every other string starts with it.',
      approach: 'Iterate through the rest of the strings, trimming the prefix while the current string does not start with it.',
      steps: ['prefix = strs[0].', 'For each other string s: while s does not start with prefix, drop its last char.', 'Return prefix (possibly empty).'],
      timeComplexity: 'O(total characters)', spaceComplexity: 'O(1)',
      pitfalls: ['Return an empty string, not null, when nothing is shared.', 'Column-by-column scanning is an equally good alternative.'],
      js: `function longestCommonPrefix(strs) {
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (!strs[i].startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) return '';
  }
  return prefix;
}`,
      py: `def longest_common_prefix(strs):
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
        if not prefix:
            return ''
    return prefix`
    }
  },

  // ───────────────────────── Hashing ─────────────────────────
  {
    title: 'Top K Frequent Elements', skill: 'Hashing', difficulty: 'medium', checker: 'unordered',
    description: 'Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in **any order**.',
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\nk is in the range [1, number of unique elements]\nThe answer is unique.',
    sig: { name: 'topKFrequent', params: [['nums', 'int[]'], ['k', 'int']], returns: 'int[]' },
    tests: [T('[1,1,1,2,2,3]\n2', '[1,2]'), T('[1]\n1', '[1]'), T('[4,4,4,5,5,6,6,6,6]\n2', '[6,4]', true), T('[-1,-1,2,2,2,3]\n1', '[2]', true)],
    examples: [{ input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' }],
    hints: ['Count frequencies with a hash map.', 'Bucket sort by frequency gives O(n).'],
    companies: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Uber'], tags: ['Hash Map', 'Bucket Sort', 'Heap'], frequency: 90,
    editorial: {
      intuition: 'Frequencies are bounded by n, so instead of sorting by count you can drop each number into a bucket indexed by its frequency.',
      approach: 'Count occurrences, place numbers into buckets[freq], then read buckets from the highest frequency downward until k numbers are collected.',
      steps: ['Count with a map.', 'buckets = array of n+1 lists; buckets[count].push(num).', 'Walk from n down to 1 collecting numbers until you have k.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
      pitfalls: ['A min-heap of size k gives O(n log k) — mention both in interviews.', 'Bucket array size must be n + 1 (frequency can equal n).'],
      js: `function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [x, c] of count) buckets[c].push(x);
  const res = [];
  for (let f = buckets.length - 1; f > 0 && res.length < k; f--) res.push(...buckets[f]);
  return res.slice(0, k);
}`,
      py: `def top_k_frequent(nums, k):
    count = {}
    for x in nums:
        count[x] = count.get(x, 0) + 1
    buckets = [[] for _ in range(len(nums) + 1)]
    for x, c in count.items():
        buckets[c].append(x)
    res = []
    for f in range(len(buckets) - 1, 0, -1):
        res.extend(buckets[f])
        if len(res) >= k:
            break
    return res[:k]`
    }
  },
  {
    title: 'Subarray Sum Equals K', skill: 'Hashing', difficulty: 'medium',
    description: 'Given an array of integers `nums` and an integer `k`, return the total number of **contiguous** subarrays whose sum equals `k`. The array may contain negative numbers.',
    constraints: '1 <= nums.length <= 2 * 10^4\n-1000 <= nums[i] <= 1000\n-10^7 <= k <= 10^7',
    sig: { name: 'subarraySum', params: [['nums', 'int[]'], ['k', 'int']], returns: 'int' },
    tests: [T('[1,1,1]\n2', '2'), T('[1,2,3]\n3', '2'), T('[1,-1,0]\n0', '3', true), T('[3,4,7,2,-3,1,4,2]\n7', '4', true)],
    examples: [{ input: 'nums = [1,1,1], k = 2', output: '2', explanation: 'Two subarrays sum to 2: indices [0,1] and [1,2].' }],
    hints: ['A sliding window fails with negative numbers.', 'sum(i..j) = prefix[j] − prefix[i−1]. How many earlier prefixes equal prefix[j] − k?'],
    companies: ['Facebook', 'Amazon', 'Google', 'Goldman Sachs'], tags: ['Prefix Sum', 'Hash Map'], frequency: 88,
    editorial: {
      intuition: 'A subarray ending at j sums to k exactly when some earlier prefix sum equals prefix[j] − k. Count how many earlier prefixes had that value.',
      approach: 'Walk once keeping the running prefix sum and a map of prefix-sum → occurrences (seeded with {0: 1}). For each step add map[prefix − k] to the answer.',
      steps: ['map = {0: 1}; sum = 0; count = 0.', 'sum += x.', 'count += map[sum − k] || 0.', 'map[sum]++.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
      pitfalls: ['Seed the map with {0:1} or subarrays starting at index 0 are missed.', 'Look up BEFORE inserting the current prefix (k = 0 would over-count otherwise).'],
      js: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    count += seen.get(sum - k) || 0;
    seen.set(sum, (seen.get(sum) || 0) + 1);
  }
  return count;
}`,
      py: `def subarray_sum(nums, k):
    seen = {0: 1}
    total = count = 0
    for x in nums:
        total += x
        count += seen.get(total - k, 0)
        seen[total] = seen.get(total, 0) + 1
    return count`
    }
  },

  // ───────────────────────── Recursion ─────────────────────────
  {
    title: 'Permutations', skill: 'Recursion', difficulty: 'medium', checker: 'unordered',
    description: 'Given an array `nums` of distinct integers, return all the possible permutations. You can return the answer in **any order**.',
    constraints: '1 <= nums.length <= 6\n-10 <= nums[i] <= 10\nAll integers of nums are unique.',
    sig: { name: 'permute', params: [['nums', 'int[]']], returns: 'int[][]' },
    tests: [T('[1,2,3]', '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]'), T('[0,1]', '[[0,1],[1,0]]'), T('[1]', '[[1]]', true)],
    examples: [{ input: 'nums = [0,1]', output: '[[0,1],[1,0]]' }],
    hints: ['Build a permutation position by position.', 'Track which elements are already used (a boolean array or swapping).'],
    companies: ['Amazon', 'Microsoft', 'Google', 'Adobe'], tags: ['Backtracking'], frequency: 79,
    editorial: {
      intuition: 'For each position you may pick any element not yet used; the recursion tree has n choices at level 1, n−1 at level 2, and so on.',
      approach: 'Backtrack with a `used` flag array. Extend the current permutation with each unused element, recurse, then undo.',
      steps: ['If cur.length == n record a copy.', 'For each i not used: mark used, push, recurse, pop, unmark.'],
      timeComplexity: 'O(n · n!)', spaceComplexity: 'O(n)',
      pitfalls: ['Push a COPY of cur into the results.', 'Always un-mark used[i] after the recursive call.'],
      js: `function permute(nums) {
  const res = [], used = new Array(nums.length).fill(false), cur = [];
  const dfs = () => {
    if (cur.length === nums.length) { res.push([...cur]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; cur.push(nums[i]);
      dfs();
      cur.pop(); used[i] = false;
    }
  };
  dfs();
  return res;
}`,
      py: `def permute(nums):
    res, used, cur = [], [False] * len(nums), []
    def dfs():
        if len(cur) == len(nums):
            res.append(cur[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            cur.append(nums[i])
            dfs()
            cur.pop()
            used[i] = False
    dfs()
    return res`
    }
  },

  // ───────────────────────── Sorting ─────────────────────────
  {
    title: 'Meeting Rooms', skill: 'Sorting', difficulty: 'easy',
    description: 'Given an array of meeting time intervals `intervals` where `intervals[i] = [start, end]`, determine if a person could attend **all** meetings (no two meetings may overlap).',
    constraints: '0 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start < end <= 10^6',
    sig: { name: 'canAttendMeetings', params: [['intervals', 'int[][]']], returns: 'boolean' },
    tests: [T('[[0,30],[5,10],[15,20]]', 'false'), T('[[7,10],[2,4]]', 'true'), T('[]', 'true', true), T('[[1,5],[5,8]]', 'true', true)],
    examples: [{ input: 'intervals = [[0,30],[5,10],[15,20]]', output: 'false', explanation: '[0,30] overlaps [5,10].' }],
    hints: ['Sort by start time.', 'Only adjacent meetings can overlap once sorted.'],
    companies: ['Facebook', 'Google', 'Amazon', 'Microsoft'], tags: ['Sorting', 'Intervals'], frequency: 74,
    editorial: {
      intuition: 'After sorting by start time, a conflict can only occur between neighbours: the next meeting starting before the previous one ends.',
      approach: 'Sort by start; scan adjacent pairs and fail if intervals[i].start < intervals[i−1].end.',
      steps: ['Sort by start.', 'For i ≥ 1 compare start[i] with end[i−1].', 'Return false on the first overlap.'],
      timeComplexity: 'O(n log n)', spaceComplexity: 'O(1) extra',
      pitfalls: ['A meeting starting exactly when another ends is fine (strict <).', 'Sort numerically.'],
      js: `function canAttendMeetings(intervals) {
  const s = [...intervals].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < s.length; i++) if (s[i][0] < s[i - 1][1]) return false;
  return true;
}`,
      py: `def can_attend_meetings(intervals):
    s = sorted(intervals, key=lambda x: x[0])
    return all(s[i][0] >= s[i - 1][1] for i in range(1, len(s)))`
    }
  },

  // ───────────────────────── Searching ─────────────────────────
  {
    title: 'Search Insert Position', skill: 'Searching', difficulty: 'easy',
    description: 'Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be inserted in order. You must write an algorithm with `O(log n)` runtime.',
    constraints: '1 <= nums.length <= 10^4\n-10^4 <= nums[i] <= 10^4\nnums is sorted in ascending order with distinct values.',
    sig: { name: 'searchInsert', params: [['nums', 'int[]'], ['target', 'int']], returns: 'int' },
    tests: [T('[1,3,5,6]\n5', '2'), T('[1,3,5,6]\n2', '1'), T('[1,3,5,6]\n7', '4', true), T('[1,3,5,6]\n0', '0', true)],
    examples: [{ input: 'nums = [1,3,5,6], target = 2', output: '1', explanation: '2 would be inserted at index 1.' }],
    hints: ['This is a "lower bound" binary search.', 'Find the first index whose value is >= target.'],
    companies: ['Amazon', 'Adobe', 'Microsoft'], tags: ['Binary Search'], frequency: 60,
    editorial: {
      intuition: 'The insertion point is the first index with nums[i] ≥ target — the classic lower bound.',
      approach: 'Binary search over [0, n] narrowing toward the first element that is not smaller than the target.',
      steps: ['lo = 0, hi = n.', 'While lo < hi: mid; if nums[mid] < target lo = mid+1 else hi = mid.', 'Return lo.'],
      timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
      pitfalls: ['hi starts at n (not n−1) so "insert at the end" is representable.', 'Use hi = mid, not mid − 1, in the ≥ branch.'],
      js: `function searchInsert(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}`,
      py: `def search_insert(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo`
    }
  },
  {
    title: 'Koko Eating Bananas', skill: 'Searching', difficulty: 'medium',
    description: 'Koko has `n` piles of bananas, the `i`-th pile has `piles[i]` bananas. The guards return in `h` hours. Each hour Koko picks one pile and eats up to `k` bananas from it (if the pile has fewer than `k`, she eats all of it and does nothing else that hour). Return the **minimum** integer eating speed `k` such that she can finish all bananas within `h` hours.',
    constraints: '1 <= piles.length <= 10^4\npiles.length <= h <= 10^9\n1 <= piles[i] <= 10^9',
    sig: { name: 'minEatingSpeed', params: [['piles', 'int[]'], ['h', 'int']], returns: 'int' },
    tests: [T('[3,6,7,11]\n8', '4'), T('[30,11,23,4,20]\n5', '30'), T('[30,11,23,4,20]\n6', '23', true), T('[1]\n1', '1', true)],
    examples: [{ input: 'piles = [3,6,7,11], h = 8', output: '4' }],
    hints: ['If speed k works, every larger speed works too — monotonic!', 'Binary search on the answer k; test feasibility by summing ceil(pile / k).'],
    companies: ['Google', 'Amazon', 'Facebook', 'Uber'], tags: ['Binary Search on Answer'], frequency: 76,
    editorial: {
      intuition: 'Feasibility is monotonic in the speed, so instead of searching an array you binary-search the answer space [1, max(piles)].',
      approach: 'For a candidate speed k the hours needed are Σ ceil(pile/k). Find the smallest k with hours ≤ h.',
      steps: ['lo = 1, hi = max(piles).', 'mid = speed; hours = Σ ceil(p/mid).', 'If hours ≤ h: hi = mid else lo = mid + 1.', 'Return lo.'],
      timeComplexity: 'O(n log max(piles))', spaceComplexity: 'O(1)',
      pitfalls: ['Use ceiling division, not floor.', 'The answer is at least 1 (a speed of 0 never finishes).'],
      js: `function minEatingSpeed(piles, h) {
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);
    if (hours <= h) hi = mid; else lo = mid + 1;
  }
  return lo;
}`,
      py: `import math

def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        hours = sum(math.ceil(p / mid) for p in piles)
        if hours <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo`
    }
  },
  {
    title: 'Find Peak Element', skill: 'Searching', difficulty: 'medium',
    description: 'A peak element is an element that is strictly greater than its neighbours. Given an integer array `nums`, find a peak element and return its **index**. If there are multiple peaks, return the index of **any** of them. You may imagine `nums[-1] = nums[n] = -∞`. You must write an algorithm that runs in `O(log n)` time.',
    constraints: '1 <= nums.length <= 1000\n-2^31 <= nums[i] <= 2^31 - 1\nnums[i] != nums[i + 1] for all valid i',
    sig: { name: 'findPeakElement', params: [['nums', 'int[]']], returns: 'int' },
    tests: [T('[1,2,3,1]', '2'), T('[1,2,1,3,5,6,4]', '5', false, ['1']), T('[1]', '0', true), T('[3,2,1]', '0', true)],
    examples: [{ input: 'nums = [1,2,3,1]', output: '2', explanation: '3 is a peak, at index 2.' }],
    hints: ['If nums[mid] < nums[mid+1] a peak must exist on the right.', 'Otherwise a peak exists at mid or to its left.'],
    companies: ['Google', 'Facebook', 'Microsoft'], tags: ['Binary Search'], frequency: 58,
    editorial: {
      intuition: 'Follow the slope uphill: if the next element is bigger, climbing right must eventually reach a peak (the array ends in −∞).',
      approach: 'Binary search comparing nums[mid] with nums[mid+1]; always keep the half that contains an ascent.',
      steps: ['lo = 0, hi = n−1.', 'While lo < hi: mid.', 'If nums[mid] < nums[mid+1] lo = mid+1 else hi = mid.', 'Return lo.'],
      timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
      pitfalls: ['Compare with the right neighbour so mid+1 is always in range (lo < hi).', 'Any peak is accepted — the judge lists valid alternatives.'],
      js: `function findPeakElement(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1; else hi = mid;
  }
  return lo;
}`,
      py: `def find_peak_element(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo`
    }
  },

  // ───────────────────────── Linked Lists (array I/O) ─────────────────────────
  {
    title: 'Middle of the Linked List', skill: 'Linked Lists', difficulty: 'easy',
    description: 'Given the head of a singly linked list (as an array), return the middle node — and everything after it — as an array. If there are two middle nodes, return the **second** one.',
    constraints: 'The number of nodes is in the range [1, 100].\n1 <= Node.val <= 100',
    sig: { name: 'middleNode', params: [['head', 'int[]']], returns: 'int[]' },
    tests: [T('[1,2,3,4,5]', '[3,4,5]'), T('[1,2,3,4,5,6]', '[4,5,6]'), T('[1]', '[1]', true), T('[7,8]', '[8]', true)],
    examples: [{ input: 'head = [1,2,3,4,5]', output: '[3,4,5]' }],
    hints: ['Fast and slow pointers: when fast reaches the end, slow is in the middle.', 'Fast moves two steps per slow step.'],
    companies: ['Amazon', 'Microsoft', 'Adobe'], tags: ['Two Pointers', 'Linked List'], frequency: 62,
    editorial: {
      intuition: 'If one runner moves twice as fast as another, when the fast runner finishes the slow runner is exactly halfway.',
      approach: 'Tortoise/hare over the list; with the array representation the same pointer arithmetic gives the start index of the answer.',
      steps: ['slow = fast = 0.', 'While fast + 1 < n: slow++, fast += 2.', 'Return the list from slow onward.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1) pointers',
      pitfalls: ['For even lengths the SECOND middle is required — make sure the loop condition allows fast to step past the last index.'],
      js: `function middleNode(head) {
  let slow = 0, fast = 0;
  while (fast + 1 < head.length) { slow += 1; fast += 2; }
  return head.slice(slow);
}`,
      py: `def middle_node(head):
    slow = fast = 0
    while fast + 1 < len(head):
        slow += 1
        fast += 2
    return head[slow:]`
    }
  },
  {
    title: 'Remove Nth Node From End of List', skill: 'Linked Lists', difficulty: 'medium',
    description: 'Given the head of a linked list (as an array), remove the `n`-th node from the **end** of the list and return the resulting list as an array.',
    constraints: 'The number of nodes is sz, 1 <= sz <= 30\n1 <= n <= sz',
    sig: { name: 'removeNthFromEnd', params: [['head', 'int[]'], ['n', 'int']], returns: 'int[]' },
    tests: [T('[1,2,3,4,5]\n2', '[1,2,3,5]'), T('[1]\n1', '[]'), T('[1,2]\n1', '[1]', true), T('[1,2]\n2', '[2]', true)],
    examples: [{ input: 'head = [1,2,3,4,5], n = 2', output: '[1,2,3,5]' }],
    hints: ['Use two pointers n nodes apart.', 'A dummy head node makes removing the first node uniform.'],
    companies: ['Facebook', 'Amazon', 'Microsoft', 'Google'], tags: ['Two Pointers', 'Linked List'], frequency: 70,
    editorial: {
      intuition: 'Keep a gap of n between two pointers; when the front pointer falls off the end, the back pointer sits just before the node to delete.',
      approach: 'Advance `fast` n steps from a dummy head, then move both until fast reaches the tail; unlink slow.next. Array form: the target index is length − n.',
      steps: ['idx = length − n.', 'Remove element idx.', 'Return the remaining list.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1) pointers',
      pitfalls: ['Removing the head (n == length) is the edge case a dummy node solves.', 'n counts from the end, starting at 1.'],
      js: `function removeNthFromEnd(head, n) {
  const idx = head.length - n;
  return head.filter((_, i) => i !== idx);
}`,
      py: `def remove_nth_from_end(head, n):
    idx = len(head) - n
    return [v for i, v in enumerate(head) if i != idx]`
    }
  },
  {
    title: 'Palindrome Linked List', skill: 'Linked Lists', difficulty: 'easy',
    description: 'Given the head of a singly linked list (as an array), return `true` if it is a palindrome. Aim for `O(n)` time and `O(1)` extra space in the pointer version of the problem.',
    constraints: 'The number of nodes is in the range [1, 10^5].\n0 <= Node.val <= 9',
    sig: { name: 'isPalindromeList', params: [['head', 'int[]']], returns: 'boolean' },
    tests: [T('[1,2,2,1]', 'true'), T('[1,2]', 'false'), T('[1]', 'true', true), T('[1,2,3,2,1]', 'true', true)],
    examples: [{ input: 'head = [1,2,2,1]', output: 'true' }],
    hints: ['Find the middle, reverse the second half, then compare both halves.', 'With arrays a simple two-pointer comparison mirrors the idea.'],
    companies: ['Amazon', 'Facebook', 'Microsoft', 'Apple'], tags: ['Linked List', 'Two Pointers'], frequency: 67,
    editorial: {
      intuition: 'A palindrome reads the same from both ends — reverse the second half of the list in place and compare it with the first.',
      approach: 'Find the middle with slow/fast, reverse from the middle, and walk both halves comparing values. (Array form: two pointers inward.)',
      steps: ['Locate the middle.', 'Reverse the second half.', 'Compare halves node by node.', '(Optional) restore the list.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1) for the pointer version',
      pitfalls: ['For odd lengths ignore the centre node.', 'Copying values into an array is simpler but uses O(n) space.'],
      js: `function isPalindromeList(head) {
  let l = 0, r = head.length - 1;
  while (l < r) if (head[l++] !== head[r--]) return false;
  return true;
}`,
      py: `def is_palindrome_list(head):
    l, r = 0, len(head) - 1
    while l < r:
        if head[l] != head[r]:
            return False
        l += 1
        r -= 1
    return True`
    }
  },

  // ───────────────────────── Stacks & Queues ─────────────────────────
  {
    title: 'Evaluate Reverse Polish Notation', skill: 'Stacks & Queues', difficulty: 'medium',
    description: 'You are given an array of strings `tokens` that represents an arithmetic expression in **Reverse Polish Notation**. Evaluate the expression and return the integer result. Valid operators are `+`, `-`, `*` and `/`. Division between two integers **truncates toward zero**.',
    constraints: '1 <= tokens.length <= 10^4\ntokens[i] is an operator or an integer in the range [-200, 200].\nThe expression is always valid.',
    sig: { name: 'evalRPN', params: [['tokens', 'String[]']], returns: 'int' },
    tests: [T('["2","1","+","3","*"]', '9'), T('["4","13","5","/","+"]', '6'), T('["10","6","9","3","+","-11","*","/","*","17","+","5","+"]', '22', true), T('["3","-4","/"]', '0', true)],
    examples: [{ input: 'tokens = ["2","1","+","3","*"]', output: '9', explanation: '((2 + 1) * 3) = 9' }],
    hints: ['Push numbers on a stack; on an operator pop two operands.', 'The FIRST popped value is the right operand.'],
    companies: ['Amazon', 'Goldman Sachs', 'Facebook', 'Microsoft', 'JP Morgan'], tags: ['Stack'], frequency: 69,
    editorial: {
      intuition: 'In postfix notation an operator always applies to the two most recent operands — the stack top.',
      approach: 'Scan tokens; numbers are pushed; for an operator pop b then a, push a op b. Truncate division toward zero.',
      steps: ['For each token: number → push.', 'Operator → b = pop, a = pop.', 'Push a + b / a − b / a × b / trunc(a ÷ b).', 'The single remaining item is the result.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
      pitfalls: ['Operand order matters for − and ÷: a op b where b is popped first.', 'Use trunc (not floor) for negative quotients.'],
      js: `function evalRPN(tokens) {
  const st = [];
  for (const t of tokens) {
    if (['+', '-', '*', '/'].includes(t)) {
      const b = st.pop(), a = st.pop();
      st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b));
    } else st.push(Number(t));
  }
  return st.pop();
}`,
      py: `def eval_rpn(tokens):
    st = []
    for t in tokens:
        if t in ('+', '-', '*', '/'):
            b, a = st.pop(), st.pop()
            if t == '+':
                st.append(a + b)
            elif t == '-':
                st.append(a - b)
            elif t == '*':
                st.append(a * b)
            else:
                st.append(int(a / b))
        else:
            st.append(int(t))
    return st.pop()`
    }
  },
  {
    title: 'Decode String', skill: 'Stacks & Queues', difficulty: 'medium',
    description: 'Given an encoded string, return its decoded string. The encoding rule is `k[encoded_string]`, where the `encoded_string` inside the brackets is repeated exactly `k` times. `k` is always a positive integer and the input is always valid; brackets can be nested.',
    constraints: '1 <= s.length <= 30\ns consists of lowercase English letters, digits and square brackets.\nAll integers in s are in the range [1, 300].',
    sig: { name: 'decodeString', params: [['s', 'String']], returns: 'String' },
    tests: [T('3[a]2[bc]', 'aaabcbc'), T('3[a2[c]]', 'accaccacc'), T('2[abc]3[cd]ef', 'abcabccdcdcdef', true), T('abc', 'abc', true)],
    examples: [{ input: 's = "3[a]2[bc]"', output: '"aaabcbc"' }],
    hints: ['Use two stacks: one for counts, one for the partial strings.', 'On "]" pop the count and repeat the current string.'],
    companies: ['Google', 'Amazon', 'Facebook', 'Uber', 'Microsoft'], tags: ['Stack', 'String'], frequency: 80,
    editorial: {
      intuition: 'Nested brackets are last-in-first-out: when a "]" closes, the most recent "[" tells you what to repeat and how often.',
      approach: 'Iterate characters; digits build k; "[" pushes (current string, k) and resets; "]" pops and appends current repeated k times to the popped prefix.',
      steps: ['cur = "", k = 0, stack = [].', 'Digit: k = k·10 + d.', '"[": push [cur, k]; cur = "", k = 0.', '"]": pop [prev, times]; cur = prev + cur × times.', 'Other char: cur += c.'],
      timeComplexity: 'O(output length)', spaceComplexity: 'O(nesting depth)',
      pitfalls: ['Numbers can have several digits (e.g. 12[a]).', 'Reset k after every "[".'],
      js: `function decodeString(s) {
  const stack = [];
  let cur = '', k = 0;
  for (const c of s) {
    if (c >= '0' && c <= '9') k = k * 10 + Number(c);
    else if (c === '[') { stack.push([cur, k]); cur = ''; k = 0; }
    else if (c === ']') { const [prev, times] = stack.pop(); cur = prev + cur.repeat(times); }
    else cur += c;
  }
  return cur;
}`,
      py: `def decode_string(s):
    stack = []
    cur, k = '', 0
    for c in s:
        if c.isdigit():
            k = k * 10 + int(c)
        elif c == '[':
            stack.append((cur, k))
            cur, k = '', 0
        elif c == ']':
            prev, times = stack.pop()
            cur = prev + cur * times
        else:
            cur += c
    return cur`
    }
  },

  // ───────────────────────── Trees ─────────────────────────
  {
    title: 'Diameter of Binary Tree', skill: 'Trees', difficulty: 'easy', jsPyOnly: true,
    description: 'Given the root of a binary tree (as a level-order array, `null` for missing nodes), return the length of the **diameter** — the number of edges on the longest path between any two nodes. The path may or may not pass through the root.',
    constraints: 'The number of nodes is in the range [1, 10^4].\n-100 <= Node.val <= 100',
    sig: { name: 'diameterOfBinaryTree', params: [['root', 'int[]']], returns: 'int' },
    tests: [T('[1,2,3,4,5]', '3'), T('[1,2]', '1'), T('[1]', '0', true), T('[1,2,null,3,null,4]', '3', true)],
    examples: [{ input: 'root = [1,2,3,4,5]', output: '3', explanation: 'The longest path is 4 → 2 → 1 → 3 (3 edges).' }],
    hints: ['The diameter through a node = height(left) + height(right).', 'Compute heights bottom-up and track a global maximum.'],
    companies: ['Facebook', 'Amazon', 'Google', 'Microsoft'], tags: ['DFS', 'Tree'], frequency: 77,
    editorial: {
      intuition: 'The longest path has a topmost node; through that node its length is (left height) + (right height).',
      approach: 'Post-order DFS returning each subtree\'s height while updating a global maximum of left + right.',
      steps: ['height(null) = 0.', 'l = height(left), r = height(right).', 'best = max(best, l + r).', 'Return 1 + max(l, r).'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h)',
      pitfalls: ['Diameter is counted in EDGES, not nodes.', 'Do not assume the longest path goes through the root.'],
      js: `function diameterOfBinaryTree(root) {
  let best = 0;
  const height = (n) => {
    if (!n) return 0;
    const l = height(n.left), r = height(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  height(buildTree(root));
  return best;
}
${JS_TREE_HELPER}`,
      py: `def diameter_of_binary_tree(root):
    best = [0]
    def height(n):
        if not n:
            return 0
        l, r = height(n.left), height(n.right)
        best[0] = max(best[0], l + r)
        return 1 + max(l, r)
    height(build_tree(root))
    return best[0]
${PY_TREE_HELPER}`
    }
  },
  {
    title: 'Binary Tree Level Order Traversal', skill: 'Trees', difficulty: 'medium', jsPyOnly: true,
    description: 'Given the root of a binary tree (level-order array), return the **level order traversal** of its nodes\' values — that is, from left to right, level by level.',
    constraints: 'The number of nodes is in the range [0, 2000].\n-1000 <= Node.val <= 1000',
    sig: { name: 'levelOrder', params: [['root', 'int[]']], returns: 'int[][]' },
    tests: [T('[3,9,20,null,null,15,7]', '[[3],[9,20],[15,7]]'), T('[1]', '[[1]]'), T('[]', '[]', true), T('[1,2,3,4,null,null,5]', '[[1],[2,3],[4,5]]', true)],
    examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' }],
    hints: ['Use a queue; process one level at a time.', 'Snapshot queue.length at the start of each level.'],
    companies: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'Adobe', 'Uber'], tags: ['BFS', 'Tree'], frequency: 92,
    editorial: {
      intuition: 'Breadth-first search visits nodes level by level — you only need to know where each level ends.',
      approach: 'Queue-based BFS: at each iteration take the current queue size, dequeue that many nodes into one level array, and enqueue their children.',
      steps: ['If root is null return [].', 'queue = [root].', 'While queue: size = queue.length; collect `size` nodes into a level.', 'Enqueue children; push the level.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(w) where w is the maximum width',
      pitfalls: ['Read queue.length BEFORE the inner loop mutates it.', 'Return [] (not [[]]) for an empty tree.'],
      js: `function levelOrder(root) {
  const start = buildTree(root);
  if (!start) return [];
  const res = [], queue = [start];
  while (queue.length) {
    const size = queue.length, level = [];
    for (let i = 0; i < size; i++) {
      const n = queue.shift();
      level.push(n.val);
      if (n.left) queue.push(n.left);
      if (n.right) queue.push(n.right);
    }
    res.push(level);
  }
  return res;
}
${JS_TREE_HELPER}`,
      py: `def level_order(root):
    start = build_tree(root)
    if not start:
        return []
    res, q = [], deque([start])
    while q:
        level = []
        for _ in range(len(q)):
            n = q.popleft()
            level.append(n.val)
            if n.left:
                q.append(n.left)
            if n.right:
                q.append(n.right)
        res.append(level)
    return res
${PY_TREE_HELPER}`
    }
  },
  {
    title: 'Lowest Common Ancestor of a BST', skill: 'Trees', difficulty: 'medium', jsPyOnly: true,
    description: 'Given a binary search tree (level-order array) and two node values `p` and `q` that exist in it, return the value of their **lowest common ancestor** — the lowest node that has both `p` and `q` as descendants (a node may be a descendant of itself).',
    constraints: 'The number of nodes is in the range [2, 10^5].\nAll node values are unique.\np != q and both exist in the BST.',
    sig: { name: 'lowestCommonAncestor', params: [['root', 'int[]'], ['p', 'int'], ['q', 'int']], returns: 'int' },
    tests: [T('[6,2,8,0,4,7,9,null,null,3,5]\n2\n8', '6'), T('[6,2,8,0,4,7,9,null,null,3,5]\n2\n4', '2'), T('[2,1]\n2\n1', '2', true), T('[6,2,8,0,4,7,9,null,null,3,5]\n3\n5', '4', true)],
    examples: [{ input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8', output: '6' }],
    hints: ['Use the BST ordering — you never need to search both subtrees.', 'If both p and q are smaller than the node go left; if both larger go right; otherwise you found the split point.'],
    companies: ['Amazon', 'Facebook', 'Microsoft', 'Google', 'LinkedIn'], tags: ['BST', 'Tree'], frequency: 83,
    editorial: {
      intuition: 'In a BST the LCA is the first node whose value lies between p and q — where their paths diverge.',
      approach: 'Walk down from the root: both smaller → go left, both larger → go right, otherwise the current node is the LCA.',
      steps: ['node = root.', 'While node: if p and q < node.val go left; if both > go right; else return node.val.'],
      timeComplexity: 'O(h)', spaceComplexity: 'O(1)',
      pitfalls: ['A node can be its own ancestor (p = 2, q = 4 → 2).', 'This shortcut ONLY works for BSTs; a general tree needs a full DFS.'],
      js: `function lowestCommonAncestor(root, p, q) {
  let node = buildTree(root);
  while (node) {
    if (p < node.val && q < node.val) node = node.left;
    else if (p > node.val && q > node.val) node = node.right;
    else return node.val;
  }
  return null;
}
${JS_TREE_HELPER}`,
      py: `def lowest_common_ancestor(root, p, q):
    node = build_tree(root)
    while node:
        if p < node.val and q < node.val:
            node = node.left
        elif p > node.val and q > node.val:
            node = node.right
        else:
            return node.val
${PY_TREE_HELPER}`
    }
  },

  // ───────────────────────── Graphs ─────────────────────────
  {
    title: 'Find if Path Exists in Graph', skill: 'Graphs', difficulty: 'easy',
    description: 'There is a bi-directional graph with `n` vertices labelled `0` to `n - 1`. The edges are given as `edges[i] = [u, v]`. Determine whether there is a valid path from `source` to `destination`.',
    constraints: '1 <= n <= 2 * 10^5\n0 <= edges.length <= 2 * 10^5\n0 <= u, v <= n - 1\nNo self-loops or repeated edges.',
    sig: { name: 'validPath', params: [['n', 'int'], ['edges', 'int[][]'], ['source', 'int'], ['destination', 'int']], returns: 'boolean' },
    tests: [T('3\n[[0,1],[1,2],[2,0]]\n0\n2', 'true'), T('6\n[[0,1],[0,2],[3,5],[5,4],[4,3]]\n0\n5', 'false'), T('1\n[]\n0\n0', 'true', true), T('4\n[[0,1],[2,3]]\n0\n3', 'false', true)],
    examples: [{ input: 'n = 3, edges = [[0,1],[1,2],[2,0]], source = 0, destination = 2', output: 'true' }],
    hints: ['Build an adjacency list.', 'BFS/DFS from the source and see whether you reach the destination (or use Union-Find).'],
    companies: ['Amazon', 'Google', 'Microsoft'], tags: ['BFS', 'Union Find', 'Graph'], frequency: 61,
    editorial: {
      intuition: 'Two vertices are connected exactly when they lie in the same connected component — explore from the source and check.',
      approach: 'Adjacency list + iterative DFS with a visited array; return true as soon as the destination is popped.',
      steps: ['Build adjacency lists for both directions.', 'Stack = [source]; visited[source] = true.', 'Pop a node; if it is the destination return true.', 'Push unvisited neighbours.'],
      timeComplexity: 'O(V + E)', spaceComplexity: 'O(V + E)',
      pitfalls: ['The graph is undirected — add both directions.', 'source == destination is trivially true.'],
      js: `function validPath(n, edges, source, destination) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const seen = new Array(n).fill(false), stack = [source];
  seen[source] = true;
  while (stack.length) {
    const x = stack.pop();
    if (x === destination) return true;
    for (const y of adj[x]) if (!seen[y]) { seen[y] = true; stack.push(y); }
  }
  return false;
}`,
      py: `def valid_path(n, edges, source, destination):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    seen = [False] * n
    seen[source] = True
    stack = [source]
    while stack:
        x = stack.pop()
        if x == destination:
            return True
        for y in adj[x]:
            if not seen[y]:
                seen[y] = True
                stack.append(y)
    return False`
    }
  },
  {
    title: 'Rotting Oranges', skill: 'Graphs', difficulty: 'medium',
    description: 'In a grid, `0` is an empty cell, `1` is a fresh orange and `2` is a rotten orange. Every minute, any fresh orange 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes until no fresh orange remains, or `-1` if that is impossible.',
    constraints: 'm == grid.length, n == grid[i].length\n1 <= m, n <= 10\ngrid[i][j] is 0, 1 or 2.',
    sig: { name: 'orangesRotting', params: [['grid', 'int[][]']], returns: 'int' },
    tests: [T('[[2,1,1],[1,1,0],[0,1,1]]', '4'), T('[[2,1,1],[0,1,1],[1,0,1]]', '-1'), T('[[0,2]]', '0', true), T('[[1]]', '-1', true)],
    examples: [{ input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4' }],
    hints: ['Rotting spreads simultaneously from every rotten orange — that is multi-source BFS.', 'Each BFS layer is one minute.'],
    companies: ['Amazon', 'Microsoft', 'Google', 'Flipkart', 'Walmart Labs'], tags: ['BFS', 'Matrix'], frequency: 89,
    editorial: {
      intuition: 'All rotten oranges spread at the same time, so start one BFS with every rotten cell in the queue; the BFS depth is the elapsed time.',
      approach: 'Multi-source BFS. Count fresh oranges; each layer rots the neighbours and decrements the counter. If fresh remain at the end return −1.',
      steps: ['Queue all rotten cells; count fresh.', 'BFS layer by layer; each layer = 1 minute.', 'Rot neighbours (fresh → rotten), fresh--.', 'Return minutes if fresh == 0 else −1.'],
      timeComplexity: 'O(m·n)', spaceComplexity: 'O(m·n)',
      pitfalls: ['Only count a minute for layers that actually rot something.', 'Unreachable fresh oranges make the answer −1.'],
      js: `function orangesRotting(grid) {
  const m = grid.length, n = grid[0].length, queue = [];
  let fresh = 0, minutes = 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] === 2) queue.push([r, c]);
    else if (grid[r][c] === 1) fresh++;
  }
  while (queue.length && fresh > 0) {
    for (let size = queue.length; size > 0; size--) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] === 1) { grid[nr][nc] = 2; fresh--; queue.push([nr, nc]); }
      }
    }
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}`,
      py: `from collections import deque

def oranges_rotting(grid):
    m, n = len(grid), len(grid[0])
    q, fresh, minutes = deque(), 0, 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] == 2:
                q.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    while q and fresh > 0:
        for _ in range(len(q)):
            r, c = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1`
    }
  },
  {
    title: 'Number of Provinces', skill: 'Graphs', difficulty: 'medium',
    description: 'There are `n` cities. Some are connected directly or indirectly; a **province** is a group of directly or indirectly connected cities. Given an `n x n` matrix `isConnected` where `isConnected[i][j] = 1` if city `i` and city `j` are directly connected, return the total number of provinces.',
    constraints: '1 <= n <= 200\nisConnected[i][i] == 1\nisConnected[i][j] == isConnected[j][i]',
    sig: { name: 'findCircleNum', params: [['isConnected', 'int[][]']], returns: 'int' },
    tests: [T('[[1,1,0],[1,1,0],[0,0,1]]', '2'), T('[[1,0,0],[0,1,0],[0,0,1]]', '3'), T('[[1]]', '1', true), T('[[1,0,1],[0,1,0],[1,0,1]]', '2', true)],
    examples: [{ input: 'isConnected = [[1,1,0],[1,1,0],[0,0,1]]', output: '2' }],
    hints: ['Count connected components.', 'DFS from every unvisited city, or use Union-Find and count roots.'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Flipkart'], tags: ['DFS', 'Union Find'], frequency: 73,
    editorial: {
      intuition: 'A province is exactly a connected component of the city graph — count how many times you have to start a fresh DFS.',
      approach: 'Iterate over cities; whenever one is unvisited, increment the counter and DFS across the adjacency matrix marking everything reachable.',
      steps: ['visited = [false]*n; count = 0.', 'For each city i not visited: count++, dfs(i).', 'dfs(i): mark; for each j with isConnected[i][j] == 1 and not visited, dfs(j).'],
      timeComplexity: 'O(n²)', spaceComplexity: 'O(n)',
      pitfalls: ['The input is an adjacency MATRIX, not an edge list.', 'The diagonal (self-connection) must not cause infinite recursion — the visited check handles it.'],
      js: `function findCircleNum(isConnected) {
  const n = isConnected.length, seen = new Array(n).fill(false);
  let count = 0;
  const dfs = (i) => {
    seen[i] = true;
    for (let j = 0; j < n; j++) if (isConnected[i][j] === 1 && !seen[j]) dfs(j);
  };
  for (let i = 0; i < n; i++) if (!seen[i]) { count++; dfs(i); }
  return count;
}`,
      py: `def find_circle_num(isConnected):
    n = len(isConnected)
    seen = [False] * n
    def dfs(i):
        seen[i] = True
        for j in range(n):
            if isConnected[i][j] == 1 and not seen[j]:
                dfs(j)
    count = 0
    for i in range(n):
        if not seen[i]:
            count += 1
            dfs(i)
    return count`
    }
  },

  // ───────────────────────── Dynamic Programming ─────────────────────────
  {
    title: 'House Robber', skill: 'Dynamic Programming', difficulty: 'easy',
    description: 'You are a robber planning to rob houses along a street. Each house has a certain amount of money, but adjacent houses have connected alarms — robbing two adjacent houses triggers the police. Given an integer array `nums` of the money in each house, return the **maximum** amount you can rob without alerting the police.',
    constraints: '1 <= nums.length <= 100\n0 <= nums[i] <= 400',
    sig: { name: 'rob', params: [['nums', 'int[]']], returns: 'int' },
    tests: [T('[1,2,3,1]', '4'), T('[2,7,9,3,1]', '12'), T('[2,1,1,2]', '4', true), T('[5]', '5', true)],
    examples: [{ input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Rob houses 1, 3 and 5: 2 + 9 + 1 = 12.' }],
    hints: ['For each house choose: skip it (keep the previous best) or rob it (previous-previous best + this house).', 'You only need the last two values.'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Goldman Sachs'], tags: ['DP'], frequency: 91,
    editorial: {
      intuition: 'best(i) = max(best(i−1), best(i−2) + nums[i]) — either skip house i or rob it and skip house i−1.',
      approach: 'Rolling two-variable DP over the street.',
      steps: ['prev2 = 0, prev1 = 0.', 'For each x: cur = max(prev1, prev2 + x).', 'prev2 = prev1; prev1 = cur.', 'Return prev1.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['Greedy (always take the largest) fails, e.g. [2,1,1,2].', 'Single-house arrays must work.'],
      js: `function rob(nums) {
  let prev2 = 0, prev1 = 0;
  for (const x of nums) {
    const cur = Math.max(prev1, prev2 + x);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
      py: `def rob(nums):
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1`
    }
  },
  {
    title: 'Unique Paths', skill: 'Dynamic Programming', difficulty: 'medium',
    description: 'A robot sits at the top-left corner of an `m x n` grid and can only move **down** or **right**. How many possible unique paths are there to the bottom-right corner?',
    constraints: '1 <= m, n <= 100\nThe answer fits in a 32-bit signed integer.',
    sig: { name: 'uniquePaths', params: [['m', 'int'], ['n', 'int']], returns: 'int' },
    tests: [T('3\n7', '28'), T('3\n2', '3'), T('1\n1', '1', true), T('7\n3', '28', true)],
    examples: [{ input: 'm = 3, n = 2', output: '3' }],
    hints: ['paths(r, c) = paths(r−1, c) + paths(r, c−1).', 'A single row of the table is enough.'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg'], tags: ['DP', 'Combinatorics'], frequency: 84,
    editorial: {
      intuition: 'Every path into a cell arrives from the cell above or the cell to the left, so path counts add up.',
      approach: 'Rolling 1-D DP: dp[c] += dp[c−1] for each row, starting with all ones on the first row.',
      steps: ['dp = [1] * n.', 'Repeat m − 1 times: for c in 1..n−1: dp[c] += dp[c−1].', 'Return dp[n−1].'],
      timeComplexity: 'O(m·n)', spaceComplexity: 'O(n)',
      pitfalls: ['Combinatorial closed form C(m+n−2, m−1) also works but watch overflow.', 'First row and column are all 1s.'],
      js: `function uniquePaths(m, n) {
  const dp = new Array(n).fill(1);
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) dp[c] += dp[c - 1];
  return dp[n - 1];
}`,
      py: `def unique_paths(m, n):
    dp = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            dp[c] += dp[c - 1]
    return dp[-1]`
    }
  },
  {
    title: 'Longest Common Subsequence', skill: 'Dynamic Programming', difficulty: 'medium',
    description: 'Given two strings `text1` and `text2`, return the length of their **longest common subsequence**. A subsequence keeps the relative order of characters but not necessarily contiguity. If there is no common subsequence, return `0`.',
    constraints: '1 <= text1.length, text2.length <= 1000\nBoth strings consist of lowercase English letters.',
    sig: { name: 'longestCommonSubsequence', params: [['text1', 'String'], ['text2', 'String']], returns: 'int' },
    tests: [T('abcde\nace', '3'), T('abc\nabc', '3'), T('abc\ndef', '0', true), T('ezupkr\nubmrapg', '2', true)],
    examples: [{ input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'The LCS is "ace".' }],
    hints: ['Define dp[i][j] = LCS of the first i and first j characters.', 'If the characters match extend the diagonal; otherwise take the better of dropping either character.'],
    companies: ['Google', 'Amazon', 'Microsoft', 'Adobe', 'Intuit'], tags: ['DP', 'String'], frequency: 81,
    editorial: {
      intuition: 'Compare the last characters: if they match they belong to the LCS; otherwise the answer comes from ignoring one of them.',
      approach: '2-D DP over prefixes: dp[i][j] = dp[i−1][j−1] + 1 on a match, else max(dp[i−1][j], dp[i][j−1]).',
      steps: ['dp is (m+1)×(n+1) of zeros.', 'For each i, j compare text1[i−1] and text2[j−1].', 'Match: diagonal + 1. Otherwise max of up / left.', 'Answer dp[m][n].'],
      timeComplexity: 'O(m·n)', spaceComplexity: 'O(m·n), reducible to O(min(m, n))',
      pitfalls: ['Off-by-one: table indices are 1-based, string indices 0-based.', 'Subsequence ≠ substring — no contiguity requirement.'],
      js: `function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = text1[i - 1] === text2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}`,
      py: `def longest_common_subsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]`
    }
  },
  {
    title: 'Word Break', skill: 'Dynamic Programming', difficulty: 'medium',
    description: 'Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words. The same word may be reused multiple times.',
    constraints: '1 <= s.length <= 300\n1 <= wordDict.length <= 1000\n1 <= wordDict[i].length <= 20\nAll dictionary words are unique.',
    sig: { name: 'wordBreak', params: [['s', 'String'], ['wordDict', 'String[]']], returns: 'boolean' },
    tests: [T('leetcode\n["leet","code"]', 'true'), T('applepenapple\n["apple","pen"]', 'true'), T('catsandog\n["cats","dog","sand","and","cat"]', 'false', true), T('a\n["b"]', 'false', true)],
    examples: [{ input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true' }],
    hints: ['dp[i] = can the first i characters be segmented?', 'dp[i] is true if some j < i has dp[j] true and s[j..i] is in the dictionary.'],
    companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber', 'Razorpay'], tags: ['DP', 'String'], frequency: 93,
    editorial: {
      intuition: 'A prefix is segmentable if it splits into a segmentable shorter prefix plus one dictionary word.',
      approach: 'Boolean DP over prefix lengths using a Set for O(1) word lookups.',
      steps: ['dp[0] = true.', 'For i in 1..n: for j in 0..i−1: if dp[j] and s[j..i] in dict → dp[i] = true; break.', 'Return dp[n].'],
      timeComplexity: 'O(n² · L)', spaceComplexity: 'O(n)',
      pitfalls: ['Break out of the inner loop as soon as dp[i] is true.', 'Limit j to i − maxWordLength for a speed-up.'],
      js: `function wordBreak(s, wordDict) {
  const dict = new Set(wordDict), dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}`,
      py: `def word_break(s, wordDict):
    words = set(wordDict)
    dp = [True] + [False] * len(s)
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]`
    }
  },

  // ───────────────────────── Greedy ─────────────────────────
  {
    title: 'Assign Cookies', skill: 'Greedy Algorithms', difficulty: 'easy',
    description: 'You have children with greed factors `g[i]` (the minimum cookie size that satisfies child `i`) and cookies of sizes `s[j]`. Each child can receive at most one cookie and each cookie can be given to at most one child. Return the **maximum number of content children**.',
    constraints: '1 <= g.length <= 3 * 10^4\n0 <= s.length <= 3 * 10^4\n1 <= g[i], s[j] <= 2^31 - 1',
    sig: { name: 'findContentChildren', params: [['g', 'int[]'], ['s', 'int[]']], returns: 'int' },
    tests: [T('[1,2,3]\n[1,1]', '1'), T('[1,2]\n[1,2,3]', '2'), T('[10,9,8,7]\n[5,6,7,8]', '2', true), T('[1,2,3]\n[]', '0', true)],
    examples: [{ input: 'g = [1,2,3], s = [1,1]', output: '1' }],
    hints: ['Sort both arrays.', 'Give each child the SMALLEST cookie that satisfies them.'],
    companies: ['Amazon', 'Goldman Sachs', 'Microsoft'], tags: ['Greedy', 'Sorting'], frequency: 50,
    editorial: {
      intuition: 'Wasting a big cookie on a small appetite can only hurt, so match the least greedy child with the smallest cookie that works.',
      approach: 'Sort both arrays; two pointers — advance the child pointer whenever a cookie satisfies the current child, always advancing the cookie pointer.',
      steps: ['Sort g and s ascending.', 'child = 0.', 'For each cookie: if s[j] ≥ g[child] then child++.', 'Return child.'],
      timeComplexity: 'O(n log n + m log m)', spaceComplexity: 'O(1) extra',
      pitfalls: ['Stop when children run out.', 'A cookie that is too small for the current child is useless for all later (greedier) children too.'],
      js: `function findContentChildren(g, s) {
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);
  let child = 0;
  for (const cookie of s) if (child < g.length && cookie >= g[child]) child++;
  return child;
}`,
      py: `def find_content_children(g, s):
    g.sort()
    s.sort()
    child = 0
    for cookie in s:
        if child < len(g) and cookie >= g[child]:
            child += 1
    return child`
    }
  },
  {
    title: 'Non-overlapping Intervals', skill: 'Greedy Algorithms', difficulty: 'medium',
    description: 'Given an array of intervals `intervals[i] = [start, end]`, return the **minimum number of intervals you need to remove** so that the rest are non-overlapping. Intervals that only touch at an endpoint (e.g. `[1,2]` and `[2,3]`) do not overlap.',
    constraints: '1 <= intervals.length <= 10^5\nintervals[i].length == 2\n-5 * 10^4 <= start < end <= 5 * 10^4',
    sig: { name: 'eraseOverlapIntervals', params: [['intervals', 'int[][]']], returns: 'int' },
    tests: [T('[[1,2],[2,3],[3,4],[1,3]]', '1'), T('[[1,2],[1,2],[1,2]]', '2'), T('[[1,2],[2,3]]', '0', true), T('[[1,100],[11,22],[1,11],[2,12]]', '2', true)],
    examples: [{ input: 'intervals = [[1,2],[2,3],[3,4],[1,3]]', output: '1', explanation: 'Remove [1,3] and the rest do not overlap.' }],
    hints: ['Think "activity selection": keep as many intervals as possible.', 'Sort by END time and always keep the interval that ends earliest.'],
    companies: ['Amazon', 'Facebook', 'Google', 'Uber', 'Salesforce'], tags: ['Greedy', 'Intervals'], frequency: 78,
    editorial: {
      intuition: 'Removing the fewest intervals = keeping the most. Among conflicting intervals, the one that ends earliest leaves the most room for the future.',
      approach: 'Sort by end. Keep an interval if it starts at or after the last kept end; otherwise count a removal.',
      steps: ['Sort by end ascending.', 'end = −∞, removed = 0.', 'For each interval: if start ≥ end then end = its end else removed++.', 'Return removed.'],
      timeComplexity: 'O(n log n)', spaceComplexity: 'O(1) extra',
      pitfalls: ['Sorting by START gives wrong answers ([1,100] blocks everything).', 'start == end of the last kept interval is allowed.'],
      js: `function eraseOverlapIntervals(intervals) {
  const s = [...intervals].sort((a, b) => a[1] - b[1]);
  let end = -Infinity, removed = 0;
  for (const [a, b] of s) {
    if (a >= end) end = b; else removed++;
  }
  return removed;
}`,
      py: `def erase_overlap_intervals(intervals):
    s = sorted(intervals, key=lambda x: x[1])
    end, removed = float('-inf'), 0
    for a, b in s:
        if a >= end:
            end = b
        else:
            removed += 1
    return removed`
    }
  },
  {
    title: 'Gas Station', skill: 'Greedy Algorithms', difficulty: 'medium',
    description: 'There are `n` gas stations along a circular route, where `gas[i]` is the fuel at station `i` and `cost[i]` is the fuel needed to travel to the next station. Starting with an empty tank, return the index of the station from which you can complete the circuit once **clockwise**, or `-1` if impossible. If a solution exists it is guaranteed to be unique.',
    constraints: 'n == gas.length == cost.length\n1 <= n <= 10^5\n0 <= gas[i], cost[i] <= 10^4',
    sig: { name: 'canCompleteCircuit', params: [['gas', 'int[]'], ['cost', 'int[]']], returns: 'int' },
    tests: [T('[1,2,3,4,5]\n[3,4,5,1,2]', '3'), T('[2,3,4]\n[3,4,3]', '-1'), T('[5,1,2,3,4]\n[4,4,1,5,1]', '4', true), T('[5]\n[4]', '0', true)],
    examples: [{ input: 'gas = [1,2,3,4,5], cost = [3,4,5,1,2]', output: '3' }],
    hints: ['If total gas < total cost the trip is impossible.', 'If you run dry at station i, no start in [start..i] can work — try i + 1.'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg'], tags: ['Greedy'], frequency: 72,
    editorial: {
      intuition: 'If a trip from `start` first fails at station i, every station between start and i would also fail (they would arrive with less fuel), so the next candidate is i + 1.',
      approach: 'One pass tracking total surplus and the current tank. Reset the start whenever the tank goes negative. If total surplus ≥ 0 the recorded start works.',
      steps: ['total = tank = start = 0.', 'For each i: diff = gas[i] − cost[i]; total += diff; tank += diff.', 'If tank < 0: start = i + 1, tank = 0.', 'Return total ≥ 0 ? start : −1.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['Track the global total separately from the running tank.', 'start can only be reset forward — never back.'],
      js: `function canCompleteCircuit(gas, cost) {
  let total = 0, tank = 0, start = 0;
  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) { start = i + 1; tank = 0; }
  }
  return total >= 0 ? start : -1;
}`,
      py: `def can_complete_circuit(gas, cost):
    total = tank = start = 0
    for i in range(len(gas)):
        diff = gas[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1`
    }
  }
];
