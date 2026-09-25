import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../ui/kit';

const PRIORITY = {
  high: { label: 'High priority', tone: 'text-rose-400' },
  medium: { label: 'Worth a review', tone: 'text-amber-400' },
  low: { label: 'Already strong', tone: 'text-emerald-400' }
};

/**
 * PrepPriorities — BKT mastery × what this company asked at this college.
 * `prepPriorities` is the object from getCollegeCompanyIntel.
 */
export function PrepPriorities({ prepPriorities, companyName, collegeName }) {
  if (!prepPriorities) return null;
  const { tracked = [], untracked = [], summary } = prepPriorities;
  const hasData = tracked.length > 0 || untracked.length > 0;

  return (
    <div>
      <p className="max-w-2xl text-[16px] leading-relaxed text-zinc-400">{summary || `Topics reported for ${companyName} at ${collegeName}, ranked by how often they appear and how well you know them.`}</p>
      {!hasData && <p className="mt-6 text-[15px] text-zinc-600">Not enough data yet to generate preparation priorities.</p>}

      <div className="mt-6">
        {tracked.map((item, i) => {
          const cfg = PRIORITY[item.priority] || PRIORITY.medium;
          const m = item.mastery !== null && item.mastery !== undefined ? Math.round(item.mastery * 100) : null;
          return (
            <motion.div key={item.skillName} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.04, 0.3) }} className="grid items-center gap-x-10 gap-y-2 border-b border-[var(--line)] py-6 md:grid-cols-[1.1fr_1fr_auto]">
              <div>
                <div className="display text-[34px] leading-none text-zinc-100">{item.skillName}</div>
                <div className="mt-2 text-[12.5px] text-zinc-500"><span className={cn('font-medium', cfg.tone)}>{cfg.label}</span>{item.relatedTopics?.length > 0 && <> · via {item.relatedTopics.slice(0, 3).join(', ')}</>} · {item.frequencyLabel}</div>
              </div>
              <div>
                {m !== null ? (
                  <><div className="mb-1 flex justify-between text-[12px] text-zinc-500"><span>your mastery</span><span className="tnum text-zinc-300">{m}%</span></div><div className="h-[3px] rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[var(--star)]" style={{ width: `${m}%` }} /></div></>
                ) : <span className="text-[13px] text-zinc-600">no practice data yet</span>}
                <p className="mt-2 text-[12.5px] italic leading-snug text-zinc-600">{item.recommendation}</p>
              </div>
              <Link to={`/problems?skill=${encodeURIComponent(item.skillName)}`} className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-5 py-2 text-[13.5px] text-zinc-300 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]">Practise <ArrowUpRight className="h-4 w-4" /></Link>
            </motion.div>
          );
        })}
      </div>

      {untracked.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 text-[13px] text-zinc-500">Self-study topics (not tracked by the model)</div>
          <div className="flex flex-wrap gap-2">{untracked.map((item) => <span key={item.topic} title={item.frequencyLabel} className="rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-[14px] text-zinc-300">{item.topic}</span>)}</div>
        </div>
      )}
    </div>
  );
}
