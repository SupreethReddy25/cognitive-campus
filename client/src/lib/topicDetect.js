/**
 * Reads a sentence a student typed about an interview question and works out what it was about, so they never have to
 * fill in tags by hand. Deliberately conservative: a wrong tag is worse than a missing one, and everything it suggests
 * can be removed with one click.
 */

const RULES = [
  ['Arrays', /\b(array|subarray|two[- ]pointers?|sliding window|prefix sum|kadane|rotate (the )?array)\b/i],
  ['Strings', /\b(string|substring|palindrom|anagram|parenthes|longest common prefix)\w*/i],
  ['Hashing', /\b(hash ?(map|set|table)|hashing|frequency|two sum|duplicates?)\b/i],
  ['Sorting', /\b(sort(ing|ed)?|merge sort|quick ?sort|comparator|intervals?)\b/i],
  ['Binary Search', /\b(binary search|sorted (array|list)|rotated|search in|kth (smallest|largest) in sorted)\b/i],
  ['Linked Lists', /\b(linked list|reverse (a )?list|cycle in|merge (two )?(sorted )?lists?|node (from|of) the end)\b/i],
  ['Stacks & Queues', /\b(stack|queue|monotonic|next greater|min stack|lru)\b/i],
  ['Trees', /\b(binary tree|bst|binary search tree|tree|trie|lca|lowest common ancestor|inorder|preorder|level order|diameter|traversal)\b/i],
  ['Graphs', /\b(graph|bfs|dfs|shortest path|dijkstra|topological|islands?|union[- ]?find|course schedule|grid|network delay|connected components?|servers?)\b/i],
  ['Dynamic Programming', /\b(dp|dynamic programming|knapsack|subsequence|coin change|memoi[sz]ation|edit distance|climbing stairs|house robber|longest increasing|min(imum)? cost)\b/i],
  ['Greedy', /\b(greedy|meeting rooms?|jump game|activity selection|minimum (number of )?(platforms|trucks|arrows))\b/i],
  ['Recursion', /\b(recurs\w*|backtrack\w*|permutations?|subsets?|combinations?|n-?queens|sudoku|generate parenthes\w+)\b/i],
  ['Heaps', /\b(heap|priority queue|top k|k(th)? (largest|smallest|frequent)|median (of|from) (a )?(data )?stream)\b/i],
  ['System Design', /\b(system design|hld|scal(e|ing|able)|distributed|load balanc\w*|url shortener|rate limiter|news ?feed|design (a|an|the) [\w\s-]{3,40}(service|system|app|platform|cache|queue|store))\b/i],
  ['LLD / OOP', /\b(lld|low[- ]level design|design patterns?|oop|object[- ]oriented|class diagram|parking lot|elevator|solid principles?|inheritance|polymorphism)\b/i],
  ['SQL', /\b(sql|joins?|group by|query|queries|normali[sz]ation|database indexes?|second highest salary)\b/i],
  ['OS / Networks', /\b(operating systems?|deadlock|process(es)? (vs|and) threads?|paging|virtual memory|semaphore|mutex|tcp|udp|http|dns|osi)\b/i],
  ['Behavioral', /\b(tell me about|conflict|leadership|a time (when|you)|failure|strengths?|weakness(es)?|why (do you want|amazon|google|us|this company)|situation|disagree|deadline|proud of)\b/i],
  ['Projects', /\b(your project|projects?|resume|internship|tech stack|what did you build|challenges? (you )?faced)\b/i]
];

const TYPE_OF = {
  'System Design': 'System Design',
  'LLD / OOP': 'System Design',
  SQL: 'CS Fundamentals',
  'OS / Networks': 'CS Fundamentals',
  Behavioral: 'Behavioral',
  Projects: 'Role-specific'
};

/**
 * @param {string} text - The question as the student wrote it
 * @returns {{ topics: string[], questionType: string|null }}
 */
export function detectTopics(text = '') {
  const t = String(text);
  if (t.trim().length < 6) return { topics: [], questionType: null };
  const topics = RULES.filter(([, re]) => re.test(t)).map(([name]) => name).slice(0, 4);
  const nonDsa = topics.find((x) => TYPE_OF[x]);
  const questionType = topics.length ? (nonDsa ? TYPE_OF[nonDsa] : 'DSA') : null;
  return { topics, questionType };
}

/**
 * Finds the catalogue problem a question is most likely about — "…given a list of intervals… meeting rooms" → Meeting Rooms —
 * so the report can link to practice. Needs a whole-title hit; never guesses from loose overlap.
 *
 * @param {string} text
 * @param {{ _id: string, title: string }[]} problems
 */
export function matchProblem(text = '', problems = []) {
  const t = String(text).toLowerCase();
  if (t.length < 5) return null;
  let best = null;
  for (const p of problems) {
    const title = String(p.title || '').toLowerCase();
    if (title.length >= 5 && t.includes(title) && (!best || title.length > String(best.title).length)) best = p;
  }
  return best;
}

/**
 * Folds a free-form tag ("Linked List", "DP", "hashmap") onto the platform's own vocabulary so topic counts across
 * students add up. Unknown tags are kept, just tidied.
 */
export function canonicalTag(tag = '') {
  const t = String(tag).trim();
  if (!t) return '';
  const hit = RULES.find(([name, re]) => name.toLowerCase() === t.toLowerCase() || re.test(t));
  return hit ? hit[0] : t.replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}
