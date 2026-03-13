'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, MessageSquare, User, Newspaper } from 'lucide-react'
import { cn, getAvatarUrl } from '@/lib/utils'
import { useAppContext } from '@/providers/app-provider'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

export function MobileBottomNav() {
    const pathname = usePathname()
    const { loggedInUser } = useAppContext()
    const { t } = useTranslation()

    // Hide bottom nav on chat conversation pages and active livestream pages (but show on discovery and leela)
    const hideOnRoutes = /^(\/chat\/\d+|\/live\/.+)/
    if (hideOnRoutes.test(pathname)) return null

    const navItems = [
        {
            href: '/',
            label: t('nav.feed'),
            icon: Home,
            isActive: pathname === '/' || pathname.startsWith('/feed'),
        },
        {
            href: '/explore',
            label: t('nav.explore'),
            icon: Compass,
            isActive: pathname.startsWith('/explore'),
        },
        {
            href: '/leela',
            label: t('nav.leela'),
            icon: null, // Custom image icon
            isActive: pathname.startsWith('/leela'),
        },
        {
            href: '/chat',
            label: t('nav.chat'),
            icon: MessageSquare,
            isActive: pathname.startsWith('/chat'),
        },
        {
            href: '/news',
            label: t('nav.news'),
            icon: Newspaper,
            isActive: pathname.startsWith('/news'),
        },
        {
            href: loggedInUser ? `/profile/${loggedInUser.username}` : '/',
            label: t('userMenu.profile'),
            icon: User,
            isActive: pathname.startsWith('/profile') && loggedInUser,
        },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
            <div className="flex items-center justify-between h-16 px-1 w-full">
                {navItems.map((item) => {
                    const IconComponent = item.icon
                    const isLeela = item.href === '/leela'

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex-1 shrink min-w-0 flex flex-col items-center justify-center h-full gap-1 transition-colors relative",
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
                                ) : item.href.startsWith('/profile') && loggedInUser?.avatar_url ? (
                                    <div className={cn(
                                        "h-6 w-6 rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-background transition-all shrink-0",
                                        item.isActive
                                            ? "ring-primary"
                                            : "ring-border"
                                    )}>
                                        <img
                                            src={getAvatarUrl(loggedInUser.avatar_url)}
                                            alt={loggedInUser.name || 'Profile'}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : IconComponent ? (
                                    <IconComponent className="h-6 w-6" />
                                ) : null}
                            </div>

                            {/* Label */}
                            <span className="text-[10px] font-medium truncate w-full text-center px-0.5">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
