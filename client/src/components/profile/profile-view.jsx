import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { usersService, submissionsService, skillsService } from "../../services/api";
import { 
  MapPin, Calendar, ExternalLink, Key, ShieldCheck, Eye, EyeOff, Edit3
} from "lucide-react";

export function ProfileView() {
  const { user } = useAuth();
  const [skillStates, setSkillStates] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    skillsService.getMySkillStates()
      .then(r => setSkillStates(r.data?.data?.skillStates || []))
      .catch(() => {});
    // Fetch ALL submissions to build heatmap from real data
    submissionsService.getHistory({ limit: 500 })
      .then(r => {
        const subs = r.data?.data?.submissions || r.data?.data || [];
        setAllSubmissions(Array.isArray(subs) ? subs : []);
        setRecentHistory(subs.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const displayName = user?.name || 'User';
  const handle = user?.name?.toLowerCase().replace(/\s+/g, '.') || 'user';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CC';
  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpToNext = (level + 1) * 100;
  const streak = user?.streak || 0;
  const tier = level >= 40 ? "Legend" : level >= 30 ? "Archon" : level >= 15 ? "Adept" : "Apprentice";
  const joined = user?.createdAt ? new Date(user.createdAt).toISOString().slice(0, 7).replace('-', '.') : '2024.01';

  // Skills for mastery bars
  const skills = useMemo(() => 
    skillStates.slice(0, 6).map(s => ({
      key: (s.skillId?.name || s.skillName || 'Skill'),
      score: Math.round((s.masteryP || 0) * 100)
    })),
  [skillStates]);

  // Heatmap from REAL submission data
  const { heatmapData, totalSolves } = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    // Build a map of date -> count
    const dateMap = {};
    let count = 0;
    for (const sub of allSubmissions) {
      const d = new Date(sub.createdAt);
      if (d >= oneYearAgo) {
        const key = d.toISOString().slice(0, 10);
        dateMap[key] = (dateMap[key] || 0) + 1;
        count++;
      }
    }
    
    // Build 52 weeks * 7 days grid
    const cells = [];
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday
    
    for (let w = 0; w < 52; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + d);
        const key = cellDate.toISOString().slice(0, 10);
        const val = dateMap[key] || 0;
        // Map to intensity 0-4
        const intensity = val === 0 ? 0 : val <= 1 ? 1 : val <= 3 ? 2 : val <= 5 ? 3 : 4;
        cells.push({ date: key, count: val, intensity });
      }
    }
    
    return { heatmapData: cells, totalSolves: count };
  }, [allSubmissions]);

  return <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
    <div className="flex min-h-full flex-col">
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-md">
        <div className="flex items-center gap-3 text-[13px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-semibold text-zinc-200">Profile</span>
          <span className="text-zinc-600">/</span>
          <span>@{handle}</span>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-1.5 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.03] hover:text-zinc-200">
          <Edit3 className="h-3 w-3" strokeWidth={1.5} />
          Edit profile
        </button>
      </header>

      {/* ─── Hero: avatar + name ─── */}
      <section className="border-b border-white/[0.04] px-10 pt-10 pb-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2a3441] text-[28px] font-bold text-zinc-200">
              {initials}
            </div>
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-[var(--signal)]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[13px] text-zinc-500">@{handle}</span>
              <span className="text-[11px] text-zinc-600">·</span>
              <span className="text-[12px] text-zinc-500">Lvl {level} · {tier}</span>
            </div>
            <h1 className="text-[42px] font-semibold leading-[1.1] tracking-tight text-zinc-50">
              {displayName}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-[12px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                Hyderabad · IN
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                Joined {joined}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Two-column body ─── */}
      <div className="grid flex-1 lg:grid-cols-[380px_1fr]">
        {/* Left column */}
        <aside className="border-r border-white/[0.04]">
          {/* XP Progress */}
          <div className="border-b border-white/[0.04] px-10 py-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] text-zinc-500">XP progress</span>
              <span className="text-[12px] text-zinc-500">Lvl {level} → {level + 1}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[36px] font-semibold tabular-nums text-zinc-50">{xp.toLocaleString()}</span>
              <span className="text-[14px] text-zinc-500">/ {xpToNext.toLocaleString()}</span>
            </div>
            <div className="h-[4px] w-full rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-[var(--signal)]" style={{ width: `${Math.min(100, (xp % (level * 100)) / (level * 100) * 100)}%` }} />
            </div>
            <div className="mt-2 text-[12px] text-zinc-600">
              {Math.max(0, xpToNext - xp).toLocaleString()} to next level
            </div>
          </div>

          {/* About */}
          <div className="border-b border-white/[0.04] px-10 py-8">
            <h3 className="text-[14px] font-semibold text-zinc-200 mb-3">About</h3>
            <p className="text-[13px] leading-relaxed text-zinc-400">
              {user?.bio || "Distributed systems engineer focused on graph algorithms, adversarial invariants, and concurrent data structures. Deep work over busywork."}
            </p>
          </div>

          {/* Links */}
          <div className="border-b border-white/[0.04] px-10 py-8">
            <h3 className="text-[14px] font-semibold text-zinc-200 mb-4">Links</h3>
            <div className="space-y-3">
              {[
                { label: 'github', value: `/${handle}` },
                { label: handle.replace('.', ''), value: '.dev' },
              ].map(link => <div key={link.label} className="flex items-center justify-between text-[13px]">
                <span className="text-zinc-400">{link.label} · {link.value}</span>
                <ExternalLink className="h-3 w-3 text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer" strokeWidth={1.5} />
              </div>)}
            </div>
          </div>

          {/* BYOK Settings */}
          <BYOKSettings />
        </aside>

        {/* Right column */}
        <section className="flex min-w-0 flex-col">
          {/* Heatmap */}
          <div className="border-b border-white/[0.04] px-10 py-10">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-zinc-100">
                <span className="text-[var(--signal)]">{totalSolves}</span> solves this year
              </h2>
              <span className="text-[12px] text-zinc-600">Hover any day for details.</span>
            </div>
            <ActivityHeatmap cells={heatmapData} />
          </div>

          {/* Mastery by pillar */}
          <div className="border-b border-white/[0.04] px-10 py-10">
            <h2 className="text-[18px] font-semibold text-zinc-100 mb-6">Mastery by pillar</h2>
            {skills.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                {skills.map(s => <div key={s.key} className="flex items-center gap-4">
                  <span className="w-16 text-[13px] text-zinc-400">{s.key}</span>
                  <div className="relative h-[6px] flex-1 rounded-full bg-white/[0.06]">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--signal)] transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${s.score}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-[13px] tabular-nums font-semibold text-zinc-200">{s.score}</span>
                </div>)}
              </div>
            ) : (
              <div className="py-8 text-center text-[12px] text-zinc-600">No skill data yet</div>
            )}
          </div>

          {/* Recent submissions */}
          <div className="border-b border-white/[0.04] px-10 py-10">
            <h2 className="text-[18px] font-semibold text-zinc-100 mb-6">
              Recent <span className="text-[var(--signal)]">solves</span>
            </h2>
            {recentHistory.length > 0 ? (
              <div className="space-y-0">
                {recentHistory.map((s, i) => <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] py-3 last:border-b-0">
                  <span className={`h-2 w-2 rounded-full ${s.isCorrect ? 'bg-[var(--signal)]' : 'bg-rose-500'}`} />
                  <span className={`font-mono text-[11px] w-8 ${s.isCorrect ? 'text-[var(--signal)]' : 'text-rose-400'}`}>
                    {s.isCorrect ? 'AC' : 'WA'}
                  </span>
                  <span className="flex-1 text-[13.5px] font-medium text-zinc-200 truncate">
                    {s.problemId?.title || 'Problem'}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">{(s.language || 'JS').toUpperCase()}</span>
                  <span className="font-mono text-[11px] text-zinc-600">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>)}
              </div>
            ) : (
              <div className="py-8 text-center text-[12px] text-zinc-600">No submissions yet</div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-10 py-4 font-mono text-[9px] tracking-[0.24em] text-zinc-700">
        <span>COGNITIVE · CAMPUS / 2026</span>
        <span className="text-[var(--signal)]/70">OK</span>
      </div>
    </div>
  </div>;
}

