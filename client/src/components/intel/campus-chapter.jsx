import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { collegesService } from '../../services/api';
import { Skeleton, cn } from '../ui/kit';

const EASE = [0.22, 1, 0.36, 1];
const PRIORITY = { high: ['#fb7185', 'Focus here'], medium: ['#fbbf24', 'Worth a pass'], low: ['#52525b', 'Light review'] };
const ctcNum = (r) => parseFloat(String(r?.packageOffered?.ctc || '').replace(/[^0-9.]/g, '')) || 0;

/**
 * "Google at your campus" — the college-scoped layer of a company dossier: which seasons they came, how many they hired,
 * what they paid, how the process ran, and which skills to prepare given where you stand.
 */
export function CampusChapter({ college, companySlug, companyName }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    collegesService.getCollegeCompanyIntel(college.slug, companySlug)
      .then((r) => { if (alive) { setData(r.data.data); setState('ok'); } })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [college.slug, companySlug]);

  if (state === 'loading') return <div className="grid gap-16 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  if (state === 'error' || !data) return <p className="text-[15px] text-zinc-500">Couldn’t load {college.shortName} data for {companyName}.</p>;

  const records = [...(data.placementRecords || [])].sort((a, b) => a.hiringYear - b.hiringYear);
  const latest = records[records.length - 1];
  const maxHired = Math.max(1, ...records.map((r) => r.studentsHired || 0));
  const modelled = records.some((r) => r.source === 'modelled');
  const priorities = (data.prepPriorities?.tracked || []).filter((p) => p.hasSkillState).slice(0, 4);

  if (!records.length) {
    return <p className="max-w-xl text-[16px] leading-relaxed text-zinc-500">{companyName} has no recorded visit to {college.shortName} yet. If they came, your placement cell can add it from the admin panel — or share your interview and it starts the record.</p>;
  }

  return (
    <div className="grid gap-x-20 gap-y-16 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="tag mb-8">Visits &amp; hires, by season</div>
        <div className="flex h-[220px] items-end gap-3 border-b border-[var(--line-strong)]">
          {records.map((r, i) => {
            const h = ((r.studentsHired || 0) / maxHired) * 100;
            return (
              <div key={r._id} className="group relative flex h-full flex-1 flex-col justify-end">
                <motion.div initial={{ height: 0 }} whileInView={{ height: `${Math.max(6, h)}%` }} viewport={{ once: true }} transition={{ duration: 1.1, delay: i * 0.1, ease: EASE }}
                  className={cn('relative w-full transition-colors duration-300', r.source === 'modelled' ? 'border border-dashed border-[var(--signal)]/60 bg-[var(--signal)]/[0.07] group-hover:bg-[var(--signal)]/[0.16]' : 'bg-[var(--signal)]/70 group-hover:bg-[var(--signal)]')}>
                  <span className="display absolute -top-9 left-0 text-[26px] leading-none tnum text-zinc-100">{r.studentsHired}</span>
                </motion.div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-3">
          {records.map((r) => (
            <div key={r._id} className="flex-1">
              <div className="tag !text-zinc-300">{r.hiringYear}</div>
              <div className="mt-1 text-[12.5px] text-zinc-500">{r.packageOffered?.ctc || '—'}</div>
            </div>
          ))}
        </div>
        {modelled && <p className="mt-6 text-[12.5px] leading-relaxed text-zinc-600">Dashed bars are modelled estimates from typical recruiter patterns, not placement-cell figures. Your admin can replace them with verified numbers.</p>}

        {latest && (
          <div className="mt-12 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {[['Roles', (latest.roles || []).join(', ') || '—'], ['Minimum CGPA', latest.eligibility?.minCGPA || '—'], ['Branches', (latest.eligibility?.branches || []).join(' · ') || '—']].map(([k, v]) => (
              <div key={k} className="bg-[#0a0a0a] p-5"><div className="tag !text-[9.5px]">{k}</div><div className="mt-2 text-[14.5px] leading-snug text-zinc-200">{v}</div></div>
            ))}
          </div>
        )}
        {latest?.assessmentStages?.length > 0 && (
          <ol className="relative mt-10 flex items-start">
            <span className="absolute left-3 right-3 top-[7px] h-px bg-[var(--line-strong)]" />
            {latest.assessmentStages.map((s, i) => (
              <li key={s} className="relative flex flex-1 flex-col items-center gap-2 text-center">
                <span className="relative h-[15px] w-[15px] rounded-full border border-[var(--signal)] bg-[#0a0a0a]"><span className="absolute inset-[3px] rounded-full bg-[var(--signal)]" style={{ opacity: 0.3 + (i / Math.max(1, latest.assessmentStages.length - 1)) * 0.7 }} /></span>
                <span className="max-w-[110px] text-[12px] leading-tight text-zinc-500">{s}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <div className="tag mb-3">What to prepare — for you, for {companyName}</div>
        {priorities.length ? (
          <ol className="border-t border-[var(--line)]">
            {priorities.map((p, i) => {
              const [col, word] = PRIORITY[p.priority] || PRIORITY.low;
              return (
                <motion.li key={p.skillName} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.7, ease: EASE }}>
                  <Link to={`/problems?skill=${encodeURIComponent(p.skillName)}`} className="group block border-b border-[var(--line)] px-1 py-5 transition-colors hover:bg-white/[0.015]">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="display text-[24px] leading-none text-zinc-100 transition-transform duration-300 group-hover:translate-x-1">{p.skillName}</span>
                      <span className="tag !text-[9.5px]" style={{ color: col }}>{word}</span>
                    </div>
                    <div className="mt-3 h-[3px] bg-white/[0.07]"><motion.div className="h-full" style={{ background: p.mastery >= 0.6 ? '#34d399' : col }} initial={{ width: 0 }} whileInView={{ width: `${Math.max(1, p.mastery * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2 + i * 0.08, ease: EASE }} /></div>
                    <div className="mt-2.5 flex items-center justify-between gap-4 text-[12.5px] text-zinc-600">
                      <span>{p.masteryLabel} · {p.frequencyLabel}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[var(--signal)] group-hover:opacity-100" />
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ol>
        ) : <p className="text-[15px] leading-relaxed text-zinc-500">Solve a few problems and this fills with a ranked list of what {companyName} tests that you should practise first.</p>}
        {data.dataConfidence && <p className="mt-5 text-[12.5px] text-zinc-600">Campus data confidence: <span className="text-zinc-400">{data.dataConfidence}</span> · {data.stats?.totalReports ?? 0} report{data.stats?.totalReports === 1 ? '' : 's'} from {college.shortName}.</p>}
      </div>
    </div>
  );
}
