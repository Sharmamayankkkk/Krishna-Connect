'use client'

import { useEffect, useState } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useCallStateHooks, ParticipantView, StreamCall } from '@stream-io/video-react-sdk'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, VideoOff, Mic, MicOff, Radio, Users, Loader2, MessageCircle, X, Share2, MoreVertical, Settings, MonitorUp, MonitorX } from 'lucide-react'
import { InviteGuestDialog } from './invite-guest-dialog'
import { ShareLivestreamDialog } from './share-livestream-dialog'
import { ParticipantsModal } from './participants-modal'
import { createClient } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/providers/app-provider'
import { cn } from '@/lib/utils'
import { LiveLayout } from './live-layout'
import { LiveChat } from '@/components/features/live/live-chat'

interface LivestreamHostViewProps {
    livestreamId: string
    callId: string
    isGuest?: boolean
}

export function LivestreamHostView({ livestreamId, callId, isGuest = false }: LivestreamHostViewProps) {
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
                await streamCall.camera.enable()
                await streamCall.microphone.enable()
                setCall(streamCall)
            } catch (error) {
                console.error('Failed to join call:', error)
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
                    <LivestreamHostControls call={call} livestreamId={livestreamId} isGuest={isGuest} />
                </div>
            </LiveLayout>
        </StreamCall>
    )
}

function LivestreamHostControls({ call, livestreamId, isGuest }: { call: any; livestreamId: string; isGuest: boolean }) {
    const { useCameraState, useMicrophoneState, useScreenShareState, useIsCallLive, useParticipantCount, useLocalParticipant, useParticipants } = useCallStateHooks()

    const { camera, isEnabled: isCamEnabled } = useCameraState()
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState()
    const { screenShare, isEnabled: isScreenShareEnabled } = useScreenShareState()
    const isLive = useIsCallLive()
    const participantCount = useParticipantCount()
    const localParticipant = useLocalParticipant()
    const participants = useParticipants()

    const formattedParticipants = participants.map((p) => ({
        id: p.userId,
        name: p.name,
        username: p.name, // Fallback if username not available directly
        avatar_url: p.image,
    }))

    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()
    const [isChatOpen, setIsChatOpen] = useState(true) // Default open on desktop
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)

    // Toggle Chat visibility
    const toggleChat = () => setIsChatOpen(!isChatOpen)

    const handleGoLive = async () => {
        try {
            await call.goLive()
            await supabase.from('livestreams').update({ status: 'live', started_at: new Date().toISOString() }).eq('id', livestreamId)
            toast({ title: "You're Live!", description: "Your stream is now broadcasting." })
        } catch (error) {
            console.error(error)
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to go live.' })
        }
    }

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

    return (
        <div className="relative w-full h-full bg-black">
            {/* 1. Full-Screen Video Background */}
            <div className="absolute inset-0 z-0">
                {localParticipant ? (
                    <ParticipantView participant={localParticipant} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-900">
                        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                    </div>
                )}
                {/* Gradient Overlays for readability */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>

            {/* 2. Top Bar (Overlay) */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-start justify-between">
                <div className="flex flex-col gap-2">
                    {/* Live Badge */}
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg transition-colors",
                        isLive ? "bg-red-600 text-white" : "bg-black/40 text-gray-200 border border-white/10"
                    )}>
                        {isLive ? (
                            <>
                                <Radio className="h-4 w-4 animate-pulse" />
                                <span className="text-xs font-bold tracking-wide">LIVE</span>
                            </>
                        ) : (
                            <span className="text-xs font-bold tracking-wide">BACKSTAGE</span>
                        )}
                    </div>

                    {/* Viewer Counter */}
                    <button
                        onClick={() => setIsParticipantsModalOpen(true)}
                        className="self-start flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 hover:bg-black/60 transition-colors"
                    >
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{participantCount}</span>
                    </button>
                </div>

                <div className="flex gap-2">
                    {/* End Stream Button */}
                    {!isGuest ? (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleEndStream}
                            className="rounded-full px-4 font-semibold shadow-lg hover:bg-red-700"
                        >
                            End
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push('/')}
                            className="rounded-full px-4 font-semibold shadow-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                        >
                            Leave
                        </Button>
                    )}
                </div>
            </div>

            {/* 3. Bottom Controls Area */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-4 flex flex-col gap-4 pb- safe-area-bottom">

                {/* Chat Overlay - Left Side */}
                <div className={cn(
                    "w-full md:w-[350px] transition-all duration-300 ease-in-out",
                    isChatOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none h-0"
                )}>
                    {/* Pass simplified=true to chat for minimalist look */}
                    <LiveChat livestreamId={livestreamId} isOverlay={true} />
                </div>

                {/* Glass Dock - Controls */}
                <div className="flex items-center justify-between gap-4">
                    {/* Chat Toggle (Mobile) */}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleChat}
                        className={cn(
                            "rounded-full h-12 w-12 backdrop-blur-lg border border-white/10 shadow-lg text-white hover:bg-white/20",
                            isChatOpen ? "bg-white/20" : "bg-black/40"
                        )}
                    >
                        <MessageCircle className="h-5 w-5" />
                    </Button>

                    {/* Center Controls Group */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => isCamEnabled ? camera.disable() : camera.enable()}
                            className={cn("rounded-full h-10 w-10 hover:bg-white/20", !isCamEnabled && "text-red-500")}
                        >
                            {isCamEnabled ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5" />}
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => isMicEnabled ? microphone.disable() : microphone.enable()}
                            className={cn("rounded-full h-10 w-10 hover:bg-white/20", !isMicEnabled && "text-red-500")}
                        >
                            {isMicEnabled ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5" />}
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => isScreenShareEnabled ? screenShare.disable() : screenShare.enable()}
                            className={cn("rounded-full h-10 w-10 hover:bg-white/20", isScreenShareEnabled && "bg-white/20")}
                        >
                            {isScreenShareEnabled ? <MonitorX className="h-5 w-5 text-red-500" /> : <MonitorUp className="h-5 w-5 text-white" />}
                        </Button>

                        <div className="w-px h-6 bg-white/20 mx-1" />

                        {!isLive ? (
                            <Button
                                size="sm"
                                onClick={handleGoLive}
                                className="bg-white text-black hover:bg-gray-200 rounded-full font-bold px-4"
                            >
                                Go Live
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsShareDialogOpen(true)}
                                className="rounded-full h-10 w-10 hover:bg-white/20 text-white"
                            >
                                <Share2 className="h-5 w-5" />
                            </Button>
                        )}

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsInviteDialogOpen(true)}
                            className="rounded-full h-10 w-10 hover:bg-white/20 text-white"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Placeholder for right side balance */}
                    <div className="w-12" />
                </div>
            </div>

            {/* Dialogs */}
            <InviteGuestDialog
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
                livestreamId={livestreamId}
                currentGuests={[]} // Should fetch real guests here
            />
            <ShareLivestreamDialog
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                livestreamId={livestreamId}
                title={call?.state?.custom?.title || 'Livestream'}
            />
            <ParticipantsModal
                open={isParticipantsModalOpen}
                onOpenChange={setIsParticipantsModalOpen}
                participants={formattedParticipants}
                viewerCount={participantCount}
            />
        </div>
    )
}
