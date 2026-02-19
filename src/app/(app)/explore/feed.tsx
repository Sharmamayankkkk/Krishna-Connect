"use client";
import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    Users,
    Sidebar,
    Clock,
    ArrowUp
} from 'lucide-react';

import { useAppContext } from '@/providers/app-provider';
import { PostType } from '@/lib/types';
import { CreatePost } from '@/components/features/posts/create-post';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { FeedList } from '@/components/features/posts/feed-list';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PromotePostDialog } from '@/components/promote-post-dialog';
import {
    UserInteractions,
} from '../feed-algorithm';
import { createClient } from '@/lib/supabase/client';
import { GlobalSearchBar } from "@/components/global-search-bar"
import { StoriesBar } from '@/components/features/stories/stories-bar';
import { UploadLeelaFab } from '@/components/features/leela/upload-leela-fab';

// Custom Hooks
import { useInfiniteScroll, useFeedFiltering, type FeedFilter } from './hooks';

// Components
import { FeedSkeleton } from './components/feed-skeleton';
import { EmptyFeedState } from './components/empty-feed-state';
import { TrendingTopicsList } from './components/trending-topics-list';
import { SuggestedUsersWidget } from './components/suggested-users-widget';
import { NewsWidget } from './components/news-widget';
import { MobileDashboard } from './components/mobile-dashboard';
import { transformPost } from './utils';

const POSTS_PER_PAGE = 10;
const SCROLL_THRESHOLD = 500;

