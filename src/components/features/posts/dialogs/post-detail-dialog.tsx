'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { Post, Message as Comment, User } from '@/lib/types';
import { useAppContext } from '@/providers/app-provider';
import { Heart, MessageCircle, Send, MoreHorizontal, Bookmark, BookmarkCheck, Share2, Flag, Trash2, Copy, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostDetailDialogProps {
  post: Post | null;
  author: User | null;
  initialComments?: Comment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({ post, author, initialComments = [], open, onOpenChange }: PostDetailDialogProps) {
  console.log('PostDetailDialog rendering. Open:', open, 'Post ID:', post?.id);
  const { loggedInUser } = useAppContext();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const mobileCommentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    if (post) {
      setLikeCount(post.stats?.likes || 0);
      // Check if current user has liked the post
      const userLiked = loggedInUser && post.likes ? post.likes.includes(loggedInUser.id) : false;
      setIsLiked(userLiked);
      setIsSaved(false);
    }
  }, [post, loggedInUser]);

  // Fetch comments when dialog opens
  useEffect(() => {
    const fetchComments = async () => {
      console.log('Fetching comments for post:', post?.id, 'Open:', open);
      if (!post?.id || !open) return;

      const supabase = createClient();
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
        toast({ title: 'Debug: Fetch Error', description: error.message, variant: 'destructive' });
        return;
      }

      console.log('Fetched comments data:', data);

      if (data) {
        // Transform data to match Comment type if needed, or cast if structure matches
        // The type expects 'profiles' property which is joined by user_id
        console.log('Fetched comments:', data);
        setComments(data as unknown as Comment[]);
      } else {
        console.log('Fetched comments but data is null/empty');
      }
    };

    fetchComments();
  }, [post?.id, open]);

  // Log view on open
  useEffect(() => {
    const logView = async () => {
      if (!post?.id) return;
      const supabase = createClient();
      await supabase.rpc('log_post_view', { p_post_id: parseInt(post.id.toString()) });
    };
    if (open && post?.id) {
      logView();
    }
  }, [open, post?.id]);

  // Auto-scroll to bottom when new comments are added (desktop only)
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [comments]);

  // Focus input when dialog opens (desktop)
  useEffect(() => {
    if (open && commentInputRef.current && window.innerWidth >= 768) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Focus input when mobile sheet opens
  useEffect(() => {
    if (isMobileCommentsOpen && mobileCommentInputRef.current) {
      setTimeout(() => mobileCommentInputRef.current?.focus(), 100);
    }
  }, [isMobileCommentsOpen]);

  // Set replying to text
  useEffect(() => {
    if (replyingTo) {
      setNewComment(`@${replyingTo.profiles.username} `);
      if (isMobileCommentsOpen && mobileCommentInputRef.current) {
        mobileCommentInputRef.current.focus();
      } else if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }
  }, [replyingTo, isMobileCommentsOpen]);

  const handlePostComment = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || !loggedInUser || !post) return;

    // Remove @mention prefix if replying
    const commentContent = replyingTo
      ? trimmedText.replace(`@${replyingTo.profiles.username} `, '').trim()
      : trimmedText;

    if (!commentContent) return;

    const supabase = createClient();
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: commentContent,
      created_at: new Date().toISOString(),
      user_id: loggedInUser.id,
      profiles: loggedInUser,
      chat_id: 0,
      attachment_url: null,
      attachment_metadata: null,
      is_edited: false,
      reactions: null,
      read_by: [],
    };

    setComments(prev => [...prev, optimisticComment]);
    setNewComment('');
    setReplyingTo(null);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: loggedInUser.id,
          content: commentContent
        });

      if (error) throw error;

      toast({
        description: "Comment posted",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
      // Optionally revert optimistic update
    }
  };

  const handleDesktopSubmit = () => {
    handlePostComment(newComment);
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePostComment(newComment);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDesktopSubmit();
    }
  };

  const handleLike = async () => {
    if (!loggedInUser || !post) return;

    const supabase = createClient();
    const wasLiked = isLiked;

    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', loggedInUser.id);
        if (error) throw error;
        toast({ description: 'Removed from liked posts' });
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: loggedInUser.id });
        if (error) throw error;
        toast({ description: 'Added to liked posts' });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert UI
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1); // Revert count
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      description: isSaved ? 'Removed from saved posts' : 'Post saved',
    });
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/profile/${author?.username}/post/${post?.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${author?.username}`,
        url: postUrl,
      }).catch(() => {
        navigator.clipboard.writeText(postUrl);
        toast({ description: 'Link copied to clipboard!' });
      });
    } else {
      navigator.clipboard.writeText(postUrl);
      toast({ description: 'Link copied to clipboard!' });
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/profile/${author?.username}/post/${post?.id}`;
    navigator.clipboard.writeText(postUrl);
    toast({ description: 'Link copied to clipboard!' });
  };

  const handleReport = () => {
    toast({
      title: 'Report submitted',
      description: 'Thank you for helping keep our community safe.',
    });
  };

  const handleDelete = () => {
    toast({
      title: 'Post deleted',
      description: 'Your post has been removed.',
    });
    onOpenChange(false);
  };

  const handleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(comment =>
      String(comment.id) === commentId
        ? { ...comment, reactions: comment.reactions ? null : {} }
        : comment
    ));
  };

  const handleCommentDelete = (commentId: string) => {
    setComments(prev => prev.filter(comment => String(comment.id) !== commentId));
    toast({ description: 'Comment deleted' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isPostAuthor = loggedInUser?.id === author?.id;

  const CommentItem = ({ comment, isMobile = false }: { comment: Comment; isMobile?: boolean }) => {
    const isCommentLiked = comment.reactions !== null;
    const isCommentAuthor = loggedInUser?.id === comment.user_id;
    const canDelete = isPostAuthor || isCommentAuthor;

    return (
      <div className="flex items-start gap-3 mb-4 pr-4 group">
        <Link
          href={`/profile/${comment.profiles.username}`}
          onClick={() => {
            if (isMobile) setIsMobileCommentsOpen(false);
            onOpenChange(false);
          }}
        >
          <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity flex-shrink-0">
            <AvatarImage
              src={comment.profiles.avatar_url}
              alt={comment.profiles.username}
            />
            <AvatarFallback>
              {comment.profiles.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <Link
              href={`/profile/${comment.profiles.username}`}
              className="font-semibold mr-1.5 hover:opacity-80 transition-opacity"
              onClick={() => {
                if (isMobile) setIsMobileCommentsOpen(false);
                onOpenChange(false);
              }}
            >
              {comment.profiles.username}
            </Link>
            <span className="break-words">{comment.content}</span>
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{formatTimestamp(comment.created_at)}</span>
            <button
              onClick={() => setReplyingTo(comment)}
              className="font-semibold hover:text-foreground transition-colors"
            >
              Reply
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", isCommentLiked && "text-red-500")}
            onClick={() => handleCommentLike(String(comment.id))}
          >
            <Heart className={cn("h-4 w-4", isCommentLiked && "fill-current")} />
          </Button>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleCommentDelete(String(comment.id))}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const CommentsContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Post Caption */}
      <div className="mb-4 pr-4">
        <Link
          href={`/profile/${author?.username}`}
          className="font-semibold mr-2 hover:opacity-80 transition-opacity"
          onClick={() => {
            if (isMobile) setIsMobileCommentsOpen(false);
            onOpenChange(false);
          }}
        >
          {author?.username}
        </Link>
        <span className="break-words">{post?.content}</span>
      </div>

      {/* Comments */}
      {comments.map((comment: Comment) => (
        <CommentItem key={comment.id} comment={comment} isMobile={isMobile} />
      ))}

      {comments.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-semibold">No comments yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
        </div>
      )}
    </>
  );

  if (!post || !author) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] p-0" aria-describedby="post-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Post by {author.username}</DialogTitle>
          </DialogHeader>
          <div id="post-description" className="sr-only">
            Post by {author.username} with {comments.length} comments
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            {/* Image Section */}
            <div className="bg-black flex items-center justify-center relative overflow-hidden">
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt={`Post by ${author.username}`}
                  className="object-contain w-full h-full max-h-full max-w-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-muted-foreground bg-muted/20">
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Content Section - Desktop */}
            <div className="hidden md:flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <Link
                  href={`/profile/${author.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  onClick={() => onOpenChange(false)}
                >
                  <Avatar>
                    <AvatarImage src={author.avatar_url} alt={author.username} />
                    <AvatarFallback>{author.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{author.username}</span>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More options">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isPostAuthor ? (
                      <>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Post
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
                          <Flag className="mr-2 h-4 w-4" />
                          Report
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Comments Section */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <CommentsContent />
              </ScrollArea>

              <Separator />

              {/* Actions Section */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLike}
                      aria-label={isLiked ? "Unlike post" : "Like post"}
                      className="hover:scale-110 transition-transform"
                    >
                      <Heart
                        className={cn(
                          "h-6 w-6 transition-colors",
                          isLiked && "fill-red-500 text-red-500"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => commentInputRef.current?.focus()}
                      aria-label="Comment on post"
                      className="hover:scale-110 transition-transform"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      aria-label="Share post"
                      className="hover:scale-110 transition-transform"
                    >
                      <Share2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    aria-label={isSaved ? "Unsave post" : "Save post"}
                    className="hover:scale-110 transition-transform"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-6 w-6" />
                    ) : (
                      <Bookmark className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                <p className="text-sm font-semibold">
                  {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: new Date(post.created_at).getFullYear() !== new Date().getFullYear()
                      ? 'numeric'
                      : undefined
                  })}
                </p>
              </div>

              <Separator />

              {/* Comment Input */}
              <div className="p-4">
                {replyingTo && (
                  <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                    <span>Replying to @{replyingTo.profiles.username}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    ref={commentInputRef}
                    placeholder={replyingTo ? `Reply to ${replyingTo.profiles.username}...` : "Add a comment..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    aria-label="Write a comment"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleDesktopSubmit}
                    disabled={!newComment.trim()}
                    aria-label="Post comment"
                    className="hover:scale-105 transition-transform"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Actions - Only visible on small screens */}
            <div className="md:hidden flex flex-col">
              <Separator />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLike}
                      aria-label={isLiked ? "Unlike post" : "Like post"}
                      className="hover:scale-110 transition-transform"
                    >
                      <Heart
                        className={cn(
                          "h-6 w-6 transition-colors",
                          isLiked && "fill-red-500 text-red-500"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileCommentsOpen(true)}
                      aria-label="View comments"
                      className="hover:scale-110 transition-transform"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      aria-label="Share post"
                      className="hover:scale-110 transition-transform"
                    >
                      <Share2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    aria-label={isSaved ? "Unsave post" : "Save post"}
                    className="hover:scale-110 transition-transform"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-6 w-6" />
                    ) : (
                      <Bookmark className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                <p className="text-sm font-semibold">
                  {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
                </p>
                <button
                  onClick={() => setIsMobileCommentsOpen(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  View all {comments.length} comments
                </button>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: new Date(post.created_at).getFullYear() !== new Date().getFullYear()
                      ? 'numeric'
                      : undefined
                  })}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Comments Sheet */}
      <Sheet open={isMobileCommentsOpen} onOpenChange={(open) => {
        setIsMobileCommentsOpen(open);
        if (!open) setReplyingTo(null);
      }}>
        <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
          <SheetHeader className="text-center p-4 border-b">
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <CommentsContent isMobile={true} />
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                <span>Replying to @{replyingTo.profiles.username}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setReplyingTo(null);
                    setNewComment('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <form onSubmit={handleMobileSubmit} className="flex items-center gap-2 w-full">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={loggedInUser?.avatar_url} />
                <AvatarFallback>{loggedInUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input
                ref={mobileCommentInputRef}
                placeholder={replyingTo ? `Reply to ${replyingTo.profiles.username}...` : "Add a comment..."}
                className="flex-1 rounded-full"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full flex-shrink-0"
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
