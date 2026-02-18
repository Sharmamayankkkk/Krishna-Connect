'use client'

import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface LiveLayoutProps {
    children: React.ReactNode
    className?: string
}

export function LiveLayout({ children, className }: LiveLayoutProps) {
    // Lock body scroll when this component is mounted
    useEffect(() => {
        // Prevent scrolling on the body
        document.body.style.overflow = 'hidden'

        // Fix for mobile Safari viewport height
        const setAppHeight = () => {
            const doc = document.documentElement
            doc.style.setProperty('--app-height', `${window.innerHeight}px`)
        }

        window.addEventListener('resize', setAppHeight)
        setAppHeight()

        return () => {
            // Restore scrolling
            document.body.style.overflow = ''
            document.body.style.removeProperty('overflow')
            window.removeEventListener('resize', setAppHeight)
        }
    }, [])

    return (
        <div
            className={cn(
                "fixed inset-0 w-full bg-black text-white overflow-hidden touch-none z-50",
                "h-[100dvh] supports-[height:100dvh]:h-[100dvh] supports-[not(height:100dvh)]:h-[var(--app-height)]",
                className
            )}
        >
            {children}
        </div>
    )
}
