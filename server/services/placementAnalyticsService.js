/**
 * Placement Analytics Service — college-scoped hiring intelligence.
 *
 *   hiringTrends     year-over-year companies / hires / packages (from placement records)
 *   skillDemand      skill × year heatmap of how often each tracked skill appears in reports
 *   predictions      which companies are likely to visit next year (recency-weighted, Bayesian-smoothed
 *                    visit frequency + momentum) with expected hires
 *   skillGap         demand at THIS college vs the student's mastery, with concrete practice targets
 *
 * @module placementAnalyticsService
 */

const CollegePlacementRecord = require('../models/CollegePlacementRecord');
const InterviewExperience = require('../models/InterviewExperience');
const College = require('../models/College');
const Skill = require('../models/Skill');
const { mapTopicToSkill } = require('./topicSkillMapper');
const analytics = require('./analyticsService');

const parseLpa = (str) => {
  const nums = String(str || '').match(/\d+(?:\.\d+)?/g);
  if (!nums) return null;
  const v = nums.map(Number);
  return v.reduce((a, b) => a + b, 0) / v.length;
};

/**
 * Recency-weighted, Beta-smoothed probability that a company recruits in `predictYear`.
 *
 * P = (Σ wᵢ·visitedᵢ + α) / (Σ wᵢ + α + β),  wᵢ = 0.5^(age/2)   (half-life 2 years)
 * with a small momentum bonus for back-to-back recent visits.
 */
const visitProbability = (visitYears, latestYear, window = 5, alpha = 0.6, beta = 1.0) => {
  let num = alpha;
  let den = alpha + beta;
  for (let y = latestYear - window + 1; y <= latestYear; y++) {
    const w = Math.pow(0.5, (latestYear - y) / 2);
    den += w;
    if (visitYears.has(y)) num += w;
  }
  let p = num / den;
  if (visitYears.has(latestYear) && visitYears.has(latestYear - 1)) p = Math.min(0.97, p * 1.06);
  return p;
};

const getHiringTrends = (records) => {
  const byYear = new Map();
  records.forEach((r) => {
    const e = byYear.get(r.hiringYear) || { year: r.hiringYear, companies: new Set(), hires: 0, hiresKnown: 0, lpas: [], records: 0, topOffer: null };
    e.companies.add(String(r.companyId?._id || r.companyId));
    e.records++;
    if (r.studentsHired) { e.hires += r.studentsHired; e.hiresKnown++; }
    const lpa = parseLpa(r.packageOffered?.ctc);
    if (lpa) { e.lpas.push(lpa); if (!e.topOffer || lpa > e.topOffer.lpa) e.topOffer = { lpa, company: r.companyId?.name || null }; }
    byYear.set(r.hiringYear, e);
  });
  return [...byYear.values()]
    .sort((a, b) => a.year - b.year)
    .map((e) => ({
      year: e.year,
      companies: e.companies.size,
      hires: e.hires,
      avgPackage: e.lpas.length ? +(e.lpas.reduce((a, b) => a + b, 0) / e.lpas.length).toFixed(1) : null,
      topPackage: e.topOffer ? +e.topOffer.lpa.toFixed(1) : null,
      topPackageCompany: e.topOffer?.company || null
    }));
};

