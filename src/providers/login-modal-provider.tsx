"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { LoginModal } from "@/components/login-modal"
import { usePathname } from "next/navigation"

interface LoginModalContextType {
    openLoginModal: (options?: { message?: string, redirectUrl?: string }) => void
    closeLoginModal: () => void
    isOpen: boolean
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined)

export function LoginModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState<string | undefined>(undefined)
    const [customRedirect, setCustomRedirect] = useState<string | undefined>(undefined)
    const pathname = usePathname()

    const openLoginModal = useCallback((options?: { message?: string, redirectUrl?: string }) => {
        if (options?.message) setMessage(options.message)
        if (options?.redirectUrl) setCustomRedirect(options.redirectUrl)
        setIsOpen(true)
    }, [])

    const closeLoginModal = useCallback(() => {
        setIsOpen(false)
        // Reset state after closing animation would ideally finish, but immediate is fine for now
        setTimeout(() => {
            setMessage(undefined)
            setCustomRedirect(undefined)
        }, 300)
    }, [])

    return (
        <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal, isOpen }}>
            {children}
            <LoginModal
                open={isOpen}
                onOpenChange={setIsOpen}
                message={message}
                redirectUrl={customRedirect}
            />
        </LoginModalContext.Provider>
    )
}

export function useLoginModal() {
    const context = useContext(LoginModalContext)
    if (context === undefined) {
        throw new Error("useLoginModal must be used within a LoginModalProvider")
    }
    return context
}
