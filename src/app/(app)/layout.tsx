
import type React from "react"
import type { Metadata } from "next"
import AppShell from "@/components/layout/app-shell"
import { SidebarProvider } from "@/components/ui/sidebar"

import { WhatsNewDialog } from "@/components/whats-new-dialog"
import { AndroidInstallPrompt } from "@/components/android-install-prompt"

export const metadata: Metadata = {
  title: "Home",
  description: "Your Krishna Connect home feed — see posts from people you follow.",
}

// The main layout is now a server component, which allows
// child pages to be server components and fetch data.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppShell>{children}</AppShell>
      <WhatsNewDialog />
      <AndroidInstallPrompt />
    </SidebarProvider>
  )
}
