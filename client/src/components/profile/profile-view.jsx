import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { usersService, submissionsService, skillsService, arenaService, collegesService, authService } from "../../services/api";
import {
  MapPin, Calendar, ExternalLink, Key, ShieldCheck, Eye, EyeOff,
  Edit3, Flame, Zap, CheckCircle2, XCircle, Lock, Unlock,
  TrendingUp, Target, Award, BarChart3, Activity, GraduationCap, Loader2, ArrowRight, Settings as SettingsIcon, LogOut
} from "lucide-react";
import { CollegeSelector } from '../placement/CollegeSelector';
import { Link } from 'react-router-dom';


/* ─── Helpers ──────────────────────────────────────────────── */
function tierColor(tier) {
  const map = { LEGEND: "#f59e0b", ARCHON: "#a855f7", ADEPT: "#38bdf8", APPRENTICE: "#34d399" };
  return map[tier] || "#34d399";
}
function getTier(level) {
  return level >= 40 ? "LEGEND" : level >= 30 ? "ARCHON" : level >= 15 ? "ADEPT" : "APPRENTICE";
}

/* ─── Animated count-up hook ─────────────────────────────── */
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return value;
}

/* ─── Skill mastery row with animated bar ─────────────────── */
function MasteryBar({ label, score, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const pct = Math.round(score);
  const color = pct >= 85 ? "#34d399" : pct >= 60 ? "#38bdf8" : pct >= 35 ? "#fbbf24" : "#a78bfa";

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 font-mono text-[11px] tracking-[0.06em] text-zinc-500 truncate uppercase">{label}</span>
      <div className="relative flex-1 h-[4px] rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: visible ? `${pct}%` : "0%", background: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[12px] tabular-nums font-semibold text-zinc-300">{pct}</span>
      {pct >= 85 && (
        <span className="text-[9px] font-mono text-[var(--signal)] tracking-[0.1em]">✓</span>
      )}
    </div>
  );
}