// Main Explore Page (Feed)
export default function Feed() {
    const {
        loggedInUser,
    } = useAppContext();
    const { toast } = useToast();

    // Feed filtering with custom hook
    const { feedFilter, handleTabChange } = useFeedFiltering({
        onFilterChange: () => {
            setAllPosts([]); // Clear posts to trigger re-fetch
            setIsInitialLoading(true);
        }
    });

    // Feed state
    const [allPosts, setAllPosts] = React.useState<PostType[]>([]);
    const [visiblePosts, setVisiblePosts] = React.useState<PostType[]>([]);
    const [sortedFeed, setSortedFeed] = React.useState<PostType[]>([]);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [isInitialLoading, setIsInitialLoading] = React.useState(true);
    const [showNewPostsBanner, setShowNewPostsBanner] = React.useState(false);
    const [newPostsCount, setNewPostsCount] = React.useState(0);

    // Promotion Dialog
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
    const [postToPromote, setPostToPromote] = React.useState<PostType | null>(null);

    // User interactions
    const [userInteractions] = React.useState<UserInteractions>({
        userId: loggedInUser?.id || '',
        likedPosts: [],
        savedPosts: [],
        commentedPosts: [],
        viewedPosts: [],
        followedUsers: ['user_2', 'user_3', 'user_8'],
        mutedUsers: [],
        blockedUsers: [],
        mutedWords: [],
        lastSeenPostTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    });

    const newPostsCheckInterval = React.useRef<NodeJS.Timeout | null>(null);

    // Initial fetch from Supabase
    const fetchPosts = React.useCallback(async () => {
        setIsInitialLoading(true);
        const supabase = createClient();

        // Use RPC for secure feed fetching
        // Use RPC based on filter
        const rpcName = feedFilter === 'following' ? 'get_following_feed' : 'get_home_feed';

        const { data, error } = await supabase
            .rpc(rpcName, {
                p_limit: 30,
                p_offset: 0
            });

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
            // Need to fetch associated data (author, likes, etc) since RPC returns raw post rows
            const selectQuery = `
                *,
                author:user_id (id, name, username, avatar_url, verified),
                likes:post_likes(count),
                comments:comments(count),
                reposts:post_reposts(count),
                views:post_views(count),
                post_comments:comments (
                    id,
                    user_id,
                    content,
                    created_at,
                    profiles:user_id (id, name, username, avatar_url, verified)
                ),
                quote_of:quote_of_id (
                    *,
                    author:user_id (id, name, username, avatar_url, verified)
                ),
                user_likes:post_likes!post_id(user_id),
                post_collaborators:post_collaborators!post_id (
                    user_id,
                    status,
                    user:user_id (id, name, username, avatar_url, verified)
                )
            `;

            const { data: enrichedData, error: enrichedError } = await supabase
                .rpc(rpcName, { p_limit: 30, p_offset: 0 })
                .select(selectQuery);

            if (enrichedError) {
                console.error('Error fetching enriched posts:', enrichedError);
                setIsInitialLoading(false);
                return;
            }

            let finalPosts = enrichedData ? enrichedData.map(transformPost) : [];

            // INJECT PROMOTED POSTS
            // Only inject on the first page/load and if we have posts
            if (enrichedData && enrichedData.length > 0) {
                const { data: promoData, error: promoError } = await supabase
                    .rpc('get_active_promoted_posts', { p_limit: 2 })
                    .select(selectQuery);

                if (!promoError && promoData && promoData.length > 0) {
                    const promotedPosts = promoData.map(transformPost);

                    // Filter out promoted posts that might already be in the feed
                    const existingIds = new Set(finalPosts.map((p: PostType) => p.id));
                    const uniquePromos = promotedPosts.filter((p: PostType) => !existingIds.has(p.id));

                    // Inject 1 promo every 5 posts
                    if (uniquePromos.length > 0) {
                        if (finalPosts.length >= 5) {
                            finalPosts.splice(5, 0, uniquePromos[0]);
                            if (uniquePromos.length > 1 && finalPosts.length >= 15) {
                                finalPosts.splice(15, 0, uniquePromos[1]);
                            }
                        } else {
                            // If clean feed is small, just append
                            finalPosts.push(...uniquePromos);
                        }
                    }
                }
            }

            setAllPosts(finalPosts);
            setSortedFeed(finalPosts);
            setVisiblePosts(finalPosts);
        }
        setIsInitialLoading(false);
    }, [toast, feedFilter]);

    React.useEffect(() => {
        fetchPosts();
    }, [fetchPosts, feedFilter]);

    // Reactive Feed Filter: Apply filter when posts or filter settings change
    // NOTE: Intentionally NOT including userInteractions to prevent feed shuffle on like/save
    React.useEffect(() => {
        if (allPosts.length > 0) {
            applyFeedFilter(allPosts, feedFilter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allPosts, feedFilter]); // Only re-run when posts are fetched or filter tab changes


    // Apply feed filter
    const applyFeedFilter = (posts: PostType[], filter: FeedFilter) => {
        // Posts are already filtered by the backend RPC based on the current tab
        // We just need to sort them by date and deduplicate
        let filteredPosts = [...posts].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Deduplicate posts by ID to prevent key collisions
        filteredPosts = filteredPosts.filter((post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );

        setSortedFeed(filteredPosts);
        setVisiblePosts(filteredPosts.slice(0, POSTS_PER_PAGE));
        setHasMore(filteredPosts.length > POSTS_PER_PAGE);
    };

    // Check for new posts from Supabase
    const checkForNewPosts = React.useCallback(async () => {
        if (allPosts.length === 0) return;
        const supabase = createClient();
        const latestPostTime = allPosts.reduce((latest, post) => {
            const postTime = new Date(post.createdAt).getTime();
            return postTime > latest ? postTime : latest;
        }, 0);
        if (latestPostTime === 0) return;

        let query = supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', new Date(latestPostTime).toISOString());

        // Apply following filter if needed
        if (feedFilter === 'following') {
            if (userInteractions.followedUsers.length === 0) return; // No followers, no new posts
            query = query.in('user_id', userInteractions.followedUsers);
        }

        const { count, error } = await query;

        if (error) {
            console.error('Error checking for new posts:', error);
            return;
        }
        if (count && count > 0) {
            setNewPostsCount(count);
            setShowNewPostsBanner(true);
        }
    }, [allPosts, feedFilter, userInteractions.followedUsers]);

    // Check for new posts periodically
    React.useEffect(() => {
        if (!isInitialLoading) {
            newPostsCheckInterval.current = setInterval(() => {
                checkForNewPosts();
            }, 30000);
            return () => {
                if (newPostsCheckInterval.current) {
                    clearInterval(newPostsCheckInterval.current);
                }
            };
        }
    }, [isInitialLoading, checkForNewPosts]);

    // Load new posts from Supabase
    const handleLoadNewPosts = async () => {
        if (allPosts.length === 0) return;
        const supabase = createClient();
        const latestPostTime = allPosts.reduce((latest, post) => {
            const postTime = new Date(post.createdAt).getTime();
            return postTime > latest ? postTime : latest;
        }, 0);

        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (id, name, username, avatar_url, verified)
            `)
            .gt('created_at', new Date(latestPostTime).toISOString())
            .order('created_at', { ascending: false });

        if (feedFilter === 'following') {
            if (userInteractions.followedUsers.length === 0) return;
            query = query.in('user_id', userInteractions.followedUsers);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading new posts:', error);
            toast({
                title: "Error loading new posts",
                description: error.message,
                variant: "destructive"
            });
            return;
        }
        if (data && data.length > 0) {
            const newPosts = data.map(transformPost);
            setAllPosts(prev => [...newPosts, ...prev]);
            toast({
                title: "Feed updated",
                description: `${data.length} new ${data.length === 1 ? 'post' : 'posts'} loaded`
            });
        }
        setShowNewPostsBanner(false);
        setNewPostsCount(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };



    // Load more posts
    const handleLoadMore = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            const currentLength = visiblePosts.length;
            const morePosts = sortedFeed.slice(currentLength, currentLength + POSTS_PER_PAGE);
            setVisiblePosts(prev => [...prev, ...morePosts]);
            if (currentLength + morePosts.length >= sortedFeed.length) {
                setHasMore(false);
            }
            setIsLoadingMore(false);
        }, 500);
    };

    // Infinite scroll with custom hook (after handleLoadMore is defined)
    const { showScrollTop, scrollToTop } = useInfiniteScroll({
        threshold: SCROLL_THRESHOLD,
        isLoading: isLoadingMore,
        hasMore,
        onLoadMore: handleLoadMore,
    });


    // Post handlers
    const handlePostCreated = async () => {
        await fetchPosts();
    };

    const handlePostUpdated = (updatedPost: PostType) => {
        const updatePost = (post: PostType) => {
            if (post.id === updatedPost.id) {
                return updatedPost;
            }
            return post;
        };
        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));
    };

    const handlePostDeleted = (postId: string) => {
        setAllPosts(prev => prev.filter(p => p.id !== postId));
        setVisiblePosts(prev => prev.filter(p => p.id !== postId));
        toast({
            title: "Post deleted",
            description: "Your post has been removed."
        });
    };

    const handleQuotePost = (originalPostId: string, quoteText: string) => {
        if (!loggedInUser) return;
        const originalPost = allPosts.find(p => p.id === originalPostId);
        if (!originalPost) return;
        const newPost: PostType = {
            id: `post_${Date.now()}`,
            author: {
                id: loggedInUser.id,
                name: loggedInUser.name,
                username: loggedInUser.username,
                avatar: loggedInUser.avatar_url
            },
            createdAt: new Date().toISOString(),
            content: quoteText,
            media: [],
            stats: { comments: 0, reshares: 0, reposts: 0, likes: 0, views: 0, bookmarks: 0 },
            comments: [],
            originalPost: (({ originalPost: _, ...cleanPost }) => cleanPost)(originalPost),
            likedBy: [],
            savedBy: [],
            repostedBy: [],
            isPromoted: false,
            poll: undefined,
        };
        const updateOriginalPost = (post: PostType) => {
            if (post.id === originalPostId) {
                return {
                    ...post,
                    stats: { ...post.stats, reshares: post.stats.reshares + 1 }
                };
            }
            return post;
        };
        setAllPosts(prev => [newPost, ...prev.map(updateOriginalPost)]);
        setVisiblePosts(prev => [newPost, ...prev.map(updateOriginalPost)]);
        toast({
            title: "Quote posted!",
            description: "Your quote has been shared"
        });
    };

    const handlePromoteClick = (post: PostType) => {
        setPostToPromote(post);
        setIsPromotionDialogOpen(true);
    };

    const handleConfirmPromotion = (postId: string, budget: number) => {
        const updatePostPromotion = (post: PostType) => {
            if (post.id === postId) {
                return { ...post, isPromoted: true };
            }
            return post;
        };
        setAllPosts(prev => prev.map(updatePostPromotion));
        setVisiblePosts(prev => prev.map(updatePostPromotion));
        toast({
            title: "Post Promotion Started!",
            description: `Your post is now being promoted for $${budget}.`,
        });
    };

    // Mobile Search State
    const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

    return (
        <>
            <PromotePostDialog
                isOpen={isPromotionDialogOpen}
                onClose={() => setIsPromotionDialogOpen(false)}
                post={postToPromote}
                onConfirm={handleConfirmPromotion}
            />

            <div className="flex h-full flex-col">
                {/* Header with Search */}
                {/* Header with Search */}
                {/* Header with Search */}
                <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/60 transition-all duration-200">
                    <div className="flex items-center justify-between px-4 py-3 gap-2 sm:gap-4 overflow-hidden">
                        <div className="flex items-center gap-2 md:hidden min-w-0 flex-1">
                            <SidebarTrigger className="flex-shrink-0" />
                            <h1 className="text-xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent truncate pr-2">Feed</h1>
                        </div>

                        {/* Desktop Title */}
                        <div className="hidden md:block flex-shrink-0">
                            <h1 className="text-xl font-bold tracking-tight">Feed</h1>
                        </div>

                        {/* Search Bar - Centered and Wide on Desktop */}
                        <div className="flex-1 max-w-xl mx-auto hidden md:block px-4">
                            <GlobalSearchBar
                                placeholder="Search..."
                                className="w-full max-w-full"
                            />
                        </div>

                        {/* Mobile Search & Profile Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Mobile Search Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden rounded-full hover:bg-muted"
                                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            >
                                <Search className="h-5 w-5" />
                            </Button>

                            <Link href={`/profile/${loggedInUser?.username || 'me'}`}>
                                <Avatar className="h-9 w-9 ring-2 ring-background transition-transform hover:scale-105">
                                    <AvatarImage src={loggedInUser?.avatar_url || '/placeholder-user.jpg'} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Search Expandable Area */}
                    {isMobileSearchOpen && (
                        <div className="px-4 pb-3 md:hidden animate-in slide-in-from-top-2">
                            <GlobalSearchBar
                                placeholder="Search posts, users..."
                                autoFocus
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Feed Filters / Tabs */}
                    <div className="flex w-full border-t border-border/10">
                        <button
                            onClick={() => handleTabChange('latest')}
                            className="flex-1 relative h-12 flex items-center justify-center hover:bg-muted/30 transition-colors group px-2"
                        >
                            <span className={cn(
                                "text-sm font-medium transition-colors duration-200 whitespace-nowrap truncate",
                                feedFilter === 'latest' ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground/80"
                            )}>
                                For You
                            </span>
                            {feedFilter === 'latest' && (
                                <div className="absolute bottom-0 h-[3px] w-16 bg-primary rounded-t-full layout-id-indicator animate-in fade-in zoom-in-75 duration-300" />
                            )}
                        </button>

                        <div className="w-px h-6 bg-border/20 self-center" />

                        <button
                            onClick={() => handleTabChange('following')}
                            className="flex-1 relative h-12 flex items-center justify-center hover:bg-muted/30 transition-colors group px-2"
                        >
                            <span className={cn(
                                "text-sm font-medium transition-colors duration-200 whitespace-nowrap truncate",
                                feedFilter === 'following' ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground/80"
                            )}>
                                Following
                            </span>
                            {feedFilter === 'following' && (
                                <div className="absolute bottom-0 h-[3px] w-16 bg-primary rounded-t-full layout-id-indicator animate-in fade-in zoom-in-75 duration-300" />
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 container max-w-7xl mx-auto p-0 md:p-4 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* Feed Column */}
                        <div className="col-span-1 lg:col-span-8 xl:col-span-7 w-full min-w-0">
                            {/* Stories Bar - Overflow handled internally but wrapped for safety */}
                            <div className="mb-4 overflow-hidden rounded-lg border bg-background shadow-sm">
                                <StoriesBar />
                            </div>

                            {/* Mobile Dashboard (Widgets) - Visible only on mobile */}
                            <MobileDashboard />

                            {/* New Posts Banner */}
                            {showNewPostsBanner && (
                                <div
                                    className="sticky top-16 z-10 bg-primary text-primary-foreground py-2 text-center cursor-pointer mb-4 rounded-b-lg shadow-md animate-in slide-in-from-top-2"
                                    onClick={handleLoadNewPosts}
                                >
                                    <p className="text-sm font-medium flex items-center justify-center gap-2">
                                        <ArrowUp className="h-4 w-4" />
                                        {newPostsCount} New {newPostsCount === 1 ? 'Post' : 'Posts'}
                                    </p>
                                </div>
                            )}

                            {/* Create Post Input */}
                            <div className="mb-6 px-4 pt-4 md:px-0 md:pt-0">
                                <CreatePost onPostCreated={handlePostCreated} />
                            </div>

                            {/* Loading State */}
                            {isInitialLoading ? (
                                <FeedSkeleton count={3} />
                            ) : visiblePosts.length === 0 ? (
                                <EmptyFeedState
                                    filter={feedFilter}
                                    onSwitchTab={() => handleTabChange('latest')}
                                />
                            ) : (
                                /* Feed List */
                                <FeedList
                                    posts={visiblePosts}
                                    isLoading={isInitialLoading}
                                    isLoadingMore={isLoadingMore}
                                    hasMore={hasMore}
                                    onLoadMore={handleLoadMore}
                                    onPostUpdated={handlePostUpdated}
                                    onPostDeleted={handlePostDeleted}
                                    onQuotePost={handleQuotePost}
                                    onPromote={handlePromoteClick}
                                />
                            )}
                        </div>

                        {/* Right Sidebar - Widgets */}
                        <div className="hidden lg:block lg:col-span-4 xl:col-span-5 space-y-6 sticky top-24">
                            {/* Suggested Users Widget */}
                            <div className="bg-card rounded-xl border p-4 shadow-sm">
                                <SuggestedUsersWidget />
                            </div>

                            {/* Trending Widget */}
                            <div className="bg-card rounded-xl border p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="font-semibold text-sm">Trending Now</h3>
                                </div>
                                <TrendingTopicsList onHashtagClick={(tag: string) => {
                                    // Use window.location or router if available. Feed component doesn't have router hook yet.
                                    // Let's add router hook or just use window for now if router not imported.
                                    // Actually, feed.tsx is a client component, let's use router.
                                    // We need to import useRouter.
                                    window.location.href = `/hashtag/${tag}`;
                                }} />
                            </div>

                            {/* News Widget */}
                            <div className="bg-card rounded-xl border p-4 shadow-sm">
                                <NewsWidget limit={4} />
                            </div>

                            {/* Footer / Links */}
                            <div className="text-xs text-muted-foreground px-4">
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
                                    <span>·</span>
                                    <Link href="/terms-and-conditions" className="hover:underline">Terms</Link>
                                    <span>·</span>
                                    <Link href="/contact-us" className="hover:underline">Contact</Link>
                                    <span>·</span>
                                    <Link href="/faq" className="hover:underline">FAQ</Link>
                                    <span>·</span>
                                    <Link href="/developers" className="hover:underline">Developers</Link>
                                    <span>·</span>
                                    <span>© 2026 Krishna Connect</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Upload Leela FAB */}
                <UploadLeelaFab />

                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="fixed bottom-36 right-4 rounded-full shadow-lg z-50 md:bottom-24"
                        onClick={scrollToTop}
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </>
    );
}