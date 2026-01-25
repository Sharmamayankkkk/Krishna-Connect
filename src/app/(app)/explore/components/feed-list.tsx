"use client";

import * as React from 'react';
import { PostType } from '@/lib/types';
import { PostCard, PostSkeleton } from '@/components/features/posts/post-card';
import { PromotedPostCard, getActivePromotions, PromotedContent } from '../components/promoted-post-card';
import promotedContentData from '@/../public/data/promoted_content.json';
import { GoogleInFeedAd } from '@/components/ads/google-in-feed-ad';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { usePostInteractions } from '@/hooks/use-post-interactions';

interface FeedListProps {
    posts: PostType[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    onLoadMore?: () => void;
    onPostUpdated: (post: PostType) => void;
    onPostDeleted: (postId: string) => void;
    onQuotePost: (originalPostId: string, quoteText: string) => void;
    onPromote: (post: PostType) => void;
}

export function FeedList({
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    onLoadMore,
    onPostUpdated,
    onPostDeleted,
    onQuotePost,
    onPromote
}: FeedListProps) {
    const { loggedInUser } = useAppContext();
    const [promotions, setPromotions] = React.useState<PromotedContent[]>([]);

    // Load promotions
    React.useEffect(() => {
        const active = getActivePromotions(promotedContentData.promotions as PromotedContent[]);
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
        handleCommentHideToggle
    } = usePostInteractions({
        loggedInUser: usePostInteractionsUser,
        updatePost: onPostUpdated,
        onDeletePost: onPostDeleted
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-muted/50 rounded-full p-6 mb-4">
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                </div>
                <h3 className="text-xl font-semibold">No posts yet</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Be the first to share something with the community!
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
                    You've reached the end of the feed!
                </div>
            )}
        </div>
    );
}
