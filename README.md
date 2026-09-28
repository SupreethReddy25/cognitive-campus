# Cognitive Campus

> Interview intelligence for campus placements — what the companies that visit your college actually ask, and how ready you are.

Cognitive Campus is a full-stack MERN application built around one loop: **see** what companies ask (interview reports, placement history, per-college recruiter patterns), **prepare** on exactly that (an adaptive practice engine driven by Bayesian Knowledge Tracing), **prove it** under pressure (a real-time multiplayer arena with company rounds), and **contribute** your own experience back (AI-structured, moderated submissions).

It is useful to anyone — the Interviews atlas is open without an account — and becomes sharp once you choose your college: likely visitors for the coming season, past packages, and the skills to close the gap on.

---

## Live Demo

> **Note:** Deployment is configured via GitHub Actions (Render + Vercel). To run locally, follow the Local Setup section below.

| Service  | URL |
|----------|-----|
| Frontend | `http://localhost:5173` (local dev) |
| Backend  | `http://localhost:5000` (local dev) |

---

## What Makes This Different

**College-scoped intelligence.** Generic platforms cannot tell you which companies visit *your* campus. Here, every college has a placement history (NIRF rank, sourced placement summaries, per-season visits and hires), and the app turns it into a Bayesian-smoothed forecast of next season's visitors and a skill-gap analysis against what those companies test.

**An honest data engine.** Interview reports are crowdsourced and structured by an AI parser, then moderated. Anything illustrative is labelled as such in the UI, every percentage carries a confidence interval, and the README's "real data vs illustrative" table says which is which.

**Practice that follows the intelligence.** Problems are ranked by what your target companies ask *and* where your knowledge is weakest. Mastery is a probabilistic estimate — **Bayesian Knowledge Tracing** with forgetting and learned parameters — not a pass-rate, and code is analysed structurally with an AST so feedback covers *how* you solved it.

**Pressure practice.** The arena runs rated 1v1 races (Elo), shared-editor pair sessions and split-editor sessions over Socket.io, with company-round problem selection.

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

One idempotent command loads everything (safe to re-run; it only upserts, and regenerates derived data for the demo cohort only):

```bash
cd server
npm run seed          # skills, 20 colleges, 23 companies, 78+ verified problems w/ editorials,
                      # 7 sheets, 660+ placement records, 50 interview experiences, a 60-student cohort
npm run seed:quick    # reference data only (no demo users / submissions)
npm run verify:problems   # runs every reference solution (JS + Python) against every test case
```

Demo logins (password `Demo@12345`): `demo@cognitivecampus.dev` (student), `admin@cognitivecampus.dev` (placement-cell admin).

### What is real data and what is illustrative

| Data | Status |
|---|---|
| NIRF 2025 engineering ranks, college websites | **Real** — read from nirfindia.org (`server/seeds/data/collegeFacts.js`) |
| Headline placement figures per college (placed, median/avg/highest CTC, season) | **Real, sourced** — each carries its source link; verify against the institute's report before quoting |
| Company names, HQ, domains, founding years, logos (Google favicon service) | **Real** |
| Typical fresher CTC ranges | Indicative, compiled from public offer reports |
| Company-level placement history (`source: modelled`) | **Illustrative** — replace via Admin → Add data |
| Interview experiences (`source: curated`) | **Sample reports**, marked as such in the UI — real submissions replace them |
| Demo cohort (students, submissions) | Synthetic |

### AI features

Optional. Provider order: the user's own Gemini key (Profile → AI settings, stored AES-256 encrypted) → platform `GEMINI_API_KEY` → `GROQ_API_KEY`. With no key configured every AI feature (hints, experience parser, prep plan, dashboard tip) degrades to a deterministic offline fallback.

### Code execution

