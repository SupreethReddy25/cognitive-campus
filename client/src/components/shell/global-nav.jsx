import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, Settings, Terminal, User, 
  Pin, PinOff, LogOut, Shield, BookOpen, Swords, GraduationCap, ShieldCheck
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Intel",       href: "/intel",       icon: Shield },
  { label: "Placement",   href: "/placement",   icon: GraduationCap },
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { label: "Workspace",   href: "/problems",    icon: Terminal },
  { label: "Arena",       href: "/arena",       icon: Swords },
  { label: "Sheets",      href: "/sheets",      icon: BookOpen },
  { label: "Profile",     href: "/profile",     icon: User },
];

function isActive(pathname, href) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  // Intel hub also matches /companies/:slug
  if (href === "/intel") return pathname === "/intel" || pathname.startsWith("/companies");
  // Placement hub matches /placement and sub-routes
  if (href === "/placement") return pathname === "/placement" || pathname.startsWith("/placement/");
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * GlobalNav — 3-state finite state machine sidebar.
 *
 * States:
 *  PINNED    → in-flow, width 220px, full labels visible.
 *  COLLAPSED → in-flow, width 60px, icon-only rail.
 *  OVERLAY   → COLLAPSED base (60px in-flow) + absolute panel at 220px on hover.
 *
 * The OVERLAY state is triggered when !pinned && hovered.
 * The overlay panel uses absolute positioning + z-50 so it
 * slides over main content without causing layout shift.
 */
export function GlobalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { user, logout } = useAuth();

  // ─── FSM: pinned persisted to localStorage ───
  const [pinned, setPinned] = useState(() => {
    const saved = localStorage.getItem('cc_sidebar_pinned');
    return saved === null ? true : saved === 'true';
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    localStorage.setItem('cc_sidebar_pinned', String(pinned));
  }, [pinned]);

  // Derived states
  const showLabels = pinned || hovered;

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CC';
  const firstName = user?.name?.split(' ')[0] || 'User';
  const lastName = user?.name?.split(' ').slice(1).join(' ');
  const displayShort = `${firstName}${lastName ? ` ${lastName[0]}.` : ''}`;
  const level = user?.level || 1;
  const tier = level >= 40 ? "Legend" : level >= 30 ? "Archon" : level >= 15 ? "Adept" : "Apprentice";

  // ─── The sidebar "content" (brand, nav, user chip) ───
  const sidebarContent = (
    <>
      {/* ── Brand — links back to Landing Page ─── */}
      <Link to="/" className="flex h-14 items-center gap-3 px-4 group transition-colors hover:bg-white/[0.02]">
        {showLabels ? (
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#f4f4f5' }}>
            <span style={{ color: 'var(--signal)' }}>.</span>cogni
          </span>
        ) : (
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: '#f4f4f5', paddingLeft: 4 }}>
            <span style={{ color: 'var(--signal)' }}>.</span>c
          </span>
        )}
      </Link>

      {/* ── Primary nav ─── */}
      <nav className="mt-4 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(item => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return <Link
            key={item.href}
            to={item.href}
            className={`group relative flex items-center gap-4 rounded-xl px-3 py-2.5 transition-all duration-300 ${
              active 
                ? "bg-gradient-to-r from-[var(--signal)]/[0.08] to-transparent text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] border border-[var(--signal)]/10 border-l-0" 
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
            }`}
          >
            {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--signal)] shadow-[0_0_12px_rgba(74,124,89,0.6)]" />}
            <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-[var(--signal)] drop-shadow-[0_0_8px_rgba(74,124,89,0.4)]" : ""}`} strokeWidth={1.6} />
            {showLabels && <span className={`text-[13.5px] font-medium tracking-tight transition-colors whitespace-nowrap ${active ? "text-zinc-100" : ""}`}>
              {item.label}
            </span>}
          </Link>;
        })}

        {/* Admin-only nav item */}
        {user?.role === 'admin' && (() => {
          const active = isActive(pathname, '/admin');
          return (
            <>
              <div className="my-2 border-t border-white/[0.04]" />
              <Link
                to="/admin"
                className={`group relative flex items-center gap-4 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-r from-violet-500/[0.12] to-transparent text-zinc-100 border border-violet-500/20 border-l-0'
                    : 'text-zinc-600 hover:bg-violet-500/[0.05] hover:text-violet-300'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]" />}
                <ShieldCheck className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-violet-400' : ''}`} strokeWidth={1.6} />
                {showLabels && <span className={`text-[13.5px] font-medium tracking-tight whitespace-nowrap ${active ? 'text-zinc-100' : ''}`}>Admin</span>}
              </Link>
            </>
          );
        })()}
      </nav>

      {/* ── Spacer ─── */}
      <div className="flex-1" />

      {/* ── Pin/Unpin toggle ─── */}
      {showLabels && <div className="mx-3 mb-2">
        <button
          onClick={() => setPinned(!pinned)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-zinc-600 transition-colors hover:bg-white/[0.03] hover:text-zinc-400"
        >
          {pinned ? <Pin className="h-3 w-3" strokeWidth={1.5} /> : <PinOff className="h-3 w-3" strokeWidth={1.5} />}
          <span>{pinned ? 'PINNED' : 'UNPINNED'}</span>
        </button>
      </div>}

      {/* Show pin icon in collapsed rail too */}
      {!showLabels && <div className="mx-auto mb-2">
        <button
          onClick={() => setPinned(true)}
          title="Pin sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
        >
          <PinOff className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>}

      {/* ── User chip + Settings + Logout ─── */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-2">
          {/* Avatar + name */}
          <div className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a3441] text-[11px] font-semibold text-zinc-200">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0e14] bg-[var(--signal)] shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            </div>
            {showLabels && <div className="flex flex-1 flex-col items-start leading-tight overflow-hidden min-w-0">
              <span className="text-[13px] font-semibold text-zinc-200 truncate">{displayShort}</span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-600">
                Lvl {level} · {tier}
              </span>
            </div>}
          </div>

          {/* Settings → navigates to /profile */}
          {showLabels && <button
            onClick={() => navigate('/profile')}
            title="Settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </button>}

          {/* Logout — separate, distinct button */}
          {showLabels && <button
            onClick={logout}
            title="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>}
        </div>
      </div>
    </>
  );

  // ─── PINNED: sidebar is in-flow at full width ───
  if (pinned) {
    return <aside className="relative flex h-screen w-[220px] shrink-0 flex-col bg-[#0a0e14] border-r border-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
      {sidebarContent}
    </aside>;
  }

  // ─── UNPINNED: 60px rail in-flow + absolute overlay on hover ───
  return <div
    className="relative flex h-screen shrink-0"
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
  >
    {/* The 60px icon rail spacer — always in document flow */}
    <div className="w-[60px] h-full shrink-0" />

    {/* The actual animated sidebar panel */}
    <aside
      className={`absolute left-0 top-0 z-50 flex h-full flex-col bg-[#0a0e14] border-r border-white/[0.06] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${hovered ? 'w-[220px] shadow-2xl shadow-black/50 border-white/[0.08]' : 'w-[60px]'}`}
    >
      <div className="w-[220px] h-full flex flex-col">
        {sidebarContent}
      </div>
    </aside>
  </div>;
}