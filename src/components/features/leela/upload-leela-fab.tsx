'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useAppContext } from '@/providers/app-provider'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function UploadLeelaFab() {
  const { loggedInUser } = useAppContext()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleUploadLeela = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true)
    try {
      const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : 'mp4'
      const filePath = `leela/${loggedInUser.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('leela').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('leela').getPublicUrl(filePath)

      const { error: insertError } = await supabase.from('leela_videos').insert({
        user_id: loggedInUser.id,
        video_url: urlData.publicUrl,
        caption: null,
      })

      if (insertError) throw insertError

      toast({ title: 'Leela uploaded successfully!' })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!loggedInUser) return null

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleUploadLeela}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-8 bg-gradient-to-br from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 transition-all hover:scale-105"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Upload Leela"
            >
              {isUploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Image src="/icons/leela.png" alt="Leela" width={24} height={24} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isUploading ? 'Uploading...' : 'Upload Leela'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}
