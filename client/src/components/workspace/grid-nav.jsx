"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const SECTIONS = [{
  id: "workspace",
  label: "WORKSPACE"
}, {
  id: "metrics",
  label: "METRICS"
}, {
  id: "history",
  label: "HISTORY"
}, {
  id: "mentor",
  label: "MENTOR"
}];

export function GridNav() {
  const [active, setActive] = useState("workspace");
  return <aside className="relative flex h-screen flex-col border-r border-white/[0.04]">
      {/* Logo mark — 44px, flush with top bar */}
      <Link to="/dashboard" className="flex h-[44px] items-center justify-center border-b border-white/[0.04] press hover:bg-white/[0.05] transition-colors" title="Back to Dashboard">
        <div className="grid-cross relative">
          <div className="h-4 w-4 border border-[var(--signal)]/80 shadow-[0_0_8px_var(--signal)] rounded-[1px]">
            <div className="h-full w-full border-l border-t border-[var(--signal)]/50" />
          </div>
        </div>
      </Link>

      {/* Vertical section labels — San Rita editorial */}
      <div className="flex flex-1 flex-col">
        {SECTIONS.map((s, i) => {
        const isActive = active === s.id;
        return <button key={s.id} onClick={() => setActive(s.id)} className={`ease-signature press group relative flex flex-1 items-center justify-center border-b border-white/[0.04] transition-colors duration-300 ${isActive ? "bg-white/[0.015]" : "hover:bg-white/[0.02]"}`}>
              {/* Section index */}
              <span className={`absolute left-1.5 top-2 font-mono text-[9px] tabular-nums tracking-widest ${isActive ? "text-[var(--signal)]" : "text-zinc-700"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Vertical label */}
              <span className={`vlabel font-mono text-[10px] font-medium transition-colors duration-300 ${isActive ? "signal-glow" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                {s.label}
              </span>

              {/* Active indicator — right-edge hairline */}
              {isActive && <span className="absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 bg-[var(--signal)]" />}
            </button>;
      })}
      </div>

      {/* Footer — settings + grid mark */}
      <div className="flex h-12 items-center justify-center border-t border-white/[0.04]">
        <button aria-label="Settings" className="press ease-signature flex h-7 w-7 items-center justify-center text-zinc-600 transition-colors duration-300 hover:text-[var(--signal)]">
          <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Decorative edge dots — intersections */}
      <span className="absolute right-[-1.5px] top-[44px] h-[3px] w-[3px] rounded-[1px] bg-[var(--signal)] opacity-50" />
      <span className="absolute right-[-1.5px] bottom-12 h-[3px] w-[3px] rounded-[1px] bg-[var(--signal)] opacity-30" />
    </aside>;
}