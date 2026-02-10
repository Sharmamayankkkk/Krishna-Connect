'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'
import { Video, Gift, Trophy } from 'lucide-react'

export default function LeelaPage() {
    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="flex items-center gap-3 border-b p-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl font-bold">Leela</h1>
            </header>

            {/* Coming Soon Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md text-center space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <Image
                                src="/icons/leela.png"
                                alt="Leela"
                                width={120}
                                height={120}
                                className="opacity-80"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                COMING SOON
                            </div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold">Leela is Coming Soon!</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Something special is coming to Krishna Connect... Can you guess what <span className="font-semibold text-foreground">Leela</span> will be?
                        </p>
                        <div className="bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg p-4">
                            <p className="text-sm text-center text-muted-foreground italic">
                                🤔 A new way to experience the community... but how?
                            </p>
                        </div>
                    </div>

                    {/* Contest Section */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-lg p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Gift className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-bold">Win a Free Verified Badge!</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Can you guess what <span className="font-semibold text-foreground">Leela</span> will be? Share your prediction and be part of the excitement!
                        </p>
                        <div className="bg-background/80 rounded-md p-3 space-y-2 text-sm">
                            <p className="font-medium">How to participate:</p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                                <li>Create a post with your guess about Leela</li>
                                <li>Tag <span className="font-mono text-primary">@krishnaConnect</span></li>
                                <li>Share why you think it's that!</li>
                            </ol>
                        </div>
                        <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
                            <p className="text-sm font-semibold text-center flex items-center justify-center gap-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                <span>Best post + Most accurate guess = <span className="text-primary">1 Week Free Verified Badge!</span></span>
                            </p>
                        </div>
                    </div>

                    {/* Mysterious Hints Section - Blurred */}
                    <div className="relative">
                        <div className="absolute inset-0 backdrop-blur-md bg-background/30 z-10 rounded-lg flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <p className="text-sm font-semibold">🔒 Hints Hidden</p>
                                <p className="text-xs text-muted-foreground">Make your guess first!</p>
                            </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm text-left blur-sm pointer-events-none select-none">
                            <div className="flex items-start gap-2">
                                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">████████ █████ ████</p>
                                    <p className="text-muted-foreground text-xs">█████ ███████ █████████ ███████</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">█████ & █████████</p>
                                    <p className="text-muted-foreground text-xs">█████ █████████ ███████</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">█████████ ███████</p>
                                    <p className="text-muted-foreground text-xs">█████ ████ ██████████ ███████</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                        We're working hard to bring this feature to you. Stay tuned!
                    </p>
                </div>
            </div>
        </div>
    )
}
