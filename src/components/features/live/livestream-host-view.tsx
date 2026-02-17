"use client"

import { useEffect, useState } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useCallStateHooks, ParticipantView, StreamCall } from '@stream-io/video-react-sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, VideoOff, Mic, MicOff, Radio, StopCircle, Users, Loader2, MessageCircle, X, Send, UserPlus, MonitorUp, Share2 } from 'lucide-react'
import { InviteGuestDialog } from './invite-guest-dialog'
import { ShareLivestreamDialog } from './share-livestream-dialog'
import { ParticipantsModal } from './participants-modal'
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
            <LivestreamHostControls call={call} livestreamId={livestreamId} />
        </StreamCall>
    )
}

function LivestreamHostControls({ call, livestreamId }: { call: any; livestreamId: string }) {
    const {
        useCameraState,
        useMicrophoneState,
        useIsCallLive,
        useParticipantCount,
        useLocalParticipant,
        useRemoteParticipants,
    } = useCallStateHooks()

    const { camera, isEnabled: isCamEnabled } = useCameraState()
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState()
    const isLive = useIsCallLive()
    const participantCount = useParticipantCount()
    const localParticipant = useLocalParticipant()
    const participants = useRemoteParticipants() // Remote participants (guests)

    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()
    const { loggedInUser } = useAppContext()

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isChatOpen, setIsChatOpen] = useState(false)

    // Guest collaboration state
    const [guests, setGuests] = useState<any[]>([])
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)

    // Subscribe to guests
    useEffect(() => {
        if (!livestreamId) return

        const fetchGuests = async () => {
            const { data } = await supabase
                .from('livestream_guests')
                .select('*, profile:profiles!livestream_guests_user_id_fkey(id, name, username, avatar_url)')
                .eq('livestream_id', livestreamId)
                .in('status', ['invited', 'joined'])

            if (data) {
                setGuests(data)
            }
        }

        fetchGuests()

        // Subscribe to guest changes
        const guestChannel = supabase
            .channel(`livestream_guests:${livestreamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'livestream_guests',
                    filter: `livestream_id=eq.${livestreamId}`,
                },
                () => {
                    fetchGuests()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(guestChannel)
        }
    }, [livestreamId, supabase])

    // Subscribe to chat messages
    useEffect(() => {
        if (!livestreamId) return

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

        const chatChannel = supabase
            .channel(`livestream_chat:${livestreamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'livestream_chat',
                    filter: `livestream_id=eq.${livestreamId}`,
                },
                async (payload) => {
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
            supabase.removeChannel(chatChannel)
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
        // Confirm before ending
        if (!confirm('Are you sure you want to end this livestream? This cannot be undone.')) {
            return
        }

        try {
            // Leave the call first
            await call.leave()

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
                description: 'Your livestream has ended successfully',
            })

            // Redirect to discovery page
            router.push('/live')
        } catch (error) {
            console.error('Failed to end stream:', error)
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to end stream. Please try again.',
            })
        }
    }

    // Simplified layout - single column on mobile, side-by-side on desktop
    return (
        <div className="flex flex-col bg-black min-h-[calc(100vh-4rem)] md:min-h-screen">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Video Section */}
                <div className="flex-1 flex flex-col bg-gray-900">
                    {/* Video Preview - Simple single view */}
                    <div className="flex-1 relative">
                        {localParticipant && (
                            <ParticipantView
                                participant={localParticipant}
                                className="w-full h-full"
                            />
                        )}

                        {/* Status Badges - Top Left */}
                        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                            {isLive ? (
                                <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    LIVE
                                </div>
                            ) : (
                                <div className="bg-yellow-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                                    BACKSTAGE
                                </div>
                            )}

                            <button
                                onClick={() => setIsParticipantsModalOpen(true)}
                                className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm shadow-lg hover:bg-black/80 transition-colors cursor-pointer"
                            >
                                <Users className="w-4 h-4" />
                                {participantCount > 0 ? participantCount : 0}
                            </button>
                        </div>

                        {/* Only show INVITED GUESTS as video tiles, not regular viewers */}
                        {guests.filter(g => g.status === 'joined').length > 0 && (
                            <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-10">
                                {participants
                                    .filter(p => guests.some(g => g.status === 'joined'))
                                    .slice(0, 3)
                                    .map((participant) => (
                                        <div key={participant.sessionId} className="w-24 h-32 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
                                            <ParticipantView
                                                participant={participant}
                                                className="w-full h-full"
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Controls Bar - Fixed at bottom */}
                    <div className="bg-gray-900 border-t border-gray-800 p-4">
                        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
                            {/* Left: Camera & Mic Controls */}
                            <div className="flex items-center gap-2">
                                <Button
                                    size="lg"
                                    onClick={() => isCamEnabled ? camera.disable() : camera.enable()}
                                    className={cn(
                                        "h-12 w-12 md:w-auto md:px-4",
                                        isCamEnabled
                                            ? "bg-white/20 hover:bg-white/30 text-white"
                                            : "bg-red-600 hover:bg-red-700 text-white"
                                    )}
                                >
                                    {isCamEnabled ? (
                                        <Video className="h-5 w-5" />
                                    ) : (
                                        <VideoOff className="h-5 w-5" />
                                    )}
                                    <span className="hidden md:inline md:ml-2">
                                        {isCamEnabled ? 'Camera' : 'Camera Off'}
                                    </span>
                                </Button>

                                <Button
                                    size="lg"
                                    onClick={() => isMicEnabled ? microphone.disable() : microphone.enable()}
                                    className={cn(
                                        "h-12 w-12 md:w-auto md:px-4",
                                        isMicEnabled
                                            ? "bg-white/20 hover:bg-white/30 text-white"
                                            : "bg-red-600 hover:bg-red-700 text-white"
                                    )}
                                >
                                    {isMicEnabled ? (
                                        <Mic className="h-5 w-5" />
                                    ) : (
                                        <MicOff className="h-5 w-5" />
                                    )}
                                    <span className="hidden md:inline md:ml-2">
                                        {isMicEnabled ? 'Mic' : 'Mic Off'}
                                    </span>
                                </Button>

                                <Button
                                    size="lg"
                                    onClick={() => call.screenShare.toggle()}
                                    className={cn(
                                        "h-12 w-12 md:w-auto md:px-4",
                                        call.screenShare?.state?.status === 'enabled'
                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                            : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                                    )}
                                >
                                    <MonitorUp className="h-5 w-5" />
                                    <span className="hidden md:inline md:ml-2">
                                        {call.screenShare?.state?.status === 'enabled' ? 'Stop Share' : 'Share Screen'}
                                    </span>
                                </Button>

                                {/* Chat Toggle (Mobile Only) */}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                    className="lg:hidden h-12 w-12 rounded-full"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Center: Go Live / Stop */}
                            <div className="flex items-center gap-2">
                                {!isLive ? (
                                    <Button
                                        size="lg"
                                        onClick={handleGoLive}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6"
                                    >
                                        <Radio className="h-5 w-5 mr-2" />
                                        Go Live
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleStopLive}
                                        className="px-6"
                                    >
                                        Stop Live
                                    </Button>
                                )}
                            </div>

                            {/* Right: Share, Invite & End */}
                            <div className="flex items-center gap-2">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => setIsShareDialogOpen(true)}
                                    className="hidden md:flex h-12"
                                >
                                    <Share2 className="h-5 w-5 mr-2" />
                                    Share
                                </Button>

                                {guests.length < 3 && (
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => setIsInviteDialogOpen(true)}
                                        className="hidden md:flex h-12"
                                    >
                                        <UserPlus className="h-5 w-5 mr-2" />
                                        Invite
                                    </Button>
                                )}

                                <Button
                                    size="lg"
                                    variant="destructive"
                                    onClick={handleEndStream}
                                    className="h-12"
                                >
                                    <StopCircle className="h-5 w-5 md:mr-2" />
                                    <span className="hidden md:inline">End</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Panel - Desktop: sidebar, Mobile: overlay */}
                <div
                    className={cn(
                        "lg:w-96 lg:border-l bg-gray-900 flex flex-col",
                        "fixed lg:relative bottom-0 left-0 right-0 z-50",
                        "transition-transform duration-300",
                        isChatOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0",
                        "h-[70vh] lg:h-full"
                    )}
                >
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-white">Live Chat</h2>
                            <p className="text-xs text-gray-400">{chatMessages.length} messages</p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsChatOpen(false)}
                            className="lg:hidden h-8 w-8 p-0 text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src={msg.profile.avatar_url || '/user_Avatar/male.png'} />
                                        <AvatarFallback>{msg.profile.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-white truncate">{msg.profile.username}</span>
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

            {/* Invite Guest Dialog */}
            <InviteGuestDialog
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
                livestreamId={livestreamId}
                currentGuests={guests.map(g => g.user_id)}
            />

            {/* Share Livestream Dialog */}
            <ShareLivestreamDialog
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
                livestreamId={livestreamId}
                title={call?.state?.custom?.title || 'My Livestream'}
            />

            {/* Participants Modal */}
            <ParticipantsModal
                open={isParticipantsModalOpen}
                onOpenChange={setIsParticipantsModalOpen}
                participants={[]} // TODO: Fetch actual viewer list from database
                viewerCount={participantCount}
            />
        </div>
    )
}
