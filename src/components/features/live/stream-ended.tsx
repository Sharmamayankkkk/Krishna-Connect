'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Radio, Home, Search } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface StreamEndedProps {
    title: string
    hostName: string
    hostAvatar: string | null
    endedAt: string | null
}

export function StreamEnded({ title, hostName, hostAvatar, endedAt }: StreamEndedProps) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-4">
            <Card className="max-w-md w-full border-2">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full blur-xl opacity-20" />
                            <div className="relative p-6 rounded-full bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20">
                                <Radio className="h-12 w-12 text-gray-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <CardTitle className="text-2xl mb-2">Stream Ended</CardTitle>
                        <CardDescription className="text-base">
                            This livestream has ended
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Stream Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={hostAvatar || undefined} />
                                <AvatarFallback>{hostName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{title}</p>
                                <p className="text-sm text-muted-foreground">by {hostName}</p>
                            </div>
                        </div>

                        {endedAt && (
                            <p className="text-sm text-center text-muted-foreground">
                                Ended {formatDistanceToNow(new Date(endedAt), { addSuffix: true })}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <Link href="/live" className="block">
                            <Button className="w-full" size="lg">
                                <Search className="mr-2 h-4 w-4" />
                                Discover Live Streams
                            </Button>
                        </Link>
                        <Link href="/" className="block">
                            <Button variant="outline" className="w-full" size="lg">
                                <Home className="mr-2 h-4 w-4" />
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
