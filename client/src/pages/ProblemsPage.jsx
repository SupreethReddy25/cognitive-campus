import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemsService, skillsService } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ChevronLeft, ChevronRight, Terminal, ArrowUpRight, Loader2 } from 'lucide-react';

const DIFFS = ['all', 'easy', 'medium', 'hard'];

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    skillsService.getAllSkills().then((r) => setSkills(r.data.data.skills)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (selectedSkill) params.skillId = selectedSkill;
        if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
        const r = await problemsService.getProblems(params);
        setProblems(r.data.data.problems);
        setTotalPages(r.data.data.totalPages);
        setTotalCount(r.data.data.totalCount);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [page, selectedSkill, selectedDifficulty]);

  const diffDot = (d) => d === 'easy' ? 'bg-[var(--signal)]' : d === 'medium' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      <div className="flex min-h-full flex-col">
        {/* Top toolbar */}
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-12 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.24em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span className="text-zinc-200">WORKSPACE</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <Terminal className="h-3 w-3" strokeWidth={1.5} />
            <span>PROBLEM BROWSER</span>
          </div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-zinc-600">
            {totalCount} PROBLEMS
          </div>
        </header>

        {/* Editorial hero */}
        <section className="border-b border-white/[0.04] px-12 pb-10 pt-10">
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            <span>02 / 05 · WORKSPACE</span>
            <span className="h-px w-8 bg-white/[0.08]" />
            <span className="text-zinc-500">SELECT A PROBLEM</span>
          </div>
          <h1 className="max-w-3xl font-sans text-[64px] font-medium leading-[0.94] tracking-tight-editorial text-zinc-50 text-balance">
            Choose your <span className="text-[var(--signal)]">challenge</span>.
          </h1>
          <p className="mt-4 max-w-xl font-sans text-[14px] leading-relaxed text-zinc-500 text-pretty">
            Filter by skill or difficulty. Each problem feeds the Bayesian Knowledge Tracing engine.
          </p>
        </section>

        {/* Filters */}
        <section className="flex items-center gap-4 border-b border-white/[0.04] px-12 py-4">
          <select
            value={selectedSkill}
            onChange={(e) => { setSelectedSkill(e.target.value); setPage(1); }}
            className="bg-transparent border border-white/[0.06] px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 focus:outline-none focus:border-white/[0.12] appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#0a0a0a]">ALL SKILLS</option>
            {skills.map((s) => <option key={s._id} value={s._id} className="bg-[#0a0a0a]">{s.name.toUpperCase()}</option>)}
          </select>

          <div className="flex items-center gap-1 border border-white/[0.06] p-[2px]">
            {DIFFS.map((d) => (
              <button key={d} onClick={() => { setSelectedDifficulty(d); setPage(1); }}
                className={`press ease-signature px-3 py-1 font-mono text-[10px] tracking-[0.2em] transition-colors ${selectedDifficulty === d ? 'bg-white/[0.05] text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}>
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Problem list */}
        <section className="flex-1 px-12 py-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-600" /></div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 font-mono text-[10px] tracking-[0.24em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span>NO PROBLEMS MATCH · REFINE FILTERS</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[60px_1fr_180px_100px_60px] items-center gap-6 border-y border-white/[0.06] py-3 font-mono text-[9px] tracking-[0.28em] text-zinc-600">
                <span>NO.</span>
                <span>PROBLEM</span>
                <span>SKILL</span>
                <span>DIFFICULTY</span>
                <span />
              </div>
              <ul>
                {problems.map((p, i) => (
                  <li key={p._id} className="ease-signature group grid grid-cols-[60px_1fr_180px_100px_60px] items-center gap-6 border-b border-white/[0.04] py-4 transition-colors hover:bg-white/[0.015]">
                    <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                      {String((page - 1) * 15 + i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <Link to={`/problems/${p._id}`} className="truncate font-sans text-[15px] font-medium text-zinc-100 hover:text-[var(--signal)] transition-colors">
                        {p.title}
                      </Link>
                    </div>
                    <span className="truncate font-mono text-[10px] tracking-[0.2em] text-zinc-400">
                      {(p.skillId?.name || '').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${diffDot(p.difficulty)}`} />
                      <span className="font-mono text-[10px] tracking-widest text-zinc-400">
                        {p.difficulty?.toUpperCase()}
                      </span>
                    </div>
                    <Link to={`/problems/${p._id}`} className="press ease-signature flex h-7 w-7 items-center justify-center border border-white/[0.06] text-zinc-500 transition-colors group-hover:border-[var(--signal)]/60 group-hover:text-[var(--signal)]">
                      <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="press ease-signature flex items-center gap-1.5 border border-white/[0.06] px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-30">
                <ChevronLeft className="h-3 w-3" /> PREV
              </button>
              <span className="font-mono text-[10px] tabular-nums text-zinc-500">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="press ease-signature flex items-center gap-1.5 border border-white/[0.06] px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-30">
                NEXT <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </section>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] px-12 py-5 font-mono text-[9px] tracking-[0.28em] text-zinc-700">
          <span>COGNITIVE · CAMPUS / 2026</span>
          <div className="flex items-center gap-4">
            <span>PROBLEM ENGINE · v2.0</span>
            <span className="text-[var(--signal)]/70">OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;
