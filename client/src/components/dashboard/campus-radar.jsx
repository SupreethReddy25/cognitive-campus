import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { collegesService } from '../../services/api';
import { CompanyLogo, Skeleton, cn } from '../ui/kit';

const EASE = [0.22, 1, 0.36, 1];
const SEVERITY = { critical: '#fb7185', moderate: '#fbbf24', minor: '#52525b' };
const LABEL_COLOR = { 'Very likely': '#34d399', Likely: '#6ee7b7', Possible: '#fbbf24', Unlikely: '#71717a' };

const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** A company you are likely to meet this season — the bar is the model's probability. */
function Visit({ p, i }) {
  const col = LABEL_COLOR[p.label] || '#a1a1aa';
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.07, duration: 0.7, ease: EASE }}>
      <Link to={`/companies/${p.company.slug}`} onPointerMove={spot} className="spot group relative flex items-center gap-5 border-b border-[var(--line)] px-3 py-4 transition-colors duration-300 hover:bg-white/[0.015]">
        <span className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-[var(--signal)] transition-transform duration-500 group-hover:scale-y-100" />
        <CompanyLogo company={p.company} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="display truncate text-[24px] leading-none text-zinc-100 transition-transform duration-300 group-hover:translate-x-1">{p.company.name}</span>
            <span className="tag !text-[9.5px]" style={{ color: col }}>{p.label}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-[3px] flex-1 overflow-hidden bg-white/[0.07]">
              <motion.div className="h-full" style={{ background: col }} initial={{ width: 0 }} whileInView={{ width: `${p.probability}%` }} viewport={{ once: true }} transition={{ duration: 1.3, delay: 0.2 + i * 0.07, ease: EASE }} />
            </div>
            <span className="tnum w-9 text-right text-[13px] text-zinc-300">{p.probability}%</span>
          </div>
          <div className="mt-1.5 truncate text-[12.5px] text-zinc-600">{p.reason}{p.lastPackageLpa ? ` · last offer ${p.lastPackageLpa} LPA` : ''}</div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 -translate-x-1 text-zinc-700 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-[var(--signal)] group-hover:opacity-100" />
      </Link>
    </motion.li>
  );
}

