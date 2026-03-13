'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/providers/app-provider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    ArrowLeft, Loader2, Heart, MessageCircle,
    Quote
} from 'lucide-react';
import { PostCard, PostSkeleton } from '@/components/features/posts/post-card';
import { Separator } from '@/components/ui/separator';
import type { PostType as Post, CommentType as Comment, MediaType as Media } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
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
import { GoogleAd } from '@/components/ads/google-ad';

import { useTranslation } from 'react-i18next';

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
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>· {timeAgo}</span>
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
  const { t } = useTranslation();

    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const { isReady, loggedInUser } = useAppContext();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    // Synchronous guard — prevents a second DB insert before React re-renders.
    const isPostingCommentRef = useRef(false);
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
        if (!commentContent.trim() || !post || isPostingCommentRef.current) return;
        isPostingCommentRef.current = true;
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
            isPostingCommentRef.current = false;
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

    return (
        <div className="flex h-full flex-col">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center gap-4 p-4">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-bold tracking-tight">{t('post.postButton')}</h2>
                </div>
            </header>

            <ScrollArea className="flex-1">
                <main className="max-w-2xl mx-auto pb-20">
                    {isLoading ? (
                        <PostSkeleton />
                    ) : !post ? (
                        <div className="p-10 text-center">
                            <h3 className="text-lg font-semibold">{t('post.postNotFound')}</h3>
                            <p className="text-muted-foreground">{t('post.thisPostMayHaveBeenDeleted')}</p>
                            <Button className="mt-4" onClick={() => router.push('/explore')}>{t('post.goToFeed')}</Button>
                        </div>
                    ) : (
                        <>
                            <PostCard
                                post={post}
                                isDetailView={true}
                                onComment={() => handleCommentClick()}
                                onDelete={handlePostDeleted}
                                onEdit={(updated) => updatePost(updated)}
                                onLikeToggle={() => handlePostLikeToggle(post)}
                                onSaveToggle={() => handlePostSaveToggle(post)}
                                onCommentLikeToggle={(pid, cid) => handleCommentLikeToggle(post, cid)}
                                onCommentPinToggle={() => { }}
                                onCommentHideToggle={() => { }}
                                onCommentDelete={(pid, cid) => handleCommentDelete(post, cid)}
                                onQuotePost={(pid, text) => {
                                    setQuoteText(text);
                                    setIsQuoteOpen(true);
                                }}
                                onRepost={(pid) => handleRepost(post)}
                                onPollVote={(pid, optId) => handlePollVote(post, optId)}
                                onPromote={() => { }}
                            />

                            {/* Reply composer */}
                            <div className="px-4 py-3 flex gap-3 border-b border-t mt-2">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={loggedInUser?.avatar_url} alt={loggedInUser?.name} />
                                    <AvatarFallback>{loggedInUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <AuthGate className="w-full">
                                        <Textarea
                                            ref={commentInputRef}
                                            placeholder={t('explore.postYourReply')}
                                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm min-h-[2.5rem] outline-none placeholder:text-muted-foreground shadow-none p-0"
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
                                        <p className="text-muted-foreground text-sm">{t('post.noRepliesYetBeTheFirst')}</p>
                                    </div>
                                )}
                            </div>

                            <GoogleAd slot="2052584005" />

                            {/* Quote Post Dialog */}
                            <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('dialogs.quotePostTitle')}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        {post && (
                                            <div className="border rounded-md p-3 bg-muted/50 text-sm text-muted-foreground">
                                                <p className="font-semibold">{post.author.name}</p>
                                                <p className="line-clamp-3">{post.content}</p>
                                            </div>
                                        )}
                                        <Textarea
                                            placeholder={t('dialogs.addComment')}
                                            value={quoteText}
                                            onChange={(e) => setQuoteText(e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsQuoteOpen(false)}>{t('common.cancel')}</Button>
                                        <Button onClick={handleQuoteSubmit} disabled={!quoteText.trim()}>{t('dialogs.postQuote')}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </main>
            </ScrollArea>
        </div>
    );
}
