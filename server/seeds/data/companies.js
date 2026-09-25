/**
 * Company master data (23). CTC figures are typical *total first-year compensation* ranges in LPA
 * for new-grad software roles in India, compiled from public offer reports — indicative, not official.
 */

// Founding years (public record). Left out where the "founding" is ambiguous after mergers.
const FOUNDED = {
  google: 1998, amazon: 1994, microsoft: 1975, meta: 2004, apple: 1976, netflix: 1997, flipkart: 2007, razorpay: 2014, zerodha: 2010,
  atlassian: 2002, adobe: 1982, 'goldman-sachs': 1869, 'morgan-stanley': 1935, uber: 2009, oracle: 1977, salesforce: 1999, intuit: 1983,
  paypal: 1998, 'walmart-labs': 2011, tcs: 1968, infosys: 1981, swiggy: 2014
};

const round = (name, description, duration) => ({ name, description, duration });

module.exports = [
  {
    name: 'Google', slug: 'google', domain: 'google.com', tier: 'FAANG', headquarters: 'Mountain View, CA · Bengaluru · Hyderabad',
    avgCTC: '32–45 LPA', ctcMin: 32, ctcMax: 45, roles: ['SDE-1', 'SDE-2', 'SWE Intern', 'Data Engineer', 'ML Engineer', 'Product Manager'],
    description: 'Search, cloud, Android and AI at planetary scale. India hiring focuses on strong problem-solvers with clean, communicative coding.',
    interviewProcess: {
      difficulty: 'Hard',
      rounds: [
        round('Online Assessment', 'Two DSA problems (medium–hard) on a timed platform; sometimes skipped for referrals.', '90 min'),
        round('Technical Round 1', 'DSA on a shared doc — arrays/strings/graphs; interviewer probes edge cases and complexity.', '45 min'),
        round('Technical Round 2', 'Harder DSA or a small design problem; expects you to think aloud and iterate from brute force.', '45 min'),
        round('Googlyness & Leadership', 'Behavioural: collaboration, ambiguity, feedback, "tell me about a time…".', '45 min')
      ],
      tipsSummary: 'Graphs, DP and trees dominate. Communicate before you code, test with your own examples, and always state time/space complexity.'
    }
  },
  {
    name: 'Amazon', slug: 'amazon', domain: 'amazon.com', tier: 'FAANG', headquarters: 'Seattle, WA · Bengaluru · Hyderabad · Chennai',
    avgCTC: '26–38 LPA', ctcMin: 26, ctcMax: 38, roles: ['SDE-1', 'SDE-2', 'SDE Intern', 'Applied Scientist', 'Data Engineer'],
    description: 'E-commerce, AWS and devices. Leadership Principles are evaluated in EVERY round alongside DSA.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Assessment', '2 coding problems + debugging/work-simulation + workstyle survey.', '105 min'),
        round('Technical 1', 'One or two DSA problems plus 1–2 Leadership Principle questions.', '60 min'),
        round('Technical 2', 'DSA (trees/graphs) or LLD (parking lot, cache) plus LP deep-dives.', '60 min'),
        round('Bar Raiser', 'Senior interviewer from another team: LP-heavy, one coding problem, design discussion.', '60 min')
      ],
      tipsSummary: 'Prepare 8–10 STAR stories mapped to the 16 Leadership Principles. For DSA: BFS/DFS, heaps, sliding window and intervals appear constantly.'
    }
  },
  {
    name: 'Microsoft', slug: 'microsoft', domain: 'microsoft.com', tier: 'FAANG', headquarters: 'Redmond, WA · Hyderabad · Bengaluru',
    avgCTC: '22–45 LPA', ctcMin: 22, ctcMax: 45, roles: ['SDE-1', 'SDE-2', 'SDE Intern', 'Data Scientist', 'Program Manager'],
    description: 'Azure, Office, Windows, GitHub. Interviews reward solid fundamentals — OS, DBMS and OOP come up more than at most peers.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Assessment', '3 coding problems on Codility/HackerRank, time-boxed.', '90 min'),
        round('Technical 1', 'DSA (arrays, strings, trees) with follow-ups on optimisation.', '60 min'),
        round('Technical 2', 'DSA + CS fundamentals (OS, DBMS, networks) + OOP design.', '60 min'),
        round('As-Appropriate (AA)', 'Hiring-manager/senior round: design, projects, behavioural.', '60 min')
      ],
      tipsSummary: 'Know your resume projects cold. Expect design-a-class questions (OOP) and a CS-fundamentals probe.'
    }
  },
  {
    name: 'Meta', slug: 'meta', domain: 'meta.com', tier: 'FAANG', headquarters: 'Menlo Park, CA · London · Singapore',
    avgCTC: '45–70 LPA', ctcMin: 45, ctcMax: 70, roles: ['Software Engineer', 'Production Engineer', 'Data Scientist', 'Research Scientist'],
    description: 'Social platforms and AI. Fast-paced coding rounds: two mediums in 45 minutes is the norm.',
    interviewProcess: {
      difficulty: 'Hard',
      rounds: [
        round('Recruiter Screen', 'Background, team matching, timeline.', '30 min'),
        round('Coding Screen', 'Two medium problems, speed matters.', '45 min'),
        round('Onsite: Coding ×2', 'Two rounds of two problems each.', '90 min'),
        round('Onsite: System Design + Behavioural', 'Product-flavoured design and "Jedi" values round.', '90 min')
      ],
      tipsSummary: 'Speed and accuracy on medium problems: graphs, trees, intervals, two pointers. Practise solving two problems in 35 minutes.'
    }
  },
  {
    name: 'Apple', slug: 'apple', domain: 'apple.com', tier: 'FAANG', headquarters: 'Cupertino, CA · Hyderabad · Bengaluru',
    avgCTC: '35–55 LPA', ctcMin: 35, ctcMax: 55, roles: ['Software Engineer', 'ML Engineer', 'Hardware Engineer'],
    description: 'Team-specific hiring: each team runs its own loop, so preparation varies with the org (iOS, cloud, silicon, ML).',
    interviewProcess: {
      difficulty: 'Hard',
      rounds: [
        round('Recruiter/HM Screen', 'Domain fit and project deep-dive.', '30 min'),
        round('Technical Phone Screen', 'DSA + language-specific questions.', '60 min'),
        round('Onsite Rounds (4–6)', 'Mix of DSA, design and team-specific depth (e.g. concurrency, memory).', '5 hrs'),
        round('Director/Cross-team', 'Behavioural + product sense.', '45 min')
      ],
      tipsSummary: 'Know your language deeply (Swift/Obj-C/C++/Java) — expect internals questions (memory, threading).'
    }
  },
  {
    name: 'Netflix', slug: 'netflix', domain: 'netflix.com', tier: 'FAANG', headquarters: 'Los Gatos, CA',
    avgCTC: '60–90 LPA', ctcMin: 60, ctcMax: 90, roles: ['Senior Software Engineer', 'Data Engineer'],
    description: 'Senior-only hiring with a strong culture memo. New-grad hiring in India is extremely rare.',
    interviewProcess: {
      difficulty: 'Hard',
      rounds: [
        round('Recruiter Call', 'Culture-memo alignment, motivation.', '30 min'),
        round('Technical Screen', 'Coding + design tradeoffs.', '60 min'),
        round('Virtual Onsite', 'Deep system design, coding, and cross-functional partner interviews.', '4 hrs'),
        round('Hiring Manager', 'Ownership, judgement, "freedom and responsibility".', '45 min')
      ],
      tipsSummary: 'Read the Netflix Culture Memo. Design depth (distributed systems, streaming) matters far more than puzzle-solving.'
    }
  },
  {
    name: 'Flipkart', slug: 'flipkart', domain: 'flipkart.com', tier: 'Product', headquarters: 'Bengaluru, India',
    avgCTC: '25–40 LPA', ctcMin: 25, ctcMax: 40, roles: ['SDE-1', 'SDE-2', 'SDE Intern', 'Data Analyst'],
    description: "India's homegrown e-commerce giant (a Walmart company). Heavy on DSA, machine-coding and LLD.",
    interviewProcess: {
      difficulty: 'Hard',
      rounds: [
        round('Online Coding Test', '2–3 DSA problems + MCQs on CS fundamentals.', '90 min'),
        round('Machine Coding', 'Build a working, extensible mini-system (e.g. cab booking, splitwise) in 90 minutes.', '90 min'),
        round('Problem Solving & DS', 'Hard DSA (DP/graphs) with strong follow-ups.', '60 min'),
        round('Hiring Manager', 'Design (HLD), projects, behavioural.', '60 min')
      ],
      tipsSummary: 'Machine coding is a filter — practise clean OOP, separation of concerns and demo-able code in 90 minutes.'
    }
  },
  {
    name: 'Razorpay', slug: 'razorpay', domain: 'razorpay.com', tier: 'Product', headquarters: 'Bengaluru, India',
    avgCTC: '20–35 LPA', ctcMin: 20, ctcMax: 35, roles: ['SDE-1', 'SDE-2', 'Backend Engineer', 'SDE Intern'],
    description: 'Payments infrastructure for India. Backend-heavy: APIs, databases, idempotency and reliability.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Coding Test', 'Two DSA problems (medium).', '75 min'),
        round('Problem Solving', 'DSA + discussion of real payment-system edge cases.', '60 min'),
        round('Machine Coding / LLD', 'Design and code a small service (rate limiter, wallet).', '90 min'),
        round('Culture & Hiring Manager', 'Ownership, past projects, system design lite.', '45 min')
      ],
      tipsSummary: 'Know SQL, REST design, idempotency, transactions. Be ready to discuss failure handling in payment flows.'
    }
  },
  {
    name: 'Zerodha', slug: 'zerodha', domain: 'zerodha.com', tier: 'Product', headquarters: 'Bengaluru, India',
    avgCTC: '18–30 LPA', ctcMin: 18, ctcMax: 30, roles: ['Backend Engineer', 'Frontend Engineer', 'SDE-1'],
    description: "India's largest stockbroker — a tiny engineering team building high-throughput systems in Go, Python and Postgres.",
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Take-home Assignment', 'Small real-world coding task; quality and simplicity are judged.', '2 days'),
        round('Code Review Discussion', 'Walkthrough of your submission, trade-offs and alternatives.', '45 min'),
        round('Technical Conversation', 'Systems, databases, networking — practical, not puzzle-style.', '60 min'),
        round('Culture Chat', 'Motivation for a small, opinionated team.', '30 min')
      ],
      tipsSummary: 'Simplicity wins. Show you can build and maintain real software — read their engineering blog beforehand.'
    }
  },
  {
    name: 'Atlassian', slug: 'atlassian', domain: 'atlassian.com', tier: 'Product', headquarters: 'Sydney · Bengaluru',
    avgCTC: '45–70 LPA', ctcMin: 45, ctcMax: 70, roles: ['SDE-1', 'SDE-2', 'SDE Intern'],
    description: 'Jira, Confluence, Bitbucket. Values-driven interviews with a practical, engineering-craft flavour.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Coding Assessment', 'Two problems, one LLD-flavoured.', '90 min'),
        round('Code Design', 'Implement a small system with clean abstractions and tests.', '60 min'),
        round('System Design', 'HLD of a collaboration-style product feature.', '60 min'),
        round('Values Interview', 'Team-work, openness, "don\'t #@!% the customer" style questions.', '45 min')
      ],
      tipsSummary: 'Write production-quality code in interviews: naming, small functions, tests. Prepare for values questions seriously — they gate offers.'
    }
  },
  {
    name: 'Adobe', slug: 'adobe', domain: 'adobe.com', tier: 'Product', headquarters: 'San Jose, CA · Noida · Bengaluru',
    avgCTC: '25–40 LPA', ctcMin: 25, ctcMax: 40, roles: ['SDE-1', 'Computer Scientist', 'SDE Intern'],
    description: 'Creative Cloud, Acrobat and Experience Cloud. Interviews test fundamentals: DSA, OOP and system basics.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Test', 'MCQs (CS core) + 2 coding problems.', '120 min'),
        round('Technical 1', 'DSA (arrays, strings, linked lists, trees).', '60 min'),
        round('Technical 2', 'DSA + OOP/LLD + resume projects.', '60 min'),
        round('Managerial/HR', 'Fit, expectations, project impact.', '45 min')
      ],
      tipsSummary: 'Strong on basics: linked lists, trees, sorting, OOP principles. Resume projects get deep questioning.'
    }
  },
  {
    name: 'Goldman Sachs', slug: 'goldman-sachs', domain: 'goldmansachs.com', tier: 'Finance', headquarters: 'New York · Bengaluru · Hyderabad',
    avgCTC: '22–32 LPA', ctcMin: 22, ctcMax: 32, roles: ['Analyst (Engineering)', 'Summer Analyst', 'Data Analyst'],
    description: 'Engineering division ("Strats" and core engineering) in investment banking. Aptitude + coding + finance-flavoured problem solving.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Assessment', 'Aptitude/quant + 2 coding questions + CS MCQs.', '120 min'),
        round('CoderPad Round', 'Live coding (medium) with CS follow-ups.', '60 min'),
        round('Technical Interview', 'DSA, DBMS/OS, projects.', '60 min'),
        round('Superday / Managerial', 'Panel: technical + behavioural + finance curiosity.', '90 min')
      ],
      tipsSummary: 'Aptitude cut-offs are real. DBMS/SQL and OOP are asked more than at product firms. Show interest in markets.'
    }
  },
  {
    name: 'Morgan Stanley', slug: 'morgan-stanley', domain: 'morganstanley.com', tier: 'Finance', headquarters: 'New York · Mumbai · Bengaluru',
    avgCTC: '20–30 LPA', ctcMin: 20, ctcMax: 30, roles: ['Technology Analyst', 'Summer Analyst'],
    description: 'Technology division of a global investment bank; strong emphasis on clean code and problem decomposition.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Test', 'Aptitude, CS MCQs and 2 coding problems.', '120 min'),
        round('Technical Round 1', 'DSA + OOP + DBMS.', '60 min'),
        round('Technical Round 2', 'Design a system / puzzle-style reasoning.', '60 min'),
        round('HR / Managerial', 'Motivation, teamwork, situational.', '30 min')
      ],
      tipsSummary: 'Practise SQL and OOP alongside DSA. Puzzles occasionally appear.'
    }
  },
  {
    name: 'JP Morgan', slug: 'jp-morgan', domain: 'jpmorgan.com', tier: 'Finance', headquarters: 'New York · Mumbai · Bengaluru · Hyderabad',
    avgCTC: '18–28 LPA', ctcMin: 18, ctcMax: 28, roles: ['Software Engineer (SEP)', 'Associate Engineer', 'Summer Intern'],
    description: 'Software Engineer Program (SEP) hires broadly from campuses; process is structured and predictable.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Coding Test', '3 problems on HackerRank (easy–medium).', '90 min'),
        round('Code for Good / Hackathon', 'Team-based problem solving (some campuses).', '5 hrs'),
        round('Technical Interview', 'DSA + OOP + resume + SQL.', '45 min'),
        round('HR / Behavioural', 'Values-based questions.', '30 min')
      ],
      tipsSummary: 'Consistent medium-level DSA plus clear communication. Be ready to explain every line of every project on your resume.'
    }
  },
  {
    name: 'Uber', slug: 'uber', domain: 'uber.com', tier: 'Product', headquarters: 'San Francisco · Bengaluru · Hyderabad',
    avgCTC: '40–65 LPA', ctcMin: 40, ctcMax: 65, roles: ['SDE-1', 'SDE-2', 'SDE Intern'],
    description: 'Marketplace, maps and payments at scale. Demanding DSA plus a real system-design component even for new grads.',
    interviewProcess: {
      difficulty: 'Hard',
      rounds: [
        round('Online Assessment', '3 problems (medium–hard).', '90 min'),
        round('Coding Round 1', 'Hard DSA (graphs/DP) with optimisation follow-ups.', '60 min'),
        round('Coding Round 2', 'Medium-hard DSA + concurrency/LLD.', '60 min'),
        round('System Design + Behavioural', 'Design a ride-matching or notification system; bar-raiser style culture round.', '90 min')
      ],
      tipsSummary: 'Heaps, graphs and intervals appear a lot. Prepare one full HLD (ride matching / surge pricing) even for SDE-1.'
    }
  },
  {
    name: 'Oracle', slug: 'oracle', domain: 'oracle.com', tier: 'Product', headquarters: 'Austin, TX · Bengaluru · Hyderabad',
    avgCTC: '16–30 LPA', ctcMin: 16, ctcMax: 30, roles: ['Software Developer', 'Member of Technical Staff', 'Intern'],
    description: 'Databases, cloud (OCI) and enterprise apps. Strong on CS fundamentals: DBMS internals, OS and Java.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Assessment', 'MCQs (CS, aptitude) + 2 coding problems.', '100 min'),
        round('Technical 1', 'DSA + Java/OOP + DBMS.', '60 min'),
        round('Technical 2', 'Design discussion + OS/networks + projects.', '60 min'),
        round('Managerial/HR', 'Expectations, relocation, fit.', '30 min')
      ],
      tipsSummary: 'DBMS (indexes, transactions, normalisation) and OS (threads, deadlocks, memory) are core, not optional.'
    }
  },
  {
    name: 'Salesforce', slug: 'salesforce', domain: 'salesforce.com', tier: 'Product', headquarters: 'San Francisco · Hyderabad · Bengaluru',
    avgCTC: '30–45 LPA', ctcMin: 30, ctcMax: 45, roles: ['Associate Member of Technical Staff', 'MTS', 'Intern'],
    description: 'CRM and cloud platform. Culture (Ohana, trust) is weighed alongside technical skill.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Coding Assessment', '2 DSA problems (medium).', '90 min'),
        round('Technical Round 1', 'DSA + debugging.', '60 min'),
        round('Technical Round 2', 'DSA + LLD/OOP + project deep-dive.', '60 min'),
        round('Hiring Manager', 'Culture, collaboration, impact.', '45 min')
      ],
      tipsSummary: 'Clean, readable code and testing mindset. Show curiosity about the customer problem, not only the algorithm.'
    }
  },
  {
    name: 'Intuit', slug: 'intuit', domain: 'intuit.com', tier: 'Product', headquarters: 'Mountain View, CA · Bengaluru',
    avgCTC: '32–50 LPA', ctcMin: 32, ctcMax: 50, roles: ['Software Engineer 1', 'SDE-2', 'Intern'],
    description: 'TurboTax, QuickBooks, Mailchimp. Strong design-for-delight culture with hands-on coding rounds.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Coding', '2–3 problems + MCQs.', '90 min'),
        round('Coding & DS', 'Two medium problems live.', '60 min'),
        round('Design (LLD/HLD)', 'Design a small product feature end-to-end.', '60 min'),
        round('Behavioural (Values)', 'Customer obsession, courage, integrity.', '45 min')
      ],
      tipsSummary: 'LLD matters: practise designing classes/interfaces for real products (expense tracker, invoicing).'
    }
  },
  {
    name: 'PayPal', slug: 'paypal', domain: 'paypal.com', tier: 'Product', headquarters: 'San Jose, CA · Chennai · Bengaluru',
    avgCTC: '28–45 LPA', ctcMin: 28, ctcMax: 45, roles: ['SDE-1', 'SDE-2', 'Intern'],
    description: 'Payments and fintech. Emphasis on correctness, concurrency and API design.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Assessment', '2 coding problems + MCQs.', '90 min'),
        round('Technical 1', 'DSA (medium) + Java/OOP.', '60 min'),
        round('Technical 2', 'System design lite + concurrency + SQL.', '60 min'),
        round('Managerial', 'Ownership, past projects, fit.', '45 min')
      ],
      tipsSummary: 'Be comfortable with concurrency basics (locks, thread-safety), SQL and REST API design.'
    }
  },
  {
    name: 'Walmart Labs', slug: 'walmart-labs', domain: 'walmart.com', tier: 'Product', headquarters: 'Bengaluru · Chennai',
    avgCTC: '25–40 LPA', ctcMin: 25, ctcMax: 40, roles: ['SDE-2 (Grad)', 'SDE-3', 'Data Engineer', 'Intern'],
    description: "Walmart Global Tech India — retail, supply-chain and marketplace systems at Walmart scale.",
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Test', '3 coding problems + MCQs.', '90 min'),
        round('Technical 1', 'DSA (medium/hard) with follow-ups.', '60 min'),
        round('Technical 2', 'LLD/machine coding + DSA.', '75 min'),
        round('Managerial + HR', 'Projects, ownership, compensation discussion.', '45 min')
      ],
      tipsSummary: 'LLD/machine coding is emphasised. Practise clean OOP solutions to inventory/booking-style problems.'
    }
  },
  {
    name: 'TCS', slug: 'tcs', domain: 'tcs.com', tier: 'Service', headquarters: 'Mumbai, India',
    avgCTC: '3.5–7 LPA', ctcMin: 3.5, ctcMax: 7, roles: ['Assistant System Engineer', 'Digital', 'Prime'],
    description: 'Largest Indian IT services company. Mass recruiter through NQT; Digital and Prime tracks pay more for stronger coders.',
    interviewProcess: {
      difficulty: 'Easy',
      rounds: [
        round('TCS NQT', 'Aptitude, verbal, reasoning + 1–2 coding questions.', '180 min'),
        round('Technical Interview', 'Basics of DSA, DBMS, OOP + project.', '30 min'),
        round('Managerial Round', 'Situational questions, flexibility, location.', '20 min'),
        round('HR Round', 'Documents, joining, salary.', '15 min')
      ],
      tipsSummary: 'NQT cut-offs matter most. For Digital/Prime, practise easy–medium coding and know your projects well.'
    }
  },
  {
    name: 'Infosys', slug: 'infosys', domain: 'infosys.com', tier: 'Service', headquarters: 'Bengaluru, India',
    avgCTC: '3.6–9 LPA', ctcMin: 3.6, ctcMax: 9, roles: ['Systems Engineer', 'Specialist Programmer', 'Digital Specialist Engineer'],
    description: 'Global IT services major. Specialist Programmer (SP) and DSE tracks have real coding bars.',
    interviewProcess: {
      difficulty: 'Easy',
      rounds: [
        round('InfyTQ / HackWithInfy', 'Coding contest: 3 problems, difficulty tiers decide the track.', '180 min'),
        round('Technical Interview', 'DSA basics, DBMS, OOP, projects.', '30 min'),
        round('HR Interview', 'Communication, relocation, expectations.', '20 min')
      ],
      tipsSummary: 'HackWithInfy performance decides SP/DSE. Solve at least two problems for the higher band.'
    }
  },
  {
    name: 'Swiggy', slug: 'swiggy', domain: 'swiggy.com', tier: 'Startup', headquarters: 'Bengaluru, India',
    avgCTC: '24–40 LPA', ctcMin: 24, ctcMax: 40, roles: ['SDE-1', 'SDE-2', 'Data Analyst'],
    description: 'Food delivery and quick-commerce. Real-time systems, geo/maps and high-QPS backends.',
    interviewProcess: {
      difficulty: 'Medium',
      rounds: [
        round('Online Test', '2 problems (medium).', '75 min'),
        round('Problem Solving', 'DSA (graphs, heaps) with dispatch/routing flavour.', '60 min'),
        round('LLD / Machine Coding', 'Design a delivery-assignment or cart service.', '90 min'),
        round('Hiring Manager', 'HLD-lite, ownership, past impact.', '45 min')
      ],
      tipsSummary: 'Think in terms of real-time assignment problems: heaps, geo-indexing and queues.'
    }
  }
].map((c) => ({
  ...c,
  // Clearbit's free logo API was retired; Google's favicon service is stable and needs no key
  logo: `https://www.google.com/s2/favicons?domain=${c.domain}&sz=128`,
  website: `https://www.${c.domain}`,
  founded: FOUNDED[c.slug] || null
}));