/* ─── Submission pill ─────────────────────────────────────── */
function SubmissionRow({ sub, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 40);
    return () => clearTimeout(t);
  }, [index]);

  const passed = sub.isCorrect;
  const date = new Date(sub.createdAt);
  const rel = (() => {
    const diff = Date.now() - date.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  })();

  return (
    <div
      className={`flex items-center gap-3 px-0 py-2.5 border-b border-white/[0.04] last:border-0 transition-all duration-300 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
    >
      {passed
        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--signal)]" strokeWidth={1.5} />
        : <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" strokeWidth={1.5} />}
      <span className={`font-mono text-[10px] w-6 shrink-0 ${passed ? "text-[var(--signal)]" : "text-rose-400"}`}>
        {passed ? "AC" : "WA"}
      </span>
      <span className="flex-1 text-[13px] font-medium text-zinc-200 truncate">
        {sub.problemId?.title || "Problem"}
      </span>
      <span className="font-mono text-[10px] text-zinc-600 uppercase shrink-0">
        {(sub.language || "JS").replace("javascript", "JS").replace("python", "PY")}
      </span>
      <span className="font-mono text-[10px] text-zinc-700 shrink-0">{rel}</span>
    </div>
  );
}

/* ─── Main ProfileView ────────────────────────────────────── */
export function ProfileView() {
  const { user, refreshUser } = useAuth();
  const [skillStates, setSkillStates] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [arenaRating, setArenaRating] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── College & Placement Target ────────────────────────────────────
  const [college, setCollege] = useState(
    // If already a populated object (has slug), use it directly
    user?.collegeId && typeof user.collegeId === 'object' && user.collegeId.slug
      ? user.collegeId
      : null
  );
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [savingPlacement, setSavingPlacement] = useState(false);
  const [placementSaved, setPlacementSaved] = useState(false);

  // If collegeId is an ObjectId (not populated), fetch the college details
  useEffect(() => {
    const collegeId = user?.collegeId;
    if (collegeId && typeof collegeId === 'string' && !college) {
      collegesService.getColleges({ limit: 1 }).catch(() => null); // warm up
      // Fetch by _id via search won't work; use usersService.getProfile which populates
      usersService.getProfile()
        .then(res => {
          const u = res.data?.data?.user || res.data?.user;
          if (u?.collegeId && typeof u.collegeId === 'object' && u.collegeId.slug) {
            setCollege(u.collegeId);
          }
        })
        .catch(() => null);
    }
  }, [user?.collegeId]);

  const handleSavePlacement = async () => {
    setSavingPlacement(true);
    try {
      const updates = {};
      if (college !== undefined) updates.collegeId = college?._id || null;
      if (targetRole !== undefined) updates.targetRole = targetRole || null;
      const res = await usersService.updateProfile(updates);
      if (res.data.success) {
        await refreshUser();
        setPlacementSaved(true);
        setTimeout(() => setPlacementSaved(false), 2500);
      }
    } catch { /* silent */ }
    setSavingPlacement(false);
  };


  useEffect(() => {
    Promise.all([
      skillsService.getMySkillStates().catch(() => ({ data: null })),
      submissionsService.getHistory({ limit: 10 }).catch(() => ({ data: null })),
      arenaService.getRating().catch(() => ({ data: null })),
    ]).then(([skillsRes, histRes, arenaRes]) => {
      setSkillStates(skillsRes.data?.data?.skillStates || []);
      const subs = histRes.data?.data?.submissions || histRes.data?.data || [];
      setRecentHistory(Array.isArray(subs) ? subs : []);
      if (arenaRes.data?.data) {
        setArenaRating(arenaRes.data.data);
      }
      setLoading(false);
    });
  }, []);

  /* Derived user stats */
  const displayName = user?.name || "User";
  const handle = `@${user?.name?.toLowerCase().replace(/\s+/g, ".") || "user"}`;
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "CC";
  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpToNext = (level + 1) * 100;
  const xpInLevel = xp % (level * 100);
  const xpPct = Math.min(100, (xpInLevel / (level * 100)) * 100);
  const streak = user?.streak || 0;
  const tier = getTier(level);
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "2024";

  /* Skills */
  const skills = useMemo(
    () =>
      skillStates.map((s) => ({
        label: s.skillId?.name || s.skillName || "Skill",
        score: (s.masteryP || 0) * 100,
        mastered: (s.masteryP || 0) >= 0.85,
      })),
    [skillStates]
  );
  const masteredCount = skills.filter((s) => s.mastered).length;

  /* Stats */
  const totalSolved = recentHistory.filter((s) => s.isCorrect || s.allPassed).length;
  const solvedAnim = useCountUp(totalSolved, 600);
  const streakAnim = useCountUp(streak, 500);
  const xpAnim = useCountUp(xp, 700);

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">

        {/* ─── Sticky top bar ─────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-[#0d1117]/90 px-8 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span className="font-semibold text-zinc-300">Profile</span>
            <span className="text-zinc-700">/</span>
            <span className="font-mono text-zinc-600">{handle}</span>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-zinc-500 transition-all hover:border-white/[0.12] hover:text-zinc-300">
            <Edit3 className="h-3 w-3" strokeWidth={1.5} />
            EDIT
          </button>
        </header>

        {/* ─── Hero ────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/[0.04] px-8 pt-10 pb-8">
          {/* Subtle gradient glow behind avatar */}
          <div
            className="pointer-events-none absolute -top-20 left-8 h-64 w-64 rounded-full opacity-[0.08] blur-3xl"
            style={{ background: tierColor(tier) }}
          />
          {/* Accent line across top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--signal)]/25 to-transparent" />

          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="flex h-[88px] w-[88px] items-center justify-center rounded-full text-[32px] font-bold text-zinc-100 ring-2 ring-offset-2 ring-offset-[#0d1117]"
                style={{ background: "rgba(255,255,255,0.04)", ringColor: tierColor(tier) + "40" }}
              >
                {initials}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0d1117] text-[8px] font-bold text-[#0d1117]"
                style={{ background: tierColor(tier) }}
              >
                {level}
              </span>
            </div>

            {/* Identity */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="font-mono text-[10px] tracking-[0.16em] font-semibold px-2 py-0.5 rounded"
                  style={{ color: tierColor(tier), background: tierColor(tier) + "18" }}
                >
                  {tier}
                </span>
                <span className="font-mono text-[11px] text-zinc-600">LVL {level}</span>
              </div>
              <h1 className="text-[38px] font-extralight tracking-tight text-zinc-50 leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                {displayName}
              </h1>
              <div className="mt-2 flex items-center gap-4 text-[12px] text-zinc-600">
                <span className="font-mono">{handle}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  {joined}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-4 pb-1">
              {arenaRating && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-14 min-w-14 px-3 flex-col items-center justify-center rounded-xl border border-[var(--signal)]/20 bg-[var(--signal)]/[0.04]">
                    <Activity className="h-4 w-4 text-[var(--signal)] mb-0.5" strokeWidth={1.5} />
                    <span className="font-mono text-[16px] font-bold tabular-nums text-zinc-100 leading-none">
                      {arenaRating.elo}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.12em] text-[var(--signal)] uppercase">
                    {arenaRating.rank}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-[var(--signal)]/20 bg-[var(--signal)]/[0.04]">
                  <Flame className="h-4 w-4 text-orange-400 mb-0.5" strokeWidth={1.5} />
                  <span className="font-mono text-[18px] font-bold tabular-nums text-zinc-100 leading-none">{streakAnim}</span>
                </div>
                <span className="font-mono text-[9px] tracking-[0.12em] text-zinc-600 uppercase">streak</span>
              </div>
            </div>
          </div>

          {/* XP bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.1em] text-zinc-600 uppercase">XP Progress</span>
              <span className="font-mono text-[10px] text-zinc-600">{xpAnim.toLocaleString()} / {xpToNext.toLocaleString()}</span>
            </div>
            <div className="relative h-[5px] w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, var(--signal), ${tierColor(tier)})` }}
              />
            </div>
            <div className="mt-1 text-right font-mono text-[10px] text-zinc-700">
              {Math.max(0, xpToNext - xp).toLocaleString()} to Lvl {level + 1}
            </div>
          </div>
        </section>

        {/* ─── Stat row ───────────────────────────────────── */}
        <section className="grid grid-cols-3 border-b border-white/[0.04]">
          {[
            { label: "SOLVED", value: solvedAnim, icon: <Target className="h-3.5 w-3.5" strokeWidth={1.5} /> },
            { label: "MASTERED", value: masteredCount, icon: <Award className="h-3.5 w-3.5" strokeWidth={1.5} /> },
            { label: "LEVEL", value: level, icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} /> },
          ].map((stat, i) => (
            <div key={stat.label} className={`flex flex-col items-center gap-1 py-6 ${i < 2 ? "border-r border-white/[0.04]" : ""}`}>
              <div className="text-[var(--signal)] mb-1">{stat.icon}</div>
              <span className="font-mono text-[30px] font-bold tabular-nums text-zinc-100 leading-none">{stat.value}</span>
              <span className="font-mono text-[9px] tracking-[0.14em] text-zinc-600">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* ─── Main body: 2-column ─────────────────────────── */}
        <div className="grid flex-1 lg:grid-cols-[360px_1fr]">

          {/* Left column */}
          <aside className="border-r border-white/[0.04]">

            {/* About */}
            <div className="border-b border-white/[0.04] px-8 py-7">
              <h3 className="mb-3 font-mono text-[10px] tracking-[0.14em] text-zinc-600 uppercase">About</h3>
              <p className="text-[13px] leading-relaxed text-zinc-400">
                {user?.bio || "Pre-final year CSE (AI) undergraduate building full-stack applications, integrating LLMs, and practicing DSA. Currently building CognitiveCampus."}
              </p>
            </div>

            {/* Links */}
            <div className="border-b border-white/[0.04] px-8 py-7">
              <h3 className="mb-4 font-mono text-[10px] tracking-[0.14em] text-zinc-600 uppercase">Links</h3>
              <div className="space-y-3">
                {[
                  { platform: "GitHub", value: "github.com/SupreethReddy25" },
                  { platform: "LinkedIn", value: "linkedin.com/in/supreethreddy25" },
                ].map((link) => (
                  <div key={link.platform} className="group flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono tracking-[0.08em] text-zinc-600 uppercase mb-0.5">{link.platform}</div>
                      <div className="text-[12px] text-zinc-400">{link.value}</div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-zinc-700 transition-colors group-hover:text-zinc-400 cursor-pointer" strokeWidth={1.5} />
                  </div>
                ))}
              </div>
            </div>

            {/* BYOK */}
            <BYOKSettings />
          </aside>

          {/* Right column */}
          <section className="flex min-w-0 flex-col">

            {/* Mastery section */}
            <div className="border-b border-white/[0.04] px-8 py-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-zinc-100">Skill Mastery</h2>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Tracked via Bayesian Knowledge Tracing</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[22px] font-bold text-zinc-100 leading-none">{masteredCount}</div>
                  <div className="font-mono text-[9px] tracking-[0.12em] text-zinc-700 uppercase">mastered</div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2 w-20 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-[3px] flex-1 rounded-full bg-white/[0.04] animate-pulse" />
                      <div className="h-2 w-6 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : skills.length > 0 ? (
                <div className="space-y-1">
                  {skills.sort((a, b) => b.score - a.score).map((s, i) => (
                    <MasteryBar key={s.label} label={s.label} score={s.score} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-8 w-8 text-zinc-700 mb-3" strokeWidth={1} />
                  <p className="text-[12px] text-zinc-600">No skill data yet</p>
                  <p className="text-[11px] text-zinc-700 mt-1">Solve problems to track mastery</p>
                </div>
              )}
            </div>

            {/* Recent submissions */}
            <div className="px-8 py-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-zinc-100">
                  Recent <span className="text-[var(--signal)]">Activity</span>
                </h2>
                <span className="font-mono text-[10px] tracking-[0.1em] text-zinc-700">LAST {recentHistory.length}</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="h-3.5 w-3.5 rounded-full bg-white/[0.04] animate-pulse shrink-0" />
                      <div className="h-3 flex-1 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-2 w-8 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : recentHistory.length > 0 ? (
                <div>
                  {recentHistory.map((s, i) => (
                    <SubmissionRow key={i} sub={s} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-zinc-700 mb-3" strokeWidth={1} />
                  <p className="text-[12px] text-zinc-600">No submissions yet</p>
                  <p className="text-[11px] text-zinc-700 mt-1">Head to Workspace to get started</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ─── College & Placement Target ──────────────── */}
        <section className="border-t border-white/[0.04] px-8 py-7">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
            <h2 className="text-[15px] font-semibold text-zinc-100">
              College &amp; <span className="text-[var(--signal)]">Placement Target</span>
            </h2>
          </div>

          <div className="space-y-4 max-w-md">
            {/* College selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-[0.15em] text-zinc-600 uppercase block">
                Your College
              </label>
              <CollegeSelector
                value={college}
                onChange={setCollege}
                placeholder="Search your college…"
              />
            </div>

            {/* Target role */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-[0.15em] text-zinc-600 uppercase block">
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g., SDE-1, Data Analyst, Imagineer"
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-[var(--signal)]/40 focus:bg-[var(--signal)]/5 transition-all duration-200 placeholder:text-zinc-700"
              />
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSavePlacement}
                disabled={savingPlacement}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--signal)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingPlacement
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  : <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                }
                {placementSaved ? 'Saved!' : 'Save'}
              </button>

              {college?.slug && (
                <Link
                  to="/placement"
                  className="flex items-center gap-1.5 text-xs text-[var(--signal)] hover:opacity-80 transition-opacity"
                >
                  View Placement Intel
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              )}
            </div>
          </div>
        {/* ─── Settings & Danger Zone ──────────────────── */}
        <section className="border-t border-white/[0.04] px-8 py-7">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
            <h2 className="text-[15px] font-semibold text-zinc-100">
              Account <span className="text-[var(--signal)]">Settings</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div>
              <h3 className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 mb-3 uppercase">BYOK / AI Key Configuration</h3>
              <BYOKSettings />
            </div>
            <div>
              <h3 className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 mb-3 uppercase">Danger Zone / Actions</h3>
              <div className="space-y-3">
                <AdminBootstrap user={user} refreshUser={refreshUser} />
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-between rounded-lg border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-left transition-colors hover:bg-red-500/10"
                >
                  <span className="font-mono text-[11px] font-medium text-red-400 uppercase tracking-widest">Sign Out</span>
                  <LogOut className="h-4 w-4 text-red-400" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-white/[0.04] px-8 py-3 font-mono text-[9px] tracking-[0.2em] text-zinc-700">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <span className="text-[var(--signal)]/50">CC</span>
        </footer>
      </div>
    </div>
  );
}

