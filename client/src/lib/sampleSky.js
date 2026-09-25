/** A demo skill graph for the public pages — same shape the dashboard's Constellation receives. */
const DEFS = [
  ['arrays', 'Arrays', 1, []],
  ['strings', 'Strings', 2, []],
  ['hashing', 'Hashing', 3, ['arrays']],
  ['sorting', 'Sorting', 4, ['arrays']],
  ['recursion', 'Recursion', 5, ['arrays']],
  ['searching', 'Searching', 6, ['arrays', 'sorting']],
  ['lists', 'Linked Lists', 7, ['arrays']],
  ['stacks', 'Stacks & Queues', 8, ['lists']],
  ['trees', 'Trees', 9, ['recursion', 'lists']],
  ['graphs', 'Graphs', 10, ['trees']],
  ['dp', 'Dynamic Programming', 11, ['recursion']],
  ['greedy', 'Greedy', 12, ['dp']]
];

const names = new Map(DEFS.map(([id, name]) => [id, name]));

/** `levels` maps skill id → mastery 0–1; anything missing is untouched. */
export function buildSampleSky(levels = {}, due = []) {
  return DEFS.map(([id, name, order, prereq]) => {
    const p = levels[id];
    const touched = p !== undefined;
    return {
      skillId: id, name, order,
      masteryP: touched ? p : 0.1, currentP: touched ? p : 0.1,
      attempts: touched ? Math.round(3 + p * 12) : 0,
      isUnlocked: touched || prereq.length === 0,
      isMastered: touched && p >= 0.85,
      reviewDue: due.includes(id),
      trend: touched ? 'up' : 'flat',
      cohortDelta: touched ? 0.12 : null,
      predictedAttemptsToMastery: touched && p < 0.85 ? Math.ceil((0.85 - p) * 30) : 0,
      prerequisites: prereq.map((r) => ({ _id: r, name: names.get(r) }))
    };
  });
}

export const SKY_STEPS = [
  { arrays: 0.3, strings: 0.15 },
  { arrays: 0.62, strings: 0.35, hashing: 0.25, sorting: 0.2 },
  { arrays: 0.8, strings: 0.6, hashing: 0.55, sorting: 0.5, recursion: 0.3, lists: 0.25 },
  { arrays: 0.93, strings: 0.78, hashing: 0.72, sorting: 0.7, recursion: 0.55, lists: 0.6, searching: 0.4, stacks: 0.3 },
  { arrays: 0.97, strings: 0.9, hashing: 0.88, sorting: 0.84, recursion: 0.74, lists: 0.86, searching: 0.8, stacks: 0.75, trees: 0.5, dp: 0.3 }
];
