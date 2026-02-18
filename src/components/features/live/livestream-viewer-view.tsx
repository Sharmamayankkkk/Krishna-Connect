'use client'

import { useEffect, useState, useRef } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useCallStateHooks, ParticipantView, StreamCall } from '@stream-io/video-react-sdk'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { LiveLayout } from './live-layout'
import { LiveChat } from './live-chat'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, X, Heart, Share2, MoreVertical, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LivestreamViewerViewProps {
    livestreamId: string
    callId: string
    hostName: string
    title: string
}

export function LivestreamViewerView({ livestreamId, callId, hostName, title }: LivestreamViewerViewProps) {
    const { client } = useStreamVideo()
    const { toast } = useToast()
    const router = useRouter()

    const [call, setCall] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!client) return

        const initCall = async () => {
            try {
                const streamCall = client.call('livestream', callId)
                await streamCall.join()
                setCall(streamCall)
            } catch (error) {
                console.error('Failed to join livestream:', error)
                toast({
                    variant: 'destructive',
                    title: 'Failed to Join',
                    description: 'Could not connect to the livestream',
                })
            } finally {
                setIsLoading(false)
            }
        }

        initCall()

        return () => {
            if (call) call.leave().catch(console.error)
        }
    }, [client, callId])

    if (isLoading || !call) {
        return (
            <div className="flex items-center justify-center h-[100dvh] bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <StreamCall call={call}>
            <LiveLayout>
                <div className="relative w-full h-full">
                    {/* Listen for end call event */}
                    <CallListener />
                    <LivestreamViewerContent call={call} hostName={hostName} title={title} livestreamId={livestreamId} />
                </div>
            </LiveLayout>
        </StreamCall>
    )
}

function CallListener() {
    const { useCallEndedAt } = useCallStateHooks()
    const callEndedAt = useCallEndedAt()
    const router = useRouter()

    useEffect(() => {
        if (callEndedAt) router.refresh()
    }, [callEndedAt, router])

    return null
}

function LivestreamViewerContent({ call, hostName, title, livestreamId }: { call: any, hostName: string, title: string, livestreamId: string }) {
    const { useParticipantCount, useIsCallLive, useParticipants } = useCallStateHooks()

    const participantCount = useParticipantCount()
    const isLive = useIsCallLive()
    const participants = useParticipants()
    const hostParticipant = participants.find(p => !p.isLocalParticipant)

    // Autoplay / Audio state
    const [isMuted, setIsMuted] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)

    // Manual unmute handler
    const toggleMute = () => setIsMuted(!isMuted)

    // Handle Muting via DOM since ParticipantView doesn't expose a mute prop
    useEffect(() => {
        if (!containerRef.current) return

        const mediaElements = containerRef.current.querySelectorAll('video, audio')
        mediaElements.forEach((el: Element) => {
            (el as HTMLMediaElement).muted = isMuted
        })
    }, [isMuted, hostParticipant])

    return (
        <div className="relative w-full h-full bg-black">
            {/* 1. Full-Screen Video */}
            <div className="absolute inset-0 z-0" ref={containerRef}>
                {hostParticipant ? (
                    <ParticipantView
                        participant={hostParticipant}
                        trackType={hostParticipant.screenShareStream ? 'screenShareTrack' : 'videoTrack'}
                        className="h-full w-full object-contain bg-black"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-900">
                        <div className="text-center space-y-4">
                            <div className="relative mx-auto h-20 w-20">
                                <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                                <Avatar className="h-20 w-20 border-2 border-white">
                                    <AvatarFallback className="bg-gray-800 text-white text-xl">{hostName[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                            <p className="text-gray-400 text-sm font-medium animate-pulse">
                                {isLive ? 'Connecting to stream...' : 'Waiting for host to go live...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
            </div>

            {/* 2. Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe-top flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Host Profile */}
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 pr-4">
                        <Avatar className="h-8 w-8 ring-1 ring-white/20">
                            <AvatarFallback className="text-[10px] bg-gradient-to-br from-red-500 to-pink-600 border-none">{hostName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold leading-tight">{hostName}</span>
                            <span className="text-[9px] text-gray-300 flex items-center gap-1">
                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                {isLive ? 'LIVE' : 'OFFLINE'}
                            </span>
                        </div>
                        {/* Follow Button Placeholder */}
                        <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2 ml-1 rounded-full bg-white text-black hover:bg-gray-200">
                            Follow
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Viewers */}
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/90">
                        <Users className="h-3 w-3" />
                        {participantCount}
                    </div>
                    {/* Close */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/20"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 3. Main Interface Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Tap to Unmute Overlay */}
                {isMuted && isLive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                        <button
                            onClick={toggleMute}
                            className="bg-black/60 backdrop-blur-md text-white rounded-full px-6 py-3 font-semibold flex items-center gap-3 hover:scale-105 transition-transform animate-in fade-in"
                        >
                            <VolumeX className="h-5 w-5" />
                            Tap to Unmute
                        </button>
                    </div>
                )}
            </div>

            {/* 4. Bottom Controls & Interactions */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-safe-bottom flex items-end justify-between gap-4">
                {/* Left: Chat Overlay */}
                <div className="flex-1 max-w-[calc(100%-60px)] md:max-w-[400px]">
                    <LiveChat livestreamId={livestreamId} isOverlay={true} />
                </div>

                {/* Right: Interaction Stack */}
                <div className="flex flex-col items-center gap-4 pb-14 pointer-events-auto">
                    {/* Mute Toggle (Small) */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMute}
                        className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                    >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                    >
                        <Share2 className="h-6 w-6" />
                        <span className="sr-only">Share</span>
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                    >
                        <MoreVertical className="h-6 w-6" />
                        <span className="sr-only">More</span>
                    </Button>

                    {/* Animated Heart Button is inside Live Chat input area now for easier access, 
                        but we keep one here too for stacking aesthetic if needed */}
                </div>
            </div>
        </div>
    )
}