/* ─── BYOK Settings ──────────────────────────────────────── */
function BYOKSettings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // null | 'saved' | 'cleared' | 'error'
  const hasStoredKey = !!localStorage.getItem("cognitive_campus_llm_key");

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await usersService.configGeminiKey(apiKey.trim());
      localStorage.setItem("cognitive_campus_llm_key", "configured");
      setStatus("saved");
      setApiKey("");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await usersService.configGeminiKey("");
      localStorage.removeItem("cognitive_campus_llm_key");
      setStatus("cleared");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-8 py-7">
      <div className="flex items-center gap-2 mb-1">
        <Key className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.5} />
        <h3 className="font-mono text-[10px] tracking-[0.14em] text-zinc-600 uppercase">BYOK — AI Key</h3>
      </div>
      <p className="text-[11px] text-zinc-600 mb-4 leading-relaxed">
        Your own Gemini API key for unlimited nudges. Encrypted AES-256-GCM server-side.
      </p>

      {/* Status banners */}
      {hasStoredKey && !status && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/[0.04] px-3 py-2 mb-3">
          <ShieldCheck className="h-3 w-3 text-[var(--signal)]" strokeWidth={1.5} />
          <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--signal)]">KEY ACTIVE</span>
        </div>
      )}
      {status === "saved" && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/[0.04] px-3 py-2 mb-3">
          <ShieldCheck className="h-3 w-3 text-[var(--signal)]" strokeWidth={1.5} />
          <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--signal)]">SAVED</span>
        </div>
      )}
      {status === "cleared" && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 mb-3">
          <span className="font-mono text-[10px] tracking-[0.1em] text-zinc-500">CLEARED — USING SYSTEM KEY</span>
        </div>
      )}
      {status === "error" && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] px-3 py-2 mb-3">
          <span className="font-mono text-[10px] tracking-[0.1em] text-rose-400">ERROR — TRY AGAIN</span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2 mb-3 transition-colors focus-within:border-[var(--signal)]/30">
        <Key className="h-3 w-3 shrink-0 text-zinc-700" strokeWidth={1.5} />
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="AIza...your-key"
          className="flex-1 bg-transparent font-mono text-[11px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none"
        />
        <button onClick={() => setShowKey(!showKey)} className="text-zinc-700 hover:text-zinc-400 transition-colors">
          {showKey ? <EyeOff className="h-3 w-3" strokeWidth={1.5} /> : <Eye className="h-3 w-3" strokeWidth={1.5} />}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className={`rounded-lg px-4 py-1.5 font-mono text-[10px] tracking-[0.1em] font-medium transition-all ${
            !apiKey.trim()
              ? "bg-zinc-900 text-zinc-700 cursor-not-allowed"
              : "bg-[var(--signal)] text-[#0a1410] hover:brightness-110"
          }`}
        >
          {saving ? "SAVING..." : "SAVE KEY"}
        </button>
        {hasStoredKey && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="rounded-lg border border-white/[0.06] px-4 py-1.5 font-mono text-[10px] tracking-[0.1em] text-zinc-600 hover:border-rose-500/30 hover:text-rose-400 transition-all"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Admin Bootstrap (Dev Mode) ─────────────────────────── */
function AdminBootstrap({ user, refreshUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (user?.role === 'admin') return null;

  const handleBootstrap = async () => {
    setLoading(true); setError(null);
    try {
      const res = await authService.bootstrapAdmin();
      if (res.data.success) {
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to bootstrap admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBootstrap}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/[0.04] px-4 py-3 text-left transition-colors hover:bg-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="font-mono text-[11px] font-medium text-violet-400 uppercase tracking-widest">
          {loading ? 'Promoting...' : 'Bootstrap Admin'}
        </span>
        <ShieldCheck className={`h-4 w-4 text-violet-400 ${loading ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}