/**
 * Demo cohort simulator.
 *
 * Generates ~64 students with believable multi-week practice histories by simulating a *latent*
 * Bayesian-knowledge process per (student, skill): each student has an ability and a learning rate,
 * each skill has its own true learn/slip/guess rates (deliberately different from the textbook
 * defaults, so the adaptive parameter fitting has real signal to recover).
 *
 * Pure & deterministic (seeded PRNG) — same output every run, which keeps the master seed idempotent.
 */

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karthik', 'Sai', 'Ishaan', 'Kabir', 'Dhruv', 'Ananya', 'Diya', 'Ishita', 'Meera', 'Kavya', 'Riya', 'Sneha', 'Tanvi', 'Neha', 'Pooja',
  'Harsh', 'Nikhil', 'Siddharth', 'Varun', 'Pranav', 'Manish', 'Rahul', 'Abhishek', 'Yash', 'Tarun', 'Aisha', 'Bhavya', 'Charvi', 'Divya', 'Esha', 'Gauri', 'Hema', 'Jahnavi', 'Lakshmi', 'Nandini',
  'Om', 'Parth', 'Rishi', 'Shreyas', 'Uday', 'Vikram', 'Zaid', 'Akash', 'Bharat', 'Chirag', 'Deepak', 'Farhan', 'Gaurav', 'Hrithik', 'Imran', 'Jatin', 'Krish', 'Lokesh', 'Mohit', 'Naveen'];
const LAST = ['Sharma', 'Reddy', 'Iyer', 'Nair', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Menon', 'Rao', 'Das', 'Joshi', 'Kulkarni', 'Verma', 'Chatterjee', 'Bhat', 'Pillai', 'Agarwal', 'Mishra', 'Khan',
  'Naidu', 'Banerjee', 'Desai', 'Shetty', 'Yadav', 'Tiwari', 'Ghosh', 'Malhotra', 'Kapoor', 'Sinha'];

const COLLEGE_WEIGHTS = [
  ['nit-trichy', 9], ['vit-vellore', 8], ['bits-pilani', 7], ['iit-bombay', 6], ['iiit-hyderabad', 6], ['iit-delhi', 5], ['nit-warangal', 5], ['amrita', 5], ['srm', 5],
  ['iit-madras', 4], ['pes-university', 4], ['dtu-delhi', 3], ['nit-surathkal', 2], ['thapar', 2], ['psg-tech', 1], ['coep-pune', 1], ['mit-manipal', 1], ['vit-chennai', 1]
];
// college tier → mean ability shift (selective institutes skew a bit higher on average)
const COLLEGE_ABILITY = { 'iit-bombay': 0.8, 'iit-delhi': 0.7, 'iit-madras': 0.7, 'iiit-hyderabad': 0.7, 'bits-pilani': 0.5, 'nit-trichy': 0.3, 'nit-warangal': 0.25, 'nit-surathkal': 0.2, 'dtu-delhi': 0.2, 'pes-university': 0.1 };

// true (hidden) knowledge-tracing parameters per skill — differ from the textbook defaults
const TRUE_PARAMS = {
  Arrays: { pL0: 0.42, pT: 0.15, pS: 0.07, pG: 0.24 },
  Strings: { pL0: 0.38, pT: 0.14, pS: 0.08, pG: 0.22 },
  Hashing: { pL0: 0.3, pT: 0.13, pS: 0.08, pG: 0.2 },
  Recursion: { pL0: 0.22, pT: 0.09, pS: 0.12, pG: 0.14 },
  Sorting: { pL0: 0.3, pT: 0.12, pS: 0.09, pG: 0.2 },
  Searching: { pL0: 0.28, pT: 0.12, pS: 0.1, pG: 0.18 },
  'Linked Lists': { pL0: 0.3, pT: 0.11, pS: 0.1, pG: 0.18 },
  'Stacks & Queues': { pL0: 0.26, pT: 0.11, pS: 0.1, pG: 0.18 },
  Trees: { pL0: 0.2, pT: 0.09, pS: 0.11, pG: 0.14 },
  Graphs: { pL0: 0.14, pT: 0.07, pS: 0.13, pG: 0.1 },
  'Dynamic Programming': { pL0: 0.1, pT: 0.06, pS: 0.14, pG: 0.08 },
  'Greedy Algorithms': { pL0: 0.2, pT: 0.09, pS: 0.12, pG: 0.14 }
};

