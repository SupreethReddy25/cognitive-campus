# Cognitive Campus

> Adaptive DSA learning powered by Bayesian Knowledge Tracing

Cognitive Campus is a full-stack MERN application that models student knowledge using **Bayesian Knowledge Tracing (BKT)**, analyses code structure through **AST parsing**, and delivers **personalized problem recommendations** — combining the rigour of cognitive science with a gamified learning experience.

---

## Live Demo

| Service  | URL |
|----------|-----|
| Frontend | `https://cognitive-campus.vercel.app` *(placeholder)* |
| Backend  | `https://cognitive-campus.onrender.com` *(placeholder)* |

---

## What Makes This Different

Most coding platforms score you with simple *"X of Y tests passed"* ratios. Cognitive Campus goes deeper. The platform maintains a **probabilistic knowledge model** for each skill using Bayesian Knowledge Tracing — a proven algorithm from intelligent tutoring systems research. Instead of a flat percentage, the system estimates `P(Ln)`, the probability that you've actually learned a concept, accounting for slip and guess probabilities. Mastery isn't declared until `P(Ln) >= 0.85`, and the model updates after every single submission.

Every code submission is parsed into an **Abstract Syntax Tree** using Acorn.js. The AST analyser detects loop types, nesting depth (which signals O(n²) or O(n³) brute-force approaches), recursion patterns, and auxiliary data structure usage (Maps, Sets, Arrays). This structural feedback tells you *how* you solved it — not just *whether* you solved it. If you use a nested loop where a hash map would suffice, the system knows.

The **recommendation engine** combines BKT mastery probabilities with a skill prerequisite DAG. It identifies your weakest unlocked skill, selects problems of the right difficulty, and avoids recommending problems you've already solved. The result: every user gets a different learning path, tailored to their actual knowledge state, not just a static problem list.

Multi-language support (JavaScript, Python, Java, C++) is powered by the **Piston API** for sandboxed execution. A gamification layer (XP, levels, streaks, badges) and a real-time Socket.io leaderboard keep motivation high.

---

## Tech Stack

| Layer            | Technology                                      |
|------------------|--------------------------------------------------|
| **Frontend**     | React 19 (Vite), Tailwind CSS v4, React Router v7, Recharts, Monaco Editor |
| **Backend**      | Node.js 18, Express.js, Socket.io                |
| **Database**     | MongoDB (Mongoose ODM)                           |
| **Caching**      | Redis (Upstash) via ioredis                      |
| **Auth**         | JWT (jsonwebtoken) + bcryptjs                    |
| **Code Execution** | Piston API (sandboxed, multi-language)         |
| **AST Analysis** | Acorn.js (JavaScript)                            |
| **Real-time**    | Socket.io (XP updates, leaderboard, skill unlocks) |
| **Testing**      | Jest (27 unit tests covering BKT + AST)          |
| **DevOps**       | Docker, GitHub Actions CI/CD, Render, Vercel     |

---

## Architecture

The application follows a strict **three-tier architecture**:

```
Client (React SPA)  ←→  Express API Server  ←→  MongoDB + Redis
         ↕                      ↕
    Socket.io             Piston API
```

### 9-Step Submission Flow

1. **Extract**: Pull `code`, `problemId`, `language`, `hintsUsed` from request body
2. **Validate**: Confirm problem exists and code is non-empty
3. **Execute**: Run test cases against the code via Piston API
4. **Analyse**: Parse the AST to detect patterns / anti-patterns (JS only)
5. **Fetch State**: Load or create the user's BKT `SkillState` for the relevant skill
6. **Update Mastery**: Apply BKT update formula + optional hint penalty
7. **Award XP**: Calculate XP based on difficulty and test pass ratio, update level and streak
8. **Unlock Skills**: Check if prerequisite-gated skills can now be unlocked, generate nudges
9. **Recommend**: Generate next problem recommendation, save submission, emit Socket.io events

---

## Key Features

### Bayesian Knowledge Tracing Engine
Implements the standard BKT model with parameters `P(L0)=0.3`, `P(T)=0.09`, `P(S)=0.1`, `P(G)=0.2`. Mastery threshold at `P(Ln) >= 0.85`, skill unlock threshold at `P(Ln) >= 0.70`. Pure function module — no database calls.

### AST-Based Code Analysis
Acorn.js parses JavaScript submissions into an AST, detecting loop types, recursion, nesting depth, and auxiliary data structure usage. Classifies algorithms as `linear`, `optimized-linear`, `brute-force-quadratic`, `recursive`, etc.

### Adaptive Recommendation Engine
Identifies the weakest unlocked skill, selects difficulty based on current mastery, filters out solved problems, and falls back to alternative skills when needed.

### Multi-Language Code Execution
Supports JavaScript, Python, Java, and C++ via the Piston API. Each language has typed starter code templates for all 36 problems.

### Real-time Leaderboard
Socket.io broadcasts XP updates, leaderboard refreshes, and skill unlock events to all connected clients.

### Redis Caching Layer
Leaderboard results are cached in Redis (Upstash) to reduce database queries under load.

