import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, ComposedChart, Bar as RBar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Check, X, Loader2, Search, RefreshCw, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService, companiesService, collegesService, analyticsService } from '../services/api';
import { Page, CompanyLogo, CountUp, chartTooltipStyle, cn } from '../components/ui/kit';

const TABS = [['overview', 'Overview'], ['curriculum', 'Curriculum'], ['students', 'Students'], ['experiences', 'Experiences'], ['problems', 'Problems'], ['add', 'Add data']];
const inputCls = 'w-full border-b border-[var(--line-strong)] bg-transparent px-0.5 py-2 text-[15px] text-zinc-100 outline-none transition-colors focus:border-[var(--ember)] placeholder:text-zinc-700';
const chip = (on) => cn('flex shrink-0 items-center gap-1.5 rounded-sm border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', on ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200');
const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };
const ago = (iso) => { if (!iso) return '—'; const d = Math.floor((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`; };

const Spinner = () => <div className="flex items-center justify-center gap-3 py-20 text-zinc-600"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-[14px]">Loading…</span></div>;
const Empty = ({ title, text }) => <div className="py-20 text-center"><div className="display text-[27.2px] italic text-zinc-500">{title}</div>{text && <p className="mt-2 text-[14px] text-zinc-600">{text}</p>}</div>;
const Field = ({ label, children }) => <div className="space-y-1"><label className="text-[12.5px] text-zinc-500">{label}</label>{children}</div>;
function Sec({ title, kicker, action, children, className = '' }) {
  return (
    <section className={cn('pt-16', className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line-strong)] pb-4">
        <div><h2 className="display text-[clamp(24px,3.1vw,37px)] text-zinc-50">{title}</h2>{kicker && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-zinc-500">{kicker}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
const Figure = ({ value, label, sub, big = true }) => (
  <div className="border-t border-[var(--line-strong)] pt-4"><div className={cn('display leading-none tnum text-zinc-50', big ? 'text-[68px]' : 'text-[44px]')}>{value}</div><div className="tag mt-3">{label}</div>{sub && <div className="text-[12px] text-zinc-600">{sub}</div>}</div>
);
const Act = ({ tone = 'zinc', busy, children, ...p }) => (
  <button {...p} className={cn('flex items-center gap-1.5 rounded-sm border px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors disabled:opacity-40', tone === 'good' ? 'border-emerald-400/35 text-emerald-300 hover:bg-emerald-400/10' : tone === 'bad' ? 'border-rose-400/35 text-rose-300 hover:bg-rose-400/10' : tone === 'warn' ? 'border-amber-400/35 text-amber-300 hover:bg-amber-400/10' : 'border-[var(--line-strong)] text-zinc-300 hover:border-[var(--ember)] hover:text-[var(--ember)]')}>
    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}{children}
  </button>
);
const SearchLine = ({ value, onChange, placeholder }) => (
  <div className="flex min-w-[220px] flex-1 items-center gap-3 border-b border-[var(--line-strong)] pb-1.5 focus-within:border-[var(--ember)]"><Search className="h-4 w-4 text-zinc-600" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-700" /></div>
);

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ onGoto }) {
  const [s, setS] = useState(null);
  useEffect(() => { adminService.getStats().then((r) => setS(r.data.data)).catch(() => {}); }, []);
  if (!s) return <Spinner />;
  const problemsPending = s.moderation.waitlistedProblems + s.moderation.quarantinedProblems;
  const pending = s.moderation.pendingExperiences + problemsPending;
  const buckets = s.xpDistribution.map((b) => ({ name: typeof b.bucket === 'number' ? ['0–50', '50–200', '200–500', '500–1k', '1k+'][[0, 50, 200, 500, 1000].indexOf(b.bucket)] || b.bucket : b.bucket, n: b.students }));
  const maxB = Math.max(1, ...buckets.map((b) => b.n));
  return (
    <div>
      {pending > 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-l-2 border-[var(--ember)] py-1 pl-5">
          <p className="text-[16px] text-zinc-300">{s.moderation.pendingExperiences} experience{s.moderation.pendingExperiences !== 1 ? 's' : ''} and {problemsPending} problem{problemsPending !== 1 ? 's' : ''} are waiting for review.</p>
          <div className="flex gap-2"><Act onClick={() => onGoto('experiences')}>Review experiences</Act><Act onClick={() => onGoto('problems')}>Review problems</Act></div>
        </div>
      )}
      <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-10 lg:grid-cols-4">
        <Figure value={<CountUp value={s.totalStudents} />} label="students" sub={`${s.totalAdmins} admin${s.totalAdmins !== 1 ? 's' : ''}`} />
        <Figure value={<CountUp value={s.totalSubmissions} />} label="submissions" sub={`${s.passRate}% pass rate`} />
        <Figure value={<CountUp value={s.active.week} />} label="active this week" sub={`${s.active.day} today · ${s.active.month} in 30 days`} />
        <Figure value={<CountUp value={s.averageXP} />} label="average XP per student" sub={`${s.totalXP.toLocaleString()} XP overall`} />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-8 lg:grid-cols-4">
        <Figure big={false} value={s.content.problems.approved || 0} label="live problems" sub={`${s.content.problems.total} total · ${s.totalProblemsAttempted} attempted`} />
        <Figure big={false} value={s.content.companies} label="companies" sub={`${s.content.colleges} colleges`} />
        <Figure big={false} value={s.content.experiences.total} label="experiences" sub={`${s.content.experiences.Published || 0} published`} />
        <Figure big={false} value={s.content.placementRecords} label="placement records" sub="across all colleges" />
      </div>

      <div className="grid gap-16 lg:grid-cols-[1.6fr_1fr]">
        <Sec title={<>The last <em>fortnight</em></>} kicker="Submissions per day (bars), correct submissions and active students (lines).">
          <div className="h-72"><ResponsiveContainer><ComposedChart data={s.submissionsPerDay.map((d) => ({ ...d, label: d.date.slice(5) }))} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(236,230,216,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#7a7466', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#5b564b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...chartTooltipStyle} />
            <RBar dataKey="submissions" name="Submissions" fill="#fbbf24" fillOpacity={0.28} radius={[6, 6, 0, 0]} barSize={20} />
            <Line dataKey="correct" name="Correct" stroke="#34d399" strokeWidth={2.2} dot={false} />
            <Line dataKey="activeUsers" name="Active students" stroke="#38bdf8" strokeWidth={2} dot={false} />
          </ComposedChart></ResponsiveContainer></div>
        </Sec>
        <Sec title={<>Most <em>attempted</em></>}>
          {s.topProblems.map((p, i) => (
            <div key={p._id} className="relative border-b border-[var(--line)] py-3.5">
              <div className="flex items-baseline justify-between gap-3"><span className="flex min-w-0 items-baseline gap-3"><span className="w-5 text-[13px] tnum text-zinc-700">{i + 1}</span><span className="truncate text-[16px] text-zinc-200">{p.title}</span><span className={cn('h-1.5 w-1.5 shrink-0 self-center rounded-full', DOT[String(p.difficulty).toLowerCase()])} /></span><span className="text-[12.5px] tnum text-zinc-500">{p.solved}/{p.attempts}</span></div>
              <div className="mt-2 h-[2px] rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[var(--ember)]" style={{ width: `${p.attempts ? (p.solved / p.attempts) * 100 : 0}%` }} /></div>
            </div>
          ))}
          <div className="tag mt-8">Students by XP</div>
          <div className="mt-3 flex h-20 items-end gap-3">{buckets.map((b) => <div key={b.name} className="flex flex-1 flex-col items-center gap-1.5"><span className="text-[11px] tnum text-zinc-500">{b.n}</span><div className="w-full rounded-t-md bg-[var(--star)]/30" style={{ height: `${Math.max(4, (b.n / maxB) * 100)}%` }} /><span className="text-[10.5px] text-zinc-600">{b.name}</span></div>)}</div>
        </Sec>
      </div>
    </div>
  );
}

// ─── Curriculum ──────────────────────────────────────────────────────────────
const BINS = [['under 20%', '#fb7185'], ['20–40', '#fbbf24'], ['40–60', '#e0a95a'], ['60–85', '#fbbf24'], ['mastered', '#ecfdf5']];

function CurriculumTab() {
  const toast = useToast();
  const [h, setH] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [college, setCollege] = useState('');
  const [model, setModel] = useState(null);
  const [refitting, setRefitting] = useState(false);

  const load = useCallback(() => adminService.getHeatmap(college ? { collegeId: college } : {}).then((r) => setH(r.data.data)), [college]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { collegesService.getColleges({ limit: 100 }).then((r) => setColleges(r.data.data.colleges || [])); analyticsService.getModel().then((r) => setModel(r.data.data)); }, []);

  const refit = async () => {
    setRefitting(true);
    try { const r = await analyticsService.refitModel(); toast.success('Model refit', `${r.data.data.summary.filter((x) => x.fitted).length} skills updated from real submissions`); analyticsService.getModel().then((m) => setModel(m.data.data)); }
    catch { toast.error('Refit failed'); } finally { setRefitting(false); }
  };

  if (!h) return <Spinner />;
  return (
    <div>
      <Sec title={<>Where the cohort <em>struggles</em></>} kicker="Average mastery per skill, weakest first, with the full distribution of students — a direct signal for curriculum planning."
        action={<select value={college} onChange={(e) => setCollege(e.target.value)} className="cursor-pointer border-b border-[var(--line-strong)] bg-transparent py-1.5 text-[14px] text-zinc-300 outline-none"><option value="" className="bg-[#0d0d0d]">All colleges</option>{colleges.map((c) => <option key={c._id} value={c._id} className="bg-[#0d0d0d]">{c.shortName}</option>)}</select>}>
        {h.recommendation && <p className="mb-8 max-w-3xl border-l-2 border-[var(--star)] pl-4 text-[16px] leading-relaxed text-zinc-300">{h.recommendation}</p>}
        {h.heatmap.map((row) => {
          const pct = Math.round(row.avgMastery * 100);
          const tot = row.distribution.reduce((a, b) => a + b, 0) || 1;
          return (
            <div key={row.skillId} className="grid items-center gap-x-8 gap-y-2 border-b border-[var(--line)] py-4 md:grid-cols-[220px_1fr_70px_150px]">
              <div><div className="display text-[20.8px] leading-none text-zinc-100">{row.skillName}</div><div className="mt-1 text-[12px] text-zinc-600">{row.totalStudents} students · {row.accuracy != null ? `${Math.round(row.accuracy * 100)}% accuracy` : 'no data'}</div></div>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.05]" title={BINS.map(([l], i) => `${l}: ${row.distribution[i]}`).join(' · ')}>{row.distribution.map((n, i) => <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${(n / tot) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} style={{ background: BINS[i][1] }} className="h-full" />)}</div>
              <div className={cn('display text-right text-[24px] leading-none tnum', pct >= 70 ? 'text-zinc-50' : pct >= 45 ? 'text-amber-300' : 'text-rose-300')}>{row.totalStudents ? pct : '—'}{row.totalStudents ? <span className="text-[14px] text-zinc-600">%</span> : null}</div>
              <div className="text-right text-[12.5px] text-zinc-500">{row.masteredCount} mastered · {Math.round(row.masteryRate * 100)}%</div>
            </div>
          );
        })}
        <div className="mt-5 flex flex-wrap gap-5 text-[12px] text-zinc-500">{BINS.map(([l, c]) => <span key={l} className="flex items-center gap-2"><span className="h-2 w-5 rounded-full" style={{ background: c }} />{l}</span>)}</div>
      </Sec>

      {model && (
        <Sec title={<>The <em>model</em></>} kicker="Per-skill knowledge-tracing parameters learned from real submissions (Bayesian-regularised maximum likelihood). Textbook defaults in brackets."
          action={<Act onClick={refit} disabled={refitting} busy={refitting}>{!refitting && <RefreshCw className="h-3.5 w-3.5" />}Refit now</Act>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead><tr>{['Skill', 'Starts known', 'Learns', 'Slips', 'Guesses', 'Sequences', 'Fit gain'].map((c) => <th key={c} className="pb-3 text-[12.5px] font-normal text-zinc-600">{c}</th>)}</tr></thead>
            <tbody>{model.skills.map((m) => { const d = model.defaults; const cell = (k) => <td className="border-t border-[var(--line)] py-3 pr-4 text-[14px] tnum"><span className={cn(m.fitted && Math.abs(m.params[k] - d[k]) >= 0.03 ? 'text-[var(--ember-soft)]' : 'text-zinc-400')}>{m.params[k].toFixed(2)}</span><span className="ml-1 text-[11px] text-zinc-700">({d[k]})</span></td>; return <tr key={m.skillId}><td className="border-t border-[var(--line)] py-3 pr-4 text-[16px] text-zinc-200">{m.name}{!m.fitted && <span className="ml-2 text-[11px] text-zinc-600">default</span>}</td>{cell('pL0')}{cell('pT')}{cell('pS')}{cell('pG')}<td className="border-t border-[var(--line)] py-3 text-[13px] tnum text-zinc-500">{m.sequences}</td><td className="border-t border-[var(--line)] py-3 text-[13px] tnum text-emerald-400">{m.logLikelihoodGain > 0 ? `+${m.logLikelihoodGain}` : '—'}</td></tr>; })}</tbody></table></div>
        </Sec>
      )}
    </div>
  );
}

// ─── Students ────────────────────────────────────────────────────────────────
function StudentsTab({ me }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('xp');
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [working, setWorking] = useState({});

  const load = useCallback(() => { setLoading(true); adminService.getStudents({ q, sort }).then((r) => setRows(r.data.data.students)).finally(() => setLoading(false)); }, [q, sort]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const view = async (id) => { if (open === id) { setOpen(null); return; } setOpen(id); setDetail(null); const r = await adminService.getStudent(id); setDetail(r.data.data); };
  const toggleRole = async (s) => {
    const role = s.role === 'admin' ? 'student' : 'admin';
    setWorking((w) => ({ ...w, [s._id]: true }));
    try { await adminService.updateUserRole(s._id, role); setRows((p) => p.map((x) => (x._id === s._id ? { ...x, role } : x))); toast.success(role === 'admin' ? 'Promoted to admin' : 'Admin access revoked', s.name); }
    catch (e) { toast.error('Could not change role', e.response?.data?.message); }
    finally { setWorking((w) => { const n = { ...w }; delete n[s._id]; return n; }); }
  };

  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <SearchLine value={q} onChange={setQ} placeholder="Search by name or email…" />
        <div className="flex gap-1.5">{[['xp', 'Top XP'], ['active', 'Recently active'], ['recent', 'Newest']].map(([k, l]) => <button key={k} onClick={() => setSort(k)} className={chip(sort === k)}>{l}</button>)}</div>
      </div>
      {loading ? <Spinner /> : rows.length === 0 ? <Empty title="No one found." /> : (
        <div className="mt-6">
          {rows.map((s) => (
            <div key={s._id} className="border-b border-[var(--line)]">
              <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5 md:grid-cols-[1.4fr_110px_110px_130px_90px_150px]">
                <button onClick={() => view(s._id)} className="group flex min-w-0 items-center gap-3.5 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-strong)] text-[12px] font-semibold text-zinc-300">{s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  <span className="min-w-0"><span className="block truncate text-[16px] text-zinc-100 transition-colors group-hover:text-[var(--ember)]">{s.name}</span><span className="block truncate text-[12px] text-zinc-600">{s.email}</span></span>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-zinc-700 transition-transform', open === s._id && 'rotate-180')} />
                </button>
                <div className="hidden text-[14px] md:block"><span className="tnum text-zinc-200">{s.xp}</span> <span className="text-[12px] text-zinc-600">XP · L{s.level}</span></div>
                <div className="hidden text-[13px] text-zinc-500 md:block">{s.collegeId?.shortName || '—'}</div>
                <div className="hidden text-[13px] text-zinc-400 md:block">{s.skillsMastered}/12 <span className="text-zinc-600">mastered</span></div>
                <div className="hidden text-[13px] tnum text-zinc-500 md:block">{s.passRate != null ? `${s.passRate}%` : '—'}<div className="text-[11px] text-zinc-700">{ago(s.lastActiveDate)}</div></div>
                <div className="flex items-center justify-end gap-3"><span className={cn('text-[12.5px]', s.role === 'admin' ? 'text-[var(--star)]' : 'text-zinc-600')}>{s.role}</span><Act onClick={() => toggleRole(s)} disabled={!!working[s._id] || s._id === me} busy={!!working[s._id]} title={s._id === me ? "You can't change your own role here" : ''}>{s.role === 'admin' ? 'Revoke' : 'Promote'}</Act></div>
              </div>
              <AnimatePresence initial={false}>
                {open === s._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    {!detail ? <Spinner /> : (
                      <div className="grid gap-14 pb-8 pl-14 pt-2 lg:grid-cols-2">
                        <div><div className="mb-3 text-[13px] text-zinc-500">Skill mastery</div>{detail.skills.map((k) => <div key={k.name} className="flex items-center gap-4 py-1.5"><span className="w-40 truncate text-[14px] text-zinc-300">{k.name}</span><div className="h-[3px] flex-1 rounded-full bg-white/[0.07]"><div className="h-full rounded-full" style={{ width: `${k.masteryP * 100}%`, background: k.masteryP >= 0.85 ? '#ecfdf5' : k.masteryP >= 0.5 ? '#fbbf24' : '#fb7185' }} /></div><span className="w-10 text-right text-[13px] tnum text-zinc-500">{Math.round(k.masteryP * 100)}%</span></div>)}</div>
                        <div><div className="mb-3 text-[13px] text-zinc-500">Recent submissions · {detail.totals.submissions} total · {detail.totals.passRate ?? '—'}% pass</div>{detail.recentSubmissions.map((x) => <div key={x._id} className="flex items-center justify-between py-1.5 text-[14px]"><span className="flex items-center gap-2.5 truncate"><span className={cn('h-1.5 w-1.5 rounded-full', x.isCorrect ? 'bg-emerald-400' : 'bg-zinc-600')} /><span className="truncate text-zinc-300">{x.problemId?.title}</span></span><span className="text-[12px] text-zinc-600">{ago(x.createdAt)}</span></div>)}{!detail.recentSubmissions.length && <p className="text-[13px] text-zinc-600">No submissions yet.</p>}<p className="mt-4 text-[12.5px] text-zinc-600">{detail.user.collegeId?.name || 'No college'} · target {detail.user.targetCompanyId?.name || '—'} / {detail.user.targetRole || '—'} · streak {detail.user.streak}</p></div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Experiences ─────────────────────────────────────────────────────────────
function ExperiencesTab() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('Draft');
  const [q, setQ] = useState('');
  const [working, setWorking] = useState({});
  const [open, setOpen] = useState(null);

  const load = useCallback(() => adminService.getExperiences({ status, q, limit: 100 }).then((r) => setData(r.data.data)), [status, q]);
  useEffect(() => { setData(null); const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const act = async (id, action) => {
    setWorking((w) => ({ ...w, [id]: action }));
    try { await adminService.verifyExperience(id, action); toast.success({ verify: 'Verified & published', reject: 'Rejected', restore: 'Restored' }[action]); load(); }
    catch { toast.error('Action failed'); } finally { setWorking((w) => { const n = { ...w }; delete n[id]; return n; }); }
  };
  const counts = data?.counts || {};
  const FILTERS = [['Draft', 'Pending review', counts.Draft], ['Published', 'Published', counts.Published], ['Rejected', 'Rejected', counts.Rejected], ['all', 'All', Object.values(counts).reduce((a, b) => a + b, 0)]];

  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <div className="flex flex-wrap gap-1.5">{FILTERS.map(([k, l, n]) => <button key={k} onClick={() => setStatus(k)} className={chip(status === k)}>{l}<span className="tnum opacity-60">{n ?? 0}</span></button>)}</div>
        <SearchLine value={q} onChange={setQ} placeholder="Search company or role…" />
      </div>
      {!data ? <Spinner /> : data.experiences.length === 0 ? <Empty title={status === 'Draft' ? 'The queue is clear.' : 'Nothing here.'} text={status === 'Draft' ? 'Very thin submissions land here for review.' : ''} /> : (
        <div className="mt-4">
          {data.experiences.map((e) => (
            <article key={e._id} className="flex items-start gap-5 border-b border-[var(--line)] py-6">
              <CompanyLogo company={e.companyId} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1"><span className="display text-[24px] leading-none text-zinc-100">{e.companyId?.name || 'Unknown'} <span className="text-zinc-500">—</span> {e.role}</span><span className={cn('text-[13px]', e.offerReceived === 'Yes' ? 'text-emerald-400' : e.offerReceived === 'No' ? 'text-rose-400' : 'text-amber-400')}>{e.offerReceived === 'Yes' ? 'offer' : e.offerReceived === 'No' ? 'no offer' : 'pending'}</span><span className={cn('text-[13px]', e.status === 'Published' ? 'text-zinc-500' : e.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400')}>{e.status.toLowerCase()}</span>{e.isVerified && <span className="text-[13px] text-sky-300">verified</span>}{e.source === 'curated' && <span className="text-[13px] text-zinc-600">sample</span>}{e.qualityScore != null && <span className={cn('text-[13px] tnum', e.qualityScore >= 60 ? 'text-zinc-400' : 'text-amber-400')}>quality {e.qualityScore}</span>}</div>
                <div className="tag mt-1.5">{e.collegeId?.shortName || e.college || 'college unknown'} · {e.month} {e.year} · {e.rounds?.length || 0} rounds{e.userId?.name ? ` · ${e.userId.name}${e.isAnonymous ? ' (anonymous)' : ''}` : ''} · {ago(e.createdAt)}</div>
                {open === e._id ? (
                  <div className="mt-4 space-y-4 border-l border-[var(--line-strong)] pl-5">{e.rounds?.map((r, i) => <div key={i}><div className="text-[14px] font-medium text-zinc-200">Round {i + 1} · {r.type}</div>{r.questions?.map((qq, j) => <div key={j} className="mt-1 text-[14px] leading-relaxed text-zinc-400">{qq.text}</div>)}</div>)}{e.overallTips && <p className="text-[15px] italic leading-relaxed text-zinc-400">“{e.overallTips}”</p>}</div>
                ) : e.overallTips && <p className="mt-3 line-clamp-1 text-[14px] text-zinc-500">{e.overallTips}</p>}
                <button onClick={() => setOpen(open === e._id ? null : e._id)} className="mt-3 text-[13px] text-zinc-500 transition-colors hover:text-[var(--ember)]">{open === e._id ? 'Hide details' : 'Read in full'}</button>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                {(e.status !== 'Published' || !e.isVerified) && <Act tone="good" onClick={() => act(e._id, 'verify')} disabled={!!working[e._id]} busy={working[e._id] === 'verify'}>{working[e._id] !== 'verify' && <Check className="h-3.5 w-3.5" />}Verify</Act>}
                {e.status !== 'Rejected' ? <Act tone="bad" onClick={() => act(e._id, 'reject')} disabled={!!working[e._id]} busy={working[e._id] === 'reject'}>{working[e._id] !== 'reject' && <X className="h-3.5 w-3.5" />}Reject</Act> : <Act onClick={() => act(e._id, 'restore')} disabled={!!working[e._id]}>Restore</Act>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Problems ────────────────────────────────────────────────────────────────
function ProblemsTab() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('waitlisted');
  const [q, setQ] = useState('');
  const [working, setWorking] = useState({});
  const load = useCallback(() => adminService.getProblems({ status, q }).then((r) => setData(r.data.data)), [status, q]);
  useEffect(() => { setData(null); const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const set = async (id, s) => { setWorking((w) => ({ ...w, [id]: s })); try { await adminService.updateProblemStatus(id, s); toast.success(`Marked ${s}`); load(); } catch { toast.error('Update failed'); } finally { setWorking((w) => { const n = { ...w }; delete n[id]; return n; }); } };
  const counts = data?.counts || {};
  return (
    <div className="pt-10">
      <p className="max-w-3xl text-[16px] leading-relaxed text-zinc-400">Community-proposed problems move <span className="text-zinc-200">quarantine → waitlisted → approved</span>. Only approved problems reach the judge, and approving a proposal awards its author 150 XP.</p>
      <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div className="flex flex-wrap gap-1.5">{[['waitlisted', 'Waitlisted'], ['quarantine', 'Quarantine'], ['approved', 'Approved'], ['all', 'All']].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={chip(status === k)}>{l}<span className="tnum opacity-60">{k === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[k] || 0}</span></button>)}</div>
        <SearchLine value={q} onChange={setQ} placeholder="Search problems…" />
      </div>
      {!data ? <Spinner /> : data.problems.length === 0 ? <Empty title="Nothing in this queue." /> : (
        <div className="mt-4">{data.problems.map((p) => (
          <article key={p._id} className="flex items-start gap-5 border-b border-[var(--line)] py-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1"><span className="display text-[24px] leading-none text-zinc-100">{p.title}</span><span className="flex items-center gap-1.5 text-[13px] capitalize text-zinc-400"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[String(p.difficulty).toLowerCase()])} />{p.difficulty}</span><span className={cn('text-[13px]', p.status === 'approved' ? 'text-emerald-400' : p.status === 'quarantine' ? 'text-rose-400' : 'text-amber-400')}>{p.status}</span>{p.skillId?.name && <span className="text-[13px] text-zinc-500">{p.skillId.name}</span>}</div>
              <div className="tag mt-1.5">{[p.company, p.round].filter(Boolean).join(' · ')}{p.company || p.round ? ' · ' : ''}↑{p.upvotes || 0} ↓{p.downvotes || 0}{p.authorId?.name ? ` · by ${p.authorId.name}` : ''} · {ago(p.createdAt)}</div>
              {p.description && <p className="mt-3 line-clamp-2 max-w-3xl text-[14.5px] leading-relaxed text-zinc-400">{p.description}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">{['waitlisted', 'approved', 'quarantine'].filter((s) => s !== p.status).map((s) => <Act key={s} tone={s === 'approved' ? 'good' : s === 'quarantine' ? 'bad' : 'warn'} onClick={() => set(p._id, s)} disabled={!!working[p._id]} busy={working[p._id] === s}>{s === 'approved' ? 'Approve' : s === 'quarantine' ? 'Quarantine' : 'Waitlist'}</Act>)}</div>
          </article>
        ))}</div>
      )}
    </div>
  );
}

// ─── Add data ────────────────────────────────────────────────────────────────
function AddDataTab() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [records, setRecords] = useState([]);
  const [college, setCollege] = useState({ name: '', shortName: '', slug: '', location: '', tier: 'Other', website: '' });
  const [company, setCompany] = useState({ name: '', tier: 'Product', avgCTC: '', ctcMin: '', ctcMax: '', roles: '', domain: '', headquarters: '', description: '' });
  const [rec, setRec] = useState({ collegeId: '', companyId: '', hiringYear: new Date().getFullYear(), hiringSeason: 'On-Campus', roles: '', studentsHired: '', packageOffered: '' });
  const [busy, setBusy] = useState('');

  const loadAll = useCallback(() => {
    Promise.all([companiesService.getCompanies(), collegesService.getColleges({ limit: 100 }), adminService.getPlacementRecords()])
      .then(([c, col, r]) => { setCompanies(c.data.data || []); setColleges(col.data.data.colleges || []); setRecords(r.data.data.records || []); }).catch(() => {});
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const submit = (kind, fn, reset) => async (e) => {
    e.preventDefault(); setBusy(kind);
    try { await fn(); toast.success('Saved'); reset(); loadAll(); } catch (err) { toast.error('Could not save', err.response?.data?.message || err.response?.data?.error); } finally { setBusy(''); }
  };
  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const Sel = (p) => <select {...p} className={cn(inputCls, 'cursor-pointer')} />;
  const Go = ({ k, children }) => <button disabled={busy === k} className="btn-line group mt-2 w-full justify-center">{busy === k ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{children}</button>;

  return (
    <div>
      <p className="mt-10 max-w-3xl text-[16px] leading-relaxed text-zinc-400">This is where real, verified numbers replace the illustrative ones. Placement records you add here feed every chart and prediction on the Placement pages.</p>
      <div className="mt-12 grid gap-16 lg:grid-cols-3">
        <form onSubmit={submit('college', () => adminService.createCollege({ ...college, slug: college.slug || slugify(college.shortName || college.name) }), () => setCollege({ name: '', shortName: '', slug: '', location: '', tier: 'Other', website: '' }))} className="space-y-5">
          <h3 className="display text-[27.2px] text-zinc-100">A college</h3>
          <Field label="Full name *"><input required className={inputCls} value={college.name} onChange={(e) => setCollege({ ...college, name: e.target.value })} placeholder="National Institute of Technology Calicut" /></Field>
          <div className="grid grid-cols-2 gap-5"><Field label="Short name *"><input required className={inputCls} value={college.shortName} onChange={(e) => setCollege({ ...college, shortName: e.target.value })} placeholder="NIT Calicut" /></Field><Field label="Slug"><input className={inputCls} value={college.slug} onChange={(e) => setCollege({ ...college, slug: e.target.value })} placeholder="auto" /></Field></div>
          <div className="grid grid-cols-2 gap-5"><Field label="Location"><input className={inputCls} value={college.location} onChange={(e) => setCollege({ ...college, location: e.target.value })} placeholder="Kozhikode, Kerala" /></Field><Field label="Tier"><Sel value={college.tier} onChange={(e) => setCollege({ ...college, tier: e.target.value })}>{['IIT', 'NIT', 'BITS', 'IIIT', 'Deemed', 'State', 'Private', 'Other'].map((t) => <option key={t} className="bg-[#0d0d0d]">{t}</option>)}</Sel></Field></div>
          <Go k="college">Add college</Go>
        </form>

        <form onSubmit={submit('company', () => adminService.createCompany(company), () => setCompany({ name: '', tier: 'Product', avgCTC: '', ctcMin: '', ctcMax: '', roles: '', domain: '', headquarters: '', description: '' }))} className="space-y-5">
          <h3 className="display text-[27.2px] text-zinc-100">A company</h3>
          <div className="grid grid-cols-2 gap-5"><Field label="Name *"><input required className={inputCls} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Stripe" /></Field><Field label="Tier"><Sel value={company.tier} onChange={(e) => setCompany({ ...company, tier: e.target.value })}>{['FAANG', 'Product', 'Finance', 'Service', 'Startup', 'Other'].map((t) => <option key={t} className="bg-[#0d0d0d]">{t}</option>)}</Sel></Field></div>
          <div className="grid grid-cols-3 gap-5"><Field label="CTC min (LPA)"><input type="number" className={inputCls} value={company.ctcMin} onChange={(e) => setCompany({ ...company, ctcMin: e.target.value, avgCTC: `${e.target.value}–${company.ctcMax} LPA` })} /></Field><Field label="CTC max"><input type="number" className={inputCls} value={company.ctcMax} onChange={(e) => setCompany({ ...company, ctcMax: e.target.value, avgCTC: `${company.ctcMin}–${e.target.value} LPA` })} /></Field><Field label="Domain"><input className={inputCls} value={company.domain} onChange={(e) => setCompany({ ...company, domain: e.target.value })} placeholder="stripe.com" /></Field></div>
          <Field label="Roles (comma-separated)"><input className={inputCls} value={company.roles} onChange={(e) => setCompany({ ...company, roles: e.target.value })} placeholder="SDE-1, Backend Engineer" /></Field>
          <Field label="Headquarters"><input className={inputCls} value={company.headquarters} onChange={(e) => setCompany({ ...company, headquarters: e.target.value })} /></Field>
          <Go k="company">Add company</Go>
        </form>

        <form onSubmit={submit('rec', () => adminService.createPlacementRecord({ ...rec, roles: rec.roles.split(',').map((r) => r.trim()).filter(Boolean), studentsHired: rec.studentsHired ? Number(rec.studentsHired) : undefined, packageOffered: rec.packageOffered ? { ctc: rec.packageOffered } : undefined }), () => setRec({ ...rec, roles: '', studentsHired: '', packageOffered: '' }))} className="space-y-5">
          <h3 className="display text-[27.2px] text-zinc-100">A placement record</h3>
          <div className="grid grid-cols-2 gap-5"><Field label="College *"><Sel required value={rec.collegeId} onChange={(e) => setRec({ ...rec, collegeId: e.target.value })}><option value="" className="bg-[#0d0d0d]">Select…</option>{colleges.map((c) => <option key={c._id} value={c._id} className="bg-[#0d0d0d]">{c.shortName}</option>)}</Sel></Field><Field label="Company *"><Sel required value={rec.companyId} onChange={(e) => setRec({ ...rec, companyId: e.target.value })}><option value="" className="bg-[#0d0d0d]">Select…</option>{companies.map((c) => <option key={c._id} value={c._id} className="bg-[#0d0d0d]">{c.name}</option>)}</Sel></Field></div>
          <div className="grid grid-cols-2 gap-5"><Field label="Year *"><input type="number" required className={inputCls} value={rec.hiringYear} onChange={(e) => setRec({ ...rec, hiringYear: Number(e.target.value) })} /></Field><Field label="Season"><Sel value={rec.hiringSeason} onChange={(e) => setRec({ ...rec, hiringSeason: e.target.value })}>{['On-Campus', 'Off-Campus', 'Pool-Campus', 'Internship'].map((s) => <option key={s} className="bg-[#0d0d0d]">{s}</option>)}</Sel></Field></div>
          <div className="grid grid-cols-2 gap-5"><Field label="Students hired"><input type="number" className={inputCls} value={rec.studentsHired} onChange={(e) => setRec({ ...rec, studentsHired: e.target.value })} /></Field><Field label="Package"><input className={inputCls} value={rec.packageOffered} onChange={(e) => setRec({ ...rec, packageOffered: e.target.value })} placeholder="24 LPA" /></Field></div>
          <Field label="Roles"><input className={inputCls} value={rec.roles} onChange={(e) => setRec({ ...rec, roles: e.target.value })} placeholder="SDE-1, Data Engineer" /></Field>
          <Go k="rec">Add record</Go>
        </form>
      </div>

      <Sec title={<>Recent <em>records</em></>} kicker="Latest placement records across all colleges.">
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr>{['Year', 'College', 'Company', 'Hired', 'Package', 'Roles', ''].map((h) => <th key={h} className="pb-3 text-[12.5px] font-normal text-zinc-600">{h}</th>)}</tr></thead>
          <tbody>{records.slice(0, 30).map((r) => <tr key={r._id}><td className="border-t border-[var(--line)] py-3 pr-4 display text-[17.6px] tnum text-zinc-200">{r.hiringYear}</td><td className="border-t border-[var(--line)] pr-4 text-[14px] text-zinc-400">{r.collegeId?.shortName}</td><td className="border-t border-[var(--line)] pr-4 text-[15px] text-zinc-200">{r.companyId?.name}</td><td className="border-t border-[var(--line)] pr-4 text-[14px] tnum text-zinc-400">{r.studentsHired ?? '—'}</td><td className="border-t border-[var(--line)] pr-4 text-[14px] tnum text-zinc-400">{r.packageOffered?.ctc || '—'}</td><td className="border-t border-[var(--line)] pr-4 text-[13.5px] text-zinc-500">{(r.roles || []).slice(0, 2).join(', ')}</td><td className="border-t border-[var(--line)] text-right"><button onClick={async () => { await adminService.deletePlacementRecord(r._id); toast.info('Record removed'); loadAll(); }} className="text-zinc-700 transition-colors hover:text-rose-400" title="Delete record"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
      </Sec>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <Page wide>
      <header className="pt-2 md:pt-6">
        <div className="tag">Admin · signed in as {user.name}</div>
        <h1 className="display mt-5 text-[clamp(37px,6vw,77px)] text-zinc-50">The <em className="text-[var(--ember)]">control</em> room.</h1>
        <nav className="mt-10 flex gap-1 overflow-x-auto border-b border-[var(--line-strong)] pb-3">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn('relative shrink-0 rounded-sm px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', tab === k ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200')}>
              {tab === k && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-sm bg-white/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </nav>
      </header>
      {tab === 'overview' && <OverviewTab onGoto={setTab} />}
      {tab === 'curriculum' && <CurriculumTab />}
      {tab === 'students' && <StudentsTab me={user._id} />}
      {tab === 'experiences' && <ExperiencesTab />}
      {tab === 'problems' && <ProblemsTab />}
      {tab === 'add' && <AddDataTab />}
    </Page>
  );
}
