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
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "justify-start text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "lg:hover:bg-muted lg:hover:no-underline"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground lg:hidden ml-auto" />
                </Link>
            ))}
        </nav>
    )
}
