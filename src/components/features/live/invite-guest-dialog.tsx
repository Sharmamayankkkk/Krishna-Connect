"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, UserPlus, X, Check } from 'lucide-react'
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
            // Use Server Action to handle both DB and Stream permissions
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Guest Co-Host</DialogTitle>
                    <DialogDescription>
                        Invite up to 3 guests to join your livestream as co-hosts
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* User List */}
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                            {availableUsers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    {searchQuery ? 'No users found' : 'No available users to invite'}
                                </p>
                            ) : (
                                availableUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                                            <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleInvite(user.id)}
                                            disabled={inviting === user.id}
                                            className="shrink-0"
                                        >
                                            {inviting === user.id ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <>
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Invite
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Guest Limit Info */}
                    <p className="text-xs text-muted-foreground">
                        {currentGuests.length}/3 guests invited
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
