'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Video, Film, PenTool, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppContext } from '@/providers/app-provider'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { CreatePost } from '@/components/features/posts/create-post'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function MobileFab() {
    const [isOpen, setIsOpen] = useState(false)
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
    const { loggedInUser } = useAppContext()
    const router = useRouter()
    const pathname = usePathname()
    const { requireAuth } = useAuthGuard()
    const menuRef = useRef<HTMLDivElement>(null)

    const { toast } = useToast()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedLeelaFile, setSelectedLeelaFile] = useState<File | null>(null)
    const [leelaCaption, setLeelaCaption] = useState('')
    const [isLeelaDialogOpen, setIsLeelaDialogOpen] = useState(false)

    const handleLeelaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !loggedInUser) return

        if (!file.type.startsWith('video/')) {
            toast({ title: 'Only video files are allowed', variant: 'destructive' })
            return
        }
        if (file.size > 50 * 1024 * 1024) {
            toast({ title: 'Video must be under 50MB', variant: 'destructive' })
            return
        }

        setSelectedLeelaFile(file)
        setLeelaCaption('')
        setIsLeelaDialogOpen(true)
    }

    const handleLeelaUploadConfirm = async () => {
        if (!selectedLeelaFile || !loggedInUser) return

        setIsLeelaDialogOpen(false)
        setIsUploading(true)
        try {
            const ext = selectedLeelaFile.name.includes('.') ? selectedLeelaFile.name.substring(selectedLeelaFile.name.lastIndexOf('.') + 1) : 'mp4'
            const filePath = `leela/${loggedInUser.id}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('leela').upload(filePath, selectedLeelaFile)
            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('leela').getPublicUrl(filePath)

            const { error: insertError } = await supabase.from('leela_videos').insert({
                user_id: loggedInUser.id,
                video_url: urlData.publicUrl,
                caption: leelaCaption.trim() || null,
            })

            if (insertError) throw insertError

            toast({ title: 'Leela uploaded successfully!' })
            router.push('/leela')
        } catch (err: any) {
            toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
        } finally {
            setIsUploading(false)
            setSelectedLeelaFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const toggleOpen = () => setIsOpen(!isOpen)
    const closeMenu = () => setIsOpen(false)

    // Close menu when clicking outside — must be ABOVE the early return to satisfy Rules of Hooks
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeMenu()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Hide FAB on certain routes like chats or full-screen players
    const hideOnRoutes = /^(\/chat\/\d+|\/live\/.+)/
    if (hideOnRoutes.test(pathname)) return null

    const actions = [
        {
            label: 'Go Live',
            icon: <Video className="h-5 w-5" />,
            onClick: () => {
                closeMenu()
                requireAuth(() => {
                    router.push('/live')
                })
            },
            delay: 'delay-75'
        },
        {
            label: 'Leela',
            icon: <Film className="h-5 w-5" />,
            onClick: () => {
                closeMenu()
                requireAuth(() => {
                    fileInputRef.current?.click()
                })
            },
            delay: 'delay-100'
        },
        {
            label: 'Post',
            icon: <PenTool className="h-5 w-5" />, // Use feather icon roughly
            onClick: () => {
                closeMenu()
                requireAuth(() => {
                    setIsCreatePostOpen(true)
                })
            },
            delay: 'delay-200'
        }
    ]

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleLeelaSelect}
            />

            <Dialog open={isLeelaDialogOpen} onOpenChange={(open) => {
                setIsLeelaDialogOpen(open);
                if (!open) {
                    setSelectedLeelaFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Image src="/icons/leela.png" alt="Leela" width={20} height={20} />
                            Upload Leela
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLeelaFile && (
                        <div className="py-2 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Selected: <span className="font-semibold text-foreground truncate block">{selectedLeelaFile.name}</span>
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="fab-leela-caption">Caption <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <textarea
                                    id="fab-leela-caption"
                                    value={leelaCaption}
                                    onChange={(e) => setLeelaCaption(e.target.value)}
                                    placeholder="Write a caption for your Leela..."
                                    className="w-full min-h-[100px] p-3 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                                    maxLength={200}
                                />
                                <div className="text-right text-xs text-muted-foreground">
                                    {leelaCaption.length}/200
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            setIsLeelaDialogOpen(false);
                            setSelectedLeelaFile(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleLeelaUploadConfirm} disabled={isUploading}>
                            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Post Leela'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div
                ref={menuRef}
                className="md:hidden fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-3"
            >
                {/* Overlay when open */}
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[-1]"
                        onClick={closeMenu}
                    />
                )}

                {/* Action Buttons */}
                <div className="flex flex-col items-end gap-3 mb-2">
                    {actions.map((action, index) => (
                        <div
                            key={action.label}
                            className={cn(
                                "flex items-center gap-3 transition-all duration-300 ease-in-out origin-bottom-right",
                                isOpen
                                    ? `opacity-100 scale-100 translate-y-0 ${action.delay}`
                                    : "opacity-0 scale-50 translate-y-10 pointer-events-none"
                            )}
                        >
                            <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-border">
                                {action.label}
                            </span>
                            <button
                                onClick={action.onClick}
                                className="h-12 w-12 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-primary hover:bg-muted transition-colors"
                                aria-label={action.label}
                            >
                                {action.icon}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Main FAB Toggle */}
                <button
                    onClick={toggleOpen}
                    className={cn(
                        "h-[52px] w-[52px] rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95",
                        isOpen && "rotate-45"
                    )}
                    aria-label={isOpen ? "Close menu" : "Create new"}
                >
                    <Plus className="h-[22px] w-[22px]" strokeWidth={2.5} />
                </button>
            </div>

            {/* Shared Create Post Modal for the FAB */}
            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <DialogTitle className="sr-only">Create Post</DialogTitle>
                    <DialogDescription className="sr-only">Create a new post</DialogDescription>
                    <div className="bg-background border rounded-lg shadow-xl overflow-hidden mt-8 md:mt-0">
                        <CreatePost
                            onPostCreated={() => {
                                setIsCreatePostOpen(false)
                                router.refresh()
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}