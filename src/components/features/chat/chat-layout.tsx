"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/icons"
import type { Chat } from "@/lib/types"
import { UserMenu } from "../../layout/user-menu"
import { ChatList } from "./chat-list"
import { MainNav } from "../../layout/main-nav"
import { MobileBottomNav } from "../../layout/mobile-bottom-nav"
import Image from "next/image"

import { usePathname } from "next/navigation"

interface ChatLayoutProps {
  chats: Chat[],
  children: React.ReactNode
}

// This is the main layout component for the entire chat application.
// It creates the two-column structure with the sidebar on the left and the main content on the right.
export function ChatLayout({ chats, children }: ChatLayoutProps) {
  const pathname = usePathname()

  // Logic to match MobileBottomNav visibility
  // If nav is hidden, we shouldn't have padding
  const isMobileNavHidden = /^(\/chat\/\d+|\/leela)$/.test(pathname)

  return (
    <>
      {/* This is the sidebar component from our UI library. */}
      {/* We apply a modern subtle backdrop border instead of a harsh solid line */}
      <Sidebar className="flex flex-col border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* The header of the sidebar, containing the logo and app name. */}
        <SidebarHeader className="p-4 flex flex-row items-center h-16 w-full group-data-[collapsible=icon]:p-2 group-data-[state=collapsed]:justify-center group-data-[state=expanded]:justify-start">
          <div className="flex items-center group-data-[state=collapsed]:justify-center w-full gap-3 overflow-hidden">
            <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
              <Image
                src="/logo/krishna_connect.png"
                alt="Krishna Connect Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent group-data-[collapsible=icon]:hidden drop-shadow-sm">
              Krishna Connect
            </span>
          </div>
        </SidebarHeader>

        {/* The main content area of the sidebar. */}
        <SidebarContent className="flex flex-col p-2 pt-0">
          {/* The main navigation links (Chats, Events, etc.). */}
          <MainNav />
        </SidebarContent>

        {/* The footer of the sidebar, which contains the user menu (profile, settings, logout). */}
        <SidebarFooter className="p-2">
          <UserMenu />
        </SidebarFooter>
      </Sidebar>

      <main className={`flex-1 md:pb-0 ${isMobileNavHidden ? 'overflow-hidden' : 'overflow-y-auto pb-16'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}
