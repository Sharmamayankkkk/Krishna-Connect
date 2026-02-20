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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
            {/* Desktop Backdrop Blur Effect (Optional aesthetic) */}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-black to-red-950/20 pointer-events-none" />

            {/* Mobile-Constrained Container */}
            <div
                className={cn(
                    "relative w-full bg-black text-white overflow-hidden touch-none z-10 shadow-2xl",
                    "h-[100dvh] supports-[height:100dvh]:h-[100dvh] supports-[not(height:100dvh)]:h-[var(--app-height)]",
                    // Desktop Constraints - Mimic a phone screen entirely
                    "md:max-w-[420px] md:h-[90dvh] md:rounded-[2.5rem] md:border md:border-white/10 md:ring-8 md:ring-black/50"
                )}
            >
                {/* 
                  Inner relative wrapper is crucial. 
                  All children (VideoGrid, Overlays) use 'absolute inset-0', 
                  which will now safely bind to this constrained container 
                  instead of the entire desktop window!
                */}
                <div className="relative w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    )
}
