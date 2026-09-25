/**
 * Editorials — Sorting, Searching, Linked Lists, Stacks & Queues.
 */

module.exports = {
  'Sort Colors': {
    intuition: 'Only three values exist, so a full sort is overkill. Partition the array into three zones — 0s, 1s, 2s — in a single pass.',
    approach: 'Dutch national flag: keep pointers low (next slot for 0), high (next slot for 2) and mid (scanner). Swap 0s to the front and 2s to the back.',
    steps: ['low = mid = 0, high = n−1.', 'If nums[mid] == 0: swap with low; low++, mid++.', 'If == 1: mid++.', 'If == 2: swap with high; high-- (do NOT advance mid).'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    pitfalls: ['After swapping with high, the swapped-in value is unexamined — do not move mid.', 'Return the mutated array for this judge.'],
    js: `function sortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) { [nums[low], nums[mid]] = [nums[mid], nums[low]]; low++; mid++; }
    else if (nums[mid] === 1) mid++;
    else { [nums[mid], nums[high]] = [nums[high], nums[mid]]; high--; }
  }
  return nums;
}`,
    py: `def sort_colors(nums):
    low = mid = 0
    high = len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
    return nums`
  },

  'Merge Intervals': {
    intuition: 'After sorting by start time, overlapping intervals are neighbours — each new interval either extends the last merged one or begins a new one.',
    approach: 'Sort by start. Walk through: if the current start ≤ the last merged end, extend the end to the max; else push a new interval.',
    steps: ['Sort intervals by start.', 'Seed the result with the first interval.', 'For each next interval compare start with result.last.end.', 'Merge (max of ends) or append.'],
    timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)',
    pitfalls: ['Extend with max(end, curEnd) — a contained interval must not shrink the end.', 'Touching intervals ([1,2],[2,3]) merge because start ≤ end.'],
    js: `function merge(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0].slice()];
  for (let i = 1; i < intervals.length; i++) {
    const last = res[res.length - 1];
    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else res.push(intervals[i].slice());
  }
  return res;
}`,
    py: `def merge(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    res = [intervals[0][:]]
    for s, e in intervals[1:]:
        if s <= res[-1][1]:
            res[-1][1] = max(res[-1][1], e)
        else:
            res.append([s, e])
    return res`
  },

  'Kth Largest Element in an Array': {
    intuition: 'The k-th largest is the element that would sit at index n − k in sorted order — you do not need to sort everything to find it.',
    approach: 'Quickselect: partition around a pivot and recurse into only the side that contains index n − k. Expected O(n).',
    steps: ['target = n − k.', 'Partition the range around a pivot (Lomuto).', 'If the pivot lands on target return it; else narrow to the correct half.'],
    timeComplexity: 'O(n) average, O(n²) worst case', spaceComplexity: 'O(1)',
    pitfalls: ['A min-heap of size k is a safe O(n log k) alternative.', 'Randomise the pivot to dodge adversarial inputs.'],
    js: `function findKthLargest(nums, k) {
  const target = nums.length - k;
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const p = lo + Math.floor(Math.random() * (hi - lo + 1));
    [nums[p], nums[hi]] = [nums[hi], nums[p]];
    const pivot = nums[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) if (nums[j] < pivot) { [nums[i], nums[j]] = [nums[j], nums[i]]; i++; }
    [nums[i], nums[hi]] = [nums[hi], nums[i]];
    if (i === target) return nums[i];
    if (i < target) lo = i + 1; else hi = i - 1;
  }
}`,
    py: `import random

def find_kth_largest(nums, k):
    target = len(nums) - k
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        p = random.randint(lo, hi)
        nums[p], nums[hi] = nums[hi], nums[p]
        pivot = nums[hi]
        i = lo
        for j in range(lo, hi):
            if nums[j] < pivot:
                nums[i], nums[j] = nums[j], nums[i]
                i += 1
        nums[i], nums[hi] = nums[hi], nums[i]
        if i == target:
            return nums[i]
        if i < target:
            lo = i + 1
        else:
            hi = i - 1`
  },

  'Binary Search': {
    intuition: 'In a sorted array every comparison lets you discard half of what remains.',
    approach: 'Maintain [lo, hi]; compare the middle element with the target and move the boundary that cannot contain it.',
    steps: ['lo = 0, hi = n−1.', 'mid = lo + (hi − lo) / 2.', 'Return mid if equal; lo = mid+1 if smaller; hi = mid−1 if larger.', 'Return −1 when lo > hi.'],
    timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    pitfalls: ['Use lo + (hi − lo)/2 to avoid integer overflow in typed languages.', 'Loop condition is lo <= hi — otherwise a single remaining element is skipped.'],
    js: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}`,
    py: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`
  },

  'Search in Rotated Sorted Array': {
    intuition: 'Cut a rotated sorted array anywhere and at least one half is still perfectly sorted. Identify that half, check whether the target lies in it, and discard the other.',
    approach: 'Binary search; at each step decide which half is sorted (nums[lo] ≤ nums[mid]) and whether the target falls inside its range.',
    steps: ['Compute mid; return if it matches.', 'If left half sorted and lo ≤ target < mid: hi = mid−1, else lo = mid+1.', 'Otherwise the right half is sorted: mirror the test.'],
    timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    pitfalls: ['Use ≤ when testing "left half sorted" — it handles the lo == mid case.', 'Range checks must be inclusive on the sorted side only.'],
    js: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
}`,
    py: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`
  },

  'Find Minimum in Rotated Sorted Array': {
    intuition: 'The minimum is the rotation point. Comparing the middle with the right end tells you which side of the break you are on.',
    approach: 'Binary search: if nums[mid] > nums[hi] the minimum is right of mid; otherwise it is at mid or left.',
    steps: ['lo = 0, hi = n−1.', 'While lo < hi: mid = (lo+hi)/2.', 'If nums[mid] > nums[hi]: lo = mid+1 else hi = mid.', 'Return nums[lo].'],
    timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    pitfalls: ['Compare with nums[hi], not nums[lo] — it also handles an un-rotated array.', 'Use hi = mid (not mid−1) so the minimum is never skipped.'],
    js: `function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
  }
  return nums[lo];
}`,
    py: `def find_min(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]`
  },

  'Median of Two Sorted Arrays': {
    intuition: 'The median splits the combined data into two equal halves. Binary-search HOW MANY elements of the smaller array belong to the left half — the rest is forced.',
    approach: 'Binary search a partition i in the shorter array; j = (m+n+1)/2 − i in the longer. The partition is right when maxLeftA ≤ minRightB and maxLeftB ≤ minRightA.',
    steps: ['Ensure A is the shorter array.', 'Search i in [0, m]; compute j.', 'Compare the four boundary values (use ±Infinity at the edges).', 'Adjust i; when valid return the median from the boundary values.'],
    timeComplexity: 'O(log min(m, n))', spaceComplexity: 'O(1)',
    pitfalls: ['Use ±Infinity sentinels for empty sides.', 'Even total length averages two middle values; odd total takes the max of the left side.'],
    js: `function findMedianSortedArrays(nums1, nums2) {
  let A = nums1, B = nums2;
  if (A.length > B.length) [A, B] = [B, A];
  const m = A.length, n = B.length, half = (m + n + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1, j = half - i;
    const aL = i > 0 ? A[i - 1] : -Infinity, aR = i < m ? A[i] : Infinity;
    const bL = j > 0 ? B[j - 1] : -Infinity, bR = j < n ? B[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      if ((m + n) % 2) return Math.max(aL, bL);
      return (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
    }
    if (aL > bR) hi = i - 1; else lo = i + 1;
  }
}`,
    py: `def find_median_sorted_arrays(nums1, nums2):
    A, B = nums1, nums2
    if len(A) > len(B):
        A, B = B, A
    m, n = len(A), len(B)
    half = (m + n + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        aL = A[i - 1] if i > 0 else float('-inf')
        aR = A[i] if i < m else float('inf')
        bL = B[j - 1] if j > 0 else float('-inf')
        bR = B[j] if j < n else float('inf')
        if aL <= bR and bL <= aR:
            if (m + n) % 2:
                return max(aL, bL)
            return (max(aL, bL) + min(aR, bR)) / 2
        if aL > bR:
            hi = i - 1
        else:
            lo = i + 1`
  },

  'Reverse Linked List': {
    intuition: 'Reversing a list means flipping each pointer to point backwards. With array I/O, that is reversing the sequence — the interview version does it in place with three pointers.',
    approach: 'Iterate once keeping prev/current/next; point current.next at prev and advance. (Here the list is given as an array, so reverse it — same logic.)',
    steps: ['prev = null, cur = head.', 'Save next = cur.next.', 'cur.next = prev; prev = cur; cur = next.', 'Return prev.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    pitfalls: ['Save cur.next BEFORE overwriting it.', 'Handle the empty list.'],
    js: `function reverseList(head) {
  const out = [];
  for (let i = head.length - 1; i >= 0; i--) out.push(head[i]);
  return out;
}`,
    py: `def reverse_list(head):
    return head[::-1]`
  },

  'Linked List Cycle Detection': {
    intuition: 'If a fast runner (2 steps) and a slow runner (1 step) are on a loop, the fast one must eventually lap the slow one — on a straight line it just falls off the end.',
    approach: "Floyd's tortoise and hare. With the list given as (values, pos), the tail links back to index pos; simulate the pointers on that structure.",
    steps: ['If pos == −1 there is no cycle.', 'slow = fast = 0.', 'Each step: slow = next(slow); fast = next(next(fast)).', 'If they ever meet there is a cycle.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    pitfalls: ['Check fast and fast.next for null before advancing.', 'A hash set of visited nodes also works in O(n) space.'],
    js: `function hasCycle(nodes, pos) {
  if (!nodes.length || pos < 0) return false;
  const next = (i) => (i === nodes.length - 1 ? pos : i + 1);
  let slow = 0, fast = 0;
  for (let steps = 0; steps <= nodes.length * 2 + 2; steps++) {
    slow = next(slow);
    fast = next(next(fast));
    if (slow === fast) return true;
  }
  return false;
}`,
    py: `def has_cycle(nodes, pos):
    if not nodes or pos < 0:
        return False
    n = len(nodes)
    nxt = lambda i: pos if i == n - 1 else i + 1
    slow = fast = 0
    for _ in range(n * 2 + 3):
        slow = nxt(slow)
        fast = nxt(nxt(fast))
        if slow == fast:
            return True
    return False`
  },

  'Merge k Sorted Lists': {
    intuition: 'At every step the next output value is the smallest current head among the k lists — exactly what a min-heap serves in O(log k).',
    approach: 'Push the first element of each list into a min-heap of (value, list, index); pop the smallest, append it, and push that list\'s next element.',
    steps: ['Seed a min-heap with each non-empty list\'s head.', 'Pop the minimum, append to the output.', 'Push the next element of the same list if any.', 'Repeat until the heap is empty.'],
    timeComplexity: 'O(N log k)', spaceComplexity: 'O(k)',
    pitfalls: ['Divide-and-conquer pairwise merging is equally good and needs no heap.', 'Handle empty lists and k = 0.'],
    js: `function mergeKLists(lists) {
  const heap = [];
  const push = (x) => { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  lists.forEach((l, k) => { if (l.length) push([l[0], k, 0]); });
  const out = [];
  while (heap.length) {
    const [v, k, i] = pop();
    out.push(v);
    if (i + 1 < lists[k].length) push([lists[k][i + 1], k, i + 1]);
  }
  return out;
}`,
    py: `import heapq

def merge_k_lists(lists):
    heap = [(l[0], k, 0) for k, l in enumerate(lists) if l]
    heapq.heapify(heap)
    out = []
    while heap:
        v, k, i = heapq.heappop(heap)
        out.append(v)
        if i + 1 < len(lists[k]):
            heapq.heappush(heap, (lists[k][i + 1], k, i + 1))
    return out`
  },

  'Valid Parentheses': {
    intuition: 'The most recently opened bracket must be the first one closed — that is precisely a stack.',
    approach: 'Push every opening bracket; on a closing bracket the stack top must be its matching opener. The string is valid if the stack ends empty.',
    steps: ['Map each closer to its opener.', 'For each char: opener → push; closer → pop and compare.', 'Fail on an empty stack or mismatch.', 'Return stack.length == 0.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    pitfalls: ['Popping from an empty stack must not crash — treat it as invalid.', 'Do not forget the final "stack is empty" check ("(((").'],
    js: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const c of s) {
    if (pairs[c]) {
      if (stack.pop() !== pairs[c]) return false;
    } else stack.push(c);
  }
  return stack.length === 0;
}`,
    py: `def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack`
  },

  'Daily Temperatures': {
    intuition: 'For each day you want the next warmer day. Keep a stack of days still waiting for a warmer one — a new warmer temperature resolves them all at once.',
    approach: 'Monotonic decreasing stack of indices. When today is warmer than the temperature at the stack top, pop it and record the gap.',
    steps: ['res = zeros(n); stack = [].', 'For each i: while stack and T[i] > T[stack.top]: j = pop; res[j] = i − j.', 'Push i.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    pitfalls: ['Compare with strict > (equal temperatures are not warmer).', 'Leftover stack days stay 0.'],
    js: `function dailyTemperatures(temperatures) {
  const res = new Array(temperatures.length).fill(0), stack = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const j = stack.pop();
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}`,
    py: `def daily_temperatures(temperatures):
    res = [0] * len(temperatures)
    stack = []
    for i, t in enumerate(temperatures):
        while stack and t > temperatures[stack[-1]]:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res`
  },

  'Largest Rectangle in Histogram': {
    intuition: 'For each bar, the widest rectangle using it as the shortest bar extends left and right until a shorter bar. A monotonic stack finds both boundaries in one pass.',
    approach: 'Keep a stack of increasing heights. When a shorter bar arrives, pop taller bars and compute their rectangle (width = distance between the new stack top and the current index). Append a sentinel 0 to flush.',
    steps: ['Iterate i from 0..n (heights[n] = 0 sentinel).', 'While stack top is taller than current: pop h; width = i − (stack.top + 1) or i if empty.', 'best = max(best, h × width).', 'Push i.'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    pitfalls: ['The sentinel bar flushes the remaining stack — easy to forget.', 'Width uses the new stack top after popping, not i − popped index.'],
    js: `function largestRectangleArea(heights) {
  const h = [...heights, 0], stack = [];
  let best = 0;
  for (let i = 0; i < h.length; i++) {
    while (stack.length && h[i] < h[stack[stack.length - 1]]) {
      const height = h[stack.pop()];
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      best = Math.max(best, height * width);
    }
    stack.push(i);
  }
  return best;
}`,
    py: `def largest_rectangle_area(heights):
    h = heights + [0]
    stack = []
    best = 0
    for i, cur in enumerate(h):
        while stack and cur < h[stack[-1]]:
            height = h[stack.pop()]
            width = i - stack[-1] - 1 if stack else i
            best = max(best, height * width)
        stack.append(i)
    return best`
  }
};
