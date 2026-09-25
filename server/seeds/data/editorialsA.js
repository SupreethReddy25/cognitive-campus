/**
 * Editorials — Arrays, Strings, Hashing, Recursion.
 * `js` / `py` are reference solutions; seeds/verifyProblems.js runs them against every test case,
 * so an editorial that does not pass its own problem cannot ship.
 */

module.exports = {
  'Two Sum': {
    intuition: 'For every number x you need its partner target − x. Checking every pair is O(n²); remembering what you have already seen turns each lookup into O(1).',
    approach: 'One pass with a hash map from value → index. For each element, look up target − nums[i] before inserting nums[i], so you never pair an element with itself.',
    steps: ['Create an empty map value → index.', 'For each index i, compute need = target − nums[i].', 'If need is in the map, return [map[need], i].', 'Otherwise store nums[i] → i and continue.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    pitfalls: ['Insert AFTER the lookup, otherwise [3] with target 6 pairs 3 with itself.', 'Return indices, not values.'],
    js: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    py: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []`
  },

  'Maximum Subarray': {
    intuition: 'A running sum that has gone negative can only hurt whatever comes next — throw it away and start fresh at the current element.',
    approach: "Kadane's algorithm: keep the best sum ending at the current index (extend the previous run or restart) and a global maximum.",
    steps: ['best = cur = nums[0].', 'For each next x: cur = max(x, cur + x).', 'best = max(best, cur).', 'Return best.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    pitfalls: ['Initialise with nums[0], not 0 — all-negative arrays must return the largest negative.', 'Do not reset cur to 0; reset it to x.'],
    js: `function maxSubArray(nums) {
  let best = nums[0], cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
    py: `def max_sub_array(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best`
  },

  'Trapping Rain Water': {
    intuition: 'Water above a bar is limited by the shorter of the tallest bars on its left and right: min(maxLeft, maxRight) − height.',
    approach: 'Two pointers moving inward. Whichever side has the smaller running maximum is the limiting side, so its water level is already known — settle that bar and advance.',
    steps: ['left = 0, right = n−1, leftMax = rightMax = 0.', 'If height[left] < height[right], update leftMax and add leftMax − height[left]; move left.', 'Else do the mirror on the right.', 'Stop when the pointers meet.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    pitfalls: ['Update the max BEFORE computing the water, so a bar never holds negative water.', 'Compare heights, not maxima, to choose the side.'],
    js: `function trap(height) {
  let l = 0, r = height.length - 1, lm = 0, rm = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lm = Math.max(lm, height[l]);
      water += lm - height[l++];
    } else {
      rm = Math.max(rm, height[r]);
      water += rm - height[r--];
    }
  }
  return water;
}`,
    py: `def trap(height):
    l, r = 0, len(height) - 1
    lm = rm = water = 0
    while l < r:
        if height[l] < height[r]:
            lm = max(lm, height[l])
            water += lm - height[l]
            l += 1
        else:
            rm = max(rm, height[r])
            water += rm - height[r]
            r -= 1
    return water`
  },

  'Product of Array Except Self': {
    intuition: 'The answer at i is (product of everything left of i) × (product of everything right of i) — no division needed.',
    approach: 'Fill the output with prefix products in a forward pass, then multiply in suffix products in a backward pass using a single running variable.',
    steps: ['out[i] = product of nums[0..i−1] (prefix pass).', 'Walk from the right with suffix = 1.', 'out[i] *= suffix; then suffix *= nums[i].'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1) extra (output excluded)',
    pitfalls: ['Zeros break the divide-by-total approach — prefix/suffix handles them naturally.', 'Update suffix AFTER using it for index i.'],
    js: `function productExceptSelf(nums) {
  const n = nums.length, out = new Array(n).fill(1);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= suffix;
    suffix *= nums[i];
  }
  return out;
}`,
    py: `def product_except_self(nums):
    n = len(nums)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * nums[i - 1]
    suffix = 1
    for i in range(n - 1, -1, -1):
        out[i] *= suffix
        suffix *= nums[i]
    return out`
  },

  'Container With Most Water': {
    intuition: 'Area = width × the shorter wall. Starting with the widest container, the only way to improve is to find a taller shorter-wall — so discard the shorter wall.',
    approach: 'Two pointers at both ends. Compute the area, then move the pointer at the shorter wall inward (moving the taller one can never help).',
    steps: ['l = 0, r = n−1, best = 0.', 'best = max(best, (r−l) × min(h[l], h[r])).', 'Advance whichever pointer sits at the smaller height.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    pitfalls: ['Width shrinks every step, so only a taller shorter-wall can beat the current best.', 'Use min of the two heights, not max.'],
    js: `function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, (r - l) * Math.min(height[l], height[r]));
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}`,
    py: `def max_area(height):
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best`
  },

  '3Sum': {
    intuition: 'Sorting turns "find three numbers summing to 0" into "fix one, then two-pointer the rest" and makes duplicates adjacent so they are easy to skip.',
    approach: 'Sort. For each i (skipping duplicates), run a two-pointer search on the suffix for pairs summing to −nums[i], skipping duplicate pair values after each hit.',
    steps: ['Sort nums.', 'For each i with nums[i] ≤ 0 and nums[i] ≠ nums[i−1]: l = i+1, r = n−1.', 'Move l/r by comparing the sum with 0.', 'On a hit, record the triple and skip equal values on both sides.'],
    timeComplexity: 'O(n²)', spaceComplexity: 'O(1) extra (sorting aside)',
    pitfalls: ['Forgetting to skip duplicates yields repeated triples.', 'Sort numerically — the default JS sort is lexicographic.'],
    js: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l + 1]) l++;
        while (l < r && nums[r] === nums[r - 1]) r--;
        l++; r--;
      }
    }
  }
  return res;
}`,
    py: `def three_sum(nums):
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                while l < r and nums[r] == nums[r - 1]:
                    r -= 1
                l += 1
                r -= 1
    return res`
  },

  'Valid Anagram': {
    intuition: 'Two strings are anagrams exactly when every character appears the same number of times in both.',
    approach: 'Count characters of s up, characters of t down; if the lengths match and every count returns to zero, they are anagrams.',
    steps: ['If lengths differ return false.', 'Increment counts for s, decrement for t.', 'Any non-zero count means false.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1) — at most 26 (or alphabet-size) keys',
    pitfalls: ['Check lengths first — it is a free early exit.', 'Sorting both strings also works (O(n log n)) but is slower.'],
    js: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (const c of s) count[c] = (count[c] || 0) + 1;
  for (const c of t) {
    if (!count[c]) return false;
    count[c]--;
  }
  return true;
}`,
    py: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.get(c, 0) + 1
    for c in t:
        if not count.get(c):
            return False
        count[c] -= 1
    return True`
  },

  'Longest Substring Without Repeating Characters': {
    intuition: 'A window [l, r] is valid while it has no repeats. When a repeat appears, you only need to slide the left edge just past the previous occurrence.',
    approach: 'Sliding window with a map char → last index. When s[r] was seen inside the window, jump l to lastIndex + 1. Track the largest window.',
    steps: ['l = 0, best = 0, map = {}.', 'For each r: if s[r] in map and map[s[r]] ≥ l then l = map[s[r]] + 1.', 'map[s[r]] = r; best = max(best, r − l + 1).'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(min(n, alphabet))',
    pitfalls: ['Only move l forward — a stale index left of the window must not pull it back.', 'The window length is r − l + 1.'],
    js: `function lengthOfLongestSubstring(s) {
  const last = new Map();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    if (last.has(s[r]) && last.get(s[r]) >= l) l = last.get(s[r]) + 1;
    last.set(s[r], r);
    best = Math.max(best, r - l + 1);
  }
  return best;
}`,
    py: `def length_of_longest_substring(s):
    last = {}
    l = best = 0
    for r, c in enumerate(s):
        if c in last and last[c] >= l:
            l = last[c] + 1
        last[c] = r
        best = max(best, r - l + 1)
    return best`
  },

  'Minimum Window Substring': {
    intuition: 'Grow the window until it covers every needed character, then shrink from the left as far as it stays valid — the shortest valid window ends up recorded.',
    approach: 'Sliding window with a need-count map and a "missing" counter. Expand right; when missing hits 0 shrink left while still valid, recording the best window.',
    steps: ['Count characters of t in need; missing = len(t).', 'Expand r: if need[s[r]] > 0 decrement missing; then decrement need[s[r]].', 'While missing == 0: record window, then re-add s[l] to need (missing++ if it becomes positive) and l++.'],
    timeComplexity: 'O(|s| + |t|)', spaceComplexity: 'O(alphabet)',
    pitfalls: ['Track "missing" (distinct satisfied chars), not the map size, to test validity in O(1).', 'Return "" when no window exists.'],
    js: `function minWindow(s, t) {
  const need = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  let missing = t.length, l = 0, bestL = 0, bestLen = Infinity;
  for (let r = 0; r < s.length; r++) {
    if (need[s[r]] > 0) missing--;
    need[s[r]] = (need[s[r]] || 0) - 1;
    while (missing === 0) {
      if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
      need[s[l]]++;
      if (need[s[l]] > 0) missing++;
      l++;
    }
  }
  return bestLen === Infinity ? '' : s.slice(bestL, bestL + bestLen);
}`,
    py: `def min_window(s, t):
    need = {}
    for c in t:
        need[c] = need.get(c, 0) + 1
    missing, l, best_l, best_len = len(t), 0, 0, float('inf')
    for r, c in enumerate(s):
        if need.get(c, 0) > 0:
            missing -= 1
        need[c] = need.get(c, 0) - 1
        while missing == 0:
            if r - l + 1 < best_len:
                best_len, best_l = r - l + 1, l
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1
            l += 1
    return '' if best_len == float('inf') else s[best_l:best_l + best_len]`
  },

  'Longest Palindromic Substring': {
    intuition: 'Every palindrome mirrors around a centre. There are only 2n − 1 centres (n characters + n − 1 gaps), and expanding each costs O(n).',
    approach: 'Expand around every centre for odd and even lengths, remembering the longest span found.',
    steps: ['For each i, expand (i, i) and (i, i+1) while the ends match.', 'Compare each palindrome length with the best so far.', 'Return the slice of the best span.'],
    timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
    pitfalls: ['Handle even-length palindromes with a second expansion.', 'Store start and length, not repeated substrings.'],
    js: `function longestPalindrome(s) {
  let start = 0, len = 0;
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    if (r - l - 1 > len) { len = r - l - 1; start = l + 1; }
  };
  for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); }
  return s.slice(start, start + len);
}`,
    py: `def longest_palindrome(s):
    start = length = 0
    def expand(l, r):
        nonlocal start, length
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        if r - l - 1 > length:
            length, start = r - l - 1, l + 1
    for i in range(len(s)):
        expand(i, i)
        expand(i, i + 1)
    return s[start:start + length]`
  },

  'Contains Duplicate': {
    intuition: 'A duplicate exists exactly when the set of values is smaller than the array.',
    approach: 'Insert elements into a hash set and bail out the first time one is already there.',
    steps: ['Create an empty set.', 'For each x: if x is in the set return true.', 'Add x. If the loop ends return false.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    pitfalls: ['Sorting first is O(n log n) but O(1) extra space — mention the trade-off in an interview.'],
    js: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}`,
    py: `def contains_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False`
  },

  'Group Anagrams': {
    intuition: 'Anagrams share an identical "signature" — for example their letters sorted. Use that signature as a hash key.',
    approach: 'Map each word to its sorted-letters key and collect words with equal keys into buckets.',
    steps: ['Create map key → list.', 'For each word compute key = sorted letters joined.', 'Push the word into map[key]; return all bucket values.'],
    timeComplexity: 'O(n · k log k)', spaceComplexity: 'O(n · k)',
    pitfalls: ['A 26-length count tuple as key gives O(n·k) if sorting is too slow.', 'Output order is irrelevant — the judge compares groups as sets.'],
    js: `function groupAnagrams(strs) {
  const map = new Map();
  for (const w of strs) {
    const key = w.split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(w);
  }
  return [...map.values()];
}`,
    py: `def group_anagrams(strs):
    groups = {}
    for w in strs:
        groups.setdefault(''.join(sorted(w)), []).append(w)
    return list(groups.values())`
  },

  'Longest Consecutive Sequence': {
    intuition: 'Only a number with no predecessor (x − 1 absent) can start a run, so count forward from starts only — every element is visited at most twice.',
    approach: 'Put everything in a set. For each x whose x − 1 is not in the set, walk x, x+1, x+2… while present and track the longest walk.',
    steps: ['Build a set of nums.', 'For x in set: skip if x − 1 in set.', 'Otherwise count how far x, x+1, … extend.', 'Keep the maximum.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    pitfalls: ['Iterate the set, not the array, so duplicates do not re-walk runs.', 'Sorting works in O(n log n) but the set solution meets the O(n) requirement.'],
    js: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue;
    let y = x;
    while (set.has(y + 1)) y++;
    best = Math.max(best, y - x + 1);
  }
  return best;
}`,
    py: `def longest_consecutive(nums):
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 in s:
            continue
        y = x
        while y + 1 in s:
            y += 1
        best = max(best, y - x + 1)
    return best`
  },

  'Power of Three': {
    intuition: 'A power of three can be divided by three repeatedly until it reaches exactly 1; anything else leaves a remainder along the way.',
    approach: 'Strip factors of three while divisible. The number is a power of three iff you end at 1 (and it started positive).',
    steps: ['If n ≤ 0 return false.', 'While n % 3 == 0: n /= 3.', 'Return n == 1.'],
    timeComplexity: 'O(log₃ n)', spaceComplexity: 'O(1)',
    pitfalls: ['0 and negatives are not powers of three.', 'A neat O(1) trick: 3¹⁹ = 1162261467 is the largest power in int range, so it must be divisible by n.'],
    js: `function isPowerOfThree(n) {
  if (n <= 0) return false;
  while (n % 3 === 0) n = n / 3;
  return n === 1;
}`,
    py: `def is_power_of_three(n):
    if n <= 0:
        return False
    while n % 3 == 0:
        n //= 3
    return n == 1`
  },

  'Generate Parentheses': {
    intuition: 'A string is valid if at every prefix the number of ")" never exceeds "(" and the totals match. Build only strings that keep that invariant.',
    approach: 'Backtracking: add "(" while opens < n, add ")" while closes < opens. When length reaches 2n, record it.',
    steps: ['dfs(cur, open, close).', 'If open < n: dfs(cur + "(", open + 1, close).', 'If close < open: dfs(cur + ")", open, close + 1).', 'Base case: cur.length == 2n.'],
    timeComplexity: 'O(4ⁿ / √n) — the n-th Catalan number of results', spaceComplexity: 'O(n) recursion depth',
    pitfalls: ['Never generate invalid strings and filter — prune while building.'],
    js: `function generateParenthesis(n) {
  const res = [];
  const dfs = (cur, open, close) => {
    if (cur.length === 2 * n) { res.push(cur); return; }
    if (open < n) dfs(cur + '(', open + 1, close);
    if (close < open) dfs(cur + ')', open, close + 1);
  };
  dfs('', 0, 0);
  return res;
}`,
    py: `def generate_parenthesis(n):
    res = []
    def dfs(cur, open_, close):
        if len(cur) == 2 * n:
            res.append(cur)
            return
        if open_ < n:
            dfs(cur + '(', open_ + 1, close)
        if close < open_:
            dfs(cur + ')', open_, close + 1)
    dfs('', 0, 0)
    return res`
  },

  'N-Queens': {
    intuition: 'Place one queen per row. A placement is safe if its column and both diagonals are free — track those in three sets for O(1) checks.',
    approach: 'Backtracking row by row, with sets for used columns, "/" diagonals (r + c) and "\\" diagonals (r − c). Undo the choice after recursing.',
    steps: ['solve(row): if row == n record the board.', 'For each column c: skip if c, r+c or r−c is used.', 'Place, recurse to row+1, then remove.'],
    timeComplexity: 'O(n!) worst case, heavily pruned', spaceComplexity: 'O(n)',
    pitfalls: ['r − c can be negative — use a Set/dict, not an array index.', 'Build each board string from the column positions at the leaf.'],
    js: `function solveNQueens(n) {
  const res = [], cols = new Set(), d1 = new Set(), d2 = new Set(), pos = [];
  const solve = (r) => {
    if (r === n) {
      res.push(pos.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r + c) || d2.has(r - c)) continue;
      cols.add(c); d1.add(r + c); d2.add(r - c); pos.push(c);
      solve(r + 1);
      cols.delete(c); d1.delete(r + c); d2.delete(r - c); pos.pop();
    }
  };
  solve(0);
  return res;
}`,
    py: `def solve_n_queens(n):
    res, cols, d1, d2, pos = [], set(), set(), set(), []
    def solve(r):
        if r == n:
            res.append(['.' * c + 'Q' + '.' * (n - c - 1) for c in pos])
            return
        for c in range(n):
            if c in cols or (r + c) in d1 or (r - c) in d2:
                continue
            cols.add(c); d1.add(r + c); d2.add(r - c); pos.append(c)
            solve(r + 1)
            cols.remove(c); d1.remove(r + c); d2.remove(r - c); pos.pop()
    solve(0)
    return res`
  },

  'Subsets': {
    intuition: 'Every element is either in a subset or not — 2ⁿ independent choices. Backtracking enumerates them in a tree.',
    approach: 'Iterate a start index: at each node record the current subset, then extend it with every later element.',
    steps: ['dfs(start, cur): push a copy of cur to results.', 'For i from start: cur.push(nums[i]); dfs(i+1); cur.pop().'],
    timeComplexity: 'O(n · 2ⁿ)', spaceComplexity: 'O(n) recursion',
    pitfalls: ['Push a COPY of the current subset, not the live array.', 'Use i + 1 (not start + 1) when recursing so elements are not reused.'],
    js: `function subsets(nums) {
  const res = [];
  const dfs = (start, cur) => {
    res.push([...cur]);
    for (let i = start; i < nums.length; i++) {
      cur.push(nums[i]);
      dfs(i + 1, cur);
      cur.pop();
    }
  };
  dfs(0, []);
  return res;
}`,
    py: `def subsets(nums):
    res = []
    def dfs(start, cur):
        res.append(cur[:])
        for i in range(start, len(nums)):
            cur.append(nums[i])
            dfs(i + 1, cur)
            cur.pop()
    dfs(0, [])
    return res`
  },

  'Combination Sum': {
    intuition: 'Because a number may be reused, recurse without advancing the index after choosing it; move on only when you decide to stop using it.',
    approach: 'Sort candidates, DFS with a remaining target. Stop a branch when the candidate exceeds the remainder (sorted ⇒ all later ones do too).',
    steps: ['Sort candidates.', 'dfs(start, remain, cur): if remain == 0 record.', 'For i ≥ start: break if candidates[i] > remain.', 'Choose, dfs(i, remain − c), un-choose.'],
    timeComplexity: 'O(N^(T/M)) exponential in target / min candidate', spaceComplexity: 'O(T/M) depth',
    pitfalls: ['Recurse with i (not i+1) to allow reuse — but start from i to avoid permutations.'],
    js: `function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [];
  const dfs = (start, remain, cur) => {
    if (remain === 0) { res.push([...cur]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) break;
      cur.push(candidates[i]);
      dfs(i, remain - candidates[i], cur);
      cur.pop();
    }
  };
  dfs(0, target, []);
  return res;
}`,
    py: `def combination_sum(candidates, target):
    candidates.sort()
    res = []
    def dfs(start, remain, cur):
        if remain == 0:
            res.append(cur[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remain:
                break
            cur.append(candidates[i])
            dfs(i, remain - candidates[i], cur)
            cur.pop()
    dfs(0, target, [])
    return res`
  },

  'Word Search': {
    intuition: 'Try every cell as a start, then DFS along matching letters. Mark cells as visited while on the current path and restore them on backtrack.',
    approach: 'DFS with the index of the next letter to match; mutate the board cell to "#" while it is on the path, restoring afterwards.',
    steps: ['For each cell run dfs(r, c, 0).', 'If k == word.length return true.', 'Reject out-of-bounds / mismatched / visited cells.', 'Mark, explore 4 neighbours, unmark.'],
    timeComplexity: 'O(m·n·3^L)', spaceComplexity: 'O(L) recursion',
    pitfalls: ['Restore the cell after exploring or later starts see a corrupted board.', 'Check bounds before reading the cell.'],
    js: `function exist(board, word) {
  const m = board.length, n = board[0].length;
  const dfs = (r, c, k) => {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== word[k]) return false;
    const tmp = board[r][c];
    board[r][c] = '#';
    const ok = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = tmp;
    return ok;
  };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;
  return false;
}`,
    py: `def exist(board, word):
    m, n = len(board), len(board[0])
    def dfs(r, c, k):
        if k == len(word):
            return True
        if r < 0 or c < 0 or r >= m or c >= n or board[r][c] != word[k]:
            return False
        tmp = board[r][c]
        board[r][c] = '#'
        ok = dfs(r + 1, c, k + 1) or dfs(r - 1, c, k + 1) or dfs(r, c + 1, k + 1) or dfs(r, c - 1, k + 1)
        board[r][c] = tmp
        return ok
    return any(dfs(r, c, 0) for r in range(m) for c in range(n))`
  }
};