const getPredictions = (records, hiringTrends) => {
  if (!records.length) return { year: null, companies: [], basis: null };
  const latestYear = Math.max(...records.map((r) => r.hiringYear));
  const predictYear = latestYear + 1;

  const perCompany = new Map();
  records.forEach((r) => {
    const id = String(r.companyId?._id || r.companyId);
    const e = perCompany.get(id) || { company: r.companyId, years: new Set(), hires: new Map(), lpas: [], roles: new Set() };
    e.years.add(r.hiringYear);
    if (r.studentsHired) e.hires.set(r.hiringYear, (e.hires.get(r.hiringYear) || 0) + r.studentsHired);
    const lpa = parseLpa(r.packageOffered?.ctc);
    if (lpa) e.lpas.push({ y: r.hiringYear, lpa });
    (r.roles || []).forEach((role) => e.roles.add(role));
    perCompany.set(id, e);
  });

  const companies = [...perCompany.values()]
    .map((e) => {
      const p = visitProbability(e.years, latestYear);
      const hireYears = [...e.hires.entries()].sort((a, b) => b[0] - a[0]);
      let expectedHires = null;
      if (hireYears.length) {
        let num = 0;
        let den = 0;
        hireYears.forEach(([y, h]) => { const w = Math.pow(0.5, (latestYear - y) / 2); num += w * h; den += w; });
        expectedHires = Math.max(1, Math.round(num / den));
      }
      const lpa = e.lpas.length ? e.lpas.sort((a, b) => b.y - a.y)[0].lpa : null;
      const sortedYears = [...e.years].sort((a, b) => b - a);
      const consecutive = sortedYears.filter((y, i) => y === latestYear - i).length;
      const label = p >= 0.75 ? 'Very likely' : p >= 0.5 ? 'Likely' : p >= 0.3 ? 'Possible' : 'Unlikely';
      return {
        company: e.company ? { _id: e.company._id, name: e.company.name, slug: e.company.slug, logo: e.company.logo, tier: e.company.tier } : null,
        probability: Math.round(p * 100),
        label,
        yearsVisited: sortedYears,
        consecutiveYears: consecutive,
        expectedHires,
        lastPackageLpa: lpa ? +lpa.toFixed(1) : null,
        roles: [...e.roles].slice(0, 3),
        reason: consecutive >= 2 ? `Recruited ${consecutive} years in a row through ${latestYear}` : e.years.has(latestYear) ? `Visited in ${latestYear}` : `Last visited in ${sortedYears[0]}`
      };
    })
    .filter((c) => c.company)
    .sort((a, b) => b.probability - a.probability);

  const nHires = hiringTrends.filter((t) => t.hires).slice(-3);
  const hiresTrend = nHires.length >= 2 ? Math.round(((nHires[nHires.length - 1].hires - nHires[0].hires) / Math.max(1, nHires[0].hires)) * 100) : null;

  return {
    year: predictYear,
    companies: companies.slice(0, 10),
    basis: `Recency-weighted visit history over the last 5 hiring seasons (${latestYear - 4}–${latestYear}), Bayesian-smoothed so a single visit never reads as certainty.`,
    hiresTrendPct: hiresTrend
  };
};

/**
 * Skill × year demand at a college. Value = share (0-100) of that year's reports mentioning the skill.
 */
const getSkillDemand = async (collegeId) => {
  const exps = await InterviewExperience.find({ collegeId, status: 'Published' }).select('year rounds').lean();
  const skills = await Skill.find({}).sort({ order: 1 }).select('name').lean();
  const yearTotals = {};
  const matrix = {}; // skill → year → Set(expIdx)
  const overall = {}; // skill → Set

  exps.forEach((e, idx) => {
    if (!e.year) return;
    yearTotals[e.year] = (yearTotals[e.year] || 0) + 1;
    const seen = new Set();
    (e.rounds || []).forEach((r) => {
      [...(r.topics || []), ...(r.questions || []).flatMap((q) => q.topicTags || [])].forEach((t) => {
        const m = mapTopicToSkill(t);
        if (m.tracked) seen.add(m.skillName);
      });
    });
    seen.forEach((skill) => {
      matrix[skill] = matrix[skill] || {};
      (matrix[skill][e.year] = matrix[skill][e.year] || new Set()).add(idx);
      (overall[skill] = overall[skill] || new Set()).add(idx);
    });
  });

  const years = Object.keys(yearTotals).map(Number).sort();
  const total = exps.length;
  const rows = skills.map((s) => ({
    skill: s.name,
    overallPct: total ? Math.round(((overall[s.name]?.size || 0) / total) * 100) : 0,
    byYear: years.map((y) => ({ year: y, pct: yearTotals[y] ? Math.round(((matrix[s.name]?.[y]?.size || 0) / yearTotals[y]) * 100) : 0, reports: matrix[s.name]?.[y]?.size || 0 }))
  }));
  return { years, totalReports: total, rows };
};

