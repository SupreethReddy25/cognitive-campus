import React, { useState, useEffect, useMemo } from 'react';
import { sheetsService } from '../services/api';
import { Loader2, Search, BookOpen, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const SOURCE_BADGE = {
  Blind:    'border-violet-500/25 bg-violet-500/10 text-violet-300',
  NeetCode: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  Company:  'border-amber-500/25 bg-amber-500/10 text-amber-300',
};

export default function SheetsPage() {
  const [sheets, setSheets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    sheetsService.getSheets().then(res => {
      if (res.data.success) setSheets(res.data.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = useMemo(() =>
    sheets.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.source.toLowerCase().includes(search.toLowerCase())
    ), [sheets, search]);

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-semibold text-[13px] text-zinc-200">Sheets</span>
          {!loading && (
            <>
              <span className="mx-1.5 h-3 w-px bg-white/[0.06]" />
              <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600">
                {filtered.length} sheet{filtered.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        {/* Inline search */}
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 w-52 focus-within:border-[var(--signal)]/30 transition-colors duration-200">
          <Search className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Search sheets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent font-sans text-[12px] text-zinc-300 outline-none placeholder:text-zinc-700"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-700 hover:text-zinc-400 transition-colors">
              <X className="h-3 w-3" strokeWidth={1.6} />
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="px-10 py-8">
        {/* Section label */}
        <div className="mb-6">
          <div className="font-mono text-[9px] tracking-[0.28em] text-zinc-700 uppercase mb-3">
            Curated Problem Sets
          </div>
          <h1 className="text-[32px] font-extralight leading-tight tracking-tight text-zinc-100">
            Structured{' '}
            <span className="font-serif italic" style={{ color: 'var(--signal)' }}>
              prep paths.
            </span>
          </h1>
          <p className="mt-2 max-w-lg font-sans text-[13px] text-zinc-500 leading-relaxed">
            Follow community-proven lists like Blind 75 and NeetCode 150.
            Track your progress across external problems and Arena problems.
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-600" strokeWidth={1.5} />
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700">LOADING</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">
              {search ? 'No sheets match that search' : 'No sheets available'}
            </span>
          </div>
        ) : (
          /* Table layout */
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_100px_120px_80px] items-center gap-6 border-b border-white/[0.06] py-2.5 font-mono text-[9px] tracking-[0.24em] text-zinc-700 uppercase">
              <span>Sheet</span>
              <span>Source</span>
              <span>Progress</span>
              <span />
            </div>

            {/* Rows */}
            {filtered.map((sheet, i) => {
              const sourceBadge = SOURCE_BADGE[sheet.source] || 'border-white/[0.08] bg-white/[0.02] text-zinc-500';
              return (
                <Link
                  key={sheet._id}
                  to={`/sheets/${sheet.slug}`}
                  className="stagger-in grid grid-cols-[2fr_100px_120px_80px] items-center gap-6 border-b border-white/[0.04] py-4 row-interactive group"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Name + description */}
                  <div>
                    <div className="flex items-center gap-3 mb-0.5">
                      <BookOpen className="h-3.5 w-3.5 text-zinc-600 group-hover:text-[var(--signal)] shrink-0 transition-colors" strokeWidth={1.6} />
                      <span className="font-sans text-[14px] font-medium text-zinc-100 group-hover:text-white transition-colors">
                        {sheet.name}
                      </span>
                    </div>
                    {sheet.description && (
                      <p className="ml-[22px] font-sans text-[12px] text-zinc-600 leading-snug line-clamp-1">
                        {sheet.description}
                      </p>
                    )}
                  </div>

                  {/* Source badge */}
                  <span className={`inline-flex items-center justify-center rounded border px-2 py-0.5 font-mono text-[9px] tracking-widest ${sourceBadge}`}>
                    {sheet.source}
                  </span>

                  {/* Progress */}
                  <div className="flex flex-col gap-1 min-w-0">
                    {sheet.userProgress ? (
                      <>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono text-[9px] text-zinc-600 tabular-nums">
                            {sheet.userProgress.solved}/{sheet.userProgress.total}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-700">
                            {sheet.userProgress.total > 0
                              ? Math.round((sheet.userProgress.solved / sheet.userProgress.total) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--signal)] transition-[width] duration-700"
                            style={{
                              width: sheet.userProgress.total > 0
                                ? `${Math.round((sheet.userProgress.solved / sheet.userProgress.total) * 100)}%`
                                : '0%'
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 font-mono text-[12px] tabular-nums text-zinc-400">
                        <CheckCircle2 className="h-3 w-3 text-zinc-700" strokeWidth={1.6} />
                        {sheet.totalProblems}
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-end">
                    <ChevronRight
                      className="h-4 w-4 text-zinc-700 group-hover:text-[var(--signal)] group-hover:translate-x-0.5 transition-all duration-200"
                      strokeWidth={1.6}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
