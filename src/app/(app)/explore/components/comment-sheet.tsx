'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/providers/app-provider';
import type { PostType as Post, CommentType as Comment } from '../../data';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Heart, MessageSquareReply, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CommentSheetProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComment?: (postId: string, commentText: string) => void;
}

// --- Individual Comment Component ---
function CommentCard({ comment, post, onLikeToggle }: { comment: Comment, post: Post, onLikeToggle?: (postId: string, commentId: string) => void }) {
  const { loggedInUser } = useAppContext();

  const isLiked = useMemo(() => {
    if (!loggedInUser) return false;
    return comment.likedBy.includes(loggedInUser.id);
  }, [comment.likedBy, loggedInUser]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onLikeToggle) {
      onLikeToggle(post.id, comment.id);
    }
  };

  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.user.username}`}>
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
          <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${comment.user.username}`} className="group">
            <span className="font-semibold hover:underline truncate text-sm">
              {comment.user.name}
            </span>
            <span className="text-sm text-muted-foreground ml-2 truncate">
              @{comment.user.username}
            </span>
          </Link>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-foreground/90 mt-1">
          {comment.text}
        </p>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className={cn("flex items-center gap-1 text-xs -ml-2", isLiked && "text-red-500")}
            onClick={handleLike}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-red-500")} />
            <span className="text-xs">{comment.likes}</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex items-center gap-1 text-xs -ml-2">
            <MessageSquareReply className="h-4 w-4" />
            <span className="text-xs">{comment.replies.length}</span>
          </Button>
        </div>
        {/* We can map comment.replies here later */}
      </div>
    </div>
  );
}

// --- Main Comment Sheet Component ---
export function CommentSheet({ post, open, onOpenChange, onComment }: CommentSheetProps) {
  const { loggedInUser } = useAppContext();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  const handleComment = async () => {
    if (!content.trim()) return;
    setIsPosting(true);
    try {
      if (onComment) {
        onComment(post.id, content);
      }
      setContent('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error posting comment' });
    } finally {
      setIsPosting(false);
    }
  };

  if (!loggedInUser) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Post by @{post.author.username}</SheetTitle>
          <SheetDescription>
            Replying to {post.author.name}
          </SheetDescription>
        </SheetHeader>

        {/* Original Post Snippet */}
        <div className="flex gap-3 p-4 border-b -mx-6 px-6">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.author.name}</span>
              <span className="text-sm text-muted-foreground">@{post.author.username}</span>
            </div>
            {post.content && <p className="mt-1">{post.content}</p>}
          </div>
        </div>

        {/* Comment List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4 space-y-6">
            {post.comments.length > 0 ? (
              post.comments.map(comment => (
                <CommentCard key={comment.id} comment={comment} post={post} />
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-10">
                No comments yet. Be the first to reply!
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Comment Input Footer */}
        <SheetFooter className="mt-auto border-t -mx-6 px-6 pt-4 bg-background">
          <div className="flex gap-3 w-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={loggedInUser.avatar_url} alt={loggedInUser.name} />
              <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center gap-2">
              <Textarea
                placeholder="Post your reply"
                className="text-base"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPosting}
              />
              <Button onClick={handleComment} disabled={!content.trim() || isPosting} size="icon">
                {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}