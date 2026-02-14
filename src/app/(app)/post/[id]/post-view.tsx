'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/providers/app-provider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    ArrowLeft, Loader2, Heart, MessageCircle, Repeat2,
    Share2, BarChart3, Bookmark, MoreHorizontal, Image as ImageIcon, Quote
} from 'lucide-react';
import { PostCard, PostSkeleton } from '@/components/features/posts/post-card';
import { Separator } from '@/components/ui/separator';
import type { PostType as Post, CommentType as Comment, MediaType as Media } from '@/lib/types';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AuthGate } from '@/components/auth-gate';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { transformPost } from '@/lib/post-utils';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { VerificationBadge } from '@/components/shared/verification-badge';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const POST_QUERY = `
    id,
    user_id,
    content,
    views_count,
    media_urls,
    poll,
    quote_of_id,
    created_at,
    pinned_at,
    author: profiles!posts_user_id_fkey(id, username, name, avatar_url, verified, is_private),
    quote_of:quote_of_id(
        id,
        user_id,
        content,
        media_urls,
        created_at,
        author: profiles!posts_user_id_fkey(id, username, name, avatar_url, verified, is_private)
    ),
    comments(
        id,
        content,
        created_at,
        user_id,
        parent_comment_id,
        user: profiles!comments_user_id_fkey(id, username, name, avatar_url, verified),
        likes: comment_likes(user_id)
    ),
    likes: post_likes(user_id),
    reposts: post_reposts(user_id),
    bookmarks: bookmarks(user_id)
`;

