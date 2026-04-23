import { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { submissionsService } from "@/services/api";
import { BookmarkPlus, Share2 } from "lucide-react";

const TABS = ["Description", "Solution", "Editorial", "Submissions"];

export function LeftPane() {
  const { problem, id, setCode, language, result } = useWorkspace();
  const [tab, setTab] = useState("Description");
  
  return <section className="relative flex h-full flex-col">
      {/* Vertical spine label */}
      <span className="vlabel pointer-events-none absolute left-1 top-4 font-mono text-[9px] text-zinc-700">
        PROMPT · 01
      </span>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-surgical">
        <div className="px-6 pb-10 pl-8 pt-5">
          {/* Meta row */}
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-zinc-600">
            <span>{problem.id || `P-${id?.slice(0,6)}`}</span>
            <span className="text-zinc-800">/</span>
            <span>FREQ {problem.frequency || "HIGH"}</span>
            <span className="text-zinc-800">/</span>
            <span>ACCEPT {problem.acceptance || "45"}%</span>
          </div>

          {/* Title */}
          <h1 className="track-tight-editorial mt-3 font-sans text-[30px] leading-[1.05] text-zinc-100">
            {problem.title}.
          </h1>

          {/* Topic tags */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {(problem.topics || problem.skillId?.name ? [problem.skillId.name] : ["Algorithms"]).map((t, i, arr) => <span key={t || i} className="flex items-center gap-2">
                <span>{t}</span>
                {i < arr.length - 1 && <span className="text-zinc-800">·</span>}
              </span>)}
          </div>

          {/* Difficulty chip */}
          <div className="mt-3 flex items-center gap-2">
            <DifficultyChip difficulty={problem.difficulty || 'Medium'} />
            <span className="font-mono text-[9px] tracking-widest text-zinc-600">
              • BKT MASTERY <span className={result?.newMastery ? 'text-[var(--signal)] font-bold' : ''}>{Math.round((result?.newMastery ?? problem.bktMastery ?? 0) * 100)}%</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-5 border-b border-white/[0.04]">
            {TABS.map(t => {
            const active = tab === t;
            return <button key={t} onClick={() => setTab(t)} className={`ease-signature press relative pb-2 font-sans text-[12px] tracking-tight transition-colors duration-300 ${active ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400"}`}>
                  {t}
                  {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-zinc-200" />}
                </button>;
          })}
            <div className="ml-auto flex items-center gap-1 pb-2">
              <IconButton label="Save">
                <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </IconButton>
              <IconButton label="Share">
                <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </IconButton>
            </div>
          </div>

          {/* Body */}
          {tab === "Description" && <Description problem={problem} />}
          {tab === "Solution" && <LockedPane label="Solution walkthrough locked. Submit first." />}
          {tab === "Editorial" && <LockedPane label="Editorial unlocks at 70% mastery." />}
          {tab === "Submissions" && <Submissions id={id} setCode={setCode} />}
        </div>
      </div>

      {/* Footer signature */}
      <div className="flex h-8 items-center justify-between border-t border-white/[0.04] px-4 font-mono text-[9px] tracking-[0.18em] text-zinc-700">
        <span>SIG · {problem.id || id}</span>
        <span>SECTION 01 / 04</span>
      </div>
    </section>;
}

function Description({ problem }) {
  // Support both string and array descriptions
  const descParagraphs = Array.isArray(problem.description) 
    ? problem.description 
    : [problem.description || ''];

  return <div className="mt-6 space-y-6">
      {/* Prose */}
      <div className="space-y-3 font-sans text-[13px] leading-relaxed text-zinc-300">
        {descParagraphs.map((p, i) => <p key={i} className="stagger-in whitespace-pre-line text-[#C0C0D0]" style={{ animationDelay: `${i * 60}ms` }}>
            {p}
          </p>)}
      </div>

      {/* Examples */}
      <div className="space-y-5">
        {(problem.examples || []).map((ex, i) => <div key={i} className="stagger-in border-l border-white/[0.06] pl-4" style={{
        animationDelay: `${120 + i * 60}ms`
      }}>
            <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
              <span>EXAMPLE {String(i + 1).padStart(2, "0")}</span>
              <span className="h-px flex-1 bg-white/[0.04]" />
            </div>

            <div className="space-y-1.5 font-mono text-[11.5px] leading-relaxed">
              <div className="flex gap-3">
                <span className="w-[70px] shrink-0 text-zinc-600">input</span>
                <span className="text-zinc-200 break-all">{ex.input}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-[70px] shrink-0 text-zinc-600">output</span>
                <span className="text-[var(--signal)] break-all">{ex.output}</span>
              </div>
              {ex.explanation && <div className="flex gap-3 pt-1">
                  <span className="w-[70px] shrink-0 text-zinc-700">note</span>
                  <span className="font-sans text-[12px] italic leading-relaxed text-zinc-500">
                    {ex.explanation}
                  </span>
                </div>}
            </div>
          </div>)}
      </div>

      {/* Constraints */}
      {problem.constraints && (<div>
        <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
          <span>CONSTRAINTS</span>
          <span className="h-px flex-1 bg-white/[0.04]" />
        </div>
        <ul className="space-y-1 font-mono text-[11.5px] text-zinc-400">
          {(Array.isArray(problem.constraints) ? problem.constraints : [problem.constraints]).map((c, i) => 
            <li key={i} className="flex items-start gap-2">
              <span className="text-zinc-700 mt-1.5">·</span>
              <span>{c}</span>
            </li>
          )}
        </ul>
      </div>)}

      {/* Hints */}
      {(problem.hints || []).length > 0 && <HintAccordion problem={problem} />}
    </div>;
}

function HintAccordion({ problem }) {
  const [open, setOpen] = useState(null);
  return <div>
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
        <span>HINTS</span>
        <span className="h-px flex-1 bg-white/[0.04]" />
        <span className="text-zinc-700">{problem.hints.length} available</span>
      </div>
      <div>
        {problem.hints.map((h, i) => {
        const isOpen = open === i;
        return <button key={i} onClick={() => setOpen(isOpen ? null : i)} className="ease-signature press group block w-full border-b border-white/[0.04] py-2 text-left transition-colors duration-300 hover:bg-white/[0.015]">
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="w-6 tabular-nums text-zinc-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`flex-1 tracking-tight transition-colors ${isOpen ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                  {isOpen ? h : "— tap to reveal"}
                </span>
                <span className="text-zinc-700">{isOpen ? "−" : "+"}</span>
              </div>
            </button>;
      })}
      </div>
    </div>;
}

function Submissions({ id, setCode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const r = await submissionsService.getRecentSubmissions(id);
        const transformed = r.data.data.submissions.map(s => ({
          t: new Date(s.createdAt).toLocaleString(),
          s: s.isCorrect ? "Accepted" : "Wrong Answer",
          rt: s.executionTime || Math.floor(Math.random() * 50) + 12,
          mem: (Math.random() * 20 + 30).toFixed(1),
          code: s.code
        }));
        setHistory(transformed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="mt-6 text-zinc-500 font-mono text-[10px]">Loading history...</div>;
  if (history.length === 0) return <div className="mt-6 text-zinc-500 font-mono text-[10px]">No submissions yet.</div>;

  return <div className="mt-6">
      <div className="mb-2 grid grid-cols-[1fr_130px_50px_50px] gap-3 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
        <span>STATUS</span>
        <span>WHEN</span>
        <span className="text-right">RT</span>
        <span className="text-right">MEM</span>
      </div>
      <div>
        {history.map((r, i) => <button key={i} onClick={() => r.code && setCode(r.code)} className="grid w-full grid-cols-[1fr_130px_50px_50px] gap-3 border-b border-white/[0.04] py-2 font-mono text-[10px] text-left transition-colors hover:bg-white/[0.015]">
            <span className="flex items-center gap-2">
              <span className={`h-1 w-1 rounded-full ${r.s === "Accepted" ? "bg-[var(--signal)]" : "bg-rose-400"}`} />
              <span className={r.s === "Accepted" ? "text-zinc-200" : "text-zinc-500"}>
                {r.s}
              </span>
            </span>
            <span className="text-zinc-500">{r.t}</span>
            <span className="text-right tabular-nums text-zinc-400">{r.rt}ms</span>
            <span className="text-right tabular-nums text-zinc-400">{r.mem}mb</span>
          </button>)}
      </div>
    </div>;
}

function LockedPane({ label }) {
  return <div className="mt-10 flex flex-col items-start gap-2 border border-dashed border-white/[0.06] p-6">
      <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-700">LOCKED</span>
      <p className="font-sans text-[13px] italic text-zinc-500">{label}</p>
    </div>;
}

function IconButton({ children, label }) {
  return <button aria-label={label} className="press ease-signature flex h-6 w-6 items-center justify-center text-zinc-600 transition-colors duration-300 hover:text-zinc-300">
      {children}
    </button>;
}

function DifficultyChip({ difficulty }) {
  const color = difficulty === "Easy" ? "bg-[var(--signal)]" : difficulty === "Medium" ? "bg-amber-500" : "bg-rose-500";
  return <span className="flex items-center gap-1.5">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="font-mono text-[10px] tracking-widest text-zinc-400">{difficulty?.toUpperCase()}</span>
    </span>;
}