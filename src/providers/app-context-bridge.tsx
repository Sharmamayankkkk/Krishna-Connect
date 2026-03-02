/**
 * @file app-context-bridge.tsx
 *
 * Reads values from all sub-contexts (auth, chat, userActions, theme)
 * and exposes them through the single AppContext that the rest of the app
 * already uses via useAppContext().
 *
 * This means zero breaking changes — no other file needs to be updated.
 */

"use client"

import type { ReactNode } from "react"
import { AppContext } from "./app-context"
import { useAuthContext } from "./auth-context"
import { useChatActions } from "./chat-actions-context"
import { useUserActions } from "./user-actions-context"
import { useThemeActions } from "./theme-actions-context"

export function AppContextBridge({ children }: { children: ReactNode }) {
    const auth = useAuthContext()
    const chatActions = useChatActions()
    const userActions = useUserActions()
    const themeActions = useThemeActions()

    const value = {
        // Auth
        loggedInUser: auth.loggedInUser,
        isReady: auth.isReady,
        refreshProfile: auth.refreshProfile,
        // Chat state (lives in AuthProvider so it can be shared with RealtimeProvider)
        chats: auth.chats,
        dmRequests: auth.dmRequests,
        blockedUsers: auth.blockedUsers,
        // Chat actions
        addChat: chatActions.addChat,
        leaveGroup: chatActions.leaveGroup,
        deleteGroup: chatActions.deleteGroup,
        resetUnreadCount: chatActions.resetUnreadCount,
        forwardMessage: chatActions.forwardMessage,
        // User actions
        updateUser: userActions.updateUser,
        blockUser: userActions.blockUser,
        unblockUser: userActions.unblockUser,
        reportUser: userActions.reportUser,
        sendDmRequest: userActions.sendDmRequest,
        // Theme
        themeSettings: themeActions.themeSettings,
        setThemeSettings: themeActions.setThemeSettings,
        updateSettings: themeActions.updateSettings,
        // allUsers removed — was causing full profiles table fetch on every login.
        // Components that needed allUsers for chat sender lookup now fetch on demand.
        allUsers: [], // kept for type compatibility; always empty now
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}
