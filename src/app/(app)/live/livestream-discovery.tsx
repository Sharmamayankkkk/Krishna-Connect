'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Radio, Users, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { GoLiveButton } from '@/components/features/live/go-live-button'
import { MyActiveLivestream } from '@/components/features/live/my-active-livestream'

interface Livestream {
    id: string
    title: string
    description: string | null
    status: string
    viewer_count: number
    started_at: string | null
    host: {
        id: string
        username: string
        name: string
        avatar_url: string | null
    }
}

export function LivestreamDiscovery() {
    const [livestreams, setLivestreams] = useState<Livestream[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchLivestreams = async () => {
            const { data, error } = await supabase
                .from('livestreams')
                .select(`
          id,
          title,
          description,
          status,
          viewer_count,
          started_at,
          host:profiles!livestreams_host_id_fkey(
            id,
            username,
            name,
            avatar_url
          )
        `)
                .eq('status', 'live')
                .order('started_at', { ascending: false })

            if (!error && data) {
                setLivestreams(data as any)
            }
            setIsLoading(false)
        }

        fetchLivestreams()

        // Subscribe to livestream changes
        const channel = supabase
            .channel('livestreams_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'livestreams',
                filter: 'status=eq.live'
            }, () => {
                fetchLivestreams()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20">
            {/* Header with premium gradient */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="md:hidden" />
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-md opacity-50 animate-pulse" />
                                <Radio className="relative h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Live Streams
                                </h1>
                                <p className="text-xs text-muted-foreground">Discover amazing content</p>
                            </div>
                        </div>
                    </div>
                    <GoLiveButton />
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Show user's active livestream if they have one */}
                    <MyActiveLivestream />

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
                                <Loader2 className="relative h-12 w-12 animate-spin text-red-500" />
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">Loading live streams...</p>
                        </div>
                    ) : livestreams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-full blur-2xl opacity-20" />
                                <div className="relative p-6 rounded-full bg-gradient-to-br from-red-500/10 via-pink-500/10 to-purple-500/10 border border-red-500/20">
                                    <Radio className="h-12 w-12 text-red-500" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                No Live Streams
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-md">
                                Be the first to go live and connect with your community! Share your moments with the world.
                            </p>
                            <GoLiveButton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {livestreams.map((stream, index) => (
                                <Link
                                    key={stream.id}
                                    href={`/live/${stream.id}`}
                                    className="group"
                                    style={{
                                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                    }}
                                >
                                    <Card className="relative overflow-hidden border-2 border-transparent hover:border-red-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                                        {/* Gradient border effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                                        <CardContent className="p-0 relative">
                                            {/* Thumbnail with gradient overlay */}
                                            <div className="relative aspect-video bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                                {/* Animated background pattern */}
                                                <div className="absolute inset-0 opacity-20">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                                                </div>

                                                <Radio className="relative h-16 w-16 text-white drop-shadow-lg animate-pulse" />

                                                {/* Live Badge with pulse animation */}
                                                <div className="absolute top-3 left-3">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-red-600 rounded-md blur-md animate-pulse" />
                                                        <Badge className="relative bg-red-600 hover:bg-red-600 text-white font-semibold px-3 py-1 shadow-lg">
                                                            <span className="relative flex h-2 w-2 mr-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                            </span>
                                                            LIVE
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Viewer Count with glassmorphism */}
                                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 shadow-lg">
                                                    <Users className="h-3.5 w-3.5 text-white" />
                                                    <span className="text-sm text-white font-semibold">
                                                        {stream.viewer_count || 0}
                                                    </span>
                                                </div>

                                                {/* Bottom gradient overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>

                                            {/* Stream Info with better spacing */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    {/* Host Avatar with animated ring */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />
                                                        <Avatar className="relative h-11 w-11 ring-2 ring-red-500/50 group-hover:ring-red-500 transition-all">
                                                            <AvatarImage src={stream.host.avatar_url || '/user_Avatar/male.png'} />
                                                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-pink-500 text-white font-semibold">
                                                                {stream.host.name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <h3 className="font-bold text-base line-clamp-2 group-hover:text-red-500 transition-colors leading-tight">
                                                            {stream.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground font-medium">
                                                            {stream.host.name}
                                                        </p>
                                                        {stream.description && (
                                                            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                                                {stream.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
