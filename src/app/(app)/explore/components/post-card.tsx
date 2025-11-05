'use client';

import React, { useMemo, useState } from 'react'; // <-- Import useState
import Link from 'next/link';
import Image from 'next/image';
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
import { ImageViewerDialog } from '../../chat/components/image-viewer'; // <-- 1. IMPORT

// --- UPDATED: Media Gallery Component ---
function MediaGallery({ media, onImageClick }: { media: Media[], onImageClick: (url: string) => void }) { // <-- 2. Add onImageClick prop
  if (!media || media.length === 0) return null;
  
  // For now, only display images
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
        // --- 3. Change from <Link> to <button> ---
        <button 
          key={index}
          onClick={(e) => { // <-- 4. Add onClick handler
            e.stopPropagation();
            e.preventDefault();
            onImageClick(img.url);
          }}
          className={cn(
            "relative aspect-video",
            images.length === 3 && index === 0 ? "row-span-2" : "",
          )}
        >
          <Image
            src={img.url}
            alt="Post media"
            fill
            className="object-cover"
          />
        </button>
        // --- End of update ---
      ))}
    </div>
  );
}
// --- END NEW ---

// --- PostCard Component ---
interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { loggedInUser, togglePostLike, repostPost, openQuoteDialog } = useAppContext();
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  
  // --- 5. Add state for Image Viewer ---
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');
  // --- End ---

  // ... (isLiked, isReposted, handleLike, handleRepost, handleQuote functions are unchanged) ...
  const isLiked = useMemo(() => {
    if (!loggedInUser) return false;
    return post.likes.includes(loggedInUser.id);
  }, [post.likes, loggedInUser]);

  const isReposted = useMemo(() => {
    if (!loggedInUser) return false;
    return post.reposts.includes(loggedInUser.id);
  }, [post.reposts, loggedInUser]);

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
      
      {/* --- 6. Add ImageViewerDialog to render --- */}
      <ImageViewerDialog
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
        src={imageViewerSrc}
        title="Post Media"
      />
      {/* --- End --- */}

      <Link href={`/post/${post.id}`} className="block">
        <Card className="rounded-none border-b border-t-0 border-x-0 shadow-none hover:bg-accent/20 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {/* Avatar */}
              <Link href={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatar_url} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>

              {/* Content */}
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Link href={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="group">
                      <span className="font-semibold hover:underline truncate">
                        {post.author.name}
                      </span>
                      
                      {post.author.verified && (
                        <Image
                          src="/user_Avatar/verified.png"
                          alt="Verified"
                          width={16}
                          height={16}
                          className="ml-1 inline-block"
                        />
                      )}

                      <span className="text-sm text-muted-foreground ml-2 truncate">
                        @{post.author.username}
                      </span>
                    </Link>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <PostMenu post={post} />
                </div>

                {/* Content */}
                {post.content && (
                  <p className="whitespace-pre-wrap text-foreground/90 mt-2">
                    {post.content}
                  </p>
                )}

                {/* --- 7. Pass handler to MediaGallery --- */}
                {post.media_urls && <MediaGallery media={post.media_urls} onImageClick={(url) => {
                  setImageViewerSrc(url);
                  setIsImageViewerOpen(true);
                }} />}
                {/* --- End --- */}

                {post.quote_of && (
                  <QuotedPostCard post={post.quote_of} />
                )}

                {/* Stats / Action Buttons */}
                <div className="flex items-center justify-between mt-4 text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="flex items-center gap-2 text-sm -ml-2 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsCommentSheetOpen(true); }}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">{post.stats.comments}</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("flex items-center gap-2 text-sm hover:text-green-500", isReposted && "text-green-500")}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      >
                        <Repeat2 className="h-5 w-5" />
                        <span className="text-xs">{post.stats.reposts + post.stats.quotes}</span>
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
                      "flex items-center gap-2 text-sm hover:text-red-500",
                      isLiked && "text-red-500"
                    )}
                    onClick={handleLike}
                  >
                    <Heart className={cn("h-5 w-5", isLiked && "fill-red-500")} />
                    <span className="text-xs">{post.likes.length}</span>
                  </Button>

                  <Button variant="ghost" size="icon" className="flex items-center gap-2 text-sm" disabled>
                    <BarChart2 className="h-5 w-5" />
                    <span className="text-xs">{post.stats.views}</span>
                  </Button>

                  <Button variant="ghost" size="icon" className="flex items-center gap-2 text-sm -mr-2" disabled>
                    <Upload className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </>
  );
}

// ... (PostMenu and PostSkeleton components are unchanged) ...
// --- Post Menu (Delete, Edit) ---
function PostMenu({ post }: { post: Post }) {
  const { loggedInUser, deletePost } = useAppContext();
  const { toast } = useToast();
  
  const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
  };
  
  if (post.author.id !== loggedInUser?.id) {
    return (
      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2" onClick={handleMenuClick}>
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
        <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2" onClick={handleMenuClick}>
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


// --- Skeleton for Loading ---
export function PostSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex justify-between mt-4">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-8" />
        </div>
      </div>
    </div>
  );
}