/**
 * Full insights payload for a college + (optionally) the signed-in student.
 */
const getCollegeInsights = async (slug, userId) => {
  const college = await College.findOne({ slug }).lean();
  if (!college) return null;

  const [records, demand] = await Promise.all([
    CollegePlacementRecord.find({ collegeId: college._id }).populate('companyId', 'name slug logo tier avgCTC').lean(),
    getSkillDemand(college._id)
  ]);

  const hiringTrends = getHiringTrends(records);
  const predictions = getPredictions(records, hiringTrends);

  // top recruiters across all years
  const recruiterMap = new Map();
  records.forEach((r) => {
    if (!r.companyId) return;
    const k = String(r.companyId._id);
    const e = recruiterMap.get(k) || { company: r.companyId, years: new Set(), hires: 0 };
    e.years.add(r.hiringYear);
    e.hires += r.studentsHired || 0;
    recruiterMap.set(k, e);
  });
  const topRecruiters = [...recruiterMap.values()]
    .map((e) => ({ company: { _id: e.company._id, name: e.company.name, slug: e.company.slug, logo: e.company.logo, tier: e.company.tier }, yearsVisited: [...e.years].sort(), visits: e.years.size, totalHires: e.hires }))
    .sort((a, b) => b.visits - a.visits || b.totalHires - a.totalHires)
    .slice(0, 12);

  let skillGap = null;
  let peers = null;
  if (userId) {
    const overview = await analytics.getSkillOverview(userId);
    peers = await analytics.getPeerComparison(userId);
    const demandBySkill = new Map(demand.rows.map((r) => [r.skill, r.overallPct]));
    const gaps = overview.skills
      .map((s) => {
        const d = demandBySkill.get(s.name) || 0;
        const gap = (d / 100) * (1 - s.masteryP);
        return {
          skill: s.name,
          demandPct: d,
          mastery: s.masteryP,
          gapScore: +gap.toFixed(3),
          severity: gap > 0.3 ? 'critical' : gap > 0.15 ? 'moderate' : 'minor',
          practiceTarget: s.predictedAttemptsToMastery ?? null,
          percentile: peers.perSkill.find((p) => p.name === s.name)?.percentile ?? null
        };
      })
      .filter((g) => g.demandPct >= 15)
      .sort((a, b) => b.gapScore - a.gapScore);

    const top = gaps.filter((g) => g.severity !== 'minor').slice(0, 2);
    skillGap = {
      items: gaps,
      headline: top.length
        ? `Companies that hire at ${college.shortName} frequently test ${top.map((g) => g.skill).join(' and ')}. ${top[0].skill} mastery is ${Math.round(top[0].mastery * 100)}%${top[0].practiceTarget ? ` — roughly ${top[0].practiceTarget} more solid attempts to master it` : ''}.`
        : demand.totalReports
          ? 'Your mastery is well aligned with what companies test at your college. Keep reviewing to stay sharp.'
          : 'Not enough reports from your college yet to compute a skill gap.'
    };
  }

  return {
    college: { _id: college._id, name: college.name, shortName: college.shortName, slug: college.slug, tier: college.tier, location: college.location, website: college.website, nirfRank: college.nirfRank, nirfYear: college.nirfYear, placementSummary: college.placementSummary || null },
    hiringTrends,
    topRecruiters,
    skillDemand: demand,
    predictions,
    skillGap,
    peers
  };
};

module.exports = { getCollegeInsights, getPredictions, getHiringTrends, visitProbability, getSkillDemand, parseLpa };
