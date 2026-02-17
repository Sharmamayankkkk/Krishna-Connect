"use client"

import { useEffect, useState, useRef } from 'react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useCallStateHooks, ParticipantView } from '@stream-io/video-react-sdk'
import { Radio, Users, Send, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/providers/app-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LivestreamViewerViewProps {
    livestreamId: string
    callId: string
    hostName: string
    title: string
}

interface ChatMessage {
    id: string
    livestream_id: string
    user_id: string
    message: string
    created_at: string
    user: {
        username: string
        name: string
        avatar_url: string | null
    }
}

export function LivestreamViewerView({ livestreamId, callId, hostName, title }: LivestreamViewerViewProps) {
    const { client } = useStreamVideo()
    const { toast } = useToast()

    const [call, setCall] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize call
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
        <div className="flex flex-col lg:flex-row h-screen bg-black text-white">
            <LivestreamPlayer call={call} title={title} hostName={hostName} />
            <LivestreamChat livestreamId={livestreamId} />
        </div>
    )
}

function LivestreamPlayer({ call, title, hostName }: { call: any; title: string; hostName: string }) {
    const { useParticipantCount, useIsCallLive, useParticipants } = useCallStateHooks()

    const participantCount = useParticipantCount()
    const isLive = useIsCallLive()
    const participants = useParticipants()

    // Get the host (first participant, usually the broadcaster)
    const hostParticipant = participants.find(p => !p.isLocalParticipant)

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 relative">
            <div className="aspect-video bg-black w-full flex items-center justify-center relative">
                {hostParticipant ? (
                    <ParticipantView
                        participant={hostParticipant}
                        className="w-full h-full"
                    />
                ) : (
                    <div className="text-muted-foreground">
                        {isLive ? 'Loading stream...' : 'Stream is in backstage mode'}
                    </div>
                )}
            </div>

            {/* Live Badge */}
            <div className="absolute top-4 left-4 p-4">
                {isLive ? (
                    <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-md">
                        <Radio className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-semibold">LIVE</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-yellow-600 px-3 py-1.5 rounded-md">
                        <span className="text-sm font-semibold">BACKSTAGE</span>
                    </div>
                )}
            </div>

            {/* Viewer Count */}
            {isLive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{participantCount - 1}</span>
                </div>
            )}

            {/* Stream Info */}
            <div className="w-full p-4 bg-background text-foreground">
                <h1 className="text-xl font-bold mb-1">{title}</h1>
                <p className="text-sm text-muted-foreground">{hostName}</p>
            </div>
        </div>
    )
}

function LivestreamChat({ livestreamId }: { livestreamId: string }) {
    const { loggedInUser } = useAppContext()
    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    // Fetch and subscribe to chat messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('livestream_chat')
                .select(`
                    id,
                    livestream_id,
                    user_id,
                    message,
                    created_at,
                    user:profiles!livestream_chat_user_id_fkey(
                        username,
                        name,
                        avatar_url
                    )
                `)
                .eq('livestream_id', livestreamId)
                .order('created_at', { ascending: true })
                .limit(100)

            if (!error && data) {
                setMessages(data as any)
            }
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`livestream_chat:${livestreamId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'livestream_chat',
                filter: `livestream_id=eq.${livestreamId}`
            }, (payload) => {
                // Fetch the new message with user data
                supabase
                    .from('livestream_chat')
                    .select(`
                        id,
                        livestream_id,
                        user_id,
                        message,
                        created_at,
                        user:profiles!livestream_chat_user_id_fkey(
                            username,
                            name,
                            avatar_url
                        )
                    `)
                    .eq('id', payload.new.id)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                            setMessages(prev => [...prev, data as any])
                        }
                    })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [livestreamId])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newMessage.trim() || !loggedInUser) return

        setIsSending(true)
        try {
            await supabase
                .from('livestream_chat')
                .insert({
                    livestream_id: livestreamId,
                    user_id: loggedInUser.id,
                    message: newMessage.trim()
                })

            setNewMessage('')
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="w-full lg:w-96 bg-background text-foreground flex flex-col border-l">
            {/* Chat Header */}
            <div className="p-4 border-b">
                <h2 className="font-semibold">Live Chat</h2>
                <p className="text-xs text-muted-foreground">{messages.length} messages</p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={msg.user.avatar_url || '/user_Avatar/male.png'} />
                                <AvatarFallback>{msg.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium">{msg.user.username}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm break-words">{msg.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
                {loggedInUser ? (
                    <div className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Send a message..."
                            disabled={isSending}
                            maxLength={500}
                        />
                        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">
                        Log in to chat
                    </p>
                )}
            </form>
        </div>
    )
}
