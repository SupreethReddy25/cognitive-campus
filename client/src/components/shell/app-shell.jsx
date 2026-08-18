import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { GlobalNav } from "./global-nav";
import { CommandPalette } from "./CommandPalette";

/**
 * AppShell — Root layout for all authenticated pages.
 *
 * Global keyboard shortcut: Ctrl+K / ⌘K → opens CommandPalette.
 */
export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen min-h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="ambient-mesh" />
      <GlobalNav />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}