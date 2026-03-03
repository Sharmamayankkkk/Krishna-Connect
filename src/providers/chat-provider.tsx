/**
 * @file chat-provider.tsx
 * Owns: chats, addChat, leaveGroup, deleteGroup, resetUnreadCount, forwardMessage
 */

"use client"

import { useCallback, useMemo, type ReactNode } from "react"
import type { Chat, Message } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "./auth-context"
import { ChatActionsContext } from "./chat-actions-context"

export function ChatProvider({ children }: { children: ReactNode }) {
    const { loggedInUser, chats, setChats, sortChats, supabaseRef } = useAuthContext()
    const { toast } = useToast()

    const addChat = useCallback((newChat: Chat) => {
        setChats((current) => {
            if (current.some((c) => c.id === newChat.id)) return current
            return sortChats([newChat, ...current])
        })
    }, [setChats, sortChats])

    const leaveGroup = useCallback(async (chatId: number) => {
        if (!loggedInUser) return
        const { error } = await supabaseRef.current
            .from("participants")
            .delete()
            .match({ chat_id: chatId, user_id: loggedInUser.id })
        if (error) {
            toast({ variant: "destructive", title: "Error leaving group", description: error.message })
        } else {
            setChats((current) => current.filter((c) => c.id !== chatId))
        }
    }, [loggedInUser, supabaseRef, setChats, toast])

    const deleteGroup = useCallback(async (chatId: number) => {
        const { error } = await supabaseRef.current.from("chats").delete().eq("id", chatId)
        if (error) {
            toast({ variant: "destructive", title: "Error deleting group", description: error.message })
        } else {
            setChats((current) => current.filter((c) => c.id !== chatId))
        }
    }, [supabaseRef, setChats, toast])

    const resetUnreadCount = useCallback((chatId: number) => {
        setChats((current) =>
            current.map((c) => (c.id === chatId && c.unreadCount ? { ...c, unreadCount: 0 } : c))
        )
    }, [setChats])

    const forwardMessage = useCallback(async (message: Message, chatIds: number[]) => {
        if (!loggedInUser) return
        // Sender name is already on the message object's profile field
        const originalSender = (message.profiles as any)?.name || "Unknown User"
        const forwardContent = `Forwarded from **${originalSender}**\n${message.content || ""}`

        try {
            const results = await Promise.all(
                chatIds.map((chatId) =>
                    supabaseRef.current.from("messages").insert({
                        chat_id: chatId,
                        user_id: loggedInUser.id,
                        content: forwardContent,
                        attachment_url: message.attachment_url,
                        attachment_metadata: message.attachment_metadata,
                    })
                )
            )
            const failed = results.filter((r) => r.error)
            toast(failed.length > 0
                ? { variant: "destructive", title: "Some shares failed" }
                : { title: "Message Forwarded!" }
            )
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error Forwarding Message", description: error.message })
        }
    }, [loggedInUser, supabaseRef, toast])

    const chatContextValue = useMemo(() => ({
        addChat, leaveGroup, deleteGroup, resetUnreadCount, forwardMessage,
    }), [addChat, leaveGroup, deleteGroup, resetUnreadCount, forwardMessage])

    return (
        <ChatActionsContext.Provider value={chatContextValue}>
            {children}
        </ChatActionsContext.Provider>
    )
}
