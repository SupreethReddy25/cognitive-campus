import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { EyeOff, Plus, Trash2 } from 'lucide-react';
import { experiencesService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ShareSheet } from '../intel/ShareSheet';
import { CompanyLogo, CountUp, Skeleton, cn } from '../ui/kit';

const EASE = [0.22, 1, 0.36, 1];
const OUTCOME = { Yes: ['Offer', 'text-emerald-400'], No: ['No offer', 'text-rose-400'], Pending: ['Waiting', 'text-amber-400'] };

/** The reports you have shared — how they are doing, and the ability to take one down. */
export function MyReports() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(() => experiencesService.getMine().then((r) => setRows(r.data.data)).catch(() => setRows([])), []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    try {
      await experiencesService.deleteExperience(id);
      setRows((list) => list.filter((r) => r._id !== id));
      toast.info('Report removed');
    } catch { toast.error('Could not remove that report'); }
    setConfirm(null);
  };

  if (!rows) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  const votes = rows.reduce((n, r) => n + r.upvotes, 0);
  const questions = rows.reduce((n, r) => n + r.questions, 0);

  return (
    <div>
      {rows.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-6 border border-white/[0.09] px-7 py-8">
          <div className="max-w-xl">
            <div className="display text-[26px] leading-tight text-zinc-100">Nothing shared yet</div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-500">Interviewed somewhere? Two minutes of your notes becomes prep for everyone at your college who interviews there next.</p>
          </div>
          <button type="button" onClick={() => setSharing(true)} className="btn-line group"><Plus className="h-3.5 w-3.5" strokeWidth={1.8} />Share an interview</button>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div className="flex gap-12">
              {[['Reports', rows.length], ['Questions', questions], ['Helpful votes', votes]].map(([k, v]) => (
                <div key={k}><div className="display text-[44px] leading-none tnum text-zinc-50"><CountUp value={v} /></div><div className="tag mt-2 !text-[9.5px]">{k}</div></div>
              ))}
            </div>
            <button type="button" onClick={() => setSharing(true)} className="btn-line group"><Plus className="h-3.5 w-3.5" strokeWidth={1.8} />Share another</button>
          </div>
          <ol className="border-t border-[var(--line)]">
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const [label, tone] = OUTCOME[r.offerReceived] || OUTCOME.Pending;
                return (
                  <motion.li key={r._id} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                    <div className="row group flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--line)] px-3 py-5">
                      <Link to={`/companies/${r.company.slug}`} className="flex min-w-0 flex-1 items-center gap-4">
                        <CompanyLogo company={r.company} size={40} />
                        <span className="min-w-0">
                          <span className="display block truncate text-[24px] leading-tight text-zinc-100 transition-transform duration-300 group-hover:translate-x-1">{r.company.name}</span>
                          <span className="block truncate text-[12.5px] text-zinc-500">{r.role} · {r.month} {r.year} · {r.rounds} round{r.rounds === 1 ? '' : 's'} · {r.questions} question{r.questions === 1 ? '' : 's'}</span>
                        </span>
                      </Link>
                      <span className={cn('tag !text-[9.5px]', tone)}>{label}</span>
                      {r.isAnonymous && <span className="tag flex items-center gap-1.5 !text-[9.5px]"><EyeOff className="h-3 w-3" />Anonymous</span>}
                      <span className="tag !text-[9.5px]"><span className="tnum text-zinc-300">{r.upvotes}</span> helpful</span>
                      {r.status !== 'Published' && <span className="tag !text-[9.5px] !text-amber-400">{r.status === 'Draft' ? 'In review' : r.status}</span>}
                      {confirm === r._id ? (
                        <span className="flex items-center gap-4"><button type="button" onClick={() => remove(r._id)} className="tag !text-rose-300 transition-colors hover:!text-rose-200">Remove for good</button><button type="button" onClick={() => setConfirm(null)} className="tag transition-colors hover:!text-zinc-100">Keep</button></span>
                      ) : (
                        <button type="button" onClick={() => setConfirm(r._id)} aria-label="Remove report" className="text-zinc-700 opacity-0 transition-all hover:text-rose-400 group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-4 w-4" strokeWidth={1.6} /></button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </>
      )}
      {sharing && <ShareSheet companies={[]} onClose={() => setSharing(false)} onSuccess={load} />}
    </div>
  );
}
