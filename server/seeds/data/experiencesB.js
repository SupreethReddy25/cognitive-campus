/**
 * Interview experiences — product companies and startups.
 */

const Q = (text, questionType = 'DSA', topicTags = []) => ({ text, questionType, topicTags });
const R = (type, duration, vibe, topics, questions, tips = '') => ({ type, duration, vibe, topics, questions, tips });

module.exports = [
  // ─────────────── FLIPKART ───────────────
  {
    company: 'flipkart', college: 'nit-warangal', role: 'SDE-1', year: 2024, month: 'August', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.4', applicationSource: 'On-campus', compensation: { base: '22 LPA', bonus: '3 LPA', stock: '₹15 lakh ESOPs' }, isVerified: true, upvotes: 47,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Dynamic Programming', 'Graphs', 'Arrays'], [
        Q('Given a matrix of costs, find the min cost path from top-left to bottom-right where you can move right, down, or diagonally.', 'DSA', ['Dynamic Programming']),
        Q('Given n tasks with dependencies and durations, find the earliest completion time.', 'DSA', ['Graphs', 'Topological Sort']),
        Q('MCQs: OS scheduling, DBMS normalisation, time complexity of heap operations.', 'CS Fundamentals', ['Operating Systems', 'DBMS'])
      ], 'The two coding problems were medium-hard; MCQs were 20% of the score.'),
      R('Technical', '90 minutes', 'Neutral', ['OOP', 'LLD', 'Machine Coding'], [
        Q('Machine coding: design and implement a cab-booking service supporting driver registration, ride request, nearest-driver matching and ride completion.', 'System Design', ['OOP', 'LLD', 'Design Patterns'])
      ], 'They evaluate extensibility (strategy pattern for matching), clean class boundaries and a working demo. I used 15 mins to design, 60 to code, 15 to test.'),
      R('Technical', '60 minutes', 'Grilling', ['Dynamic Programming', 'Trees'], [
        Q('Maximum sum path in a binary tree where no two adjacent nodes are picked.', 'DSA', ['Trees', 'Dynamic Programming']),
        Q('Given a stream of numbers, find the median at any time.', 'DSA', ['Heap'])
      ], 'The interviewer pushed on time complexity for each follow-up.'),
      R('Managerial', '60 minutes', 'Friendly', ['HLD', 'Behavioral'], [
        Q('Design a scalable flash-sale system that handles 1M requests/second for 5 minutes.', 'System Design', ['System Design', 'Caching', 'Queues']),
        Q('Tell me about a production issue you handled.', 'Behavioral', ['Behavioral'])
      ], 'They care about how you think about inventory consistency and backpressure.')
    ],
    overallTips: 'Machine coding is the differentiator at Flipkart — practise 2–3 full problems (splitwise, parking lot, BookMyShow) under a 90-minute timer with clean structure and tests.',
    resourcesUsed: 'LeetCode, Awesome-LLD GitHub repo, YouTube machine-coding walkthroughs, Grokking System Design'
  },
  {
    company: 'flipkart', college: 'iit-madras', role: 'SDE-2', year: 2025, month: 'June', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.5', applicationSource: 'Referral', compensation: { base: '38 LPA', bonus: '6 LPA', stock: '₹40 lakh ESOPs' }, isVerified: false, upvotes: 26,
    rounds: [
      R('Technical', '60 minutes', 'Neutral', ['Graphs', 'Heaps'], [
        Q('Given a list of warehouses and delivery routes with costs, find the cheapest way to route a package from A to B with at most 3 transfers.', 'DSA', ['Graphs', 'Dijkstra']),
      ], 'Modified Dijkstra with a state for transfer count.'),
      R('Technical', '90 minutes', 'Neutral', ['LLD', 'Concurrency'], [
        Q('Design and code an in-memory pub-sub system with topics, subscribers, retries and ordering guarantees.', 'System Design', ['LLD', 'Concurrency', 'Queues'])
      ], 'Wrote a working version with thread-safe queues and discussed delivery semantics.'),
      R('Managerial', '60 minutes', 'Friendly', ['HLD'], [
        Q('Design the order-management service for a large e-commerce platform. How do you keep inventory consistent across warehouses?', 'System Design', ['System Design', 'Databases', 'Queues'])
      ], 'Talked about sagas vs 2PC, idempotency keys, and outbox pattern.')
    ],
    overallTips: 'At SDE-2, expect a machine-coding round AND a deep HLD. Know the outbox pattern, idempotency, and consistency trade-offs cold.',
    resourcesUsed: 'DDIA, System Design Primer, LeetCode Hard'
  },
  {
    company: 'flipkart', college: 'pes-university', role: 'SDE Intern', year: 2023, month: 'September', offerReceived: 'No', difficulty: 'Challenging', experienceRating: 'Neutral',
    cgpa: '8.0', applicationSource: 'On-campus', isVerified: false, upvotes: 14, anonymous: true,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Dynamic Programming'], [
        Q('Count the number of subsets with a given XOR.', 'DSA', ['Dynamic Programming', 'Bit Manipulation']),
        Q('Longest increasing path in a matrix.', 'DSA', ['Dynamic Programming', 'Graphs'])
      ], 'Solved one fully and part of the other — did not clear the cut-off.')
    ],
    overallTips: 'The cut-off is high. Practise DP-on-grids and bit-manipulation DP; aim to fully solve both problems.',
    resourcesUsed: 'LeetCode, Codeforces'
  },

  // ─────────────── RAZORPAY ───────────────
  {
    company: 'razorpay', college: 'nit-trichy', role: 'SDE-1', year: 2025, month: 'April', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.3', applicationSource: 'Off-campus', compensation: { base: '24 LPA', bonus: '2 LPA', stock: '₹20 lakh ESOPs' }, isVerified: true, upvotes: 38,
    rounds: [
      R('OA', '75 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Given a list of transactions [id, amount, timestamp], flag accounts having more than 3 transactions in any 1-minute window.', 'DSA', ['Sliding Window', 'Hashing']),
        Q('Validate a credit-card number using the Luhn algorithm and return the issuer.', 'DSA', ['Strings'])
      ], 'Payments-flavoured DSA. The first one is a sliding-window over sorted timestamps.'),
      R('Technical', '60 minutes', 'Friendly', ['SQL', 'APIs', 'Concurrency'], [
        Q('Write a SQL query for the top 3 merchants by settled amount per month.', 'CS Fundamentals', ['SQL']),
        Q('What is idempotency? How would you make a "create payment" API idempotent?', 'System Design', ['APIs', 'Databases']),
        Q('Two requests try to debit the same wallet concurrently. How do you avoid double-spend?', 'CS Fundamentals', ['Concurrency', 'Databases'])
      ], 'They care about real payment problems: idempotency keys, locking, transactions.'),
      R('Technical', '90 minutes', 'Neutral', ['LLD'], [
        Q('Design and implement a rate limiter (token bucket) for an API gateway with per-merchant limits.', 'System Design', ['LLD', 'Concurrency'])
      ], 'Wrote the class structure and a working implementation with tests.'),
      R('HR', '30 minutes', 'Friendly', ['Behavioral'], [Q('What excites you about fintech infrastructure?', 'Behavioral', ['Behavioral'])], 'Culture chat.')
    ],
    overallTips: 'Read Razorpay engineering blog posts on payment retries and idempotency before the interview — the discussion round mirrors those.',
    resourcesUsed: 'LeetCode, Razorpay engineering blog, Stripe API design docs, DDIA'
  },
  {
    company: 'razorpay', college: 'dtu-delhi', role: 'Backend Engineer', year: 2024, month: 'January', offerReceived: 'No', difficulty: 'Medium', experienceRating: 'Neutral',
    cgpa: '7.9', applicationSource: 'Off-campus', isVerified: false, upvotes: 11,
    rounds: [
      R('Technical', '60 minutes', 'Neutral', ['DSA', 'SQL'], [
        Q('Find the longest sequence of consecutive days where a merchant had ≥ 1 successful payment (SQL).', 'CS Fundamentals', ['SQL']),
        Q('LRU cache implementation.', 'DSA', ['Linked Lists', 'Hashing'])
      ], 'Good round but I struggled with the window-function SQL question.'),
      R('Technical', '60 minutes', 'Grilling', ['System Design'], [
        Q('Design a webhook delivery system with retries and exponential backoff.', 'System Design', ['System Design', 'Queues'])
      ], 'I missed dead-letter queues and signature verification. Rejected with feedback to strengthen system design.')
    ],
    overallTips: 'SQL window functions and webhook/retry design are worth an evening each.',
    resourcesUsed: 'Mode SQL tutorials, LeetCode Database'
  },

  // ─────────────── ZERODHA ───────────────
  {
    company: 'zerodha', college: 'nit-warangal', role: 'Backend Engineer', year: 2024, month: 'March', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.0', applicationSource: 'Off-campus', compensation: { base: '20 LPA', bonus: '', stock: '' }, isVerified: true, upvotes: 33,
    rounds: [
      R('OA', '2 days', 'Neutral', ['Go', 'APIs', 'Databases'], [
        Q('Take-home: build a small REST service in Go/Python that ingests a CSV of trades, stores them in Postgres, and exposes P&L per symbol.', 'Role-specific', ['APIs', 'Databases', 'SQL'])
      ], 'They evaluate simplicity, error handling and README. No frameworks needed; I used the standard library and pgx.'),
      R('Technical', '45 minutes', 'Friendly', ['Code Review', 'Databases'], [
        Q('Walk us through your solution. Why this schema? What if there are 100M rows?', 'Role-specific', ['Databases', 'SQL']),
        Q('How would you make your ingestion idempotent?', 'System Design', ['APIs'])
      ], 'A code-review style conversation — they respect honest trade-offs.'),
      R('Technical', '60 minutes', 'Neutral', ['Networking', 'OS'], [
        Q('What happens when you type a URL and press enter? Go deeper on TCP and TLS.', 'CS Fundamentals', ['Computer Networks']),
        Q('What is the difference between a process and a thread? What is epoll?', 'CS Fundamentals', ['Operating Systems'])
      ], 'Practical systems knowledge rather than puzzles.')
    ],
    overallTips: 'Read Zerodha\'s tech blog and show you can ship simple, maintainable software. No LeetCode grind required — but know your fundamentals.',
    resourcesUsed: 'zerodha.tech blog, Postgres docs, Beej\'s Guide to Network Programming'
  },

  // ─────────────── ATLASSIAN ───────────────
  {
    company: 'atlassian', college: 'iit-bombay', role: 'SDE-1', year: 2025, month: 'July', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '9.0', applicationSource: 'On-campus', compensation: { base: '45 LPA', bonus: '5 LPA', stock: '$80k RSUs' }, isVerified: true, upvotes: 44,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Strings', 'Design'], [
        Q('Implement a text-diff utility that returns the minimum edits to convert file A to file B.', 'DSA', ['Dynamic Programming', 'Strings']),
        Q('Design the classes for a simple issue tracker (issues, workflows, transitions).', 'System Design', ['OOP', 'LLD'])
      ], 'One algorithmic problem (edit distance/LCS) and one small design.'),
      R('Technical', '60 minutes', 'Friendly', ['Code Design', 'Testing'], [
        Q('Implement a rate-limited task scheduler with priorities. Write unit tests.', 'System Design', ['LLD', 'Heap', 'Testing'])
      ], 'They want production-quality code: naming, small functions, tests, extension points.'),
      R('Technical', '60 minutes', 'Neutral', ['System Design'], [
        Q('Design a collaborative document editor like Confluence. Discuss conflict resolution.', 'System Design', ['System Design', 'Concurrency'])
      ], 'Mentioned OT vs CRDT; the interviewer liked that I discussed trade-offs and eventual consistency.'),
      R('HR', '45 minutes', 'Friendly', ['Values'], [
        Q('Tell me about a time you gave a teammate difficult feedback.', 'Behavioral', ['Behavioral']),
        Q('How do you handle a disagreement with a product manager?', 'Behavioral', ['Behavioral'])
      ], 'Values round is decisive. Prepare examples for each Atlassian value (open company no bullshit, build with heart and balance, etc.).')
    ],
    overallTips: 'Atlassian is looking for craftspeople: readable code with tests. Do not skip the values interview — it can override strong technical rounds.',
    resourcesUsed: 'Clean Code, Atlassian Values page, LeetCode DP list, Grokking OOD'
  },
  {
    company: 'atlassian', college: 'bits-pilani', role: 'SDE Intern', year: 2024, month: 'December', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'On-campus', isVerified: false, upvotes: 19,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Trees', 'Graphs'], [
        Q('Find the lowest common ancestor of two nodes in a tree with parent pointers.', 'DSA', ['Trees']),
        Q('Detect if a workflow graph has a cycle and print the cycle.', 'DSA', ['Graphs', 'DFS'])
      ], 'Both medium.'),
      R('Technical', '60 minutes', 'Friendly', ['Code Design'], [
        Q('Design a simple in-memory key-value store with TTL and implement it.', 'System Design', ['LLD', 'Hashing', 'Heap'])
      ], 'Focus was code quality and how I tested the TTL expiry.')
    ],
    overallTips: 'Write tests in the interview — even two quick ones. It visibly impressed the interviewer.',
    resourcesUsed: 'LeetCode, Effective Java'
  },

  // ─────────────── ADOBE ───────────────
  {
    company: 'adobe', college: 'dtu-delhi', role: 'SDE-1', year: 2023, month: 'October', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.2', applicationSource: 'On-campus', compensation: { base: '22 LPA', bonus: '2 LPA', stock: '$40k RSUs' }, isVerified: true, upvotes: 31,
    rounds: [
      R('OA', '120 minutes', 'Neutral', ['CS Fundamentals', 'Arrays'], [
        Q('MCQs: pointer arithmetic in C, SQL joins, process scheduling, time complexity of sorting.', 'CS Fundamentals', ['Operating Systems', 'DBMS']),
        Q('Rotate an array by k positions in-place with O(1) extra space.', 'DSA', ['Arrays']),
        Q('Print all permutations of a string with duplicates without repetition.', 'DSA', ['Recursion', 'Backtracking'])
      ], 'MCQ section had a cut-off; coding was easy-medium.'),
      R('Technical', '60 minutes', 'Friendly', ['Linked Lists', 'Trees'], [
        Q('Detect the start of a cycle in a linked list.', 'DSA', ['Linked Lists']),
        Q('Check whether a binary tree is symmetric.', 'DSA', ['Trees', 'Recursion']),
        Q('What are virtual destructors? When are they required?', 'CS Fundamentals', ['OOP', 'C++'])
      ], 'Interviewer liked that I walked through pointer diagrams.'),
      R('Technical', '60 minutes', 'Neutral', ['OOP', 'Design'], [
        Q('Design the class structure for a photo-editing application with undo/redo.', 'System Design', ['OOP', 'Design Patterns']),
        Q('Implement undo/redo using two stacks.', 'DSA', ['Stack'])
      ], 'Command pattern + two stacks. Discuss memory for large images.'),
      R('HR', '30 minutes', 'Friendly', ['Behavioral'], [Q('Describe your best project and what you would improve.', 'Behavioral', ['Behavioral'])], 'Relaxed.')
    ],
    overallTips: 'Adobe tests fundamentals thoroughly — pointers, OOP, OS and DBMS MCQs decide the shortlist. Prepare design patterns (command, observer, factory).',
    resourcesUsed: 'GeeksforGeeks, Head First Design Patterns, Striver SDE Sheet'
  },
  {
    company: 'adobe', college: 'srm', role: 'Computer Scientist', year: 2025, month: 'February', offerReceived: 'No', difficulty: 'Challenging', experienceRating: 'Neutral',
    cgpa: '8.0', applicationSource: 'Off-campus', isVerified: false, upvotes: 9, anonymous: true,
    rounds: [
      R('Technical', '60 minutes', 'Neutral', ['Graphs', 'Dynamic Programming'], [
        Q('Given a set of dependencies between build targets, produce a valid build order and identify targets that can be built in parallel.', 'DSA', ['Graphs', 'Topological Sort']),
        Q('Minimum number of coins to make a given amount with unlimited supply; then count the number of ways.', 'DSA', ['Dynamic Programming'])
      ], 'Solved both but slowly. The interviewer wanted more optimal space usage for the DP.'),
    ],
    overallTips: 'Off-campus roles have a tougher bar than campus. Get fast at DP space optimisation.',
    resourcesUsed: 'LeetCode'
  },

  // ─────────────── UBER ───────────────
  {
    company: 'uber', college: 'iit-delhi', role: 'SDE-1', year: 2024, month: 'August', offerReceived: 'Yes', difficulty: 'Very Hard', experienceRating: 'Positive',
    cgpa: '9.0', applicationSource: 'On-campus', compensation: { base: '35 LPA', bonus: '8 LPA', stock: '$100k RSUs' }, isVerified: true, upvotes: 53,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Graphs', 'Dynamic Programming', 'Heaps'], [
        Q('Given n riders and m drivers on a line with positions, minimise the max pickup distance for a perfect matching.', 'DSA', ['Binary Search', 'Greedy']),
        Q('Count the number of ways to reach the end of an array with jumps of length ≤ nums[i], modulo 1e9+7.', 'DSA', ['Dynamic Programming']),
        Q('Find the K closest points to origin from a stream.', 'DSA', ['Heap'])
      ], 'Three problems, hard-ish. Needed 2 correct to clear.'),
      R('Technical', '60 minutes', 'Grilling', ['Graphs', 'Heaps'], [
        Q('Minimum time for all drivers to reach their assigned rides on a weighted graph — multi-source Dijkstra with a twist.', 'DSA', ['Graphs', 'Dijkstra']),
        Q('Design an API for surge pricing per geo-cell.', 'System Design', ['System Design'])
      ], 'The interviewer built up the problem in layers. Prepare to adapt your solution as constraints change.'),
      R('Technical', '60 minutes', 'Neutral', ['Concurrency', 'LLD'], [
        Q('Implement a thread-safe bounded blocking queue.', 'CS Fundamentals', ['Concurrency']),
        Q('Merge intervals with a streaming set of intervals.', 'DSA', ['Intervals', 'Sorting'])
      ], 'Discussed condition variables vs semaphores.'),
      R('Managerial', '90 minutes', 'Friendly', ['System Design', 'Behavioral'], [
        Q('Design a ride-matching service: how do you find nearby drivers quickly at 1M rides/hour?', 'System Design', ['System Design', 'Geo-indexing', 'Queues']),
        Q('Tell me about a time you pushed back on a deadline.', 'Behavioral', ['Behavioral'])
      ], 'Geohash / quadtree / H3 hex grids. Good chat with a senior engineer.')
    ],
    overallTips: 'Uber expects hard graph/heap problems plus a real system-design conversation even for SDE-1. Practise Dijkstra variants and geo-spatial design.',
    resourcesUsed: 'LeetCode Uber tagged, Grokking System Design, Uber engineering blog (H3)'
  },
  {
    company: 'uber', college: 'nit-surathkal', role: 'SDE Intern', year: 2023, month: 'October', offerReceived: 'No', difficulty: 'Hard', experienceRating: 'Neutral',
    cgpa: '8.2', applicationSource: 'On-campus', isVerified: false, upvotes: 16,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Graphs'], [
        Q('Shortest path in a grid with at most k obstacle removals.', 'DSA', ['Graphs', 'BFS']),
        Q('Given an array, find the number of subarrays with at most K distinct integers.', 'DSA', ['Sliding Window', 'Hashing'])
      ], 'I solved the second one but the BFS state (row, col, removals) TLE\'d because I forgot visited-by-state.')
    ],
    overallTips: 'For state-augmented BFS, the visited set must include the extra state. That one mistake cost me the interview.',
    resourcesUsed: 'LeetCode'
  },

  // ─────────────── ORACLE / SALESFORCE / INTUIT / PAYPAL / WALMART ───────────────
  {
    company: 'oracle', college: 'srm', role: 'Member of Technical Staff', year: 2024, month: 'March', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.4', applicationSource: 'On-campus', compensation: { base: '15 LPA', bonus: '1 LPA', stock: '' }, isVerified: true, upvotes: 22,
    rounds: [
      R('OA', '100 minutes', 'Neutral', ['CS Fundamentals', 'Arrays'], [
        Q('MCQs: SQL queries, normalisation, OS memory management, Java collections.', 'CS Fundamentals', ['DBMS', 'Operating Systems']),
        Q('Rearrange an array so that all negative numbers come before positives, preserving order.', 'DSA', ['Arrays']),
        Q('Check if a Sudoku board is valid.', 'DSA', ['Hashing', 'Matrix'])
      ], 'Coding was easy-medium; MCQs were the filter.'),
      R('Technical', '60 minutes', 'Friendly', ['DBMS', 'Java'], [
        Q('Explain ACID properties with an example. What is isolation level "read committed"?', 'CS Fundamentals', ['DBMS']),
        Q('Difference between HashMap and ConcurrentHashMap. How does resizing work?', 'CS Fundamentals', ['Java', 'Hashing']),
        Q('Write a query to find the second highest salary per department.', 'CS Fundamentals', ['SQL'])
      ], 'Database internals were a big focus — this is Oracle after all.'),
      R('Technical', '60 minutes', 'Neutral', ['OS', 'Design'], [
        Q('Explain paging and TLB. What happens on a page fault?', 'CS Fundamentals', ['Operating Systems']),
        Q('Design an LRU cache.', 'DSA', ['Linked Lists', 'Hashing'])
      ], 'Standard OS + one design.')
    ],
    overallTips: 'Oracle loves DBMS and Java. Know transactions, indexes (B-trees), isolation levels and Java collections internals.',
    resourcesUsed: 'Database System Concepts, GFG DBMS, Java Concurrency in Practice'
  },
  {
    company: 'salesforce', college: 'iiit-hyderabad', role: 'Associate Member of Technical Staff', year: 2025, month: 'September', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.7', applicationSource: 'On-campus', compensation: { base: '30 LPA', bonus: '3 LPA', stock: '$60k RSUs' }, isVerified: false, upvotes: 17,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Strings', 'Graphs'], [
        Q('Minimum window substring containing all characters of a pattern.', 'DSA', ['Sliding Window', 'Hashing']),
        Q('Find the number of connected components in a graph of user accounts linked by shared emails.', 'DSA', ['Graphs', 'Union Find'])
      ], 'Union-Find made the second one trivial (accounts merge).'),
      R('Technical', '60 minutes', 'Friendly', ['Trees', 'OOP'], [
        Q('Zigzag level-order traversal of a binary tree.', 'DSA', ['Trees', 'BFS']),
        Q('Design a booking system where two users cannot book the same slot.', 'System Design', ['LLD', 'Concurrency'])
      ], 'They liked that I raised race conditions and proposed optimistic locking.'),
      R('Managerial', '45 minutes', 'Friendly', ['Values', 'Projects'], [Q('What does "trust" mean to you as an engineer?', 'Behavioral', ['Behavioral'])], 'Values matter here (Trust, Customer Success, Innovation, Equality).')
    ],
    overallTips: 'Union-Find is worth learning — it showed up here. Have one story for each Salesforce value.',
    resourcesUsed: 'LeetCode, CP-Algorithms, Salesforce Trailhead culture modules'
  },
  {
    company: 'intuit', college: 'bits-pilani', role: 'Software Engineer 1', year: 2024, month: 'October', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'On-campus', compensation: { base: '32 LPA', bonus: '4 LPA', stock: '$70k RSUs' }, isVerified: true, upvotes: 28,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Trees'], [
        Q('Given a list of expenses with categories, return the top-k categories by spend.', 'DSA', ['Hashing', 'Heap']),
        Q('Validate a BST and return the inorder successor of a node.', 'DSA', ['Trees'])
      ], 'Both standard.'),
      R('Technical', '60 minutes', 'Friendly', ['Design'], [
        Q('Design the classes for an invoicing application: customers, invoices, line items, taxes, payment status.', 'System Design', ['OOP', 'LLD']),
        Q('Write code to compute overdue invoices grouped by customer.', 'DSA', ['Hashing'])
      ], 'Intuit evaluates design sense: clear entities, interfaces, extensibility.'),
      R('Managerial', '45 minutes', 'Friendly', ['Behavioral'], [Q('Tell me about a time you made something simpler for a user.', 'Behavioral', ['Behavioral'])], 'Design-for-delight questions.')
    ],
    overallTips: 'Practise LLD for finance-flavoured domains. Express decisions in terms of the customer problem.',
    resourcesUsed: 'LeetCode, Grokking OOD, Refactoring Guru'
  },
  {
    company: 'paypal', college: 'vit-vellore', role: 'SDE-1', year: 2023, month: 'September', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.6', applicationSource: 'On-campus', compensation: { base: '28 LPA', bonus: '3 LPA', stock: '$50k RSUs' }, isVerified: false, upvotes: 20,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Detect fraudulent transaction patterns: return accounts with 3 consecutive failed logins followed by a transfer.', 'DSA', ['Arrays', 'Hashing']),
        Q('Longest substring without repeating characters.', 'DSA', ['Sliding Window'])
      ], 'Simple but timed.'),
      R('Technical', '60 minutes', 'Friendly', ['Java', 'Concurrency'], [
        Q('Explain synchronized vs ReentrantLock. What is a deadlock and how do you detect one?', 'CS Fundamentals', ['Java', 'Concurrency']),
        Q('Implement a producer-consumer with wait/notify.', 'CS Fundamentals', ['Concurrency'])
      ], 'Java concurrency-heavy interviewer.'),
      R('Managerial', '45 minutes', 'Neutral', ['System Design'], [
        Q('Design a peer-to-peer money-transfer service. How do you ensure a transfer is never applied twice?', 'System Design', ['System Design', 'Databases'])
      ], 'Idempotency again — payments companies love it.')
    ],
    overallTips: 'Know Java concurrency primitives and transaction semantics. Idempotency keys and ledger design come up repeatedly.',
    resourcesUsed: 'Java Concurrency in Practice, LeetCode, Stripe blog'
  },
  {
    company: 'walmart-labs', college: 'amrita', role: 'SDE-2 (Grad)', year: 2024, month: 'July', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.5', applicationSource: 'On-campus', compensation: { base: '24 LPA', bonus: '2 LPA', stock: '₹10 lakh RSUs' }, isVerified: true, upvotes: 25,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Trees', 'Graphs'], [
        Q('Given inventory and order arrays, determine which orders can be fully fulfilled from a set of warehouses (greedy assignment).', 'DSA', ['Greedy', 'Sorting']),
        Q('Diameter of an n-ary tree.', 'DSA', ['Trees', 'DFS'])
      ], 'Two medium questions and 10 MCQs.'),
      R('Technical', '75 minutes', 'Neutral', ['LLD', 'Machine Coding'], [
        Q('Design and code an inventory management system with add/remove stock, reservations and low-stock alerts.', 'System Design', ['LLD', 'OOP', 'Design Patterns'])
      ], 'Clean OOP with observer pattern for alerts scored well.'),
      R('Technical', '60 minutes', 'Friendly', ['DSA'], [
        Q('Serialize/deserialize an n-ary tree.', 'DSA', ['Trees']),
        Q('Kth largest element in a stream.', 'DSA', ['Heap'])
      ], 'Comfortable round.'),
      R('Managerial', '45 minutes', 'Friendly', ['Behavioral'], [Q('Tell me about a time you improved a process.', 'Behavioral', ['Behavioral'])], 'Compensation discussion at the end.')
    ],
    overallTips: 'Practise machine-coding style problems (inventory, parking lot, vending machine) and use the observer/strategy patterns naturally.',
    resourcesUsed: 'LeetCode, Awesome-LLD, Refactoring Guru'
  },
  {
    company: 'walmart-labs', college: 'psg-tech', role: 'Data Analyst', year: 2025, month: 'January', offerReceived: 'Pending', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.2', applicationSource: 'On-campus', isVerified: false, upvotes: 8,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['SQL', 'Statistics', 'Python'], [
        Q('SQL: find customers whose monthly spend increased for 3 consecutive months.', 'Role-specific', ['SQL']),
        Q('Explain the difference between Type I and Type II errors. When would you prefer to reduce one over the other?', 'Role-specific', ['Statistics']),
        Q('Python: clean a messy sales dataset and produce weekly revenue by region.', 'Role-specific', ['Python', 'Pandas'])
      ], 'SQL window functions (LAG) and a pandas exercise.'),
      R('Technical', '45 minutes', 'Friendly', ['Analytics', 'Business Sense'], [
        Q('Sales dropped 8% in one region last quarter. How would you find out why?', 'Role-specific', ['Analytics']),
        Q('How would you design an A/B test for a new checkout page? How do you decide the sample size?', 'Role-specific', ['Statistics', 'Experimentation'])
      ], 'Structured thinking matters more than the exact answer.')
    ],
    overallTips: 'For analyst roles: SQL window functions, A/B testing basics and a repeatable framework for "metric dropped" questions.',
    resourcesUsed: 'Mode SQL, StrataScratch, Trustworthy Online Controlled Experiments'
  }
];
