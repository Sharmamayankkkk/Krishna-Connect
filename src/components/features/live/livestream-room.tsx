'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StreamVideo, StreamCall, useStreamVideoClient, useCallStateHooks, useCall } from '@stream-io/video-react-sdk'
import { LiveLayout } from './live-layout'
import { LivestreamVideoGrid } from './livestream-video-grid'
import { LivestreamOverlays } from './livestream-overlays'
import { createStreamClient, disconnectStreamClient } from '@/lib/stream-config'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useAppContext } from '@/providers/app-provider'
import { useTranslation } from 'react-i18next';

import '@stream-io/video-react-sdk/dist/css/styles.css'

interface LivestreamRoomProps {
    livestreamId: string
    callId: string
    role: 'host' | 'co-host' | 'viewer'
    hostProfile: { name: string; username: string; avatar_url: string | null }
    title: string
}

export function LivestreamRoom({ livestreamId, callId, role, hostProfile, title }: LivestreamRoomProps) {
  const { t } = useTranslation();

    const { loggedInUser } = useAppContext()
    const { toast } = useToast()
    const router = useRouter()

    const [client, setClient] = useState<any>(null)
    const [call, setCall] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // 1. Initialize Stream Client (if not already globally initialized)
    useEffect(() => {
        if (!loggedInUser?.id) return

        let mounted = true

        const init = async () => {
            try {
                const response = await fetch('/api/stream/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: loggedInUser.id }),
                })

                if (!response.ok) throw new Error('Failed to fetch token')
                const { token } = await response.json()

                const newClient = createStreamClient(
                    loggedInUser.id,
                    loggedInUser.name || loggedInUser.username,
                    loggedInUser.avatar_url || undefined,
                    token
                )

                if (mounted && newClient) {
                    setClient(newClient)
                }
            } catch (error) {
                console.error(error)
                toast({ variant: 'destructive', title: 'Connection Error', description: 'Could not connect to stream engine' })
            }
        }

        init()

        return () => {
            mounted = false
            // Note: We DO NOT call disconnectStreamClient here. The SDK natively handles background connections.
            // Disconnecting here aggressively causes token drops if the component re-renders or strict mode triggers.
        }
    }, [loggedInUser?.id])

    // 2. Join the Specific Call
    useEffect(() => {
        if (!client) return

        let mounted = true
        let currentCall: any = null

        const joinCall = async () => {
            try {
                currentCall = client.call('livestream', callId)

                // CRITICAL FIX: The Stream SDK eagerly asks for hardware permissions upon joining.
                // We MUST explicitly disable the hardware before joining if the user is just a viewer.
                if (role === 'viewer') {
                    await currentCall.camera.disable()
                    await currentCall.microphone.disable()
                }

                await currentCall.join()

                if (role === 'host' || role === 'co-host') {
                    // Pre-enable hardware for broadcasters gracefully
                    try {
                        await currentCall.camera.enable()
                        await currentCall.microphone.enable()
                    } catch (hardwareError) {
                        console.error('Initial hardware access denied or failed:', hardwareError)
                        toast({
                            variant: 'destructive',
                            title: 'Camera/Mic Blocked',
                            description: 'Please unblock your camera or microphone permissions to broadcast.'
                        })
                    }
                }

                if (mounted) {
                    setCall(currentCall)
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('Failed to join call:', error)
                toast({ variant: 'destructive', title: 'Failed to Join', description: 'Could not connect to the livestream room' })
                router.push('/')
            }
        }

        joinCall()

        // Explicit Hardware Cleanup Rule
        return () => {
            mounted = false
            if (currentCall) {
                // FORCE hardware off if broadcasting
                if (role === 'host' || role === 'co-host') {
                    currentCall.camera.disable().catch(console.error)
                    currentCall.microphone.disable().catch(console.error)
                }
                currentCall.leave().catch(console.error)
            }
        }
    }, [client, callId, role])

    if (isLoading || !client || !call) {
        return (
            <LiveLayout>
                <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white gap-4 rounded-[inherit]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm text-gray-400">{t('live.enteringLivestream')}</p>
                </div>
            </LiveLayout>
        )
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <LiveLayout>
                    <div className="relative w-full h-full bg-black overflow-hidden pointer-events-auto">
                        {/* Audio Routing Listener Component handles DOM muting if needed by Stream SDK */}
                        <AudioRouter isViewer={role === 'viewer'} />

                        {/* Video Layer */}
                        <VideoGridWrapper />

                        {/* UI Overlay Layer */}
                        <LivestreamOverlays
                            call={call}
                            role={role}
                            livestreamId={livestreamId}
                            hostProfile={hostProfile}
                            title={title}
                        />
                    </div>
                </LiveLayout>
            </StreamCall>
        </StreamVideo>
    )
}

// Helper components strictly tied to Stream hooks

function VideoGridWrapper() {
    const { useParticipants } = useCallStateHooks()
    const participants = useParticipants()
    return <LivestreamVideoGrid participants={participants} />
}

function AudioRouter({ isViewer }: { isViewer: boolean }) {
    const { useCallEndedAt } = useCallStateHooks()
    const callEndedAt = useCallEndedAt()
    const router = useRouter()

    useEffect(() => {
        if (callEndedAt) router.refresh()
    }, [callEndedAt, router])

    return null
}
