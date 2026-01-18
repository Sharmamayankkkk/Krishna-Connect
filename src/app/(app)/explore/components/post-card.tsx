'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Repeat2,
  Heart,
  BarChart2,
  Upload,
  MoreHorizontal,
  Trash2,
  Edit2,
  Repeat,
  Quote,
} from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import type { Post, Media } from '@/lib';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CommentSheet } from './comment-sheet';
import { QuotedPostCard } from './quoted-post-card';
import { ImageViewerDialog } from '../../chat/components/image-viewer';
import { PollComponent } from './poll-component'; 

// --- Media Gallery Component ---
function MediaGallery({ media, onImageClick }: { media: Media[], onImageClick: (url: string) => void }) {
  if (!media || media.length === 0) return null;
  
  const images = media.filter(m => m.type.startsWith('image'));
  if (images.length === 0) return null;

  return (
    <div 
      className={cn(
        "grid gap-1.5 mt-3 border rounded-xl overflow-hidden",
        images.length === 1 ? "grid-cols-1" : "grid-cols-2",
        images.length === 3 ? "grid-rows-2" : "",
        images.length === 4 ? "grid-rows-2" : ""
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {images.map((img, index) => (
        <button 
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onImageClick(img.url);
          }}
          className={cn(
            "relative aspect-video w-full",
            images.length === 3 && index === 0 ? "row-span-2 h-full" : "h-full",
          )}
        >
          <Image
            src={img.url}
            alt="Post media"
            fill
            className="object-cover"
          />
        </button>
      ))}
    </div>
  );
}

// --- PostCard Component ---
interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { loggedInUser, togglePostLike, repostPost, openQuoteDialog } = useAppContext();
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');

  const isLiked = useMemo(() => {
    if (!loggedInUser) return false;
    return post.likes.includes(loggedInUser.id);
  }, [post.likes, loggedInUser]);

  const isReposted = useMemo(() => {
    if (!loggedInUser) return false;
    return post.reposts.includes(loggedInUser.id);
  }, [post.reposts, loggedInUser]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    router.push(`/post/${post.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof post.id === 'number') {
      togglePostLike(post);
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof post.id === 'number') {
      repostPost(post);
    }
  };
  
  const handleQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openQuoteDialog(post);
  };

  return (
    <>
      <CommentSheet 
        post={post} 
        open={isCommentSheetOpen} 
        onOpenChange={setIsCommentSheetOpen} 
      />
      
      <ImageViewerDialog
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
        src={imageViewerSrc}
        title="Post Media"
      />

      <Card 
        onClick={handleCardClick}
        className="rounded-none border-b border-t-0 border-x-0 shadow-none hover:bg-accent/20 transition-colors cursor-pointer"
      >
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <Link href={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar_url} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>

            {/* Content - min-w-0 is CRITICAL for text truncation in flex children */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1 overflow-hidden min-w-0 flex-wrap sm:flex-nowrap">
                  <Link href={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="group flex items-center gap-1 min-w-0 max-w-full truncate">
                    <span className="font-semibold hover:underline truncate text-sm">
                      {post.author.name}
                    </span>
                    
                    {post.author.verified && (
                      <Image
                        src="/user_Avatar/verified.png"
                        alt="Verified"
                        width={16}
                        height={16}
                        className="flex-shrink-0"
                      />
                    )}

                    <span className="text-sm text-muted-foreground truncate ml-1 hidden sm:inline">
                      @{post.author.username}
                    </span>
                  </Link>
                  <span className="text-sm text-muted-foreground flex-shrink-0 hidden sm:inline">·</span>
                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap ml-auto sm:ml-0">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: false }).replace('about ', '')}
                  </span>
                </div>
                <PostMenu post={post} />
              </div>

              {/* Content */}
              {post.content && (
                <p className="whitespace-pre-wrap text-foreground/90 mt-1 text-sm sm:text-base break-words">
                  {post.content}
                </p>
              )}

              {/* Media Gallery */}
              {post.media_urls && <MediaGallery media={post.media_urls} onImageClick={(url) => {
                setImageViewerSrc(url);
                setIsImageViewerOpen(true);
              }} />}
              
              {/* Poll */}
              {post.poll && (
                <div onClick={(e) => e.stopPropagation()} className="w-full">
                  <PollComponent post={post} />
                </div>
              )}
              
              {/* Quoted Post */}
              {post.quote_of && (
                <QuotedPostCard post={post.quote_of} />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 text-muted-foreground max-w-md">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="flex items-center gap-1.5 text-sm -ml-2 hover:text-primary h-8 w-8 sm:w-auto"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsCommentSheetOpen(true); }}
                >
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">{post.stats.comments || 0}</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn("flex items-center gap-1.5 text-sm hover:text-green-500 h-8 w-8 sm:w-auto", isReposted && "text-green-500")}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    >
                      <Repeat2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm">{(post.stats.reposts || 0) + (post.stats.quotes || 0)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                    <DropdownMenuItem onClick={handleRepost}>
                      <Repeat className="mr-2 h-4 w-4" />
                      <span>{isReposted ? 'Un-repost' : 'Repost'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleQuote}>
                      <Quote className="mr-2 h-4 w-4" />
                      <span>Quote</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex items-center gap-1.5 text-sm hover:text-red-500 h-8 w-8 sm:w-auto",
                    isLiked && "text-red-500"
                  )}
                  onClick={handleLike}
                >
                  <Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isLiked && "fill-red-500")} />
                  <span className="text-xs sm:text-sm">{post.likes.length}</span>
                </Button>

                <Button variant="ghost" size="icon" className="flex items-center gap-1.5 text-sm h-8 w-8 sm:w-auto" disabled>
                  <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">{post.stats.views || 0}</span>
                </Button>

                <Button variant="ghost" size="icon" className="flex items-center gap-1.5 text-sm -mr-2 h-8 w-8 sm:w-auto" disabled>
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// --- Post Menu ---
function PostMenu({ post }: { post: Post }) {
  const { loggedInUser, deletePost } = useAppContext();
  const { toast } = useToast();
  
  const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
  };
  
  if (post.author.id !== loggedInUser?.id) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 shrink-0" onClick={handleMenuClick}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    );
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof post.id === 'number') {
      deletePost(post.id);
    } else {
      toast({ variant: "destructive", title: "Cannot delete post", description: "This post is still being created." });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 shrink-0" onClick={handleMenuClick}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={handleMenuClick}>
        <DropdownMenuItem onClick={() => { /* TODO: Add edit logic */ }}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span>Edit Post</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Post</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Skeleton ---
export function PostSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-3 w-full min-w-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex justify-between mt-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}