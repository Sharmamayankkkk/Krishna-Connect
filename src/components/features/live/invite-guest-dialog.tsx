"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/utils'
import { useAppContext } from '@/providers/app-provider'
import { useToast } from '@/hooks/use-toast'
import { getAvatarUrl } from '@/lib/utils'

interface InviteGuestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    livestreamId: string
    currentGuests: string[] // Array of user IDs already invited/joined
}

export function InviteGuestDialog({ open, onOpenChange, livestreamId, currentGuests }: InviteGuestDialogProps) {
    const { allUsers, loggedInUser } = useAppContext()
    const { toast } = useToast()
    const supabase = createClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [inviting, setInviting] = useState<string | null>(null)

    // Filter users: exclude self, current guests, and match search
    const availableUsers = allUsers.filter(user => {
        if (!loggedInUser || user.id === loggedInUser.id) return false
        if (currentGuests.includes(user.id)) return false

        const query = searchQuery.toLowerCase()
        return (
            user.name?.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query)
        )
    })

    const handleInvite = async (userId: string) => {
        if (!loggedInUser) return
        setInviting(userId)
        try {
            const { inviteGuestToLivestream } = await import('@/actions/stream')
            const result = await inviteGuestToLivestream(livestreamId, userId)

            if (!result.success) {
                throw new Error(result.error)
            }

            toast({
                title: 'Guest Invited',
                description: 'The user has been invited to join your livestream as a co-host',
            })

            onOpenChange(false)
        } catch (error) {
            console.error('Failed to invite guest:', error)
            toast({
                variant: 'destructive',
                title: 'Failed to Invite',
                description: 'Could not invite the user. Please try again.',
            })
        } finally {
            setInviting(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
                FIX 1: Removed `overflow-hidden` from DialogContent — it was clipping 
                the scrollbar area and causing the right edge of buttons to be cut off.
            */}
            <DialogContent className="w-[90vw] max-w-[400px] sm:max-w-[425px] flex flex-col max-h-[85vh] p-0 bg-background">
                <DialogHeader className="p-4 sm:p-6 pb-2 shrink-0">
                    <DialogTitle>Invite Guest Co-Host</DialogTitle>
                    <DialogDescription>
                        Invite up to 3 guests to join your livestream as co-hosts
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-b-lg">
                    {/* Search */}
                    <div className="relative px-4 sm:px-6 pb-3 shrink-0">
                        <Search className="absolute left-7 sm:left-9 top-1/2 -translate-y-[12px] h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-muted/50 border-transparent focus:bg-background"
                        />
                    </div>

                    {/* 
                        FIX 2: ScrollArea now has explicit height via flex-1. 
                        Inner content uses `pr-4` to add right padding so the 
                        invite buttons are never hidden behind the scrollbar. 
                    */}
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="space-y-1 px-4 sm:px-6 pr-5 sm:pr-7 pb-4">
                            {availableUsers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    {searchQuery ? 'No users found' : 'No available users to invite'}
                                </p>
                            ) : (
                                availableUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-muted/50"
                                    >
                                        <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                                            <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                {user.name?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* 
                                            FIX 3: `min-w-0` on the text container ensures it 
                                            shrinks properly, giving the button guaranteed space.
                                        */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate leading-none mb-1">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>

                                        {/* 
                                            FIX 4: Removed `hidden sm:inline-block` from the 
                                            button label — the label was hidden at narrow widths,
                                            causing an icon-only button that looked broken. 
                                            Always show the label inside a dialog.
                                        */}
                                        <Button
                                            size="sm"
                                            onClick={() => handleInvite(user.id)}
                                            disabled={!!inviting}
                                            className="shrink-0 h-9 rounded-full px-4 text-sm shadow-sm gap-1.5"
                                        >
                                            {inviting === user.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="h-4 w-4" />
                                                    <span>Invite</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Guest Limit Info */}
                    <div className="p-3 bg-muted/20 border-t shrink-0 text-center rounded-b-lg">
                        <p className="text-xs font-medium text-muted-foreground">
                            {currentGuests.length}/3 guests invited
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}