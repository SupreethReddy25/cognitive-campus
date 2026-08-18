import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sheetsService } from '../services/api';
import {
  Loader2, ArrowLeft, ExternalLink, Play,
  CheckCircle2, Circle, ArrowUpRight
} from 'lucide-react';

const DIFF_STYLE = {
  hard:   'text-rose-400',
  medium: 'text-amber-400',
  easy:   'text-[var(--signal)]',
};

export default function SheetDetailPage() {
  const { slug }            = useParams();
  const [sheet, setSheet]   = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    sheetsService.getSheet(slug).then(res => {
      if (res.data.success) {
        setSheet(res.data.data.sheet);
        setProgress(res.data.data.progress || []);
      }
      setLoading(false);
    }).catch(console.error);
  }, [slug]);

  const toggleProgress = async (identifier) => {
    const isDone = progress.includes(identifier);
    // Optimistic update
    setProgress(prev => isDone ? prev.filter(p => p !== identifier) : [...prev, identifier]);
    try {
      await sheetsService.updateProgress(slug, { problemIdentifier: identifier, completed: !isDone });
    } catch {
      // Revert
      setProgress(prev => isDone ? [...prev, identifier] : prev.filter(p => p !== identifier));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-600" strokeWidth={1.5} />
        <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700">LOADING</span>
      </div>
    );
  }
  if (!sheet) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">Sheet not found</span>
        <Link to="/sheets" className="font-mono text-[10px] text-zinc-600 hover:text-[var(--signal)] underline underline-offset-2 transition-colors">
          ← Back to Sheets
        </Link>
      </div>
    );
  }

  const done      = progress.length;
  const total     = sheet.problems.length || 1;
  const pct       = Math.round((done / total) * 100);
  const remaining = total - done;

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-surgical">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            to="/sheets"
            className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-zinc-600 hover:text-zinc-300 uppercase transition-colors duration-200"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={1.6} />
            Sheets
          </Link>
          <span className="mx-1.5 h-3 w-px bg-white/[0.06]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-200">{sheet.name}</span>
        </div>
        {/* Progress summary */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-600">
            {done}/{total} done
            {remaining > 0 && ` · ${remaining} left`}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1 w-24 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--signal)] transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-semibold text-[var(--signal)] tabular-nums">{pct}%</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="px-10 py-8">
        {/* Sheet header */}
        <div className="mb-8 border-b border-white/[0.04] pb-8">
          <div className="font-mono text-[9px] tracking-[0.28em] text-zinc-700 uppercase mb-3">
            {sheet.source} · {total} problems
          </div>
          <h1 className="text-[32px] font-extralight leading-tight tracking-tight text-zinc-100">
            <span className="font-serif italic" style={{ color: 'var(--signal)' }}>
              {sheet.name}
            </span>
          </h1>
          {sheet.description && (
            <p className="mt-2 max-w-xl font-sans text-[13px] text-zinc-500 leading-relaxed">
              {sheet.description}
            </p>
          )}
        </div>

        {/* Table */}
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_80px_80px_100px] items-center gap-4 border-b border-white/[0.06] py-2.5 font-mono text-[9px] tracking-[0.24em] text-zinc-700 uppercase">
            <span />
            <span>Problem</span>
            <span>Difficulty</span>
            <span>Topics</span>
            <span className="text-right">Action</span>
          </div>

          {sheet.problems.map((prob, idx) => {
            const identifier = prob.problemId || prob.externalUrl || prob.title;
            const isDone     = progress.includes(identifier);
            const diffClass  = DIFF_STYLE[prob.difficulty?.toLowerCase()] || 'text-zinc-500';

            return (
              <div
                key={idx}
                className={`stagger-in grid grid-cols-[40px_1fr_80px_80px_100px] items-center gap-4 border-b border-white/[0.04] py-3.5 transition-colors duration-200 hover:bg-white/[0.01] ${isDone ? 'opacity-50' : ''}`}
                style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleProgress(identifier)}
                  className="flex items-center justify-center text-zinc-600 hover:text-[var(--signal)] transition-colors duration-200"
                  title={isDone ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isDone
                    ? <CheckCircle2 className="h-4 w-4 text-[var(--signal)]" strokeWidth={1.6} />
                    : <Circle       className="h-4 w-4" strokeWidth={1.4} />}
                </button>

                {/* Title */}
                <div>
                  <span className={`font-sans text-[13px] font-medium leading-snug ${isDone ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                    {idx + 1}. {prob.title}
                  </span>
                </div>

                {/* Difficulty */}
                <span className={`font-mono text-[10px] capitalize ${diffClass}`}>
                  {prob.difficulty || '—'}
                </span>

                {/* Topics */}
                <span className="font-mono text-[9px] text-zinc-700 truncate">
                  {prob.topics?.slice(0, 2).join(', ') || '—'}
                </span>

                {/* Action */}
                <div className="flex justify-end">
                  {prob.isAvailable && prob.problemId ? (
                    <Link
                      to={`/problems/${prob.problemId}`}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-2.5 py-1 font-mono text-[9px] tracking-widest text-[var(--signal)] hover:bg-[var(--signal)]/10 transition-all duration-200 uppercase"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      Solve
                    </Link>
                  ) : prob.externalUrl ? (
                    <a
                      href={prob.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 font-mono text-[9px] tracking-widest text-zinc-600 hover:text-zinc-300 hover:border-white/[0.12] transition-all duration-200 uppercase"
                    >
                      <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.6} />
                      Open
                    </a>
                  ) : (
                    <span className="font-mono text-[9px] text-zinc-800">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion state */}
        {pct === 100 && (
          <div className="mt-12 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-[var(--signal)]" strokeWidth={1.2} />
            <div className="font-serif text-[22px] italic text-zinc-100">Complete.</div>
            <p className="font-sans text-[13px] text-zinc-600">
              You've finished {sheet.name}. Check out another sheet.
            </p>
            <Link
              to="/sheets"
              className="mt-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-zinc-600 hover:text-zinc-300 uppercase transition-colors"
            >
              Browse Sheets
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.6} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
