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
import type { Post, Comment } from '@/lib';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Heart, MessageSquareReply, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { QuotedPostCard } from './quoted-post-card'; 
import { useToast } from '@/hooks/use-toast';

interface CommentSheetProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Individual Comment Component ---
function CommentCard({ comment, post }: { comment: Comment, post: Post }) {
  const { loggedInUser, toggleCommentLike } = useAppContext();
  const [isReplying, setIsReplying] = useState(false); // We'll wire this up later

  const isLiked = useMemo(() => {
    if (!loggedInUser) return false;
    return comment.likedBy.includes(loggedInUser.id);
  }, [comment.likedBy, loggedInUser]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof comment.id === 'number') {
      toggleCommentLike(comment, post);
    }
  };

  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.author.username}`}>
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.author.avatar_url} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${comment.author.username}`} className="group">
            <span className="font-semibold hover:underline truncate text-sm">
              {comment.author.name}
            </span>
            <span className="text-sm text-muted-foreground ml-2 truncate">
              @{comment.author.username}
            </span>
          </Link>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-foreground/90 mt-1">
          {comment.content}
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
export function CommentSheet({ post, open, onOpenChange }: CommentSheetProps) {
  const { loggedInUser, createComment } = useAppContext();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();
  
  const handleComment = async () => {
    if (!content.trim() || typeof post.id !== 'number') return;
    setIsPosting(true);
    try {
      await createComment(post.id, content);
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
              <AvatarImage src={post.author.avatar_url} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.author.name}</span>
                    <span className="text-sm text-muted-foreground">@{post.author.username}</span>
                </div>
                {post.content && <p className="mt-1">{post.content}</p>}
                {post.quote_of && <QuotedPostCard post={post.quote_of} />}
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
                minRows={1}
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