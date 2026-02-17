"use client"

import { useEffect, useState } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useCallStateHooks, ParticipantView, StreamCall } from '@stream-io/video-react-sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, VideoOff, Mic, MicOff, Radio, StopCircle, Users, Loader2, MessageCircle, X, Send } from 'lucide-react'
import { createClient } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/providers/app-provider'
import { cn } from '@/lib/utils'

interface LivestreamHostViewProps {
    livestreamId: string
    callId: string
}

interface ChatMessage {
    id: string
    user_id: string
    message: string
    created_at: string
    profile: {
        name: string
        username: string
        avatar_url: string
    }
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
    const { loggedInUser } = useAppContext()

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isChatOpen, setIsChatOpen] = useState(false)

    // Subscribe to chat messages
    useEffect(() => {
        if (!livestreamId) return

        // Fetch initial messages
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('livestream_chat')
                .select(`
                    *,
                    profile:profiles!livestream_chat_user_id_fkey(name, username, avatar_url)
                `)
                .eq('livestream_id', livestreamId)
                .order('created_at', { ascending: true })
                .limit(100)

            if (data) {
                setChatMessages(data as any)
            }
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`livestream:${livestreamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'livestream_chat',
                    filter: `livestream_id=eq.${livestreamId}`,
                },
                async (payload) => {
                    // Fetch the full message with profile
                    const { data } = await supabase
                        .from('livestream_chat')
                        .select(`
                            *,
                            profile:profiles!livestream_chat_user_id_fkey(name, username, avatar_url)
                        `)
                        .eq('id', payload.new.id)
                        .single()

                    if (data) {
                        setChatMessages((prev) => [...prev, data as any])
                    }
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [livestreamId, supabase])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !loggedInUser) return

        try {
            await supabase.from('livestream_chat').insert({
                livestream_id: livestreamId,
                user_id: loggedInUser.id,
                message: newMessage.trim(),
            })

            setNewMessage('')
        } catch (error) {
            console.error('Failed to send message:', error)
        }
    }

    const handleGoLive = async () => {
        try {
            await call.goLive()

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

            await supabase
                .from('livestreams')
                .update({
                    status: 'ended',
                    ended_at: new Date().toISOString()
                })
                .eq('id', livestreamId)

            router.push('/live')
        } catch (error) {
            console.error('Failed to end stream:', error)
        }
    }

    return (
        <div className="relative flex flex-col lg:flex-row h-full">
            {/* Video Section */}
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
                            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                            </div>
                        ) : (
                            <div className="bg-yellow-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                                BACKSTAGE
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                            <Users className="w-4 h-4" />
                            {participantCount}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-gray-900 border-t border-gray-800 p-4">
                    <div className="flex items-center justify-between gap-3">
                        {/* Left: Camera/Mic Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="lg"
                                variant={isCamEnabled ? 'default' : 'destructive'}
                                onClick={() => isCamEnabled ? camera.disable() : camera.enable()}
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full"
                            >
                                {isCamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                            </Button>

                            <Button
                                size="lg"
                                variant={isMicEnabled ? 'default' : 'destructive'}
                                onClick={() => isMicEnabled ? microphone.disable() : microphone.enable()}
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full"
                            >
                                {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                            </Button>

                            {/* Chat Toggle (Mobile) */}
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full lg:hidden"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Center: Go Live/Stop Button */}
                        <div className="flex-1 flex justify-center">
                            {!isLive ? (
                                <Button
                                    size="lg"
                                    onClick={handleGoLive}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 h-12 md:h-14 rounded-full font-semibold"
                                >
                                    <Radio className="mr-2 h-5 w-5" />
                                    Go Live
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleStopLive}
                                    className="px-6 h-12 md:h-14 rounded-full"
                                >
                                    <StopCircle className="mr-2 h-5 w-5" />
                                    Stop Live
                                </Button>
                            )}
                        </div>

                        {/* Right: End Stream */}
                        <Button
                            size="lg"
                            variant="destructive"
                            onClick={handleEndStream}
                            className="h-12 px-4 md:h-14 md:px-6 rounded-full"
                        >
                            End Stream
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chat Panel */}
            <div
                className={cn(
                    "lg:w-96 lg:border-l lg:border-gray-800 bg-gray-900 flex flex-col",
                    "fixed lg:relative bottom-0 left-0 right-0 z-50",
                    "transition-transform duration-300",
                    isChatOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0",
                    "h-[60vh] lg:h-full"
                )}
            >
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold text-white">Live Chat</h3>
                        <span className="text-sm text-gray-400">({chatMessages.length})</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsChatOpen(false)}
                        className="lg:hidden h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={msg.profile.avatar_url} />
                                    <AvatarFallback>{msg.profile.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-sm text-white truncate">
                                            {msg.profile.name || msg.profile.username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Send a message..."
                            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            maxLength={500}
                        />
                        <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="h-10 w-10 flex-shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
