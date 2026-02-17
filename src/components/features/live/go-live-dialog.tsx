"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Radio, Loader2, Globe, Users, Sparkles } from 'lucide-react'
import { useStreamVideo } from '@/providers/stream-video-provider'
import { useAppContext } from '@/providers/app-provider'
import { generateCallId, STREAM_CALL_TYPES } from '@/lib/stream-config'
import { createClient } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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
            <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
                {/* Premium gradient header */}
                <div className="relative bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 p-6 text-white overflow-hidden">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
                    </div>

                    <div className="relative">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-white text-2xl">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50 animate-pulse" />
                                    <Radio className="relative h-6 w-6" />
                                </div>
                                <span>Go Live</span>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-white/90 text-base">
                                Start a livestream and connect with your audience in real-time
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Form content */}
                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-red-500" />
                            Stream Title *
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g., Morning Kirtan Session"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            className="h-11 text-base border-2 focus:border-red-500 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold">
                            Description (Optional)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Tell viewers what your stream is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={500}
                            className="resize-none border-2 focus:border-red-500 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Privacy</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPrivacy('public')}
                                className={cn(
                                    "relative p-4 rounded-lg border-2 transition-all duration-200 text-left group",
                                    privacy === 'public'
                                        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                        : "border-border hover:border-red-300 hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        privacy === 'public' ? "bg-red-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-red-100 group-hover:text-red-500"
                                    )}>
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm mb-1">Public</p>
                                        <p className="text-xs text-muted-foreground">Anyone can watch</p>
                                    </div>
                                </div>
                                {privacy === 'public' && (
                                    <div className="absolute top-2 right-2">
                                        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setPrivacy('followers')}
                                className={cn(
                                    "relative p-4 rounded-lg border-2 transition-all duration-200 text-left group",
                                    privacy === 'followers'
                                        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                        : "border-border hover:border-red-300 hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        privacy === 'followers' ? "bg-red-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-red-100 group-hover:text-red-500"
                                    )}>
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm mb-1">Followers</p>
                                        <p className="text-xs text-muted-foreground">Only followers</p>
                                    </div>
                                </div>
                                {privacy === 'followers' && (
                                    <div className="absolute top-2 right-2">
                                        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isCreating}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGoLive}
                        disabled={isCreating || !title.trim()}
                        className="flex-1 relative bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <span className="relative flex items-center gap-2">
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Radio className="h-4 w-4" />
                                    Create Livestream
                                </>
                            )}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
