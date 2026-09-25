import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GlobalNav } from './global-nav';
import { CommandPalette } from './CommandPalette';

/**
 * AppShell — full-bleed canvas + the floating Dock.
 * Ctrl/⌘ K opens the command palette from anywhere.
 */
export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();
  const focus = /^\/problems\/[^/]+/.test(pathname) || /^\/arena\/[^/]+/.test(pathname);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="ambient-mesh" />
      {/* content clears the floating dock on scrolling pages; editors stay full-bleed */}
      <main className={`relative flex h-full min-w-0 flex-col overflow-hidden ${focus ? '' : 'pt-[84px] [&>div]:pb-12'}`}>
        <Outlet />
      </main>
      <GlobalNav />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