const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const DAY = 86400000;
const DIFF_ADJ = { easy: { g: 1.25, s: 0.7 }, medium: { g: 1, s: 1 }, hard: { g: 0.55, s: 1.3 } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const pickWeighted = (rand, items) => {
  const total = items.reduce((n, [, w]) => n + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) { r -= w; if (r <= 0) return v; }
  return items[items.length - 1][0];
};

/**
 * @param {object} args
 * @param {Array<{_id, title, difficulty, skillName}>} args.problems   catalogue in DB (approved)
 * @param {Array<{name, prerequisites:string[]}>} args.skills
 * @param {string[]} args.collegeSlugs
 * @param {Date} [args.now]
 * @returns {Array<object>} student specs with generated attempts (`attempts[]` chronological)
 */
const simulateCohort = ({ problems, skills, now = new Date() }) => {
  const students = [];
  const rand = mulberry32(20260925);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

  const byName = new Map(skills.map((s) => [s.name, s]));
  const problemsBySkill = new Map();
  problems.forEach((p) => {
    if (!problemsBySkill.has(p.skillName)) problemsBySkill.set(p.skillName, []);
    problemsBySkill.get(p.skillName).push(p);
  });
  const diffRank = { easy: 0, medium: 1, hard: 2 };
  problemsBySkill.forEach((list) => list.sort((a, b) => diffRank[a.difficulty] - diffRank[b.difficulty] || a.title.localeCompare(b.title)));

  const specs = [];

  // featured demo student + admin are added first (index 0 = Aarav)
  specs.push({ key: 'aarav', name: 'Aarav Mehta', email: 'demo@cognitivecampus.dev', college: 'nit-trichy', ability: 0.55, activity: 0.8, featured: true, targetCompany: 'google', targetRole: 'SDE-1' });

  const usedEmails = new Set(['demo@cognitivecampus.dev']);
  const nStudents = 63;
  for (let i = 0; i < nStudents; i++) {
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    let email = `${first}.${last}`.toLowerCase() + '@demo.cognitivecampus.dev';
    let suffix = 2;
    while (usedEmails.has(email)) { email = `${first}.${last}${suffix++}`.toLowerCase() + '@demo.cognitivecampus.dev'; }
    usedEmails.add(email);
    const college = pickWeighted(rand, COLLEGE_WEIGHTS);
    const ability = clamp(gauss() * 0.8 + (COLLEGE_ABILITY[college] || 0), -1.6, 1.8);
    // ~15% barely started, ~15% power users
    const r = rand();
    const activity = r < 0.15 ? 0.08 + rand() * 0.12 : r > 0.85 ? 0.7 + rand() * 0.25 : 0.25 + rand() * 0.4;
    const companies = ['google', 'amazon', 'microsoft', 'flipkart', 'goldman-sachs', 'atlassian', 'uber', 'adobe', null];
    specs.push({
      key: `s${i}`, name: `${first} ${last}`, email, college, ability, activity, targetCompany: companies[Math.floor(rand() * companies.length)],
      targetRole: rand() < 0.85 ? 'SDE-1' : ['Data Analyst', 'SDE-2', 'Product Manager'][Math.floor(rand() * 3)]
    });
  }

  for (const spec of specs) {
    const joinedDaysAgo = spec.featured ? 48 : Math.round(12 + rand() * 60);
    const learnRate = clamp(1 + spec.ability * 0.35 + gauss() * 0.15, 0.55, 1.7);

    // hidden per-skill knowledge state
    const knows = {};
    skills.forEach((s) => {
      const tp = TRUE_PARAMS[s.name] || TRUE_PARAMS.Arrays;
      knows[s.name] = rand() < clamp(tp.pL0 + spec.ability * 0.12, 0.03, 0.9);
    });

    // observed mastery estimate (only used to choose what to practise next) — simple running BKT
    const est = {};
    skills.forEach((s) => { est[s.name] = 0.3; });

    // which days are active
    const activeDays = [];
    if (spec.featured) {
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 15, 16, 19, 22, 23, 26, 30, 31, 35, 40, 44].forEach((d) => activeDays.push(d));
    } else {
      for (let d = joinedDaysAgo; d >= 0; d--) {
        const weekend = [0, 6].includes(new Date(now.getTime() - d * DAY).getDay());
        const p = spec.activity * (weekend ? 0.85 : 1) * (d < 3 ? 1.1 : 1);
        if (rand() < p) activeDays.push(d);
      }
    }
    activeDays.sort((a, b) => b - a); // oldest first

    const solved = new Set();
    const attempts = [];
    const problemAttemptCount = new Map();

    const unlocked = (skill) => skill.prerequisites.every((pn) => est[pn] >= 0.62 || (problemsBySkill.get(pn) || []).length === 0);

    for (const d of activeDays) {
      const sessions = rand() < 0.2 ? 2 : 1;
      for (let se = 0; se < sessions; se++) {
        const hourPool = [[9, 2], [11, 1], [14, 2], [16, 2], [19, 4], [21, 5], [23, 3], [1, 1]];
        const hour = pickWeighted(rand, hourPool);
        let t = new Date(now.getTime() - d * DAY);
        t.setHours(hour, Math.floor(rand() * 50), Math.floor(rand() * 60), 0);
        if (t > now) t = new Date(now.getTime() - (10 + Math.floor(rand() * 200)) * 60000);

        const nProblems = spec.featured ? 2 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * (spec.activity > 0.6 ? 4 : 3));
        for (let pi = 0; pi < nProblems; pi++) {
          // choose skill
          const candidates = skills.filter((s) => unlocked(s) && (problemsBySkill.get(s.name) || []).length);
          const skill = pickWeighted(rand, candidates.map((s) => [s, (1 - est[s.name]) + 0.15]));
          const list = problemsBySkill.get(skill.name);
          const limit = est[skill.name] < 0.4 ? 0 : est[skill.name] < 0.7 ? 1 : 2;
          const stretch = rand() < 0.15 ? 1 : 0;
          let pool = list.filter((p) => !solved.has(String(p._id)) && diffRank[p.difficulty] <= Math.min(2, limit + stretch));
          if (!pool.length) pool = list.filter((p) => !solved.has(String(p._id)));
          const problem = pool.length ? pool[Math.floor(rand() * Math.min(pool.length, 3))] : list[Math.floor(rand() * list.length)];

          // attempt loop (retry after failures)
          const tp = TRUE_PARAMS[skill.name] || TRUE_PARAMS.Arrays;
          const adj = DIFF_ADJ[problem.difficulty];
          const maxTries = 1 + Math.floor(rand() * 4);
          for (let k = 0; k < maxTries; k++) {
            const known = knows[skill.name];
            const pc = known ? 1 - clamp(tp.pS * adj.s, 0.01, 0.4) : clamp(tp.pG * adj.g, 0.01, 0.45);
            const correct = rand() < pc;
            const hints = correct ? (rand() < 0.15 ? 1 : 0) : rand() < 0.3 ? 1 : 0;
            const total = problem.testCount || 3;
            const passed = correct ? total : rand() < 0.35 ? Math.floor(rand() * total) : Math.max(0, total - 1 - Math.floor(rand() * 2));
            attempts.push({
              at: new Date(t.getTime() + k * (3 + Math.floor(rand() * 12)) * 60000),
              problemId: problem._id, title: problem.title, difficulty: problem.difficulty, skillName: skill.name,
              correct, hints, passed, total, timeTaken: Math.round(200 + rand() * 1600 * (1 + diffRank[problem.difficulty] * 0.6)),
              language: rand() < 0.68 ? 'javascript' : rand() < 0.88 ? 'python' : rand() < 0.5 ? 'java' : 'cpp'
            });
            problemAttemptCount.set(String(problem._id), (problemAttemptCount.get(String(problem._id)) || 0) + 1);

            // latent learning after every attempt (learning by doing)
            if (!known && rand() < clamp(tp.pT * learnRate, 0.01, 0.6)) knows[skill.name] = true;
            // running estimate for policy decisions
            const cur = est[skill.name];
            const pcr = cur * (1 - tp.pS) + (1 - cur) * tp.pG;
            est[skill.name] = clamp(correct ? (cur * (1 - tp.pS)) / pcr + (1 - (cur * (1 - tp.pS)) / pcr) * 0.09 : (cur * tp.pS) / (1 - pcr) + (1 - (cur * tp.pS) / (1 - pcr)) * 0.09, 0.02, 0.99);

            if (correct) { solved.add(String(problem._id)); break; }
            if (rand() < 0.35) break; // gives up for now
          }
        }
      }
    }

    // featured student: end the story on an unsolved medium graph problem worked on yesterday evening
    if (spec.featured) {
      const target = (problemsBySkill.get('Graphs') || []).find((p) => p.title === 'Number of Provinces') || (problemsBySkill.get('Graphs') || [])[1];
      if (target) {
        const base = new Date(now.getTime() - DAY);
        base.setHours(21, 12, 0, 0);
        [0, 1, 2].forEach((k) => attempts.push({
          at: new Date(base.getTime() + k * 14 * 60000), problemId: target._id, title: target.title, difficulty: target.difficulty, skillName: 'Graphs',
          correct: false, hints: k === 2 ? 1 : 0, passed: k === 2 ? 3 : 1, total: 4, timeTaken: 900 + k * 300, language: 'javascript'
        }));
      }
    }

    attempts.sort((a, b) => a.at - b.at);
    students.push({ ...spec, attempts, joinedDaysAgo });
  }
  return students;
};

module.exports = { simulateCohort, TRUE_PARAMS, mulberry32 };
