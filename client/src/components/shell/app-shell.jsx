import { Outlet } from "react-router-dom";
import { GlobalNav } from "./global-nav";
import { CustomCursor } from "../ui/custom-cursor";

/**
 * AppShell — Root layout for all authenticated pages.
 * 
 * The sidebar operates on a 3-state FSM:
 *  1. Pinned  → sidebar in-flow at 220px (resizable)
 *  2. Collapsed → 60px icon rail, sidebar in-flow
 *  3. Hover-Expanded → sidebar absolute/overlay at 220px, z-50
 *
 * When unpinned, main content always gets full width minus 60px.
 * The hover-expanded sidebar overlays on top — no layout shift.
 * 
 * CustomCursor is mounted here so it persists across all inner pages.
 */
export function AppShell() {
  return <div className="flex h-screen min-h-screen w-screen overflow-hidden bg-background text-foreground">
      <CustomCursor />
      <GlobalNav />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>;
}