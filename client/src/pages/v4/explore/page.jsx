import { Link } from 'react-router-dom';
import { Compass, ArrowUpRight } from "lucide-react";

const TRACKS = [{
  id: "01",
  title: "Graph Algorithms",
  kicker: "TOPOLOGY · INVARIANTS",
  desc: "Kahn, Tarjan, Johnson. Cycles, bridges, articulation points — ninety problems, sequenced by BKT dependency.",
  problems: 90,
  hours: 42
}, {
  id: "02",
  title: "Dynamic Programming",
  kicker: "STATE · TRANSITION",
  desc: "From LIS and LCS to convex-hull optimisation, divide-and-conquer DP, and Knuth optimisation.",
  problems: 120,
  hours: 58
}, {
  id: "03",
  title: "Concurrent Data Structures",
  kicker: "LOCK-FREE · LINEARIZABILITY",
  desc: "Implement, prove, and harden Treiber stacks, Michael-Scott queues, and hazard pointers.",
  problems: 34,
  hours: 28
}, {
  id: "04",
  title: "Strings & Automata",
  kicker: "SUFFIX · ARRAYS",
  desc: "KMP, Z-function, suffix automata, Aho-Corasick. End-state: writing a regex engine that passes 10k tests.",
  problems: 76,
  hours: 36
}, {
  id: "05",
  title: "Probabilistic Structures",
  kicker: "BLOOM · COUNT-MIN",
  desc: "Tail bounds, streaming approximation, reservoir sampling. Build them from first principles.",
  problems: 28,
  hours: 22
}, {
  id: "06",
  title: "System Design · Whiteboard",
  kicker: "CAP · CONSISTENCY",
  desc: "Design Dropbox, a global counter, a distributed rate limiter. Argue trade-offs to the Socratic mentor.",
  problems: 18,
  hours: 32
}];

export default function ExplorePage() {
  return <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-12 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span className="text-zinc-200">EXPLORE</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <Compass className="h-3 w-3" strokeWidth={1.5} />
            <span>CURATED TRACKS</span>
          </div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-zinc-600">
            {TRACKS.length} TRACKS · {TRACKS.reduce((a, t) => a + t.problems, 0)} PROBLEMS
          </div>
        </header>

        <section className="border-b border-white/[0.04] px-12 pb-12 pt-12">
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span>03 / 05 · EXPLORE</span>
            <span className="h-px w-8 bg-white/[0.08]" />
            <span className="text-zinc-500">SEQUENCED BY DEPENDENCY</span>
          </div>
          <h1 className="max-w-3xl font-sans text-[64px] font-medium leading-[0.94] tracking-tight-editorial text-zinc-50 text-balance">
            Learn in <span className="text-[var(--signal)]">tracks</span>, not lists.
          </h1>
          <p className="mt-4 max-w-xl font-sans text-[14px] leading-relaxed text-zinc-500 text-pretty">
            Each track sequences problems by Bayesian dependency. Finish one, unlock the next
            adversarial set.
          </p>
        </section>

        <section className="grid flex-1 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {TRACKS.map((t, i) => <Link key={t.id} to="/problems" className={`ease-signature group relative flex flex-col gap-6 border-white/[0.04] px-10 py-10 transition-colors duration-300 hover:bg-white/[0.015] ${i % 3 !== 2 ? "xl:border-r" : ""} ${i % 2 === 0 ? "lg:border-r" : ""} border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.28em] text-zinc-500">
                  <span className="text-zinc-700">{t.id}</span>
                  <span className="h-px w-4 bg-white/[0.08]" />
                  <span>{t.kicker}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-700 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--signal)]" strokeWidth={1.5} />
              </div>

              <h3 className="font-sans text-[32px] font-medium leading-[0.98] tracking-tight-editorial text-zinc-100 text-balance">
                {t.title}
              </h3>

              <p className="font-sans text-[13px] leading-relaxed text-zinc-500 text-pretty">
                {t.desc}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-4 font-mono text-[10px] tracking-widest text-zinc-600">
                <span>
                  <span className="text-zinc-300">{t.problems}</span> PROBLEMS
                </span>
                <span>
                  ~<span className="text-zinc-300">{t.hours}</span>H DEEP WORK
                </span>
                <span className="text-[var(--signal)]/80">START · TRACK</span>
              </div>

              <span className="absolute right-4 top-4 h-1 w-1 bg-white/[0.06]" />
            </Link>)}
        </section>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-12 py-5 font-mono text-[9px] tracking-[0.28em] text-zinc-700">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <div className="flex items-center gap-4">
            <span>TRACKS ENGINE · v1.4</span>
            <span className="text-[var(--signal)]/70">OK</span>
          </div>
        </div>
      </div>
    </div>;
}