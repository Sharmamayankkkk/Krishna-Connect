"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Palette, Lock, Shield, ChevronRight } from "lucide-react"

interface SettingsSidebarProps extends React.HTMLAttributes<HTMLElement> { }

const items = [
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: Palette,
    },
    {
        title: "Privacy",
        href: "/settings/privacy",
        icon: Lock,
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Shield,
    },
]

export function SettingsSidebar({ className, ...props }: SettingsSidebarProps) {
    const pathname = usePathname()

    return (
        <nav
            className={cn(
                "flex flex-col space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "justify-between lg:justify-start text-left flex items-center gap-3 px-3 py-4 lg:py-2 text-base lg:text-sm font-medium rounded-lg transition-colors",
                        pathname === item.href
                            ? "bg-secondary text-secondary-foreground"
                            : "hover:bg-secondary/50",
                    )}
                >
                    <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 lg:h-4 lg:w-4" />
                        <span>{item.title}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground lg:hidden" />
                </Link>
            ))}
        </nav>
    )
}
