"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users } from 'lucide-react'

interface Participant {
    id: string
    name: string
    username: string
    avatar_url: string | null
}

interface ParticipantsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    participants: Participant[]
    viewerCount: number
}

export function ParticipantsModal({ open, onOpenChange, participants, viewerCount }: ParticipantsModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Viewers ({viewerCount})
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="space-y-2">
                        {participants.length > 0 ? (
                            participants.map((participant) => (
                                <div
                                    key={participant.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={participant.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {participant.name?.[0] || participant.username?.[0] || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {participant.name || participant.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            @{participant.username}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No viewers yet</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
