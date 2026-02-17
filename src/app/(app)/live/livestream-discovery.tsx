'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Radio, Users, Loader2 } from 'lucide-react'
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
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="md:hidden" />
                        <div className="flex items-center gap-2">
                            <Radio className="h-5 w-5 text-red-500" />
                            <h1 className="text-xl font-bold">Live Streams</h1>
                        </div>
                    </div>
                    <GoLiveButton />
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Show user's active livestream if they have one */}
                    <MyActiveLivestream />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : livestreams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Radio className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">No Live Streams</h2>
                            <p className="text-muted-foreground mb-6">
                                Be the first to go live and connect with your community!
                            </p>
                            <GoLiveButton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {livestreams.map((stream) => (
                                <Link key={stream.id} href={`/live/${stream.id}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                                        <CardContent className="p-0">
                                            {/* Thumbnail Placeholder */}
                                            <div className="relative aspect-video bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 flex items-center justify-center">
                                                <Radio className="h-12 w-12 text-white animate-pulse" />

                                                {/* Live Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <Badge className="bg-red-600 hover:bg-red-600">
                                                        <Radio className="h-3 w-3 mr-1 animate-pulse" />
                                                        LIVE
                                                    </Badge>
                                                </div>

                                                {/* Viewer Count */}
                                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-white" />
                                                    <span className="text-xs text-white font-medium">
                                                        {stream.viewer_count || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stream Info */}
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-red-500">
                                                        <AvatarImage src={stream.host.avatar_url || '/user_Avatar/male.png'} />
                                                        <AvatarFallback>{stream.host.name[0]}</AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                            {stream.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {stream.host.name}
                                                        </p>
                                                        {stream.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
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
        </div>
    )
}
