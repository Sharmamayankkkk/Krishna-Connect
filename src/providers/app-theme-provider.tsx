/**
 * @file theme-provider.tsx
 * Owns: themeSettings, setThemeSettings, updateSettings (user-level settings)
 */

"use client"

import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react"
import type { ThemeSettings, UserSettings } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useAuthContext } from "./auth-context"
import { ThemeActionsContext } from "./theme-actions-context"

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
    outgoingBubbleColor: "hsl(221.2 83.2% 53.3%)",
    incomingBubbleColor: "hsl(210 40% 96.1%)",
    usernameColor: "hsl(var(--primary))",
    chatWallpaper: "/chat-bg/light.png",
    wallpaperBrightness: 100,
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const { loggedInUser, setLoggedInUser, supabaseRef } = useAuthContext()
    const { toast } = useToast()
    const { setTheme } = useTheme()

    const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS)

    // Sync from DB when user loads
    useEffect(() => {
        if (loggedInUser?.settings?.chat_preferences) {
            setThemeSettingsState((prev) => ({ ...prev, ...loggedInUser.settings!.chat_preferences }))
        }
        if (loggedInUser?.settings?.theme) {
            setTheme(loggedInUser.settings.theme)
        }
        // Load from localStorage too
        const savedTheme = localStorage.getItem("themeSettings")
        if (savedTheme) {
            try {
                setThemeSettingsState((prev) => ({ ...prev, ...JSON.parse(savedTheme) }))
            } catch { }
        }
    }, [loggedInUser?.id, setTheme]) // intentionally only re-run when user identity changes

    const setThemeSettings = useCallback(async (newSettings: Partial<ThemeSettings>) => {
        const updated = { ...themeSettings, ...newSettings }
        setThemeSettingsState(updated)
        localStorage.setItem("themeSettings", JSON.stringify(updated))

        if (loggedInUser) {
            const currentSettings = loggedInUser.settings || {}
            const finalSettings = { ...currentSettings, chat_preferences: { ...currentSettings.chat_preferences, ...newSettings } as any }
            setLoggedInUser((prev) => (prev ? { ...prev, settings: finalSettings } : null))
            supabaseRef.current.from("profiles").update({ settings: finalSettings }).eq("id", loggedInUser.id).then(({ error }) => {
                if (error) console.error("Failed to persist theme settings", error)
            })
        }

        toast({ title: "Theme settings updated." })
    }, [loggedInUser, themeSettings, setLoggedInUser, supabaseRef, toast])

    const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
        if (!loggedInUser) return
        const updatedSettings = { ...(loggedInUser.settings || {}), ...newSettings }
        setLoggedInUser((prev) => (prev ? { ...prev, settings: updatedSettings } : null))
        if (newSettings.theme) setTheme(newSettings.theme)

        const { error } = await supabaseRef.current
            .from("profiles")
            .update({ settings: updatedSettings })
            .eq("id", loggedInUser.id)

        if (error) {
            console.error("Failed to persist settings:", error)
            toast({ variant: "destructive", title: "Failed to save settings" })
        }
    }, [loggedInUser, setLoggedInUser, supabaseRef, setTheme, toast])

    const themeContextValue = useMemo(() => ({
        themeSettings, setThemeSettings, updateSettings,
    }), [themeSettings, setThemeSettings, updateSettings])

    return (
        <ThemeActionsContext.Provider value={themeContextValue}>
            {children}
        </ThemeActionsContext.Provider>
    )
}
