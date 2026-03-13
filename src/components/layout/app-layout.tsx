"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { UserMenu } from "./user-menu"
import { MainNav } from "./main-nav"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { MobileFab } from "./mobile-fab"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslation } from 'react-i18next';

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const { t } = useTranslation();

  // Logic to match MobileBottomNav visibility
  const isMobileNavHidden = /^(\/chat\/\d+|\/leela)$/.test(pathname)

  return (
    <>
      <Sidebar className="flex flex-col border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              {t('common.appName')}
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col p-2 pt-2">
          <MainNav />
        </SidebarContent>

        <SidebarFooter className="p-2">
          <UserMenu />
        </SidebarFooter>
      </Sidebar>

      <main className={`flex-1 overflow-x-hidden md:pb-0 ${isMobileNavHidden ? 'overflow-hidden' : 'overflow-y-auto pb-16'}`}>
        {children}
      </main>

      <MobileFab />
      <MobileBottomNav />
    </>
  )
}
