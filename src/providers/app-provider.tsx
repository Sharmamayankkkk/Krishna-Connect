/**
 * @file app-provider.tsx — Thin shell (refactored)
 *
 * This file used to be ~534 lines. It is now a simple composition shell.
 * All logic lives in focused sub-providers:
 *   - auth-provider.tsx      → session, loggedInUser, fetchInitialData
 *   - chat-provider.tsx      → chats, addChat, leaveGroup, etc.
 *   - realtime-provider.tsx  → all Supabase channel subscriptions
 *   - user-actions-provider.tsx → blockUser, updateUser, etc.
 *   - app-theme-provider.tsx → themeSettings, updateSettings
 *
 * The public API (AppContext + useAppContext) is unchanged — nothing else in
 * the app needs to change its imports.
 */

"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "./auth-provider"
import { ChatProvider } from "./chat-provider"
import { RealtimeProvider } from "./realtime-provider"
import { UserActionsProvider } from "./user-actions-provider"
import { AppThemeProvider } from "./app-theme-provider"
import { AppContextBridge } from "./app-context-bridge"

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <UserActionsProvider>
          <AppThemeProvider>
            <RealtimeProvider>
              {/* Bridge reads all sub-contexts and exposes the single AppContext
                  that the rest of the app consumes via useAppContext() */}
              <AppContextBridge>
                {children}
              </AppContextBridge>
            </RealtimeProvider>
          </AppThemeProvider>
        </UserActionsProvider>
      </ChatProvider>
    </AuthProvider>
  )
}

// Re-export hook so existing `import { useAppContext } from '@/providers/app-provider'` still works
export { useAppContext } from "./app-context"
