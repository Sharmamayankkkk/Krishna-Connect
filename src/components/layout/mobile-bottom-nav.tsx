'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppContext } from '@/providers/app-provider'
import Image from 'next/image'

export function MobileBottomNav() {
    const pathname = usePathname()
    const { loggedInUser } = useAppContext()

    // Hide bottom nav on chat conversation pages and leela video player
    const hideOnRoutes = /^(\/chat\/\d+|\/leela)$/
    if (hideOnRoutes.test(pathname)) return null

    const navItems = [
        {
            href: '/',
            label: 'Feed',
            icon: Home,
            isActive: pathname === '/' || pathname.startsWith('/feed'),
        },
        {
            href: '/explore',
            label: 'Explore',
            icon: Compass,
            isActive: pathname.startsWith('/explore'),
        },
        {
            href: '/leela',
            label: 'Leela',
            icon: null, // Custom image icon
            isActive: pathname.startsWith('/leela'),
        },
        {
            href: '/chat',
            label: 'Chats',
            icon: MessageSquare,
            isActive: pathname.startsWith('/chat'),
        },
        {
            href: loggedInUser ? `/profile/${loggedInUser.username}` : '/',
            label: 'Profile',
            icon: User,
            isActive: pathname.startsWith('/profile') && loggedInUser,
        },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const IconComponent = item.icon
                    const isLeela = item.label === 'Leela'

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] h-full gap-1 transition-colors relative",
                                item.isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-label={item.label}
                        >
                            {/* Icon */}
                            <div className="relative">
                                {isLeela ? (
                                    <Image
                                        src="/icons/leela.png"
                                        alt="Leela"
                                        width={24}
                                        height={24}
                                    />
                                ) : IconComponent ? (
                                    <IconComponent className="h-6 w-6" />
                                ) : null}
                            </div>

                            {/* Label */}
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
