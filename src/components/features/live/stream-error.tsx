'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

interface StreamErrorProps {
    message?: string
    onRetry?: () => void
}

export function StreamError({ message = 'Unable to connect to the livestream.', onRetry }: StreamErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-black text-white p-6 text-center">
            <div className="bg-red-500/10 p-4 rounded-full mb-6">
                <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Stream Error</h2>
            <p className="text-gray-400 max-w-sm mb-8">
                {message}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                )}

                <Link href="/live" className="w-full">
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <Home className="mr-2 h-4 w-4" />
                        Go to Live Hub
                    </Button>
                </Link>
            </div>
        </div>
    )
}
