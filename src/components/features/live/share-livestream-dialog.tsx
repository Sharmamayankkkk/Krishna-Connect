"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, Share2, Facebook, Twitter, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ShareLivestreamDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    livestreamId: string
    title: string
}

export function ShareLivestreamDialog({ open, onOpenChange, livestreamId, title }: ShareLivestreamDialogProps) {
    const [copied, setCopied] = useState(false)
    const { toast } = useToast()

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/live/${livestreamId}`
    const shareText = `Watch my livestream: ${title}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast({
                title: 'Link copied!',
                description: 'Share link has been copied to clipboard',
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to copy',
                description: 'Could not copy link to clipboard',
            })
        }
    }

    const handleShare = async (platform?: string) => {
        // Native Web Share API
        if (!platform && navigator.share) {
            try {
                await navigator.share({
                    title: `Check out this livestream: ${title}`,
                    text: shareText,
                    url: shareUrl,
                })
                return
            } catch (error) {
                console.log('Error sharing:', error)
            }
        }

        // Fallback for desktop / manual selection
        const encodedUrl = encodeURIComponent(shareUrl)
        const encodedText = encodeURIComponent(shareText)

        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        }

        if (platform && urls[platform as keyof typeof urls]) {
            window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share Livestream
                    </DialogTitle>
                    <DialogDescription>
                        Invite others to watch your livestream
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Copy Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Share Link</label>
                        <div className="flex gap-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Social Share Buttons */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Share on Social Media</label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                className="flex flex-col gap-2 h-auto py-3"
                                onClick={() => handleShare('facebook')}
                            >
                                <Facebook className="h-5 w-5 text-blue-600" />
                                <span className="text-xs">Facebook</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col gap-2 h-auto py-3"
                                onClick={() => handleShare('twitter')}
                            >
                                <Twitter className="h-5 w-5 text-sky-500" />
                                <span className="text-xs">Twitter</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex flex-col gap-2 h-auto py-3"
                                onClick={() => handleShare('whatsapp')}
                            >
                                <MessageCircle className="h-5 w-5 text-green-600" />
                                <span className="text-xs">WhatsApp</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
