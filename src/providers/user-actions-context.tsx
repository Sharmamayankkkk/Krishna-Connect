/**
 * @file user-actions-context.tsx
 * Internal context for user action functions.
 */

"use client"

import { createContext, useContext } from "react"
import type { User } from "@/lib/types"

export interface UserActionsContextType {
    updateUser: (updates: Partial<User>) => Promise<void>
    blockUser: (userId: string) => Promise<void>
    unblockUser: (userId: string) => Promise<void>
    reportUser: (reportedUserId: string, reason: string, messageId?: number) => Promise<void>
    sendDmRequest: (toUserId: string, reason: string) => Promise<void>
}

export const UserActionsContext = createContext<UserActionsContextType | undefined>(undefined)

export function useUserActions() {
    const ctx = useContext(UserActionsContext)
    if (!ctx) throw new Error("useUserActions must be used within UserActionsProvider")
    return ctx
}
