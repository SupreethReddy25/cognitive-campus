import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesService, problemsService, sheetsService } from '../../services/api';
import {
  Search, Shield, Terminal, BookOpen, LayoutDashboard,
  User, ArrowRight, Loader2, Building2, FileText
} from 'lucide-react';

const STATIC_ACTIONS = [
  { id: 'nav-intel',     label: 'Go to Intel Hub',      icon: Shield,         action: '/intel',     group: 'Navigation' },
  { id: 'nav-dashboard', label: 'Go to Dashboard',       icon: LayoutDashboard,action: '/dashboard', group: 'Navigation' },
  { id: 'nav-workspace', label: 'Go to Workspace',       icon: Terminal,       action: '/problems',  group: 'Navigation' },
  { id: 'nav-sheets',    label: 'Go to Sheets',          icon: BookOpen,       action: '/sheets',    group: 'Navigation' },
  { id: 'nav-profile',   label: 'Go to Profile',         icon: User,           action: '/profile',   group: 'Navigation' },
];

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--signal)]/20 text-[var(--signal)] rounded-sm not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function CommandPalette({ open, onClose }) {
  const navigate              = useNavigate();
  const inputRef              = useRef(null);
  const listRef               = useRef(null);
  const [query, setQuery]     = useState('');
  const [cursor, setCursor]   = useState(0);
  const [companies, setCompanies]   = useState([]);
  const [problems, setProblems]     = useState([]);
  const [sheets, setSheets]         = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data once on first open
  useEffect(() => {
    if (!open || dataLoaded) return;
    Promise.all([
      companiesService.getCompanies().then(r => setCompanies(r.data?.data || [])).catch(() => {}),
      problemsService.getProblems().then(r => {
        const probs = r.data?.data?.problems || r.data?.data || [];
        setProblems(Array.isArray(probs) ? probs : []);
      }).catch(() => {}),
      sheetsService.getSheets().then(r => setSheets(r.data?.data || [])).catch(() => {}),
    ]).then(() => setDataLoaded(true));
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = [];

    // Static navigation (always show if query empty or matches)
    const navMatches = STATIC_ACTIONS.filter(a =>
      !q || a.label.toLowerCase().includes(q)
    );
    if (navMatches.length) {
      results.push({ group: 'Navigation', items: navMatches.map(a => ({
        id: a.id, label: a.label, icon: a.icon, type: 'nav', action: a.action, group: a.group
      }))});
    }

    if (q) {
      // Companies
      const compMatches = companies.filter(c =>
        c.name.toLowerCase().includes(q) || c.tier?.toLowerCase().includes(q)
      ).slice(0, 5).map(c => ({
        id: 'company-' + c.slug, label: c.name, sub: c.tier + ' · ' + c.avgCTC,
        icon: Building2, type: 'company', action: '/companies/' + c.slug, group: 'Companies'
      }));
      if (compMatches.length) results.push({ group: 'Companies', items: compMatches });

      // Problems
      const probMatches = problems.filter(p =>
        p.title?.toLowerCase().includes(q) || p.difficulty?.toLowerCase().includes(q)
      ).slice(0, 5).map(p => ({
        id: 'problem-' + p._id, label: p.title, sub: p.difficulty,
        icon: Terminal, type: 'problem', action: '/problems/' + p._id, group: 'Problems'
      }));
      if (probMatches.length) results.push({ group: 'Problems', items: probMatches });

      // Sheets
      const sheetMatches = sheets.filter(s =>
        s.name.toLowerCase().includes(q) || s.source?.toLowerCase().includes(q)
      ).slice(0, 3).map(s => ({
        id: 'sheet-' + s.slug, label: s.name, sub: s.source + ' · ' + s.totalProblems + ' problems',
        icon: FileText, type: 'sheet', action: '/sheets/' + s.slug, group: 'Sheets'
      }));
      if (sheetMatches.length) results.push({ group: 'Sheets', items: sheetMatches });
    }

    return results;
  }, [query, companies, problems, sheets]);

  // Flat list for keyboard navigation
  const flat = useMemo(() => items.flatMap(g => g.items), [items]);

  const execute = useCallback((item) => {
    if (item.action) navigate(item.action);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && flat[cursor]) {
      execute(flat[cursor]);
    }
  };

  // Sync cursor into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-[560px] mx-4 rounded-xl border border-white/[0.08] bg-[#0a0b0e] shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
          <Search className="h-4 w-4 text-zinc-500 shrink-0" strokeWidth={1.6} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search companies, problems, sheets..."
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-sans text-[14px] text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          {!dataLoaded && query && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600 shrink-0" strokeWidth={1.5} />
          )}
          <kbd className="font-mono text-[9px] tracking-widest text-zinc-700 border border-white/[0.06] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto scrollbar-surgical py-1">
          {items.length === 0 && query ? (
            <div className="py-10 text-center font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">
              No results for "{query}"
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">
              Type to search...
            </div>
          ) : null}

          {items.map(group => {
            let groupCursor = flat.findIndex(f => group.items.includes(f));
            return (
              <div key={group.group}>
                <div className="px-4 pt-3 pb-1 font-mono text-[9px] tracking-[0.24em] text-zinc-700 uppercase">
                  {group.group}
                </div>
                {group.items.map((item, localIdx) => {
                  const absIdx = flat.indexOf(item);
                  const Icon   = item.icon;
                  const active = cursor === absIdx;
                  return (
                    <button
                      key={item.id}
                      data-idx={absIdx}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setCursor(absIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                        active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                        active ? 'bg-[var(--signal)]/10' : 'bg-white/[0.03]'
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${active ? 'text-[var(--signal)]' : 'text-zinc-500'}`} strokeWidth={1.6} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-sans text-[13px] truncate ${active ? 'text-zinc-100' : 'text-zinc-300'}`}>
                          {highlight(item.label, query)}
                        </div>
                        {item.sub && (
                          <div className="font-mono text-[9px] text-zinc-700 truncate mt-0.5">{item.sub}</div>
                        )}
                      </div>
                      {active && (
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.6} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="border-t border-white/[0.04] px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-700">
            <kbd className="border border-white/[0.06] rounded px-1 py-0.5">↑↓</kbd>
            navigate
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-700">
            <kbd className="border border-white/[0.06] rounded px-1 py-0.5">↵</kbd>
            open
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-700">
            <kbd className="border border-white/[0.06] rounded px-1 py-0.5">esc</kbd>
            close
          </div>
        </div>
      </div>
    </div>
  );
}
