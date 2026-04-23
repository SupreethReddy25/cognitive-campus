export const problem = {
  id: "P-0210",
  slug: "course-schedule-ii",
  title: "Course Schedule II",
  difficulty: "Medium",
  acceptance: 51.2,
  frequency: 84,
  bktMastery: 0.62,
  topics: ["Graph", "Topological Sort", "BFS", "Kahn's Algorithm"],
  companies: ["Google", "Meta", "Amazon"],
  breadcrumb: ["COGNITIVE CAMPUS", "GRAPHS", "TOPOLOGICAL SORT"],
  description: ["There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [aᵢ, bᵢ] indicates that you must take course bᵢ first if you want to take course aᵢ.", "Return the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible to finish all courses, return an empty array."],
  examples: [{
    input: "numCourses = 2, prerequisites = [[1,0]]",
    output: "[0,1]",
    explanation: "There are a total of 2 courses. To take course 1 you should have finished course 0. So the correct order is [0,1]."
  }, {
    input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
    output: "[0,2,1,3]",
    explanation: "Both [0,1,2,3] and [0,2,1,3] are valid orderings. A topological sort yields one such ordering."
  }, {
    input: "numCourses = 1, prerequisites = []",
    output: "[0]"
  }],
  constraints: ["1 ≤ numCourses ≤ 2000", "0 ≤ prerequisites.length ≤ numCourses · (numCourses − 1)", "prerequisites[i].length == 2", "0 ≤ aᵢ, bᵢ < numCourses", "All pairs [aᵢ, bᵢ] are distinct."],
  hints: ["Think of this as a directed graph where an edge b → a means you must take b before a.", "A valid ordering exists if and only if the graph is a DAG.", "Kahn's algorithm (BFS on in-degrees) gives you the topological order in O(V + E)."]
};
export const testCases = [{
  id: "tc-01",
  name: "chain",
  input: "2, [[1,0]]",
  expected: "[0,1]"
}, {
  id: "tc-02",
  name: "diamond",
  input: "4, [[1,0],[2,0],[3,1],[3,2]]",
  expected: "[0,1,2,3]"
}, {
  id: "tc-03",
  name: "empty-prereq",
  input: "1, []",
  expected: "[0]"
}, {
  id: "tc-04",
  name: "cycle",
  input: "3, [[0,1],[1,2],[2,0]]",
  expected: "[]"
}, {
  id: "tc-05",
  name: "forest",
  input: "6, [[1,0],[2,0],[4,3],[5,3]]",
  expected: "[0,3,1,2,4,5]",
  hidden: true
}];

