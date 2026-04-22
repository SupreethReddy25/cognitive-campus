import { user, activity, skills, recentSolves } from "@/lib/app-data"
import { ProfileHeatmap } from "./heatmap"
import { ExternalLink, MapPin, Calendar } from "lucide-react"

export function ProfileView() {
  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">
        {/* toolbar */}
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-12 backdrop-blur-md">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.24em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span className="text-zinc-200">PROFILE</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <span>@{user.handle}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] text-zinc-600">
            <span>PUBLIC · READ-ONLY</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <button className="press ease-signature border border-white/[0.06] px-2 py-0.5 text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200">
              EDIT
            </button>
          </div>
        </header>

        {/* hero */}
        <section className="border-b border-white/[0.04] px-12 pb-12 pt-12">
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span>05 / 05 · DEVELOPER · RESUME</span>
            <span className="h-px w-8 bg-white/[0.08]" />
            <span className="text-zinc-500">JOINED {user.joined}</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-[11px] tracking-[0.28em] text-zinc-500">
                @{user.handle}
              </div>
              <h1 className="mt-2 font-sans text-[72px] font-medium leading-[0.94] tracking-tight-editorial text-zinc-50 text-balance">
                {user.fullName}
              </h1>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.22em] text-zinc-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {user.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                JOINED {user.joined}
              </span>
            </div>
          </div>
        </section>

        {/* Two-column body */}
        <div className="grid flex-1 lg:grid-cols-[380px_1fr]">
          {/* Left column — sidebar resume */}
          <aside className="border-r border-white/[0.04]">
            {/* avatar */}
            <div className="flex items-center gap-4 border-b border-white/[0.04] px-10 py-8">
              <div className="relative flex h-16 w-16 items-center justify-center border border-white/[0.1] bg-white/[0.02] font-mono text-[20px] text-zinc-200">
                {user.initials}
                <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-background bg-[var(--signal)]" />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.24em] text-[var(--signal)]/80">
                  LVL {user.level} · {user.tier}
                </div>
                <div className="mt-1 font-sans text-[14px] font-medium text-zinc-200">
                  {user.xp.toLocaleString()} XP
                </div>
                <div className="mt-1.5 h-[2px] w-40 bg-white/[0.05]">
                  <div
                    className="h-full bg-[var(--signal)]/80"
                    style={{ width: `${Math.min(100, (user.xp / user.xpToNext) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 font-mono text-[9px] tracking-widest text-zinc-600">
                  {user.xpToNext - user.xp} TO LVL {user.level + 1}
                </div>
              </div>
            </div>

            {/* bio */}
            <div className="border-b border-white/[0.04] px-10 py-7">
              <div className="mb-3 font-mono text-[9px] tracking-[0.28em] text-zinc-500">
                BIOGRAPHY
              </div>
              <p className="font-sans text-[13.5px] leading-relaxed text-zinc-300 text-pretty">
                {user.bio}
              </p>
            </div>

            {/* links */}
            <div className="border-b border-white/[0.04] px-10 py-7">
              <div className="mb-3 font-mono text-[9px] tracking-[0.28em] text-zinc-500">
                LINKS
              </div>
              <ul className="space-y-2">
                {user.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="ease-signature group flex items-center justify-between py-1.5 font-mono text-[11px] tracking-[0.18em] text-zinc-400 transition-colors hover:text-[var(--signal)]"
                    >
                      <span>{l.label}</span>
                      <ExternalLink
                        className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100"
                        strokeWidth={1.5}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* numbers */}
            <div className="px-10 py-7">
              <div className="mb-4 font-mono text-[9px] tracking-[0.28em] text-zinc-500">
                ACTIVITY · LIFETIME
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <StatCell label="SOLVES" value={activity.solves.toString()} />
                <StatCell label="PER WEEK" value={activity.perWeekAvg.toFixed(1)} />
                <StatCell
                  label="CURRENT STREAK"
                  value={`${activity.currentStreak}D`}
                  primary
                />
                <StatCell label="BEST STREAK" value={`${activity.bestStreak}D`} />
                <StatCell
                  label="ACCEPT RATE"
                  value={`${activity.acceptanceRate.toFixed(1)}%`}
                />
                <StatCell label="AVG RUNTIME" value={`${activity.avgRuntimeMs}ms`} />
                <StatCell label="DEEP HOURS" value={activity.totalHours.toString()} />
                <StatCell label="CONTESTS" value={activity.contestsRated.toString()} />
              </div>
            </div>
          </aside>

          {/* Right column */}
          <section className="flex min-w-0 flex-col">
            {/* Heatmap */}
            <div className="border-b border-white/[0.04] px-10 py-10">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.28em] text-zinc-500">
                    01 · ACTIVITY · HEATMAP
                  </div>
                  <h2 className="mt-2 font-sans text-[26px] font-medium leading-tight tracking-tight-editorial text-zinc-100 text-balance">
                    {activity.solves} contributions over{" "}
                    <span className="text-[var(--signal)]">the last year</span>.
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] text-zinc-600">
                  <span>LESS</span>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className="h-2.5 w-2.5 border border-white/[0.06]"
                      style={{
                        backgroundColor:
                          n === 0
                            ? "transparent"
                            : `color-mix(in oklab, var(--signal) ${15 + n * 18}%, transparent)`,
                      }}
                    />
                  ))}
                  <span>MORE</span>
                </div>
              </div>

              <ProfileHeatmap />
            </div>

            {/* Skills mastery */}
            <div className="border-b border-white/[0.04] px-10 py-10">
              <div className="mb-6">
                <div className="font-mono text-[10px] tracking-[0.28em] text-zinc-500">
                  02 · SKILL · LADDER
                </div>
                <h2 className="mt-2 font-sans text-[22px] font-medium leading-tight tracking-tight-editorial text-zinc-100">
                  Mastery across pillars.
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                {skills.map((s) => (
                  <div key={s.key} className="flex items-center gap-4">
                    <span className="w-20 font-mono text-[10px] tracking-[0.22em] text-zinc-500">
                      {s.key}
                    </span>
                    <div className="relative h-[3px] flex-1 bg-white/[0.05]">
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--signal)]/80 transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{ width: `${s.score}%` }}
                      />
                      {[25, 50, 75].map((t) => (
                        <span
                          key={t}
                          className="absolute inset-y-0 w-px bg-white/[0.08]"
                          style={{ left: `${t}%` }}
                        />
                      ))}
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] tabular-nums text-zinc-300">
                      {s.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently solved hard problems */}
            <div className="border-b border-white/[0.04] px-10 py-10">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.28em] text-zinc-500">
                    03 · RECENT · HARD · SOLVES
                  </div>
                  <h2 className="mt-2 font-sans text-[22px] font-medium leading-tight tracking-tight-editorial text-zinc-100">
                    Last <span className="text-[var(--signal)]">6 surgical wins</span>.
                  </h2>
                </div>
                <button className="press ease-signature border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] tracking-[0.22em] text-zinc-400 transition-colors hover:border-white/[0.16] hover:text-zinc-200">
                  VIEW ALL
                </button>
              </div>

              <div className="grid grid-cols-[80px_1fr_220px_120px_120px] items-center gap-6 border-y border-white/[0.06] py-3 font-mono text-[9px] tracking-[0.28em] text-zinc-600">
                <span>ID</span>
                <span>PROBLEM</span>
                <span>PATTERN</span>
                <span>RUNTIME</span>
                <span>PERCENTILE</span>
              </div>

              <ul>
                {recentSolves.map((s) => (
                  <li
                    key={s.id}
                    className="ease-signature grid grid-cols-[80px_1fr_220px_120px_120px] items-center gap-6 border-b border-white/[0.04] py-4 transition-colors hover:bg-white/[0.015]"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-zinc-500">{s.id}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span className="font-sans text-[14px] font-medium text-zinc-100">
                          {s.title}
                        </span>
                      </div>
                      <span className="mt-0.5 block font-mono text-[9px] tracking-widest text-zinc-600">
                        {s.date}
                      </span>
                    </div>
                    <span className="truncate font-mono text-[10px] tracking-[0.2em] text-zinc-400">
                      {s.pattern}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-zinc-300">
                      {s.runtime}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-[2px] w-16 bg-white/[0.05]">
                        <div
                          className="h-full bg-[var(--signal)]/80"
                          style={{ width: `${s.percentile}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                        {s.percentile.toFixed(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-12 py-5 font-mono text-[9px] tracking-[0.28em] text-zinc-700">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <div className="flex items-center gap-4">
            <span>RESUME EXPORT · PDF</span>
            <span className="text-[var(--signal)]/70">OK</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  primary,
}: {
  label: string
  value: string
  primary?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 border-l border-white/[0.06] pl-3">
      <span className="font-mono text-[9px] tracking-[0.22em] text-zinc-600">{label}</span>
      <span
        className={`font-sans text-[18px] font-medium tabular-nums leading-none ${
          primary ? "text-[var(--signal)]" : "text-zinc-200"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
