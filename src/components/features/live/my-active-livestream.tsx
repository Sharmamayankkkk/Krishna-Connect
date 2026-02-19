'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Radio, X, Settings } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ActiveLivestream {
    id: string
    title: string
    status: string
    created_at: string
}

export function MyActiveLivestream() {
    const { loggedInUser } = useAppContext()
    const [livestream, setLivestream] = useState<ActiveLivestream | null>(null)
    const [isEnding, setIsEnding] = useState(false)
    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        if (!loggedInUser) return

        const fetchActiveLivestream = async () => {
            const { data } = await supabase
                .from('livestreams')
                .select('id, title, status, created_at')
                .eq('host_id', loggedInUser.id)
                .in('status', ['backstage', 'live'])
                .order('created_at', { ascending: false })
                .limit(1)
                .limit(1)
                .maybeSingle()

            if (data) setLivestream(data)
        }

        fetchActiveLivestream()
    }, [loggedInUser, supabase])

    const handleEndStream = async () => {
        if (!livestream) return
        if (!confirm("Are you sure you want to end your active stream?")) return

        setIsEnding(true)
        try {
            const { error } = await supabase.from('livestreams').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', livestream.id)
            if (error) throw error

            toast({ title: 'Stream Ended', description: 'Your livestream has ended.' })
            setLivestream(null)
            router.refresh()
        } catch (error) {
            console.error('Failed to end stream:', error)
            toast({ variant: 'destructive', title: 'Error', description: 'Could not end the livestream.' })
        } finally {
            setIsEnding(false)
        }
    }

    if (!livestream) return null

    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:bg-gradient-to-br dark:from-red-950/20 dark:to-black">
            {/* Animated accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />

            <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full",
                        livestream.status === 'live'
                            ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500"
                            : "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-500"
                    )}>
                        <Radio className={cn("h-6 w-6", livestream.status === 'live' && "animate-pulse")} />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {livestream.status === 'live' ? 'Currently Live' : 'Backstage Mode'}
                        </span>
                        <h3 className="text-lg font-bold text-foreground leading-tight">
                            {livestream.title}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link href={`/live/${livestream.id}?host=true`} className="flex-1 md:flex-none">
                        <Button className="w-full md:w-auto font-bold rounded-full px-6" variant="default">
                            {livestream.status === 'backstage' ? 'Continue Setup' : 'Resume Stream'}
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEndStream}
                        disabled={isEnding}
                        className="rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
