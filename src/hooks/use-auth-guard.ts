"use client"

import { useCallback } from "react"
import { useAppContext } from "@/providers/app-provider"
import { useLoginModal } from "@/providers/login-modal-provider"

export function useAuthGuard() {
    const { loggedInUser } = useAppContext()
    const { openLoginModal } = useLoginModal()

    const requireAuth = useCallback(
        (action: () => void, message: string = "Log in to continue") => {
            if (loggedInUser) {
                action()
            } else {
                openLoginModal({ message })
            }
        },
        [loggedInUser, openLoginModal]
    )

    return { requireAuth, isAuthenticated: !!loggedInUser }
}