/* ───────────────────────────────────────────── */
/* Activity Heatmap — built from REAL data       */
/* ───────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

function intensityBg(n) {
  if (n === 0) return "transparent";
  const pct = 15 + n * 18;
  return `color-mix(in oklab, var(--signal) ${pct}%, transparent)`;
}

function ActivityHeatmap({ cells }) {
  const [hover, setHover] = useState(null);
  const weeks = 52;

  return <div className="relative">
    {/* Month labels */}
    <div className="mb-2 grid grid-cols-12 gap-0 pl-8">
      {MONTHS.map(m => <span key={m} className="text-[11px] text-zinc-600">{m}</span>)}
    </div>

    <div className="flex gap-2">
      {/* Day labels */}
      <div className="flex w-6 flex-col justify-between py-[4px] text-[10px] text-zinc-700">
        {DAYS.map((d, i) => <span key={i}>{d}</span>)}
      </div>

      {/* Grid */}
      <div className="flex flex-1 gap-[3px]">
        {Array.from({ length: weeks }).map((_, w) => <div key={w} className="flex flex-1 flex-col gap-[3px]">
          {Array.from({ length: 7 }).map((_, d) => {
            const idx = w * 7 + d;
            const cell = cells[idx] || { intensity: 0, count: 0, date: '' };
            const active = hover?.week === w && hover?.day === d;
            return <button
              key={d}
              type="button"
              onMouseEnter={() => setHover({ week: w, day: d, count: cell.count, date: cell.date })}
              onMouseLeave={() => setHover(null)}
              className={`aspect-square w-full rounded-[2px] border ${active ? "border-white/40" : "border-white/[0.04]"} transition-colors duration-150`}
              style={{ backgroundColor: intensityBg(cell.intensity) }}
            />;
          })}
        </div>)}
      </div>
    </div>

    {/* Legend + tooltip */}
    <div className="mt-3 flex items-center justify-between">
      {hover ? (
        <span className="text-[11px] text-zinc-400">
          <span className="text-zinc-200 font-medium">{hover.count} solve{hover.count !== 1 ? 's' : ''}</span>
          {hover.date && ` on ${hover.date}`}
        </span>
      ) : (
        <span className="text-[11px] text-zinc-600">Hover any cell to see details</span>
      )}
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(n => <span key={n} className="h-2.5 w-2.5 rounded-[2px] border border-white/[0.04]" style={{ backgroundColor: intensityBg(n) }} />)}
        <span>More</span>
      </div>
    </div>
  </div>;
}

