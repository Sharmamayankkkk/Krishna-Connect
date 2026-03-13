'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Radio, Users, Loader2, Play } from 'lucide-react'
import Link from 'next/link'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { GoLiveButton } from '@/components/features/live/go-live-button'
import { MyActiveLivestream } from '@/components/features/live/my-active-livestream'
import { cn } from '@/lib/utils'

import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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

    // Top stream for Hero section
    // Top stream for Hero section
    const featuredStream = livestreams[0]
    const otherStreams = livestreams.slice(1)

    return (
        <div className="flex flex-col h-full min-h-screen bg-background text-foreground pb-20 md:pb-0">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <div className="bg-red-600 rounded-md p-1">
                            <Radio className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">{t('nav.live')}</h1>
                    </div>
                    <GoLiveButton />
                </div>
            </header>

            <div className="flex-1 w-full max-w-7xl mx-auto p-4 space-y-8">
                {/* Active User Stream Status */}
                <MyActiveLivestream />

                {isLoading ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Hero Skeleton */}
                        <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl bg-muted animate-pulse relative overflow-hidden">
                            <div className="absolute bottom-6 left-6 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-background/50" />
                                    <div className="space-y-2">
                                        <div className="h-6 w-48 bg-background/50 rounded" />
                                        <div className="h-3 w-24 bg-background/50 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse relative overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
                                        <div className="h-4 w-3/4 bg-background/50 rounded" />
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full bg-background/50" />
                                            <div className="h-3 w-20 bg-background/50 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : livestreams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
                            <Radio className="relative h-20 w-20 text-muted-foreground mx-auto" strokeWidth={1} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{t('live.noActiveStreams')}</h2>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {t('live.stageEmpty')}
                            </p>
                        </div>
                        <GoLiveButton />
                    </div>
                ) : (
                    <>
                        {/* Live Rings (Stories style) */}
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {livestreams.map((stream) => (
                                <Link key={`ring-${stream.id}`} href={`/live/${stream.id}`} className="flex flex-col items-center gap-2 min-w-[72px]">
                                    <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 animate-spin-slow">
                                        <div className="bg-background p-[2px] rounded-full">
                                            <Avatar className="h-16 w-16 border-2 border-transparent">
                                                <AvatarImage src={stream.host.avatar_url || ''} className="object-cover" />
                                                <AvatarFallback>{stream.host.name[0]}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-background">
                                            {t('live.liveBadge')}
                                        </div>
                                    </div>
                                    <span className="text-xs text-center truncate w-full text-muted-foreground font-medium">
                                        {stream.host.username}
                                    </span>
                                </Link>
                            ))}
                        </div>

                        {/* Hero Section (Featured Stream) */}
                        {featuredStream && (
                            <Link href={`/live/${featuredStream.id}`} className="block group relative rounded-2xl overflow-hidden aspect-video md:aspect-[21/9] ring-1 ring-border shadow-sm hover:ring-red-500/50 transition-all">
                                {/* Simulated Live Preview Background */}
                                <div className="absolute inset-0 bg-black group-hover:scale-105 transition-transform duration-700">
                                    {/* Placeholder gradient as "video" */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                                    <div className="flex items-start justify-between absolute top-4 left-4 right-4">
                                        <Badge className="bg-red-600 hover:bg-red-700 border-none animate-pulse">{t('live.liveNow')}</Badge>
                                        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                                            <Users className="h-3 w-3" />
                                            {featuredStream.viewer_count} {t('live.watching')}
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-w-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-white/20">
                                                <AvatarImage src={featuredStream.host.avatar_url || ''} />
                                                <AvatarFallback>{featuredStream.host.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-lg md:text-2xl leading-none">
                                                    {featuredStream.title}
                                                </h3>
                                                <p className="text-gray-300 text-sm">
                                                    {t('live.withHost', { name: featuredStream.host.name })}
                                                </p>
                                            </div>
                                        </div>
                                        {featuredStream.description && (
                                            <p className="text-gray-400 text-sm line-clamp-2 md:line-clamp-1 pl-[52px]">
                                                {featuredStream.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 transform scale-75 group-hover:scale-100 transition-transform">
                                            <Play className="h-8 w-8 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Masonry Grid for Other Streams */}
                        {otherStreams.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">{t('live.moreLiveStreams')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {otherStreams.map((stream, i) => (
                                        <Link
                                            key={stream.id}
                                            href={`/live/${stream.id}`}
                                            className="group relative aspect-[4/5] md:aspect-video rounded-xl overflow-hidden bg-card border hover:border-red-500/50 transition-all shadow-sm"
                                        >
                                            {/* Preview Placeholder */}
                                            <div className="absolute inset-0 bg-gray-900 group-hover:scale-105 transition-transform duration-500">
                                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
                                            </div>

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent p-4 flex flex-col justify-between text-white">
                                                <div className="flex justify-between items-start">
                                                    <Badge className="bg-red-600/90 text-[10px] px-2 h-5">{t('live.liveBadge')}</Badge>
                                                    <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-gray-300 flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {stream.viewer_count}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <h4 className="font-semibold line-clamp-1 group-hover:text-red-400 transition-colors">
                                                        {stream.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-5 w-5 border border-white/10">
                                                            <AvatarImage src={stream.host.avatar_url || ''} />
                                                            <AvatarFallback className="text-black bg-white">{stream.host.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-gray-300">{stream.host.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
