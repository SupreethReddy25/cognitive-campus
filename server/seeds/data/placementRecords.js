/**
 * College placement history (2022–2026). Compact table → expanded into CollegePlacementRecord rows.
 *
 * Each spec: [companySlug, hiresPerYear[2022..2026] (null = did not visit), baseCTC in LPA (2022 level), roles[], minCGPA?]
 * Package grows ~4% a year. Numbers are realistic for each tier and illustrative for demo purposes.
 */

const YEARS = [2022, 2023, 2024, 2025, 2026];

const TABLE = {
  'iit-bombay': [
    ['google', [4, 5, 6, 5, 7], 42, ['SDE-1', 'SWE Intern']], ['microsoft', [8, 9, 10, 9, 11], 40, ['SDE-1', 'SDE Intern']],
    ['amazon', [12, 14, 13, 12, 15], 30, ['SDE-1', 'SDE Intern']], ['goldman-sachs', [10, 12, 9, 11, 12], 31, ['Analyst (Engineering)', 'Summer Analyst']],
    ['morgan-stanley', [6, 7, 6, 5, 7], 28, ['Technology Analyst']], ['jp-morgan', [5, 5, 6, 6, 5], 26, ['Software Engineer (SEP)']],
    ['atlassian', [3, 4, 4, 5, 6], 50, ['SDE-1']], ['uber', [4, 6, 5, 6, 7], 46, ['SDE-1']], ['meta', [1, 2, 2, 1, 2], 60, ['Software Engineer']],
    ['apple', [1, 1, 2, 2, 2], 45, ['Software Engineer']], ['adobe', [3, 4, 3, 4, 4], 32, ['SDE-1', 'Computer Scientist']],
    ['flipkart', [5, 6, 4, 5, 6], 34, ['SDE-1']], ['intuit', [2, 3, 3, 4, 3], 38, ['Software Engineer 1']], ['salesforce', [2, 2, 3, 2, 3], 36, ['AMTS']],
    ['razorpay', [2, 3, 3, 4, 4], 28, ['SDE-1', 'Backend Engineer']], ['oracle', [2, 3, 2, 2, 3], 24, ['Software Developer']]
  ],
  'iit-delhi': [
    ['google', [3, 4, 5, 6, 5], 42, ['SDE-1']], ['microsoft', [7, 8, 9, 8, 10], 40, ['SDE-1']], ['amazon', [10, 11, 12, 11, 13], 30, ['SDE-1', 'SDE Intern']],
    ['goldman-sachs', [8, 9, 10, 8, 9], 31, ['Analyst (Engineering)']], ['uber', [3, 4, 5, 5, 6], 46, ['SDE-1']], ['atlassian', [2, 3, 3, 4, 4], 50, ['SDE-1']],
    ['flipkart', [4, 5, 5, 4, 6], 34, ['SDE-1']], ['adobe', [3, 3, 4, 4, 5], 32, ['SDE-1']], ['meta', [null, 1, 1, 2, 1], 60, ['Software Engineer']],
    ['morgan-stanley', [5, 5, 6, 6, 5], 28, ['Technology Analyst']], ['intuit', [2, 2, 3, 3, 4], 38, ['Software Engineer 1']], ['jp-morgan', [4, 4, 5, 5, 6], 26, ['Software Engineer (SEP)']]
  ],
  'iit-madras': [
    ['google', [3, 3, 4, 5, 5], 42, ['SDE-1']], ['microsoft', [6, 7, 8, 8, 9], 40, ['SDE-1']], ['amazon', [9, 10, 11, 10, 12], 30, ['SDE-1']],
    ['goldman-sachs', [7, 8, 8, 9, 8], 31, ['Analyst (Engineering)']], ['flipkart', [4, 4, 5, 6, 5], 34, ['SDE-1', 'SDE-2']], ['walmart-labs', [3, 4, 4, 5, 5], 28, ['SDE-2 (Grad)']],
    ['uber', [null, 3, 4, 4, 5], 46, ['SDE-1']], ['atlassian', [null, 2, 3, 3, 4], 50, ['SDE-1']], ['paypal', [2, 3, 3, 3, 4], 30, ['SDE-1']]
  ],
  'nit-trichy': [
    ['amazon', [9, 10, 12, 11, 13], 20, ['SDE-1', 'SDE Intern']], ['microsoft', [4, 5, 6, 6, 7], 30, ['SDE-1']], ['goldman-sachs', [5, 6, 5, 7, 6], 24, ['Analyst (Engineering)']],
    ['flipkart', [3, 4, 4, 5, 5], 26, ['SDE-1']], ['razorpay', [null, 2, 3, 3, 4], 22, ['SDE-1']], ['walmart-labs', [4, 5, 5, 6, 6], 25, ['SDE-2 (Grad)']],
    ['adobe', [3, 3, 4, 4, 5], 24, ['SDE-1']], ['oracle', [6, 7, 7, 8, 8], 16, ['Member of Technical Staff']], ['jp-morgan', [8, 9, 10, 9, 11], 18, ['Software Engineer (SEP)']],
    ['morgan-stanley', [3, 4, 4, 5, 5], 21, ['Technology Analyst']], ['paypal', [2, 3, 2, 3, 3], 28, ['SDE-1']], ['tcs', [40, 45, 50, 48, 55], 4, ['Digital', 'Prime']],
    ['intuit', [null, 1, 2, 2, 3], 30, ['Software Engineer 1']], ['uber', [null, null, 1, 2, 2], 38, ['SDE-1']]
  ],
  'nit-warangal': [
    ['microsoft', [3, 4, 5, 5, 6], 28, ['SDE-1']], ['amazon', [8, 9, 9, 10, 11], 20, ['SDE-1']], ['flipkart', [3, 3, 4, 4, 5], 24, ['SDE-1']], ['zerodha', [null, 1, 1, 2, 2], 18, ['Backend Engineer']],
    ['goldman-sachs', [4, 4, 5, 5, 6], 24, ['Analyst (Engineering)']], ['oracle', [5, 6, 6, 7, 7], 16, ['Member of Technical Staff']], ['adobe', [2, 3, 3, 4, 4], 24, ['SDE-1']],
    ['walmart-labs', [3, 4, 4, 5, 5], 24, ['SDE-2 (Grad)']], ['google', [null, 1, 2, 2, 3], 38, ['SDE-1']], ['jp-morgan', [6, 7, 7, 8, 8], 18, ['Software Engineer (SEP)']]
  ],
  'bits-pilani': [
    ['google', [3, 4, 4, 5, 4], 40, ['SDE-1']], ['microsoft', [7, 8, 8, 9, 9], 38, ['SDE-1', 'Program Manager']], ['amazon', [10, 12, 11, 12, 13], 28, ['SDE-1', 'SDE Intern']],
    ['goldman-sachs', [8, 9, 9, 10, 10], 30, ['Analyst (Engineering)', 'Summer Analyst']], ['atlassian', [2, 3, 3, 4, 4], 48, ['SDE-1', 'SDE Intern']], ['intuit', [3, 3, 4, 4, 5], 34, ['Software Engineer 1']],
    ['uber', [2, 3, 3, 4, 4], 44, ['SDE-1']], ['flipkart', [4, 5, 5, 5, 6], 32, ['SDE-1']], ['adobe', [3, 4, 4, 5, 5], 30, ['SDE-1']], ['morgan-stanley', [4, 5, 5, 6, 5], 27, ['Technology Analyst']],
    ['salesforce', [2, 2, 3, 3, 3], 34, ['AMTS']]
  ],
  'iiit-hyderabad': [
    ['google', [4, 5, 5, 6, 6], 42, ['SDE-1', 'ML Engineer']], ['microsoft', [6, 7, 8, 8, 9], 40, ['SDE-1']], ['amazon', [8, 9, 10, 10, 11], 30, ['SDE-1']], ['apple', [1, 2, 2, 3, 3], 44, ['Software Engineer']],
    ['uber', [3, 4, 4, 5, 5], 46, ['SDE-1']], ['atlassian', [2, 3, 3, 3, 4], 50, ['SDE-1']], ['salesforce', [3, 3, 4, 4, 4], 36, ['AMTS']], ['morgan-stanley', [4, 5, 4, 5, 6], 28, ['Technology Analyst']],
    ['flipkart', [3, 3, 4, 4, 4], 34, ['SDE-1']], ['razorpay', [1, 2, 2, 3, 3], 28, ['SDE-1']]
  ],
  'vit-vellore': [
    ['amazon', [12, 14, 15, 14, 16], 16, ['SDE-1']], ['microsoft', [3, 4, 4, 5, 5], 26, ['SDE-1', 'SDE Intern']], ['paypal', [5, 6, 6, 7, 7], 26, ['SDE-1']], ['goldman-sachs', [3, 4, 4, 5, 5], 22, ['Analyst (Engineering)']],
    ['oracle', [8, 9, 10, 10, 11], 14, ['Member of Technical Staff']], ['jp-morgan', [10, 12, 12, 13, 14], 17, ['Software Engineer (SEP)']], ['walmart-labs', [4, 5, 6, 6, 7], 22, ['SDE-2 (Grad)']],
    ['tcs', [180, 200, 210, 220, 240], 4, ['Digital', 'Prime', 'Ninja']], ['infosys', [150, 160, 170, 180, 190], 4, ['Systems Engineer', 'Specialist Programmer']], ['adobe', [2, 3, 3, 3, 4], 22, ['SDE-1']]
  ],
  amrita: [
    ['amazon', [6, 7, 8, 8, 9], 16, ['SDE-1']], ['walmart-labs', [3, 4, 4, 5, 5], 22, ['SDE-2 (Grad)']], ['jp-morgan', [7, 8, 9, 9, 10], 17, ['Software Engineer (SEP)']], ['oracle', [5, 5, 6, 7, 7], 14, ['Member of Technical Staff']],
    ['microsoft', [1, 2, 2, 3, 3], 24, ['SDE-1']], ['goldman-sachs', [2, 2, 3, 3, 4], 21, ['Analyst (Engineering)']], ['tcs', [90, 100, 110, 115, 120], 4, ['Digital', 'Prime']], ['infosys', [70, 80, 85, 90, 95], 4, ['Systems Engineer', 'Specialist Programmer']],
    ['paypal', [null, 2, 2, 3, 3], 24, ['SDE-1']]
  ],
  srm: [
    ['amazon', [6, 7, 8, 8, 9], 15, ['SDE-1']], ['oracle', [8, 9, 10, 10, 11], 14, ['Member of Technical Staff']], ['adobe', [1, 2, 2, 3, 3], 20, ['SDE-1']], ['jp-morgan', [6, 7, 7, 8, 8], 16, ['Software Engineer (SEP)']],
    ['tcs', [250, 270, 280, 300, 310], 4, ['Digital', 'Ninja']], ['infosys', [200, 220, 230, 240, 250], 4, ['Systems Engineer']], ['walmart-labs', [null, 2, 3, 3, 4], 20, ['SDE-2 (Grad)']], ['swiggy', [null, null, 1, 2, 2], 22, ['SDE-1']]
  ],
  'pes-university': [
    ['amazon', [5, 6, 7, 8, 8], 17, ['SDE-1']], ['flipkart', [2, 3, 3, 4, 4], 22, ['SDE-1']], ['walmart-labs', [3, 3, 4, 4, 5], 22, ['SDE-2 (Grad)']], ['oracle', [4, 5, 5, 6, 6], 14, ['Member of Technical Staff']],
    ['intuit', [1, 1, 2, 2, 2], 28, ['Software Engineer 1']], ['razorpay', [1, 2, 2, 3, 3], 22, ['SDE-1']], ['swiggy', [1, 2, 2, 3, 3], 22, ['SDE-1']], ['microsoft', [2, 2, 3, 3, 4], 24, ['SDE-1']]
  ],
  'dtu-delhi': [
    ['amazon', [8, 9, 10, 10, 11], 18, ['SDE-1']], ['adobe', [4, 5, 5, 6, 6], 24, ['SDE-1']], ['microsoft', [4, 5, 5, 6, 6], 28, ['SDE-1']], ['razorpay', [2, 2, 3, 3, 4], 22, ['SDE-1']],
    ['goldman-sachs', [3, 3, 4, 4, 5], 24, ['Analyst (Engineering)']], ['flipkart', [3, 4, 4, 5, 5], 26, ['SDE-1']], ['uber', [1, 2, 2, 3, 3], 40, ['SDE-1']], ['google', [null, 1, 1, 2, 2], 38, ['SDE-1']]
  ],
  'nit-surathkal': [
    ['amazon', [6, 7, 8, 8, 9], 18, ['SDE-1']], ['microsoft', [3, 3, 4, 4, 5], 26, ['SDE-1']], ['uber', [1, 2, 2, 2, 3], 38, ['SDE-1']], ['oracle', [5, 5, 6, 6, 7], 15, ['Member of Technical Staff']],
    ['jp-morgan', [5, 6, 6, 7, 7], 17, ['Software Engineer (SEP)']], ['goldman-sachs', [3, 3, 4, 4, 4], 22, ['Analyst (Engineering)']]
  ],
  thapar: [
    ['tcs', [120, 130, 135, 140, 150], 4, ['Digital', 'Prime']], ['jp-morgan', [4, 4, 5, 5, 6], 16, ['Software Engineer (SEP)']], ['amazon', [3, 4, 4, 5, 5], 15, ['SDE-1']], ['oracle', [3, 3, 4, 4, 4], 14, ['Member of Technical Staff']],
    ['infosys', [60, 70, 70, 80, 85], 4, ['Systems Engineer']]
  ]
};

