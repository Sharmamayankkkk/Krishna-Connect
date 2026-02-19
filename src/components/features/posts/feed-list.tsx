"use client";

import * as React from 'react';
import { PostType } from '@/lib/types';
import { PostCard, PostSkeleton } from '@/components/features/posts/post-card';
import { PromotedPostCard, getActivePromotions, PromotedContent } from '@/app/(app)/explore/components/promoted-post-card';
import promotedContentData from '@/../public/data/promoted_content.json';
import { GoogleInFeedAd } from '@/components/ads/google-in-feed-ad';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { createClient } from '@/lib/supabase/client';

interface FeedListProps {
    posts: PostType[];
    isLoading: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onPostUpdated: (post: PostType) => void;
    onPostDeleted: (postId: string) => void;
    onQuotePost: (originalPostId: string, quoteText: string) => void;
    onPromote: (post: PostType) => void;
    onPin?: (post: PostType) => void;
    emptyMessage?: string;
}

export function FeedList({
    posts,
    isLoading,
    isLoadingMore = false,
    hasMore = false,
    onLoadMore,
    onPostUpdated,
    onPostDeleted,
    onQuotePost,
    onPromote,
    onPin,
    emptyMessage = "Be the first to share something with the community!"
}: FeedListProps) {
    const { loggedInUser } = useAppContext();
    const [promotions, setPromotions] = React.useState<PromotedContent[]>([]);

    // Load promotions
    // Load promotions
    React.useEffect(() => {
        const rawPromotions = promotedContentData.promotions;
        const mappedPromotions: PromotedContent[] = rawPromotions.map((p: any, index: number) => ({
            id: `promo_${index}`,
            type: (p.type === 'product_showcase' || p.type === 'image_banner') ? p.type : 'product_showcase',
            active: true,
            priority: 1,
            content: {
                text: p.product_name,
                imageUrl: p.image_url,
                author: {
                    name: p.author,
                    username: 'madhavstore',
                    avatar: '/icons/icon-192x192.png',
                    verified: true
                }
            },
            cta: {
                label: 'View Product',
                url: p.direct_store_link
            }
        }));
        const active = getActivePromotions(mappedPromotions);
        setPromotions(active);
    }, []);

    // Map User to UserType for hook compatibility
    const usePostInteractionsUser = loggedInUser ? {
        ...loggedInUser,
        avatar: loggedInUser.avatar_url
    } : null;

    // Integration with usePostInteractions
    const {
        handlePostLikeToggle,
        handleRepost,
        handlePostSaveToggle,
        handlePostDeleted,
        handlePollVote,
        handleCommentLikeToggle,
        handleCommentDelete,
        handleCommentSubmit,
        handleCommentPinToggle,
        handleCommentHideToggle,
        handlePostPinToggle
    } = usePostInteractions({
        loggedInUser: usePostInteractionsUser,
        updatePost: onPostUpdated,
        onDeletePost: onPostDeleted
    });

    // Batch View Logging Logic
    const viewQueue = React.useRef<Set<string>>(new Set());
    const supabase = createClient();

    // Flush queue every 5 seconds
    React.useEffect(() => {
        const interval = setInterval(async () => {
            if (viewQueue.current.size === 0) return;

            const postIds = Array.from(viewQueue.current);
            viewQueue.current.clear(); // Clear immediately to avoid double sending

            try {
                await supabase.rpc('log_post_views_bulk', { p_post_ids: postIds });
            } catch (error) {
                console.error('Failed to log bulk views:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handlePostView = React.useCallback((postId: string | number) => {
        if (typeof postId === 'string') {
            viewQueue.current.add(postId);
        } else {
            viewQueue.current.add(postId.toString());
        }
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="bg-muted/50 rounded-full p-6 mb-4">
                    <svg
                        className="h-12 w-12 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground max-w-sm">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {posts.map((post, index) => {
                // Determine if we should show an ad or promoted content
                const showAd = index > 0 && index % 5 === 0;
                const showPromotion = index > 0 && index % 8 === 0;
                const promotionIndex = Math.floor(index / 8) % promotions.length;

                return (
                    <React.Fragment key={post.id}>
                        {/* Google Ad */}
                        {showAd && (
                            <div className="border-b bg-muted/20">
                                <GoogleInFeedAd />
                            </div>
                        )}

                        {/* Local Promotion (Hardcoded/JSON) */}
                        {showPromotion && promotions.length > 0 && (
                            <div className="border-b border-t border-muted/50">
                                <PromotedPostCard promotion={promotions[promotionIndex]} />
                            </div>
                        )}

                        {/* The Actual Post */}
                        <PostCard
                            post={post}
                            onLikeToggle={() => handlePostLikeToggle(post)}
                            onRepost={() => handleRepost(post)}
                            onSaveToggle={() => handlePostSaveToggle(post)}
                            onDelete={handlePostDeleted}
                            onEdit={onPostUpdated}
                            onComment={(_postId, text, parentId) => handleCommentSubmit(post, text, parentId)}
                            onCommentLikeToggle={(_postId, commentId, isReply) => handleCommentLikeToggle(post, commentId, isReply)}
                            onCommentPinToggle={(_postId, commentId) => handleCommentPinToggle(post, commentId)}
                            onCommentHideToggle={(_postId, commentId, isReply) => handleCommentHideToggle(post, commentId, isReply)}
                            onCommentDelete={(_postId, commentId, isReply, parentId) => handleCommentDelete(post, commentId, isReply, parentId)}
                            onPollVote={(_postId, optionId) => handlePollVote(post, optionId)}
                            onQuotePost={onQuotePost}
                            onPromote={onPromote}
                            onPin={onPin ? () => (onPin ? onPin(post) : handlePostPinToggle(post)) : () => handlePostPinToggle(post)}
                            onView={handlePostView}
                        />
                    </React.Fragment>
                );
            })}

            {/* Load More Indicator */}
            {hasMore ? (
                <div className="p-4 flex justify-center">
                    {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading more...</span>
                        </div>
                    ) : (
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onLoadMore}>
                            Load more posts
                        </Button>
                    )}
                </div>
            ) : (
                <div className="p-8 text-center text-muted-foreground text-sm border-t">
                    You&apos;ve reached the end of the feed!
                </div>
            )}
        </div>
    );
}
