# Cognitive Campus — Agent Context

## What this project is
A full-stack MERN application. A gamified, adaptive DSA learning platform
that models student knowledge using Bayesian Knowledge Tracing (BKT),
performs AST-based code analysis, and drives personalized problem
recommendations. Built for a university full-stack subject — will be
evaluated by a professor AND used as a placement portfolio project
targeting 20+ LPA roles.

## Tech stack (non-negotiable)
- Frontend: React.js (Vite), Tailwind CSS, React Router v6, Recharts,
  Monaco Editor, Socket.io-client
- Backend: Node.js v18+, Express.js, MongoDB + Mongoose, Socket.io
- Auth: JWT (jsonwebtoken) + bcryptjs — no third-party auth services
- Caching: Redis via ioredis
- Code execution: Judge0 API (sandboxed, external)
- AST parsing: Acorn.js (JavaScript only)
- Logging: Winston
- Testing: Jest (unit tests for BKT engine and recommendation engine)
- Deployment: Frontend → Vercel, Backend → Render, DB → MongoDB Atlas

## Folder structure
```
cognitive-campus/
├── client/                  # React Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context (AuthContext)
│   │   ├── services/        # Axios API call functions
│   │   └── utils/           # Helper functions
│   └── package.json
├── server/                  # Express backend
│   ├── controllers/         # Route handler logic
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── middleware/           # Auth middleware, error handler, rate limiter
│   ├── services/            # BKT engine, AST analyser, recommendation engine
│   └── utils/               # Logger, helpers
├── AGENT.md                 # This file
├── README.md
└── .gitignore
```

## Architecture rules — always follow these
1. Backend follows strict MVC: logic lives in controllers/, never in
   routes/. Routes only define the endpoint and call the controller.
2. All protected API routes must go through the authenticateToken
   middleware in server/middleware/auth.js
3. All responses follow this shape:
   Success: { success: true, data: {...} }
   Error:   { success: false, message: "..." }
4. Never hardcode secrets. All sensitive values come from process.env
5. MongoDB queries must be scoped to the authenticated userId —
   never return another user's data
6. The BKT engine lives in server/services/bktEngine.js and must be
   a pure function module — no database calls inside it. Controllers
   fetch data, pass it to BKT, then save the result.
7. The AST analyser lives in server/services/astAnalyser.js — takes
   a code string, returns a structured object
8. The recommendation engine lives in
   server/services/recommendationEngine.js

## The 5 MongoDB collections
- users — profile, XP, level, streak
- skills — 12 DSA skills with prerequisites
- problems — problem bank, test cases, starter code
- skillstates — per-user per-skill BKT mastery probability
- submissions — every code submission with AST result and XP awarded

## The 12 DSA skills (exact names, in order)
Arrays, Strings, Hashing, Recursion, Sorting, Searching,
Linked Lists, Stacks & Queues, Trees, Graphs,
Dynamic Programming, Greedy Algorithms

Prerequisite relationships:
- Hashing → requires Arrays
- Recursion → requires Arrays
- Sorting → requires Arrays
- Searching → requires Arrays, Sorting
- Linked Lists → requires Arrays
- Stacks & Queues → requires Linked Lists
- Trees → requires Recursion, Linked Lists
- Graphs → requires Trees
- Dynamic Programming → requires Recursion
- Greedy Algorithms → requires Dynamic Programming

## BKT engine — core logic
Parameters per skill: P(L0)=0.3, P(T)=0.09, P(S)=0.1, P(G)=0.2
Update formula after each attempt:
  If correct:
    P(L|correct) = [P(Ln) * (1-P(S))] / [P(Ln)*(1-P(S)) + (1-P(Ln))*P(G)]
  If incorrect:
    P(L|incorrect) = [P(Ln) * P(S)] / [P(Ln)*P(S) + (1-P(Ln))*(1-P(G))]
  After update:
    P(Ln+1) = P(L|evidence) + (1 - P(L|evidence)) * P(T)
Mastery threshold: P(Ln) >= 0.85
Skill unlock threshold: P(Ln) >= 0.70

## Gamification rules
XP per correct submission: Easy=10, Medium=20, Hard=40
Partial credit (partial test pass): 30% of full XP
Level formula: Math.floor(totalXP / 100) + 1
Streak: increments if user submits on consecutive calendar days

## Code execution (Judge0)
POST to Judge0 API with: source_code (base64), language_id (63=JS),
stdin, expected_output
Response: stdout, stderr, status.id
Status 3 = Accepted, Status 4 = Wrong Answer, Status 5 = TLE
Always enforce: time_limit=5s, memory_limit=256MB

## API routes map
POST   /api/auth/register
POST   /api/auth/login
GET    /api/skills                    [protected]
GET    /api/problems                  [protected] ?skillId=&difficulty=
GET    /api/problems/:id              [protected]
POST   /api/submissions               [protected]
GET    /api/submissions/history       [protected]
GET    /api/leaderboard               [protected]
GET    /api/users/profile             [protected]
GET    /api/users/recommendations     [protected]

## What to build (in order — ask me before moving to next)
Phase 1: Backend foundation
  [ ] package.json + index.js + Winston logger
  [ ] All 5 Mongoose models
  [ ] JWT auth middleware + register/login routes
  [ ] Seed scripts: 12 skills + 30 problems

Phase 2: Core intelligence
  [ ] BKT engine service (pure functions, unit tested)
  [ ] AST analyser service (Acorn.js)
  [ ] Judge0 integration service
  [ ] Submission controller (wires everything together)

Phase 3: Features
  [ ] Recommendation engine
  [ ] Gamification logic (XP, level, streak)
  [ ] Leaderboard route + Redis caching
  [ ] Socket.io real-time XP events

Phase 4: Frontend
  [ ] Vite + Tailwind + React Router setup
  [ ] AuthContext + protected routes
  [ ] All 8 pages

Phase 5: Production
  [ ] Docker + GitHub Actions CI/CD
  [ ] Jest unit tests for BKT + recommendation engine
  [ ] README with setup instructions

## Code style rules
- ES6+ throughout (const/let, arrow functions, async/await — no callbacks)
- All async controller functions wrapped in try/catch
- JSDoc comments on every service function
- No console.log in production code — use Winston logger
- Meaningful variable names — no x, temp, data as variable names
- Every Mongoose model must have timestamps: true

## Commit message format (I will commit after every phase)
feat: add [feature name]
fix: [what was broken]
chore: [tooling/config change]
docs: [documentation update]
test: [test added]