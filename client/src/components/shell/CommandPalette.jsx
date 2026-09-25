import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Code2, Swords, Compass, GraduationCap, Layers, User, KeyRound, Award, Bookmark, Flame, LogOut, Plus, CornerDownLeft } from 'lucide-react';
import { companiesService, problemsService, sheetsService, engagementService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/kit';

const NAV = [
  { id: 'n-home', label: 'Home', hint: '1', icon: Home, action: '/dashboard', kw: 'dashboard sky mission' },
  { id: 'n-practice', label: 'Practice', hint: '2', icon: Code2, action: '/problems', kw: 'problems workspace code' },
  { id: 'n-arena', label: 'Arena', hint: '3', icon: Swords, action: '/arena', kw: 'versus multiplayer race' },
  { id: 'n-intel', label: 'Intel — interview atlas', hint: '4', icon: Compass, action: '/intel', kw: 'companies experiences' },
  { id: 'n-placement', label: 'Placement', hint: '5', icon: GraduationCap, action: '/placement', kw: 'college hiring recruiters' },
  { id: 'n-sheets', label: 'Sheets', hint: '6', icon: Layers, action: '/sheets', kw: 'blind 75 striver lists' }
];

const ACTIONS = [
  { id: 'a-profile', label: 'Open profile', icon: User, action: '/profile', kw: 'account me settings' },
  { id: 'a-badges', label: 'See my achievements', icon: Award, action: '/profile#badges', kw: 'badges trophies' },
  { id: 'a-bookmarks', label: 'My bookmarks', icon: Bookmark, action: '/profile#bookmarks', kw: 'saved' },
  { id: 'a-ai', label: 'Add or change my Gemini key', icon: KeyRound, action: '/profile#ai', kw: 'ai api byok' },
  { id: 'a-share', label: 'Share an interview experience', icon: Plus, action: '/intel', kw: 'submit add review' }
];

const DOT = { easy: 'bg-emerald-400', medium: 'bg-amber-400', hard: 'bg-rose-400' };

/** Cheap fuzzy match: every query character appears in order. Returns a score (lower is better) or -1. */
const fuzzy = (text, q) => {
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct >= 0) return direct;
  let i = 0; let gaps = 0; let last = -1;
  for (const ch of q) {
    const at = t.indexOf(ch, i);
    if (at < 0) return -1;
    if (last >= 0) gaps += at - last - 1;
    last = at; i = at + 1;
  }
  return 40 + gaps;
};

