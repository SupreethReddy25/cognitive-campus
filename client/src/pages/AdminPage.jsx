import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, companiesService, collegesService } from '../services/api';
import {
  Shield, Users, BookOpen, FileText, TrendingUp, Check, X,
  Loader2, AlertCircle, ChevronDown, ChevronUp, Search,
  Building2, GraduationCap, Sparkles, ArrowUpRight,
  RefreshCw, UserCheck, Layers, BarChart2
} from 'lucide-react';

// ─── Shared primitives ───────────────────────────────────────────────────────
const Badge = ({ children, color = 'zinc' }) => {
  const colors = {
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:   'bg-sky-500/10 text-sky-400 border-sky-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    zinc:   'bg-white/[0.04] text-zinc-500 border-white/[0.06]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'signal' }) => (
  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
        color === 'signal' ? 'bg-[var(--signal)]/10' : 'bg-violet-500/10'
      }`}>
        <Icon className={`h-4.5 w-4.5 ${color === 'signal' ? 'text-[var(--signal)]' : 'text-violet-400'}`} strokeWidth={1.6} />
      </div>
    </div>
    <div className="text-2xl font-bold text-zinc-100 tabular-nums">{value ?? '—'}</div>
    <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
    {sub && <div className="text-[10px] text-zinc-700 mt-1 font-mono">{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">{title}</h2>
      {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── Tab: Overview ───────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats]     = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.getStats(), adminService.getHeatmap()])
      .then(([s, h]) => {
        if (s.data.success) setStats(s.data.data);
        if (h.data.success) setHeatmap(h.data.data.heatmap || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}    label="Total Students"      value={stats?.totalStudents}         sub="registered accounts" />
        <StatCard icon={FileText} label="Total Submissions"   value={stats?.totalSubmissions}      sub="code runs + submits" />
        <StatCard icon={BookOpen} label="Problems Attempted"  value={stats?.totalProblemsAttempted} sub="distinct problems" color="violet" />
        <StatCard icon={TrendingUp} label="Avg Student XP"   value={stats?.averageXP}             sub={`top: ${stats?.mostAttemptedProblem?.title || '—'}`} color="violet" />
      </div>

      {/* Skill Heatmap */}
      <div>
        <SectionHeader title="Cohort Skill Heatmap" sub="Average BKT mastery per skill across all students — lower = cohort struggling" />
        <div className="space-y-2">
          {heatmap.map(row => {
            const pct = Math.round(row.avgMastery * 100);
            const bar = Math.round(row.masteryRate * 100);
            const color = pct >= 70 ? 'bg-[var(--signal)]' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';
            return (
              <div key={row.skillId} className="flex items-center gap-4 py-2 border-b border-white/[0.03]">
                <div className="w-36 shrink-0 text-xs text-zinc-400 font-medium truncate">{row.skillName}</div>
                <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="w-12 text-right font-mono text-[11px] text-zinc-400">{pct}%</div>
                <div className="w-20 text-right font-mono text-[10px] text-zinc-600">{row.totalStudents} students</div>
                <div className="w-20 text-right font-mono text-[10px] text-zinc-600">{bar}% mastered</div>
              </div>
            );
          })}
          {heatmap.length === 0 && (
            <p className="text-xs text-zinc-700 py-4">No skill data yet — students need to make submissions first.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Experiences ────────────────────────────────────────────────────────
function ExperiencesTab() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [working, setWorking]         = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminService.getExperiences({ status: filter, limit: 100 })
      .then(r => { if (r.data.success) setExperiences(r.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(id, action) {
    setWorking(w => ({ ...w, [id]: action }));
    try {
      await adminService.verifyExperience(id, action);
      setExperiences(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(w => { const n = { ...w }; delete n[id]; return n; });
    }
  }

  const STATUS_FILTERS = ['all', 'Published', 'Rejected'];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Interview Experiences"
        sub="Verify community submissions or reject low-quality ones"
        action={
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  filter === f ? 'bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20' : 'text-zinc-600 hover:text-zinc-300'
                }`}>
                {f}
              </button>
            ))}
            <button onClick={load} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        }
      />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {experiences.map(exp => (
            <div key={exp._id} className="flex items-start gap-4 p-4 rounded-lg border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-200">
                    {exp.companyId?.name || 'Unknown'} — {exp.role}
                  </span>
                  <Badge color={exp.offerReceived === 'Yes' ? 'green' : exp.offerReceived === 'No' ? 'red' : 'amber'}>
                    {exp.offerReceived}
                  </Badge>
                  <Badge color={exp.status === 'Published' ? 'green' : exp.status === 'Rejected' ? 'red' : 'amber'}>
                    {exp.status}
                  </Badge>
                  {exp.isVerified && <Badge color="blue">Verified</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono flex-wrap">
                  <span>{exp.collegeId?.name || exp.college || 'College unknown'}</span>
                  {exp.cgpa && <span>· CGPA {exp.cgpa}</span>}
                  <span>· {exp.rounds?.length || 0} rounds</span>
                  <span>· {new Date(exp.createdAt).toLocaleDateString()}</span>
                  {exp.userId?.name && <span>· by {exp.userId.name}</span>}
                  {exp.isAnonymous && <span>· Anonymous</span>}
                </div>
                {exp.overallTips && (
                  <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-1">{exp.overallTips}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => act(exp._id, 'verify')}
                  disabled={!!working[exp._id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {working[exp._id] === 'verify' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Verify
                </button>
                <button
                  onClick={() => act(exp._id, 'reject')}
                  disabled={!!working[exp._id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {working[exp._id] === 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  Reject
                </button>
              </div>
            </div>
          ))}
          {experiences.length === 0 && !loading && (
            <p className="text-xs text-zinc-700 py-8 text-center">No experiences with status "{filter}".</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Problems ───────────────────────────────────────────────────────────
function ProblemsTab() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [working, setWorking]   = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminService.getProblems({ status: filter })
      .then(r => { if (r.data.success) setProblems(r.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id, status) {
    setWorking(w => ({ ...w, [id]: status }));
    try {
      const r = await adminService.updateProblemStatus(id, status);
      if (r.data.success) {
        setProblems(prev => prev.map(p => p._id === id ? { ...p, status, isActive: status === 'approved' } : p));
      }
    } catch (err) { console.error(err); }
    finally { setWorking(w => { const n = { ...w }; delete n[id]; return n; }); }
  }

  const STATUS_FILTERS = ['all', 'quarantine', 'waitlisted', 'approved'];
  const STATUS_COLOR   = { quarantine: 'red', waitlisted: 'amber', approved: 'green' };
  const DIFF_COLOR     = { easy: 'green', medium: 'amber', hard: 'red' };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Problem Review Queue"
        sub="quarantine → waitlisted → approved. Only 'approved' problems appear in the coding judge."
        action={
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  filter === f ? 'bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20' : 'text-zinc-600 hover:text-zinc-300'
                }`}>
                {f}
              </button>
            ))}
            <button onClick={load} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        }
      />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {problems.map(p => (
            <div key={p._id} className="flex items-center gap-4 p-4 rounded-lg border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-200 truncate">{p.title}</span>
                  <Badge color={DIFF_COLOR[p.difficulty]}>{p.difficulty}</Badge>
                  <Badge color={STATUS_COLOR[p.status]}>{p.status}</Badge>
                  {p.skillId?.name && <Badge color="zinc">{p.skillId.name}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono flex-wrap">
                  {p.company && <span>{p.company}</span>}
                  {p.round && <span>· {p.round}</span>}
                  <span>· ↑{p.upvotes || 0} ↓{p.downvotes || 0}</span>
                  <span>· {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.status !== 'waitlisted' && (
                  <button onClick={() => setStatus(p._id, 'waitlisted')} disabled={!!working[p._id]}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                    {working[p._id] === 'waitlisted' ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null} Waitlist
                  </button>
                )}
                {p.status !== 'approved' && (
                  <button onClick={() => setStatus(p._id, 'approved')} disabled={!!working[p._id]}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                    {working[p._id] === 'approved' ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <Check className="h-3 w-3 inline mr-1" />}Approve
                  </button>
                )}
                {p.status !== 'quarantine' && (
                  <button onClick={() => setStatus(p._id, 'quarantine')} disabled={!!working[p._id]}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono hover:bg-red-500/20 transition-colors disabled:opacity-50">
                    Quarantine
                  </button>
                )}
              </div>
            </div>
          ))}
          {problems.length === 0 && !loading && (
            <p className="text-xs text-zinc-700 py-8 text-center">No problems with status "{filter}".</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Students ───────────────────────────────────────────────────────────
function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [working, setWorking]   = useState({});

  useEffect(() => {
    adminService.getStudents()
      .then(r => { if (r.data.success) setStudents(r.data.data.students || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleRole(student) {
    const newRole = student.role === 'admin' ? 'student' : 'admin';
    setWorking(w => ({ ...w, [student._id]: true }));
    try {
      const r = await adminService.updateUserRole(student._id, newRole);
      if (r.data.success) {
        setStudents(prev => prev.map(s => s._id === student._id ? { ...s, role: newRole } : s));
      }
    } catch (err) { console.error(err); }
    finally { setWorking(w => { const n = { ...w }; delete n[student._id]; return n; }); }
  }

  const filtered = students.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="User Management"
        sub="View all students and promote them to admin (placement team access)"
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" strokeWidth={1.6} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-sm text-zinc-300 outline-none focus:border-[var(--signal)]/30 placeholder:text-zinc-700 w-64"
            />
          </div>
        }
      />
      {loading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Name / Email', 'XP / Level', 'Skills Mastered', 'Role', 'Joined', 'Action'].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="text-sm font-medium text-zinc-200">{s.name}</div>
                    <div className="text-[11px] text-zinc-600 font-mono">{s.email}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm text-zinc-300">
                    {s.xp} XP <span className="text-zinc-600 text-[10px]">· Lv.{s.level}</span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-zinc-400">{s.skillsMastered || 0} / 12</td>
                  <td className="py-3 pr-4">
                    <Badge color={s.role === 'admin' ? 'violet' : 'zinc'}>{s.role}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-zinc-600 font-mono">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleRole(s)}
                      disabled={!!working[s._id]}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-colors disabled:opacity-50 ${
                        s.role === 'admin'
                          ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/20'
                          : 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20'
                      }`}
                    >
                      {working[s._id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
                      {s.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <p className="text-xs text-zinc-700 py-8 text-center">No students found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Add Data ───────────────────────────────────────────────────────────
function AddDataTab() {
  const [companies, setCompanies]     = useState([]);
  const [colleges, setColleges]       = useState([]);

  const [collegeForm, setCollegeForm] = useState({ name: '', shortName: '', slug: '', location: '', tier: 'Other', website: '' });
  const [collegeMsg, setCollegeMsg]   = useState(null);
  const [collegeLoading, setCollegeLoading] = useState(false);

  const [recordForm, setRecordForm]   = useState({ collegeId: '', companyId: '', hiringYear: new Date().getFullYear(), hiringSeason: 'On-Campus', roles: '', studentsHired: '', packageOffered: '' });
  const [recordMsg, setRecordMsg]     = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);

  useEffect(() => {
    Promise.all([companiesService.getCompanies(), collegesService.getColleges({ limit: 100 })])
      .then(([c, col]) => {
        if (c.data.success)   setCompanies(c.data.data || []);
        if (col.data.success) setColleges(col.data.data || []);
      })
      .catch(console.error);
  }, []);

  function setC(k, v) { setCollegeForm(p => ({ ...p, [k]: v })); }
  function setR(k, v) { setRecordForm(p => ({ ...p, [k]: v })); }

  async function submitCollege(e) {
    e.preventDefault();
    setCollegeLoading(true); setCollegeMsg(null);
    try {
      const r = await adminService.createCollege(collegeForm);
      if (r.data.success) {
        setCollegeMsg({ type: 'ok', text: `College "${collegeForm.name}" created!` });
        setColleges(prev => [...prev, r.data.data.college]);
        setCollegeForm({ name: '', shortName: '', slug: '', location: '', tier: 'Other', website: '' });
      } else {
        setCollegeMsg({ type: 'err', text: r.data.error || 'Failed' });
      }
    } catch (err) {
      setCollegeMsg({ type: 'err', text: err.response?.data?.error || 'Server error' });
    } finally { setCollegeLoading(false); }
  }

  async function submitRecord(e) {
    e.preventDefault();
    setRecordLoading(true); setRecordMsg(null);
    try {
      const payload = {
        ...recordForm,
        roles: recordForm.roles.split(',').map(r => r.trim()).filter(Boolean),
        studentsHired: +recordForm.studentsHired || undefined,
        packageOffered: recordForm.packageOffered ? { ctc: recordForm.packageOffered } : undefined,
      };
      const r = await adminService.createPlacementRecord(payload);
      if (r.data.success) {
        setRecordMsg({ type: 'ok', text: 'Placement record added!' });
        setRecordForm({ collegeId: '', companyId: '', hiringYear: new Date().getFullYear(), hiringSeason: 'On-Campus', roles: '', studentsHired: '', packageOffered: '' });
      } else {
        setRecordMsg({ type: 'err', text: r.data.error || 'Failed' });
      }
    } catch (err) {
      setRecordMsg({ type: 'err', text: err.response?.data?.error || 'Server error' });
    } finally { setRecordLoading(false); }
  }

  const InputCls = "w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-[var(--signal)]/40 transition-all placeholder:text-zinc-700";
  const LabelCls = "text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Add College */}
      <div>
        <SectionHeader title="Add College" sub="Colleges added here appear in placement intelligence" />
        <form onSubmit={submitCollege} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={LabelCls}>Full Name *</div>
              <input className={InputCls} value={collegeForm.name} onChange={e => setC('name', e.target.value)} placeholder="National Institute of Technology Trichy" required />
            </div>
            <div className="space-y-1.5">
              <div className={LabelCls}>Short Name *</div>
              <input className={InputCls} value={collegeForm.shortName} onChange={e => setC('shortName', e.target.value)} placeholder="NIT Trichy" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={LabelCls}>URL Slug *</div>
              <input className={InputCls} value={collegeForm.slug} onChange={e => setC('slug', e.target.value)} placeholder="nit-trichy" required />
            </div>
            <div className="space-y-1.5">
              <div className={LabelCls}>Location</div>
              <input className={InputCls} value={collegeForm.location} onChange={e => setC('location', e.target.value)} placeholder="Tiruchirappalli, TN" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={LabelCls}>Tier</div>
              <select className={InputCls} value={collegeForm.tier} onChange={e => setC('tier', e.target.value)}>
                {['IIT','NIT','BITS','IIIT','Deemed','State','Private','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className={LabelCls}>Website</div>
              <input className={InputCls} value={collegeForm.website} onChange={e => setC('website', e.target.value)} placeholder="https://nitt.edu" />
            </div>
          </div>
          {collegeMsg && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${collegeMsg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {collegeMsg.text}
            </div>
          )}
          <button type="submit" disabled={collegeLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--signal)]/10 border border-[var(--signal)]/20 text-[var(--signal)] text-sm font-semibold hover:bg-[var(--signal)]/20 transition-colors disabled:opacity-50">
            {collegeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
            Add College
          </button>
        </form>
      </div>

      {/* Add Placement Record */}
      <div>
        <SectionHeader title="Add Placement Record" sub="Structured verified hiring data — appears in college dashboards" />
        <form onSubmit={submitRecord} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={LabelCls}>College *</div>
              <select className={InputCls} value={recordForm.collegeId} onChange={e => setR('collegeId', e.target.value)} required>
                <option value="">Select college...</option>
                {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className={LabelCls}>Company *</div>
              <select className={InputCls} value={recordForm.companyId} onChange={e => setR('companyId', e.target.value)} required>
                <option value="">Select company...</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={LabelCls}>Hiring Year *</div>
              <input type="number" className={InputCls} value={recordForm.hiringYear} onChange={e => setR('hiringYear', +e.target.value)} min="2015" max="2030" required />
            </div>
            <div className="space-y-1.5">
              <div className={LabelCls}>Season</div>
              <select className={InputCls} value={recordForm.hiringSeason} onChange={e => setR('hiringSeason', e.target.value)}>
                {['On-Campus','Off-Campus','Pool-Campus','Internship'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={LabelCls}>Roles (comma-separated)</div>
              <input className={InputCls} value={recordForm.roles} onChange={e => setR('roles', e.target.value)} placeholder="SDE-1, Data Engineer" />
            </div>
            <div className="space-y-1.5">
              <div className={LabelCls}>Students Hired</div>
              <input type="number" className={InputCls} value={recordForm.studentsHired} onChange={e => setR('studentsHired', e.target.value)} placeholder="5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className={LabelCls}>Package / CTC</div>
            <input className={InputCls} value={recordForm.packageOffered} onChange={e => setR('packageOffered', e.target.value)} placeholder="e.g. 24 LPA" />
          </div>
          {recordMsg && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${recordMsg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {recordMsg.text}
            </div>
          )}
          <button type="submit" disabled={recordLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold hover:bg-violet-500/20 transition-colors disabled:opacity-50">
            {recordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            Add Placement Record
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Shared loading ──────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-zinc-700">
      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
      <span className="font-mono text-[10px] tracking-widest uppercase">Loading...</span>
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview',    icon: BarChart2  },
  { id: 'experiences',  label: 'Experiences', icon: FileText   },
  { id: 'problems',     label: 'Problems',    icon: BookOpen   },
  { id: 'students',     label: 'Students',    icon: Users      },
  { id: 'add',          label: 'Add Data',    icon: Sparkles   },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Guard — only admins
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-10 h-12 border-b border-white/[0.04] bg-background/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.6} />
          <span className="font-mono text-[10px] tracking-[0.24em] text-zinc-200 uppercase">Admin Panel</span>
          <span className="mx-2 h-3 w-px bg-white/[0.06]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Placement Intelligence Control</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-600">Logged in as</span>
          <span className="text-[10px] font-mono text-violet-400">{user.name}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
        </div>
      </header>

      {/* Tab Nav */}
      <div className="flex items-center gap-1 px-10 py-3 border-b border-white/[0.04] bg-black/10">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] tracking-widest uppercase transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-10 py-8 max-w-7xl">
        {activeTab === 'overview'    && <OverviewTab />}
        {activeTab === 'experiences' && <ExperiencesTab />}
        {activeTab === 'problems'    && <ProblemsTab />}
        {activeTab === 'students'    && <StudentsTab />}
        {activeTab === 'add'         && <AddDataTab />}
      </div>
    </div>
  );
}
