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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden">
            {/* Desktop Backdrop Blur Effect (High-End Mesh Gradient) */}
            <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black z-0" />
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse z-10" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse z-10" style={{ animationDuration: '12s' }} />
                <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-rose-600/10 blur-[100px] rounded-full mix-blend-screen z-10" />
            </div>

            {/* Mobile-Constrained Container (The Phone) */}
            <div
                className={cn(
                    "relative w-full bg-black text-white overflow-hidden touch-none z-20",
                    "h-[100dvh] supports-[height:100dvh]:h-[100dvh] supports-[not(height:100dvh)]:h-[var(--app-height)]",
                    // Desktop Constraints - Mimic a seamless sleek phone screen
                    "md:max-w-[420px] md:h-[90dvh] md:min-h-[700px] md:rounded-[3rem] md:border-[6px] md:border-zinc-800 md:shadow-[0_0_80px_rgba(0,0,0,0.8)] md:ring-1 md:ring-white/10"
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
