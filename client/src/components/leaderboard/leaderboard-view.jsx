import { useEffect, useMemo, useState } from "react";
import { leaderboardService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import useSocket from "../../hooks/useSocket";
import { Search, Globe, Flame, Loader2, Trophy } from "lucide-react";

const SCOPES = ["GLOBAL", "COUNTRY", "FRIENDS"];
const WINDOWS = ["24H", "7D", "30D", "ALL"];

export function LeaderboardView() {
  const { user } = useAuth();
  const { lastLeaderboardSignal } = useSocket();
  const [scope, setScope] = useState("GLOBAL");
  const [range, setRange] = useState("30D");
  const [query, setQuery] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const r = await leaderboardService.getLeaderboard();
      const data = r.data?.data?.leaderboard || r.data?.data || [];
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, []);
  useEffect(() => { if (lastLeaderboardSignal) fetchLeaderboard(); }, [lastLeaderboardSignal]);

  const enriched = useMemo(() => {
    return leaderboard.map((entry, i) => ({
      rank: i + 1,
      handle: entry.name?.toLowerCase().replace(/\s+/g, '.') || `user_${i}`,
      name: entry.name || 'Unknown',
      mastery: entry.avgMastery ? entry.avgMastery * 100 : 0,
      percentile: 99.99 - i * 0.4,
      streak: entry.streak || 0,
      solved: entry.totalSolved || entry.problemsSolved || 0,
      level: entry.level || 1,
      tier: entry.level >= 40 ? "LEGEND" : entry.level >= 30 ? "ARCHON" : entry.level >= 15 ? "ADEPT" : "APPRENTICE",
      country: "—",
      isYou: entry.userId === user?._id || entry._id === user?._id
    }));
  }, [leaderboard, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter(r => r.handle.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [query, enriched]);

  const you = enriched.find(r => r.isYou);

  return <div className="mt-10 bg-white/[0.02] border border-white/[0.04]">
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.04] px-10 py-6">
        <h2 className="text-[18px] font-semibold text-zinc-100 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--signal)]" />
          Global Leaderboard
        </h2>
        <p className="text-[12px] text-zinc-500 mt-1">The top minds, ranked by Bayesian mastery.</p>
      </div>
      {/* Controls */}
      <section className="flex items-center gap-4 border-b border-white/[0.04] px-10 py-4">
        <div className="flex items-center gap-1 border border-white/[0.06] p-[2px]">
          {SCOPES.map(s => <button key={s} onClick={() => setScope(s)} className={`press ease-signature px-3 py-1 font-mono text-[10px] tracking-[0.2em] transition-colors ${s === scope ? "bg-white/[0.05] text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}>
            {s}
          </button>)}
        </div>

        <div className="flex items-center gap-1 border border-white/[0.06] p-[2px]">
          {WINDOWS.map(w => <button key={w} onClick={() => setRange(w)} className={`press ease-signature px-2.5 py-1 font-mono text-[10px] tracking-widest transition-colors ${w === range ? "bg-white/[0.05] text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`}>
            {w}
          </button>)}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-white/[0.06] px-2.5 py-1.5">
          <Search className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter hackers…" className="w-56 bg-transparent font-mono text-[11px] tracking-wide text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
        </div>
      </section>

      {/* Table */}
      <section className="flex-1 px-10 py-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-[56px_1fr_160px_120px_120px_100px_56px] items-center gap-6 border-y border-white/[0.06] py-3 font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
              <span>RANK</span>
              <span>HACKER</span>
              <span>MASTERY</span>
              <span>PERCENTILE</span>
              <span>SOLVED</span>
              <span>STREAK</span>
              <span className="text-right">TIER</span>
            </div>

            <ul>
              {filtered.map((r, i) => <LeaderboardRow key={r.handle + i} row={r} index={i} />)}
            </ul>

            {filtered.length === 0 && <div className="flex flex-col items-center justify-center gap-2 py-20 font-mono text-[10px] tracking-[0.24em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span>NO MATCHES · REFINE YOUR QUERY</span>
            </div>}
          </>
        )}
      </section>

    </div>
  </div>;
}

function LeaderboardRow({ row, index }) {
  const top3 = row.rank <= 3;
  const goldTint = row.rank === 1 ? "text-amber-200/90" : row.rank === 2 ? "text-zinc-200" : row.rank === 3 ? "text-orange-300/75" : "text-zinc-500";
  return <li className={`ease-signature group relative grid grid-cols-[56px_1fr_160px_120px_120px_100px_56px] items-center gap-6 border-b border-white/[0.04] py-4 transition-colors hover:bg-white/[0.015] ${row.isYou ? "bg-[var(--signal)]/[0.025]" : ""}`} style={{
    animationDelay: `${Math.min(index * 20, 300)}ms`
  }}>
    {row.isYou && <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 bg-[var(--signal)]" />}

    <div className="flex items-center gap-2">
      <span className={`${top3 ? 'font-serif italic' : 'font-sans'} text-[20px] font-medium leading-none tabular-nums ${goldTint}`}>
        {String(row.rank).padStart(2, "0")}
      </span>
      {top3 && <span className={`inline-block h-1 w-1 rounded-full ${row.rank === 1 ? "bg-amber-300/70" : row.rank === 2 ? "bg-zinc-300/70" : "bg-orange-300/60"}`} />}
    </div>

    <div className="flex items-center gap-3 min-w-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-[10px] ${row.isYou ? "border-[var(--signal)]/60 bg-[var(--signal)]/10 text-[var(--signal)]" : "border-white/[0.08] bg-white/[0.02] text-zinc-400"}`}>
        {row.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`truncate text-[14px] font-medium ${row.isYou ? "text-[var(--signal)]" : "text-zinc-100"} ${top3 ? 'font-serif italic text-lg' : 'font-sans'}`}>
            {row.name}
          </span>
          {row.isYou && <span className="border border-[var(--signal)]/40 px-1.5 py-[1px] font-mono text-[8px] tracking-[0.2em] text-[var(--signal)]">
            YOU
          </span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] tracking-widest text-zinc-600">
          <span>@{row.handle}</span>
          <span className="text-zinc-800">·</span>
          <span>LVL {row.level}</span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="h-[2px] w-20 bg-white/[0.05]">
        <div className="h-full bg-[var(--signal)]/80" style={{
          width: `${row.mastery}%`
        }} />
      </div>
      <span className="font-mono text-[12px] tabular-nums text-zinc-200">
        {row.mastery.toFixed(1)}
      </span>
    </div>

    <span className="font-mono text-[12px] tabular-nums text-zinc-300">
      {row.percentile.toFixed(2)}
      <span className="text-zinc-700">%</span>
    </span>

    <span className="font-mono text-[12px] tabular-nums text-zinc-400">
      {row.solved.toLocaleString()}
    </span>

    <div className="flex items-center gap-1.5">
      <Flame className={`h-3 w-3 ${row.streak >= 50 ? "text-[var(--signal)]" : "text-zinc-700"}`} strokeWidth={1.5} />
      <span className="font-mono text-[11px] tabular-nums text-zinc-400">{row.streak}D</span>
    </div>

    <div className="flex justify-end">
      <span className={`border px-1.5 py-[1px] font-mono text-[8px] tracking-[0.22em] ${row.tier === "LEGEND" ? "border-amber-300/40 text-amber-200/90" : row.tier === "ARCHON" ? "border-zinc-300/30 text-zinc-300" : row.tier === "ADEPT" ? "border-[var(--signal)]/40 text-[var(--signal)]/90" : "border-white/[0.08] text-zinc-500"}`}>
        {row.tier}
      </span>
    </div>
  </li>;
}

function MiniStat({ label, value }) {
  return <div className="flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
    <span className="font-mono text-[8px] tracking-[0.24em] text-zinc-600">{label}</span>
    <span className="font-mono text-[12px] tabular-nums text-zinc-200">{value}</span>
  </div>;
}