/** How far your mastery sits from what those companies test — the marker is demand, the fill is you. */
function Gap({ g, i }) {
  const col = SEVERITY[g.severity] || '#52525b';
  return (
    <motion.li initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.08, duration: 0.7, ease: EASE }}>
      <Link to={`/problems?skill=${encodeURIComponent(g.skill)}`} onPointerMove={spot} className="spot group relative block border-b border-[var(--line)] px-3 py-4 transition-colors duration-300 hover:bg-white/[0.015]">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[16px] text-zinc-100 transition-transform duration-300 group-hover:translate-x-1">{g.skill}</span>
          <span className="tag !text-[9.5px]" style={{ color: col }}>{g.severity === 'minor' ? 'On track' : g.severity}</span>
        </div>
        <div className="relative mt-3 h-[3px] bg-white/[0.07]">
          <motion.div className="absolute inset-y-0 left-0" style={{ background: col === '#52525b' ? '#34d399' : col }} initial={{ width: 0 }} whileInView={{ width: `${Math.max(1, g.mastery * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.3, delay: 0.2 + i * 0.08, ease: EASE }} />
          <motion.span className="absolute -top-[5px] h-[13px] w-px bg-white/70" initial={{ left: 0, opacity: 0 }} whileInView={{ left: `${g.demandPct}%`, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.3, delay: 0.3 + i * 0.08, ease: EASE }} />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[12.5px] text-zinc-600">
          <span>You <span className="tnum text-zinc-400">{Math.round(g.mastery * 100)}%</span> · tested in <span className="tnum text-zinc-400">{g.demandPct}%</span> of reports</span>
          {g.severity !== 'minor' && <span className="flex items-center gap-1 text-zinc-500 transition-colors group-hover:text-zinc-200">~{g.practiceTarget} solves<ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" /></span>}
        </div>
      </Link>
    </motion.li>
  );
}

/**
 * Campus radar — the dashboard's interview-first section: which companies are likely to visit your college this season,
 * and where your skills fall short of what they test. Everything here comes from your college's own placement history.
 */
export function CampusRadar({ college }) {
  const slug = college?.slug;
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!slug) return undefined;
    let alive = true;
    collegesService.getCollegeInsights(slug).then((r) => { if (alive) setData(r.data.data); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [slug]);

  if (!slug) {
    return (
      <section className="mt-20 md:mt-28">
        <div className="border border-[var(--line-strong)] p-10 md:p-14">
          <div className="tag">Campus intelligence</div>
          <h2 className="display mt-5 max-w-3xl text-[clamp(30px,4vw,54px)] text-zinc-50">Which companies visit <em>your</em> campus, and what do they ask?</h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-500">Choose your college and this space fills with the season’s likely visitors, past packages, and the exact skills you need to close the gap on.</p>
          <Link to="/profile" className="btn-line group mt-8">Choose your college<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></Link>
        </div>
      </section>
    );
  }
  if (failed) return null;

  const pred = data?.predictions;
  const gaps = (data?.skillGap?.items || []).filter((g) => g.severity !== 'minor').slice(0, 4);
  const shownGaps = gaps.length ? gaps : (data?.skillGap?.items || []).slice(0, 3);
  const pct = data?.peers?.overallPercentile;

  return (
    <section className="mt-20 md:mt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="tag flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />{college.shortName || college.name}{data?.college?.nirfRank ? ` · NIRF #${data.college.nirfRank}` : ''}</div>
          <h2 className="display mt-4 text-[clamp(32px,4.4vw,60px)] text-zinc-50">The {pred?.year || ''} <em>season</em></h2>
        </div>
        <div className="flex items-end gap-8">
          {pct != null && <div className="text-right"><div className="display text-[44px] leading-none tnum text-zinc-50">{pct}<span className="text-[20px] text-zinc-500">th</span></div><div className="tag mt-1.5 !text-[9.5px]">percentile at {college.shortName || 'your college'}</div></div>}
          <Link to="/intel" className="btn-line group hidden sm:inline-flex">All interviews<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></Link>
        </div>
      </div>

      {!data ? (
        <div className="grid gap-16 lg:grid-cols-2"><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px]" />)}</div><div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px]" />)}</div></div>
      ) : (
        <>
          {data.skillGap?.headline && <p className="mb-10 max-w-3xl text-[19px] leading-[1.55] text-zinc-400 md:text-[22px]">{data.skillGap.headline}</p>}
          <div className="grid gap-x-20 gap-y-14 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="mb-2 flex items-baseline justify-between"><h3 className="tag !text-zinc-400">Likely to visit</h3><span className="tag !text-[9px] !tracking-[0.14em] !text-zinc-700">{pred?.hiresTrendPct != null ? `hiring ${pred.hiresTrendPct >= 0 ? '+' : ''}${pred.hiresTrendPct}% vs last season` : ''}</span></div>
              <ol className="border-t border-[var(--line)]">{(pred?.companies || []).slice(0, 5).map((p, i) => <Visit key={p.company._id} p={p} i={i} />)}</ol>
              {pred?.basis && <p className="mt-4 text-[12px] leading-relaxed text-zinc-700">{pred.basis}</p>}
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between"><h3 className="tag !text-zinc-400">Where to close the gap</h3><span className="tag !text-[9px] !tracking-[0.14em] !text-zinc-700"><span className="mr-1.5 inline-block h-2.5 w-px translate-y-[1px] bg-white/70" />demand</span></div>
              <ol className="border-t border-[var(--line)]">{shownGaps.map((g, i) => <Gap key={g.skill} g={g} i={i} />)}</ol>
              <Link to="/problems" className={cn('group mt-6 inline-flex items-center gap-2 text-[13.5px] text-zinc-400 transition-colors hover:text-[var(--signal)]')}>Practise what they test<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
