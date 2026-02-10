'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAppContext } from '@/providers/app-provider'
import Image from 'next/image'

export function MobileBottomNav() {
    const pathname = usePathname()
    const { toast } = useToast()
    const { loggedInUser } = useAppContext()

    const handleLeelaClick = () => {
        toast({
            title: "🎁 Win a Verified Badge!",
            description: "Guess what Leela is and tag @krishnaConnect to win!",
            duration: 4000,
        })
    }

    const navItems = [
        {
            href: '/explore',
            label: 'Explore',
            icon: Home,
            isActive: pathname === '/' || pathname.startsWith('/explore'),
        },
        {
            href: '/feed',
            label: 'Feed',
            icon: Sparkles,
            isActive: pathname.startsWith('/feed'),
        },
        {
            href: '/leela',
            label: 'Leela',
            icon: null, // Custom image icon
            isActive: pathname.startsWith('/leela'),
            isComingSoon: true,
            onClick: handleLeelaClick,
        },
        {
            href: '/chat',
            label: 'Chats',
            icon: MessageSquare,
            isActive: pathname.startsWith('/chat'),
        },
        {
            href: loggedInUser ? `/profile/${loggedInUser.username}` : '/explore',
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
                            onClick={(e) => {
                                if (item.onClick) {
                                    item.onClick()
                                    // Don't prevent default - let navigation happen
                                }
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] h-full gap-1 transition-colors relative",
                                item.isActive
                                    ? "text-primary"
                                    : item.isComingSoon
                                        ? "text-muted-foreground/50"
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
                                        className={cn(
                                            "transition-opacity",
                                            item.isComingSoon && "opacity-50"
                                        )}
                                    />
                                ) : IconComponent ? (
                                    <IconComponent className="h-6 w-6" />
                                ) : null}

                                {/* Coming Soon badge */}
                                {item.isComingSoon && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded">
                                        SOON
                                    </span>
                                )}
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
