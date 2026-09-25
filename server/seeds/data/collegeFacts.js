/**
 * Real, sourced facts about the seeded colleges.
 *
 * - `nirfRank` is the NIRF 2025 *Engineering* rank, read directly from
 *   https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html (null = outside the published top 100).
 * - `placementSummary` figures were collected in Sept 2026 from institute reports as republished by the named
 *   source (Careers360 / Business Standard / the institute's own report). Only numbers a source stated explicitly
 *   are included; anything a source did not state is left out rather than estimated.
 *   Figures are per the named season, mostly for the 4-year UG (B.Tech / B.E.) programme, and are a starting
 *   point — always check the institute's own placement report before quoting them.
 *
 * All package figures are in LPA (lakh rupees per annum).
 */

const CAREERS360 = 'Careers360 (citing institute / NIRF data)';

const src = (name, url) => ({ name, url });

module.exports = {
  'iit-madras': {
    website: 'https://www.iitm.ac.in', nirfRank: 1,
    placementSummary: { season: '2024-25', scope: 'UG 4-year', placed: 631, placedPct: 99.5, medianLpa: 17.78, note: '2023-24 (all programmes): 1,091 students placed by 256 companies, average package ₹22 LPA.', source: src(CAREERS360, 'https://www.careers360.com/university/indian-institute-of-technology-madras/placement') }
  },
  'iit-delhi': {
    website: 'https://home.iitd.ac.in', nirfRank: 2,
    placementSummary: { season: '2024-25', scope: 'All programmes', placed: 1140, offers: 1275, medianLpa: 20.0, note: 'Median shown is for UG 4-year. 300 pre-placement offers and 35 international offers.', source: src(CAREERS360, 'https://www.careers360.com/university/indian-institute-of-technology-delhi/placement') }
  },
  'iit-bombay': {
    website: 'https://www.iitb.ac.in', nirfRank: 3,
    placementSummary: { season: '2023-24', scope: 'All programmes', placed: 1475, companies: 388, avgLpa: 23.5, note: '364 companies made offers; 22 students received offers above ₹1 crore; 78 international offers accepted.', source: src('Business Standard / India.com (IIT Bombay placement report)', 'https://www.india.com/education/iit-bombay-placements-2023-24-report-22-students-secures-rs-1-crore-plus-offer-average-package-of-rs-23-5-lakh-per-annum-7215092/') }
  },
  'nit-trichy': {
    website: 'https://www.nitt.edu', nirfRank: 9,
    placementSummary: { season: '2023-24', scope: 'B.Tech', placedPct: 88.9, highestLpa: 52.89, note: 'CSE: 96.9% placed, average ₹27.27 LPA. 220+ companies visit every year.', source: src('iQuanta (citing NIT Trichy data)', 'https://www.iquanta.in/blog/nit-trichy-placement-2024/') }
  },
  'bits-pilani': {
    website: 'https://www.bits-pilani.ac.in', nirfRank: 11,
    placementSummary: { season: '2024-25', scope: 'Pilani campus, all programmes', placed: 2490, avgLpa: 22.28, medianLpa: 19.05, companies: 615, note: 'B.Tech: 2,324 placed, median ₹20 LPA.', source: src(CAREERS360, 'https://www.careers360.com/university/birla-institute-of-technology-and-science-pilani/placement') }
  },
  srm: {
    website: 'https://www.srmist.edu.in', nirfRank: 14,
    placementSummary: { season: '2024-25', scope: 'UG 4-year', placed: 7702, medianLpa: 6.8, note: 'NIRF-reported. 2023-24: 7,302 placed, median ₹6.2 LPA.', source: src(CAREERS360 + ', NIRF', 'https://www.careers360.com/university/srm-institute-of-science-and-technology-chennai/placement') }
  },
  'vit-vellore': {
    website: 'https://vit.ac.in', nirfRank: 16,
    placementSummary: { season: '2023-24', scope: 'UG 4-year', placed: 4031, placedPct: 85.6, medianLpa: 8.99, note: 'NIRF-reported. 2024-25: 7,023 placed, median ₹6 LPA.', source: src(CAREERS360 + ', NIRF', 'https://www.careers360.com/university/vellore-institute-of-technology-vellore/placement') }
  },
  'nit-surathkal': {
    website: 'https://www.nitk.ac.in', nirfRank: 17,
    placementSummary: { season: '2024-25', scope: 'B.Tech', placed: 783, placedPct: 80.6, avgLpa: 17.48, medianLpa: 14, highestLpa: 63.3, source: src(CAREERS360, 'https://www.careers360.com/university/national-institute-of-technology-karnataka-surathkal/placement') }
  },
  'nit-calicut': {
    website: 'https://nitc.ac.in', nirfRank: 21,
    placementSummary: { season: '2024-25', scope: 'B.Tech', placed: 803, placedPct: 81, avgLpa: 12.4, medianLpa: 12.15, highestLpa: 43.24, companies: 200, source: src(CAREERS360, 'https://www.careers360.com/university/national-institute-of-technology-calicut/placement') }
  },
  amrita: {
    website: 'https://www.amrita.edu', nirfRank: 23,
    placementSummary: { season: '2024', scope: 'B.Tech', placedPct: 98, avgLpa: 9.2, medianLpa: 7.75, highestLpa: 56, note: 'Reported by education portals from institute figures; treat as indicative.', source: src('Careers360 / Shiksha (institute figures)', 'https://www.careers360.com/university/amrita-vishwa-vidyapeetham-coimbatore/placement') }
  },
  'nit-warangal': {
    website: 'https://www.nitw.ac.in', nirfRank: 28,
    placementSummary: { season: '2024-25', scope: 'B.Tech', placed: 697, placedPct: 81.4, avgLpa: 14.35, medianLpa: 12, highestLpa: 64.3, note: 'CSE: 94.9% placed, average ₹22.63 LPA.', source: src(CAREERS360, 'https://www.careers360.com/university/national-institute-of-technology-warangal/placement') }
  },
  thapar: {
    website: 'https://www.thapar.edu', nirfRank: 29,
    placementSummary: { season: '2024', scope: 'B.E.', placedPct: 86.2, avgLpa: 11.38, medianLpa: 10, highestLpa: 123, offers: 1690, companies: 510, note: 'Reported by education portals from institute figures; treat as indicative.', source: src('Shiksha / Collegedunia (institute figures)', 'https://www.thapar.edu/placements') }
  },
  'dtu-delhi': {
    website: 'https://dtu.ac.in', nirfRank: 30,
    placementSummary: { season: '2024', scope: 'B.Tech', placed: 1821, offers: 1990, avgLpa: 18.46, medianLpa: 13.25, highestLpa: 85.3, note: 'Placed / offers cover B.Tech, M.Tech and MBA together.', source: src('Careers360 / Collegedunia (institute figures)', 'https://www.careers360.com/university/delhi-technological-university-delhi/placement') }
  },
  'iiit-hyderabad': {
    website: 'https://www.iiit.ac.in', nirfRank: 38,
    placementSummary: { season: '2024-25', scope: 'B.Tech', placed: 148, medianLpa: 34.4, note: 'NIRF-reported. 2025-26 batch (B.Tech + M.Tech): 94.4% placed, average ₹30.75 LPA, highest ₹94 LPA.', source: src(CAREERS360 + ', NIRF', 'https://www.careers360.com/university/international-institute-of-information-technology-hyderabad/placement') }
  },
  'mit-manipal': {
    website: 'https://manipal.edu/mit.html', nirfRank: 59,
    placementSummary: { season: '2023-24', scope: 'UG 4-year', placed: 1140, avgLpa: 10.49, medianLpa: 8.5, highestLpa: 51.03, note: 'Placed and median are NIRF-reported; average and highest are portal-reported for 2024.', source: src('Shiksha / Collegedunia, NIRF', 'https://www.shiksha.com/college/manipal-institute-of-technology-mahe-3225/placement') }
  },
  'psg-tech': {
    website: 'https://www.psgtech.edu', nirfRank: 67,
    placementSummary: { season: '2024', scope: 'All programmes', placed: 1485, avgLpa: 8.81, medianLpa: 7.2, highestLpa: 56.06, companies: 460, source: src('Shiksha / Collegedunia (institute figures)', 'https://www.shiksha.com/college/psgct-coimbatore-19398/placement') }
  },
  'nsut-delhi': {
    website: 'https://www.nsut.ac.in', nirfRank: 70,
    placementSummary: { season: '2024', scope: 'B.Tech', placed: 1362, placedPct: 78.9, avgLpa: 17.75, medianLpa: 16.5, highestLpa: 100, companies: 320, note: '1,362 of 1,725 eligible B.Tech students placed; 80+ first-time recruiters.', source: src('Collegedunia / Shiksha (institute figures)', 'https://collegedunia.com/university/14479-netaji-subhas-university-of-technology-nsut-new-delhi/placement') }
  },
  'coep-pune': {
    website: 'https://www.coeptech.ac.in', nirfRank: 90,
    placementSummary: { season: '2024-25', scope: 'B.Tech', placed: 587, placedPct: 79.2, avgLpa: 11.49, medianLpa: 10.78, highestLpa: 52.57, companies: 240, note: 'Highest package and 560+ offers are from COEP\'s own 2024-25 placement report.', source: src('COEP placement report 2024-25', 'https://www.coeptech.ac.in/wp-content/uploads/2025/08/placement-report-2024-25.pdf') }
  },
  'pes-university': {
    website: 'https://pes.edu', nirfRank: null,
    placementSummary: { season: '2024', scope: 'B.Tech', placed: 1391, avgLpa: 17.99, medianLpa: 12.47, highestLpa: 65, note: 'Reported by education portals from institute figures; treat as indicative.', source: src('Collegedunia / Shiksha (institute figures)', 'https://collegedunia.com/university/28294-pes-university-pesu-bangalore/placement') }
  }
  // vit-chennai: no separate published figures found (NIRF reports VIT as one institute), so none are stored.
};

module.exports.NIRF_YEAR = 2025;
