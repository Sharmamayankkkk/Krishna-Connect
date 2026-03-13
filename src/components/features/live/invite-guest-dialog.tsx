"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/utils'
import { useAppContext } from '@/providers/app-provider'
import { useToast } from '@/hooks/use-toast'
import { getAvatarUrl } from '@/lib/utils'

import { useTranslation } from 'react-i18next';

interface InviteGuestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    livestreamId: string
    currentGuests: string[]
}

export function InviteGuestDialog({ open, onOpenChange, livestreamId, currentGuests }: InviteGuestDialogProps) {
  const { t } = useTranslation();

    const { loggedInUser } = useAppContext()
    const { toast } = useToast()
    const supabase = createClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [inviting, setInviting] = useState<string | null>(null)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Debounced search — fetches users matching query, excluding already-invited guests
    useEffect(() => {
        if (!open) return;
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            const exclude = [...currentGuests, loggedInUser?.id || ''].filter(Boolean);
            const { data } = await supabase
                .from('profiles')
                .select('id, name, username, avatar_url')
                .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
                .not('id', 'in', `(${exclude.join(',')})`)
                .limit(20);
            setSearchResults(data || []);
            setIsSearching(false);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, open]);

    const handleInvite = async (userId: string) => {
        if (!loggedInUser) return
        setInviting(userId)
        try {
            const { inviteGuestToLivestream } = await import('@/actions/stream')
            const result = await inviteGuestToLivestream(livestreamId, userId)
            if (!result.success) throw new Error(result.error)

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
                KEY FIX: No overflow-hidden on DialogContent.
                We use a native scrolling div instead of shadcn's ScrollArea,
                whose overlay scrollbar was clipping the Invite buttons.
            */}
            <DialogContent
                className="w-[90vw] max-w-[420px] flex flex-col p-0 gap-0 bg-background"
                style={{ maxHeight: '85vh' }}
            >
                {/* Header — never scrolls */}
                <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
                    <DialogTitle className="text-lg">{t('live.inviteGuestCohost')}</DialogTitle>
                    <DialogDescription>
                        Invite up to 3 guests to join your livestream as co-hosts
                    </DialogDescription>
                </DialogHeader>

                {/* Search — never scrolls */}
                <div className="relative px-5 pb-2 shrink-0">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder={t('chat.searchUsers')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-muted/50 border-transparent focus:bg-background"
                    />
                </div>

                {/*
                    THE FIX: Replace ScrollArea with a native overflow-y-auto div.
                    `scrollbarGutter: 'stable'` pre-reserves space for the scrollbar
                    so content is never pushed under it — buttons always fully visible.
                */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto px-5"
                    style={{ scrollbarGutter: 'stable' }}
                >
                    <div className="space-y-1 py-2">
                        {!searchQuery.trim() ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('live.typeANameToSearchFor')}</p>
                        ) : isSearching ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : searchResults.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('chat.noUsersFound1')}</p>
                        ) : (
                            searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors hover:bg-muted/50"
                                >
                                    <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                                        <AvatarImage src={getAvatarUrl(user.avatar_url)} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                            {user.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate leading-none mb-1">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                    </div>

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
                                                <span>{t('live.invite')}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer — never scrolls */}
                <div className="px-5 py-3 border-t shrink-0 text-center bg-muted/20 rounded-b-lg">
                    <p className="text-xs font-medium text-muted-foreground">
                        {currentGuests.length}/3 guests invited
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}