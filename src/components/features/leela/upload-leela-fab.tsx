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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'

export function UploadLeelaFab() {
  const { loggedInUser } = useAppContext()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedLeelaFile, setSelectedLeelaFile] = React.useState<File | null>(null)
  const [leelaCaption, setLeelaCaption] = React.useState('')
  const [isLeelaDialogOpen, setIsLeelaDialogOpen] = React.useState(false)

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
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
      setSelectedLeelaFile(null)
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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full md:bottom-8 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_4px_15px_rgba(6,182,212,0.3)] dark:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105 hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:bg-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-800"
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
