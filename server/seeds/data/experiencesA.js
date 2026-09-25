/**
 * Interview experiences — FAANG tier. Written to read like real student reports: specific
 * questions, honest difficulty, concrete prep advice. `college` is a College slug; the seed
 * assigns an author from the demo cohort at that college (or leaves it anonymous).
 */

const Q = (text, questionType = 'DSA', topicTags = []) => ({ text, questionType, topicTags });
const R = (type, duration, vibe, topics, questions, tips = '') => ({ type, duration, vibe, topics, questions, tips });

module.exports = [
  // ─────────────── GOOGLE ───────────────
  {
    company: 'google', college: 'iit-bombay', role: 'SDE-1', year: 2025, month: 'August', offerReceived: 'Yes', difficulty: 'Very Hard', experienceRating: 'Positive',
    cgpa: '9.1', applicationSource: 'On-campus', compensation: { base: '32 LPA', bonus: '4 LPA', stock: '~$180k RSUs over 4 years' }, isVerified: true, upvotes: 64, anonymous: false,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Graphs', 'Dynamic Programming'], [
        Q('Given a grid with obstacles and teleporters, find the minimum time to reach the bottom-right cell.', 'DSA', ['Graphs', 'BFS', 'Dijkstra']),
        Q('Count the number of ways to partition a string into palindromic substrings such that each has length ≥ 3, modulo 1e9+7.', 'DSA', ['Dynamic Programming', 'Strings'])
      ], 'Both problems were hard-ish. I solved the first fully and the second with an O(n²) DP that passed all but one test. Speed matters — do not spend 50 minutes on one.'),
      R('Technical', '45 minutes', 'Friendly', ['Arrays', 'Binary Search', 'Hashing'], [
        Q('Find the minimum window in an array such that sorting only that window sorts the whole array.', 'DSA', ['Arrays', 'Two Pointers']),
        Q('Follow-up: how would you do it if the array is streamed and you can only keep O(1) extra state?', 'DSA', ['Arrays'])
      ], 'The interviewer cared that I started with brute force, then optimised. He kept asking "what breaks this?" so list your edge cases out loud.'),
      R('Technical', '45 minutes', 'Grilling', ['Trees', 'Graphs', 'Dynamic Programming'], [
        Q('Given a binary tree, find the maximum sum of nodes such that no two chosen nodes are adjacent (parent-child).', 'DSA', ['Trees', 'Dynamic Programming']),
        Q('Extend it to a general graph with no cycles of length ≤ 3 — what changes?', 'DSA', ['Graphs'])
      ], 'The follow-up was open-ended. It is fine to say "I do not know the optimal solution, here is a reasonable one and why it is correct".'),
      R('HR', '45 minutes', 'Friendly', ['Behavioral', 'Leadership'], [
        Q('Tell me about a time you disagreed with a teammate on a technical decision. What did you do?', 'Behavioral', ['Behavioral']),
        Q('Describe a project where the requirements kept changing.', 'Behavioral', ['Behavioral'])
      ], 'Googlyness was conversational. STAR stories with a concrete "what I learned" worked well.')
    ],
    overallTips: 'Google rewards clear thinking over speed. Practise explaining your approach out loud, write clean code, and test with your own examples before the interviewer asks. Graphs and DP were 70% of everything I saw.',
    resourcesUsed: 'LeetCode, NeetCode 150, Striver A2Z, Codeforces Div-2 C problems, Pramp mock interviews'
  },
  {
    company: 'google', college: 'iiit-hyderabad', role: 'SDE-1', year: 2024, month: 'July', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'Referral', compensation: { base: '30 LPA', bonus: '3 LPA', stock: '$160k RSUs' }, isVerified: true, upvotes: 41,
    rounds: [
      R('Technical', '45 minutes', 'Friendly', ['Strings', 'Hashing', 'Sliding Window'], [
        Q('Longest substring with at most k distinct characters, and then with exactly k.', 'DSA', ['Sliding Window', 'Hashing']),
        Q('How would your solution change if characters are Unicode code points instead of ASCII?', 'DSA', ['Strings'])
      ], 'Straightforward first round. The twist was the "exactly k" variation — reduce it to atMost(k) − atMost(k−1).'),
      R('Technical', '45 minutes', 'Neutral', ['Graphs', 'Union Find', 'Topological Sort'], [
        Q('Given a list of course prerequisites and time per course, find the minimum total time to complete all courses when unlimited courses can run in parallel.', 'DSA', ['Graphs', 'Topological Sort', 'Dynamic Programming']),
        Q('How would you detect and report a cycle in the prerequisites?', 'DSA', ['Graphs', 'DFS'])
      ], 'Longest path in a DAG with topological order. I got the DP right but forgot cycle detection until prompted.'),
      R('Technical', '45 minutes', 'Grilling', ['Dynamic Programming', 'Bitmasking'], [
        Q('Assign N tasks to N workers to minimise total cost, N ≤ 16. Then explain what you would do for N = 1000.', 'DSA', ['Dynamic Programming', 'Bitmasking']),
      ], 'Bitmask DP for small N, and the Hungarian algorithm idea for large N. Knowing that a polynomial algorithm exists was enough for the follow-up.'),
      R('HR', '30 minutes', 'Friendly', ['Behavioral'], [
        Q('Why Google? Which product would you improve and how?', 'Behavioral', ['Behavioral'])
      ], 'Casual chat; be ready with a specific product opinion.')
    ],
    overallTips: 'Referral got me the interview but the bar is the same. Practise solving unfamiliar problems by reducing them to something you know (DAG longest path, atMost(k) trick). Always ask clarifying questions.',
    resourcesUsed: 'LeetCode, Codeforces, CP-Algorithms, MIT 6.006 lectures'
  },
  {
    company: 'google', college: 'nit-trichy', role: 'SDE-1', year: 2023, month: 'September', offerReceived: 'No', difficulty: 'Very Hard', experienceRating: 'Neutral',
    cgpa: '8.4', applicationSource: 'Off-campus', isVerified: false, upvotes: 27,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Greedy'], [
        Q('Given intervals of meeting requests with priorities, choose a subset that maximises total priority with no overlaps.', 'DSA', ['Dynamic Programming', 'Sorting', 'Binary Search'])
      ], 'Weighted interval scheduling. I knew the pattern but botched the binary search boundary.'),
      R('Technical', '45 minutes', 'Grilling', ['Graphs', 'Shortest Path'], [
        Q('Find the cheapest path from A to B with at most K stops, then modify it to allow one free edge.', 'DSA', ['Graphs', 'Dijkstra', 'Dynamic Programming']),
      ], 'I jumped to Dijkstra without handling the stop limit — the interviewer had to steer me. Layered-state BFS/Bellman-Ford was the intended approach.'),
      R('Technical', '45 minutes', 'Neutral', ['Trees', 'Design'], [
        Q('Design an in-memory autocomplete for a search box. Discuss the data structure, updates, and ranking.', 'System Design', ['Trie', 'System Design']),
        Q('Implement the trie insert and top-k suggestions.', 'DSA', ['Trie', 'Heap'])
      ], 'Did fine here, but the first two rounds left me flustered. Rejected after the final committee.')
    ],
    overallTips: 'Do not go into your first Google loop unprepared for state-augmented graph problems (K stops, free edge). Mock interviews would have saved me — I only practised alone.',
    resourcesUsed: 'LeetCode, GeeksforGeeks, some Striver videos'
  },
  {
    company: 'google', college: 'iit-delhi', role: 'SDE-2', year: 2026, month: 'February', offerReceived: 'Pending', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.8', applicationSource: 'Referral', isVerified: false, upvotes: 12,
    rounds: [
      R('Technical', '45 minutes', 'Friendly', ['Design', 'Concurrency'], [
        Q('Design a rate limiter that works across multiple servers. What are the tradeoffs between token bucket and sliding-window log?', 'System Design', ['System Design', 'Caching']),
        Q('Implement a thread-safe LRU cache.', 'DSA', ['Linked Lists', 'Hashing', 'Concurrency'])
      ], 'Interviewer wanted to see me reason about consistency vs. latency.'),
      R('Technical', '45 minutes', 'Neutral', ['Graphs', 'Strings'], [
        Q('Word ladder II — return all shortest transformation sequences.', 'DSA', ['Graphs', 'BFS', 'Backtracking'])
      ], 'BFS to build levels + DFS backtracking to reconstruct. Be careful with memory on large dictionaries.')
    ],
    overallTips: 'Waiting on the hiring committee at the time of writing. Rounds felt fair; prepare for both design and hard graph problems at SDE-2.',
    resourcesUsed: 'System Design Interview (Alex Xu), LeetCode, Designing Data-Intensive Applications'
  },

  // ─────────────── AMAZON ───────────────
  {
    company: 'amazon', college: 'nit-trichy', role: 'SDE-1', year: 2024, month: 'August', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.6', applicationSource: 'On-campus', compensation: { base: '18 LPA', bonus: '3 LPA joining', stock: '$50k RSUs (5/15/40/40)' }, isVerified: true, upvotes: 88,
    rounds: [
      R('OA', '105 minutes', 'Neutral', ['Arrays', 'Greedy', 'Graphs'], [
        Q('Given an array of package weights, find the minimum number of trucks with capacity C to ship all (each truck carries a contiguous subarray).', 'DSA', ['Binary Search', 'Arrays']),
        Q('Given a grid of servers (0/1), find the minimum number of days to infect all servers if infection spreads to 4-neighbours each day.', 'DSA', ['Graphs', 'BFS']),
        Q('Work simulation: prioritise these 5 messages from your manager and teammates.', 'Behavioral', ['Behavioral'])
      ], 'Two coding questions + debugging + work-style assessment. Both coding problems were medium: binary-search-on-answer and multi-source BFS (same as Rotting Oranges).'),
      R('Technical', '60 minutes', 'Friendly', ['Trees', 'Hashing', 'Leadership Principles'], [
        Q('Serialize and deserialize a binary tree.', 'DSA', ['Trees', 'BFS']),
        Q('Design a data structure for get/put in O(1) with LRU eviction.', 'DSA', ['Linked Lists', 'Hashing']),
        Q('Tell me about a time you took ownership of something outside your responsibility.', 'Behavioral', ['Behavioral'])
      ], 'Started with 15 minutes of LP questions, then two coding questions. Wrote code on a shared editor while explaining.'),
      R('Technical', '60 minutes', 'Neutral', ['Graphs', 'Design', 'Leadership Principles'], [
        Q('Clone an undirected graph.', 'DSA', ['Graphs', 'DFS']),
        Q('Design a parking lot with different vehicle types (LLD).', 'System Design', ['OOP', 'System Design']),
        Q('Describe a time you disagreed with your manager (Have Backbone; Disagree and Commit).', 'Behavioral', ['Behavioral'])
      ], 'The LLD part expected classes, relationships and one or two design patterns. Do not skip the LP questions — they are scored.'),
      R('Managerial', '60 minutes', 'Grilling', ['Behavioral', 'Design'], [
        Q('Tell me about the most technically challenging project you have built. What would you do differently?', 'Behavioral', ['Behavioral']),
        Q('Design a notification system that sends 10 million emails/day.', 'System Design', ['System Design', 'Queues']),
        Q('Tell me about a time you failed.', 'Behavioral', ['Behavioral'])
      ], 'Bar Raiser. Mostly behavioural with one coding warm-up. Deep follow-ups on each STAR story — have real numbers ready.')
    ],
    overallTips: 'Amazon is an LP company first. I prepared 10 STAR stories and mapped each to 2–3 principles. For coding, BFS/DFS on grids, binary search on answer, and LRU-style design covered almost everything.',
    resourcesUsed: 'LeetCode Amazon tagged (top 50), Amazon LP doc, Striver SDE Sheet, Grokking the Behavioural Interview'
  },
  {
    company: 'amazon', college: 'vit-vellore', role: 'SDE-1', year: 2024, month: 'October', offerReceived: 'No', difficulty: 'Medium', experienceRating: 'Neutral',
    cgpa: '8.1', applicationSource: 'On-campus', isVerified: false, upvotes: 33,
    rounds: [
      R('OA', '105 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Given a string, find the length of the longest substring where each character appears at least k times.', 'DSA', ['Strings', 'Divide and Conquer']),
        Q('Merge k sorted arrays with limited memory.', 'DSA', ['Heap', 'Arrays'])
      ], 'Cleared the OA — 2 of 2 passing. About 1,500 people took it and ~60 were shortlisted.'),
      R('Technical', '60 minutes', 'Friendly', ['Trees', 'Leadership Principles'], [
        Q('Lowest common ancestor of a binary tree.', 'DSA', ['Trees']),
        Q('Tell me about a time you had to learn something quickly.', 'Behavioral', ['Behavioral'])
      ], 'Went fine. The interviewer was helpful when I got stuck on the iterative version.'),
      R('Technical', '60 minutes', 'Grilling', ['Design', 'Leadership Principles'], [
        Q('Design a URL shortener. How do you avoid collisions? How do you scale reads?', 'System Design', ['System Design', 'Hashing']),
        Q('Give an example of a time you delivered results under a tight deadline.', 'Behavioral', ['Behavioral'])
      ], 'My LP answers were vague ("we did X"). Got feedback later that they wanted "I" statements and measurable results. Rejected.')
    ],
    overallTips: 'Be specific in behavioural answers: your actions, numbers, and outcome. I knew the DSA but lost points on Ownership and Deliver Results because I spoke in generalities.',
    resourcesUsed: 'LeetCode, InterviewBit, YouTube (Take U Forward)'
  },
  {
    company: 'amazon', college: 'bits-pilani', role: 'SDE Intern', year: 2025, month: 'January', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '9.0', applicationSource: 'On-campus', compensation: { base: '₹1.2 lakh/month stipend', bonus: '', stock: '' }, isVerified: true, upvotes: 39,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Two Pointers', 'Stacks'], [
        Q('Next greater element to the right for each array element, then follow-up with a circular array.', 'DSA', ['Stack', 'Monotonic Stack']),
        Q('Given a list of orders with deadlines and profits, maximise profit (job sequencing).', 'DSA', ['Greedy', 'Sorting'])
      ], 'Both standard. Monotonic stack and greedy scheduling.'),
      R('Technical', '45 minutes', 'Friendly', ['Linked Lists', 'Recursion'], [
        Q('Reverse nodes in k-group in a linked list.', 'DSA', ['Linked Lists', 'Recursion']),
        Q('What is the difference between an array and a linked list? When would you use each?', 'CS Fundamentals', ['Linked Lists'])
      ], 'Single 45-minute technical for interns. Cleaner code and clear complexity analysis mattered.'),
    ],
    overallTips: 'Intern loops are lighter — one coding round after the OA. Nail medium-level problems on linked lists, stacks and greedy and you are in good shape.',
    resourcesUsed: 'LeetCode, GFG, Aditya Verma DP playlist'
  },
  {
    company: 'amazon', college: 'iit-madras', role: 'SDE-2', year: 2025, month: 'March', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '8.7', applicationSource: 'Referral', compensation: { base: '38 LPA', bonus: '10 LPA', stock: '$120k RSUs' }, isVerified: true, upvotes: 52,
    rounds: [
      R('Technical', '60 minutes', 'Neutral', ['Graphs', 'Heaps'], [
        Q('Design a system that finds the k closest drivers to a rider in real time.', 'System Design', ['System Design', 'Heap', 'Geo-indexing']),
        Q('Merge intervals with insertions streamed in.', 'DSA', ['Intervals', 'Heap'])
      ], 'Started with LPs then coding. SDE-2 expects design depth: QuadTrees / geohash and how you would shard.'),
      R('Technical', '60 minutes', 'Grilling', ['Design', 'Concurrency'], [
        Q('Design an order management system: idempotency, retries, exactly-once semantics.', 'System Design', ['System Design', 'Queues', 'Databases']),
        Q('Explain how you would handle a hot partition in DynamoDB.', 'System Design', ['Databases'])
      ], 'Talk about failure modes early. The interviewer kept adding constraints (10× traffic, region failover).'),
      R('Managerial', '60 minutes', 'Grilling', ['Leadership Principles'], [
        Q('Tell me about a time you had to influence without authority.', 'Behavioral', ['Behavioral']),
        Q('Describe a decision you made with incomplete data.', 'Behavioral', ['Behavioral'])
      ], 'Bar raiser. Pure LP with hard follow-ups on each story.')
    ],
    overallTips: 'For SDE-2 the DSA is medium but the design and LP bar is high. Keep two design case studies ready and know every number in your resume stories.',
    resourcesUsed: 'System Design Interview Vol 1&2, DDIA, Amazon LP doc, LeetCode mediums'
  },
  {
    company: 'amazon', college: 'srm', role: 'SDE-1', year: 2022, month: 'November', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.3', applicationSource: 'On-campus', isVerified: false, upvotes: 21,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Find the smallest subarray with sum at least S (positive numbers).', 'DSA', ['Sliding Window']),
        Q('Group a list of strings by their anagram class and return the largest group.', 'DSA', ['Hashing', 'Strings'])
      ], 'Two easy-medium problems; took 55 minutes for both.'),
      R('Technical', '60 minutes', 'Friendly', ['Trees'], [
        Q('Print the right-side view of a binary tree.', 'DSA', ['Trees', 'BFS']),
        Q('Explain how HashMap works internally in Java.', 'CS Fundamentals', ['Hashing'])
      ], 'Friendly interviewer who asked a lot of project questions.'),
      R('Managerial', '45 minutes', 'Friendly', ['Leadership Principles'], [
        Q('Tell me about a time you went above and beyond for a customer.', 'Behavioral', ['Behavioral'])
      ], 'Combined LP + one coding problem. Offer came within a week.')
    ],
    overallTips: 'Straightforward loop. Solid fundamentals and 3-4 honest project stories were enough.',
    resourcesUsed: 'GeeksforGeeks, LeetCode Easy/Medium, Love Babbar 450'
  },

  // ─────────────── MICROSOFT ───────────────
  {
    company: 'microsoft', college: 'iit-delhi', role: 'SDE-1', year: 2025, month: 'August', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.9', applicationSource: 'On-campus', compensation: { base: '30 LPA', bonus: '5 LPA', stock: '₹10 lakh RSUs' }, isVerified: true, upvotes: 57,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Trees', 'Dynamic Programming'], [
        Q('Count the number of paths in a binary tree with sum equal to K.', 'DSA', ['Trees', 'Hashing', 'Prefix Sum']),
        Q('Minimum cost to climb stairs with the option to skip at most one step.', 'DSA', ['Dynamic Programming']),
        Q('Rotate a matrix by 90 degrees in place.', 'DSA', ['Arrays', 'Matrix'])
      ], 'Three questions in 90 minutes on Codility. Solved 3/3 with the tree one passing 9/10 cases.'),
      R('Technical', '60 minutes', 'Friendly', ['Linked Lists', 'Strings', 'OOP'], [
        Q('Detect and remove a cycle in a linked list.', 'DSA', ['Linked Lists']),
        Q('Design a class hierarchy for a library management system.', 'System Design', ['OOP']),
        Q('Difference between abstract class and interface.', 'CS Fundamentals', ['OOP'])
      ], 'Interviewer spent a lot of time on how I test code. Mention unit tests early.'),
      R('Technical', '60 minutes', 'Neutral', ['Trees', 'OS', 'DBMS'], [
        Q('Convert a sorted array to a height-balanced BST and print it level by level.', 'DSA', ['Trees', 'Recursion']),
        Q('What is a deadlock? Give the four Coffman conditions and how to prevent it.', 'CS Fundamentals', ['Operating Systems']),
        Q('Explain indexing in databases. When can an index hurt?', 'CS Fundamentals', ['DBMS'])
      ], 'CS fundamentals are a real part of the Microsoft loop — do not neglect OS and DBMS.'),
      R('Managerial', '45 minutes', 'Friendly', ['Behavioral', 'Projects'], [
        Q('Walk me through your favourite project and the hardest bug you fixed.', 'Behavioral', ['Behavioral']),
        Q('How do you handle conflicting feedback from two seniors?', 'Behavioral', ['Behavioral'])
      ], 'Conversational. Got the offer call two days later.')
    ],
    overallTips: 'Microsoft loves fundamentals: OS, DBMS, OOP and clean code. DSA is medium-level and they will happily discuss trade-offs instead of pushing for the absolute optimum.',
    resourcesUsed: 'LeetCode Microsoft tagged, CS fundamentals notes (Gate Smashers), Head First Design Patterns'
  },
  {
    company: 'microsoft', college: 'nit-warangal', role: 'SDE-1', year: 2024, month: 'September', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.2', applicationSource: 'On-campus', isVerified: true, upvotes: 36,
    rounds: [
      R('OA', '90 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Longest palindromic substring.', 'DSA', ['Strings', 'Dynamic Programming']),
        Q('Given a sorted rotated array, find the minimum element and the number of rotations.', 'DSA', ['Binary Search'])
      ], 'Two problems, clean solutions with all cases passed.'),
      R('Technical', '60 minutes', 'Friendly', ['Arrays', 'Hashing'], [
        Q('Find all pairs in an array that sum to a target, without duplicates in the output.', 'DSA', ['Hashing', 'Two Pointers']),
        Q('Design a thread-safe singleton in your favourite language.', 'CS Fundamentals', ['OOP', 'Concurrency'])
      ], 'Discussed synchronisation options: double-checked locking, static holder idiom.'),
      R('Technical', '60 minutes', 'Neutral', ['Graphs', 'Trees'], [
        Q('Number of islands, then a follow-up counting distinct island shapes.', 'DSA', ['Graphs', 'DFS', 'Hashing']),
        Q('Given a binary tree, check if it is a valid BST.', 'DSA', ['Trees'])
      ], 'The distinct shapes follow-up needed path-signature hashing. Nice one.'),
      R('HR', '30 minutes', 'Friendly', ['Behavioral'], [Q('Why Microsoft? Where do you see yourself in 3 years?', 'Behavioral', ['Behavioral'])], 'Standard.')
    ],
    overallTips: 'Prepare Number-of-Islands-style variations. Practise explaining your solution while coding.',
    resourcesUsed: 'LeetCode, Striver SDE sheet, Gate Smashers OS/DBMS'
  },
  {
    company: 'microsoft', college: 'vit-vellore', role: 'SDE Intern', year: 2023, month: 'August', offerReceived: 'Yes', difficulty: 'Easy', experienceRating: 'Positive',
    cgpa: '8.5', applicationSource: 'On-campus', isVerified: false, upvotes: 18,
    rounds: [
      R('OA', '75 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Check if two strings are anagrams and count the minimum deletions to make them so.', 'DSA', ['Hashing', 'Strings']),
        Q('Find the second-largest element without sorting.', 'DSA', ['Arrays'])
      ], 'Straightforward.'),
      R('Technical', '45 minutes', 'Friendly', ['Linked Lists', 'Sorting'], [
        Q('Merge two sorted linked lists.', 'DSA', ['Linked Lists']),
        Q('Explain quicksort and its worst case. How do you avoid it?', 'CS Fundamentals', ['Sorting'])
      ], 'Friendly and fundamentals-oriented.')
    ],
    overallTips: 'Intern loops focus on basics. Be crisp on sorting, linked lists and hashing.',
    resourcesUsed: 'GeeksforGeeks, LeetCode Easy'
  },
  {
    company: 'microsoft', college: 'bits-pilani', role: 'Program Manager', year: 2024, month: 'July', offerReceived: 'Yes', difficulty: 'Medium', experienceRating: 'Positive',
    cgpa: '8.8', applicationSource: 'On-campus', isVerified: true, upvotes: 24,
    rounds: [
      R('OA', '60 minutes', 'Neutral', ['Aptitude', 'Product Sense'], [
        Q('You are the PM for Microsoft Teams. Pick one metric to improve meeting quality and justify it.', 'Role-specific', ['Product Sense', 'Metrics'])
      ], 'Aptitude + a written product-sense question.'),
      R('Technical', '45 minutes', 'Friendly', ['Product Sense', 'Analytics'], [
        Q('Design an alarm clock for blind users.', 'Role-specific', ['Product Design']),
        Q('DAU dropped by 10% overnight — how do you investigate?', 'Role-specific', ['Analytics', 'Metrics'])
      ], 'Structure your answer: clarify → segment users → list hypotheses → prioritise → propose experiment.'),
      R('Managerial', '45 minutes', 'Neutral', ['Prioritisation', 'Stakeholders'], [
        Q('You have 3 features and capacity for 1. How do you decide?', 'Role-specific', ['Prioritisation']),
        Q('Tell me about a time you influenced engineers without authority.', 'Behavioral', ['Behavioral'])
      ], 'RICE / impact-effort frameworks were welcomed but they wanted my own judgement.')
    ],
    overallTips: 'For PM roles: practise product-design and metrics cases with a clear framework, and always tie decisions back to the user.',
    resourcesUsed: 'Cracking the PM Interview, Exponent, Lenny\'s Newsletter'
  },

  // ─────────────── META / APPLE ───────────────
  {
    company: 'meta', college: 'iit-bombay', role: 'Software Engineer', year: 2024, month: 'November', offerReceived: 'Yes', difficulty: 'Very Hard', experienceRating: 'Positive',
    cgpa: '9.3', applicationSource: 'Referral', compensation: { base: '$140k', bonus: '10%', stock: '$250k RSUs (London)' }, isVerified: true, upvotes: 71,
    rounds: [
      R('Technical', '45 minutes', 'Neutral', ['Arrays', 'Strings'], [
        Q('Given a string with parentheses and letters, remove the minimum number of parentheses to make it valid.', 'DSA', ['Stack', 'Strings']),
        Q('Find the k-th missing positive number in a sorted array.', 'DSA', ['Binary Search'])
      ], 'Two mediums in 45 minutes — the speed is the challenge. Aim for ~20 minutes per problem including test cases.'),
      R('Technical', '45 minutes', 'Grilling', ['Graphs', 'Trees'], [
        Q('Binary tree vertical order traversal.', 'DSA', ['Trees', 'BFS', 'Hashing']),
        Q('Shortest bridge between two islands in a grid.', 'DSA', ['Graphs', 'BFS'])
      ], 'The interviewer interrupted often to check I could write bug-free code fast.'),
      R('Technical', '45 minutes', 'Neutral', ['Design'], [
        Q('Design Instagram\'s feed ranking at a high level.', 'System Design', ['System Design', 'Caching', 'Queues'])
      ], 'Product-flavoured design: talk about fan-out on write vs read, caching and ranking signals.'),
      R('HR', '45 minutes', 'Friendly', ['Behavioral'], [
        Q('Tell me about a time you had a conflict with a coworker.', 'Behavioral', ['Behavioral']),
        Q('How do you move fast without breaking things?', 'Behavioral', ['Behavioral'])
      ], 'Jedi round; be specific about impact and what you learned.')
    ],
    overallTips: 'Speed + accuracy on mediums is everything. I did ~300 LeetCode mediums with a timer. Drill BFS/DFS on grids, stacks, intervals and binary search.',
    resourcesUsed: 'LeetCode Meta tagged (last 6 months), Blind 75, Grokking System Design'
  },
  {
    company: 'apple', college: 'iiit-hyderabad', role: 'Software Engineer', year: 2025, month: 'May', offerReceived: 'Yes', difficulty: 'Hard', experienceRating: 'Positive',
    cgpa: '9.0', applicationSource: 'On-campus', compensation: { base: '35 LPA', bonus: '5 LPA', stock: '$100k RSUs' }, isVerified: true, upvotes: 29,
    rounds: [
      R('Technical', '60 minutes', 'Friendly', ['C++', 'Memory', 'Arrays'], [
        Q('Implement a simple memory allocator with malloc/free semantics.', 'CS Fundamentals', ['Memory', 'Linked Lists']),
        Q('Explain virtual functions and the vtable.', 'CS Fundamentals', ['OOP', 'C++'])
      ], 'Team-specific (core OS). They asked a lot of low-level questions.'),
      R('Technical', '60 minutes', 'Neutral', ['Concurrency', 'Data Structures'], [
        Q('Design a lock-free queue. What are the ABA problem and memory ordering issues?', 'CS Fundamentals', ['Concurrency']),
        Q('Merge k sorted streams with bounded memory.', 'DSA', ['Heap'])
      ], 'Prepare for concurrency depth if you apply to systems teams.'),
      R('Managerial', '45 minutes', 'Friendly', ['Behavioral', 'Projects'], [
        Q('Tell me about the most complex system you built alone.', 'Behavioral', ['Behavioral'])
      ], 'The manager was genuinely curious about my OS project.')
    ],
    overallTips: 'Apple is team-specific — ask your recruiter which team and prep accordingly. For systems teams: C/C++, memory, concurrency, OS.',
    resourcesUsed: 'OSTEP, C++ Primer, LeetCode, MIT 6.828 labs'
  }
];
