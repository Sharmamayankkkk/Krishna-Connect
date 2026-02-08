"use client";
import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Imports update at the top
import {
    Search,
    TrendingUp,
    Users,
    Sparkles,
    Flame,
    Home,
    Sidebar,
    Clock,
    ArrowUp
} from 'lucide-react';

import { useAppContext } from '@/providers/app-provider';
import { PostType, NotificationType } from '@/lib/types';
import { CreatePost } from '@/components/features/posts/create-post';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PromotePostDialog } from '@/components/promote-post-dialog';
import {
    generateSmartFeed,
    UserInteractions,
    updateLastSeenTime
} from '../feed-algorithm';
import { createClient } from '@/lib/supabase/client';
import { GlobalSearchBar } from "@/components/global-search-bar"
import { FeedList } from '@/components/features/posts/feed-list';
import { TrendingTopicsList } from './components/trending-topics-list';
import { UserCard } from './components/user-card';
import { transformPost } from './utils';
import { StoriesBar } from '@/components/features/stories/stories-bar';

const POSTS_PER_PAGE = 10;
const SCROLL_THRESHOLD = 500;

type FeedFilter = 'following' | 'latest';
type ExploreMode = 'feed' | 'search' | 'discover';

// Main Explore Page (Feed)
export default function Feed() {
    const {
        loggedInUser,
    } = useAppContext();
    const { toast } = useToast();
    const router = useRouter();

    // Mode management
    const [exploreMode, setExploreMode] = React.useState<ExploreMode>('feed');

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentTab = searchParams.get('tab') as FeedFilter || 'latest';

    // Feed state
    const [allPosts, setAllPosts] = React.useState<PostType[]>([]);
    const [visiblePosts, setVisiblePosts] = React.useState<PostType[]>([]);
    const [sortedFeed, setSortedFeed] = React.useState<PostType[]>([]);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [isInitialLoading, setIsInitialLoading] = React.useState(true);
    const [feedFilter, setFeedFilter] = React.useState<FeedFilter>(currentTab);
    const [showNewPostsBanner, setShowNewPostsBanner] = React.useState(false);

    // Update URL when filter changes
    const handleTabChange = (tab: FeedFilter) => {
        setFeedFilter(tab);
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
        setAllPosts([]); // Clear posts to trigger re-fetch
        setIsInitialLoading(true);
    };

    // Sync state if URL changes externally (e.g. back button)
    React.useEffect(() => {
        if (currentTab !== feedFilter) {
            setFeedFilter(currentTab);
            setAllPosts([]);
            setIsInitialLoading(true);
        }
    }, [currentTab]);
    const [newPostsCount, setNewPostsCount] = React.useState(0);
    const [showScrollTop, setShowScrollTop] = React.useState(false);

    // Promotion Dialog
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
    const [postToPromote, setPostToPromote] = React.useState<PostType | null>(null);

    // User interactions
    const [userInteractions, setUserInteractions] = React.useState<UserInteractions>({
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

    const [suggestedUsers, setSuggestedUsers] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchSuggested = async () => {
            // ... implementation ...
            if (exploreMode !== 'discover') return;
            // ... existing code ...
            if (exploreMode !== 'discover') return;
            const supabase = createClient();
            const { data, error } = await supabase.rpc('get_who_to_follow', { limit_count: 4 });
            if (!error && data) {
                // Enhance with dummy follower counts if missing from view
                const enhanced = data.map((u: any) => ({
                    ...u,
                    followers: Math.floor(Math.random() * 1000) + 100, // Mock count for now
                    avatar: u.avatar_url || '/placeholder-user.jpg'
                }));
                setSuggestedUsers(enhanced);
            }
        };
        fetchSuggested();
    }, [exploreMode]);

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

    // Initialize Notifications (Empty for now until real notifications implemented)


    // Reactive Feed Filter: Apply filter when posts or filter settings change
    // NOTE: Intentionally NOT including userInteractions to prevent feed shuffle on like/save
    React.useEffect(() => {
        if (allPosts.length > 0) {
            applyFeedFilter(allPosts, feedFilter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allPosts, feedFilter]); // Only re-run when posts are fetched or filter tab changes


    // Scroll detection
    React.useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            setShowScrollTop(scrollTop > SCROLL_THRESHOLD);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        if (!isInitialLoading && exploreMode === 'feed') {
            newPostsCheckInterval.current = setInterval(() => {
                checkForNewPosts();
            }, 30000);
            return () => {
                if (newPostsCheckInterval.current) {
                    clearInterval(newPostsCheckInterval.current);
                }
            };
        }
    }, [isInitialLoading, exploreMode, checkForNewPosts]);

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

    // Scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFollowUser = (userId: string) => {
        toast({
            title: "Following",
            description: "You are now following this user"
        });
    };

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
                <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="flex items-center gap-4 p-4">
                        <SidebarTrigger className={cn("md:hidden", isMobileSearchOpen && "hidden")} />

                        {/* Mode Toggle */}
                        <div className={cn("flex gap-2 mr-2", isMobileSearchOpen ? "hidden md:flex" : "flex")}>
                            <Button
                                variant={exploreMode === 'feed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setExploreMode('feed');
                                }}
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Feed
                            </Button>
                            <Button
                                variant={exploreMode === 'discover' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setExploreMode('discover')}
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Discover
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-2xl flex items-center justify-end">
                            {/* Mobile Search Icon Trigger */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("md:hidden", isMobileSearchOpen && "hidden")}
                                onClick={() => setIsMobileSearchOpen(true)}
                            >
                                <Search className="h-5 w-5" />
                            </Button>

                            {/* Full Search Bar (Visible on Desktop OR when Mobile Search is Open) */}
                            <div className={cn(
                                "w-full transition-all duration-200",
                                isMobileSearchOpen ? "block absolute inset-0 bg-background z-30 flex items-center px-4" : "hidden md:block"
                            )}>
                                <div className="flex w-full items-center gap-2">
                                    {isMobileSearchOpen && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsMobileSearchOpen(false)}
                                            className="flex-shrink-0"
                                        >
                                            <Sidebar className="h-5 w-5 rotate-180" />
                                        </Button>
                                    )}
                                    <div className="flex-1 w-full">
                                        <GlobalSearchBar
                                            placeholder="Search posts, users, hashtags..."
                                            autoFocus={isMobileSearchOpen}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Profile / Notifications */}
                        {!isMobileSearchOpen && (
                            <Link href={`/profile/${loggedInUser?.username || 'me'}`}>
                                <Avatar className="h-8 w-8 transition-transform hover:scale-110">
                                    <AvatarImage src={loggedInUser?.avatar_url || '/placeholder-user.jpg'} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </Link>
                        )}
                    </div>

                    {/* Feed Filters - Latest and Following tabs */}
                    {exploreMode === 'feed' && (
                        <div className="flex items-center justify-center border-t">
                            <button
                                onClick={() => handleTabChange('latest')}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium transition-colors relative",
                                    feedFilter === 'latest'
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Clock className="h-4 w-4 inline mr-2" />
                                Latest
                                {feedFilter === 'latest' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => handleTabChange('following')}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium transition-colors relative",
                                    feedFilter === 'following'
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Users className="h-4 w-4 inline mr-2" />
                                Following
                                {feedFilter === 'following' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                        </div>
                    )}
                </header>

                {/* Stories Bar */}
                {exploreMode === 'feed' && <StoriesBar />}

                {/* Main Content Area */}
                <div className="flex-1 container max-w-2xl mx-auto p-0 md:p-4">
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

                    {exploreMode === 'feed' ? (
                        <>
                            {/* Create Post Input */}
                            <div className="mb-6 px-4 pt-4 md:px-0 md:pt-0">
                                <CreatePost onPostCreated={handlePostCreated} />
                            </div>

                            {/* Feed List */}
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
                        </>
                    ) : (
                        <div className="space-y-8 px-4 py-6 md:px-0">
                            {/* Discover / Trending Mockup */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                    <h2 className="text-xl font-bold">Trending Now</h2>
                                </div>
                                <TrendingTopicsList
                                    onHashtagClick={(tag) => {
                                        toast({ title: "Exploring tag", description: `#${tag}` });
                                    }}
                                />
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-xl font-bold">Suggested for you</h2>
                                </div>
                                {suggestedUsers.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {suggestedUsers.map((user: any) => (
                                            <UserCard
                                                key={user.id}
                                                user={user}
                                                onFollow={handleFollowUser}
                                                isFollowing={false}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="h-9 w-full bg-muted rounded animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>

                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="fixed bottom-20 right-4 rounded-full shadow-lg z-50 md:bottom-8"
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