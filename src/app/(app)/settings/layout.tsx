"use client"

import { Separator } from "@/components/ui/separator"
import { SettingsSidebar } from "./components/settings-sidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isSettingsRoot = pathname === "/settings"

    // Helper to get title based on path
    const getPageTitle = () => {
        if (pathname.includes("/appearance")) return "Appearance"
        if (pathname.includes("/language")) return "Language"
        if (pathname.includes("/privacy")) return "Privacy"
        if (pathname.includes("/security")) return "Security"
        if (pathname.includes("/promotions")) return "Promotions"
        return "Settings"
    }

    return (
        <div className="container max-w-4xl mx-auto py-4 md:py-6 px-4 md:px-8 h-[calc(100vh-4rem)] md:h-auto overflow-y-auto md:overflow-visible">
            {/* Desktop Header */}
            <div className="hidden md:block space-y-0.5 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <Separator className="hidden md:block my-6" />

            {/* Mobile Header (Subpages only) */}
            {!isSettingsRoot && (
                <div className="md:hidden flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors">
                    <Link href="/settings" className="flex items-center gap-1">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="font-medium text-foreground">Settings</span>
                    </Link>
                </div>
            )}
            {/* Mobile Root Title */}
            {isSettingsRoot && (
                <div className="md:hidden mb-6 flex items-center gap-3">
                    <Link href="/feed" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                </div>
            )}

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                {/* Sidebar: 
                    - Mobile: Show only on Root
                    - Desktop: Always Show
                */}
                <aside className={cn(
                    "lg:w-1/5",
                    !isSettingsRoot && "hidden lg:block"
                )}>
                    <SettingsSidebar />
                </aside>

                {/* Content:
                    - Mobile: Show only on Subpages (Hide on Root)
                    - Desktop: Always Show (but settings/page.tsx redirects anyway)
                */}
                <div className={cn(
                    "flex-1 lg:max-w-2xl",
                    isSettingsRoot && "hidden lg:block"
                )}>
                    {children}
                </div>
            </div>
        </div>
    )
}
