'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Radio, Video } from 'lucide-react'
import Link from 'next/link'

interface ActiveLivestream {
    id: string
    title: string
    status: string
    created_at: string
}

export function MyActiveLivestream() {
    const { loggedInUser } = useAppContext()
    const [livestream, setLivestream] = useState<ActiveLivestream | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!loggedInUser) return

        const fetchActiveLivestream = async () => {
            const { data } = await supabase
                .from('livestreams')
                .select('id, title, status, created_at')
                .eq('host_id', loggedInUser.id)
                .in('status', ['backstage', 'live'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setLivestream(data)
            }
        }

        fetchActiveLivestream()
    }, [loggedInUser])

    if (!livestream) return null

    return (
        <Card className="mb-6 border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Your Active Livestream
                </CardTitle>
                <CardDescription>
                    You have an active livestream in {livestream.status} mode
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <p className="font-medium">{livestream.title}</p>
                        <p className="text-sm text-muted-foreground">
                            Status: <span className="capitalize">{livestream.status}</span>
                        </p>
                    </div>
                    <Link href={`/live/${livestream.id}?host=true`}>
                        <Button className="w-full">
                            <Radio className="mr-2 h-4 w-4" />
                            {livestream.status === 'backstage' ? 'Set Up & Go Live' : 'Manage Stream'}
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
