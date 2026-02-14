"use client";

import * as React from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { PostType } from '@/lib/types';
import { CreatePost } from '@/components/features/posts/create-post';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { PromotePostDialog } from '@/components/promote-post-dialog';
import { generateFeed, UserInteractions, updateLastSeenTime } from '../feed-algorithm';
import { createClient } from '@/lib/supabase/client';
import { FeedList } from '@/components/features/posts/feed-list';
import { StoriesBar } from '@/components/features/stories/stories-bar';
import { transformPost } from '@/lib/post-utils';

const SCROLL_THRESHOLD = 500;

export default function FeedPage() {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    const [allPosts, setAllPosts] = React.useState<PostType[]>([]);
    const [visiblePosts, setVisiblePosts] = React.useState<PostType[]>([]);
    const [isInitialLoading, setIsInitialLoading] = React.useState(true);
    const [showNewPostsBanner, setShowNewPostsBanner] = React.useState(false);
    const [newPostsCount, setNewPostsCount] = React.useState(0);
    const [showScrollTop, setShowScrollTop] = React.useState(false);

    // Promotion Dialog
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
    const [postToPromote, setPostToPromote] = React.useState<PostType | null>(null);

    // User interactions for algorithm
    const [userInteractions, setUserInteractions] = React.useState<UserInteractions>({
        userId: loggedInUser?.id || '',
        likedPosts: [],
        savedPosts: [],
        commentedPosts: [],
        viewedPosts: [],
        followedUsers: [],
        mutedUsers: [],
        blockedUsers: [],
        mutedWords: [],
        lastSeenPostTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    });

    // Fetch posts
    const fetchPosts = React.useCallback(async () => {
        setIsInitialLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .rpc('get_home_feed', { p_limit: 50, p_offset: 0 })
            .select(`
                *,
                author:profiles!user_id(*),
                post_comments:comments(
                    id,
                    content,
                    created_at,
                    user_id,
                    profiles:profiles!comments_user_id_fkey(
                        id,
                        name,
                        username,
                        avatar_url,
                        verified
                    )
                ),
                likes:post_likes(count),
                reposts:post_reposts(count),
                views:post_views(count),
                user_likes:post_likes!post_id(user_id)
            `);

        if (error) {
            console.error('Error fetching posts:', error);
            toast({
                title: "Error fetching posts",
                description: error.message,
                variant: "destructive"
            });
            setIsInitialLoading(false);
            return;
        }

        if (data) {
            const transformedPosts = data.map(transformPost);
            setAllPosts(transformedPosts);

            // Generate "For You" feed
            const { feed, hasNewPosts, newPostsCount: newCount } = generateFeed(
                transformedPosts,
                userInteractions,
                'for_you'
            );

            setVisiblePosts(feed);
            setShowNewPostsBanner(hasNewPosts);
            setNewPostsCount(newCount);
        }
        setIsInitialLoading(false);
    }, [toast, userInteractions]);

    React.useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Scroll detection
    React.useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            setShowScrollTop(scrollTop > SCROLL_THRESHOLD);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLoadNewPosts = () => {
        setShowNewPostsBanner(false);
        setUserInteractions(prev => updateLastSeenTime(prev));
        scrollToTop();
        fetchPosts();
    };

    // FeedList callbacks
    const handlePostUpdated = (updatedPost: PostType) => {
        setVisiblePosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    const handlePostDeleted = (postId: string) => {
        setVisiblePosts(prev => prev.filter(p => p.id !== postId));
    };

    const handleQuotePost = async (originalPostId: string, quoteText: string) => {
        // Handle quote post logic
    };

    const handlePromote = (post: PostType) => {
        setPostToPromote(post);
        setIsPromotionDialogOpen(true);
    };

    const handleConfirmPromotion = (postId: string, budget: number) => {
        setVisiblePosts(prev => prev.map(p =>
            p.id === postId ? { ...p, isPromoted: true } : p
        ));
        toast({
            title: "Post Promotion Started!",
            description: `Your post is now being promoted.`,
        });
    };

    return (
        <>
            <PromotePostDialog
                isOpen={isPromotionDialogOpen}
                onClose={() => setIsPromotionDialogOpen(false)}
                post={postToPromote}
                onConfirm={handleConfirmPromotion}
            />

            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="flex items-center gap-4 p-4">
                        <SidebarTrigger className="md:hidden" />
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h1 className="text-xl font-bold">For You</h1>
                        </div>
                    </div>
                </header>

                {/* Stories Bar */}
                <StoriesBar />

                {/* Main Content */}
                <div className="flex-1 container max-w-2xl mx-auto p-0 md:p-4">
                    {/* New Posts Banner */}
                    {showNewPostsBanner && (
                        <div
                            className="sticky top-16 z-10 bg-primary text-primary-foreground py-2 text-center cursor-pointer mb-4 rounded-b-lg shadow-md animate-in slide-in-from-top-2"
                            onClick={handleLoadNewPosts}
                        >
                            <p className="text-sm font-medium flex items-center justify-center gap-2">
                                <ArrowUp className="h-4 w-4" />
                                {newPostsCount} new post{newPostsCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {/* Create Post */}
                    <div className="bg-card rounded-xl border shadow-sm mb-4">
                        <CreatePost
                            onPostCreated={(newPost) => {
                                if (typeof newPost !== 'string') {
                                    setVisiblePosts(prev => [newPost, ...prev]);
                                }
                            }}
                        />
                    </div>

                    {/* Feed */}
                    <FeedList
                        posts={visiblePosts}
                        isLoading={isInitialLoading}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                        onQuotePost={handleQuotePost}
                        onPromote={handlePromote}
                    />
                </div>

                {/* Scroll to Top */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </button>
                )}
            </div>
        </>
    );
}