/* ───────────────────────────────────────────── */
/* BYOK Settings                                 */
/* ───────────────────────────────────────────── */

function BYOKSettings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const hasStoredKey = !!localStorage.getItem('cognitive_campus_llm_key');

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await usersService.configGeminiKey(apiKey.trim());
      localStorage.setItem('cognitive_campus_llm_key', 'configured');
      setStatus('saved');
      setApiKey('');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await usersService.configGeminiKey('');
      localStorage.removeItem('cognitive_campus_llm_key');
      setStatus('cleared');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return <div className="px-10 py-8">
    <div className="flex items-center gap-2 mb-3">
      <Key className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.5} />
      <h3 className="text-[14px] font-semibold text-zinc-200">BYOK</h3>
    </div>
    <p className="text-[12px] text-zinc-500 mb-4">
      Your own Gemini API key for unlimited nudges. Encrypted server-side.
    </p>

    {hasStoredKey && !status && <div className="flex items-center gap-2 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-3 py-2 mb-3 text-[11px] text-[var(--signal)]">
      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
      BYOK ACTIVE
    </div>}

    {status === 'saved' && <div className="flex items-center gap-2 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-3 py-2 mb-3 text-[11px] text-[var(--signal)]">
      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> KEY SAVED
    </div>}

    {status === 'cleared' && <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 mb-3 text-[11px] text-zinc-400">
      KEY CLEARED — USING DEFAULT
    </div>}

    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2 mb-3 focus-within:border-[var(--signal)]/40">
      <Key className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
      <input
        type={showKey ? "text" : "password"}
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        placeholder="AIza...your-key"
        className="flex-1 bg-transparent text-[12px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none"
      />
      <button onClick={() => setShowKey(!showKey)} className="text-zinc-600 hover:text-zinc-300">
        {showKey ? <EyeOff className="h-3 w-3" strokeWidth={1.5} /> : <Eye className="h-3 w-3" strokeWidth={1.5} />}
      </button>
    </div>

    <div className="flex items-center gap-2">
      <button onClick={handleSave} disabled={saving || !apiKey.trim()} className={`rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors ${!apiKey.trim() ? 'bg-zinc-800 text-zinc-600' : 'bg-[var(--signal)] text-[#0a1410] hover:brightness-110'}`}>
        {saving ? 'Saving...' : 'Save Key'}
      </button>
      {hasStoredKey && <button onClick={handleClear} disabled={saving} className="rounded-lg border border-white/[0.06] px-4 py-1.5 text-[11px] text-zinc-400 hover:text-rose-400 transition-colors">
        Clear
      </button>}
    </div>
  </div>;
}