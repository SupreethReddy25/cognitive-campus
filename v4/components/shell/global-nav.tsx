"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Compass,
  LayoutDashboard,
  Settings,
  Terminal,
  Trophy,
  User,
} from "lucide-react"

const SECTION_A = [
  { label: "DASHBOARD", href: "/", icon: LayoutDashboard, index: "01" },
  { label: "WORKSPACE", href: "/workspace", icon: Terminal, index: "02" },
  { label: "EXPLORE", href: "/explore", icon: Compass, index: "03" },
  { label: "LEADERBOARD", href: "/leaderboard", icon: Trophy, index: "04" },
  { label: "PROFILE", href: "/profile", icon: User, index: "05" },
] as const

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

function formatHMS(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

export function GlobalNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="relative flex h-screen w-[250px] shrink-0 flex-col border-r border-white/[0.04] bg-background">
      {/* ── Brand mark ─────────────────────────────────── */}
      <div className="flex h-[56px] items-center border-b border-white/[0.04] px-5">
        <Link href="/" className="press ease-signature group flex items-center gap-2.5">
          <div className="relative grid-cross">
            <div className="flex h-4 w-4 items-center justify-center border border-white/25 transition-colors group-hover:border-white/40">
              <div className="h-1 w-1 bg-[var(--signal)]" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-zinc-200">
              COGNITIVE
            </span>
            <span className="mt-0.5 font-mono text-[10px] tracking-[0.22em] text-zinc-500">
              CAMPUS
            </span>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-600">LIVE</span>
        </div>
      </div>

      {/* ── Session meta strip ─────────────────────────── */}
      <div className="flex h-8 items-center justify-between border-b border-white/[0.04] px-5">
        <span className="font-mono text-[9px] tracking-[0.22em] text-zinc-700">SESSION</span>
        <span className="font-mono text-[10px] tabular-nums text-zinc-400">
          {mounted ? formatHMS(elapsed) : "00:00:00"}
        </span>
      </div>

      {/* ── Primary nav ────────────────────────────────── */}
      <nav className="flex flex-col border-b border-white/[0.04]">
        {SECTION_A.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`ease-signature press group relative flex h-12 items-center gap-3 border-b border-white/[0.03] pl-5 pr-4 transition-colors duration-300 ${
                active ? "bg-white/[0.015]" : "hover:bg-white/[0.02]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[var(--signal)]" />
              )}
              <Icon
                className={`h-3.5 w-3.5 transition-colors ${
                  active ? "text-[var(--signal)]" : "text-zinc-600 group-hover:text-zinc-400"
                }`}
                strokeWidth={1.5}
              />
              <span
                className={`font-mono text-[11px] font-medium tracking-[0.22em] transition-colors ${
                  active ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-200"
                }`}
              >
                {item.label}
              </span>
              <span
                className={`ml-auto font-mono text-[9px] tracking-widest ${
                  active ? "text-[var(--signal)]" : "text-zinc-800"
                }`}
              >
                {item.index}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Ambient editorial column ───────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-surgical px-5 py-5">
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 font-mono text-[9px] tracking-[0.22em] text-zinc-700">
              CURRENT · FOCUS
            </div>
            <div className="font-sans text-[13px] leading-snug text-zinc-300 text-balance">
              Graph algorithms · cycle detection in directed graphs
            </div>
            <div className="mt-2 flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-zinc-600">
              <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
              <span>BKT MASTERY · 62%</span>
            </div>
          </div>

          <div className="h-px w-full bg-white/[0.04]" />

          <div>
            <div className="mb-2 font-mono text-[9px] tracking-[0.22em] text-zinc-700">
              WEEKLY · PULSE
            </div>
            <div className="flex items-end gap-[3px]">
              {[32, 48, 22, 61, 44, 78, 55].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-white/[0.06]"
                  style={{ height: `${h * 0.45}px` }}
                >
                  <div
                    className="w-full bg-[var(--signal)]/80"
                    style={{ height: `${Math.max(2, h * 0.25)}px` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] tracking-widest text-zinc-700">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>
          </div>

          <div className="h-px w-full bg-white/[0.04]" />

          <div>
            <div className="mb-1.5 font-mono text-[9px] tracking-[0.22em] text-zinc-700">
              RELEASE · v4.2
            </div>
            <div className="font-sans text-[11.5px] leading-snug text-zinc-500">
              Socratic mentor v2.1 now ships Bayesian trace deltas per session.
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: user chip ──────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.04]">
        <button className="ease-signature press group flex w-full items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/[0.1] bg-white/[0.02] font-mono text-[10px] text-zinc-200">
            SR
          </div>
          <div className="flex flex-1 flex-col items-start leading-tight">
            <span className="font-sans text-[12px] font-medium text-zinc-200">Supreeth R.</span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-600">
              LVL 27 · ADEPT
            </span>
          </div>
          <Settings
            className="h-3.5 w-3.5 text-zinc-700 transition-colors group-hover:text-zinc-400"
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* edge accent */}
      <span className="absolute right-[-1.5px] top-[56px] h-[3px] w-[3px] rounded-[1px] bg-[var(--signal)] opacity-50" />
      <span className="absolute right-[-1.5px] bottom-[64px] h-[3px] w-[3px] rounded-[1px] bg-[var(--signal)] opacity-30" />
    </aside>
  )
}
