/**
 * Editorials — Trees, Graphs, Dynamic Programming, Greedy Algorithms.
 * Tree problems receive a level-order array (null = missing); the reference solutions
 * rebuild linked nodes with `buildTree`, which the starter code also ships as a helper.
 */

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

module.exports = {
  JS_TREE_HELPER,
  PY_TREE_HELPER,

  EDITORIALS: {
    'Maximum Depth of Binary Tree': {
      intuition: 'The depth of a tree is 1 + the deeper of its two subtrees — a natural recursion that bottoms out at an empty node.',
      approach: 'Rebuild the tree, then depth(node) = 0 for null, otherwise 1 + max(depth(left), depth(right)). A BFS level counter works too.',
      steps: ['Rebuild linked nodes from the level-order array.', 'depth(null) = 0.', 'depth(node) = 1 + max(depth(left), depth(right)).', 'Return depth(root).'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h) recursion (h = tree height)',
      pitfalls: ['An empty array means an empty tree — depth 0.', 'Count nodes on the path, not edges.'],
      js: `function maxDepth(tree) {
  const depth = (n) => (n ? 1 + Math.max(depth(n.left), depth(n.right)) : 0);
  return depth(buildTree(tree));
}
${JS_TREE_HELPER}`,
      py: `def max_depth(tree):
    def depth(n):
        return 1 + max(depth(n.left), depth(n.right)) if n else 0
    return depth(build_tree(tree))
${PY_TREE_HELPER}`
    },

    'Validate Binary Search Tree': {
      intuition: 'Checking only parent vs child misses violations deeper in the tree. Every node must lie inside an (exclusive) range inherited from all its ancestors.',
      approach: 'DFS passing (low, high) bounds: a node is valid if low < val < high, then recurse left with high = val and right with low = val.',
      steps: ['valid(node, lo, hi): null → true.', 'Fail if node.val ≤ lo or ≥ hi.', 'Recurse valid(left, lo, val) and valid(right, val, hi).'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h)',
      pitfalls: ['Comparing only immediate children is the classic wrong answer.', 'BSTs here have no duplicates, so bounds are strict.'],
      js: `function isValidBST(tree) {
  const valid = (n, lo, hi) => {
    if (!n) return true;
    if (n.val <= lo || n.val >= hi) return false;
    return valid(n.left, lo, n.val) && valid(n.right, n.val, hi);
  };
  return valid(buildTree(tree), -Infinity, Infinity);
}
${JS_TREE_HELPER}`,
      py: `def is_valid_bst(tree):
    def valid(n, lo, hi):
        if not n:
            return True
        if n.val <= lo or n.val >= hi:
            return False
        return valid(n.left, lo, n.val) and valid(n.right, n.val, hi)
    return valid(build_tree(tree), float('-inf'), float('inf'))
${PY_TREE_HELPER}`
    },

    'Binary Tree Maximum Path Sum': {
      intuition: 'Any path has a highest node. At each node, the best path through it is node + best downward gain from the left + best from the right (ignoring negative gains).',
      approach: 'Post-order DFS returns the best downward path starting at a node (node + max(0, left, right)) while updating a global best with node + left + right.',
      steps: ['gain(node): null → 0.', 'l = max(0, gain(left)), r = max(0, gain(right)).', 'best = max(best, node + l + r).', 'Return node + max(l, r) to the parent.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h)',
      pitfalls: ['Initialise best to −Infinity, not 0 (all-negative trees).', 'A parent can only extend ONE child branch, not both.'],
      js: `function maxPathSum(root) {
  let best = -Infinity;
  const gain = (n) => {
    if (!n) return 0;
    const l = Math.max(0, gain(n.left)), r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(buildTree(root));
  return best;
}
${JS_TREE_HELPER}`,
      py: `def max_path_sum(root):
    best = [float('-inf')]
    def gain(n):
        if not n:
            return 0
        l, r = max(0, gain(n.left)), max(0, gain(n.right))
        best[0] = max(best[0], n.val + l + r)
        return n.val + max(l, r)
    gain(build_tree(root))
    return best[0]
${PY_TREE_HELPER}`
    },

    'Kth Smallest Element in BST': {
      intuition: 'An in-order traversal of a BST visits values in ascending order, so the k-th visited node is the answer.',
      approach: 'Iterative in-order traversal with an explicit stack; stop as soon as the k-th node is popped.',
      steps: ['Walk left pushing nodes onto a stack.', 'Pop, decrement k; if k == 0 return the value.', 'Move to the right child and repeat.'],
      timeComplexity: 'O(h + k)', spaceComplexity: 'O(h)',
      pitfalls: ['k is 1-indexed.', 'Stop early — no need to traverse the whole tree.'],
      js: `function kthSmallest(root, k) {
  let node = buildTree(root);
  const stack = [];
  while (node || stack.length) {
    while (node) { stack.push(node); node = node.left; }
    node = stack.pop();
    if (--k === 0) return node.val;
    node = node.right;
  }
}
${JS_TREE_HELPER}`,
      py: `def kth_smallest(root, k):
    node = build_tree(root)
    stack = []
    while node or stack:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
${PY_TREE_HELPER}`
    },

    'Number of Islands': {
      intuition: 'Each island is one connected component of land cells. Count components by flood-filling every unvisited land cell.',
      approach: 'Scan the grid; on finding a "1", increment the count and DFS to sink (mark visited) every connected land cell.',
      steps: ['For each cell equal to "1": islands++.', 'DFS in 4 directions, setting visited cells to "0".', 'Return islands.'],
      timeComplexity: 'O(m·n)', spaceComplexity: 'O(m·n) worst-case recursion',
      pitfalls: ['Grid cells are the strings "1"/"0", not numbers.', 'Mark visited BEFORE recursing to avoid infinite loops.'],
      js: `function numIslands(grid) {
  const m = grid.length, n = grid[0].length;
  let count = 0;
  const sink = (r, c) => {
    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  };
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (grid[r][c] === '1') { count++; sink(r, c); }
  return count;
}`,
      py: `def num_islands(grid):
    m, n = len(grid), len(grid[0])
    count = 0
    def sink(r, c):
        if r < 0 or c < 0 or r >= m or c >= n or grid[r][c] != '1':
            return
        grid[r][c] = '0'
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1)
    for r in range(m):
        for c in range(n):
            if grid[r][c] == '1':
                count += 1
                sink(r, c)
    return count`
    },

    'Course Schedule': {
      intuition: 'Courses with prerequisites form a directed graph; you can finish them all exactly when that graph has no cycle.',
      approach: "Kahn's algorithm: repeatedly take courses with in-degree 0 (no unmet prerequisites) and remove their outgoing edges. If every course gets taken there is no cycle.",
      steps: ['Build adjacency lists and in-degrees.', 'Queue all courses with in-degree 0.', 'Pop a course, decrement its neighbours\' in-degree, enqueue new zeros.', 'Return taken == numCourses.'],
      timeComplexity: 'O(V + E)', spaceComplexity: 'O(V + E)',
      pitfalls: ['[a, b] means b must be taken BEFORE a — edge b → a.', 'DFS with three colours (unvisited / visiting / done) detects cycles too.'],
      js: `function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let taken = 0;
  while (queue.length) {
    const c = queue.shift();
    taken++;
    for (const nxt of adj[c]) if (--indeg[nxt] === 0) queue.push(nxt);
  }
  return taken === numCourses;
}`,
      py: `from collections import deque

def can_finish(num_courses, prerequisites):
    adj = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(num_courses) if indeg[i] == 0)
    taken = 0
    while q:
        c = q.popleft()
        taken += 1
        for nxt in adj[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return taken == num_courses`
    },

    'Word Ladder': {
      intuition: 'Words are nodes, an edge joins words differing by one letter, and the shortest transformation is the shortest path — a job for BFS.',
      approach: 'BFS from beginWord, generating neighbours by replacing each letter with a–z and keeping only words in the dictionary set. The first time endWord appears is the shortest length.',
      steps: ['Put wordList in a Set; if endWord is missing return 0.', 'BFS queue of (word, steps) starting at (beginWord, 1).', 'For each position try 26 replacements; if the result is in the set, remove it and enqueue.', 'Return steps when endWord is reached, else 0.'],
      timeComplexity: 'O(N · L · 26)', spaceComplexity: 'O(N)',
      pitfalls: ['Remove words from the set when enqueued to avoid revisiting.', 'The answer counts words in the sequence, including both ends.'],
      js: `function ladderLength(beginWord, endWord, wordList) {
  const dict = new Set(wordList);
  if (!dict.has(endWord)) return 0;
  const queue = [[beginWord, 1]];
  while (queue.length) {
    const [word, steps] = queue.shift();
    if (word === endWord) return steps;
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c < 123; c++) {
        const next = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (dict.has(next)) { dict.delete(next); queue.push([next, steps + 1]); }
      }
    }
  }
  return 0;
}`,
      py: `from collections import deque

def ladder_length(begin_word, end_word, word_list):
    words = set(word_list)
    if end_word not in words:
        return 0
    q = deque([(begin_word, 1)])
    while q:
        word, steps = q.popleft()
        if word == end_word:
            return steps
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                nxt = word[:i] + c + word[i + 1:]
                if nxt in words:
                    words.remove(nxt)
                    q.append((nxt, steps + 1))
    return 0`
    },

    'Pacific Atlantic Water Flow': {
      intuition: 'Instead of asking "where does water from each cell go?", flip it: start from each ocean\'s border and climb UPHILL to find every cell that can reach it.',
      approach: 'Two DFS/BFS passes — from the Pacific border (top/left) and Atlantic border (bottom/right) — moving to neighbours with height ≥ current. Answer = cells reached by both.',
      steps: ['Create visited sets for each ocean.', 'Seed DFS from that ocean\'s border cells.', 'Move to neighbours that are not lower.', 'Intersect the two visited sets.'],
      timeComplexity: 'O(m·n)', spaceComplexity: 'O(m·n)',
      pitfalls: ['Move to cells that are ≥, not ≤ (reverse flow).', 'Output order does not matter for the judge.'],
      js: `function pacificAtlantic(heights) {
  const m = heights.length, n = heights[0].length;
  const pac = Array.from({ length: m }, () => new Array(n).fill(false));
  const atl = Array.from({ length: m }, () => new Array(n).fill(false));
  const dfs = (r, c, seen) => {
    seen[r][c] = true;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < m && nc < n && !seen[nr][nc] && heights[nr][nc] >= heights[r][c]) dfs(nr, nc, seen);
    }
  };
  for (let r = 0; r < m; r++) { dfs(r, 0, pac); dfs(r, n - 1, atl); }
  for (let c = 0; c < n; c++) { dfs(0, c, pac); dfs(m - 1, c, atl); }
  const res = [];
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (pac[r][c] && atl[r][c]) res.push([r, c]);
  return res;
}`,
      py: `def pacific_atlantic(heights):
    m, n = len(heights), len(heights[0])
    pac = [[False] * n for _ in range(m)]
    atl = [[False] * n for _ in range(m)]
    def dfs(r, c, seen):
        seen[r][c] = True
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < m and 0 <= nc < n and not seen[nr][nc] and heights[nr][nc] >= heights[r][c]:
                dfs(nr, nc, seen)
    for r in range(m):
        dfs(r, 0, pac)
        dfs(r, n - 1, atl)
    for c in range(n):
        dfs(0, c, pac)
        dfs(m - 1, c, atl)
    return [[r, c] for r in range(m) for c in range(n) if pac[r][c] and atl[r][c]]`
    },

    'Climbing Stairs': {
      intuition: 'To stand on step n you came from step n−1 or n−2, so ways(n) = ways(n−1) + ways(n−2) — the Fibonacci recurrence.',
      approach: 'Bottom-up DP keeping only the last two values.',
      steps: ['a = 1 (ways to reach step 0/1), b = 1.', 'For step 2..n: next = a + b; shift.', 'Return b.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['Base cases: n = 1 → 1, n = 2 → 2.', 'Plain recursion without memoisation is exponential.'],
      js: `function climbStairs(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
      py: `def climb_stairs(n):
    a = b = 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`
    },

    'Longest Increasing Subsequence': {
      intuition: 'Keep, for each possible length, the smallest tail value of any increasing subsequence of that length — smaller tails are easier to extend.',
      approach: 'Patience sorting: maintain a sorted `tails` array. For each x binary-search the first tail ≥ x and overwrite it (or append). The array length is the answer.',
      steps: ['tails = [].', 'For each x: find leftmost index i with tails[i] ≥ x.', 'If i == tails.length append, else tails[i] = x.', 'Return tails.length.'],
      timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)',
      pitfalls: ['`tails` is NOT the subsequence itself — only its length is meaningful.', 'Use lower-bound (≥) for strictly increasing subsequences.'],
      js: `function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }
    tails[lo] = x;
  }
  return tails.length;
}`,
      py: `import bisect

def length_of_lis(nums):
    tails = []
    for x in nums:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`
    },

    'Edit Distance': {
      intuition: 'The cost of converting the first i letters of A into the first j letters of B depends only on three smaller sub-problems: delete, insert or replace.',
      approach: 'DP table dp[i][j] = min edits for prefixes. If the last characters match copy dp[i−1][j−1]; otherwise 1 + min(dp[i−1][j], dp[i][j−1], dp[i−1][j−1]).',
      steps: ['dp[i][0] = i, dp[0][j] = j.', 'For i, j: if a[i−1] == b[j−1] dp = dp[i−1][j−1].', 'Else dp = 1 + min(delete, insert, replace).', 'Answer dp[m][n].'],
      timeComplexity: 'O(m·n)', spaceComplexity: 'O(m·n), reducible to O(n)',
      pitfalls: ['Off-by-one between string index (i−1) and table index (i).', 'Initialise the first row/column with the base costs.'],
      js: `function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = word1[i - 1] === word2[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}`,
      py: `def min_distance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]`
    },

    'Coin Change': {
      intuition: 'The fewest coins for amount a is 1 + the fewest for a − c, minimised over every coin c. Greedy fails (coins [1,5,11], amount 15), so use DP.',
      approach: 'Bottom-up DP over amounts 0..target with dp[0] = 0 and dp[a] = min(dp[a − c] + 1).',
      steps: ['dp = [0, ∞, ∞, …].', 'For a from 1..amount, for each coin c ≤ a: dp[a] = min(dp[a], dp[a − c] + 1).', 'Return dp[amount] or −1 if still ∞.'],
      timeComplexity: 'O(amount · coins)', spaceComplexity: 'O(amount)',
      pitfalls: ['Use Infinity (not a magic number) and convert to −1 at the end.', 'amount = 0 needs 0 coins.'],
      js: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      py: `def coin_change(coins, amount):
    dp = [0] + [float('inf')] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return -1 if dp[amount] == float('inf') else dp[amount]`
    },

    'Partition Equal Subset Sum': {
      intuition: 'Splitting into two equal halves is possible exactly when some subset sums to total/2 — a 0/1 knapsack decision problem.',
      approach: 'If the total is odd return false. Otherwise DP over reachable sums: dp[s] is true if some subset reaches s; iterate sums downward for each number so it is used once.',
      steps: ['total = sum; if odd → false. target = total/2.', 'dp[0] = true.', 'For each x: for s from target down to x: dp[s] ||= dp[s − x].', 'Return dp[target].'],
      timeComplexity: 'O(n · target)', spaceComplexity: 'O(target)',
      pitfalls: ['Iterate sums DOWNWARD or a number gets reused.', 'Odd totals short-circuit immediately.'],
      js: `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2, dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums) for (let s = target; s >= x; s--) if (dp[s - x]) dp[s] = true;
  return dp[target];
}`,
      py: `def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [True] + [False] * target
    for x in nums:
        for s in range(target, x - 1, -1):
            if dp[s - x]:
                dp[s] = True
    return dp[target]`
    },

    'Best Time to Buy and Sell Stock': {
      intuition: 'The best profit selling on day i uses the cheapest price seen before day i.',
      approach: 'One pass tracking the minimum price so far and the best profit (price − minSoFar).',
      steps: ['minPrice = ∞, best = 0.', 'For each price: best = max(best, price − minPrice).', 'minPrice = min(minPrice, price).'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['You must buy before you sell — update min AFTER computing profit for the day.', 'Return 0 when prices only fall.'],
      js: `function maxProfit(prices) {
  let min = Infinity, best = 0;
  for (const p of prices) {
    best = Math.max(best, p - min);
    min = Math.min(min, p);
  }
  return best;
}`,
      py: `def max_profit(prices):
    lo, best = float('inf'), 0
    for p in prices:
        best = max(best, p - lo)
        lo = min(lo, p)
    return best`
    },

    'Jump Game': {
      intuition: 'You only need to know the farthest index reachable so far — if you ever stand beyond it, you are stuck.',
      approach: 'Greedy: sweep left to right maintaining maxReach = max(maxReach, i + nums[i]); fail if i exceeds maxReach.',
      steps: ['reach = 0.', 'For each i: if i > reach return false.', 'reach = max(reach, i + nums[i]).', 'Return true.'],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
      pitfalls: ['Check i > reach BEFORE extending reach.', 'A 0 in the middle is only fatal if reach cannot jump over it.'],
      js: `function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}`,
      py: `def can_jump(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True`
    },

    'Minimum Number of Platforms': {
      intuition: 'The platforms needed equals the maximum number of trains present at the station at the same instant.',
      approach: 'Sort arrivals and departures separately, then sweep with two pointers counting overlaps: an arrival before the next departure adds a train, otherwise one leaves.',
      steps: ['Sort both arrays.', 'i, j = 0; cur = best = 0.', 'If arr[i] ≤ dep[j]: cur++, i++ else cur--, j++.', 'best = max(best, cur).'],
      timeComplexity: 'O(n log n)', spaceComplexity: 'O(1) extra',
      pitfalls: ['A train arriving exactly when another departs needs a platform (use ≤).', 'Sort numerically, not lexicographically.'],
      js: `function minPlatforms(arrivals, departures) {
  const a = [...arrivals].sort((x, y) => x - y), d = [...departures].sort((x, y) => x - y);
  let i = 0, j = 0, cur = 0, best = 0;
  while (i < a.length) {
    if (a[i] <= d[j]) { cur++; i++; best = Math.max(best, cur); }
    else { cur--; j++; }
  }
  return best;
}`,
      py: `def min_platforms(arrivals, departures):
    a, d = sorted(arrivals), sorted(departures)
    i = j = cur = best = 0
    while i < len(a):
        if a[i] <= d[j]:
            cur += 1
            i += 1
            best = max(best, cur)
        else:
            cur -= 1
            j += 1
    return best`
    }
  }
};
