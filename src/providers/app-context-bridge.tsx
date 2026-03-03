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

import { useMemo, type ReactNode } from "react"
import { AppContext } from "./app-context"
import { useAuthContext } from "./auth-context"
import { useChatActions } from "./chat-actions-context"
import { useUserActions } from "./user-actions-context"
import { useThemeActions } from "./theme-actions-context"

const EMPTY_USERS: never[] = []

export function AppContextBridge({ children }: { children: ReactNode }) {
    const auth = useAuthContext()
    const chatActions = useChatActions()
    const userActions = useUserActions()
    const themeActions = useThemeActions()

    const value = useMemo(() => ({
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
        allUsers: EMPTY_USERS,
    }), [
        auth.loggedInUser, auth.isReady, auth.refreshProfile,
        auth.chats, auth.dmRequests, auth.blockedUsers,
        chatActions.addChat, chatActions.leaveGroup, chatActions.deleteGroup,
        chatActions.resetUnreadCount, chatActions.forwardMessage,
        userActions.updateUser, userActions.blockUser, userActions.unblockUser,
        userActions.reportUser, userActions.sendDmRequest,
        themeActions.themeSettings, themeActions.setThemeSettings, themeActions.updateSettings,
    ])

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}
