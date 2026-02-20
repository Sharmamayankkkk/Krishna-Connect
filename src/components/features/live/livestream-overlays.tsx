'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCallStateHooks } from '@stream-io/video-react-sdk'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, VideoOff, Mic, MicOff, Users, Share2, MoreVertical, Heart, X, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InviteGuestDialog } from './invite-guest-dialog'
import { ShareLivestreamDialog } from './share-livestream-dialog'
import { ParticipantsModal } from './participants-modal'
import { LiveChat } from './live-chat'
import { createClient } from '@/lib/utils'

interface LivestreamOverlaysProps {
    call: any
    livestreamId: string
    role: 'host' | 'co-host' | 'viewer'
    hostProfile: { name: string; username: string; avatar_url: string | null }
    title: string
}

export function LivestreamOverlays({ call, livestreamId, role, hostProfile, title }: LivestreamOverlaysProps) {
    const {
        useCameraState,
        useMicrophoneState,
        useIsCallLive,
        useParticipantCount,
        useParticipants,
    } = useCallStateHooks()

    const { camera, isEnabled: isCamEnabled } = useCameraState()
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState()
    const isLive = useIsCallLive()
    const participantCount = useParticipantCount()
    const participants = useParticipants()

    const formattedParticipants = participants.map((p) => ({
        id: p.userId,
        name: p.name,
        username: p.name,
        avatar_url: p.image,
    }))

    const router = useRouter()
    const supabase = createClient()

    const [isChatOpen, setIsChatOpen] = useState(true)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

    // Hardware checks
    const hasHardware = role === 'host' || role === 'co-host'

    const handleEndStream = async () => {
        if (!confirm('End livestream?')) return
        try {
            await call.endCall()
            await supabase.from('livestreams').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', livestreamId)
            router.push('/live')
        } catch (error) {
            console.error(error)
        }
    }

    const handleLeaveStream = async () => {
        router.push('/')
    }

    const handleGoLive = async () => {
        try {
            await call.goLive()
            await supabase.from('livestreams').update({ status: 'live', started_at: new Date().toISOString() }).eq('id', livestreamId)
        } catch (error) {
            console.error('Failed to go live:', error)
        }
    }

    return (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
            {/* Top Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

            {/* Top Bar Navigation */}
            <div className="p-4 pt-[max(env(safe-area-inset-top),16px)] flex items-start justify-between relative z-20 pointer-events-auto w-full">
                {/* Left side: Host Info, Live Badge */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md pl-1 pr-3 py-1 rounded-full border border-white/10">
                            <Avatar className="h-8 w-8 ring-1 ring-white/20">
                                <AvatarImage src={hostProfile.avatar_url || ''} />
                                <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 border-none uppercase">
                                    {(hostProfile.name || hostProfile.username || 'H')[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col mb-0.5">
                                <span className="text-[11px] font-bold leading-tight text-white">
                                    {hostProfile.name || hostProfile.username}
                                </span>
                                <span className="text-[9px] text-gray-300 flex items-center gap-1 font-medium">
                                    {isLive ? (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            LIVE
                                        </>
                                    ) : (
                                        <>BACKSTAGE</>
                                    )}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsParticipantsOpen(true)}
                            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-bold text-white hover:bg-black/60 transition-colors"
                        >
                            <Users className="h-3 w-3" />
                            {participantCount}
                        </button>
                    </div>

                    {/* Room Title */}
                    {title && (
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 max-w-[200px]">
                            <p className="text-xs font-medium text-white line-clamp-2 leading-tight">
                                {title}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Side: Close / End UI */}
                <div className="flex gap-2 relative z-20">
                    {role === 'host' ? (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleEndStream}
                            className="h-8 rounded-full px-4 text-xs font-semibold shadow-lg hover:bg-red-700 pointer-events-auto"
                        >
                            End
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleLeaveStream}
                            className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 pointer-events-auto shadow-lg"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Bottom Controls */}
            <div className="p-4 pb-[max(env(safe-area-inset-bottom),16px)] flex items-end justify-between relative z-20 gap-2 w-full pointer-events-none">

                {/* Left Side: Chat */}
                <div className={cn(
                    "flex-1 w-full transition-all duration-300 pointer-events-auto",
                    isChatOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                )}>
                    <LiveChat livestreamId={livestreamId} isOverlay={true} />
                </div>

                {/* Right Side: Toolbar */}
                <div className="flex flex-col items-end gap-3 pb-2 pl-2 shrink-0 pointer-events-auto">
                    {hasHardware && (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => isCamEnabled ? camera.disable() : camera.enable()}
                                className={cn("h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20", !isCamEnabled && "text-red-500 bg-red-500/10 border-red-500/30")}
                            >
                                {isCamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => isMicEnabled ? microphone.disable() : microphone.enable()}
                                className={cn("h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20", !isMicEnabled && "text-red-500 bg-red-500/10 border-red-500/30")}
                            >
                                {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                            </Button>
                        </>
                    )}

                    {role === 'host' && !isLive && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
                            <Button
                                onClick={handleGoLive}
                                className="bg-white text-black hover:bg-gray-200 rounded-full font-bold px-8 shadow-2xl h-12 text-lg whitespace-nowrap"
                            >
                                Go Live
                            </Button>
                        </div>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsShareOpen(true)}
                        className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                    >
                        <Share2 className="h-5 w-5" />
                    </Button>

                    {role === 'host' && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsInviteOpen(true)}
                            className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    )}

                </div>
            </div>

            {/* Modals placed safely outside flex flow */}
            <div className="pointer-events-auto">
                <InviteGuestDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} livestreamId={livestreamId} currentGuests={[]} />
                <ShareLivestreamDialog open={isShareOpen} onOpenChange={setIsShareOpen} livestreamId={livestreamId} title={title} />
                <ParticipantsModal open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen} participants={formattedParticipants} viewerCount={participantCount} />
            </div>
        </div>
    )
}
