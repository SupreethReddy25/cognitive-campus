"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";

export function DashboardHeader() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Fire a synthetic Ctrl+K so the existing AppShell handler opens CommandPalette
  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    }));
  };

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 pl-12 pr-6 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="text-zinc-200">DASHBOARD</span>
        </div>
        <span className="h-3 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-zinc-600">
          <span>HOME</span>
          <span className="text-zinc-800">/</span>
          <span className="text-zinc-400">OVERVIEW</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={openCommandPalette}
          className="press ease-signature flex items-center gap-2 border border-white/[0.06] px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-zinc-200"
        >
          <Search className="h-3 w-3" strokeWidth={1.5} />
          <span>SEARCH</span>
          <span className="ml-3 border-l border-white/[0.06] pl-2 text-[9px] text-zinc-700">⌘K</span>
        </button>
        <button
          aria-label="Notifications"
          className="press ease-signature relative flex h-7 w-7 items-center justify-center border border-white/[0.06] text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-zinc-200"
        >
          <Bell className="h-3 w-3" strokeWidth={1.5} />
          <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[var(--signal)]" />
        </button>
        <span className="font-mono text-[10px] tabular-nums text-zinc-500">
          {mounted ? time : "—"}
        </span>
      </div>
    </header>
  );
}