import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, Zap, GraduationCap, KeyRound, ShieldCheck, LogOut, Loader2, CheckCircle2, Lock, Award, Bookmark, Target, TrendingUp, Activity, Brain,
  Eye, EyeOff, Trash2, Sparkles, Snowflake, Gauge, Save, Volume2, Clock, ExternalLink, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { analyticsService, engagementService, usersService, authService, companiesService, arenaService } from '../../services/api';
import { CollegeSelector } from '../placement/CollegeSelector';
import { MasteryTrendChart, SkillRadarChart } from '../dashboard/charts';
import { SkillLedger, InsightsPanel, tierFor, timeAgo } from '../dashboard/widgets';
import { ActivityHeatmap } from '../ui/activity-heatmap';
import { Card, Label, SectionTitle, Stat, Bar, Ring, Pill, DiffPill, Skeleton, EmptyState, CountUp, achievementIcon, rarityStyle, cn } from '../ui/kit';

const inputCls = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-zinc-200 outline-none transition-all placeholder:text-zinc-700 hover:border-white/[0.14] focus:border-[var(--signal)]/50';

function AiSettings({ status, onChange }) {
  const toast = useToast();
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await usersService.configGeminiKey(key.trim());
      toast.success(key.trim() ? 'Gemini key saved' : 'Key removed', r.data.data.message);
      setKey('');
      onChange();
    } catch (e) {
      toast.error('Key rejected', e.response?.data?.message);
    } finally { setBusy(false); }
  };

  const Row = ({ ok, label, hint }) => (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"><div><div className="text-[12.5px] text-zinc-300">{label}</div><div className="text-[11px] text-zinc-600">{hint}</div></div><Pill tone={ok ? 'green' : 'zinc'}>{ok ? 'active' : 'off'}</Pill></div>
  );

  return (
    <Card id="ai">
      <SectionTitle icon={KeyRound} title="AI settings · bring your own key" sub="Your free Gemini key powers AI hints, the experience parser, prep plans and your dashboard tip on your own quota — stored AES-256 encrypted, never shown again." />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2.5">
          <Row ok={status?.byok} label="Your Gemini key (BYOK)" hint="Unlimited hints, highest priority" />
          <Row ok={status?.platformGemini} label="Platform Gemini" hint={`${status?.byok ? 'Fallback' : 'Shared'} quota — 15 free AI hints/day`} />
          <Row ok={status?.groq} label="Groq fallback" hint="Used automatically when Gemini is overloaded" />
          {!status?.available && <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 text-[12px] leading-relaxed text-amber-100">No AI provider is configured on this server. Everything still works with smart offline fallbacks — add a key to unlock AI.</div>}
        </div>
        <div>
          <Label className="mb-2 block">Gemini API key</Label>
          <div className="flex items-center gap-2"><div className="relative flex-1"><input type={show ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} placeholder={status?.byok ? '•••••••••••• (saved — paste to replace)' : 'AIza…'} className={cn(inputCls, 'pr-10 font-mono text-[12px]')} autoComplete="off" /><button onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            <button onClick={save} disabled={busy || !key.trim()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-[12.5px] font-semibold text-black hover:brightness-110 disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Verify & save</button></div>
          <p className="mt-2 text-[11.5px] text-zinc-600">Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200">aistudio.google.com/apikey</a>. We verify it with Google before saving.</p>
          {status?.byok && <button onClick={() => { setKey(''); usersService.configGeminiKey('').then(() => { toast.info('Key removed'); onChange(); }); }} className="mt-3 flex items-center gap-1.5 text-[11.5px] text-rose-400/80 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Remove saved key</button>}
        </div>
      </div>
    </Card>
  );
}

export function ProfileView() {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [bookmarks, setBookmarks] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [arena, setArena] = useState(null);
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [sound, setSound] = useState(() => localStorage.getItem('cc_sound') !== 'off');
  const [badgeFilter, setBadgeFilter] = useState('all');

  const loadAi = () => engagementService.getAiStatus().then((r) => setAiStatus(r.data.data)).catch(() => {});

  useEffect(() => {
    analyticsService.getLearningProfile().then((r) => setProfile(r.data.data)).catch(() => {});
    engagementService.getAchievements().then((r) => setAchievements(r.data.data)).catch(() => {});
    engagementService.getBookmarks().then((r) => setBookmarks(r.data.data.bookmarks)).catch(() => {});
    companiesService.getCompanies().then((r) => setCompanies(r.data.data)).catch(() => {});
    arenaService.getRating().then((r) => setArena(r.data.data || r.data)).catch(() => {});
    usersService.getProfile().then((r) => { setMe(r.data.data); setRole(r.data.data.user.targetRole || ''); setCompany(r.data.data.user.targetCompanyId?._id || ''); }).catch(() => {});
    loadAi();
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const t = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    return () => clearTimeout(t);
  }, [location.hash, profile, achievements]);

  const u = me?.user || user;
  const level = u?.level || 1;
  const initials = (u?.name || 'CC').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const college = u?.collegeId && typeof u.collegeId === 'object' ? u.collegeId : null;

  const savePlacement = async (patch) => {
    setSaving(true);
    try {
      const r = await usersService.updateProfile(patch);
      setMe((m) => ({ ...m, user: { ...m.user, ...r.data.data.user } }));
      await refreshUser();
      toast.success('Profile updated');
    } catch (e) { toast.error('Could not save', e.response?.data?.message); } finally { setSaving(false); }
  };

  const bootstrap = async () => {
    try {
      const r = await authService.bootstrapAdmin();
      if (r.data.data?.token) { localStorage.setItem('cc_token', r.data.data.token); }
      await refreshUser();
      toast.success('You are now an admin', 'The Admin section is available in the sidebar.');
    } catch (e) { toast.error('Not allowed', e.response?.data?.message || 'Admin bootstrap is disabled in production once an admin exists.'); }
  };

  const filteredBadges = useMemo(() => (achievements?.achievements || []).filter((a) => badgeFilter === 'all' || (badgeFilter === 'unlocked' ? a.unlocked : !a.unlocked)), [achievements, badgeFilter]);
  const v = profile?.velocity;

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3 text-[13px] text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" /><span className="font-semibold text-zinc-200">Profile</span></div>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:border-rose-400/30 hover:text-rose-300"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        {/* Identity */}
        <Card className="overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--signal)]/[0.08] blur-[80px]" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-sky-500/20 text-[26px] font-semibold text-zinc-100 ring-1 ring-white/10">{initials}<span className="absolute -bottom-1.5 -right-1.5 rounded-lg bg-[#0b0f15] px-1.5 py-0.5 font-mono text-[10px] text-emerald-300 ring-1 ring-emerald-400/30">L{level}</span></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[26px] font-semibold tracking-tight text-zinc-50">{u?.name}</h1><Pill tone="green">{tierFor(level)}</Pill>{u?.role === 'admin' && <Pill tone="violet" icon={ShieldCheck}>Admin</Pill>}</div>
                <div className="mt-1 text-[12.5px] text-zinc-500">{u?.email}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-zinc-500">{college && <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{college.shortName || college.name}</span>}{u?.targetRole && <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />{u.targetRole}{u.targetCompanyId?.name ? ` @ ${u.targetCompanyId.name}` : ''}</span>}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-3 text-center"><div className="text-[24px] font-semibold tabular-nums text-amber-300"><CountUp value={u?.xp || 0} /></div><Label className="text-zinc-600">XP</Label></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-3 text-center"><div className="flex items-center justify-center gap-1 text-[24px] font-semibold tabular-nums text-orange-300"><Flame className="h-5 w-5" />{u?.streakInfo?.streak ?? u?.streak ?? 0}</div><Label className="text-zinc-600">Streak</Label></div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-3 text-center"><div className="flex items-center justify-center gap-1.5 text-[24px] font-semibold tabular-nums text-sky-300"><Snowflake className="h-5 w-5" />{u?.streakInfo?.freezeAvailable ? 1 : 0}</div><Label className="text-zinc-600">Freeze</Label></div>
              {arena && <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-3 text-center"><div className="text-[24px] font-semibold tabular-nums text-rose-300">{arena.elo ?? 1000}</div><Label className="text-zinc-600">Arena · {arena.rank || 'Silver'}</Label></div>}
            </div>
          </div>
        </Card>

        {/* Learning velocity */}
        {!profile ? <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div> : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Learning velocity" icon={Gauge} value={<>{v.masteryPerWeek >= 0 ? '+' : ''}{(v.masteryPerWeek * 100).toFixed(1)}<span className="ml-1 text-[13px] font-normal text-zinc-500">pts/wk</span></>} sub={`${v.masteryPerMonth >= 0 ? '+' : ''}${(v.masteryPerMonth * 100).toFixed(1)} pts over 30 days`} />
              <Stat label="Consistency" icon={Activity} accent="blue" value={<>{v.consistency}<span className="ml-1 text-[13px] font-normal text-zinc-500">%</span></>} sub={`${v.activeDaysLast14} of last 14 days active`} />
              <Stat label="Solved this week" icon={Target} accent="violet" value={v.solvedThisWeek} sub={`${profile.totals.solved} of ${profile.totals.catalogue} overall`} />
              <Stat label="Fastest growing" icon={TrendingUp} accent="amber" value={<span className="text-[18px]">{v.fastestGrowing?.name || '—'}</span>} sub={v.fastestGrowing ? `+${(v.fastestGrowing.velocity * 100).toFixed(1)} pts / attempt` : 'keep practising'} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card>
                <SectionTitle icon={Brain} title="Strengths & weaknesses" sub="From your BKT mastery, compared against the cohort." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><Label className="mb-2.5 block text-emerald-400/80">Strengths</Label><div className="space-y-2.5">{profile.strengths.map((s) => <div key={s.name}><div className="mb-1 flex justify-between text-[12.5px]"><span className="text-zinc-200">{s.name}</span><span className="font-mono text-emerald-400">{Math.round(s.masteryP * 100)}%</span></div><Bar value={s.masteryP} max={1} height={5} color="#34d399" />{s.cohortDelta > 0.05 && <div className="mt-0.5 font-mono text-[9.5px] text-zinc-600">+{Math.round(s.cohortDelta * 100)} vs cohort</div>}</div>)}{!profile.strengths.length && <p className="text-[12px] text-zinc-600">Solve a few problems first.</p>}</div></div>
                  <div><Label className="mb-2.5 block text-rose-400/80">Needs work</Label><div className="space-y-2.5">{profile.weaknesses.map((s) => <div key={s.name}><div className="mb-1 flex justify-between text-[12.5px]"><span className="text-zinc-200">{s.name}</span><span className="font-mono text-rose-400">{Math.round(s.masteryP * 100)}%</span></div><Bar value={s.masteryP} max={1} height={5} color="#fb7185" />{s.predictedAttemptsToMastery && <div className="mt-0.5 font-mono text-[9.5px] text-zinc-600">~{s.predictedAttemptsToMastery} solid attempts to master</div>}</div>)}{!profile.weaknesses.length && <p className="text-[12px] text-zinc-600">Nothing yet.</p>}</div></div>
                </div>
              </Card>
              <Card><SectionTitle icon={Sparkles} title="Personalised insights" /><InsightsPanel insights={profile.insights} /></Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card><SectionTitle icon={TrendingUp} title="Mastery over time" /><MasteryTrendChart timeline={profile.masteryTimeline} skills={profile.skills} height={230} /></Card>
              <Card><SectionTitle icon={Activity} title="Skill radar" /><SkillRadarChart skills={profile.skills} height={280} /></Card>
            </div>

            <Card><SectionTitle icon={Target} title="Skill breakdown" sub="Mastery, cohort comparison, trend and predicted time to mastery." /><SkillLedger skills={profile.skills} /></Card>
            <Card><SectionTitle icon={Clock} title="Activity" /><ActivityHeatmap dateMap={profile.activity} /></Card>
          </>
        )}

        {/* Achievements */}
        <Card id="badges">
          <SectionTitle icon={Award} title="Achievements" sub={achievements ? `${achievements.unlocked} of ${achievements.total} unlocked` : ''} action={<div className="flex items-center gap-1 rounded-lg border border-white/[0.07] p-[3px]">{['all', 'unlocked', 'locked'].map((f) => <button key={f} onClick={() => setBadgeFilter(f)} className={cn('rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider', badgeFilter === f ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200')}>{f}</button>)}</div>} />
          {!achievements ? <Skeleton className="h-40" /> : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBadges.map((a, i) => {
                const Icon = achievementIcon(a.icon);
                const r = rarityStyle(a.rarity);
                return (
                  <motion.div key={a.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }} className={cn('flex items-start gap-3.5 rounded-2xl border p-4 transition-all', a.unlocked ? r.ring : 'border-white/[0.05] bg-white/[0.015] text-zinc-600')}>
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', a.unlocked ? 'bg-black/25' : 'bg-white/[0.04]')}>{a.unlocked ? <Icon className="h-5 w-5" strokeWidth={1.6} /> : <Lock className="h-4 w-4" />}</span>
                    <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={cn('truncate text-[13px] font-semibold', a.unlocked ? 'text-zinc-100' : 'text-zinc-500')}>{a.title}</span><span className="font-mono text-[8.5px] uppercase tracking-wider opacity-70">{r.label}</span></div><p className="mt-0.5 text-[11.5px] leading-snug opacity-70">{a.desc}</p>
                      {a.unlocked ? <div className="mt-1.5 font-mono text-[9.5px] opacity-60">Unlocked {timeAgo(a.unlockedAt)} · +{a.xp} XP</div> : <div className="mt-2"><Bar value={a.progress.current} max={a.progress.target} height={3} color="#71717a" /><div className="mt-1 font-mono text-[9.5px] text-zinc-600">{a.progress.current} / {a.progress.target}</div></div>}</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Bookmarks + recent */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card id="bookmarks">
            <SectionTitle icon={Bookmark} title="Bookmarked problems" />
            {!bookmarks ? <Skeleton className="h-32" /> : bookmarks.length === 0 ? <EmptyState icon={Bookmark} title="No bookmarks yet" text="Tap the bookmark icon on any problem to save it for later." className="py-8" /> : (
              <div className="space-y-2">{bookmarks.map((b) => <Link key={b._id} to={`/problems/${b._id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:bg-white/[0.05]"><div className="flex min-w-0 items-center gap-2.5">{b.solved ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-white/15" />}<span className="truncate text-[13px] text-zinc-200 group-hover:text-[var(--signal)]">{b.title}</span></div><div className="flex shrink-0 items-center gap-2"><span className="hidden font-mono text-[10px] text-zinc-600 sm:inline">{b.skill}</span><DiffPill difficulty={b.difficulty} /></div></Link>)}</div>
            )}
          </Card>
          <Card>
            <SectionTitle icon={Activity} title="Recent activity" />
            <div className="space-y-2">{(me?.recentSubmissions || []).map((s) => <Link key={s._id} to={`/problems/${s.problemId?._id}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 hover:bg-white/[0.05]"><div className="flex min-w-0 items-center gap-2.5"><span className={cn('h-2 w-2 shrink-0 rounded-full', s.isCorrect ? 'bg-emerald-400' : 'bg-rose-400')} /><span className="truncate text-[13px] text-zinc-300">{s.problemId?.title}</span></div><div className="flex shrink-0 items-center gap-3 font-mono text-[10px] text-zinc-600">{s.xpAwarded > 0 && <span className="text-amber-400">+{s.xpAwarded}</span>}<span>{timeAgo(s.createdAt)}</span></div></Link>)}{me && !me.recentSubmissions?.length && <p className="py-6 text-center text-[12.5px] text-zinc-600">No activity yet.</p>}</div>
          </Card>
        </div>

        {/* Placement profile */}
        <Card id="placement">
          <SectionTitle icon={GraduationCap} title="Placement profile" sub="Your college scopes the Placement dashboard and peer comparisons; your target sharpens recommendations." />
          <div className="grid gap-5 lg:grid-cols-3">
            <div><Label className="mb-2 block">College</Label><CollegeSelector value={college} onChange={(c) => savePlacement({ collegeId: c ? c._id : null })} disabled={saving} /></div>
            <div><Label className="mb-2 block">Target company</Label><select value={company} onChange={(e) => { setCompany(e.target.value); savePlacement({ targetCompanyId: e.target.value || null }); }} className={inputCls}><option value="">None</option>{companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><Label className="mb-2 block">Target role</Label><div className="flex gap-2"><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="SDE-1, Data Analyst…" className={inputCls} /><button onClick={() => savePlacement({ targetRole: role })} disabled={saving} className="rounded-xl border border-white/[0.1] px-4 text-[12px] text-zinc-300 hover:bg-white/[0.05]">Save</button></div></div>
          </div>
        </Card>

        <AiSettings status={aiStatus} onChange={loadAi} />

        {/* Preferences + admin */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle icon={Volume2} title="Preferences" />
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"><span className="text-[13px] text-zinc-300">Success sound on accepted solutions</span><input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); localStorage.setItem('cc_sound', e.target.checked ? 'on' : 'off'); }} className="h-4 w-4 accent-emerald-400" /></label>
            <p className="mt-3 text-[11.5px] leading-relaxed text-zinc-600">Editor keybindings and language are remembered per browser (Workspace → ⚙).</p>
          </Card>
          <Card>
            <SectionTitle icon={ShieldCheck} title="Admin access" sub="For placement-cell staff. In development this button promotes your account; in production it only works while no admin exists." />
            {u?.role === 'admin' ? <div className="flex items-center justify-between rounded-xl border border-violet-400/20 bg-violet-400/[0.06] px-4 py-3"><span className="flex items-center gap-2 text-[13px] text-violet-200"><ShieldCheck className="h-4 w-4" /> You are an admin</span><Link to="/admin" className="flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-wider text-violet-300 hover:text-violet-100">Open panel <ExternalLink className="h-3 w-3" /></Link></div>
              : <button onClick={bootstrap} className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 py-3 text-[13px] font-semibold text-violet-300 transition-colors hover:bg-violet-400/20"><ShieldCheck className="h-4 w-4" /> Become admin (dev)</button>}
          </Card>
        </div>
      </div>
    </div>
  );
}
