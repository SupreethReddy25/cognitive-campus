import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collegesService } from '../../services/api';
import { Search, GraduationCap, CheckCircle2, X } from 'lucide-react';

const TIER_COLORS = {
  IIT:     'text-violet-400 bg-violet-400/10 border-violet-400/20',
  NIT:     'text-sky-400 bg-sky-400/10 border-sky-400/20',
  BITS:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  IIIT:    'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  Deemed:  'text-amber-400 bg-amber-400/10 border-amber-400/20',
  State:   'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  Private: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  Other:   'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
};

/**
 * CollegeSelector
 *
 * A typeahead search component for selecting a college.
 * Used in profile-view and SubmitExperienceModal.
 *
 * Props:
 *   value       — currently selected college object { _id, name, shortName, slug, tier }
 *   onChange    — called with the selected college object (or null to clear)
 *   placeholder — input placeholder
 *   disabled    — disables the input
 */
export function CollegeSelector({ value, onChange, placeholder = 'Search your college…', disabled = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q) => {
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    collegesService.getColleges({ q, limit: 8 })
      .then(res => {
        if (res.data.success) {
          setResults(res.data.data?.colleges || res.data.colleges || []);
          setOpen(true);
        }
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 250);
  };

  const handleSelect = (college) => {
    onChange(college);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  // If a college is selected, show the selected chip
  if (value) {
    const tierClass = TIER_COLORS[value.tier] || TIER_COLORS.Other;
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5">
        <GraduationCap className="h-4 w-4 text-[var(--signal)] shrink-0" strokeWidth={1.6} />
        <span className="text-sm text-zinc-200 font-medium flex-1 truncate">{value.name}</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${tierClass}`}>
          {value.tier}
        </span>
        {!disabled && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Remove college"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" strokeWidth={1.6} />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-zinc-600 border-t-[var(--signal)] animate-spin" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 2 && setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] pl-9 pr-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-[var(--signal)]/40 focus:bg-[var(--signal)]/5 transition-all duration-200 placeholder:text-zinc-600 disabled:opacity-50"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl bg-[#0d0d0d] border border-white/[0.08] shadow-2xl overflow-hidden">
          {results.map(college => {
            const tierClass = TIER_COLORS[college.tier] || TIER_COLORS.Other;
            return (
              <button
                key={college._id}
                onClick={() => handleSelect(college)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors group"
              >
                <GraduationCap className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-colors" strokeWidth={1.6} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">{college.name}</div>
                  <div className="text-[11px] text-zinc-600">{college.location}</div>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${tierClass}`}>
                  {college.tier}
                </span>
                {college.verified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl bg-[#0d0d0d] border border-white/[0.08] shadow-2xl px-4 py-3">
          <p className="text-sm text-zinc-500">No college found for "{query}".</p>
          <p className="text-xs text-zinc-700 mt-0.5">Contact admin to add your institution.</p>
        </div>
      )}
    </div>
  );
}