const buildPlacementRecords = () => {
  const rows = [];
  for (const [college, specs] of Object.entries(TABLE)) {
    for (const [company, hires, base, roles] of specs) {
      // deterministic, sporadic gaps so visit histories look like real campuses (not every recruiter every year)
      const gap = (i) => { let x = 2166136261; for (const ch of `${college}:${company}:${i}`) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return ((x >>> 0) % 100) < (['tcs', 'infosys'].includes(company) ? 3 : 22); };
      let visits = hires.filter((h) => h != null).length;
      hires.forEach((h, i) => {
        if (h === null || h === undefined) return;
        if (visits > 3 && i < hires.length - 1 && gap(i)) { visits -= 1; return; }
        const year = YEARS[i];
        const ctc = Math.round(base * (1 + 0.04 * i) * 10) / 10;
        const isMass = ['tcs', 'infosys'].includes(company);
        rows.push({
          collegeSlug: college,
          companySlug: company,
          hiringYear: year,
          hiringSeason: 'On-Campus',
          roles,
          studentsHired: h,
          packageOffered: { ctc: `${ctc} LPA`, breakdown: isMass ? 'Fixed CTC' : `${Math.round(ctc * 0.72 * 10) / 10} base + ${Math.round(ctc * 0.12 * 10) / 10} bonus + ${Math.round(ctc * 0.16 * 10) / 10} stock/variable` },
          eligibility: { minCGPA: isMass ? '6.0' : ctc >= 30 ? '7.5' : '7.0', branches: ['CSE', 'IT', 'ECE', 'EE'] },
          assessmentStages: isMass ? ['Online Test', 'Technical Interview', 'HR Interview'] : ['Online Assessment', 'Technical Interviews', 'HR / Managerial'],
          verified: false,
          source: 'modelled',
          notes: `Modelled estimate from typical recruiter patterns — replace with placement-cell data (Admin → Add data).`
        });
      });
    }
  }
  return rows;
};

module.exports = { buildPlacementRecords, TABLE, YEARS };
