import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

/**
 * What a signed-out visitor sees around the Interviews atlas: the landing page's nav (wordmark, one link, Sign in / Enter)
 * and a slim note saying what signing in adds. The pages inside are the real ones, reading the public API.
 */
export function PreviewShell() {
  const { pathname } = useLocation();
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="ambient-mesh" />
      <main className="relative flex h-full min-w-0 flex-col overflow-hidden pt-[84px] [&>div]:pb-12">
        <Outlet />
      </main>

      <nav className="fixed z-[60]" style={{ top: 16, left: 24, right: 24 }} aria-label="Primary">
        <div className="flex h-14 items-center justify-between border border-white/[0.07] bg-[#0a0a0a]/75 px-5 backdrop-blur-xl sm:px-6" style={{ borderRadius: 14 }}>
          <Link to="/" className="font-display text-[18px] font-bold tracking-tight text-zinc-100" aria-label="Cogni home"><span className="text-[var(--signal)]">.</span>cogni</Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link to="/intel" className={`relative font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${pathname === '/intel' || pathname.startsWith('/companies') ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-100'}`}>
              Interviews
              {(pathname === '/intel' || pathname.startsWith('/companies')) && <span className="absolute -bottom-[19px] left-0 right-0 h-px bg-[var(--signal)]" />}
            </Link>
            <span className="tag !text-zinc-700">Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-2 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-100">Sign in</Link>
            <Link to="/register" className="btn-line group !gap-2 !px-4 !py-2 !text-[10.5px]">Create account<ArrowUpRight className="h-3 w-3" strokeWidth={1.8} /></Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
