/**
 * Interview experiences — finance, services, startups and a few non-SDE roles.
 */

const Q = (text, questionType = 'DSA', topicTags = []) => ({ text, questionType, topicTags });
const R = (type, duration, vibe, topics, questions, tips = '') => ({ type, duration, vibe, topics, questions, tips });

module.exports = [
  // ─────────────── GOLDMAN SACHS ───────────────
  {
    company: 'goldman-sachs', college: 'iit-bombay', role: 'Analyst (Engineering)', year: 2024, month: 'August', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '9.0', applicationSource: 'On-campus', compensation: { base: '24 LPA', bonus: '5 LPA joining + 15% variable', stock: '' }, isVerified: true, upvotes: 46,
    rounds: [
      R('OA', '120 minutes', 'Neutral', ['Aptitude', 'Arrays', 'Dynamic Programming'], [
        Q('Aptitude: probability and permutations questions, 20 min.', 'Role-specific', ['Aptitude']),
        Q('Given a stock price array and a fee, maximise profit with unlimited transactions.', 'DSA', ['Dynamic Programming', 'Greedy']),
        Q('Given a string, partition it into the minimum number of palindromes.', 'DSA', ['Dynamic Programming', 'Strings'])
      ], 'Two coding problems (medium-hard) plus a quant section. The aptitude section has a separate cut-off.'),
      R('Technical', '60 minutes', 'Neutral', ['Data Structures', 'DBMS'], [
        Q('Implement a min-stack in O(1) and then a queue using two stacks.', 'DSA', ['Stack', 'Queue']),
        Q('Write a SQL query to find employees earning more than their manager.', 'CS Fundamentals', ['SQL']),
        Q('Explain how indexing speeds up queries. What is a covering index?', 'CS Fundamentals', ['DBMS'])
      ], 'CoderPad round. Fast follow-ups on DBMS after the coding.'),
      R('Technical', '60 minutes', 'Grilling', ['OOP', 'Puzzles', 'Projects'], [
        Q('You have 8 balls, one is heavier. Minimum weighings on a balance to find it?', 'Role-specific', ['Puzzles']),
        Q('Design a trading order book supporting add/cancel/match with price-time priority.', 'System Design', ['Heap', 'Design']),
        Q('Explain deadlock and how you would prevent it in a trading engine.', 'CS Fundamentals', ['Operating Systems', 'Concurrency'])
      ], 'The order-book design was the highlight. Use two heaps (bids/asks) with a hash map for cancellations.'),
      R('HR', '45 minutes', 'Friendly', ['Behavioral', 'Markets'], [
        Q('Why finance and not a pure tech company?', 'Behavioral', ['Behavioral']),
        Q('Have you followed any market event recently? What did you learn?', 'Behavioral', ['Behavioral'])
      ], 'Superday panel; show curiosity about markets.')
    ],
    overallTips: 'Goldman blends aptitude, DSA and CS fundamentals. Practise puzzles, SQL, and one finance-flavoured design (order book). Read a market news summary daily for a month.',
    resourcesUsed: 'LeetCode, IndiaBIX aptitude, Heard on the Street (puzzles), GeeksforGeeks DBMS'
  },
  {
    company: 'goldman-sachs', college: 'nit-trichy', role: 'Analyst (Engineering)', year: 2023, month: 'September', offerReceived: 'No', difficulty: 'Hard', experienceRating: 'Neutral',
    cgpa: '8.7', applicationSource: 'On-campus', isVerified: false, upvotes: 23,
    rounds: [
      R('OA', '120 minutes', 'Neutral', ['Aptitude', 'Arrays'], [
        Q('Find the number of pairs (i, j) with a[i] > a[j] and i < j (inversions) — expected O(n log n).', 'DSA', ['Merge Sort', 'Arrays']),
        Q('Given a linked list, reorder it as L0 → Ln → L1 → Ln−1 → …', 'DSA', ['Linked Lists'])
      ], 'Cleared the OA with both solved.'),
      R('Technical', '60 minutes', 'Grilling', ['DBMS', 'OS', 'Data Structures'], [
        Q('What is a clustered vs non-clustered index? Explain B+ trees.', 'CS Fundamentals', ['DBMS']),
        Q('Explain virtual memory and thrashing.', 'CS Fundamentals', ['Operating Systems']),
        Q('Design an LRU cache.', 'DSA', ['Linked Lists', 'Hashing'])
      ], 'I was shaky on B+ tree splits. Interviewer moved on quickly, which was not a good sign.'),
      R('HR', '30 minutes', 'Neutral', ['Behavioral'], [Q('Tell me about a time you worked under pressure.', 'Behavioral', ['Behavioral'])], 'Rejected after the Superday — feedback: CS fundamentals depth.')
    ],
    overallTips: 'Do not neglect DBMS internals (B+ trees, transactions) and OS memory management — they tested those harder than DSA.',
    resourcesUsed: 'LeetCode, GFG, CodeChef'
  },
  {
    company: 'goldman-sachs', college: 'bits-pilani', role: 'Summer Analyst', year: 2025, month: 'October', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'On-campus', isVerified: true, upvotes: 18,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Aptitude', 'Coding'], [
        Q('Sort an array of 0s, 1s and 2s in one pass.', 'DSA', ['Arrays', 'Two Pointers']),
        Q('Given a matrix of integers, find the row with the maximum number of 1s (each row sorted).', 'DSA', ['Binary Search', 'Matrix'])
      ], 'Easier than the full-time OA.'),
      R('Technical', '45 minutes', 'Friendly', ['Data Structures', 'Projects'], [
        Q('Two sum, then three sum. Discuss the complexity gap.', 'DSA', ['Hashing', 'Two Pointers']),
        Q('Explain your internship project and the biggest bug.', 'Behavioral', ['Behavioral'])
      ], 'Chatty and easy.')
    ],
    overallTips: 'Internship rounds are friendlier. Mention concrete numbers from your projects.',
    resourcesUsed: 'LeetCode Easy/Medium, Striver sheet'
  },

  // ─────────────── MORGAN STANLEY / JP MORGAN ───────────────
  {
    company: 'morgan-stanley', college: 'iiit-hyderabad', role: 'Technology Analyst', year: 2024, month: 'September', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.6', applicationSource: 'On-campus', compensation: { base: '22 LPA', bonus: '4 LPA', stock: '' }, isVerified: true, upvotes: 26,
    rounds: [
      R('OA', '120 minutes', 'Neutral', ['Aptitude', 'Arrays', 'Strings'], [
        Q('Given a string, find all substrings that are palindromes and return the count.', 'DSA', ['Strings', 'Dynamic Programming']),
        Q('Given a list of trades, compute the maximum drawdown.', 'DSA', ['Arrays', 'Greedy'])
      ], 'Coding was easy-medium; the aptitude had negative marking.'),
      R('Technical', '60 minutes', 'Friendly', ['OOP', 'Java', 'DBMS'], [
        Q('Explain the four pillars of OOP with a banking example.', 'CS Fundamentals', ['OOP']),
        Q('What is the difference between == and equals in Java? What happens if you override equals but not hashCode?', 'CS Fundamentals', ['Java', 'Hashing']),
        Q('Write a query to get the running balance per account.', 'CS Fundamentals', ['SQL'])
      ], 'Pretty standard fundamentals round.'),
      R('Technical', '45 minutes', 'Neutral', ['Puzzles', 'Design'], [
        Q('Design a system that alerts when a stock moves > 5% within 10 minutes.', 'System Design', ['System Design', 'Sliding Window']),
        Q('Puzzle: crossing a bridge with a torch — four people, different speeds.', 'Role-specific', ['Puzzles'])
      ], 'They like sliding-window thinking on streams.')
    ],
    overallTips: 'Standard fundamentals plus one design and a puzzle. Sliding-window on streaming data appeared in two rounds.',
    resourcesUsed: 'LeetCode, GeeksforGeeks, Java Interview Questions (Baeldung)'
  },
  {
    company: 'jp-morgan', college: 'amrita', role: 'Software Engineer (SEP)', year: 2024, month: 'August', offerReceived: 'Yes', difficulty: 'Easy', experienceRating: 'Positive',
    cgpa: '8.3', applicationSource: 'On-campus', compensation: { base: '19 LPA', bonus: '2 LPA', stock: '' }, isVerified: true, upvotes: 34,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Return the first non-repeating character in a string.', 'DSA', ['Hashing', 'Strings']),
        Q('Merge two sorted arrays without extra space.', 'DSA', ['Arrays', 'Two Pointers']),
        Q('Find the missing number in an array of 1..n.', 'DSA', ['Arrays', 'Math'])
      ], 'Three easy-medium problems. About 300 shortlisted from 1,800.'),
      R('Technical', '45 minutes', 'Friendly', ['DSA', 'Java', 'Projects'], [
        Q('Reverse a linked list iteratively and recursively.', 'DSA', ['Linked Lists']),
        Q('Explain garbage collection in Java.', 'CS Fundamentals', ['Java']),
        Q('Walk me through your project architecture.', 'Behavioral', ['Behavioral'])
      ], 'The interviewer was friendly and project-focused.'),
      R('HR', '30 minutes', 'Friendly', ['Behavioral'], [Q('Where do you see yourself in 5 years? Are you open to relocation?', 'Behavioral', ['Behavioral'])], 'Standard HR; offer within 3 days.')
    ],
    overallTips: 'JPM SEP is predictable: easy-medium DSA, project explanation and clear communication. Be ready to justify every technology on your resume.',
    resourcesUsed: 'GeeksforGeeks, HackerRank, InterviewBit'
  },
  {
    company: 'jp-morgan', college: 'thapar', role: 'Associate Engineer', year: 2022, month: 'November', offerReceived: 'Yes', difficulty: 'Easy', experienceRating: 'Positive',
    cgpa: '8.0', applicationSource: 'On-campus', isVerified: false, upvotes: 15, anonymous: true,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Check if a string is a valid palindrome after removing at most one character.', 'DSA', ['Strings', 'Two Pointers']),
        Q('Print the spiral order of a matrix.', 'DSA', ['Matrix'])
      ], 'Easy.'),
      R('Technical', '40 minutes', 'Friendly', ['OOP', 'DBMS'], [
        Q('What is normalisation? Give an example up to 3NF.', 'CS Fundamentals', ['DBMS']),
        Q('Explain polymorphism with an example.', 'CS Fundamentals', ['OOP'])
      ], 'Fundamentals only.')
    ],
    overallTips: 'For JPM the fundamentals are the filter: normalisation, OOP, one language in depth.',
    resourcesUsed: 'GFG'
  },

  // ─────────────── SERVICES / STARTUPS ───────────────
  {
    company: 'tcs', college: 'thapar', role: 'Digital', year: 2025, month: 'February', offerReceived: 'Yes', difficulty: 'Easy', experienceRating: 'Positive',
    cgpa: '7.9', applicationSource: 'On-campus', compensation: { base: '7 LPA', bonus: '', stock: '' }, isVerified: true, upvotes: 42,
    rounds: [
      R('OA', '180 minutes', 'Neutral', ['Aptitude', 'Coding'], [
        Q('Print the Fibonacci series up to N terms and find the sum of even terms.', 'DSA', ['Math']),
        Q('Given a string, count vowels and consonants and reverse words in place.', 'DSA', ['Strings'])
      ], 'TCS NQT Advanced — solving both coding problems is what moves you into the Digital band.'),
      R('Technical', '25 minutes', 'Friendly', ['DBMS', 'OOP', 'Projects'], [
        Q('What are constraints in SQL? Difference between primary key and unique key?', 'CS Fundamentals', ['DBMS']),
        Q('Explain your final-year project.', 'Behavioral', ['Behavioral'])
      ], 'Easy and conversational.'),
      R('HR', '15 minutes', 'Friendly', ['Behavioral'], [Q('Are you willing to relocate? Which technology do you want to work on?', 'Behavioral', ['Behavioral'])], 'Formality.')
    ],
    overallTips: 'Clear both NQT coding questions for Digital/Prime. Practise input-output style problems on the TCS iON platform.',
    resourcesUsed: 'TCS iON mock tests, PrepInsta, GeeksforGeeks'
  },
  {
    company: 'infosys', college: 'coep-pune', role: 'Specialist Programmer', year: 2024, month: 'June', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.1', applicationSource: 'On-campus', compensation: { base: '9.5 LPA', bonus: '', stock: '' }, isVerified: true, upvotes: 30,
    rounds: [
      R('OA', '180 minutes', 'Neutral', ['Coding'], [
        Q('HackWithInfy Q1: count the pairs in an array whose XOR is a power of two.', 'DSA', ['Bit Manipulation', 'Hashing']),
        Q('HackWithInfy Q2: shortest path in a weighted graph with edge-weight constraints.', 'DSA', ['Graphs', 'Dijkstra']),
        Q('HackWithInfy Q3: DP on trees — maximum weighted independent set.', 'DSA', ['Trees', 'Dynamic Programming'])
      ], 'Solving 2 of 3 gave the Specialist Programmer band.'),
      R('Technical', '35 minutes', 'Friendly', ['DSA', 'DBMS'], [
        Q('Explain the working of BFS and DFS with complexity. When would you use each?', 'DSA', ['Graphs']),
        Q('Difference between clustered and non-clustered indexes.', 'CS Fundamentals', ['DBMS'])
      ], 'Standard follow-up on my contest solutions.')
    ],
    overallTips: 'HackWithInfy is a real coding contest — practise Codeforces Div-3/2 problems and aim for 2 of 3.',
    resourcesUsed: 'Codeforces, HackerEarth, LeetCode contests'
  },
  {
    company: 'swiggy', college: 'vit-chennai', role: 'SDE-1', year: 2025, month: 'March', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.4', applicationSource: 'Off-campus', compensation: { base: '26 LPA', bonus: '3 LPA', stock: '₹25 lakh ESOPs' }, isVerified: false, upvotes: 21,
    rounds: [
      R('OA', '75 minutes', 'Neutral', ['Graphs', 'Heaps'], [
        Q('Assign delivery partners to orders to minimise total distance (given coordinates).', 'DSA', ['Greedy', 'Heap', 'Sorting']),
        Q('Find the minimum time to deliver all orders given road travel times (Floyd–Warshall or repeated Dijkstra).', 'DSA', ['Graphs', 'Dijkstra'])
      ], 'Delivery-flavoured problems.'),
      R('Technical', '90 minutes', 'Neutral', ['LLD', 'Machine Coding'], [
        Q('Implement a delivery-assignment service: register partners, place orders, assign the nearest free partner, update on delivery completion.', 'System Design', ['LLD', 'Heap', 'Concurrency'])
      ], 'Extensible matching strategy + thread-safety were discussed.'),
      R('Technical', '60 minutes', 'Friendly', ['HLD'], [
        Q('Design real-time order tracking for 5M concurrent users.', 'System Design', ['System Design', 'WebSockets', 'Caching'])
      ], 'Talked about WebSockets vs SSE, geohash-based fan-out and location-update throttling.'),
      R('HR', '30 minutes', 'Friendly', ['Behavioral'], [Q('What would you improve in the Swiggy app?', 'Behavioral', ['Behavioral'])], 'Product opinions are welcomed.')
    ],
    overallTips: 'Think in real-time assignment problems: heaps, geo-indexing, queues. Have opinions on the product.',
    resourcesUsed: 'LeetCode, Swiggy Bytes blog, Grokking System Design'
  },

  // ─────────────── MORE VARIETY (years / roles / outcomes) ───────────────
  {
    company: 'amazon', college: 'iit-bombay', role: 'SDE-1', year: 2026, month: 'January', offerReceived: 'Pending', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '9.2', applicationSource: 'On-campus', isVerified: false, upvotes: 6,
    rounds: [
      R('OA', '105 minutes', 'Neutral', ['Graphs', 'Arrays'], [
        Q('Given a network of servers and latencies, find the minimum time for a signal to reach all nodes.', 'DSA', ['Graphs', 'Dijkstra']),
        Q('Find the smallest subarray with sum ≥ target after removing at most one element.', 'DSA', ['Sliding Window', 'Dynamic Programming'])
      ], 'The first was Network Delay Time (Dijkstra). The second was harder — DP over "removed or not" states.'),
      R('Technical', '60 minutes', 'Friendly', ['Trees', 'Leadership Principles'], [
        Q('Vertical order traversal of a binary tree.', 'DSA', ['Trees', 'BFS']),
        Q('Tell me about a time you failed and what you changed after.', 'Behavioral', ['Behavioral'])
      ], 'Waiting on the result at the time of writing.')
    ],
    overallTips: 'Keep Dijkstra and sliding-window-with-state ready. LP stories need numbers.',
    resourcesUsed: 'LeetCode, NeetCode 150'
  },
  {
    company: 'microsoft', college: 'iit-madras', role: 'Data Analyst', year: 2025, month: 'November', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'On-campus', compensation: { base: '24 LPA', bonus: '3 LPA', stock: '' }, isVerified: false, upvotes: 12,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['SQL', 'Statistics'], [
        Q('SQL: find the top-selling product per region per quarter, including ties.', 'Role-specific', ['SQL']),
        Q('Explain p-values to a non-technical stakeholder.', 'Role-specific', ['Statistics'])
      ], 'Window functions (DENSE_RANK) show up a lot.'),
      R('Technical', '60 minutes', 'Friendly', ['Analytics', 'Python'], [
        Q('Given a dataset with 20% missing values, how do you decide between dropping and imputing?', 'Role-specific', ['Data Cleaning']),
        Q('Design a dashboard for Teams adoption: which metrics do you show and why?', 'Role-specific', ['Metrics', 'Analytics'])
      ], 'Open-ended; the interviewer wanted trade-offs, not a recipe.')
    ],
    overallTips: 'SQL windows + stats intuition + a metrics framework. They care about communication to non-technical audiences.',
    resourcesUsed: 'StrataScratch, Mode SQL, Storytelling with Data'
  },
  {
    company: 'google', college: 'bits-pilani', role: 'Product Manager', year: 2024, month: 'December', offerReceived: 'No', difficulty: 'Hard', experienceRating: 'Neutral',
    cgpa: '8.9', applicationSource: 'Off-campus', isVerified: false, upvotes: 10,
    rounds: [
      R('Technical', '45 minutes', 'Neutral', ['Product Design'], [
        Q('Design a product to help elderly users manage medications.', 'Role-specific', ['Product Design'])
      ], 'Structured well but I under-prioritised — jumped into features before defining the user problem.'),
      R('Technical', '45 minutes', 'Grilling', ['Analytics', 'Estimation'], [
        Q('Estimate the number of Google Maps queries per day in India.', 'Role-specific', ['Estimation']),
        Q('YouTube watch-time is down 5% week over week. Diagnose.', 'Role-specific', ['Analytics', 'Metrics'])
      ], 'The interviewer kept pushing for concrete segmentation. Rejected — feedback was around prioritisation and crispness.')
    ],
    overallTips: 'For Google PM: always define the user and goal first, then options, then prioritise with a clear criterion. Practise out loud.',
    resourcesUsed: 'Decode and Conquer, Exponent, Cracking the PM Interview'
  },
  {
    company: 'flipkart', college: 'iit-delhi', role: 'SDE-1', year: 2022, month: 'December', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'On-campus', compensation: { base: '25 LPA', bonus: '3 LPA', stock: '₹20 lakh ESOPs' }, isVerified: true, upvotes: 19,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Graphs'], [
        Q('Given a list of trips with start/end times, find the minimum number of vehicles required.', 'DSA', ['Intervals', 'Heap']),
        Q('Find the number of distinct islands in a grid.', 'DSA', ['Graphs', 'DFS', 'Hashing'])
      ], 'Both standard patterns for Flipkart.'),
      R('Technical', '90 minutes', 'Neutral', ['Machine Coding'], [
        Q('Machine coding: implement a Splitwise clone with add expense, split equally/exact/percent, and show balances.', 'System Design', ['LLD', 'OOP'])
      ], 'They ran my code against their test cases at the end — make sure it actually works.'),
      R('Technical', '60 minutes', 'Friendly', ['Dynamic Programming'], [Q('Egg dropping problem with 2 eggs and 100 floors, then generalise to K eggs.', 'DSA', ['Dynamic Programming'])], 'Classic. They liked seeing the O(n·k) then the binary-search optimisation.')
    ],
    overallTips: 'Machine coding is where most candidates lose out — practise with a strict timer.',
    resourcesUsed: 'LeetCode, Splitwise LLD walk-throughs'
  },
  {
    company: 'google', college: 'nit-warangal', role: 'SDE-1', year: 2022, month: 'October', offerReceived: 'Yes', difficulty: 'Grueling', experienceRating: 'Positive',
    cgpa: '9.0', applicationSource: 'On-campus', compensation: { base: '30 LPA', bonus: '3 LPA', stock: '$140k RSUs' }, isVerified: true, upvotes: 35,
    rounds: [
      R('Technical', '45 minutes', 'Neutral', ['Arrays', 'Trees'], [
        Q('Given a BST and a range [L, R], trim the tree so all its nodes lie in [L, R].', 'DSA', ['Trees', 'BST', 'Recursion']),
        Q('Given an array, find the length of the longest subarray with the product positive.', 'DSA', ['Arrays', 'Dynamic Programming'])
      ], 'Two problems at a steady pace.'),
      R('Technical', '45 minutes', 'Grilling', ['Graphs', 'Union Find'], [
        Q('Accounts merge — given lists of emails per account, merge accounts sharing an email.', 'DSA', ['Union Find', 'Hashing', 'Graphs']),
        Q('How would you scale this to billions of accounts?', 'System Design', ['System Design'])
      ], 'The scale-up discussion covered map-reduce style connected components.'),
      R('Technical', '45 minutes', 'Neutral', ['Dynamic Programming'], [
        Q('Number of distinct subsequences of s equal to t.', 'DSA', ['Dynamic Programming', 'Strings'])
      ], 'Hard DP, I needed hints for the recurrence.'),
      R('HR', '45 minutes', 'Friendly', ['Behavioral'], [Q('Tell me about an ambiguous project you handled.', 'Behavioral', ['Behavioral'])], 'Got the offer after the hiring committee.')
    ],
    overallTips: 'Practise hints gracefully — taking one hint and finishing cleanly beats getting stuck silently.',
    resourcesUsed: 'LeetCode Hard, Codeforces, CP-Algorithms'
  },
  {
    company: 'oracle', college: 'mit-manipal', role: 'Software Developer', year: 2023, month: 'February', offerReceived: 'No', difficulty: 'Medium', experienceRating: 'Negative',
    cgpa: '7.8', applicationSource: 'Off-campus', isVerified: false, upvotes: 7,
    rounds: [
      R('OA', '100 minutes', 'Neutral', ['CS Fundamentals'], [
        Q('MCQs on Java, DBMS and OS with negative marking.', 'CS Fundamentals', ['DBMS', 'Operating Systems', 'Java'])
      ], 'Did not clear the MCQ cut-off — underestimated the fundamentals.')
    ],
    overallTips: 'Negative marking makes guessing costly. Revise Java collections, DBMS and OS core topics before the test.',
    resourcesUsed: 'None really — that was the mistake'
  }
];
