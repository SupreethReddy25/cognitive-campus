import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Flame, Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { label: 'Home', href: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Practice', href: '/problems', match: (p) => p.startsWith('/problems') },
  { label: 'Arena', href: '/arena', match: (p) => p.startsWith('/arena') },
  { label: 'Intel', href: '/intel', match: (p) => p === '/intel' || p.startsWith('/companies') },
  { label: 'Placement', href: '/placement', match: (p) => p.startsWith('/placement') },
  { label: 'Sheets', href: '/sheets', match: (p) => p.startsWith('/sheets') }
];

const tierFor = (l) => (l >= 40 ? 'Legend' : l >= 30 ? 'Archon' : l >= 15 ? 'Adept' : 'Apprentice');

/** Routes with a full-bleed editor: the nav tucks away and returns when the pointer touches the top edge. */
const isFocusRoute = (p) => /^\/problems\/[^/]+/.test(p) || /^\/arena\/[^/]+/.test(p);

function AccountMenu({ user, onClose, onLogout }) {
  const level = user?.level || 1;
  const into = (user?.xp || 0) % 100;
  const items = [
    ['/profile', 'Profile'],
    ['/profile#badges', 'Achievements'],
    ['/profile#bookmarks', 'Bookmarks'],
    ['/profile#ai', 'AI key & settings'],
    ...(user?.role === 'admin' ? [['/admin', 'Admin']] : [])
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
      className="absolute right-0 top-[calc(100%+14px)] w-[280px] border border-white/[0.1] bg-[#0a0a0a]/95 backdrop-blur-xl"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="font-display text-[20px] font-bold tracking-tight text-zinc-50">{user?.name}</div>
        <div className="tag mt-1">Level {level} · {tierFor(level)}</div>
        <div className="mt-4 h-px bg-white/[0.08]"><div className="h-px bg-[var(--signal)]" style={{ width: `${into}%` }} /></div>
        <div className="tag mt-2 flex justify-between"><span>{user?.xp || 0} XP</span><span>{100 - into} to L{level + 1}</span></div>
      </div>
      <div className="py-1.5">
        {items.map(([to, label]) => (
          <Link key={label} to={to} onClick={onClose} className="group flex items-center justify-between px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100">
            {label}<ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
        <button onClick={onLogout} className="flex w-full items-center px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-rose-400">Sign out</button>
      </div>
    </motion.div>
  );
}

/**
 * The floating navigation — the landing page's nav, carried into the app:
 * bordered translucent bar, `.cogni` wordmark, tracked mono links, outline actions.
 */
export function GlobalNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [near, setNear] = useState(false);
  const menuRef = useRef(null);
  const focus = isFocusRoute(pathname);
  const streak = user?.streak ?? user?.streakInfo?.streak ?? 0;
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'CC';

  useEffect(() => { setMenu(false); setDrawer(false); setNear(false); }, [pathname]);
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
  const hidden = focus && !near && !menu && !drawer;

  return (
    <>
      {focus && <div className="fixed inset-x-0 top-0 z-[59] h-3" onMouseEnter={() => setNear(true)} />}
      <motion.nav
        onMouseEnter={() => focus && setNear(true)} onMouseLeave={() => setNear(false)}
        animate={{ y: hidden ? 'calc(-100% - 20px)' : 0, opacity: hidden ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="fixed z-[60]" style={{ top: 16, left: 24, right: 24 }} aria-label="Primary"
      >
        <div className="flex h-14 items-center justify-between border border-white/[0.07] bg-[#0a0a0a]/75 px-5 backdrop-blur-xl sm:px-6" style={{ borderRadius: 14 }}>
          <Link to="/dashboard" className="font-display text-[18px] font-bold tracking-tight text-zinc-100" aria-label="Cogni home"><span className="text-[var(--signal)]">.</span>cogni</Link>

          <div className="hidden items-center gap-8 lg:flex">
            {NAV.map((item, i) => {
              const active = item.match(pathname);
              return (
                <Link key={item.href} to={item.href} title={`${item.label}  ·  ${i + 1}`} className={`relative font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-100'}`}>
                  {item.label}
                  {active && <motion.span layoutId="nav-active" className="absolute -bottom-[19px] left-0 right-0 h-px bg-[var(--signal)]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={openPalette} title="Jump to anything · Ctrl K" className="hidden items-center gap-2 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-100 sm:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={1.6} /><span className="hidden xl:inline">Ctrl K</span>
            </button>
            <Link to="/dashboard" title={`${streak}-day streak`} className="flex items-center gap-1.5 px-2 py-2 font-mono text-[11px] tracking-[0.1em] text-zinc-400 transition-colors hover:text-zinc-100">
              <Flame className={`h-3.5 w-3.5 ${streak ? 'text-[var(--signal)]' : 'text-zinc-600'}`} strokeWidth={1.8} />{streak}
            </Link>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu((m) => !m)} aria-label="Account" className="btn-line !gap-2 !px-3.5 !py-2 !text-[10.5px]">{initials}</button>
              <AnimatePresence>{menu && <AccountMenu user={user} onClose={() => setMenu(false)} onLogout={logout} />}</AnimatePresence>
            </div>
            <button onClick={() => setDrawer((d) => !d)} aria-label="Menu" className="px-2 py-2 text-zinc-400 hover:text-zinc-100 lg:hidden">{drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>

        <AnimatePresence>
          {drawer && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2 border border-white/[0.08] bg-[#0a0a0a]/95 py-2 backdrop-blur-xl lg:hidden" style={{ borderRadius: 14 }}>
              {NAV.map((item, i) => (
                <Link key={item.href} to={item.href} className={`flex items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] ${item.match(pathname) ? 'text-zinc-100' : 'text-zinc-500'}`}>
                  <span>{item.label}</span><span className="text-zinc-700">{i + 1}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
