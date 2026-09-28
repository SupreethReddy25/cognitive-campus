import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { experiencesService } from '../../services/api';
import { CompanyLogo, Skeleton, cn } from '../ui/kit';

const EASE = [0.22, 1, 0.36, 1];

const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

/** One reported question. Expands on hover; leads straight to practice when we know which problem it is. */
function Question({ q, i }) {
  const practise = q.problem
    ? { to: `/problems/${q.problem._id}`, label: `Practise ${q.problem.title}` }
    : q.topicTags?.[0] ? { to: `/problems?skill=${encodeURIComponent(q.topicTags[0])}`, label: `Practise ${q.topicTags[0]}` } : null;
  return (
    <motion.li initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ delay: i * 0.06, duration: 0.7, ease: EASE }}>
      <div onPointerMove={spot} className="spot group relative border-b border-[var(--line)] px-3 py-5 transition-colors duration-300 hover:bg-white/[0.015]">
        <span className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-[var(--signal)] transition-transform duration-500 group-hover:scale-y-100" />
        <div className="flex items-start gap-4">
          <Link to={`/companies/${q.company.slug}`} className="mt-0.5 shrink-0" aria-label={q.company.name}><CompanyLogo company={q.company} size={30} /></Link>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[15.5px] leading-relaxed text-zinc-200 transition-colors duration-300 group-hover:line-clamp-none group-hover:text-zinc-50">{q.text}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="tag !text-[9.5px]">{q.company.name}{q.roundType ? ` · ${q.roundType}` : ''}{q.when ? ` · ${q.when}` : ''}</span>
              {(q.topicTags || []).slice(0, 3).map((t) => <span key={t} className="border border-white/[0.09] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">{t}</span>)}
            </div>
            {practise && (
              <Link to={practise.to} className="mt-3 hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--signal)] group-hover:inline-flex">
                {practise.label}<ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}

/** What is being asked across every company right now — the topics that keep coming up, and the newest questions. */
export function Pulse() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    let alive = true;
    experiencesService.getPulse().then((r) => { if (alive) setData(r.data.data); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);
  if (failed) return null;

  const topics = (data?.topics || []).slice(0, 8);
  const max = Math.max(1, ...topics.map((t) => t.count));
  const questions = data?.questions || [];

  return (
    <section className="mt-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="tag flex items-center gap-3"><span className="pdot h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />The pulse</div>
          <h2 className="display mt-4 text-[clamp(32px,4.4vw,60px)] text-zinc-50">What they’re asking <em>right now</em></h2>
        </div>
        {data && (
          <div className="tag text-right !leading-[1.9]">
            <span className="text-zinc-200">{data.totals.questions}</span> questions · <span className="text-zinc-200">{data.totals.reports}</span> reports
            {data.totals.thisMonth > 0 && <><br /><span className="text-[var(--signal)]">{data.totals.thisMonth}</span> added this month</>}
          </div>
        )}
      </div>

      <div className="grid gap-x-20 gap-y-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]">
        <div>
          <div className="tag mb-4 !text-zinc-400">Topics by how often they come up</div>
          {!data ? <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : (
            <ol className="border-t border-[var(--line)]">
              {topics.map((t, i) => {
                const to = t.skill?.tracked ? `/problems?skill=${encodeURIComponent(t.skill.skillName)}` : null;
                const Row = to ? Link : 'div';
                return (
                  <li key={t.topic}>
                    <Row {...(to ? { to } : {})} onPointerMove={spot} className={cn('spot group relative block border-b border-[var(--line)] px-2 py-3.5 transition-colors duration-300', to && 'hover:bg-white/[0.015]')}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[16px] text-zinc-100 transition-transform duration-300 group-hover:translate-x-1">{t.topic}</span>
                        <span className="tag !text-[9.5px]"><span className="tnum text-zinc-300">{t.count}</span> mentions · {t.companies} compan{t.companies === 1 ? 'y' : 'ies'}</span>
                      </div>
                      <div className="mt-2.5 h-[3px] bg-white/[0.06]">
                        <motion.div className="h-full bg-[var(--signal)]" style={{ opacity: 0.35 + 0.65 * (t.count / max) }} initial={{ width: 0 }} whileInView={{ width: `${(t.count / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.1 + i * 0.06, ease: EASE }} />
                      </div>
                    </Row>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div>
          <div className="tag mb-2 !text-zinc-400">Just reported</div>
          {!data ? <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div> : (
            <>
              <ol className="border-t border-[var(--line)]">
                <AnimatePresence initial={false}>
                  {questions.slice(0, more ? 12 : 5).map((q, i) => <Question key={`${q.company.slug}-${q.text.slice(0, 24)}-${i}`} q={q} i={i} />)}
                </AnimatePresence>
              </ol>
              {questions.length > 5 && <button type="button" onClick={() => setMore((m) => !m)} className="tag mt-5 transition-colors hover:!text-zinc-100">{more ? 'Show fewer' : `Show ${Math.min(12, questions.length) - 5} more`}</button>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