function ThreadComment({ comment, onLike, currentUserId }: {
    comment: Comment;
    onLike: (commentId: string) => void;
    currentUserId?: string;
}) {
    const isLiked = currentUserId ? comment.likedBy?.includes(currentUserId) : false;
    const timeAgo = comment.createdAt
        ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false })
        : '';

    return (
        <div className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <Link href={`/profile/${comment.user?.username}`} className="shrink-0">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} />
                    <AvatarFallback className="text-xs">{comment.user?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/profile/${comment.user?.username}`} className="font-semibold text-sm hover:underline truncate">
                        {comment.user?.name}
                    </Link>
                    {comment.user?.verified && comment.user.verified !== 'none' && (
                        <VerificationBadge verified={comment.user.verified} size={14} />
                    )}
                    <span className="text-xs text-muted-foreground">@{comment.user?.username}</span>
                    <span className="text-xs text-muted-foreground">· {timeAgo}</span>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
                <div className="flex items-center gap-4 mt-1.5">
                    <button
                        onClick={() => onLike(comment.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                    >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PostView() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const { isReady, loggedInUser } = useAppContext();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [showRepostMenu, setShowRepostMenu] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [quoteText, setQuoteText] = useState('');
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();

    const postId = Number(params.id);

    const updatePost = (updatedPost: Post) => {
        setPost(updatedPost);
    };

    const interactionUser = loggedInUser ? {
        id: loggedInUser.id,
        name: loggedInUser.name,
        username: loggedInUser.username,
        avatar: loggedInUser.avatar_url,
        verified: loggedInUser.is_verified
    } : null;

    const {
        handlePostLikeToggle,
        handleRepost,
        handlePostSaveToggle,
        handlePostDeleted,
        handlePollVote,
        handleCommentLikeToggle,
        handleCommentDelete
    } = usePostInteractions({
        loggedInUser: interactionUser,
        updatePost,
        onDeletePost: () => router.push('/explore')
    });

    useEffect(() => {
        if (!isReady) return;
        if (isNaN(postId)) {
            notFound();
            return;
        }

        const fetchPost = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select(POST_QUERY)
                .eq('id', postId)
                .single();

            if (error || !data) {
                setIsLoading(false);
                return;
            } else {
                const formattedPost = transformPost(data);
                setPost(formattedPost as any);
                supabase.rpc('log_post_view', { p_post_id: postId }).then(() => { });
            }
            setIsLoading(false);
        };
        fetchPost();
    }, [postId, isReady, supabase, toast]);

    const handleCommentSubmit = async () => {
        if (!commentContent.trim() || !post) return;
        setIsPostingComment(true);

        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: post.id,
                    user_id: loggedInUser?.id,
                    content: commentContent
                })
                .select(`
                    id,
                    content,
                    created_at,
                    user_id,
                    parent_comment_id,
                    user: profiles!comments_user_id_fkey(id, username, name, avatar_url, verified),
                    likes: comment_likes(user_id)
                `)
                .single();

            if (error) throw error;

            toast({ title: 'Reply posted!' });
            setCommentContent('');

            if (data) {
                const newComment = {
                    ...data,
                    author: data.user,
                    likes: []
                };

                setPost(prev => prev ? ({
                    ...prev,
                    comments: [...(prev.comments || []), newComment as any],
                    stats: {
                        ...prev.stats,
                        comments: (prev.stats?.comments || 0) + 1
                    }
                }) : null);
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to post reply' });
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleCommentClick = () => {
        commentInputRef.current?.focus();
    };

    const handleQuoteSubmit = async () => {
        if (!loggedInUser || !post || !quoteText.trim()) return;
        try {
            const { error } = await supabase.from('posts').insert({
                user_id: loggedInUser.id,
                content: quoteText.trim(),
                quote_of_id: parseInt(post.id),
            });
            if (error) throw error;
            setPost({
                ...post,
                stats: { ...post.stats, reposts: post.stats.reposts + 1 },
            });
            toast({ title: 'Quote posted!' });
        } catch (error) {
            console.error('Error quoting post:', error);
            toast({ title: 'Error posting quote', variant: 'destructive' });
        } finally {
            setQuoteText('');
            setIsQuoteOpen(false);
        }
    };

    const formatFullDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return format(d, "h:mm a · MMM d, yyyy");
        } catch {
            return dateStr;
        }
    };

    const formatCount = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    return (
        <div className="flex h-full flex-col">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center gap-4 p-4">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold tracking-tight">Post</h2>
                </div>
            </header>

            <ScrollArea className="flex-1">
                <main className="max-w-2xl mx-auto pb-20">
                    {isLoading ? (
                        <PostSkeleton />
                    ) : !post ? (
                        <div className="p-10 text-center">
                            <h3 className="text-lg font-semibold">Post not found</h3>
                            <p className="text-muted-foreground">This post may have been deleted or does not exist.</p>
                            <Button className="mt-4" onClick={() => router.push('/explore')}>Go to Feed</Button>
                        </div>
                    ) : (
                        <>
                            {/* Quoted/Original Post Thread */}
                            {post.originalPost && (
                                <div className="border-b">
                                    <div className="flex gap-3 px-4 pt-4 pb-2">
                                        <div className="flex flex-col items-center">
                                            <Link href={`/profile/${post.originalPost.author?.username}`}>
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={post.originalPost.author?.avatar} alt={post.originalPost.author?.name} />
                                                    <AvatarFallback>{post.originalPost.author?.name?.charAt(0) || '?'}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            {/* Thread line connecting to reply */}
                                            <div className="w-0.5 flex-1 bg-border mt-1 min-h-[20px]" />
                                        </div>
                                        <div className="flex-1 min-w-0 pb-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Link href={`/profile/${post.originalPost.author?.username}`} className="font-bold text-sm hover:underline">
                                                    {post.originalPost.author?.name}
                                                </Link>
                                                {post.originalPost.author?.verified && post.originalPost.author.verified !== 'none' && (
                                                    <VerificationBadge verified={post.originalPost.author.verified} size={15} />
                                                )}
                                                <span className="text-sm text-muted-foreground">@{post.originalPost.author?.username}</span>
                                                <span className="text-sm text-muted-foreground">·</span>
                                                <Link href={`/post/${post.originalPost.id}`} className="text-sm text-muted-foreground hover:underline">
                                                    {post.originalPost.createdAt ? formatDistanceToNow(new Date(post.originalPost.createdAt), { addSuffix: false }) : ''}
                                                </Link>
                                            </div>
                                            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{post.originalPost.content}</p>
                                            {post.originalPost.media && post.originalPost.media.length > 0 && (
                                                <div className="mt-2 rounded-xl overflow-hidden border">
                                                    {post.originalPost.media[0].type === 'video' ? (
                                                        <video src={post.originalPost.media[0].url} controls className="w-full max-h-64 object-cover" />
                                                    ) : (
                                                        <img src={post.originalPost.media[0].url} alt="Quoted media" className="w-full max-h-64 object-cover" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Post */}
                            <div className="px-4 pt-3">
                                {/* Author header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <Link href={`/profile/${post.author.username}`}>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                                                <AvatarFallback>{post.author.name?.charAt(0) || '?'}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <Link href={`/profile/${post.author.username}`} className="font-bold hover:underline">
                                                    {post.author.name}
                                                </Link>
                                                {post.author.verified && post.author.verified !== 'none' && (
                                                    <VerificationBadge verified={post.author.verified} size={16} />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">@{post.author.username}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full -mr-2">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Post content - larger text for detail view */}
                                <div className="mt-3">
                                    <p className="text-base sm:text-lg whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
                                </div>

                                {/* Media */}
                                {post.media && post.media.length > 0 && (
                                    <div className="mt-3 rounded-2xl overflow-hidden border">
                                        <div className={`grid ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5`}>
                                            {post.media.map((m, i) => (
                                                <div key={i} className={`relative ${post.media.length === 1 ? 'max-h-[512px]' : post.media.length === 3 && i === 0 ? 'row-span-2' : ''} overflow-hidden bg-muted`}>
                                                    {m.type === 'video' ? (
                                                        <video src={m.url} controls className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={m.url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timestamp */}
                                <div className="mt-3 pb-3 border-b">
                                    <span className="text-sm text-muted-foreground">
                                        {formatFullDate(post.createdAt)}
                                    </span>
                                </div>

                                {/* Engagement stats bar */}
                                {(post.stats.likes > 0 || post.stats.reposts > 0 || post.stats.views > 0 || post.stats.bookmarks > 0) && (
                                    <div className="flex items-center gap-4 py-3 border-b text-sm">
                                        {post.stats.reposts > 0 && (
                                            <div>
                                                <span className="font-bold">{formatCount(post.stats.reposts)}</span>
                                                <span className="text-muted-foreground ml-1">Reposts</span>
                                            </div>
                                        )}
                                        {post.stats.likes > 0 && (
                                            <div>
                                                <span className="font-bold">{formatCount(post.stats.likes)}</span>
                                                <span className="text-muted-foreground ml-1">Likes</span>
                                            </div>
                                        )}
                                        {post.stats.views > 0 && (
                                            <div>
                                                <span className="font-bold">{formatCount(post.stats.views)}</span>
                                                <span className="text-muted-foreground ml-1">Views</span>
                                            </div>
                                        )}
                                        {post.stats.bookmarks > 0 && (
                                            <div>
                                                <span className="font-bold">{formatCount(post.stats.bookmarks)}</span>
                                                <span className="text-muted-foreground ml-1">Bookmarks</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action bar */}
                                <div className="flex items-center justify-around py-2 border-b">
                                    <button
                                        onClick={handleCommentClick}
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"
                                    >
                                        <MessageCircle className="h-5 w-5" />
                                    </button>
                                    <DropdownMenu open={showRepostMenu} onOpenChange={setShowRepostMenu}>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className={`flex items-center gap-1.5 transition-colors p-2 rounded-full hover:bg-green-500/10 ${post.repostedBy?.includes(loggedInUser?.id || '') ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'}`}
                                            >
                                                <Repeat2 className="h-5 w-5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center">
                                            <DropdownMenuItem onClick={() => { handleRepost(post); setShowRepostMenu(false); }}>
                                                <Repeat2 className="mr-2 h-4 w-4" />
                                                {post.repostedBy?.includes(loggedInUser?.id || '') ? 'Undo Repost' : 'Repost'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setShowRepostMenu(false); setIsQuoteOpen(true); }}>
                                                <Quote className="mr-2 h-4 w-4" />
                                                Quote Post
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <button
                                        onClick={() => handlePostLikeToggle(post)}
                                        className={`flex items-center gap-1.5 transition-colors p-2 rounded-full hover:bg-rose-500/10 ${post.likedBy?.includes(loggedInUser?.id || '') ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${post.likedBy?.includes(loggedInUser?.id || '') ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => handlePostSaveToggle(post)}
                                        className={`flex items-center gap-1.5 transition-colors p-2 rounded-full hover:bg-blue-500/10 ${post.savedBy?.includes(loggedInUser?.id || '') ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}`}
                                    >
                                        <Bookmark className={`h-5 w-5 ${post.savedBy?.includes(loggedInUser?.id || '') ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ url: window.location.href });
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                toast({ title: 'Link copied!' });
                                            }
                                        }}
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Reply composer */}
                            <div className="px-4 py-3 flex gap-3 border-b">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={loggedInUser?.avatar_url} alt={loggedInUser?.name} />
                                    <AvatarFallback>{loggedInUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <AuthGate className="w-full">
                                        <textarea
                                            ref={commentInputRef}
                                            placeholder="Post your reply"
                                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm min-h-[2.5rem] outline-none placeholder:text-muted-foreground"
                                            value={commentContent}
                                            onChange={(e) => setCommentContent(e.target.value)}
                                            rows={1}
                                        />
                                    </AuthGate>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleCommentSubmit}
                                            disabled={!commentContent.trim() || isPostingComment}
                                            size="sm"
                                            className="rounded-full px-4"
                                        >
                                            {isPostingComment && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments / Thread */}
                            <div>
                                {post.comments && post.comments.length > 0 ? (
                                    post.comments.map((comment) => (
                                        <ThreadComment
                                            key={comment.id}
                                            comment={comment}
                                            onLike={(commentId) => handleCommentLikeToggle(post, commentId)}
                                            currentUserId={loggedInUser?.id}
                                        />
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                        <p className="text-muted-foreground text-sm">
                                            No replies yet. Be the first to reply!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </ScrollArea>

            {/* Quote Post Dialog */}
            <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quote Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {post && (
                            <div className="border rounded-md p-3 bg-muted/50 text-sm text-muted-foreground">
                                <p className="font-semibold">{post.author.name}</p>
                                <p className="line-clamp-3">{post.content}</p>
                            </div>
                        )}
                        <Textarea
                            placeholder="Add a comment..."
                            value={quoteText}
                            onChange={(e) => setQuoteText(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsQuoteOpen(false)}>Cancel</Button>
                        <Button onClick={handleQuoteSubmit} disabled={!quoteText.trim()}>Post Quote</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
