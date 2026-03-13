'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/providers/app-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useTranslation } from 'react-i18next';

interface LiveChatProps {
    livestreamId: string
    isOverlay?: boolean
    actionButtons?: React.ReactNode
}

interface ChatMessage {
    id: string
    user_id: string
    message: string
    created_at: string
    user: {
        username: string
        name: string
        avatar_url: string | null
    }
}

export function LiveChat({ livestreamId, isOverlay = false, actionButtons }: LiveChatProps) {
  const { t } = useTranslation();

    const { loggedInUser } = useAppContext()
    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [hearts, setHearts] = useState<{ id: number; left: string; animationDuration: string }[]>([])

    const addHeart = () => {
        const id = Date.now()
        // Randomize horizontal position around the button
        const left = `calc(85% + ${Math.random() * 20 - 10}px)`
        const animationDuration = `${Math.random() * 1.5 + 1}s`

        setHearts(prev => [...prev, { id, left, animationDuration }])
    }

    const removeHeart = (id: number) => {
        setHearts(prev => prev.filter(heart => heart.id !== id))
    }

    // Fetch and subscribe logic (Same as before, simplified for brevity)
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('livestream_chat')
                .select('*, user:profiles!livestream_chat_user_id_fkey(username, name, avatar_url)')
                .eq('livestream_id', livestreamId)
                .order('created_at', { ascending: true })
                .limit(50)

            if (data) setMessages(data as any)
        }

        fetchMessages()

        const channel = supabase.channel(`chat:${livestreamId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'livestream_chat', filter: `livestream_id=eq.${livestreamId}` },
                async (payload) => {
                    const { data } = await supabase.from('livestream_chat').select('*, user:profiles!livestream_chat_user_id_fkey(username, name, avatar_url)').eq('id', payload.new.id).single()
                    if (data) setMessages(prev => [...prev, data as any])
                })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [livestreamId, supabase])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !loggedInUser) return

        const text = newMessage.trim()
        setNewMessage('') // Optimistic clear

        await supabase.from('livestream_chat').insert({
            livestream_id: livestreamId,
            user_id: loggedInUser.id,
            message: text
        })
    }

    return (
        <div className={cn(
            "flex flex-col h-full pointer-events-auto",
            isOverlay ? "" : "bg-black border-l border-white/10"
        )}>
            {/* Messages Area - Faded Mask for Overlay */}
            <div
                className={cn(
                    "flex-1 overflow-y-auto px-1 pb-2 scrollbar-hide mask-image-gradient",
                    isOverlay ? "h-[300px] md:h-[400px]" : "h-full"
                )}
                ref={scrollRef}
                style={{
                    maskImage: isOverlay ? 'linear-gradient(to bottom, transparent, black 20%)' : 'none'
                }}
            >
                <div className="space-y-3 pt-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <Avatar className="h-6 w-6 ring-1 ring-white/20">
                                <AvatarImage src={msg.user.avatar_url || ''} />
                                <AvatarFallback className="text-[10px]">{msg.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start max-w-[85%]">
                                <span className="text-[11px] font-bold text-gray-300 px-1">
                                    {msg.user.username}
                                </span>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-2xl text-[13px] text-white shadow-sm break-words",
                                    isOverlay
                                        ? "bg-black/40 backdrop-blur-sm border border-white/5"
                                        : "bg-gray-800"
                                )}>
                                    {msg.message}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Hearts Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                {hearts.map(heart => (
                    <div
                        key={heart.id}
                        className="absolute bottom-12 right-6 animate-float-up text-red-500"
                        style={{
                            left: heart.left,
                            animationDuration: heart.animationDuration,
                            opacity: 0
                        }}
                        onAnimationEnd={() => removeHeart(heart.id)}
                    >
                        <Heart className="fill-current w-8 h-8" />
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className={cn("p-2 w-full relative z-10", isOverlay ? "px-0 pb-0" : "")}>
                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('dialogs.addComment')}
                            className={cn(
                                "pr-10 h-11 w-full rounded-full border border-white/10 text-white placeholder:text-white/70 focus:ring-0 focus:border-white/30 transition-all shadow-lg",
                                // IMPORTANT: text-base prevents iOS zoom
                                "text-base outline-none",
                                isOverlay ? "bg-black/30 backdrop-blur-xl" : "bg-gray-900"
                            )}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            disabled={!newMessage.trim()}
                            className={cn(
                                "absolute right-1 top-1 h-9 w-9 rounded-full text-white hover:bg-white/10 transition-colors",
                                !newMessage.trim() && "opacity-0 scale-75 pointer-events-none"
                            )}
                        >
                            <Send className="h-4 w-4 fill-current" />
                        </Button>
                    </div>

                    {isOverlay && (
                        <Button
                            type="button" // Prevent form submission
                            size="icon"
                            onClick={addHeart}
                            className="h-10 w-10 shrink-0 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-400 shadow-lg active:scale-90 transition-all"
                        >
                            <Heart className="h-5 w-5 fill-current" />
                        </Button>
                    )}

                    {/* External Actions (Camera, Mic, Share, etc.) aligned horizontally! */}
                    {actionButtons && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            {actionButtons}
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
}
