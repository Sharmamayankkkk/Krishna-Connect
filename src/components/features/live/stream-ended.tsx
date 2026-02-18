'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, Home, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistance } from 'date-fns'

interface StreamEndedProps {
    host: {
        name: string
        username: string
        avatarUrl: string | null
    }
    duration?: string
    viewerCount?: number
}

export function StreamEnded({ host, duration, viewerCount }: StreamEndedProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-background text-foreground p-6 text-center animate-in fade-in duration-700">
            {/* Host Info */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500 to-purple-600 rounded-full blur-xl opacity-20 dark:opacity-50" />
                <Avatar className="h-24 w-24 border-4 border-background relative">
                    <AvatarImage src={host.avatarUrl || ''} />
                    <AvatarFallback className="text-2xl">{host.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full border border-border whitespace-nowrap font-medium">
                    @{host.username}
                </div>
            </div>

            <h2 className="text-3xl font-bold mb-2">Stream Ended</h2>
            <p className="text-muted-foreground mb-8">
                Thanks for watching!
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                    <span className="block text-2xl font-bold text-foreground">{viewerCount || 0}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Peak Viewers</span>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                    <span className="block text-2xl font-bold text-foreground">{duration || '0m'}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full h-12 shadow-lg hover:scale-105 transition-transform">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Follow Host
                </Button>

                <Link href="/live" className="w-full">
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground hover:bg-muted rounded-full h-12">
                        <Home className="mr-2 h-5 w-5" />
                        Back to Live Hub
                    </Button>
                </Link>
            </div>
        </div>
    )
}
