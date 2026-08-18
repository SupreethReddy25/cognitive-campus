import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { fuzzyMatch } from './suggestion-data';

/**
 * InlineSlot — The atomic building block of the Guided Narrative Builder.
 *
 * Renders inline within a sentence as an underlined blank. On click/focus,
 * a floating dropdown appears with categorized, fuzzy-searchable suggestions.
 * Supports single-select, multi-select, and custom free-text entry.
 */
export default function InlineSlot({
  value,           // string (single) | string[] (multi)
  onChange,
  suggestions = [],
  placeholder = 'select...',
  mode = 'single', // 'single' | 'multi' | 'freetext'
  allowCustom = true,
  maxSelections,
  size = 'md',     // 'sm' | 'md' | 'lg' | 'xl'
  onAdvance,       // called after a selection, to move focus to next slot
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const isMulti = mode === 'multi';
  const values = isMulti ? (Array.isArray(value) ? value : []) : [];
  const singleValue = !isMulti ? (value || '') : '';

  const isEmpty = isMulti ? values.length === 0 : !singleValue;

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus filter input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset highlight when query changes
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Build filtered + categorized suggestion list
  const filtered = suggestions
    .map(s => ({ ...s, ...fuzzyMatch(query, s.label) }))
    .filter(s => s.match)
    .sort((a, b) => {
      const scoreA = (s => (s.priority || 0) + s.score)(a);
      const scoreB = (s => (s.priority || 0) + s.score)(b);
      return scoreB - scoreA;
    })
    .filter(s => isMulti ? !values.includes(s.label) : true);

  // Group by category
  const grouped = filtered.reduce((acc, s) => {
    const cat = s.category || '';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatList = filtered;

  function selectItem(label) {
    if (isMulti) {
      const next = values.includes(label) ? values.filter(v => v !== label) : [...values, label];
      if (maxSelections && next.length > maxSelections) return;
      onChange(next);
      setQuery('');
      // keep open for multi
      if (inputRef.current) inputRef.current.focus();
    } else {
      onChange(label);
      setOpen(false);
      setQuery('');
      onAdvance?.();
    }
  }

  function removeValue(label) {
    if (isMulti) {
      onChange(values.filter(v => v !== label));
    } else {
      onChange('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatList[highlighted]) {
        selectItem(flatList[highlighted].label);
      } else if (allowCustom && query.trim()) {
        selectItem(query.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Backspace' && !query && isMulti && values.length > 0) {
      removeValue(values[values.length - 1]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  const sizeClass = {
    sm: 'min-w-[100px]',
    md: 'min-w-[140px]',
    lg: 'min-w-[200px]',
    xl: 'min-w-[260px]',
  }[size];

  return (
    <span ref={containerRef} className={`inline-flex flex-wrap items-center gap-1 relative ${sizeClass} ${className}`}>
      {/* Multi: render chips inline */}
      {isMulti && values.map(v => (
        <span
          key={v}
          className="inline-flex items-center gap-1 bg-[var(--signal)]/10 border border-[var(--signal)]/25 text-[var(--signal)] text-xs font-mono px-2 py-0.5 rounded-sm group"
        >
          {v}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeValue(v); }}
            className="opacity-0 group-hover:opacity-100 text-[var(--signal)]/60 hover:text-[var(--signal)] transition-opacity ml-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {/* Single: render filled chip */}
      {!isMulti && singleValue && (
        <span
          className="inline-flex items-center gap-1 bg-[var(--signal)]/10 border-b-2 border-[var(--signal)]/50 text-zinc-200 text-sm px-2 py-0.5 group cursor-pointer"
          onClick={() => setOpen(true)}
        >
          {singleValue}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeValue(singleValue); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-opacity"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      )}

      {/* Trigger — shown when empty (single) or always (multi for adding more) */}
      {(isEmpty || isMulti) && (
        <span
          className={`
            inline-flex items-center gap-1 cursor-pointer select-none
            border-b-2 border-dashed border-white/20 hover:border-[var(--signal)]/60
            px-2 py-0.5 transition-all duration-200 text-zinc-500 hover:text-zinc-300
            ${open ? 'border-[var(--signal)]/60 text-zinc-300' : ''}
            text-sm
          `}
          onClick={() => setOpen(true)}
        >
          {isMulti && values.length > 0 ? '+ add' : placeholder}
          {!isMulti && <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />}
        </span>
      )}

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1.5 min-w-[240px] max-w-[320px] max-h-[280px] overflow-y-auto bg-[#060b12] border border-white/[0.08] border-t-2 border-t-[var(--signal)] shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-[200] flex flex-col"
          style={{ animationName: 'slot-in', animationDuration: '120ms', animationFillMode: 'both' }}
        >
          {/* Filter Input */}
          <div className="p-2 border-b border-white/[0.05] shrink-0">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type to filter..."
              className="w-full bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 outline-none font-mono"
            />
          </div>

          {/* Suggestions */}
          <div className="overflow-y-auto flex-1 scrollbar-surgical">
            {flatList.length === 0 && (
              <div className="px-3 py-4 text-xs text-zinc-600 font-mono text-center">
                {allowCustom && query
                  ? <span>Press <kbd className="bg-white/5 px-1 rounded">Enter</kbd> to add &ldquo;{query}&rdquo;</span>
                  : 'No matches'}
              </div>
            )}

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                {cat && (
                  <div className="px-3 py-1.5 text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 bg-black/20 sticky top-0">
                    {cat}
                  </div>
                )}
                {items.map((item) => {
                  const flatIdx = flatList.findIndex(f => f.label === item.label);
                  return (
                    <div
                      key={item.label}
                      onClick={() => selectItem(item.label)}
                      className={`
                        px-3 py-2 text-xs cursor-pointer transition-colors flex items-center gap-2
                        ${flatIdx === highlighted
                          ? 'bg-[var(--signal)]/10 text-zinc-100'
                          : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                        }
                      `}
                      onMouseEnter={() => setHighlighted(flatIdx)}
                    >
                      {isMulti && values.includes(item.label) && (
                        <span className="text-[var(--signal)] text-[10px]">✓</span>
                      )}
                      {item.label}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Custom entry hint */}
            {allowCustom && query.trim() && !flatList.find(f => f.label.toLowerCase() === query.toLowerCase()) && (
              <div
                onClick={() => selectItem(query.trim())}
                className="px-3 py-2 text-xs cursor-pointer text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors border-t border-white/[0.04] font-mono"
              >
                <span className="text-[var(--signal)]">+</span> Add &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slot-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}
