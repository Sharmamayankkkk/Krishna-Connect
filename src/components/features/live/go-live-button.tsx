"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import { GoLiveDialog } from '@/components/features/live/go-live-dialog'

export function GoLiveButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <Video className="h-4 w-4" />
                Go Live
            </Button>
            <GoLiveDialog open={open} onOpenChange={setOpen} />
        </>
    )
}
