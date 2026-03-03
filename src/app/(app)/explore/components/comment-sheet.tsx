'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Loader2, Heart, MessageSquareReply, Send, MoreHorizontal, Pin, EyeOff, Trash2, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentSheetProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComment?: (postId: string, commentText: string) => void;
}

// Helper to organize flat comments into a tree
const buildCommentTree = (flatComments: any[]): Comment[] => {
  const commentMap = new Map();
  const roots: Comment[] = [];

  // Deduplicate by ID first to prevent any DB-level duplicates from causing UI duplication
  const uniqueComments = Array.from(
    new Map(flatComments.map(c => [c.id, c])).values()
  );

  // First pass: create nodes
  uniqueComments.forEach(c => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  // Second pass: link children to parents
  uniqueComments.forEach(c => {
    if (c.parent_comment_id) {
      const parent = commentMap.get(c.parent_comment_id);
      if (parent) {
        parent.replies.push(commentMap.get(c.id));
      } else {
        // Orphaned comment, treat as root
        roots.push(commentMap.get(c.id));
      }
    } else {
      roots.push(commentMap.get(c.id));
    }
  });

  // Sort: Pinned first, then date
  const sortComments = (nodes: Comment[]) => {
    nodes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    nodes.forEach(node => {
      if (node.replies && node.replies.length > 0) {
        sortComments(node.replies);
      }
    });
  };

  sortComments(roots);
  return roots;
};

// --- Individual Comment Component ---
function CommentCard({
  comment,
  post,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onHide,
  onLikeToggle
}: {
  comment: Comment,
  post: Post,
  depth?: number,
  onReply: (comment: Comment) => void,
  onEdit: (comment: Comment, newText: string) => void,
  onDelete: (commentId: string) => void,
  onPin: (commentId: string, isPinned: boolean) => void,
  onHide: (commentId: string, isHidden: boolean) => void,
  onLikeToggle: (commentId: string, isLiked: boolean) => void
}) {
  const { loggedInUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  // Use local state for immediate feedback on likes, etc? 
  // For now relying on parent re-render or efficient update might be better.
  // But let's use what we have.

  const isLiked = useMemo(() => {
    if (!loggedInUser) return false;
    return comment.likedBy?.includes(loggedInUser.id) || comment.is_liked; // handle both logic types if needed
  }, [comment, loggedInUser]);

  const isAuthor = loggedInUser?.id === comment.user.id;
  const isPostAuthor = loggedInUser?.id === post.author.id;
  const showActions = isAuthor || isPostAuthor;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLikeToggle(comment.id, !isLiked);
  };

  const handleSaveEdit = () => {
    if (editText.trim() !== comment.text) {
      onEdit(comment, editText);
    }
    setIsEditing(false);
  };

  if (comment.isHidden && !isAuthor && !isPostAuthor) return null;

  return (
    <div className={cn("flex flex-col", depth > 0 && "ml-2 sm:ml-8 mt-4 relative")}>
      {depth > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-border/40 rounded-full" />
      )}
      <div className={cn("flex flex-col sm:flex-row gap-2 sm:gap-3 group", comment.isHidden && "opacity-60")}>
        <Link href={`/profile/${comment.user.username}`} className="hidden sm:block">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Link href={`/profile/${comment.user.username}`} className="block sm:hidden flex-shrink-0">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <Link href={`/profile/${comment.user.username}`} className="group/link truncate min-w-0">
                <span className="font-semibold hover:underline text-sm">
                  {comment.user.name}
                </span>
                <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                  @{comment.user.username}
                </span>
              </Link>
              <span className="text-muted-foreground text-xs flex-shrink-0">·</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.editedAt && <span className="text-xs text-muted-foreground flex-shrink-0">(edited)</span>}
              {comment.isPinned && <Pin className="h-3 w-3 fill-primary text-primary rotate-45 flex-shrink-0" />}
              {comment.isHidden && <EyeOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
            </div>

            {/* Actions Dropdown */}
            {loggedInUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                  )}
                  {isPostAuthor && (
                    <>
                      <DropdownMenuItem onClick={() => onPin(comment.id, !comment.isPinned)}>
                        <Pin className="h-4 w-4 mr-2" /> {comment.isPinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onHide(comment.id, !comment.isHidden)}>
                        <EyeOff className="h-4 w-4 mr-2" /> {comment.isHidden ? 'Unhide' : 'Hide'}
                      </DropdownMenuItem>
                    </>
                  )}
                  {(isAuthor || isPostAuthor) && (
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(comment.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm text-foreground/90 mt-0.5 break-words">
              {comment.text}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={handleLike}
              className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-red-500", isLiked ? "text-red-500" : "text-muted-foreground")}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              <span>{comment.likes || 0}</span>
            </button>

            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <MessageSquareReply className="h-3.5 w-3.5" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recurse for replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col mt-2">
          {comment.replies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              post={post}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onHide={onHide}
              onLikeToggle={onLikeToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Comment Sheet Component ---
export function CommentSheet({ post, open, onOpenChange, onComment }: CommentSheetProps) {
  const { loggedInUser } = useAppContext();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Fetch using the new RPC
  const fetchComments = async () => {
    if (!post.id || !open) return;

    const supabase = (await import('@/lib/supabase/client')).createClient();

    const { data, error } = await supabase
      .rpc('get_post_comments', { p_post_id: parseInt(post.id.toString()) });

    if (error) {
      console.error('Error fetching comments:', error);
      toast({ title: 'Fetch Error', description: error.message, variant: 'destructive' });
      return;
    }

    if (data) {
      const formattedComments = data.map((c: any) => ({
        id: c.id,
        text: c.content,
        createdAt: c.created_at,
        editedAt: null, // comments table has no updated_at column
        user: {
          id: c.user_id,
          name: c.user_name,
          username: c.user_username,
          avatar: c.user_avatar_url,
          verified: (c.user_verified === 'verified' || c.user_verified === 'kcs') ? c.user_verified : 'none'
        },
        likes: c.like_count,
        likedBy: [], // is_liked boolean from RPC is used for current-user liked state
        is_liked: c.is_liked,
        replies: [],
        isPinned: c.is_pinned,
        isHidden: c.is_hidden,
        parent_comment_id: c.parent_comment_id
      }));
      setComments(buildCommentTree(formattedComments));
    }
  };

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [post.id, open]);

  // Actions
  const handleComment = async () => {
    if (!content.trim() || !loggedInUser) return;
    setIsPosting(true);

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();

      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: loggedInUser.id,
        content: content,
        parent_comment_id: replyingTo?.id || null
      });

      if (error) throw error;

      // Refetch to show the newly added comment
      await fetchComments();
      setContent('');
      setReplyingTo(null);
      toast({ title: 'Comment posted!' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error posting comment', description: error.message });
    } finally {
      setIsPosting(false);
    }
  };

  const handleEdit = async (comment: Comment, newText: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { error } = await supabase.from('comments').update({ content: newText }).eq('id', comment.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error editing comment' });
    } else {
      fetchComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting comment' });
    } else {
      fetchComments();
    }
  };

  const handlePin = async (commentId: string, isPinned: boolean) => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    // If pinning, unpin others? No, multiple pins allowed usually, or unique? 
    // Let's assume multiple pins allowed for now.
    const { error } = await supabase.from('comments').update({ is_pinned: isPinned }).eq('id', commentId);
    if (error) toast({ variant: 'destructive', title: 'Error updating pin status' });
    else fetchComments();
  };

  const handleHide = async (commentId: string, isHidden: boolean) => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { error } = await supabase.from('comments').update({ is_hidden: isHidden }).eq('id', commentId);
    if (error) toast({ variant: 'destructive', title: 'Error hiding comment' });
    else fetchComments();
  };

  const handleLikeToggle = async (commentId: string, isLiked: boolean) => {
    const supabase = (await import('@/lib/supabase/client')).createClient();

    // Use RPC for atomic toggle if available, otherwise manual insert/delete
    // We have toggle_comment_like RPC from previous context
    const { data, error } = await supabase.rpc('toggle_comment_like', { p_comment_id: parseInt(commentId) });

    if (error) {
      console.error("Like toggle error", error);
      return;
    }
    // Ideally refetch or update local state only
    fetchComments();
  };

  const { requireAuth } = useAuthGuard();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0 gap-0 sm:max-w-3xl sm:mx-auto sm:rounded-t-xl">
        <SheetHeader className="p-4 border-b text-left">
          <SheetTitle>Comments</SheetTitle>
          <SheetDescription className="hidden">Comments section</SheetDescription>
        </SheetHeader>

        {/* Comment List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 pb-20">
            {comments.length > 0 ? (
              comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  post={post}
                  onReply={(c) => setReplyingTo(c)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onHide={handleHide}
                  onLikeToggle={handleLikeToggle}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                <p>No comments yet.</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Comment Input Footer */}
        <SheetFooter className="p-3 border-t bg-background w-full sm:justify-start">
          <div className="flex flex-col w-full gap-2">
            {replyingTo && (
              <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded-md text-xs">
                <span className="truncate">Replying to <span className="font-semibold">@{replyingTo.user.username}</span></span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-3 w-full items-end">
              <Avatar className="h-8 w-8 hidden sm:block">
                <AvatarImage src={loggedInUser?.avatar_url || '/placeholder-user.jpg'} alt={loggedInUser?.name || 'Guest'} />
                <AvatarFallback>{loggedInUser ? loggedInUser.name.charAt(0) : 'G'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                {!loggedInUser ? (
                  <div
                    className="flex-1 border rounded-md px-3 py-2 text-muted-foreground bg-transparent text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => requireAuth(() => { }, "Log in to reply")}
                  >
                    Post your reply
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder={replyingTo ? `Reply to ${replyingTo.user.name}...` : "Post your reply"}
                      className="min-h-[40px] max-h-[100px] resize-none text-sm py-2.5"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isPosting}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                    />
                    <Button onClick={handleComment} disabled={!content.trim() || isPosting} size="icon" className="h-10 w-10 shrink-0">
                      {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
