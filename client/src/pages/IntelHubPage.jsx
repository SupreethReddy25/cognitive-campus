import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { companiesService } from '../services/api';
import {
  Search, Shield, Loader2, X, ChevronDown, ChevronRight,
  ArrowUpRight, Sparkles, Activity, TrendingUp
} from 'lucide-react';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { ReviewQueue } from '../components/intel/ReviewQueue';

// ─── Config ─────────────────────────────────────────────────────────────────
const TIER_DOT = {
  'FAANG':   'bg-violet-400',
  'Product': 'bg-[var(--signal)]',
  'Service': 'bg-sky-400',
  'Startup': 'bg-amber-400',
};
const DIFF_DOT = {
  'Brain-melting': 'bg-rose-500', 'Very Hard': 'bg-rose-500', 'Hard': 'bg-rose-500',
  'Grueling': 'bg-amber-500',    'Challenging': 'bg-amber-500', 'Medium': 'bg-amber-500',
  'Easy': 'bg-[var(--signal)]',  'Smooth': 'bg-[var(--signal)]',
};
const DIFF_RANK = {
  'Brain-melting': 5, 'Very Hard': 5, 'Hard': 4,
  'Grueling': 3, 'Challenging': 3, 'Medium': 2, 'Easy': 1, 'Smooth': 1,
};
const FILTERS = ['All', 'FAANG', 'Product', 'Service', 'Startup'];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function IntelHubPage() {
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy]             = useState('default');
  const [expandedId, setExpandedId]     = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [successMsg, setSuccessMsg]     = useState(false);
  const [activeTab, setActiveTab]       = useState('companies'); // 'companies' | 'review'
  const searchRef = useRef(null);

  // `/` keyboard shortcut → focus search
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === '/'
        && document.activeElement.tagName !== 'INPUT'
        && document.activeElement.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    companiesService.getCompanies()
      .then(res => { if (res.data.success) setCompanies(res.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalRounds = companies.reduce(
      (a, c) => a + (c.interviewProcess?.rounds?.length || 0), 0
    );
    return {
      total:     companies.length,
      faang:     companies.filter(c => c.tier === 'FAANG').length,
      avgRounds: companies.length ? (totalRounds / companies.length).toFixed(1) : '—',
    };
  }, [companies]);

  const filtered = useMemo(() => {
    let list = companies.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || c.name.toLowerCase().includes(q)
        || c.tier?.toLowerCase().includes(q)
        || c.roles?.some(r => r.toLowerCase().includes(q));
      const matchFilter = activeFilter === 'All' || c.tier === activeFilter;
      return matchSearch && matchFilter;
    });
    if (sortBy === 'difficulty')
      list = [...list].sort((a, b) =>
        (DIFF_RANK[b.interviewProcess?.difficulty] || 0) - (DIFF_RANK[a.interviewProcess?.difficulty] || 0)
      );
    else if (sortBy === 'rounds')
      list = [...list].sort((a, b) =>
        (b.interviewProcess?.rounds?.length || 0) - (a.interviewProcess?.rounds?.length || 0)
      );
    return list;
  }, [companies, search, activeFilter, sortBy]);

  const toggleExpand = useCallback(
    (id) => setExpandedId(prev => prev === id ? null : id),
    []
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">

      {/* ── Sticky header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)] status-dot" />
          <span className="font-mono text-[10px] tracking-[0.24em] text-zinc-200 uppercase">Intel Hub</span>
          <span className="mx-2 h-3 w-px bg-white/[0.06]" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">Company Intelligence</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.6} />
            <span className="font-mono text-[12px] text-zinc-400 tabular-nums">{stats.total}</span>
            <span className="font-mono text-[11px] text-zinc-600">companies</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--signal)]" />
            <span className="font-mono text-[12px] font-semibold text-zinc-200 tabular-nums">{stats.faang}</span>
            <span className="font-mono text-[11px] text-zinc-500">FAANG</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <span className="font-mono text-[12px] text-zinc-400 tabular-nums">{stats.avgRounds}</span>
            <span className="font-mono text-[11px] text-zinc-600">avg rounds</span>
          </div>
        </div>
      </header>

      {/* ── Command Search Hero ─────────────────────────────────── */}
      <section className="border-b border-white/[0.04] px-10 py-10">
        <div className="flex items-center gap-2 mb-6 justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-[var(--signal)]" strokeWidth={2} />
            <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase">
              03 / 05 · Company Intelligence
            </span>
          </div>
          
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-black/40 p-1">
            <button
              onClick={() => setActiveTab('companies')}
              className={`press rounded px-4 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors ${
                activeTab === 'companies' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Companies
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`press rounded px-4 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'review' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Review Queue
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--signal)] animate-pulse" />
            </button>
          </div>
        </div>

        {/* Large search bar is the hero */}
        <div
          className="group relative flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 transition-all duration-300 focus-within:border-[var(--signal)]/30 focus-within:bg-[var(--signal)]/[0.02] hover:border-white/[0.12] max-w-2xl cursor-text"
          onClick={() => searchRef.current?.focus()}
        >
          <Search
            className="h-5 w-5 text-zinc-600 shrink-0 group-focus-within:text-[var(--signal)] transition-colors duration-200"
            strokeWidth={1.6}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Which company are you preparing for?"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent font-sans text-[15px] text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          {search ? (
            <button
              onClick={e => { e.stopPropagation(); setSearch(''); }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" strokeWidth={1.6} />
            </button>
          ) : (
            <kbd className="flex items-center gap-0.5 rounded border border-white/[0.08] px-2 py-1 font-mono text-[9px] text-zinc-700">
              /
            </kbd>
          )}
        </div>

        <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-zinc-700">
          {filtered.length} {filtered.length === 1 ? 'company' : 'companies'} ·
          Click any row to preview intel
        </p>
      </section>

      {/* ── Filter + sort bar (Companies Tab) ────────────────── */}
      {activeTab === 'companies' && (
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.04] px-10 py-3">
        {/* Tier filters */}
        <div className="flex items-center gap-1 border border-white/[0.06] bg-white/[0.01] p-[2px]">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`press ease-signature px-3 py-1 font-mono text-[10px] tracking-[0.15em] uppercase transition-all duration-300 ${
                activeFilter === f
                  ? 'bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20'
                  : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="appearance-none bg-transparent font-mono text-[10px] tracking-widest text-zinc-500 outline-none cursor-pointer pr-4"
          >
            <option value="default"    className="bg-[#0d1117]">DEFAULT</option>
            <option value="difficulty" className="bg-[#0d1117]">DIFFICULTY</option>
            <option value="rounds"     className="bg-[#0d1117]">ROUNDS</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-700 pointer-events-none" strokeWidth={1.6} />
        </div>

        {/* Share CTA */}
        <button
          onClick={() => setSubmitTarget({ _id: '', name: '' })}
          className="ml-auto group flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-[11px] font-semibold tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-110"
        >
          <Shield className="h-3 w-3" strokeWidth={1.6} />
          Share Intel
        </button>
      </div>
      )}

      {/* ── Company table (Companies Tab) ────────────────────── */}
      {activeTab === 'companies' && (
      <section className="px-10 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-700">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
            <span className="font-mono text-[10px] tracking-[0.24em]">LOADING INTEL...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">No companies match</span>
            <button
              onClick={() => { setSearch(''); setActiveFilter('All'); }}
              className="mt-2 font-mono text-[10px] text-zinc-600 hover:text-[var(--signal)] transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2.5fr_90px_120px_160px_100px] items-center gap-4 border-b border-white/[0.06] py-2.5 font-mono text-[9px] tracking-[0.26em] text-zinc-700 uppercase">
              <span className="pl-6">Company</span>
              <span>Tier</span>
              <span>Avg CTC</span>
              <span>Rounds</span>
              <span>Difficulty</span>
            </div>

            <ul>
              {filtered.map((company, i) => {
                const rounds   = company.interviewProcess?.rounds || [];
                const diff     = company.interviewProcess?.difficulty;
                const tierDot  = TIER_DOT[company.tier] || 'bg-zinc-500';
                const diffDot  = DIFF_DOT[diff]         || 'bg-zinc-600';
                const expanded = expandedId === company._id;

                return (
                  <li
                    key={company._id}
                    className="stagger-in border-b border-white/[0.04]"
                    style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                  >
                    {/* ── Main row ── */}
                    <div
                      className={`group grid grid-cols-[2.5fr_90px_120px_160px_100px] items-center gap-4 py-4 cursor-pointer transition-all duration-200 row-interactive ${
                        expanded ? 'bg-[var(--signal)]/[0.03] border-l-2 border-l-[var(--signal)]/30' : ''
                      }`}
                      onClick={() => toggleExpand(company._id)}
                    >
                      {/* Name + roles */}
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-zinc-700 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90 !text-[var(--signal)]' : ''}`}
                          strokeWidth={1.6}
                        />
                        <div className="min-w-0">
                          <div className="font-sans text-[14px] font-medium text-zinc-100 group-hover:text-white transition-colors truncate">
                            {company.name}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-zinc-600 truncate">
                            {company.roles?.slice(0, 3).join(' · ')}
                          </div>
                        </div>
                      </div>

                      {/* Tier */}
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${tierDot} shadow-[0_0_6px_currentColor]`} />
                        <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-400">{company.tier}</span>
                      </div>

                      {/* CTC */}
                      <span className="font-mono text-[11px] text-zinc-300 tabular-nums">{company.avgCTC || '—'}</span>

                      {/* Rounds */}
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {rounds.slice(0, 2).map((r, j) => (
                          <span key={j} className="rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-zinc-600 max-w-[80px] truncate">
                            {r.name}
                          </span>
                        ))}
                        {rounds.length > 2 && (
                          <span className="font-mono text-[9px] text-zinc-700 self-center">+{rounds.length - 2}</span>
                        )}
                        {rounds.length === 0 && <span className="font-mono text-[9px] text-zinc-700">—</span>}
                      </div>

                      {/* Difficulty */}
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${diffDot}`} />
                        <span className="font-mono text-[10px] tracking-widest text-zinc-500">{diff || '—'}</span>
                      </div>
                    </div>

                    {/* ── Expanded preview ── */}
                    {expanded && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200 bg-white/[0.015] border-t border-white/[0.04] px-8 py-5">
                        <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
                          {/* Left: detail content */}
                          <div className="space-y-5">
                            {/* All rounds as pill chain */}
                            {rounds.length > 0 && (
                              <div>
                                <div className="font-mono text-[9px] tracking-[0.24em] text-zinc-700 uppercase mb-2.5">Interview Structure</div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {rounds.map((r, j) => (
                                    <React.Fragment key={j}>
                                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[10px] tracking-widest text-zinc-300">
                                        {r.name}
                                      </span>
                                      {j < rounds.length - 1 && (
                                        <span className="h-px w-4 bg-white/[0.1] shrink-0" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Insider tip */}
                            {company.interviewProcess?.tipsSummary && (
                              <div className="flex gap-3">
                                <div className="mt-1.5 w-0.5 shrink-0 rounded-full bg-[var(--signal)]/30 self-stretch min-h-[16px]" />
                                <p className="font-sans text-[12px] leading-relaxed text-zinc-500 line-clamp-2">
                                  {company.interviewProcess.tipsSummary}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right: action buttons */}
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <Link
                              to={`/companies/${company.slug}`}
                              onClick={e => e.stopPropagation()}
                              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-5 py-2 text-[11px] font-bold tracking-[0.15em] text-white uppercase border border-[var(--signal)]/20 transition-all duration-300 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_25px_-5px_rgba(52,211,153,0.3)]"
                            >
                              Full Intel
                              <ArrowUpRight
                                className="h-3.5 w-3.5 text-emerald-400/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                                strokeWidth={2}
                              />
                            </Link>
                            <button
                              onClick={e => { e.stopPropagation(); setSubmitTarget(company); }}
                              className="press font-mono text-[9px] tracking-[0.18em] text-zinc-600 hover:text-[var(--signal)] transition-colors uppercase"
                            >
                              + Share Intel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="pt-5 font-mono text-[9px] tracking-[0.2em] text-zinc-700 uppercase">
              {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}
              {activeFilter !== 'All' && ` · ${activeFilter}`}
              {search && ` matching "${search}"`}
            </p>
          </>
        )}
      </section>
      )}

      {/* ── Review Queue Tab ──────────────────────────────────── */}
      {activeTab === 'review' && <ReviewQueue />}

      {/* ── Success toast ─────────────────────────────────────── */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[var(--signal)]/20 bg-background/90 px-5 py-3 font-mono text-[11px] text-[var(--signal)] shadow-xl backdrop-blur-xl stagger-in">
          <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span>Intel published · Thank you</span>
          <button onClick={() => setSuccessMsg(false)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────── */}
      {submitTarget !== null && (
        <SubmitExperienceModal
          company={submitTarget._id ? submitTarget : null}
          companies={companies}
          onClose={() => setSubmitTarget(null)}
          onSuccess={() => { setSubmitTarget(null); setSuccessMsg(true); }}
        />
      )}
    </div>
  );
}
