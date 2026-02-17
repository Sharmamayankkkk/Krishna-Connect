import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppContext } from '@/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Radio, Video, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ActiveLivestream {
    id: string
    title: string
    status: string
    created_at: string
}

export function MyActiveLivestream() {
    const { loggedInUser } = useAppContext()
    const [livestream, setLivestream] = useState<ActiveLivestream | null>(null)
    const [isEnding, setIsEnding] = useState(false)
    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

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

    const handleEndStream = async () => {
        if (!livestream) return

        setIsEnding(true)
        try {
            const { error } = await supabase
                .from('livestreams')
                .update({
                    status: 'ended',
                    ended_at: new Date().toISOString()
                })
                .eq('id', livestream.id)

            if (error) throw error

            toast({
                title: 'Stream Ended',
                description: 'Your livestream has been ended successfully',
            })

            setLivestream(null)
            router.refresh()
        } catch (error) {
            console.error('Failed to end stream:', error)
            toast({
                variant: 'destructive',
                title: 'Failed to End Stream',
                description: 'Could not end the livestream. Please try again.',
            })
        } finally {
            setIsEnding(false)
        }
    }

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
                    <div className="flex gap-2">
                        <Link href={`/live/${livestream.id}?host=true`} className="flex-1">
                            <Button className="w-full">
                                <Radio className="mr-2 h-4 w-4" />
                                {livestream.status === 'backstage' ? 'Set Up & Go Live' : 'Manage Stream'}
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            onClick={handleEndStream}
                            disabled={isEnding}
                            className="flex-shrink-0"
                        >
                            <X className="mr-2 h-4 w-4" />
                            {isEnding ? 'Ending...' : 'End Stream'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
