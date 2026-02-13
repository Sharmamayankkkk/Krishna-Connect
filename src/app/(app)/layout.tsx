
import type React from "react"
import AppShell from "@/components/layout/app-shell"
import { SidebarProvider } from "@/components/ui/sidebar"

import { WhatsNewDialog } from "@/components/whats-new-dialog"

// The main layout is now a server component, which allows
// child pages to be server components and fetch data.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppShell>{children}</AppShell>
      <WhatsNewDialog />
    </SidebarProvider>
  )
}