Piston is used when `CODE_EXECUTION_API_URL` is reachable; otherwise a built-in sandboxed local runner executes JavaScript and Python (Java / C++ only if a JDK / g++ is installed).

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
├── client/                      # React 19 + Vite + Tailwind v4 + framer-motion
│   └── src/
│       ├── pages/               # route-level pages (landing, auth, practice, interviews, placement, sheets, admin)
│       ├── components/          # dashboard (sky, campus radar), arena, intel, workspace (Monaco), shell, ui kit
│       ├── context/             # Auth, Arena (socket state), Toast, Transition
│       └── services/api.js      # every HTTP call, grouped by domain
├── server/
│   ├── index.js                 # bootstrap only: validate env → connect DB → sockets → listen → graceful shutdown
│   ├── app.js                   # the Express app (importable from tests — no port, no DB)
│   ├── config/env.js            # validated, typed configuration (fails fast on missing/unsafe values)
│   ├── routes/                  # thin routers: paths + middleware, no logic
│   ├── controllers/             # request handling; responses are { success, data } / { success: false, message }
│   ├── services/                # BKT engine, recommendations, placement analytics, AI layer, code runners, …
│   ├── models/                  # Mongoose schemas (timestamps on all)
│   ├── middleware/              # auth, admin, rate limits, request id, NoSQL-injection sanitiser, 404, error handler
│   ├── socket/                  # general + arena (rooms, Yjs sync, Elo)
│   ├── seeds/                   # idempotent master seed + curated data (colleges, companies, problems, placements)
│   ├── utils/                   # logger (Winston), connectDB (retry/back-off), AppError, asyncHandler, token
│   └── tests/                   # Jest: BKT, AST, adaptive engine, platform (config, errors, HTTP surface)
├── .github/workflows/           # CI (test → lint → build) + Deploy (Render + Vercel)
├── docker-compose.yml
└── README.md
```

### Backend conventions

- **Layers:** route → controller → service → model. Routes contain no logic.
- **Responses:** success is `{ success: true, data }`; failure is `{ success: false, message, requestId }` (plus `errors` for field-level validation).
- **Errors:** throw `AppError(message, status)` for anything the client may see; everything else is logged with a request id and reported as a generic 500 in production. `asyncHandler` removes try/catch boilerplate.
- **Configuration:** only `config/env.js` interprets the environment. Missing `MONGO_URI`/`JWT_SECRET` (or, in production, a missing `CLIENT_URL` or a short secret) stops the boot with every problem listed.
- **Security:** Helmet, CORS pinned to `CLIENT_URL` in production (HTTP and sockets), rate limits per zone (auth, submissions, AI, user-generated content, global), `$`-operator/dotted-key stripping on all input, bcrypt with a timing guard on login, JWT with the role embedded, encrypted (AES-256-GCM) user API keys.
- **Operations:** `GET /health` (also `/api/health`) reports database state and answers 503 when degraded; responses are gzipped; the shared problem catalogue is cached for 60 s; graceful shutdown on SIGTERM/SIGINT; logs go to `server/logs/` and the console.
- **Admin bootstrap:** the first admin can be created while none exists. `ALLOW_ADMIN_BOOTSTRAP=true` additionally lets any signed-in user self-promote **outside production only** (it powers the Profile "Become admin" button).

---

## API Reference

`Auth`: **Yes** = Bearer JWT required · **Optional** = works signed out, richer when signed in · **Admin** = admin role.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` · `/api/health` | No | Liveness + database state |
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Sign in, receive JWT |
| GET | `/api/auth/me` | Yes | Current user (college and target company populated) |
| GET | `/api/auth/search-name` · `/api/auth/peek` | No | First name behind an email (login greeting; rate limited) |
| POST | `/api/auth/bootstrap-admin` | Yes | First-time / dev admin promotion (see above) |
| GET | `/api/skills` · `/api/skills/my-states` | Yes | Skill DAG · your mastery per skill |
| GET | `/api/problems` | Yes | Catalogue (filters: skillId, difficulty, q, company) |
| GET | `/api/problems/:id` | Yes | Problem with masked hidden tests |
| POST | `/api/problems/propose` · `/:id/vote` · `/:id/nudge` | Yes | Propose from interview memory · vote · AI mentor nudge |
| GET | `/api/problems/review-queue` | Yes | Waitlisted problems |
| POST | `/api/submissions` · `/api/submissions/run` | Yes | Submit (full mastery pipeline) · run against the samples |
| GET | `/api/submissions/history` · `/recent/:problemId` · `/runtimes` | Yes | History · recent attempts · available runtimes |
| GET | `/api/leaderboard` | Yes | XP ranking (global or college) |
| GET/PATCH | `/api/users/profile` | Yes | Profile · update college / target company / role |
| GET | `/api/users/recommendations` · `/attempted` | Yes | Explainable recommendations · attempted problems |
| POST | `/api/users/config-key` · `/dashboard-quote` | Yes | Bring-your-own AI key · AI dashboard line |
| GET | `/api/analytics/dashboard` · `/profile` · `/peers` · `/model` | Yes | Dashboard payload · learning profile · college peer comparison · BKT model |
| POST | `/api/analytics/model/refit` | Admin | Re-fit BKT parameters from data |
| GET | `/api/engagement/daily` · `/achievements` · `/streak` · `/bookmarks` · `/editorial/:problemId` · `/ai-status` | Yes | Daily challenge, badges, streak, bookmarks, editorial, AI availability |
| POST | `/api/engagement/bookmarks/:problemId` | Yes | Toggle a bookmark |
| GET | `/api/companies` · `/:slug` · `/:slug/stats` | No | Company atlas, dossier, aggregate stats |
| GET | `/api/companies/:slug/experiences` · `/related-problems` | Optional | Interview reports · problems matched to the company's topics |
| POST | `/api/companies/:slug/prep-plan` | Yes | Generate a prep plan |
| POST | `/api/experiences` | Yes | Submit an experience |
| POST | `/api/experiences/ai-parse` · `/score` | Optional / No | Structure raw notes with AI · score a draft |
| POST | `/api/experiences/:id/upvote` · `/:id/vote` | Yes | Vote on an experience |
| GET | `/api/colleges` · `/:slug` | No | Colleges |
| GET | `/api/colleges/:slug/dashboard` · `/insights` · `/companies/:companySlug` | Yes | Placement dashboard · forecast, skill gap, peers · a company at this college |
| GET | `/api/sheets` · `/:slug` | Optional | Curated problem sheets (with your progress) |
| POST | `/api/sheets/:slug/progress` | Yes | Update sheet progress |
| GET | `/api/arena/rating` · `/leaderboard` | Yes | Your Elo, tier and matches · the arena ladder |
| — | Socket.io `/arena` | — | Rooms, matchmaking, Yjs sync, progress, Elo (`arena:*` events) |
| GET/POST/PATCH/DELETE | `/api/admin/*` | Admin | Stats, cohort heatmap, students, roles, moderation, problem status, colleges, companies, placement records |

---

## License

Built for academic evaluation. © 2026 Supreeth Reddy.
