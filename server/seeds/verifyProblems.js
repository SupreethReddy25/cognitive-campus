/**
 * verifyProblems.js — proves every seeded problem is solvable.
 *
 * Runs the editorial reference solution (JavaScript and Python) of every catalogue problem
 * through the real execution pipeline (harness + judge) against ALL of its test cases — public and
 * hidden. Any mismatch means a wrong expected output, a wrong reference, or a harness gap.
 *
 * Usage:  node seeds/verifyProblems.js [titleFilter]
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const { getCatalog } = require('./data/problemCatalog');
const codeExecutionService = require('../services/codeExecutionService');

const filter = (process.argv[2] || '').toLowerCase();

const run = async () => {
  const catalog = getCatalog().filter((p) => !filter || p.title.toLowerCase().includes(filter));
  let failures = 0;
  let checked = 0;
  const started = Date.now();

  for (const p of catalog) {
    for (const [lang, key] of [['javascript', 'javascript'], ['python', 'python']]) {
      const code = p.editorial?.code?.[key];
      if (!code) {
        console.log(`  ⚠  ${p.title} [${lang}] — no reference solution`);
        continue;
      }
      const problemLike = { starterCode: p.starterCode, starterCodeMap: p.starterCodeMap, checker: p.checker };
      const res = await codeExecutionService.runTestCases(code, p.testCases, lang, problemLike);
      checked++;
      if (!res.allPassed) {
        failures++;
        console.log(`  ✗ ${p.title} [${lang}] ${res.passed}/${res.total}`);
        res.results.forEach((r, i) => {
          if (!r.passed) console.log(`      test ${i + 1}: input=${JSON.stringify(r.input).slice(0, 80)} expected=${JSON.stringify(r.expectedOutput).slice(0, 80)} got=${JSON.stringify(r.actualOutput).slice(0, 160)}`);
        });
      } else {
        process.stdout.write(`  ✓ ${p.title} [${lang}] ${res.passed}/${res.total}\n`);
      }
    }
  }

  console.log(`\n${catalog.length} problems, ${checked} reference runs, ${failures} failing (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  process.exit(failures ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(2); });