### Gamification System
XP rewards (Easy: 10, Medium: 20, Hard: 40), partial credit (30%), level progression (`Math.floor(xp/100) + 1`), daily streak tracking.

### 12 DSA Skills with Prerequisites
Arrays → Hashing, Recursion, Sorting, Linked Lists → Stacks & Queues, Searching, Trees → Graphs → Dynamic Programming → Greedy Algorithms. Each skill has 3 problems (easy, medium, hard) for 36 total.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)
- (Optional) Docker for containerized development

### 1. Clone the Repository

```bash
git clone https://github.com/SupreethReddy25/CognitiveCampus.git
cd CognitiveCampus
```

### 2. Server Setup

```bash
cd server
npm install
```

Create `server/.env` based on `.env.example`:

```env
PORT=5000                        # API server port
NODE_ENV=development             # development | production
MONGO_URI=mongodb+srv://...      # MongoDB Atlas connection string
JWT_SECRET=your_secret_key       # JWT signing secret (use a strong random string)
JWT_EXPIRES_IN=24h               # Token expiry duration
REDIS_URL=rediss://...           # Upstash Redis URL (with TLS)
CODE_EXECUTION_API_URL=https://emkc.org/api/v2/piston  # Piston API base URL
CLIENT_URL=http://localhost:5173 # Frontend URL for CORS
```

### 3. Seed the Database

```bash
node seeds/skillSeed.js    # Seeds 12 DSA skills with prerequisites
node seeds/problemSeed.js  # Seeds 36 problems with multi-language starter code
```

### 4. Client Setup

```bash
cd ../client
npm install
```

### 5. Run Both Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to port 5000.

### 6. Docker (Alternative)

```bash
# From project root
docker-compose up --build
```

---

## Running Tests

```bash
cd server
npm test
```

Runs **27 unit tests** across 2 test suites:

| Suite | Tests | Covers |
|-------|-------|--------|
| `bktEngine.test.js` | 16 | BKT update formula, mastery threshold, hint penalty, edge cases |
| `astAnalyser.test.js` | 11 | Loop detection, recursion detection, nesting depth, algorithm classification, non-JS default |

---

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Backend   | Render   | Auto-deploy via GitHub Actions deploy hook |
| Frontend  | Vercel   | Auto-deploy on push to `main` |
| Database  | MongoDB Atlas | Cloud-hosted, connection string in env |
| Cache     | Upstash Redis | Serverless Redis with TLS |

---

## Project Structure

```
cognitive-campus/
├── client/                      # React Vite frontend
│   ├── src/
│   │   ├── components/          # Layout, SkillBadge, DifficultyBadge, Toast, etc.
│   │   ├── pages/               # 8 route-level pages
│   │   ├── hooks/               # useSocket custom hook
│   │   ├── context/             # AuthContext (JWT state management)
│   │   ├── services/            # Axios API client
│   │   └── index.css            # Design system (Inter + JetBrains Mono)
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                      # Express backend
│   ├── controllers/             # Auth, Problem, Submission, Skill, Leaderboard, User, Admin
│   ├── models/                  # User, Skill, Problem, SkillState, Submission
│   ├── routes/                  # Express routers (MVC — no logic in routes)
│   ├── middleware/              # Auth (JWT), error handler, rate limiter
│   ├── services/                # BKT engine, AST analyser, code execution, recommendations, nudge
│   ├── socket/                  # Socket.io handler
│   ├── seeds/                   # Skill + Problem seed scripts, starter code maps
│   ├── tests/                   # Jest unit tests
│   ├── utils/                   # Logger (Winston), connectDB (retry), response helpers
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .eslintrc.json
│   └── package.json
├── .github/workflows/           # CI (test → lint → build) + Deploy (Render + Vercel)
├── docker-compose.yml
├── AGENT.md                     # Agent context document
└── README.md
```

---

## API Reference

| Method | Endpoint                      | Auth | Description |
|--------|-------------------------------|------|-------------|
| POST   | `/api/auth/register`          | No   | Register new user |
| POST   | `/api/auth/login`             | No   | Login and receive JWT |
| GET    | `/api/auth/me`                | Yes  | Get current user from token |
| GET    | `/api/skills`                 | Yes  | List all 12 skills |
| GET    | `/api/skills/my-states`       | Yes  | Get user's BKT state per skill |
| GET    | `/api/problems`               | Yes  | List problems (filter by skill, difficulty) |
| GET    | `/api/problems/:id`           | Yes  | Get problem detail with masked hidden test cases |
| POST   | `/api/submissions`            | Yes  | Submit code — runs the full 9-step flow |
| GET    | `/api/submissions/history`    | Yes  | Paginated submission history |
| GET    | `/api/leaderboard`            | Yes  | Top users ranked by XP (Redis-cached) |
| GET    | `/api/users/profile`          | Yes  | User profile with skill states and stats |
| GET    | `/api/users/recommendations`  | Yes  | Next recommended problem |
| GET    | `/api/admin/analytics`        | Yes  | Platform analytics (admin) |

---

## License

Built for academic evaluation. © 2026 Supreeth Reddy.
