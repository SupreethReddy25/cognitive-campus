import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Eye, EyeOff, Flame, Loader2, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { analyticsService, engagementService, usersService, authService, companiesService, arenaService } from '../../services/api';
import { CollegeSelector } from '../placement/CollegeSelector';
import { MasteryTrendChart } from '../dashboard/charts';
import { SkillLedger, InsightsPanel, Badge, tierFor, timeAgo } from '../dashboard/widgets';
import { ActivityHeatmap } from '../ui/activity-heatmap';
import { CountUp, Page, Skeleton, cn } from '../ui/kit';

const line = 'w-full border-b border-[var(--line-strong)] bg-transparent pb-1 text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-[var(--ember)]';
const chip = (on) => cn('rounded-sm border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', on ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200');
const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };

function Section({ id, title, kicker, children }) {
  return (
    <section id={id} className="scroll-mt-10 pt-24">
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-[var(--line-strong)] pb-4">
        <h2 className="display text-[clamp(29px,3.9vw,48px)] text-zinc-50">{title}</h2>
        {kicker && <div className="hidden max-w-sm pb-1.5 text-right text-[13px] leading-snug text-zinc-500 md:block">{kicker}</div>}
      </div>
      {children}
    </section>
  );
}

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
    <div className="flex items-center justify-between gap-6 border-b border-[var(--line)] py-4"><div><div className="text-[16px] text-zinc-200">{label}</div><div className="text-[13px] text-zinc-600">{hint}</div></div><span className={cn('flex items-center gap-2 text-[13px]', ok ? 'text-emerald-400' : 'text-zinc-600')}><span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-400' : 'bg-zinc-600')} />{ok ? 'active' : 'off'}</span></div>
  );

  return (
    <div className="grid gap-16 lg:grid-cols-2">
      <div>
        <p className="mb-6 max-w-md text-[16px] leading-relaxed text-zinc-400">Your free Gemini key powers AI hints, the experience parser, prep plans and your dashboard line on <em>your</em> quota. It&apos;s stored AES-256 encrypted and never shown again.</p>
        <Row ok={status?.byok} label="Your Gemini key" hint="Unlimited hints, highest priority" />
        <Row ok={status?.platformGemini} label="Platform Gemini" hint={status?.byok ? 'Fallback quota' : 'Shared quota — limited hints per day'} />
        <Row ok={status?.groq} label="Groq fallback" hint="Takes over automatically when Gemini is overloaded" />
        {!status?.available && <p className="mt-5 border-l-2 border-[var(--star)] pl-4 text-[13.5px] leading-relaxed text-zinc-400">No AI provider is configured on this server. Everything keeps working with smart offline fallbacks — add a key to unlock the real thing.</p>}
      </div>
      <div className="self-end">
        <label className="text-[13px] text-zinc-500">Gemini API key</label>
        <div className="mt-2 flex items-end gap-4">
          <div className="relative flex-1"><input type={show ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} placeholder={status?.byok ? 'saved — paste to replace' : 'AIza…'} className={cn(line, 'pr-8 font-mono text-[15px]')} autoComplete="off" /><button onClick={() => setShow((s) => !s)} className="absolute bottom-1.5 right-0 text-zinc-600 hover:text-zinc-300">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          <button onClick={save} disabled={busy || !key.trim()} className="btn-line group">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Verify &amp; save</button>
        </div>
        <p className="mt-3 text-[12.5px] text-zinc-600">Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-100">aistudio.google.com/apikey</a> — we verify it with Google before saving.</p>
        {status?.byok && <button onClick={() => { usersService.configGeminiKey('').then(() => { toast.info('Key removed'); onChange(); }); }} className="mt-4 flex items-center gap-1.5 text-[13px] text-rose-400/80 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Remove saved key</button>}
      </div>
    </div>
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
    if (!location.hash) return undefined;
    const t = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
    return () => clearTimeout(t);
  }, [location.hash, profile, achievements]);

  const u = me?.user || user;
  const level = u?.level || 1;
  const initials = (u?.name || 'CC').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const college = u?.collegeId && typeof u.collegeId === 'object' ? u.collegeId : null;
  const streak = u?.streakInfo?.streak ?? u?.streak ?? 0;

  const savePlacement = async (patch) => {
    setSaving(true);
    try {
      const r = await usersService.updateProfile(patch);
      setMe((m) => ({ ...m, user: { ...m.user, ...r.data.data.user } }));
      await refreshUser();
      toast.success('Saved');
    } catch (e) { toast.error('Could not save', e.response?.data?.message); } finally { setSaving(false); }
  };

  const bootstrap = async () => {
    try {
      const r = await authService.bootstrapAdmin();
      if (r.data.data?.token) localStorage.setItem('cc_token', r.data.data.token);
      await refreshUser();
      toast.success('You are now an admin', 'The Admin room is in your account menu.');
    } catch (e) { toast.error('Not allowed', e.response?.data?.message || 'Admin bootstrap is disabled once an admin exists.'); }
  };

  const shelf = useMemo(() => (achievements?.achievements || []).filter((a) => badgeFilter === 'all' || (badgeFilter === 'earned' ? a.unlocked : !a.unlocked)), [achievements, badgeFilter]);
  const v = profile?.velocity;

  return (
    <Page>
      {/* ═══ Identity ═══ */}
      <header className="pt-2 md:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="tag">Profile</div>
          <button onClick={logout} className="flex items-center gap-2 rounded-sm border border-[var(--line-strong)] px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:border-rose-400/40 hover:text-rose-300"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6">
          <span className="flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full bg-[var(--ember)] text-[48px] font-semibold text-[#04130d]"><span className="display text-[51.2px] not-italic">{initials}</span></span>
          <div className="min-w-0">
            <h1 className="display text-[clamp(42px,6.8vw,96px)] text-zinc-50">{u?.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-zinc-500">
              <span>Level {level} · {tierFor(level)}</span>
              {college && <span>{college.shortName || college.name}</span>}
              {u?.targetRole && <span>aiming for {u.targetRole}{u.targetCompanyId?.name ? ` at ${u.targetCompanyId.name}` : ''}</span>}
              {u?.role === 'admin' && <span className="text-[var(--star)]">admin</span>}
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-10 lg:grid-cols-4">
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[57.6px] leading-none tnum text-zinc-50"><CountUp value={u?.xp || 0} /></div><div className="tag mt-3">experience points</div></div>
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display flex items-center gap-2 text-[57.6px] leading-none tnum text-zinc-50"><CountUp value={streak} /><Flame className="h-9 w-9 text-[var(--ember)]" fill="currentColor" fillOpacity={0.25} /></div><div className="tag mt-3">day streak · best {Math.max(u?.longestStreak || 0, streak)}</div></div>
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[57.6px] leading-none tnum text-zinc-50">{arena?.elo ?? 1000}</div><div className="tag mt-3">arena rating · {arena?.rank || 'Silver'}</div></div>
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[57.6px] leading-none tnum text-zinc-50">{achievements?.unlocked ?? '—'}<span className="text-[28px] text-zinc-600">/{achievements?.total ?? 35}</span></div><div className="tag mt-3">badges earned</div></div>
        </div>
      </header>

      {/* ═══ How you learn ═══ */}
      <Section title={<>How you <em>learn</em></>} kicker="From your Bayesian mastery estimates, compared with your cohort.">
        {!profile ? <Skeleton className="h-56" /> : (
          <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="max-w-xl text-[clamp(20px,2.2vw,28px)] leading-[1.45] text-zinc-300">
                Your average mastery is moving <span className={cn('display text-[1.3em] italic', v.masteryPerWeek >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{v.masteryPerWeek >= 0 ? '+' : ''}{(v.masteryPerWeek * 100).toFixed(1)} points</span> a week. You practised on <span className="text-zinc-50">{v.activeDaysLast14} of the last 14 days</span> and solved {v.solvedThisWeek} this week{v.fastestGrowing && <>; <span className="text-zinc-50">{v.fastestGrowing.name}</span> is your fastest riser</>}.
              </p>
              <div className="mt-12 grid gap-10 sm:grid-cols-2">
                <div><div className="mb-4 text-[13px] text-emerald-400/90">Strongest</div>{profile.strengths.map((s) => <div key={s.name} className="flex items-baseline justify-between border-b border-[var(--line)] py-3"><span className="display text-[20.8px] text-zinc-100">{s.name}</span><span className="text-[15px] tnum text-zinc-400">{Math.round(s.masteryP * 100)}%</span></div>)}</div>
                <div><div className="mb-4 text-[13px] text-rose-400/90">Needs work</div>{profile.weaknesses.map((s) => <div key={s.name} className="flex items-baseline justify-between border-b border-[var(--line)] py-3"><span className="display text-[20.8px] text-zinc-100">{s.name}</span><span className="text-[15px] tnum text-zinc-400">{Math.round(s.masteryP * 100)}%</span></div>)}</div>
              </div>
            </div>
            <div><div className="mb-3 text-[13px] text-zinc-500">What the model noticed</div><InsightsPanel insights={profile.insights} /></div>
          </div>
        )}
      </Section>

      <Section title={<>Every <em>skill</em></>} kicker="Mastery, how you compare, and how long the model thinks each will take.">
        {!profile ? <Skeleton className="h-96" /> : (
          <>
            <SkillLedger skills={profile.skills} />
            <div className="mt-16 grid gap-16 lg:grid-cols-[1.4fr_1fr]">
              <div><div className="mb-4 text-[13px] text-zinc-500">Mastery over the last 30 days</div><MasteryTrendChart timeline={profile.masteryTimeline} skills={profile.skills} height={260} /></div>
              <div><div className="mb-4 text-[13px] text-zinc-500">Last year of practice</div><ActivityHeatmap dateMap={profile.activity} /></div>
            </div>
          </>
        )}
      </Section>

      {/* ═══ Badges ═══ */}
      <Section id="badges" title={<>Trophy <em>shelf</em></>} kicker={achievements ? `${achievements.unlocked} of ${achievements.total} earned. Hover for what it takes.` : ''}>
        <div className="mb-10 flex gap-1.5">{[['all', 'All'], ['earned', 'Earned'], ['locked', 'Still to earn']].map(([k, l]) => <button key={k} onClick={() => setBadgeFilter(k)} className={chip(badgeFilter === k)}>{l}</button>)}</div>
        {!achievements ? <Skeleton className="h-48" /> : (
          <div className="flex flex-wrap gap-x-4 gap-y-10">
            {shelf.map((a, i) => (
              <motion.div key={a.key} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.02, 0.3) }}><Badge a={a} /></motion.div>
            ))}
          </div>
        )}
      </Section>

      {/* ═══ Saved & recent ═══ */}
      <Section id="bookmarks" title={<>Saved &amp; <em>recent</em></>}>
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-[13px] text-zinc-500">Bookmarked problems</div>
            {!bookmarks ? <Skeleton className="h-32" /> : bookmarks.length === 0 ? <p className="py-6 text-[15px] text-zinc-600">Nothing saved. Tap the bookmark on any problem to keep it for later.</p> : bookmarks.map((b) => (
              <Link key={b._id} to={`/problems/${b._id}`} className="group flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <span className="flex min-w-0 items-center gap-3">{b.solved ? <Check className="h-4 w-4 shrink-0 text-emerald-400" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-zinc-700" />}<span className="truncate text-[17px] text-zinc-200 group-hover:text-[var(--ember)]">{b.title}</span></span>
                <span className="flex shrink-0 items-center gap-2 text-[13px] capitalize text-zinc-500"><span className={cn('h-1.5 w-1.5 rounded-full', DOT[b.difficulty])} />{b.difficulty}</span>
              </Link>
            ))}
          </div>
          <div>
            <div className="mb-3 text-[13px] text-zinc-500">Recent submissions</div>
            {(me?.recentSubmissions || []).map((s) => (
              <Link key={s._id} to={`/problems/${s.problemId?._id}`} className="group flex items-center justify-between gap-4 border-b border-[var(--line)] py-3.5">
                <span className="flex min-w-0 items-center gap-3"><span className={cn('h-2 w-2 shrink-0 rounded-full', s.isCorrect ? 'bg-emerald-400' : 'bg-zinc-600')} /><span className="truncate text-[17px] text-zinc-300 group-hover:text-[var(--ember)]">{s.problemId?.title}</span></span>
                <span className="shrink-0 text-[13px] text-zinc-600">{s.xpAwarded > 0 && <span className="mr-3 text-[var(--star)]">+{s.xpAwarded}</span>}{timeAgo(s.createdAt)}</span>
              </Link>
            ))}
            {me && !me.recentSubmissions?.length && <p className="py-6 text-[15px] text-zinc-600">No activity yet.</p>}
          </div>
        </div>
      </Section>

      {/* ═══ Mad-lib placement profile ═══ */}
      <Section id="placement" title={<>In a <em>sentence</em></>} kicker="Your college scopes Placement and peer comparisons; your target sharpens recommendations.">
        <div className="max-w-4xl text-[clamp(22px,2.6vw,34px)] leading-[2] text-zinc-400">
          I study at <span className="inline-block min-w-[280px] align-middle"><CollegeSelector value={college} onChange={(c) => savePlacement({ collegeId: c ? c._id : null })} disabled={saving} /></span>, and I&apos;m aiming for a job at{' '}
          <select value={company} onChange={(e) => { setCompany(e.target.value); savePlacement({ targetCompanyId: e.target.value || null }); }} className="display cursor-pointer border-b border-dashed border-[var(--ember)] bg-transparent px-1 text-[1em] text-[var(--ember-soft)] outline-none"><option value="" className="bg-[#0d0d0d] text-zinc-300">any company</option>{companies.map((c) => <option key={c._id} value={c._id} className="bg-[#0d0d0d] text-zinc-200">{c.name}</option>)}</select>
          {' '}as a{' '}
          <input value={role} onChange={(e) => setRole(e.target.value)} onBlur={() => role !== (u?.targetRole || '') && savePlacement({ targetRole: role })} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} placeholder="SDE-1" className="display w-[190px] border-b border-dashed border-[var(--ember)] bg-transparent px-1 text-[1em] text-[var(--ember-soft)] outline-none placeholder:text-zinc-700" />.
        </div>
      </Section>

      <Section id="ai" title={<>AI <em>settings</em></>} kicker="Bring your own key, or lean on the platform's.">
        <AiSettings status={aiStatus} onChange={loadAi} />
      </Section>

      <Section title={<>The <em>small</em> stuff</>}>
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <label className="flex cursor-pointer items-center justify-between border-b border-[var(--line)] py-4">
              <span><span className="block text-[16px] text-zinc-200">Success sound</span><span className="text-[13px] text-zinc-600">A short chime when a solution is accepted</span></span>
              <span className={cn('relative h-6 w-11 rounded-full transition-colors', sound ? 'bg-[var(--ember)]' : 'bg-white/[0.12]')}><input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); localStorage.setItem('cc_sound', e.target.checked ? 'on' : 'off'); }} className="peer sr-only" /><span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-[#04130d] transition-all', sound ? 'left-[22px]' : 'left-0.5 bg-zinc-300')} /></span>
            </label>
            <p className="mt-4 text-[13px] text-zinc-600">Editor language and keybindings are remembered per browser.</p>
          </div>
          <div>
            {u?.role === 'admin'
              ? <div className="flex items-center justify-between border-b border-[var(--line)] py-4"><span className="flex items-center gap-2 text-[16px] text-zinc-200"><ShieldCheck className="h-4 w-4 text-[var(--star)]" /> You&apos;re an admin</span><Link to="/admin" className="flex items-center gap-1.5 text-[14px] text-[var(--ember)] hover:underline">Open the admin room <ArrowUpRight className="h-4 w-4" /></Link></div>
              : <div className="flex items-center justify-between border-b border-[var(--line)] py-4"><span><span className="block text-[16px] text-zinc-200">Placement-cell access</span><span className="text-[13px] text-zinc-600">In development this promotes your account; in production it only works while no admin exists.</span></span><button onClick={bootstrap} className="shrink-0 rounded-sm border border-[var(--line-strong)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)]">Become admin</button></div>}
          </div>
        </div>
      </Section>
    </Page>
  );
}
