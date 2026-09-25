import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Code2, Swords, Compass, GraduationCap, Layers, Search, Flame, User, Award, Bookmark, KeyRound, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { label: 'Home', href: '/dashboard', icon: Home, match: (p) => p === '/dashboard' },
  { label: 'Practice', href: '/problems', icon: Code2, match: (p) => p.startsWith('/problems') },
  { label: 'Arena', href: '/arena', icon: Swords, match: (p) => p.startsWith('/arena') },
  { label: 'Intel', href: '/intel', icon: Compass, match: (p) => p === '/intel' || p.startsWith('/companies') },
  { label: 'Placement', href: '/placement', icon: GraduationCap, match: (p) => p.startsWith('/placement') },
  { label: 'Sheets', href: '/sheets', icon: Layers, match: (p) => p.startsWith('/sheets') }
];

const tierFor = (l) => (l >= 40 ? 'Legend' : l >= 30 ? 'Archon' : l >= 15 ? 'Adept' : 'Apprentice');

/** Routes where the dock gets out of the way (full-bleed editor). */
const isFocusRoute = (p) => /^\/problems\/[^/]+/.test(p) || /^\/arena\/[^/]+/.test(p);

function AccountMenu({ user, onClose, onLogout }) {
  const level = user?.level || 1;
  const into = (user?.xp || 0) % 100;
  const items = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/profile#badges', label: 'Achievements', icon: Award },
    { to: '/profile#bookmarks', label: 'Bookmarks', icon: Bookmark },
    { to: '/profile#ai', label: 'AI key & settings', icon: KeyRound },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin room', icon: ShieldCheck }] : [])
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="absolute bottom-[calc(100%+14px)] right-0 w-[280px] origin-bottom-right overflow-hidden rounded-3xl border border-[var(--line-strong)] bg-[#151519] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="px-5 pb-4 pt-5">
        <div className="display text-[26px] text-zinc-50">{user?.name}</div>
        <div className="mt-0.5 text-[12px] text-zinc-500">Level {level} · {tierFor(level)}</div>
        <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-[var(--ember)]" style={{ width: `${into}%` }} /></div>
        <div className="mt-1.5 flex justify-between text-[11px] text-zinc-600"><span>{user?.xp || 0} XP</span><span>{100 - into} to level {level + 1}</span></div>
      </div>
      <div className="border-t border-[var(--line)] p-2">
        {items.map((it) => (
          <Link key={it.label} to={it.to} onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-zinc-50">
            <it.icon className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />{it.label}
          </Link>
        ))}
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-rose-300">
          <LogOut className="h-4 w-4" strokeWidth={1.6} />Sign out
        </button>
      </div>
    </motion.div>
  );
}

/**
 * The Dock — one floating bar for the whole product: wordmark · sections · ⌘K · streak · account.
 * Inspired by Raycast's floating chrome and macOS auto-hide: on full-bleed editor routes it tucks
 * away and slides back up when the pointer touches the bottom edge.
 */
export function GlobalNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [near, setNear] = useState(false);
  const menuRef = useRef(null);
  const focus = isFocusRoute(pathname);
  const streak = user?.streak ?? user?.streakInfo?.streak ?? 0;
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'CC';

  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const esc = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [menu]);

  // number keys 1-6 jump between sections (only when not typing)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable || t.closest?.('.monaco-editor'))) return;
      const n = Number(e.key);
      if (n >= 1 && n <= NAV.length) navigate(NAV[n - 1].href);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const openPalette = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  const hidden = focus && !near && !menu;

  return (
    <>
      {/* hot-zone that summons the dock on focus routes */}
      {focus && <div className="fixed inset-x-0 bottom-0 z-[59] h-3" onMouseEnter={() => setNear(true)} />}
      <motion.nav
        onMouseEnter={() => focus && setNear(true)} onMouseLeave={() => setNear(false)}
        animate={{ y: hidden ? 'calc(100% - 6px)' : 0, opacity: hidden ? 0.5 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--line-strong)] bg-[#141418]/95 p-1.5 pl-5 shadow-[0_24px_70px_-18px_rgba(0,0,0,0.85)] backdrop-blur-md"
        aria-label="Primary"
      >
        <Link to="/dashboard" className="mr-2 flex items-baseline gap-[1px] pr-2 text-zinc-50" aria-label="Cogni home">
          <span className="display text-[24px] italic leading-none">cogni</span><span className="text-[26px] leading-none text-[var(--ember)]">.</span>
        </Link>

        {NAV.map((item, i) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link key={item.href} to={item.href} title={`${item.label}  ·  ${i + 1}`} className={`group relative flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${active ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-100'}`}>
              {active && <motion.span layoutId="dock-active" className="absolute inset-0 rounded-full bg-white/[0.08]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <Icon className={`relative h-[17px] w-[17px] transition-colors ${active ? 'text-[var(--ember)]' : ''}`} strokeWidth={1.7} />
              <span className={`relative ${active ? '' : 'hidden xl:inline'}`}>{item.label}</span>
            </Link>
          );
        })}

        <span className="mx-1.5 h-6 w-px bg-[var(--line-strong)]" />

        <button onClick={openPalette} title="Jump to anything  ·  Ctrl K" className="flex h-10 items-center gap-2 rounded-full px-3 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100">
          <Search className="h-4 w-4" strokeWidth={1.7} />
          <span className="hidden whitespace-nowrap text-[11px] text-zinc-600 lg:inline">Ctrl K</span>
        </button>

        <Link to="/dashboard" title={`${streak}-day streak`} className="flex h-10 items-center gap-1.5 rounded-full px-3 transition-colors hover:bg-white/[0.06]">
          <Flame className={`h-[17px] w-[17px] ${streak ? 'text-[var(--ember)]' : 'text-zinc-600'}`} strokeWidth={1.8} fill={streak ? 'currentColor' : 'none'} fillOpacity={0.25} />
          <span className="text-[13px] font-semibold tnum text-zinc-200">{streak}</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenu((m) => !m)} aria-label="Account" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ember)] text-[12px] font-bold text-[#1a0d07] transition-transform hover:scale-105">{initials}</button>
          <AnimatePresence>{menu && <AccountMenu user={user} onClose={() => setMenu(false)} onLogout={logout} />}</AnimatePresence>
        </div>
      </motion.nav>
    </>
  );
}
