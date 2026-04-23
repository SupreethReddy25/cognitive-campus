import { Outlet } from "react-router-dom";
import { GlobalNav } from "./global-nav";

/**
 * AppShell — Root layout.
 * 
 * The sidebar operates on a 3-state FSM:
 *  1. Pinned  → sidebar in-flow at 220px (resizable)
 *  2. Collapsed → 60px icon rail, sidebar in-flow
 *  3. Hover-Expanded → sidebar absolute/overlay at 220px, z-50
 *
 * When unpinned, main content always gets full width minus 60px.
 * The hover-expanded sidebar overlays on top — no layout shift.
 */
export function AppShell() {
  return <div className="flex h-screen min-h-screen w-screen overflow-hidden bg-background text-foreground">
      <GlobalNav />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>;
}