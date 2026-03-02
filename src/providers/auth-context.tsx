/**
 * @file auth-context.tsx
 * Internal context used between the split provider files.
 * Not consumed by the rest of the app (they use AppContext via useAppContext).
 */

"use client"

import { createContext, useContext } from "react"
import type { User, Chat, DmRequest } from "@/lib/types"
import type { Session, User as AuthUser } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { MutableRefObject } from "react"

export interface AuthContextType {
    session: Session | null
    loggedInUser: User | null
    setLoggedInUser: React.Dispatch<React.SetStateAction<User | null>>
    chats: Chat[]
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>
    sortChats: (chats: Chat[]) => Chat[]
    dmRequests: DmRequest[]
    setDmRequests: React.Dispatch<React.SetStateAction<DmRequest[]>>
    blockedUsers: string[]
    setBlockedUsers: React.Dispatch<React.SetStateAction<string[]>>
    supabaseRef: MutableRefObject<ReturnType<typeof import("@/lib/utils").createClient>>
    isReady: boolean
    refreshProfile: () => Promise<void>
    fetchInitialData: (user: AuthUser) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
    return ctx
}
