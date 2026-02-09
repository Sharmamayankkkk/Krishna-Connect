'use client';

import React, { useState, useEffect, useRef } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/providers/app-provider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PostCard, PostSkeleton } from '@/components/features/posts/post-card';
import { Separator } from '@/components/ui/separator';
import type { PostType as Post, CommentType as Comment, MediaType as Media } from '@/lib/types';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AuthGate } from '@/components/auth-gate';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { transformPost } from '@/lib/post-utils';

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
    reposts: post_reposts(user_id)
`;

export default function PostView() {
    const params = useParams<{ username: string; id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const { isReady, loggedInUser } = useAppContext();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();

    const postId = Number(params.id);
    const username = params.username;

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
        onDeletePost: () => router.back()
    });

    // Using shared transformPost utility instead of local formatPost

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
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch post.' });
                notFound();
            } else {
                const formattedPost = transformPost(data);
                setPost(formattedPost as any);

                // Log view (fire and forget)
                supabase.rpc('log_post_view', { p_post_id: postId }).then(() => { });
            }
            setIsLoading(false);
        };
        fetchPost();
    }, [postId, isReady, supabase, toast]);

    const handleCommentSubmit = async () => {
        if (!commentContent.trim() || !post) return;
        setIsPostingComment(true);
        toast({ title: 'Comment posted!' });
        setCommentContent('');
        setIsPostingComment(false);
    };

    const handleCommentClick = () => {
        commentInputRef.current?.focus();
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
                    {isLoading || !post ? (
                        <PostSkeleton />
                    ) : (
                        <>
                            <PostCard
                                post={post}
                                isDetailView={true}
                                onLikeToggle={() => handlePostLikeToggle(post)}
                                onRepost={() => handleRepost(post)}
                                onSaveToggle={() => handlePostSaveToggle(post)}
                                onDelete={handlePostDeleted}
                                onEdit={(updatedPost) => setPost(updatedPost as any)}
                                onComment={(_, text, parentId) => {
                                    // Let the internal CommentsSheet handle this
                                }}
                                onCommentLikeToggle={(_, commentId, isReply) => handleCommentLikeToggle(post, commentId, isReply)}
                                onCommentPinToggle={() => { }}
                                onCommentHideToggle={() => { }}
                                onCommentDelete={(_, commentId, isReply, parentId) => handleCommentDelete(post, commentId, isReply, parentId)}
                                onQuotePost={() => { }}
                                onPollVote={(_, optionId) => handlePollVote(post, optionId)}
                                onPromote={() => { }}
                            />

                            <Separator />

                            <div className="p-4 flex gap-3 border-b">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={loggedInUser?.avatar_url} alt={loggedInUser?.name} />
                                    <AvatarFallback>{loggedInUser?.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-3">
                                    <AuthGate className="w-full">
                                        <textarea
                                            ref={commentInputRef}
                                            placeholder={`Replying to @${post.author.username} `}
                                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-base min-h-[3rem] outline-none"
                                            value={commentContent}
                                            onChange={(e) => setCommentContent(e.target.value)}
                                        />
                                    </AuthGate>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleCommentSubmit}
                                            disabled={!commentContent.trim() || isPostingComment}
                                            className="rounded-full"
                                        >
                                            {isPostingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                {post.comments && post.comments.length > 0 ? (
                                    post.comments.map((comment) => {
                                        // Ensure comment has author property for PostCard
                                        const commentWithAuthor = {
                                            ...comment,
                                            author: (comment as any).user || (comment as any).author // fallback
                                        };
                                        return (
                                            <PostCard
                                                key={comment.id}
                                                post={commentWithAuthor as any}
                                                onLikeToggle={() => handleCommentLikeToggle(post, comment.id)}
                                                onComment={() => { }} // Reply to comment?
                                                onDelete={() => handleCommentDelete(post, comment.id)}
                                                onEdit={() => { }}
                                                onSaveToggle={() => { }}
                                                onCommentLikeToggle={() => { }} // Recursive?
                                                onCommentPinToggle={() => { }}
                                                onCommentHideToggle={() => { }}
                                                onCommentDelete={() => { }}
                                                onQuotePost={() => { }}
                                                onRepost={() => { }}
                                                onPollVote={() => { }}
                                                onPromote={() => { }}
                                            />
                                        );
                                    })
                                ) : (
                                    <div className="p-10 text-center">
                                        <p className="text-muted-foreground">
                                            No comments yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </ScrollArea>
        </div>
    );
}
