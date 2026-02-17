'use client'

import { useStreamVideo } from '@/providers/stream-video-provider'
import { useAppContext } from '@/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function StreamDebugPage() {
    const { client, isLoading } = useStreamVideo()
    const { loggedInUser } = useAppContext()

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
    const hasApiKey = !!apiKey

    return (
        <div className="container max-w-2xl mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Stream SDK Debug Info</CardTitle>
                    <CardDescription>Check if Stream SDK is properly configured</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* API Key Check */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">API Key Configured</p>
                            <p className="text-sm text-muted-foreground">
                                {hasApiKey ? `Key: ${apiKey?.substring(0, 8)}...` : 'Not set'}
                            </p>
                        </div>
                        {hasApiKey ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                        )}
                    </div>

                    {/* User Check */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">User Logged In</p>
                            <p className="text-sm text-muted-foreground">
                                {loggedInUser ? `${loggedInUser.username}` : 'Not logged in'}
                            </p>
                        </div>
                        {loggedInUser ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                        )}
                    </div>

                    {/* Client Loading Check */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Stream Client Loading</p>
                            <p className="text-sm text-muted-foreground">
                                {isLoading ? 'Initializing...' : 'Complete'}
                            </p>
                        </div>
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        ) : (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                    </div>

                    {/* Client Initialized Check */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Stream Client Initialized</p>
                            <p className="text-sm text-muted-foreground">
                                {client ? 'Client ready' : 'Not initialized'}
                            </p>
                        </div>
                        {client ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                        )}
                    </div>

                    {/* Environment Variables */}
                    <div className="p-4 border rounded-lg space-y-2">
                        <p className="font-medium">Environment Variables</p>
                        <div className="text-sm space-y-1 font-mono bg-muted p-3 rounded">
                            <div>NEXT_PUBLIC_STREAM_API_KEY: {apiKey || 'undefined'}</div>
                            <div>Has Client: {client ? 'true' : 'false'}</div>
                            <div>Is Loading: {isLoading ? 'true' : 'false'}</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                        >
                            Reload Page
                        </Button>
                        <Button
                            onClick={() => console.log({ client, apiKey, loggedInUser })}
                            variant="outline"
                        >
                            Log to Console
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
