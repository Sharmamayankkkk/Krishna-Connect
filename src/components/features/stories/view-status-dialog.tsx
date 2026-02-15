'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  X, Pause, Play, ChevronLeft, ChevronRight, Eye, Heart,
  Send, MoreHorizontal, Trash2, Flag, VolumeX, Volume2,
  BarChart3, ArrowRight, ArrowLeft, LogOut, Link2, Bookmark
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/utils';
import { useAppContext } from '@/providers/app-provider';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

type StatusUpdate = {
  user_id: string;
  name: string;
  username?: string;
  avatar_url: string;
  is_close_friend?: boolean;
  statuses: { id: number; media_url: string; media_type?: string; created_at: string; caption?: string | null; visibility?: string }[];
};

interface ViewStatusDialogProps {
  allStatusUpdates: StatusUpdate[];
  startIndex: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusViewed: () => void;
}

const STATUS_DURATION = 5000;
const VIDEO_MAX_DURATION = 30000;
const QUICK_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

// --- Viewers Sheet (for story owner) ---
function ViewersSheet({ statusId, viewCount }: { statusId: number; viewCount: number }) {
  const [viewers, setViewers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const fetchViewers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('status_views')
      .select('profiles:viewer_id(*)')
      .eq('status_id', statusId);
    if (!error && data) {
      setViewers(data.map(d => d.profiles).filter(Boolean) as unknown as User[]);
    }
    setIsLoading(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button onClick={fetchViewers} className="flex items-center gap-1.5 text-white/90 text-sm hover:text-white transition-colors">
          <Eye className="h-4 w-4" />
          <span>{viewCount}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">Viewed by {viewCount}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-64 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : viewers.length > 0 ? (
            <div className="space-y-3">
              {viewers.map(viewer => (
                <div key={viewer.id} className="flex items-center gap-3 py-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={viewer.avatar_url} />
                    <AvatarFallback>{viewer.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{viewer.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{viewer.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground pt-10">No views yet</p>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// --- Analytics Sheet (for story owner) ---
function AnalyticsSheet({ statusId }: { statusId: number }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_story_analytics', { p_status_id: statusId });
    if (!error && data && data.length > 0) {
      setAnalytics(data[0]);
    }
    setIsLoading(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button onClick={fetchAnalytics} className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors">
          <BarChart3 className="h-4 w-4" />
          <span>Insights</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Story Insights</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Views</span>
                </div>
                <p className="text-2xl font-bold">{analytics.total_views || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Reactions</span>
                </div>
                <p className="text-2xl font-bold">{analytics.total_reactions || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Replies</span>
                </div>
                <p className="text-2xl font-bold">{analytics.total_replies || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRight className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Forward Taps</span>
                </div>
                <p className="text-2xl font-bold">{analytics.forward_taps || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowLeft className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Back Taps</span>
                </div>
                <p className="text-2xl font-bold">{analytics.back_taps || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Exits</span>
                </div>
                <p className="text-2xl font-bold">{analytics.exits || 0}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No analytics data yet</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- Main Viewer ---
export function ViewStatusDialog({ allStatusUpdates, startIndex, open, onOpenChange, onStatusViewed }: ViewStatusDialogProps) {
  const { loggedInUser } = useAppContext();
  const { toast } = useToast();
  const supabase = createClient();

  const [currentUserIndex, setCurrentUserIndex] = useState(startIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showEmojiAnimation, setShowEmojiAnimation] = useState<string | null>(null);
  const [stickers, setStickers] = useState<any[]>([]);

  // Swipe state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const statusUpdate = (currentUserIndex !== null) ? allStatusUpdates[currentUserIndex] : null;
  const currentStatus = statusUpdate?.statuses[currentStoryIndex];
  const isMyStatus = loggedInUser?.id === statusUpdate?.user_id;
  const isVideo = currentStatus?.media_type === 'video';
  const isCloseFriend = currentStatus?.visibility === 'close_friends';
  const duration = isVideo ? VIDEO_MAX_DURATION : STATUS_DURATION;

  // --- Track analytics ---
  const trackAction = useCallback(async (statusId: number, actionType: string) => {
    if (!loggedInUser || isMyStatus) return;
    await supabase.from('story_analytics').insert({
      status_id: statusId,
      viewer_id: loggedInUser.id,
      action_type: actionType,
    }).then(() => {});
  }, [loggedInUser, isMyStatus, supabase]);

  const markAsViewed = useCallback(async (statusId: number) => {
    if (!loggedInUser || !statusUpdate || loggedInUser.id === statusUpdate.user_id) return;
    await supabase.from('status_views').upsert({
      status_id: statusId,
      viewer_id: loggedInUser.id,
    }, { onConflict: 'status_id, viewer_id' });
    onStatusViewed();
  }, [loggedInUser, supabase, onStatusViewed, statusUpdate]);

  const fetchViewCount = useCallback(async (statusId: number) => {
    const { count } = await supabase
      .from('status_views')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', statusId);
    setViewCount(count || 0);
  }, [supabase]);

  const fetchLikeStatus = useCallback(async (statusId: number) => {
    if (!loggedInUser) return;
    const { count: totalLikes } = await supabase
      .from('story_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', statusId);
    setLikeCount(totalLikes || 0);
    const { data } = await supabase
      .from('story_reactions')
      .select('id')
      .eq('status_id', statusId)
      .eq('user_id', loggedInUser.id)
      .maybeSingle();
    setIsLiked(!!data);
  }, [loggedInUser, supabase]);

  const fetchStickers = useCallback(async (statusId: number) => {
    const { data } = await supabase
      .from('story_stickers')
      .select('*')
      .eq('status_id', statusId);
    setStickers(data || []);
  }, [supabase]);

  const stopTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const goToNextUser = useCallback(() => {
    if (currentUserIndex !== null && currentUserIndex < allStatusUpdates.length - 1) {
      setCurrentUserIndex(prev => prev! + 1);
      setCurrentStoryIndex(0);
    } else {
      onOpenChange(false);
    }
  }, [currentUserIndex, allStatusUpdates.length, onOpenChange]);

  const goToNextStory = useCallback(() => {
    if (currentStatus) trackAction(currentStatus.id, 'forward_tap');
    if (statusUpdate && currentStoryIndex < statusUpdate.statuses.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      goToNextUser();
    }
  }, [statusUpdate, currentStoryIndex, goToNextUser, currentStatus, trackAction]);

  const startTimer = useCallback(() => {
    stopTimer();
    if (!currentStatus || isPaused) return;
    markAsViewed(currentStatus.id);
    if (isMyStatus) fetchViewCount(currentStatus.id);
    fetchLikeStatus(currentStatus.id);
    fetchStickers(currentStatus.id);

    startTimeRef.current = performance.now() - elapsedTimeRef.current;
    const animate = (time: number) => {
      elapsedTimeRef.current = time - startTimeRef.current;
      const newProgress = (elapsedTimeRef.current / duration) * 100;
      setProgress(newProgress);
      if (elapsedTimeRef.current < duration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    timeoutRef.current = setTimeout(goToNextStory, duration - elapsedTimeRef.current);
  }, [currentStatus, isPaused, stopTimer, markAsViewed, fetchViewCount, fetchLikeStatus, fetchStickers, isMyStatus, goToNextStory, duration]);

  useEffect(() => {
    if (open && startIndex !== null) {
      setCurrentUserIndex(startIndex);
      setCurrentStoryIndex(0);
      setReplyText('');
    } else { stopTimer(); }
  }, [open, startIndex, stopTimer]);

  useEffect(() => {
    if (open && currentUserIndex !== null) {
      setProgress(0);
      elapsedTimeRef.current = 0;
      setIsLiked(false);
      setLikeCount(0);
      setStickers([]);
      startTimer();
    }
    return stopTimer;
  }, [open, currentUserIndex, currentStoryIndex, startTimer, stopTimer]);

  const handlePausePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPaused(prev => !prev);
  };

  const goToPrevUser = () => {
    if (currentUserIndex !== null && currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev! - 1);
      setCurrentStoryIndex(0);
    }
  };

  const goToPrevStory = () => {
    if (currentStatus) trackAction(currentStatus.id, 'back_tap');
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else { goToPrevUser(); }
  };

  useEffect(() => {
    if (isPaused) {
      stopTimer();
      elapsedTimeRef.current = (progress / 100) * duration;
      if (videoRef.current) videoRef.current.pause();
    } else if (open) {
      startTimer();
      if (videoRef.current) videoRef.current.play().catch((err) => console.error('Video playback error:', err));
    }
  }, [isPaused, open, startTimer, stopTimer, progress, duration]);

  // --- Interactions ---
  const handleLike = async () => {
    if (!currentStatus || !loggedInUser || isMyStatus) return;
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
      await supabase.from('story_reactions').delete().eq('status_id', currentStatus.id).eq('user_id', loggedInUser.id);
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      await supabase.from('story_reactions').upsert({ status_id: currentStatus.id, user_id: loggedInUser.id, emoji: '❤️' }, { onConflict: 'status_id, user_id' });
      trackAction(currentStatus.id, 'reaction');
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    if (!currentStatus || !loggedInUser || isMyStatus) return;
    setShowEmojiAnimation(emoji);
    setTimeout(() => setShowEmojiAnimation(null), 1200);
    await supabase.from('story_reactions').upsert({ status_id: currentStatus.id, user_id: loggedInUser.id, emoji }, { onConflict: 'status_id, user_id' });
    trackAction(currentStatus.id, 'reaction');
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMyStatus) handleLike();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStatus || !loggedInUser || !statusUpdate || isMyStatus) return;
    setIsSendingReply(true);
    setIsPaused(true);
    try {
      await supabase.from('story_replies').insert({
        status_id: currentStatus.id,
        sender_id: loggedInUser.id,
        receiver_id: statusUpdate.user_id,
        message: replyText.trim(),
      });
      trackAction(currentStatus.id, 'reply');
      toast({ title: 'Reply sent', description: `Your reply was sent to ${statusUpdate.name}` });
      setReplyText('');
      setIsPaused(false);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send reply' });
    } finally { setIsSendingReply(false); }
  };

  const handleDeleteStory = async () => {
    if (!currentStatus || !isMyStatus) return;
    const { error } = await supabase.from('statuses').delete().eq('id', currentStatus.id);
    if (!error) {
      toast({ title: 'Story deleted' });
      onStatusViewed();
      if (statusUpdate && statusUpdate.statuses.length <= 1) { onOpenChange(false); }
      else { goToNextStory(); }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) videoRef.current.muted = newMuted;
  };

  // --- Swipe gestures ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaY(0);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (deltaY > 0) setTouchDeltaY(deltaY); // Only track downward swipe
  };

  const handleTouchEnd = () => {
    if (touchDeltaY > 100) {
      // Swipe down to exit
      if (currentStatus) trackAction(currentStatus.id, 'exit');
      onOpenChange(false);
    } else if (touchStartX !== null && touchStartY !== null) {
      // Small swipe — resume
    }
    setTouchStartY(null);
    setTouchStartX(null);
    setTouchDeltaY(0);
    setIsPaused(false);
  };

  // --- Sticker click handlers ---
  const handleStickerClick = (sticker: any) => {
    if (sticker.sticker_type === 'mention' && sticker.data?.username) {
      window.open(`/profile/${sticker.data.username}`, '_blank');
    } else if (sticker.sticker_type === 'hashtag' && sticker.data?.tag) {
      window.open(`/hashtag/${sticker.data.tag}`, '_blank');
    } else if (sticker.sticker_type === 'link' && sticker.data?.url) {
      window.open(sticker.data.url, '_blank', 'noopener');
    }
    if (currentStatus) trackAction(currentStatus.id, 'sticker_tap');
  };

  if (!statusUpdate || !currentStatus) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[100vw] max-h-[100vh] sm:max-w-md w-full h-full sm:h-auto sm:aspect-[9/16] sm:max-h-[90vh] bg-black border-none p-0 overflow-hidden flex flex-col data-[state=open]:!animate-none data-[state=closed]:!animate-none rounded-none sm:rounded-2xl"
        style={{ transform: touchDeltaY > 0 ? `translateY(${touchDeltaY}px) scale(${1 - touchDeltaY / 1000})` : undefined, opacity: touchDeltaY > 0 ? 1 - touchDeltaY / 400 : 1, transition: touchDeltaY === 0 ? 'transform 0.2s, opacity 0.2s' : 'none' }}
      >
        <DialogTitle className="sr-only">Story from {statusUpdate.name}</DialogTitle>
        <DialogDescription className="sr-only">Viewing story. Swipe down to close.</DialogDescription>

        {/* Top gradient + progress + header */}
        <div className="absolute top-0 left-0 right-0 p-3 z-20 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
          {/* Progress bars */}
          <div className="flex items-center gap-0.5 mb-3">
            {statusUpdate.statuses.map((_, index) => (
              <div key={index} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/25">
                <div className="h-full bg-white rounded-full" style={{ width: `${index < currentStoryIndex ? 100 : index === currentStoryIndex ? Math.min(progress, 100) : 0}%`, transition: index === currentStoryIndex ? 'width 100ms linear' : 'none' }} />
              </div>
            ))}
          </div>

          {/* User info + actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className={`h-8 w-8 ring-2 ${isCloseFriend ? 'ring-green-500' : 'ring-white/20'}`}>
                <AvatarImage src={statusUpdate.avatar_url} />
                <AvatarFallback className="text-xs">{statusUpdate.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white text-sm truncate">{statusUpdate.name}</p>
                  {isCloseFriend && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">Close Friend</span>}
                </div>
                <p className="text-[10px] text-white/60">{formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {isVideo && (
                <button onClick={toggleMute} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}
              <button onClick={handlePausePlay} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {isMyStatus ? (
                    <>
                      <DropdownMenuItem onClick={handleDeleteStory} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Story
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: 'Coming Soon', description: 'Add to Highlights will be available soon.' })}>
                        <Bookmark className="h-4 w-4 mr-2" /> Add to Highlights
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => toast({ title: 'Report submitted', description: 'This story has been reported for review.' })}>
                      <Flag className="h-4 w-4 mr-2" /> Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <button onClick={() => onOpenChange(false)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Story content */}
        <div
          className="relative flex-1 flex items-center justify-center"
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pause on hold (desktop) */}
          <div
            className="absolute inset-0 z-10 hidden sm:block"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
          />

          {/* Media */}
          {isVideo ? (
            <video ref={videoRef} src={currentStatus.media_url} className="w-full h-full object-contain" autoPlay playsInline muted={isMuted} loop />
          ) : (
            currentStatus.media_url && (
              <Image src={currentStatus.media_url} alt={`Story from ${statusUpdate.name}`} fill className="object-contain" priority />
            )
          )}

          {/* Stickers overlay */}
          {stickers.map(sticker => (
            <button
              key={sticker.id}
              className="absolute z-15 cursor-pointer transition-transform hover:scale-110"
              style={{ left: `${sticker.position_x}%`, top: `${sticker.position_y}%`, transform: `translate(-50%, -50%) scale(${sticker.scale || 1})` }}
              onClick={() => handleStickerClick(sticker)}
            >
              {sticker.sticker_type === 'mention' && <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-semibold">@{sticker.data?.username}</span>}
              {sticker.sticker_type === 'hashtag' && <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-semibold">#{sticker.data?.tag}</span>}
              {sticker.sticker_type === 'time' && <span className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium">{new Date(currentStatus.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              {sticker.sticker_type === 'link' && <span className="bg-white/90 px-3 py-1.5 rounded-lg text-black text-xs font-medium flex items-center gap-1"><Link2 className="h-3 w-3" />{sticker.data?.label || 'Link'}</span>}
              {sticker.sticker_type === 'countdown' && <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-lg text-white text-xs font-bold">{sticker.data?.label || 'Countdown'}</span>}
            </button>
          ))}

          {/* Like animation */}
          {showLikeAnimation && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-red-500 fill-red-500 animate-ping" />
            </div>
          )}

          {/* Emoji reaction animation */}
          {showEmojiAnimation && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <span className="text-7xl animate-bounce">{showEmojiAnimation}</span>
            </div>
          )}

          {/* Navigation: tap left/right areas */}
          <button onClick={(e) => { e.stopPropagation(); goToPrevStory(); }} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" aria-label="Previous story" />
          <button onClick={(e) => { e.stopPropagation(); goToNextStory(); }} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" aria-label="Next story" />

          {/* User navigation arrows (desktop) */}
          {currentUserIndex !== null && currentUserIndex > 0 && (
            <button onClick={goToPrevUser} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/30 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/50 transition-colors hidden sm:flex" aria-label="Previous user">
              <ChevronLeft size={20} />
            </button>
          )}
          {currentUserIndex !== null && currentUserIndex < allStatusUpdates.length - 1 && (
            <button onClick={goToNextUser} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/30 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/50 transition-colors hidden sm:flex" aria-label="Next user">
              <ChevronRight size={20} />
            </button>
          )}

          {/* Caption */}
          {currentStatus.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 pointer-events-none">
              <p className="text-white text-center text-sm drop-shadow-lg leading-relaxed">{currentStatus.caption}</p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 py-3 pt-8">
          {isMyStatus ? (
            /* Owner: viewers + analytics + likes */
            <div className="flex items-center justify-between">
              <ViewersSheet statusId={currentStatus.id} viewCount={viewCount} />
              <AnalyticsSheet statusId={currentStatus.id} />
              <div className="flex items-center gap-3">
                {likeCount > 0 && (
                  <div className="flex items-center gap-1 text-white/80 text-sm">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <span>{likeCount}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Viewer: quick emojis + reply + like */
            <div className="space-y-2">
              {/* Quick emoji reactions */}
              <div className="flex items-center justify-center gap-3">
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(emoji)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-110 transition-all text-lg"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Reply input */}
              <div className="flex items-center gap-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  placeholder={`Reply to ${statusUpdate.name?.split(' ')[0] || 'story'}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => { if (!replyText && !isSendingReply) setIsPaused(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
                />
                {replyText.trim() ? (
                  <button onClick={handleSendReply} disabled={isSendingReply} className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={handleLike} className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <Heart className={`h-5 w-5 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
