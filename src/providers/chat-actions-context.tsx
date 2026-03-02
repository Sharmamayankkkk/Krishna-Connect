/**
 * @file chat-actions-context.tsx
 * Internal context for chat mutation functions.
 */

"use client"

import { createContext, useContext } from "react"
import type { Chat, Message } from "@/lib/types"

export interface ChatActionsContextType {
    addChat: (newChat: Chat) => void
    leaveGroup: (chatId: number) => Promise<void>
    deleteGroup: (chatId: number) => Promise<void>
    resetUnreadCount: (chatId: number) => void
    forwardMessage: (message: Message, chatIds: number[]) => Promise<void>
}

export const ChatActionsContext = createContext<ChatActionsContextType | undefined>(undefined)

export function useChatActions() {
    const ctx = useContext(ChatActionsContext)
    if (!ctx) throw new Error("useChatActions must be used within ChatProvider")
    return ctx
}
