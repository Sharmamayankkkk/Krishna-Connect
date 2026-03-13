"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Radio } from 'lucide-react'
import { GoLiveDialog } from '@/components/features/live/go-live-dialog'

import { useTranslation } from 'react-i18next';

export function GoLiveButton() {
  const { t } = useTranslation();

    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="relative gap-2 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 hover:from-red-700 hover:via-pink-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 overflow-hidden group"
            >
                {/* Animated background pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <Radio className="h-4 w-4" />
                    <span>{t('live.goLive')}</span>
                </div>
            </Button>
            <GoLiveDialog open={open} onOpenChange={setOpen} />
        </>
    )
}
