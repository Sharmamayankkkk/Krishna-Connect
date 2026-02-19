'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Radio, Loader2, Globe, Users, Wand2, X } from 'lucide-react'
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
    const [step, setStep] = useState<1 | 2>(1) // Step 1: Details, Step 2: (Optional) Pre-flight check

    const handleGoLive = async () => {
        if (!client || !loggedInUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Login required.' })
            return
        }
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Required', description: 'Please enter a title.' })
            return
        }

        try {
            setIsCreating(true)
            const callId = generateCallId('livestream')
            const call = client.call(STREAM_CALL_TYPES.LIVESTREAM, callId)

            await call.getOrCreate({
                data: { custom: { title, description, privacy } }
            })

            const { error } = await supabase.from('livestreams').insert({
                stream_call_id: callId,
                host_id: loggedInUser.id,
                title,
                description,
                status: 'backstage',
            })

            if (error) throw error

            router.push(`/live/${callId}?host=true`) // Use callId as ID for simplicity or fetch proper ID
            onOpenChange(false)
            toast({ title: 'Studio Ready', description: 'Setting up your stream...' })
        } catch (error) {
            console.error(error)
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create stream.' })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose className="sm:max-w-[480px] p-0 border-none bg-background text-foreground overflow-hidden shadow-2xl" aria-describedby="go-live-desc">
                {/* Accessibility: Hidden Description */}
                <div id="go-live-desc" className="sr-only">
                    Configure your livestream details including title, description and privacy settings before going live.
                </div>
                {/* Header Graphic */}
                <div className="relative h-32 bg-gradient-to-br from-red-600 via-pink-600 to-purple-800 p-6 flex flex-col justify-end">
                    <div className="absolute top-4 right-4">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <Radio className="h-6 w-6 animate-pulse" />
                            Go Live
                        </DialogTitle>
                        <p className="text-white/80 text-sm mt-1">Setup your stream details</p>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Stream Title <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="title"
                                placeholder="What's on your mind?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-muted border-transparent focus:border-red-500 focus:bg-background text-foreground placeholder:text-muted-foreground pl-10 h-12 text-base transition-all"
                            />
                            <Wand2 className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Tell your viewers more..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-muted border-transparent focus:border-red-500 focus:bg-background text-foreground placeholder:text-muted-foreground resize-none min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Audience
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPrivacy('public')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                                    privacy === 'public'
                                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                        : "border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted"
                                )}
                            >
                                <Globe className="h-6 w-6 mb-2" />
                                <span className="text-sm font-medium">Public</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPrivacy('followers')}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                                    privacy === 'followers'
                                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                        : "border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted"
                                )}
                            >
                                <Users className="h-6 w-6 mb-2" />
                                <span className="text-sm font-medium">Followers</span>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleGoLive}
                            disabled={isCreating || !title.trim()}
                            className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Studio...
                                </>
                            ) : (
                                'Enter Studio'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
