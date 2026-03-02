/**
 * @file theme-actions-context.tsx
 * Internal context for theme/settings action functions.
 */

"use client"

import { createContext, useContext } from "react"
import type { ThemeSettings, UserSettings } from "@/lib/types"

export interface ThemeActionsContextType {
    themeSettings: ThemeSettings
    setThemeSettings: (newSettings: Partial<ThemeSettings>) => Promise<void>
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>
}

export const ThemeActionsContext = createContext<ThemeActionsContextType | undefined>(undefined)

export function useThemeActions() {
    const ctx = useContext(ThemeActionsContext)
    if (!ctx) throw new Error("useThemeActions must be used within AppThemeProvider")
    return ctx
}
