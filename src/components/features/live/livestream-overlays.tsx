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

import { useTranslation } from 'react-i18next';

interface LivestreamOverlaysProps {
    call: any
    livestreamId: string
    role: 'host' | 'co-host' | 'viewer'
    hostProfile: { name: string; username: string; avatar_url: string | null }
    title: string
}

export function LivestreamOverlays({ call, livestreamId, role, hostProfile, title }: LivestreamOverlaysProps) {
  const { t } = useTranslation();

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
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl pl-1 pr-3 py-1 rounded-full border border-white/10 shadow-lg">
                            <Avatar className="h-8 w-8 ring-1 ring-white/20">
                                <AvatarImage src={hostProfile.avatar_url || ''} />
                                <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 border-none uppercase">
                                    {(hostProfile.name || hostProfile.username || 'H')[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col mb-0.5">
                                <span className="text-[11px] font-bold leading-tight text-white drop-shadow-md">
                                    {hostProfile.name || hostProfile.username}
                                </span>
                                <span className="text-[9px] text-gray-200 flex items-center gap-1 font-medium drop-shadow-md">
                                    {isLive ? (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                            LIVE
                                        </>
                                    ) : (
                                        <>{t('live.backstage')}</>
                                    )}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsParticipantsOpen(true)}
                            className="flex items-center gap-1.5 bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-bold text-white hover:bg-black/80 transition-colors shadow-lg"
                        >
                            <Users className="h-3 w-3" />
                            {participantCount}
                        </button>
                    </div>

                    {/* Room Title nicely integrated */}
                    {title && (
                        <div className="bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10 inline-flex self-start shadow-lg">
                            <p className="text-[11px] font-medium text-white/90 line-clamp-1">
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
                        >{t('live.end')}</Button>
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
            <div className="p-4 pb-[max(env(safe-area-inset-bottom),16px)] flex flex-col justify-end relative z-20 gap-2 w-full pointer-events-none h-full">

                {/* "Go Live" Button placed securely above the Chat Input, not over the face */}
                {role === 'host' && !isLive && (
                    <div className="flex justify-center mb-4 pointer-events-auto">
                        <Button
                            onClick={handleGoLive}
                            className="bg-white text-black hover:bg-gray-200 rounded-full font-bold px-10 shadow-2xl h-14 text-xl whitespace-nowrap animate-pulse"
                        >{t('live.goLive')}</Button>
                    </div>
                )}

                {/* Full Width Chat with Horizontal Actions */}
                <div className={cn(
                    "w-full transition-all duration-300 pointer-events-auto",
                    isChatOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}>
                    <LiveChat
                        livestreamId={livestreamId}
                        isOverlay={true}
                        actionButtons={
                            <>
                                {hasHardware && (
                                    <>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => isCamEnabled ? camera.disable() : camera.enable()}
                                            className={cn("h-10 w-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20", !isCamEnabled && "text-red-500 bg-red-500/10 border-red-500/30")}
                                        >
                                            {isCamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => isMicEnabled ? microphone.disable() : microphone.enable()}
                                            className={cn("h-10 w-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20", !isMicEnabled && "text-red-500 bg-red-500/10 border-red-500/30")}
                                        >
                                            {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                                        </Button>
                                    </>
                                )}

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setIsShareOpen(true)}
                                    className="h-10 w-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                                >
                                    <Share2 className="h-5 w-5" />
                                </Button>

                                {role === 'host' && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setIsInviteOpen(true)}
                                        className="h-10 w-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                )}
                            </>
                        }
                    />
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
