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
import type { PostType as Post, CommentType as Comment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Heart, MessageSquareReply, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/use-auth-guard';

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
  const [comments, setComments] = useState<Comment[]>(post.comments || []);

  React.useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  // Fetch comments when sheet opens
  React.useEffect(() => {
    const fetchComments = async () => {
      if (!post.id || !open) return;

      const supabase = (await import('@/lib/supabase/client')).createClient();

      // Toast to confirm fetch start
      // toast({ title: 'Debug', description: `Fetching comments for post ${post.id}` });

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!user_id (*)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        toast({ title: 'Fetch Error', description: error.message, variant: 'destructive' });
        return;
      }

      if (data) {
        // toast({ title: 'Debug', description: `Fetched ${data.length} comments` });
        const formattedComments = data.map((c: any) => ({
          id: c.id,
          text: c.content,
          createdAt: c.created_at,
          user: {
            id: c.profiles?.id || c.user_id,
            name: c.profiles?.name || 'Unknown',
            username: c.profiles?.username || 'unknown',
            avatar: c.profiles?.avatar_url || 'https://github.com/shadcn.png'
          },
          likes: 0,
          likedBy: [],
          replies: [],
          isPinned: false,
          isHidden: false
        }));
        setComments(formattedComments);
      }
    };

    if (open) {
      fetchComments();
    }
  }, [post.id, open]);


  const handleComment = async () => {
    if (!content.trim() || !loggedInUser) return;
    setIsPosting(true);
    try {
      if (onComment) {
        // Optimistic update
        const newComment: Comment = {
          id: `temp-${Date.now()}`,
          text: content,
          createdAt: new Date().toISOString(),
          user: {
            id: loggedInUser.id,
            name: loggedInUser.name,
            username: loggedInUser.username,
            avatar: loggedInUser.avatar_url,
          },
          likes: 0,
          likedBy: [],
          replies: [],
          isPinned: false,
          isHidden: false
        };
        setComments(prev => [...prev, newComment]);

        // We still call onComment to handle the actual server submission via parent if needed,
        // BUT calling parent might not update our local fetch.
        // Ideally we should submit here directly if we are fetching here.
        // For now, let's keep parent handler but also insert directly? 
        // No, parent handler (PostCard) calls onComment which might do the insertion.
        // Let's rely on parent handler for now, but if parent doesn't refresh 'post' prop, we need to handle it.
        onComment(post.id, content);
      }
      setContent('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error posting comment' });
    } finally {
      setIsPosting(false);
    }
  };

  // if (!loggedInUser) return null; // Removed for guest view
  const { requireAuth } = useAuthGuard();

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
            {comments.length > 0 ? (
              comments.map(comment => (
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
              <AvatarImage src={loggedInUser?.avatar_url || '/placeholder-user.jpg'} alt={loggedInUser?.name || 'Guest'} />
              <AvatarFallback>{loggedInUser ? loggedInUser.name.charAt(0) : 'G'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center gap-2">
              {!loggedInUser ? (
                <div
                  className="w-full border rounded-md px-3 py-2 text-muted-foreground bg-transparent text-base sm:text-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => requireAuth(() => { }, "Log in to reply")}
                >
                  Post your reply
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}