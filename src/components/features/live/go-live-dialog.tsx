"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Video, Loader2 } from 'lucide-react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useAppContext } from '@/providers/app-provider'
import { generateCallId, STREAM_CALL_TYPES } from '@/lib/stream-config'
import { createClient } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface GoLiveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function GoLiveDialog({ open, onOpenChange }: GoLiveDialogProps) {
    const { client } = useStreamVideo()
    const { loggedInUser } = useAppContext()
    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [privacy, setPrivacy] = useState<'public' | 'followers'>('public')
    const [isCreating, setIsCreating] = useState(false)

    const handleGoLive = async () => {
        if (!client || !loggedInUser) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to go live',
            })
            return
        }

        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter a title for your livestream',
            })
            return
        }

        try {
            setIsCreating(true)

            // Generate unique call ID for this livestream
            const callId = generateCallId('livestream')

            // Create a livestream call in Stream
            const call = client.call(STREAM_CALL_TYPES.LIVESTREAM, callId)

            // Create the call with backstage mode enabled
            await call.getOrCreate({
                data: {
                    custom: {
                        title,
                        description,
                        privacy,
                    },
                },
            })

            // Save livestream to database
            const { data: livestream, error } = await supabase
                .from('livestreams')
                .insert({
                    stream_call_id: callId,
                    host_id: loggedInUser.id,
                    title,
                    description,
                    status: 'backstage',
                })
                .select()
                .single()

            if (error) {
                throw new Error(error.message)
            }

            // Navigate to the livestream host page
            router.push(`/live/${livestream.id}?host=true`)
            onOpenChange(false)

            toast({
                title: 'Livestream Created!',
                description: 'You can now set up your camera and go live.',
            })
        } catch (error) {
            console.error('Failed to create livestream:', error)
            toast({
                variant: 'destructive',
                title: 'Failed to Create Livestream',
                description: error instanceof Error ? error.message : 'An error occurred',
            })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Go Live
                    </DialogTitle>
                    <DialogDescription>
                        Start a livestream and connect with your audience in real-time
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Stream Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Morning Kirtan Session"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell viewers what your stream is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Privacy</Label>
                        <RadioGroup value={privacy} onValueChange={(value) => setPrivacy(value as 'public' | 'followers')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="public" id="public" />
                                <Label htmlFor="public" className="font-normal cursor-pointer">
                                    Public - Anyone can watch
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="followers" id="followers" />
                                <Label htmlFor="followers" className="font-normal cursor-pointer">
                                    Followers Only - Only your followers can watch
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button onClick={handleGoLive} disabled={isCreating || !title.trim()}>
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Livestream'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
