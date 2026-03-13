"use client"

import { useEffect, useState } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import {
    useCallStateHooks,
    ParticipantView,
    StreamCall,
    StreamVideo,
    CallControls as StreamCallControls
} from '@stream-io/video-react-sdk'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    Maximize2, Minimize2, Users, Loader2
} from 'lucide-react'
import { cn, getAvatarUrl } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

import { useTranslation } from 'react-i18next';

interface StreamCallScreenProps {
    callId: string
    callType: 'video' | 'voice'
    onCallEnd: (duration?: number) => void
    remoteUserName?: string
    remoteUserAvatar?: string
}

export function StreamCallScreen({
    callId,
    callType,
    onCallEnd,
    remoteUserName,
    remoteUserAvatar
}: StreamCallScreenProps) {
  const { t } = useTranslation();

    const { client } = useStreamVideo()
    const { toast } = useToast()
    const [call, setCall] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Initialize call
    useEffect(() => {
        if (!client) return

        const initCall = async () => {
            try {
                const streamCall = client.call(callType === 'video' ? 'default' : 'audio_room', callId)

                // Join the call
                await streamCall.join({ create: true })

                // Enable camera/mic based on call type
                if (callType === 'video') {
                    await streamCall.camera.enable()
                }
                await streamCall.microphone.enable()

                setCall(streamCall)
            } catch (error) {
                console.error('Failed to join call:', error)
                toast({
                    variant: 'destructive',
                    title: 'Failed to Join Call',
                    description: error instanceof Error ? error.message : 'Could not connect',
                })
                onCallEnd()
            } finally {
                setIsLoading(false)
            }
        }

        initCall()

        return () => {
            if (call) {
                call.leave().catch(console.error)
            }
        }
    }, [client, callId, callType])

    if (isLoading || !call) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    if (!client) return <Loader2 className="h-8 w-8 animate-spin" />

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallContent
                    callType={callType}
                    onCallEnd={onCallEnd}
                    remoteUserName={remoteUserName}
                    remoteUserAvatar={remoteUserAvatar}
                    isFullscreen={isFullscreen}
                    setIsFullscreen={setIsFullscreen}
                />
            </StreamCall>
        </StreamVideo>
    )
}

function CallContent({
    callType,
    onCallEnd,
    remoteUserName,
    remoteUserAvatar,
    isFullscreen,
    setIsFullscreen
}: {
    callType: 'video' | 'voice'
    onCallEnd: (duration?: number) => void
    remoteUserName?: string
    remoteUserAvatar?: string
    isFullscreen: boolean
    setIsFullscreen: (val: boolean) => void
}) {
    const { t } = useTranslation()
    const {
        useCameraState,
        useMicrophoneState,
        useLocalParticipant,
        useRemoteParticipants,
        useCallCallingState,
    } = useCallStateHooks()

    const { camera, isEnabled: isCamEnabled } = useCameraState()
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState()
    const localParticipant = useLocalParticipant()
    const remoteParticipants = useRemoteParticipants()
    const callingState = useCallCallingState()

    const [callDuration, setCallDuration] = useState(0)

    // Call duration timer
    useEffect(() => {
        if (callingState === 'joined') {
            const interval = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [callingState])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleEndCall = async () => {
        onCallEnd(callDuration)
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const isVideoCall = callType === 'video'
    const hasRemoteParticipants = remoteParticipants.length > 0

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white/20">
                            <AvatarImage src={remoteUserAvatar ? getAvatarUrl(remoteUserAvatar) : undefined} />
                            <AvatarFallback>{remoteUserName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-white font-medium">{remoteUserName || 'User'}</p>
                            <p className="text-white/60 text-sm">
                                {callingState === 'joined' ? formatDuration(callDuration) : 'Connecting...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleFullscreen}
                            className="text-white hover:bg-white/10"
                        >
                            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-32">
                {isVideoCall ? (
                    <div className={cn(
                        "grid gap-4 w-full h-full max-w-6xl",
                        hasRemoteParticipants ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                    )}>
                        {/* Remote Participants */}
                        {remoteParticipants.map((participant) => (
                            <div key={participant.sessionId} className="relative bg-gray-900 rounded-2xl overflow-hidden">
                                <ParticipantView
                                    participant={participant}
                                    className="w-full h-full"
                                />
                            </div>
                        ))}

                        {/* Local Participant */}
                        {localParticipant && (
                            <div className={cn(
                                "relative bg-gray-900 rounded-2xl overflow-hidden",
                                hasRemoteParticipants && "md:absolute md:bottom-4 md:right-4 md:w-48 md:h-36"
                            )}>
                                <ParticipantView
                                    participant={localParticipant}
                                    className="w-full h-full"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">{t('calls.you')}</div>
                            </div>
                        )}

                        {/* No participants yet */}
                        {!hasRemoteParticipants && (
                            <div className="flex flex-col items-center justify-center text-white/60">
                                <Users className="h-16 w-16 mb-4" />
                                <p>{t('calls.waitingForOthersToJoin')}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Voice call - show avatars
                    <div className="flex flex-col items-center justify-center gap-8">
                        <Avatar className="h-32 w-32 ring-4 ring-white/20">
                            <AvatarImage src={remoteUserAvatar ? getAvatarUrl(remoteUserAvatar) : undefined} />
                            <AvatarFallback className="text-4xl">{remoteUserName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <p className="text-white text-2xl font-semibold mb-2">{remoteUserName || 'User'}</p>
                            <p className="text-white/60">
                                {callingState === 'joined' ? formatDuration(callDuration) : 'Connecting...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
                    {/* Microphone */}
                    <Button
                        size="lg"
                        variant={isMicEnabled ? 'default' : 'destructive'}
                        onClick={() => isMicEnabled ? microphone.disable() : microphone.enable()}
                        className="h-14 w-14 rounded-full"
                    >
                        {isMicEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                    </Button>

                    {/* Camera (video calls only) */}
                    {isVideoCall && (
                        <Button
                            size="lg"
                            variant={isCamEnabled ? 'default' : 'destructive'}
                            onClick={() => isCamEnabled ? camera.disable() : camera.enable()}
                            className="h-14 w-14 rounded-full"
                        >
                            {isCamEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                        </Button>
                    )}

                    {/* End Call */}
                    <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleEndCall}
                        className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
                    >
                        <PhoneOff className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