function Mark({ text, q }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<span className="text-[var(--ember-soft)]">{text.slice(i, i + q.length)}</span>{text.slice(i + q.length)}</>;
}

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [companies, setCompanies] = useState([]);
  const [problems, setProblems] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([
      companiesService.getCompanies().then((r) => setCompanies(r.data?.data || [])).catch(() => {}),
      problemsService.getProblems({ limit: 200 }).then((r) => { const p = r.data?.data?.problems || r.data?.data || []; setProblems(Array.isArray(p) ? p : []); }).catch(() => {}),
      sheetsService.getSheets().then((r) => setSheets(r.data?.data || [])).catch(() => {}),
      engagementService.getDaily().then((r) => setDaily(r.data?.data || null)).catch(() => {})
    ]).then(() => setLoaded(true));
  }, [open, loaded]);

  useEffect(() => {
    if (!open) return;
    setQuery(''); setCursor(0);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rank = (list, fields) => list
      .map((it) => { const scores = fields(it).map((f) => (f ? fuzzy(f, q) : -1)).filter((s) => s >= 0); return scores.length ? { it, s: Math.min(...scores) } : null; })
      .filter(Boolean).sort((a, b) => a.s - b.s).map((x) => x.it);

    const out = [];
    const dailyItem = daily?.problem ? [{ id: 'daily', label: `Today's challenge — ${daily.problem.title}`, sub: `+${daily.totalXp} XP${daily.solvedToday ? ' · done' : ''}`, icon: Flame, action: `/problems/${daily.problem._id}` }] : [];

    if (!q) {
      out.push({ name: 'Go to', items: NAV });
      out.push({ name: 'Quick actions', items: [...dailyItem, ...ACTIONS.slice(0, 4), { id: 'a-out', label: 'Sign out', icon: LogOut, run: () => logout() }] });
      return out;
    }

    const nav = rank(NAV, (n) => [n.label, n.kw]);
    if (nav.length) out.push({ name: 'Go to', items: nav.slice(0, 4) });
    const acts = rank([...dailyItem, ...ACTIONS], (n) => [n.label, n.kw]);
    if (acts.length) out.push({ name: 'Actions', items: acts.slice(0, 3) });
    const co = rank(companies, (c) => [c.name, c.tier]).slice(0, 5).map((c) => ({ id: `c-${c.slug}`, label: c.name, sub: `${c.tier}${c.experienceCount ? ` · ${c.experienceCount} reports` : ''}`, icon: Compass, action: `/companies/${c.slug}` }));
    if (co.length) out.push({ name: 'Companies', items: co });
    const pr = rank(problems, (p) => [p.title, ...(p.tags || []), ...(p.companies || [])]).slice(0, 6).map((p) => ({ id: `p-${p._id}`, label: p.title, sub: p.skillId?.name, dot: DOT[p.difficulty], icon: Code2, action: `/problems/${p._id}` }));
    if (pr.length) out.push({ name: 'Problems', items: pr });
    const sh = rank(sheets, (s) => [s.name, s.source]).slice(0, 3).map((s) => ({ id: `s-${s.slug}`, label: s.name, sub: `${s.totalProblems} problems`, icon: Layers, action: `/sheets/${s.slug}` }));
    if (sh.length) out.push({ name: 'Sheets', items: sh });
    return out;
  }, [query, companies, problems, sheets, daily, logout]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const execute = useCallback((item) => {
    onClose();
    if (item.run) item.run();
    else if (item.action) navigate(item.action);
  }, [navigate, onClose]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && flat[cursor]) execute(flat[cursor]);
  };

  useEffect(() => { listRef.current?.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: 'nearest' }); }, [cursor]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" onClick={onClose}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px]" />
          <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-[680px] overflow-hidden rounded-sm border border-[var(--line-strong)] bg-[#0d0d0d] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 border-b border-[var(--line)] px-7 py-5">
              <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setCursor(0); }} onKeyDown={onKeyDown} placeholder="Jump to anything…" className="display w-full bg-transparent text-[27.2px] text-zinc-50 outline-none placeholder:text-zinc-700" />
              <kbd className="shrink-0 rounded-md border border-[var(--line-strong)] px-2 py-1 text-[11px] text-zinc-600">esc</kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto scrollbar-surgical px-3 py-3">
              {flat.length === 0 && <div className="py-12 text-center"><div className="display text-[22.4px] italic text-zinc-600">Nothing for “{query}”.</div></div>}
              {groups.map((g) => (
                <div key={g.name} className="mb-2">
                  <div className="px-4 pb-1.5 pt-3 text-[12px] font-medium text-zinc-600">{g.name}</div>
                  {g.items.map((item) => {
                    const idx = flat.indexOf(item);
                    const active = idx === cursor;
                    const Icon = item.icon;
                    return (
                      <button key={item.id} data-idx={idx} onClick={() => execute(item)} onMouseMove={() => setCursor(idx)}
                        className={cn('relative flex w-full items-center gap-4 rounded-sm px-4 py-3 text-left transition-colors', active ? 'bg-white/[0.06]' : '')}>
                        {active && <motion.span layoutId="cmd-active" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[var(--ember)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                        <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', active ? 'text-[var(--ember)]' : 'text-zinc-600')} strokeWidth={1.6} />
                        <span className="min-w-0 flex-1">
                          <span className={cn('flex items-center gap-2 truncate text-[16px]', active ? 'text-zinc-50' : 'text-zinc-300')}>{item.dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', item.dot)} />}<span className="truncate"><Mark text={item.label} q={query.trim()} /></span></span>
                          {item.sub && <span className="block truncate text-[12.5px] text-zinc-600">{item.sub}</span>}
                        </span>
                        {item.hint && !query && <kbd className="rounded-md border border-[var(--line-strong)] px-2 py-0.5 text-[11px] text-zinc-600">{item.hint}</kbd>}
                        {active && <CornerDownLeft className="h-4 w-4 shrink-0 text-zinc-600" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 border-t border-[var(--line)] px-7 py-3 text-[12px] text-zinc-600">
              <span><kbd className="mr-1.5 rounded border border-[var(--line-strong)] px-1.5 py-0.5">↑↓</kbd>move</span>
              <span><kbd className="mr-1.5 rounded border border-[var(--line-strong)] px-1.5 py-0.5">↵</kbd>open</span>
              <span className="ml-auto">press 1–6 anywhere to switch sections</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