/** Token-stream representation for the editor (no external highlighter). */
export const codeLines = [{
  n: 1,
  tokens: [{
    t: "function ",
    c: "syn-kw"
  }, {
    t: "findOrder",
    c: "syn-fn"
  }, {
    t: "(",
    c: "syn-pun"
  }, {
    t: "numCourses",
    c: "syn-var"
  }, {
    t: ": ",
    c: "syn-pun"
  }, {
    t: "number",
    c: "syn-typ"
  }, {
    t: ", ",
    c: "syn-pun"
  }, {
    t: "prerequisites",
    c: "syn-var"
  }, {
    t: ": ",
    c: "syn-pun"
  }, {
    t: "number[][]",
    c: "syn-typ"
  }, {
    t: ")",
    c: "syn-pun"
  }, {
    t: ": ",
    c: "syn-pun"
  }, {
    t: "number[] ",
    c: "syn-typ"
  }, {
    t: "{",
    c: "syn-pun"
  }]
}, {
  n: 2,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "graph",
    c: "syn-var"
  }, {
    t: " = ",
    c: "syn-pun"
  }, {
    t: "Array",
    c: "syn-fn"
  }, {
    t: ".from(",
    c: "syn-pun"
  }, {
    t: "{ length: numCourses }",
    c: "syn-var"
  }, {
    t: ", () => [] ",
    c: "syn-pun"
  }, {
    t: "as ",
    c: "syn-kw"
  }, {
    t: "number[]",
    c: "syn-typ"
  }, {
    t: ")",
    c: "syn-pun"
  }]
}, {
  n: 3,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "indegree",
    c: "syn-var"
  }, {
    t: " = ",
    c: "syn-pun"
  }, {
    t: "new ",
    c: "syn-kw"
  }, {
    t: "Array",
    c: "syn-fn"
  }, {
    t: "(",
    c: "syn-pun"
  }, {
    t: "numCourses",
    c: "syn-var"
  }, {
    t: ").fill(",
    c: "syn-pun"
  }, {
    t: "0",
    c: "syn-num"
  }, {
    t: ")",
    c: "syn-pun"
  }]
}, {
  n: 4,
  tokens: [{
    t: "",
    c: "syn-pun"
  }]
}, {
  n: 5,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "// Build adjacency + in-degree counts",
    c: "syn-com"
  }]
}, {
  n: 6,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "for ",
    c: "syn-kw"
  }, {
    t: "(",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "[a, b] ",
    c: "syn-var"
  }, {
    t: "of ",
    c: "syn-kw"
  }, {
    t: "prerequisites",
    c: "syn-var"
  }, {
    t: ") {",
    c: "syn-pun"
  }],
  lighthouse: true
}, {
  n: 7,
  tokens: [{
    t: "    ",
    c: "syn-pun"
  }, {
    t: "graph",
    c: "syn-var"
  }, {
    t: "[",
    c: "syn-pun"
  }, {
    t: "b",
    c: "syn-var"
  }, {
    t: "].",
    c: "syn-pun"
  }, {
    t: "push",
    c: "syn-fn"
  }, {
    t: "(",
    c: "syn-pun"
  }, {
    t: "a",
    c: "syn-var"
  }, {
    t: ")",
    c: "syn-pun"
  }],
  lighthouse: true
}, {
  n: 8,
  tokens: [{
    t: "    ",
    c: "syn-pun"
  }, {
    t: "indegree",
    c: "syn-var"
  }, {
    t: "[",
    c: "syn-pun"
  }, {
    t: "a",
    c: "syn-var"
  }, {
    t: "]++",
    c: "syn-pun"
  }],
  lighthouse: true
}, {
  n: 9,
  tokens: [{
    t: "  }",
    c: "syn-pun"
  }]
}, {
  n: 10,
  tokens: [{
    t: "",
    c: "syn-pun"
  }]
}, {
  n: 11,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "queue",
    c: "syn-var"
  }, {
    t: ": ",
    c: "syn-pun"
  }, {
    t: "number[] ",
    c: "syn-typ"
  }, {
    t: "= []",
    c: "syn-pun"
  }]
}, {
  n: 12,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "for ",
    c: "syn-kw"
  }, {
    t: "(",
    c: "syn-pun"
  }, {
    t: "let ",
    c: "syn-kw"
  }, {
    t: "i = ",
    c: "syn-var"
  }, {
    t: "0",
    c: "syn-num"
  }, {
    t: "; i < numCourses; i++) ",
    c: "syn-pun"
  }, {
    t: "if ",
    c: "syn-kw"
  }, {
    t: "(indegree[i] === ",
    c: "syn-pun"
  }, {
    t: "0",
    c: "syn-num"
  }, {
    t: ") queue.push(i)",
    c: "syn-pun"
  }]
}, {
  n: 13,
  tokens: [{
    t: "",
    c: "syn-pun"
  }]
}, {
  n: 14,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "order",
    c: "syn-var"
  }, {
    t: ": ",
    c: "syn-pun"
  }, {
    t: "number[] ",
    c: "syn-typ"
  }, {
    t: "= []",
    c: "syn-pun"
  }]
}, {
  n: 15,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "while ",
    c: "syn-kw"
  }, {
    t: "(queue.length) {",
    c: "syn-pun"
  }],
  lighthouse: true
}, {
  n: 16,
  tokens: [{
    t: "    ",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "u",
    c: "syn-var"
  }, {
    t: " = queue.shift()!",
    c: "syn-pun"
  }],
  lighthouse: true
}, {
  n: 17,
  tokens: [{
    t: "    ",
    c: "syn-pun"
  }, {
    t: "order",
    c: "syn-var"
  }, {
    t: ".push(u)",
    c: "syn-pun"
  }]
}, {
  n: 18,
  tokens: [{
    t: "    ",
    c: "syn-pun"
  }, {
    t: "for ",
    c: "syn-kw"
  }, {
    t: "(",
    c: "syn-pun"
  }, {
    t: "const ",
    c: "syn-kw"
  }, {
    t: "v ",
    c: "syn-var"
  }, {
    t: "of ",
    c: "syn-kw"
  }, {
    t: "graph",
    c: "syn-var"
  }, {
    t: "[u]) ",
    c: "syn-pun"
  }, {
    t: "if ",
    c: "syn-kw"
  }, {
    t: "(--indegree[v] === ",
    c: "syn-pun"
  }, {
    t: "0",
    c: "syn-num"
  }, {
    t: ") queue.push(v)",
    c: "syn-pun"
  }],
  lighthouse: true
}, {
  n: 19,
  tokens: [{
    t: "  }",
    c: "syn-pun"
  }]
}, {
  n: 20,
  tokens: [{
    t: "",
    c: "syn-pun"
  }]
}, {
  n: 21,
  tokens: [{
    t: "  ",
    c: "syn-pun"
  }, {
    t: "return ",
    c: "syn-kw"
  }, {
    t: "order.length === numCourses ? order : []",
    c: "syn-pun"
  }]
}, {
  n: 22,
  tokens: [{
    t: "}",
    c: "syn-pun"
  }]
}];

/** Socratic mentor pre-seed — no bubbles, just typography */

export const mentorSeed = [{
  role: "mentor",
  text: "Before we write code — what invariant of the graph determines whether a valid ordering exists at all?"
}, {
  role: "you",
  text: "It has to be acyclic. If there is a cycle, two courses depend on each other and we can never finish."
}, {
  role: "mentor",
  text: "Good. Now — you reached for BFS with an in-degree queue. What does the queue invariantly contain at every iteration?",
  cite: [11, 12, 15]
}, {
  role: "you",
  text: "Courses with no unmet prerequisites. Any one of them is safe to take next."
}, {
  role: "mentor",
  text: "Exactly. So the loop at line 15 is really draining the frontier of \u201cready\u201d nodes. What single check at the end tells us a cycle existed?",
  cite: [21]
}];