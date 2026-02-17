"use client"

import { useEffect, useState } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useCallStateHooks, ParticipantView, StreamCall } from '@stream-io/video-react-sdk'
import { Button } from '@/components/ui/button'
import { Video, VideoOff, Mic, MicOff, Radio, StopCircle, Users, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface LivestreamHostViewProps {
    livestreamId: string
    callId: string
}

export function LivestreamHostView({ livestreamId, callId }: LivestreamHostViewProps) {
    const { client } = useStreamVideo()
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const [call, setCall] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize call
    useEffect(() => {
        if (!client) return

        const initCall = async () => {
            try {
                const streamCall = client.call('livestream', callId)

                // Join the call first
                await streamCall.join()

                // Request camera and microphone permissions
                await streamCall.camera.enable()
                await streamCall.microphone.enable()

                setCall(streamCall)
            } catch (error) {
                console.error('Failed to join call:', error)
                toast({
                    variant: 'destructive',
                    title: 'Failed to Join',
                    description: error instanceof Error ? error.message : 'Could not connect to the livestream',
                })
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
    }, [client, callId])

    if (isLoading || !call) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <StreamCall call={call}>
            <div className="flex flex-col h-screen bg-black">
                <LivestreamHostControls call={call} livestreamId={livestreamId} />
            </div>
        </StreamCall>
    )
}

function LivestreamHostControls({ call, livestreamId }: { call: any; livestreamId: string }) {
    const {
        useCameraState,
        useMicrophoneState,
        useParticipantCount,
        useIsCallLive,
        useLocalParticipant,
    } = useCallStateHooks()

    const { camera, isEnabled: isCamEnabled } = useCameraState()
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState()
    const participantCount = useParticipantCount()
    const isLive = useIsCallLive()
    const localParticipant = useLocalParticipant()

    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const handleGoLive = async () => {
        try {
            await call.goLive()

            // Update database status
            await supabase
                .from('livestreams')
                .update({
                    status: 'live',
                    started_at: new Date().toISOString()
                })
                .eq('id', livestreamId)

            toast({
                title: 'You\'re Live!',
                description: 'Your livestream is now broadcasting',
            })
        } catch (error) {
            console.error('Failed to go live:', error)
            toast({
                variant: 'destructive',
                title: 'Failed to Go Live',
                description: 'Could not start the livestream',
            })
        }
    }

    const handleStopLive = async () => {
        try {
            await call.stopLive()

            // Update database status
            await supabase
                .from('livestreams')
                .update({ status: 'backstage' })
                .eq('id', livestreamId)

            toast({
                title: 'Stream Stopped',
                description: 'You\'re back in backstage mode',
            })
        } catch (error) {
            console.error('Failed to stop live:', error)
        }
    }

    const handleEndStream = async () => {
        try {
            await call.endCall()

            // Update database
            await supabase
                .from('livestreams')
                .update({
                    status: 'ended',
                    ended_at: new Date().toISOString()
                })
                .eq('id', livestreamId)

            toast({
                title: 'Stream Ended',
                description: 'Your livestream has ended',
            })

            router.push('/profile')
        } catch (error) {
            console.error('Failed to end stream:', error)
        }
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Video Preview */}
            <div className="flex-1 relative bg-gray-900">
                {localParticipant && (
                    <ParticipantView
                        participant={localParticipant}
                        className="w-full h-full"
                    />
                )}

                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                    {isLive ? (
                        <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-md">
                            <Radio className="h-4 w-4 animate-pulse" />
                            <span className="text-sm font-semibold text-white">LIVE</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-yellow-600 px-3 py-1.5 rounded-md">
                            <span className="text-sm font-semibold text-white">BACKSTAGE</span>
                        </div>
                    )}
                </div>

                {/* Viewer Count */}
                {isLive && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
                        <Users className="h-4 w-4 text-white" />
                        <span className="text-sm text-white">{participantCount - 1}</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-background border-t p-4">
                <div className="flex items-center justify-center gap-3">
                    {/* Camera Toggle */}
                    <Button
                        variant={isCamEnabled ? 'default' : 'destructive'}
                        size="icon"
                        onClick={() => camera.toggle()}
                    >
                        {isCamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>

                    {/* Mic Toggle */}
                    <Button
                        variant={isMicEnabled ? 'default' : 'destructive'}
                        size="icon"
                        onClick={() => microphone.toggle()}
                    >
                        {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    {/* Go Live / Stop Live */}
                    {!isLive ? (
                        <Button onClick={handleGoLive} className="bg-red-600 hover:bg-red-700">
                            <Radio className="mr-2 h-4 w-4" />
                            Go Live
                        </Button>
                    ) : (
                        <Button onClick={handleStopLive} variant="outline">
                            Stop Live
                        </Button>
                    )}

                    {/* End Stream */}
                    <Button onClick={handleEndStream} variant="destructive">
                        <StopCircle className="mr-2 h-4 w-4" />
                        End Stream
                    </Button>
                </div>
            </div>
        </div>
    )
}
