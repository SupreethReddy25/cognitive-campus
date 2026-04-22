import type { ReactNode } from "react"
import { GlobalNav } from "./global-nav"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen min-h-screen w-screen overflow-hidden bg-background text-foreground">
      <GlobalNav />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
