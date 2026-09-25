import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, ComposedChart, Bar as RBar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart
} from 'recharts';
import {
  Shield, Users, BookOpen, FileText, Check, X, Loader2, Search, Building2, GraduationCap, Sparkles, RefreshCw, UserCheck, Layers, BarChart2,
  TrendingUp, Activity, AlertTriangle, ChevronDown, Trash2, Brain, Plus, Eye, Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService, companiesService, collegesService, analyticsService } from '../services/api';
import { Card, Label, SectionTitle, Stat, Pill, DiffPill, Bar, Skeleton, EmptyState, CountUp, CompanyLogo, chartTooltipStyle, cn } from '../components/ui/kit';

const TABS = [
  ['overview', 'Overview', BarChart2], ['curriculum', 'Curriculum', Layers], ['students', 'Students', Users],
  ['experiences', 'Experiences', FileText], ['problems', 'Problems', BookOpen], ['add', 'Add data', Sparkles]
];
const inputCls = 'w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-[13px] text-zinc-200 outline-none focus:border-violet-400/50 transition-all placeholder:text-zinc-700';
const Spinner = () => <div className="flex items-center justify-center gap-3 py-16 text-zinc-600"><Loader2 className="h-5 w-5 animate-spin" /><span className="font-mono text-[10px] uppercase tracking-widest">Loading…</span></div>;
const Field = ({ label, children }) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
const ago = (iso) => { if (!iso) return '—'; const d = Math.floor((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`; };

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ onGoto }) {
  const [s, setS] = useState(null);
  useEffect(() => { adminService.getStats().then((r) => setS(r.data.data)).catch(() => {}); }, []);
  if (!s) return <Spinner />;
  const pending = s.moderation.pendingExperiences + s.moderation.waitlistedProblems + s.moderation.quarantinedProblems;
  return (
    <div className="space-y-6">
      {pending > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-5 py-3.5">
          <div className="flex items-center gap-3 text-[13px] text-amber-100"><AlertTriangle className="h-4 w-4 text-amber-300" /> {s.moderation.pendingExperiences} experience{s.moderation.pendingExperiences !== 1 ? 's' : ''} and {s.moderation.waitlistedProblems + s.moderation.quarantinedProblems} problem{s.moderation.waitlistedProblems + s.moderation.quarantinedProblems !== 1 ? 's' : ''} need review</div>
          <div className="flex gap-2"><button onClick={() => onGoto('experiences')} className="rounded-lg border border-amber-400/30 px-3 py-1.5 font-mono text-[10.5px] uppercase text-amber-200 hover:bg-amber-400/10">Experiences</button><button onClick={() => onGoto('problems')} className="rounded-lg border border-amber-400/30 px-3 py-1.5 font-mono text-[10.5px] uppercase text-amber-200 hover:bg-amber-400/10">Problems</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" icon={Users} value={<CountUp value={s.totalStudents} />} sub={`${s.totalAdmins} admin${s.totalAdmins !== 1 ? 's' : ''}`} />
        <Stat label="Submissions" icon={FileText} accent="blue" value={<CountUp value={s.totalSubmissions} />} sub={`${s.passRate}% pass rate`} />
        <Stat label="Active users" icon={Activity} accent="violet" value={<CountUp value={s.active.week} />} sub={`${s.active.day} today · ${s.active.month} in 30d`} />
        <Stat label="Avg student XP" icon={TrendingUp} accent="amber" value={<CountUp value={s.averageXP} />} sub={`${s.totalXP.toLocaleString()} XP total`} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Problems" icon={BookOpen} value={s.content.problems.total} sub={`${s.content.problems.approved || 0} live · ${s.totalProblemsAttempted} attempted`} />
        <Stat label="Companies" icon={Building2} accent="blue" value={s.content.companies} sub={`${s.content.colleges} colleges`} />
        <Stat label="Experiences" icon={FileText} accent="violet" value={s.content.experiences.total} sub={`${s.content.experiences.Published || 0} published`} />
        <Stat label="Placement records" icon={GraduationCap} accent="amber" value={s.content.placementRecords} sub="across all colleges" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <SectionTitle icon={Activity} title="Submissions per day · last 14 days" sub="Bars: submissions. Lines: correct submissions and active students." />
          <div className="h-64"><ResponsiveContainer><ComposedChart data={s.submissionsPerDay.map((d) => ({ ...d, label: d.date.slice(5) }))} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip {...chartTooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /><RBar dataKey="submissions" name="Submissions" fill="#38bdf8" radius={[5, 5, 0, 0]} barSize={18} /><Line dataKey="correct" name="Correct" stroke="#34d399" strokeWidth={2} dot={false} /><Line dataKey="activeUsers" name="Active students" stroke="#a78bfa" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <SectionTitle icon={Flame} title="Most attempted problems" />
          <div className="space-y-3">{s.topProblems.map((p, i) => <div key={p._id}><div className="mb-1 flex items-center justify-between text-[12.5px]"><span className="flex items-center gap-2 truncate text-zinc-200"><span className="font-mono text-zinc-600">{i + 1}</span>{p.title}<DiffPill difficulty={p.difficulty} className="scale-90" /></span><span className="font-mono text-[10.5px] text-zinc-500">{p.solved}/{p.attempts}</span></div><Bar value={p.solved} max={p.attempts} height={4} color="#34d399" /></div>)}</div>
          <div className="mt-6"><Label className="mb-2 block">Students by XP</Label><div className="h-24"><ResponsiveContainer><BarChart data={s.xpDistribution.map((b) => ({ name: typeof b.bucket === 'number' ? ['0-50', '50-200', '200-500', '500-1k', '1k+'][[0, 50, 200, 500, 1000].indexOf(b.bucket)] || b.bucket : b.bucket, n: b.students }))}><XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 9 }} tickLine={false} axisLine={false} /><Tooltip {...chartTooltipStyle} /><RBar dataKey="n" name="Students" fill="#fbbf24" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        </Card>
      </div>
    </div>
  );
}

// ─── Curriculum ──────────────────────────────────────────────────────────────
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
    try { const r = await analyticsService.refitModel(); toast.success('BKT parameters refit', `${r.data.data.summary.filter((x) => x.fitted).length} skills updated from real submissions`); analyticsService.getModel().then((m) => setModel(m.data.data)); }
    catch { toast.error('Refit failed'); } finally { setRefitting(false); }
  };

  if (!h) return <Spinner />;
  const BINS = [['<20%', '#fb7185'], ['20–40', '#f97316'], ['40–60', '#fbbf24'], ['60–85', '#38bdf8'], ['Mastered', '#34d399']];
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle icon={Layers} title="Cohort skill heatmap" sub="Average BKT mastery per skill (lowest first) with the full distribution of students — a direct signal for curriculum planning." action={
          <select value={college} onChange={(e) => setCollege(e.target.value)} className="rounded-lg border border-white/[0.07] bg-[#0b0f15] px-3 py-2 text-[12px] text-zinc-300 outline-none"><option value="">All colleges</option>{colleges.map((c) => <option key={c._id} value={c._id}>{c.shortName}</option>)}</select>} />
        {h.recommendation && <div className="mb-5 rounded-xl border border-violet-400/20 bg-violet-400/[0.05] px-4 py-3 text-[12.5px] text-violet-100"><b className="text-violet-300">Insight · </b>{h.recommendation}</div>}
        <div className="space-y-3">
          {h.heatmap.map((row) => {
            const pct = Math.round(row.avgMastery * 100);
            const tot = row.distribution.reduce((a, b) => a + b, 0) || 1;
            return (
              <div key={row.skillId} className="grid items-center gap-4 border-b border-white/[0.04] pb-3 last:border-0 md:grid-cols-[150px_1fr_70px_130px]">
                <div><div className="text-[13px] font-medium text-zinc-200">{row.skillName}</div><div className="font-mono text-[10px] text-zinc-600">{row.totalStudents} students · {row.accuracy != null ? `${Math.round(row.accuracy * 100)}% accuracy` : 'no data'}</div></div>
                <div className="flex h-5 overflow-hidden rounded-md bg-white/[0.04]" title={BINS.map(([l], i) => `${l}: ${row.distribution[i]}`).join(' · ')}>{row.distribution.map((n, i) => <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${(n / tot) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} style={{ background: BINS[i][1] }} className="h-full" />)}</div>
                <div className={cn('text-right font-mono text-[13px] font-semibold', pct >= 70 ? 'text-emerald-400' : pct >= 45 ? 'text-amber-400' : 'text-rose-400')}>{row.totalStudents ? `${pct}%` : '—'}</div>
                <div className="text-right font-mono text-[10.5px] text-zinc-500">{row.masteredCount} mastered · {Math.round(row.masteryRate * 100)}%</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">{BINS.map(([l, c]) => <span key={l} className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500"><span className="h-2 w-3 rounded" style={{ background: c }} />{l}</span>)}</div>
      </Card>

      {model && (
        <Card>
          <SectionTitle icon={Brain} title="Adaptive knowledge-tracing model" sub="Per-skill BKT parameters learned from real submissions (Bayesian-regularised maximum likelihood). Textbook defaults shown for comparison." action={<button onClick={refit} disabled={refitting} className="flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-wider text-violet-300 hover:bg-violet-400/20 disabled:opacity-50">{refitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refit now</button>} />
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left"><thead><tr className="border-b border-white/[0.06]">{['Skill', 'P(L0)', 'P(T) learn', 'P(S) slip', 'P(G) guess', 'Sequences', 'LL gain'].map((c) => <th key={c} className="pb-2.5 pr-4 font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-zinc-600">{c}</th>)}</tr></thead>
            <tbody>{model.skills.map((m) => { const d = model.defaults; const cell = (k) => <td className="py-2.5 pr-4 font-mono text-[12px]"><span className={cn(m.fitted && Math.abs(m.params[k] - d[k]) >= 0.03 ? 'text-violet-300' : 'text-zinc-400')}>{m.params[k].toFixed(2)}</span><span className="ml-1 text-[9px] text-zinc-700">({d[k]})</span></td>; return <tr key={m.skillId} className="border-b border-white/[0.03]"><td className="py-2.5 pr-4 text-[12.5px] text-zinc-200">{m.name}{!m.fitted && <span className="ml-2 font-mono text-[9px] text-zinc-600">default</span>}</td>{cell('pL0')}{cell('pT')}{cell('pS')}{cell('pG')}<td className="py-2.5 pr-4 font-mono text-[11.5px] text-zinc-500">{m.sequences}</td><td className="py-2.5 font-mono text-[11.5px] text-emerald-400">{m.logLikelihoodGain > 0 ? `+${m.logLikelihoodGain}` : '—'}</td></tr>; })}</tbody></table></div>
        </Card>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2"><Search className="h-3.5 w-3.5 text-zinc-600" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="w-full bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600" /></div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">{[['xp', 'Top XP'], ['active', 'Recently active'], ['recent', 'Newest']].map(([k, l]) => <button key={k} onClick={() => setSort(k)} className={cn('rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider', sort === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{l}</button>)}</div>
      </div>
      {loading ? <Spinner /> : rows.length === 0 ? <EmptyState icon={Users} title="No users found" /> : (
        <Card padded={false} className="overflow-hidden">
          {rows.map((s) => (
            <div key={s._id} className="border-b border-white/[0.04] last:border-0">
              <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 md:grid-cols-[1.3fr_90px_120px_90px_80px_150px]">
                <button onClick={() => view(s._id)} className="flex min-w-0 items-center gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-zinc-300">{s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span><span className="min-w-0"><span className="block truncate text-[13.5px] font-medium text-zinc-100">{s.name}</span><span className="block truncate font-mono text-[10.5px] text-zinc-600">{s.email}</span></span></button>
                <div className="hidden text-[12.5px] md:block"><span className="font-mono text-zinc-200">{s.xp}</span> <span className="text-[10px] text-zinc-600">XP · L{s.level}</span></div>
                <div className="hidden text-[12px] text-zinc-500 md:block">{s.collegeId?.shortName || '—'}</div>
                <div className="hidden text-[12px] text-zinc-400 md:block">{s.skillsMastered}/12 <span className="text-zinc-600">mastered</span></div>
                <div className="hidden font-mono text-[11px] text-zinc-500 md:block">{s.passRate != null ? `${s.passRate}%` : '—'}<div className="text-[9px] text-zinc-700">{ago(s.lastActiveDate)}</div></div>
                <div className="flex items-center justify-end gap-2"><Pill tone={s.role === 'admin' ? 'violet' : 'zinc'}>{s.role}</Pill><button onClick={() => toggleRole(s)} disabled={!!working[s._id] || s._id === me} title={s._id === me ? "You can't change your own role here" : ''} className={cn('rounded-lg border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider disabled:opacity-40', s.role === 'admin' ? 'border-white/10 text-zinc-500 hover:text-zinc-200' : 'border-violet-400/30 text-violet-300 hover:bg-violet-400/10')}>{working[s._id] ? <Loader2 className="h-3 w-3 animate-spin" /> : s.role === 'admin' ? 'Revoke' : 'Promote'}</button></div>
              </div>
              <AnimatePresence initial={false}>
                {open === s._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                    {!detail ? <Spinner /> : (
                      <div className="grid gap-6 px-5 py-5 lg:grid-cols-2">
                        <div><Label className="mb-3 block">Skill mastery</Label><div className="space-y-2">{detail.skills.map((k) => <div key={k.name} className="flex items-center gap-3 text-[12px]"><span className="w-36 truncate text-zinc-400">{k.name}</span><Bar value={k.masteryP} max={1} height={5} color={k.masteryP >= 0.85 ? '#34d399' : k.masteryP >= 0.5 ? '#38bdf8' : '#fbbf24'} className="flex-1" /><span className="w-10 text-right font-mono text-zinc-500">{Math.round(k.masteryP * 100)}%</span></div>)}</div></div>
                        <div><Label className="mb-3 block">Recent submissions · {detail.totals.submissions} total · {detail.totals.passRate ?? '—'}% pass</Label><div className="space-y-1.5">{detail.recentSubmissions.map((x) => <div key={x._id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-[12px]"><span className="flex items-center gap-2 truncate"><span className={cn('h-1.5 w-1.5 rounded-full', x.isCorrect ? 'bg-emerald-400' : 'bg-rose-400')} /><span className="truncate text-zinc-300">{x.problemId?.title}</span></span><span className="font-mono text-[10px] text-zinc-600">{ago(x.createdAt)}</span></div>)}{!detail.recentSubmissions.length && <p className="text-[12px] text-zinc-600">No submissions yet.</p>}</div><div className="mt-3 font-mono text-[10.5px] text-zinc-600">{detail.user.collegeId?.name || 'No college'} · target: {detail.user.targetCompanyId?.name || '—'} / {detail.user.targetRole || '—'} · streak {detail.user.streak}</div></div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </Card>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">{FILTERS.map(([k, l, n]) => <button key={k} onClick={() => setStatus(k)} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider', status === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{l}<span className="text-zinc-600">{n ?? 0}</span></button>)}</div>
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-white/[0.07] px-3.5 py-2"><Search className="h-3.5 w-3.5 text-zinc-600" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or role…" className="w-full bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600" /></div>
        <button onClick={() => { setData(null); load(); }} className="rounded-lg border border-white/[0.07] p-2.5 text-zinc-500 hover:text-zinc-200"><RefreshCw className="h-4 w-4" /></button>
      </div>
      {!data ? <Spinner /> : data.experiences.length === 0 ? <EmptyState icon={FileText} title={status === 'Draft' ? 'Moderation queue is clear' : 'No experiences here'} text={status === 'Draft' ? 'Very thin submissions land here for review.' : ''} /> : (
        <div className="space-y-2.5">
          {data.experiences.map((e) => (
            <Card key={e._id} padded={false}>
              <div className="flex items-start gap-4 p-4">
                <CompanyLogo company={e.companyId} size={38} className="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-semibold text-zinc-100">{e.companyId?.name || 'Unknown'} — {e.role}</span><Pill tone={e.offerReceived === 'Yes' ? 'green' : e.offerReceived === 'No' ? 'red' : 'amber'}>{e.offerReceived}</Pill><Pill tone={e.status === 'Published' ? 'green' : e.status === 'Rejected' ? 'red' : 'amber'}>{e.status}</Pill>{e.isVerified && <Pill tone="blue">Verified</Pill>}{e.qualityScore != null && <Pill tone={e.qualityScore >= 60 ? 'green' : e.qualityScore >= 30 ? 'amber' : 'red'}>Q {e.qualityScore}</Pill>}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10.5px] text-zinc-600"><span>{e.collegeId?.shortName || e.college || 'College unknown'}</span><span>{e.month} {e.year}</span><span>{e.rounds?.length || 0} rounds</span>{e.userId?.name && <span>by {e.userId.name}{e.isAnonymous ? ' (anon)' : ''}</span>}<span>{ago(e.createdAt)}</span></div>
                  {open === e._id ? <div className="mt-3 space-y-2 rounded-xl bg-black/20 p-3 text-[12px] text-zinc-400">{e.rounds?.map((r, i) => <div key={i}><b className="text-zinc-300">R{i + 1} {r.type}</b>{r.questions?.map((qq, j) => <div key={j} className="ml-3 text-zinc-500">• {qq.text}</div>)}</div>)}{e.overallTips && <div className="italic text-zinc-500">“{e.overallTips}”</div>}</div> : e.overallTips && <p className="mt-2 line-clamp-1 text-[12px] text-zinc-500">{e.overallTips}</p>}
                  <button onClick={() => setOpen(open === e._id ? null : e._id)} className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-zinc-600 hover:text-zinc-300"><Eye className="h-3 w-3" />{open === e._id ? 'Hide' : 'Preview'}</button>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                  {e.status !== 'Published' || !e.isVerified ? <button onClick={() => act(e._id, 'verify')} disabled={!!working[e._id]} className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10.5px] text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50">{working[e._id] === 'verify' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Verify</button> : null}
                  {e.status !== 'Rejected' ? <button onClick={() => act(e._id, 'reject')} disabled={!!working[e._id]} className="flex items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-1.5 font-mono text-[10.5px] text-rose-300 hover:bg-rose-400/20 disabled:opacity-50">{working[e._id] === 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Reject</button> : <button onClick={() => act(e._id, 'restore')} disabled={!!working[e._id]} className="rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[10.5px] text-zinc-400 hover:text-zinc-100">Restore</button>}
                </div>
              </div>
            </Card>
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
  const TONE = { quarantine: 'red', waitlisted: 'amber', approved: 'green' };
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-zinc-500">Community-proposed problems flow <b className="text-zinc-300">quarantine → waitlisted → approved</b>. Only approved problems appear in the coding judge; approving a proposal awards its author 150 XP.</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-[3px]">{[['waitlisted', 'Waitlisted'], ['quarantine', 'Quarantine'], ['approved', 'Approved'], ['all', 'All']].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider', status === k ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{l}<span className="text-zinc-600">{k === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[k] || 0}</span></button>)}</div>
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-white/[0.07] px-3.5 py-2"><Search className="h-3.5 w-3.5 text-zinc-600" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems…" className="w-full bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600" /></div>
      </div>
      {!data ? <Spinner /> : data.problems.length === 0 ? <EmptyState icon={BookOpen} title="Nothing in this queue" /> : (
        <div className="space-y-2.5">{data.problems.map((p) => (
          <Card key={p._id} padded={false}><div className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-semibold text-zinc-100">{p.title}</span><DiffPill difficulty={p.difficulty} /><Pill tone={TONE[p.status]}>{p.status}</Pill>{p.skillId?.name && <Pill tone="zinc">{p.skillId.name}</Pill>}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10.5px] text-zinc-600">{p.company && <span>{p.company}</span>}{p.round && <span>{p.round}</span>}<span>↑{p.upvotes || 0} ↓{p.downvotes || 0}</span>{p.authorId?.name && <span>by {p.authorId.name}</span>}<span>{ago(p.createdAt)}</span></div>
              {p.description && <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">{p.description}</p>}</div>
            <div className="flex shrink-0 gap-1.5">{['waitlisted', 'approved', 'quarantine'].filter((s) => s !== p.status).map((s) => <button key={s} onClick={() => set(p._id, s)} disabled={!!working[p._id]} className={cn('rounded-lg border px-3 py-1.5 font-mono text-[10.5px] capitalize disabled:opacity-50', s === 'approved' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' : s === 'quarantine' ? 'border-rose-400/25 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20' : 'border-amber-400/25 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20')}>{working[p._id] === s ? <Loader2 className="h-3 w-3 animate-spin" /> : s === 'approved' ? 'Approve' : s === 'quarantine' ? 'Quarantine' : 'Waitlist'}</button>)}</div>
          </div></Card>
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

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <form onSubmit={submit('college', () => adminService.createCollege({ ...college, slug: college.slug || slugify(college.shortName || college.name) }), () => setCollege({ name: '', shortName: '', slug: '', location: '', tier: 'Other', website: '' }))} className="space-y-3.5">
          <SectionTitle icon={GraduationCap} title="Add college" />
          <Field label="Full name *"><input required className={inputCls} value={college.name} onChange={(e) => setCollege({ ...college, name: e.target.value })} placeholder="National Institute of Technology Calicut" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Short name *"><input required className={inputCls} value={college.shortName} onChange={(e) => setCollege({ ...college, shortName: e.target.value })} placeholder="NIT Calicut" /></Field><Field label="Slug"><input className={inputCls} value={college.slug} onChange={(e) => setCollege({ ...college, slug: e.target.value })} placeholder="auto" /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Location"><input className={inputCls} value={college.location} onChange={(e) => setCollege({ ...college, location: e.target.value })} placeholder="Kozhikode, Kerala" /></Field><Field label="Tier"><select className={inputCls} value={college.tier} onChange={(e) => setCollege({ ...college, tier: e.target.value })}>{['IIT', 'NIT', 'BITS', 'IIIT', 'Deemed', 'State', 'Private', 'Other'].map((t) => <option key={t}>{t}</option>)}</select></Field></div>
          <button disabled={busy === 'college'} className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 py-2.5 text-[13px] font-semibold text-violet-300 hover:bg-violet-400/20 disabled:opacity-50">{busy === 'college' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add college</button>
        </form>

        <form onSubmit={submit('company', () => adminService.createCompany(company), () => setCompany({ name: '', tier: 'Product', avgCTC: '', ctcMin: '', ctcMax: '', roles: '', domain: '', headquarters: '', description: '' }))} className="space-y-3.5">
          <SectionTitle icon={Building2} title="Add company" />
          <div className="grid grid-cols-2 gap-3"><Field label="Name *"><input required className={inputCls} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Stripe" /></Field><Field label="Tier"><select className={inputCls} value={company.tier} onChange={(e) => setCompany({ ...company, tier: e.target.value })}>{['FAANG', 'Product', 'Finance', 'Service', 'Startup', 'Other'].map((t) => <option key={t}>{t}</option>)}</select></Field></div>
          <div className="grid grid-cols-3 gap-3"><Field label="CTC min (LPA)"><input type="number" className={inputCls} value={company.ctcMin} onChange={(e) => setCompany({ ...company, ctcMin: e.target.value, avgCTC: `${e.target.value}–${company.ctcMax} LPA` })} /></Field><Field label="CTC max"><input type="number" className={inputCls} value={company.ctcMax} onChange={(e) => setCompany({ ...company, ctcMax: e.target.value, avgCTC: `${company.ctcMin}–${e.target.value} LPA` })} /></Field><Field label="Domain"><input className={inputCls} value={company.domain} onChange={(e) => setCompany({ ...company, domain: e.target.value })} placeholder="stripe.com" /></Field></div>
          <Field label="Roles (comma-separated)"><input className={inputCls} value={company.roles} onChange={(e) => setCompany({ ...company, roles: e.target.value })} placeholder="SDE-1, Backend Engineer" /></Field>
          <Field label="Headquarters"><input className={inputCls} value={company.headquarters} onChange={(e) => setCompany({ ...company, headquarters: e.target.value })} /></Field>
          <button disabled={busy === 'company'} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 py-2.5 text-[13px] font-semibold text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50">{busy === 'company' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add company</button>
        </form>

        <form onSubmit={submit('rec', () => adminService.createPlacementRecord({ ...rec, roles: rec.roles.split(',').map((r) => r.trim()).filter(Boolean), studentsHired: rec.studentsHired ? Number(rec.studentsHired) : undefined, packageOffered: rec.packageOffered ? { ctc: rec.packageOffered } : undefined }), () => setRec({ ...rec, roles: '', studentsHired: '', packageOffered: '' }))} className="space-y-3.5">
          <SectionTitle icon={Layers} title="Add placement record" />
          <div className="grid grid-cols-2 gap-3"><Field label="College *"><select required className={inputCls} value={rec.collegeId} onChange={(e) => setRec({ ...rec, collegeId: e.target.value })}><option value="">Select…</option>{colleges.map((c) => <option key={c._id} value={c._id}>{c.shortName}</option>)}</select></Field><Field label="Company *"><select required className={inputCls} value={rec.companyId} onChange={(e) => setRec({ ...rec, companyId: e.target.value })}><option value="">Select…</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Year *"><input type="number" required className={inputCls} value={rec.hiringYear} onChange={(e) => setRec({ ...rec, hiringYear: Number(e.target.value) })} /></Field><Field label="Season"><select className={inputCls} value={rec.hiringSeason} onChange={(e) => setRec({ ...rec, hiringSeason: e.target.value })}>{['On-Campus', 'Off-Campus', 'Pool-Campus', 'Internship'].map((s) => <option key={s}>{s}</option>)}</select></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Students hired"><input type="number" className={inputCls} value={rec.studentsHired} onChange={(e) => setRec({ ...rec, studentsHired: e.target.value })} /></Field><Field label="Package"><input className={inputCls} value={rec.packageOffered} onChange={(e) => setRec({ ...rec, packageOffered: e.target.value })} placeholder="24 LPA" /></Field></div>
          <Field label="Roles"><input className={inputCls} value={rec.roles} onChange={(e) => setRec({ ...rec, roles: e.target.value })} placeholder="SDE-1, Data Engineer" /></Field>
          <button disabled={busy === 'rec'} className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/10 py-2.5 text-[13px] font-semibold text-sky-300 hover:bg-sky-400/20 disabled:opacity-50">{busy === 'rec' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add record</button>
        </form>
      </div>

      <Card>
        <SectionTitle icon={FileText} title="Recent placement records" sub="Latest 100 across all colleges" />
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr className="border-b border-white/[0.06]">{['Year', 'College', 'Company', 'Hired', 'Package', 'Roles', ''].map((h) => <th key={h} className="pb-2.5 pr-4 font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-zinc-600">{h}</th>)}</tr></thead>
          <tbody>{records.slice(0, 30).map((r) => <tr key={r._id} className="border-b border-white/[0.03] text-[12.5px]"><td className="py-2.5 pr-4 font-mono text-zinc-300">{r.hiringYear}</td><td className="pr-4 text-zinc-400">{r.collegeId?.shortName}</td><td className="pr-4 text-zinc-200">{r.companyId?.name}</td><td className="pr-4 font-mono text-zinc-400">{r.studentsHired ?? '—'}</td><td className="pr-4 font-mono text-zinc-400">{r.packageOffered?.ctc || '—'}</td><td className="pr-4 text-zinc-500">{(r.roles || []).slice(0, 2).join(', ')}</td><td className="text-right"><button onClick={async () => { await adminService.deletePlacementRecord(r._id); toast.info('Record removed'); loadAll(); }} className="text-zinc-700 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3"><Shield className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.6} /><span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-200">Admin</span><span className="mx-1 hidden h-3 w-px bg-white/[0.06] sm:block" /><span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 sm:block">Placement cell control room</span></div>
        <div className="flex items-center gap-2 font-mono text-[10px]"><span className="text-zinc-600">signed in as</span><span className="text-violet-400">{user.name}</span><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" /></div>
      </header>
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.04] bg-black/10 px-6 py-3 md:px-10">
        {TABS.map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={cn('flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all', tab === k ? 'border border-violet-500/20 bg-violet-500/10 text-violet-300' : 'text-zinc-600 hover:bg-white/[0.03] hover:text-zinc-300')}><I className="h-3.5 w-3.5" strokeWidth={1.6} />{l}</button>)}
      </div>
      <div className="max-w-[1400px] px-6 py-8 md:px-10">
        {tab === 'overview' && <OverviewTab onGoto={setTab} />}
        {tab === 'curriculum' && <CurriculumTab />}
        {tab === 'students' && <StudentsTab me={user._id} />}
        {tab === 'experiences' && <ExperiencesTab />}
        {tab === 'problems' && <ProblemsTab />}
        {tab === 'add' && <AddDataTab />}
      </div>
    </div>
  );
}
