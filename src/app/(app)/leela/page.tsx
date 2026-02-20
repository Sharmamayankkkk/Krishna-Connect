'use client'

import * as React from 'react'
import { Heart, MessageCircle, Share2, Bookmark, Music2, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Upload, Film, Lightbulb, CheckCircle, Send, Trash2, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppContext } from '@/providers/app-provider'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleAd } from '@/components/ads/google-ad'

type LeelaVideo = {
  id: string
  video_url: string
  thumbnail_url: string | null
  caption: string | null
  audio_name: string | null
  duration_seconds: number | null
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  created_at: string
  author_id: string
  author_name: string
  author_username: string
  author_avatar: string | null
  author_verified: string
  is_liked: boolean
  is_bookmarked: boolean
}

type LeelaComment = {
  id: string
  content: string
  created_at: string
  user_id: string
  user_name: string
  user_username: string
  user_avatar: string | null
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function VideoPlayer({
  video,
  isActive,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  isOwner,
}: {
  video: LeelaVideo
  isActive: boolean
  onLike: (id: string) => void
  onComment: (id: string) => void
  onShare: (video: LeelaVideo) => void
  onBookmark: (id: string) => void
  onDelete?: (id: string) => void
  isOwner?: boolean
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [showControls, setShowControls] = React.useState(false)
  const controlsTimeout = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (isActive) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  React.useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTime = () => {
      if (el.duration) setProgress((el.currentTime / el.duration) * 100)
    }
    el.addEventListener('timeupdate', onTime)
    return () => el.removeEventListener('timeupdate', onTime)
  }, [])

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play().then(() => setIsPlaying(true))
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const handleTap = () => {
    togglePlay()
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2000)
  }

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault()
    onLike(video.id)
  }

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onClick={handleTap}
      onDoubleClick={handleDoubleTap}
    >
      <video
        ref={videoRef}
        src={video.video_url}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
        poster={video.thumbnail_url || undefined}
      />

      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="bg-black/40 rounded-full p-4">
            {isPlaying ? (
              <Pause className="h-12 w-12 text-white" fill="white" />
            ) : (
              <Play className="h-12 w-12 text-white" fill="white" />
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      <button
        onClick={toggleMute}
        className="absolute top-20 right-4 bg-black/40 rounded-full p-2 backdrop-blur-sm z-10"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
      </button>

      <div className="absolute bottom-4 left-4 right-16 z-10">
        <Link href={`/profile/${video.author_username}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={video.author_avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {video.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold text-sm drop-shadow-lg">
            @{video.author_username}
          </span>
          {video.author_verified !== 'none' && (
            <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
          )}
        </Link>

        {video.caption && (
          <p className="text-white text-sm drop-shadow-lg line-clamp-2 mb-2">
            {video.caption}
          </p>
        )}

        {video.audio_name && (
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <Music2 className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="truncate max-w-[200px]">{video.audio_name}</span>
          </div>
        )}
      </div>

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">
        <button onClick={(e) => { e.stopPropagation(); onLike(video.id); }} className="flex flex-col items-center gap-1">
          <div className={cn("p-2 rounded-full", video.is_liked ? "text-red-500" : "text-white")}>
            <Heart className="h-7 w-7 drop-shadow-lg" fill={video.is_liked ? "currentColor" : "none"} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">{formatCount(video.like_count)}</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onComment(video.id); }} className="flex flex-col items-center gap-1">
          <div className="p-2 text-white">
            <MessageCircle className="h-7 w-7 drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">{formatCount(video.comment_count)}</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onBookmark(video.id); }} className="flex flex-col items-center gap-1">
          <div className={cn("p-2", video.is_bookmarked ? "text-yellow-400" : "text-white")}>
            <Bookmark className="h-7 w-7 drop-shadow-lg" fill={video.is_bookmarked ? "currentColor" : "none"} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">{video.is_bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onShare(video); }} className="flex flex-col items-center gap-1">
          <div className="p-2 text-white">
            <Share2 className="h-7 w-7 drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">{formatCount(video.share_count)}</span>
        </button>

        {isOwner && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(video.id); }} className="flex flex-col items-center gap-1">
            <div className="p-2 text-white/80 hover:text-red-400 transition-colors">
              <Trash2 className="h-6 w-6 drop-shadow-lg" />
            </div>
            <span className="text-white/80 text-[10px] font-semibold drop-shadow-lg">Delete</span>
          </button>
        )}

        <Link href={`/profile/${video.author_username}`} onClick={e => e.stopPropagation()}>
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden animate-spin" style={{ animationDuration: '6s' }}>
            <Avatar className="h-full w-full">
              <AvatarImage src={video.author_avatar || undefined} />
              <AvatarFallback className="text-xs">{video.author_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function LeelaPage() {
  const { loggedInUser } = useAppContext()
  const { toast } = useToast()
  const supabase = createClient()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [videos, setVideos] = React.useState<LeelaVideo[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasMore, setHasMore] = React.useState(true)

  const fetchVideos = React.useCallback(async (offset = 0) => {
    const { data, error } = await supabase.rpc('get_leela_feed', {
      p_limit: 10,
      p_offset: offset,
    })

    if (error) {
      console.warn('Leela feed error:', error.message)
      setIsLoading(false)
      return
    }

    const newVideos = (data || []) as LeelaVideo[]
    if (newVideos.length < 10) setHasMore(false)

    if (offset === 0) {
      setVideos(newVideos)
    } else {
      setVideos(prev => [...prev, ...newVideos])
    }
    setIsLoading(false)
  }, [supabase])

  React.useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  React.useEffect(() => {
    if (currentIndex >= videos.length - 3 && hasMore && !isLoading) {
      fetchVideos(videos.length)
    }
  }, [currentIndex, videos.length, hasMore, isLoading, fetchVideos])

  // Track which videos have been viewed this session
  const viewedVideos = React.useRef(new Set<string>())

  React.useEffect(() => {
    const videoId = videos[currentIndex]?.id
    if (videoId && !viewedVideos.current.has(videoId)) {
      viewedVideos.current.add(videoId)
      void supabase.rpc('record_leela_view', { p_video_id: videoId })
    }
  }, [currentIndex, videos, supabase])

  const navigate = React.useCallback((direction: 'up' | 'down') => {
    setCurrentIndex(prev => {
      if (direction === 'up') return Math.max(0, prev - 1)
      if (direction === 'down') return Math.min(videos.length - 1, prev + 1)
      return prev
    })
  }, [videos.length])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') navigate('up')
      if (e.key === 'ArrowDown' || e.key === 'j') navigate('down')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const touchStart = React.useRef<number>(0)
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? 'down' : 'up')
    }
  }

  const lastScroll = React.useRef(0)
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - lastScroll.current < 500) return
    lastScroll.current = now
    navigate(e.deltaY > 0 ? 'down' : 'up')
  }

  const handleLike = async (videoId: string) => {
    if (!loggedInUser) {
      toast({ title: 'Log in to like videos' })
      return
    }
    setVideos(prev => prev.map(v => {
      if (v.id !== videoId) return v
      return {
        ...v,
        is_liked: !v.is_liked,
        like_count: v.is_liked ? v.like_count - 1 : v.like_count + 1,
      }
    }))

    const video = videos.find(v => v.id === videoId)
    if (video?.is_liked) {
      await supabase.from('leela_likes').delete().match({ user_id: loggedInUser.id, video_id: videoId })
    } else {
      await supabase.from('leela_likes').insert({ user_id: loggedInUser.id, video_id: videoId })
    }
  }

  // Bookmark handler
  const handleBookmark = async (videoId: string) => {
    if (!loggedInUser) {
      toast({ title: 'Log in to save videos' })
      return
    }
    const video = videos.find(v => v.id === videoId)
    setVideos(prev => prev.map(v => v.id !== videoId ? v : { ...v, is_bookmarked: !v.is_bookmarked }))

    if (video?.is_bookmarked) {
      await supabase.from('leela_bookmarks').delete().match({ user_id: loggedInUser.id, video_id: videoId })
      toast({ title: 'Removed from saved' })
    } else {
      await supabase.from('leela_bookmarks').insert({ user_id: loggedInUser.id, video_id: videoId })
      toast({ title: 'Saved to collection' })
    }
  }

  // Share handler
  const handleShare = async (video: LeelaVideo) => {
    const url = `${window.location.origin}/leela?v=${video.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: video.caption || 'Check out this Leela', url })
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err.message)
        }
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copied to clipboard' })
    }
  }

  // Delete handler
  const handleDelete = async (videoId: string) => {
    if (!loggedInUser) return
    const video = videos.find(v => v.id === videoId)
    if (!video || video.author_id !== loggedInUser.id) {
      toast({ title: 'You can only delete your own videos', variant: 'destructive' })
      return
    }

    // Optimistically remove from UI
    setVideos(prev => prev.filter(v => v.id !== videoId))
    if (currentIndex >= videos.length - 1) {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    }

    // Delete from storage if URL contains our bucket path
    if (video.video_url.includes('/leela/')) {
      const pathMatch = video.video_url.match(/\/leela\/(.+)$/)
      if (pathMatch) {
        await supabase.storage.from('leela').remove([pathMatch[1]])
      }
    }

    // Delete from database (cascade will handle likes/comments/bookmarks)
    const { error } = await supabase.from('leela_videos').delete().eq('id', videoId)
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' })
      fetchVideos() // Reload on error
    } else {
      toast({ title: 'Leela deleted' })
    }
  }

  // Comments
  const [commentSheetOpen, setCommentSheetOpen] = React.useState(false)
  const [commentVideoId, setCommentVideoId] = React.useState<string | null>(null)
  const [comments, setComments] = React.useState<LeelaComment[]>([])
  const [commentText, setCommentText] = React.useState('')
  const [loadingComments, setLoadingComments] = React.useState(false)
  const [postingComment, setPostingComment] = React.useState(false)

  const openComments = async (videoId: string) => {
    setCommentVideoId(videoId)
    setCommentSheetOpen(true)
    setLoadingComments(true)
    const { data } = await supabase
      .from('leela_comments')
      .select('id, content, created_at, user_id, profiles:user_id(name, username, avatar_url)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .limit(50)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setComments((data || []).map((c: any) => {
      const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        user_name: profile?.name || 'User',
        user_username: profile?.username || '',
        user_avatar: profile?.avatar_url || null,
      }
    }))
    setLoadingComments(false)
  }

  const postComment = async () => {
    if (!commentText.trim() || !commentVideoId || !loggedInUser) return
    setPostingComment(true)
    const { error } = await supabase.from('leela_comments').insert({
      video_id: commentVideoId,
      user_id: loggedInUser.id,
      content: commentText.trim(),
    })
    if (!error) {
      setCommentText('')
      setVideos(prev => prev.map(v => v.id !== commentVideoId ? v : { ...v, comment_count: v.comment_count + 1 }))
      await openComments(commentVideoId)
    }
    setPostingComment(false)
  }

  // Upload handler
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [uploadCaption, setUploadCaption] = React.useState('')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file)
    setUploadCaption('')
    setIsUploadDialogOpen(true)
  }

  const handleUploadConfirm = async () => {
    if (!selectedFile || !loggedInUser) return

    setIsUploadDialogOpen(false)
    setIsUploading(true)
    try {
      const ext = selectedFile.name.split('.').pop() || 'mp4'
      const filePath = `leela/${loggedInUser.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('leela').upload(filePath, selectedFile)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('leela').getPublicUrl(filePath)

      const { error: insertError } = await supabase.from('leela_videos').insert({
        user_id: loggedInUser.id,
        video_url: urlData.publicUrl,
        caption: uploadCaption.trim() || null,
      })

      if (insertError) throw insertError

      toast({ title: 'Leela uploaded successfully' })
      fetchVideos()
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Empty state
  if (!isLoading && videos.length === 0) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <header className="flex items-center gap-3 border-b p-4 bg-background z-10">
          <SidebarTrigger className="md:hidden" />
          <Image src="/icons/leela.png" alt="Leela" width={28} height={28} />
          <h1 className="text-xl font-bold">Leela</h1>
        </header>

        {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

        {/* Upload Dialog */}
        {isUploadDialogOpen && selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 animate-in zoom-in-95">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Upload Leela
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Selected: <span className="font-semibold text-foreground">{selectedFile.name}</span>
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium mb-1.5">Caption <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <textarea
                    id="caption"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Write a caption for your Leela..."
                    className="w-full min-h-[100px] p-3 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                    maxLength={200}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {uploadCaption.length}/200
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="ghost" onClick={() => { setIsUploadDialogOpen(false); setSelectedFile(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleUploadConfirm} disabled={isUploading}>
                  {isUploading ? <><div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading...</> : 'Post Leela'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Film className="h-12 w-12 text-primary/60" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-bold">Welcome to Leela</h2>
            <p className="text-muted-foreground">
              Short-form videos from the Krishna Connect community. Be the first to share a Leela!
            </p>
          </div>
          <Button className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isUploadDialogOpen}>
            {isUploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Upload Your First Leela'}
          </Button>
          <div className="mt-4 bg-muted/50 rounded-lg p-4 max-w-xs text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> What is Leela?</p>
            <p>Share divine moments through short-form videos up to 60 seconds. Express your devotion, share teachings, and connect with the community through visual stories.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-[100dvh] bg-black">
      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

      {/* Upload Dialog (for when videos already exist) */}
      {isUploadDialogOpen && selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 relative overflow-hidden">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Upload Leela
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Selected: <span className="font-semibold text-foreground truncate block">{selectedFile.name}</span>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="caption-main" className="block text-sm font-medium mb-1.5">Caption <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  id="caption-main"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Write a caption for your Leela..."
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                  maxLength={200}
                />
                <div className="text-right text-xs text-muted-foreground mt-1">
                  {uploadCaption.length}/200
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="ghost" onClick={() => { setIsUploadDialogOpen(false); setSelectedFile(null); }} className="hover:bg-red-500/10 hover:text-red-500">
                Cancel
              </Button>
              <Button onClick={handleUploadConfirm} disabled={isUploading} className="min-w-[120px]">
                {isUploading ? <><div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading</> : 'Post Leela'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 p-4">
        <SidebarTrigger className="md:hidden text-white" />
        <Image src="/icons/leela.png" alt="Leela" width={24} height={24} />
        <h1 className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Leela</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 backdrop-blur-sm"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Leela"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <button
            onClick={() => navigate('up')}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
            aria-label="Previous video"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('down')}
            disabled={currentIndex >= videos.length - 1}
            className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
            aria-label="Next video"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Video container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
          </div>
        )}

        {videos.map((video, index) => {
          if (Math.abs(index - currentIndex) > 1) return null
          return (
            <div
              key={video.id}
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{
                transform: `translateY(${(index - currentIndex) * 100}%)`,
              }}
            >
              <VideoPlayer
                video={video}
                isActive={index === currentIndex}
                onLike={handleLike}
                onComment={openComments}
                onShare={handleShare}
                onBookmark={handleBookmark}
                onDelete={handleDelete}
                isOwner={loggedInUser?.id === video.author_id}
              />
            </div>
          )
        })}



        {/* Ad banner every 3rd video */}
        {currentIndex > 0 && currentIndex % 3 === 0 && (
          <div className="absolute bottom-20 left-4 right-4 z-30">
            <GoogleAd slot="2321943672" />
          </div>
        )}
      </div>

      {/* Comment Sheet */}
      <Sheet open={commentSheetOpen} onOpenChange={setCommentSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="p-4 pb-2 border-b shrink-0">
            <SheetTitle className="text-center text-base">Comments</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {loadingComments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No comments yet. Be the first!</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <Link href={`/profile/${c.user_username}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={c.user_avatar || undefined} />
                      <AvatarFallback className="text-xs">{c.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link href={`/profile/${c.user_username}`} className="text-sm font-semibold hover:underline">
                        {c.user_username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t shrink-0 flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); postComment(); } }}
              className="flex-1 rounded-full text-sm"
              disabled={postingComment}
            />
            <Button
              size="icon"
              className="rounded-full shrink-0"
              onClick={postComment}
              disabled={!commentText.trim() || postingComment}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
