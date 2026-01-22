"use client";
import * as React from 'react';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    TrendingUp,
    Hash,
    Users,
    Image as ImageIcon,
    Video,
    Sparkles,
    Clock,
    Flame,
    X,
    ArrowRight,
    Loader2,
    ArrowUp,
    Bell,
    Home
} from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { PostType, CommentType, ReplyType, PollType, NotificationType } from '../types';
import { PostCard, PostSkeleton } from '../components/post-card';
import { CreatePost } from '../components/create-post';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { GoogleAd } from '@/components/ads/google-ad';
import { PromotePostDialog } from '@/components/promote-post-dialog';
import {
    generateSmartFeed,
    UserInteractions,
    updateLastSeenTime,
    trackPostView
} from '../feed-algorithm';
import { QuotePostDialog } from './components/quote-post-dialog';
import { createClient } from '@/lib/supabase/client';

const POSTS_PER_PAGE = 10;
const SCROLL_THRESHOLD = 500;

// Transform DB post to UI PostType
const transformPost = (dbPost: any): PostType => {
    // Handle missing author (e.g. due to RLS or data integrity)
    const author = dbPost.author || {
        id: 'unknown',
        name: 'Unknown User',
        username: 'unknown',
        avatar: '', // Use default placeholder
        verified: false
    };

    // Transform comments from database format to UI format
    const transformedComments: CommentType[] = (dbPost.post_comments || []).map((comment: any) => ({
        id: comment.id.toString(),
        user: {
            id: comment.profiles?.id || comment.user_id,
            name: comment.profiles?.name || 'Unknown User',
            username: comment.profiles?.username || 'unknown',
            avatar: comment.profiles?.avatar_url || '/placeholder-user.jpg',
            verified: comment.profiles?.verified || false
        },
        text: comment.content,
        createdAt: comment.created_at,
        likes: comment.like_count || 0,
        likedBy: [], // Could be populated if needed
        replies: [], // Nested replies not yet supported
        isPinned: false,
        isHidden: false
    }));

    return {
        id: dbPost.id.toString(),
        author: {
            id: author.id,
            name: author.name,
            username: author.username,
            avatar: author.avatar_url || '/placeholder-user.jpg', // Fallback avatar
            verified: author.verified,
        },
        createdAt: dbPost.created_at,
        content: dbPost.content,
        media: dbPost.media_urls || [],
        poll: dbPost.poll,
        stats: {
            likes: dbPost.likes?.[0]?.count || 0,
            comments: transformedComments.length || dbPost.comments?.[0]?.count || 0,
            reposts: dbPost.reposts?.[0]?.count || 0,
            reshares: 0, // Not tracked yet
            views: 0, // Not tracked yet
            bookmarks: 0 // Not tracked yet
        },
        comments: transformedComments,
        originalPost: dbPost.quote_of ? transformPost(dbPost.quote_of) : null,
        likedBy: dbPost.user_likes?.length ? [dbPost.user_likes[0].user_id] : [], // Check if current user liked
        savedBy: [],
        repostedBy: [],
        isPinned: dbPost.is_pinned,
        isPromoted: dbPost.is_promoted
    };
};

// Mock user data for suggestions (Removed)
const suggestedUsers: any[] = [];

type SearchFilter = 'all' | 'posts' | 'users' | 'hashtags' | 'media';
type FeedFilter = 'foryou' | 'following' | 'latest';
type ExploreMode = 'feed' | 'search' | 'discover';

// Trending Category Component
function TrendingCategory({
    icon: Icon,
    title,
    count,
    trend
}: {
    icon: any;
    title: string;
    count: string;
    trend?: string;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">{title}</p>
                        <p className="text-sm text-muted-foreground">{count}</p>
                    </div>
                    {trend && (
                        <Badge variant="secondary" className="ml-auto">
                            {trend}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// User Card Component with proper follow functionality
function UserCard({
    user,
    onFollow
}: {
    user: typeof suggestedUsers[0];
    onFollow: (id: string) => void;
}) {
    const { loggedInUser } = useAppContext();
    const [followStatus, setFollowStatus] = React.useState<'none' | 'pending' | 'approved'>('none');
    const [isLoading, setIsLoading] = React.useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const handleFollow = async () => {
        if (!loggedInUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to follow users.' });
            return;
        }

        setIsLoading(true);
        try {
            if (followStatus === 'none') {
                // Follow the user using RPC
                const { data, error } = await supabase.rpc('request_follow', {
                    target_user_id: user.id,
                });

                if (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to follow user.' });
                    return;
                }

                const newStatus = data?.status || 'approved';
                setFollowStatus(newStatus);

                if (newStatus === 'pending') {
                    toast({ title: 'Request Sent', description: 'Your follow request has been sent.' });
                } else {
                    toast({ title: 'Following', description: `You are now following ${user.name}.` });
                }
                onFollow(user.id);
            } else {
                // Unfollow using RPC
                const { error } = await supabase.rpc('unfollow_user', {
                    target_user_id: user.id,
                });

                if (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to unfollow user.' });
                    return;
                }

                setFollowStatus('none');
                toast({ title: 'Unfollowed', description: `You have unfollowed ${user.name}.` });
            }
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '...';
        switch (followStatus) {
            case 'approved': return 'Following';
            case 'pending': return 'Requested';
            default: return 'Follow';
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/profile/${user.username}`}
                                className="font-semibold hover:underline truncate"
                            >
                                {user.name}
                            </Link>
                            {user.verified && (
                                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {user.followers.toLocaleString()} followers
                        </p>
                    </div>
                    <Button
                        variant={followStatus === 'none' ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleFollow}
                        disabled={isLoading}
                        className="flex-shrink-0"
                    >
                        {getButtonText()}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Hashtag Card Component
function HashtagCard({
    hashtag,
    posts,
    category
}: {
    hashtag: string;
    posts: number;
    category?: string;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">{hashtag}</p>
                            <p className="text-sm text-muted-foreground">
                                {posts.toLocaleString()} posts
                            </p>
                        </div>
                    </div>
                    {category && (
                        <Badge variant="secondary">{category}</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Main Explore Page
export default function ExplorePage() {
    const {
        loggedInUser,
        isReady
    } = useAppContext();
    const { toast } = useToast();
    const router = useRouter();

    // Mode management
    const [exploreMode, setExploreMode] = React.useState<ExploreMode>('feed');

    // Search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeFilter, setActiveFilter] = React.useState<SearchFilter>('all');
    const [recentSearches, setRecentSearches] = React.useState<string[]>([
        'Bhagavad Gita',
        'Morning prayers',
        'Temple events'
    ]);

    // Feed state
    const [allPosts, setAllPosts] = React.useState<PostType[]>([]);
    const [visiblePosts, setVisiblePosts] = React.useState<PostType[]>([]);
    const [sortedFeed, setSortedFeed] = React.useState<PostType[]>([]);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [isInitialLoading, setIsInitialLoading] = React.useState(true);
    const [feedFilter, setFeedFilter] = React.useState<FeedFilter>('foryou');
    const [showNewPostsBanner, setShowNewPostsBanner] = React.useState(false);
    const [newPostsCount, setNewPostsCount] = React.useState(0);
    const [isCaughtUp, setIsCaughtUp] = React.useState(false);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    // Notifications
    const [notifications, setNotifications] = React.useState<NotificationType[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);

    // Promotion Dialog
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
    const [postToPromote, setPostToPromote] = React.useState<PostType | null>(null);

    // Quote Dialog
    const [isQuoteDialogOpen, setIsQuoteDialogOpen] = React.useState(false);
    const [postToQuote, setPostToQuote] = React.useState<PostType | null>(null);

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

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const newPostsCheckInterval = React.useRef<NodeJS.Timeout | null>(null);

    // Filtered search results
    const searchResults = React.useMemo(() => {
        if (!searchQuery) return { posts: [], users: [], hashtags: [] };

        const query = searchQuery.toLowerCase();

        const posts = allPosts.filter(p =>
            p.content.toLowerCase().includes(query) ||
            p.author.name.toLowerCase().includes(query)
        );

        const users = suggestedUsers.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.username.toLowerCase().includes(query) ||
            u.bio.toLowerCase().includes(query)
        );

        const hashtags: { id: string; hashtag: string; postsCount: number; category?: string }[] = [];
        return { posts, users, hashtags };
    }, [searchQuery, allPosts]);

    // Initial fetch from Supabase
    const fetchPosts = React.useCallback(async () => {
        setIsInitialLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from('posts')
            .select(`
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
                user_likes:post_likes!post_id(user_id)
            `)
            .order('created_at', { ascending: false });

        console.log('[Explore] Fetched posts:', { data, error, count: data?.length });

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
        }
        setIsInitialLoading(false);
    }, [toast]);

    React.useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Filter posts
    // Initialize Notifications (Empty for now until real notifications implemented)
    React.useEffect(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Reactive Feed Filter: Apply filter when posts or filter settings change
    React.useEffect(() => {
        if (allPosts.length > 0) {
            applyFeedFilter(allPosts, feedFilter);
        }
    }, [allPosts, feedFilter, userInteractions]); // Re-run when posts or filter changes


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
        let filteredPosts = [...posts];

        switch (filter) {
            case 'foryou':
                const smartFeed = generateSmartFeed(posts, userInteractions);
                filteredPosts = smartFeed.feed;
                setIsCaughtUp(smartFeed.isCaughtUp);
                setNewPostsCount(smartFeed.newPostsCount);
                break;

            case 'following':
                filteredPosts = posts.filter(p =>
                    userInteractions.followedUsers.includes(p.author.id)
                ).sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;

            case 'latest':
                filteredPosts = posts.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;
        }

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

        // Get the timestamp of the most recent post in our current list
        const latestPostTime = allPosts.reduce((latest, post) => {
            const postTime = new Date(post.createdAt).getTime();
            return postTime > latest ? postTime : latest;
        }, 0);

        if (latestPostTime === 0) return;

        // Query Supabase for posts newer than our latest post
        const { count, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', new Date(latestPostTime).toISOString());

        if (error) {
            console.error('Error checking for new posts:', error);
            return;
        }

        if (count && count > 0) {
            setNewPostsCount(count);
            setShowNewPostsBanner(true);
        }
    }, [allPosts]);

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

        // Get the timestamp of the most recent post in our current list
        const latestPostTime = allPosts.reduce((latest, post) => {
            const postTime = new Date(post.createdAt).getTime();
            return postTime > latest ? postTime : latest;
        }, 0);

        // Fetch new posts from Supabase
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (id, name, username, avatar_url, verified)
            `)
            .gt('created_at', new Date(latestPostTime).toISOString())
            .order('created_at', { ascending: false });

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
            // Prepend new posts to the existing list
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

    // Refresh feed
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedInteractions = updateLastSeenTime(userInteractions);
        setUserInteractions(updatedInteractions);
        applyFeedFilter(allPosts, feedFilter);

        setIsRefreshing(false);
        setShowNewPostsBanner(false);

        toast({
            title: "Feed refreshed",
            description: "You're all caught up!"
        });
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

    // Load older posts
    const handleLoadOlderPosts = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            toast({
                title: "Loading older posts",
                description: "Fetching posts from your history..."
            });
            setIsLoadingMore(false);
        }, 500);
    };

    // Scroll to top
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle filter change
    const handleFilterChange = (filter: FeedFilter) => {
        setFeedFilter(filter);
        setIsLoadingMore(true);

        setTimeout(() => {
            applyFeedFilter(allPosts, filter);
            setIsLoadingMore(false);
        }, 300);
    };

    // Search handlers
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query) {
            setExploreMode('search');
            if (!recentSearches.includes(query)) {
                setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
            }
        } else {
            setExploreMode('feed');
        }
    };

    const clearRecentSearch = (search: string) => {
        setRecentSearches(prev => prev.filter(s => s !== search));
    };

    const handleFollowUser = (userId: string) => {
        toast({
            title: "Following",
            description: "You are now following this user"
        });
    };

    // Post handlers
    const handlePostCreated = async () => {
        // Refresh feed to show new post
        await fetchPosts();
    };

    const handlePostDeleted = (postId: string) => {
        setAllPosts(prev => prev.filter(p => p.id !== postId));
        setVisiblePosts(prev => prev.filter(p => p.id !== postId));

        toast({
            title: "Post deleted",
            description: "Your post has been removed."
        });
    };

    const handlePostEdited = (postId: string, newContent: string) => {
        const updatePost = (post: PostType) => {
            if (post.id === postId) {
                return {
                    ...post,
                    content: newContent,
                    editedAt: new Date().toISOString()
                };
            }
            return post;
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        toast({
            title: "Post updated",
            description: "Your changes have been saved."
        });
    };

    const handlePostLikeToggle = async (postId: string) => {
        if (!loggedInUser) return;

        const supabase = createClient();
        const post = allPosts.find(p => p.id === postId);
        if (!post) return;

        const isCurrentlyLiked = post.likedBy.includes(loggedInUser.id);

        // Optimistic UI update
        const updatePost = (post: PostType) => {
            if (post.id === postId) {
                const newLikedBy = isCurrentlyLiked
                    ? post.likedBy.filter(id => id !== loggedInUser.id)
                    : [...post.likedBy, loggedInUser.id];

                return {
                    ...post,
                    likedBy: newLikedBy,
                    stats: { ...post.stats, likes: newLikedBy.length }
                };
            }
            return post;
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        // Track interaction (Feed Algorithm)
        setUserInteractions(prev => ({
            ...prev,
            likedPosts: isCurrentlyLiked
                ? prev.likedPosts.filter(id => id !== postId)
                : [...prev.likedPosts, postId]
        }));

        // Call atomic toggle function in database
        try {
            const { data, error } = await supabase.rpc('toggle_post_like', {
                p_post_id: parseInt(postId)
            });

            if (error) throw error;

            console.log(`Like toggled for post ${postId}:`, data);
        } catch (error: any) {
            console.error("Error toggling like:", error);

            // Revert optimistic update on error
            setAllPosts(prev => prev.map(updatePost));
            setVisiblePosts(prev => prev.map(updatePost));

            toast({
                title: "Error",
                description: error.message || "Failed to update like status",
                variant: "destructive"
            });
        }
    };

    const handlePostSaveToggle = (postId: string) => {
        if (!loggedInUser) return;

        const updatePost = (post: PostType) => {
            if (post.id === postId) {
                const isSaved = post.savedBy.includes(loggedInUser.id);
                const newSavedBy = isSaved
                    ? post.savedBy.filter(id => id !== loggedInUser.id)
                    : [...post.savedBy, loggedInUser.id];

                return {
                    ...post,
                    savedBy: newSavedBy,
                    stats: { ...post.stats, bookmarks: newSavedBy.length }
                };
            }
            return post;
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        const post = allPosts.find(p => p.id === postId);
        if (post) {
            const isSaved = post.savedBy.includes(loggedInUser.id);
            setUserInteractions(prev => ({
                ...prev,
                savedPosts: isSaved
                    ? prev.savedPosts.filter(id => id !== postId)
                    : [...prev.savedPosts, postId]
            }));

            toast({
                title: isSaved ? "Post unsaved" : "Post saved",
                description: isSaved ? "Removed from bookmarks" : "Added to bookmarks"
            });
        }
    };

    const handleRepost = async (postId: string) => {
        if (!loggedInUser) return;

        const supabase = createClient();
        const originalPost = allPosts.find(p => p.id === postId);
        if (!originalPost) return;

        // Optimistic UI update
        const repost: PostType = {
            id: `post_${Date.now()}`,
            author: {
                id: loggedInUser.id,
                name: loggedInUser.name,
                username: loggedInUser.username,
                avatar: loggedInUser.avatar_url
            },
            createdAt: new Date().toISOString(),
            content: '',
            media: [],
            stats: { comments: 0, reshares: 0, reposts: 0, likes: 0, views: 0, bookmarks: 0 },
            comments: [],
            originalPost: (({ comments, stats, poll, originalPost: _, ...cleanPost }) => cleanPost)(originalPost),
            isRepost: true,
            repostOf: postId,
            likedBy: [],
            savedBy: [],
            repostedBy: [],
        };

        const updateOriginalPost = (post: PostType) => {
            if (post.id === postId) {
                const isReposted = post.repostedBy.includes(loggedInUser.id);
                const newRepostedBy = isReposted
                    ? post.repostedBy.filter(id => id !== loggedInUser.id)
                    : [...post.repostedBy, loggedInUser.id];

                return {
                    ...post,
                    repostedBy: newRepostedBy,
                    stats: { ...post.stats, reposts: newRepostedBy.length }
                };
            }
            return post;
        };

        const wasReposted = originalPost.repostedBy.includes(loggedInUser.id);

        // Update UI immediately
        if (!wasReposted) {
            setAllPosts(prev => [repost, ...prev.map(updateOriginalPost)]);
            setVisiblePosts(prev => [repost, ...prev.map(updateOriginalPost)]);
        } else {
            setAllPosts(prev => prev.map(updateOriginalPost));
            setVisiblePosts(prev => prev.map(updateOriginalPost));
        }

        // Persist to database using atomic toggle function
        try {
            const { data, error } = await supabase.rpc('toggle_post_repost', {
                p_post_id: parseInt(postId)
            });

            if (error) throw error;

            console.log(`Repost toggled for post ${postId}:`, data);

            toast({
                title: wasReposted ? "Repost removed" : "Reposted!",
                description: wasReposted ? "Post removed from your profile" : "Post shared to your followers"
            });
        } catch (error: any) {
            console.error("Error toggling repost:", error);

            // Revert optimistic update
            if (!wasReposted) {
                setAllPosts(prev => prev.slice(1).map(updateOriginalPost));
                setVisiblePosts(prev => prev.slice(1).map(updateOriginalPost));
            } else {
                setAllPosts(prev => prev.map(updateOriginalPost));
                setVisiblePosts(prev => prev.map(updateOriginalPost));
            }

            toast({
                title: "Error",
                description: error.message || "Failed to update repost",
                variant: "destructive"
            });
        }
    };

    const handleCommentCreated = async (postId: string, commentText: string, parentCommentId?: string) => {
        if (!loggedInUser) return;

        const supabase = createClient();

        const commenterUser = {
            id: loggedInUser.id,
            name: loggedInUser.name,
            username: loggedInUser.username,
            avatar: loggedInUser.avatar_url
        };

        const updatePost = (post: PostType) => {
            if (post.id !== postId) return post;

            const stats = { ...post.stats, comments: post.stats.comments + 1 };

            if (parentCommentId) {
                const newReply: ReplyType = {
                    id: `reply_${Date.now()}`,
                    user: commenterUser,
                    text: commentText,
                    isPinned: false,
                    likes: 0,
                    isHidden: false,
                    createdAt: new Date().toISOString(),
                    likedBy: []
                };

                const updatedComments = post.comments.map(c =>
                    c.id === parentCommentId
                        ? { ...c, replies: [...c.replies, newReply] }
                        : c
                );

                return { ...post, comments: updatedComments, stats };
            } else {
                const newComment: CommentType = {
                    id: `comment_${Date.now()}`,
                    user: commenterUser,
                    text: commentText,
                    isPinned: false,
                    likes: 0,
                    isHidden: false,
                    replies: [],
                    createdAt: new Date().toISOString(),
                    likedBy: []
                };

                return {
                    ...post,
                    comments: [newComment, ...post.comments],
                    stats
                };
            }
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        setUserInteractions(prev => ({
            ...prev,
            commentedPosts: [...new Set([...prev.commentedPosts, postId])]
        }));

        try {
            const commentPayload: any = {
                post_id: postId,
                user_id: loggedInUser.id,
                content: commentText
            };

            // Note: parent_id persistence is skipped as column name is unconfirmed. 
            // If parent_id matches schema, uncomment:
            // if (parentCommentId) commentPayload.parent_id = parentCommentId;

            const { error } = await supabase
                .from('comments')
                .insert(commentPayload);

            if (error) throw error;

            toast({
                title: "Comment added",
                description: "Your comment has been posted."
            });
        } catch (error) {
            console.error("Error creating comment:", error);
            toast({
                title: "Error",
                description: "Failed to post comment",
                variant: "destructive"
            });
        }
    };

    const handleCommentLikeToggle = (postId: string, commentId: string, isReply: boolean = false) => {
        if (!loggedInUser) return;

        const updatePost = (post: PostType) => {
            if (post.id !== postId) return post;

            const updatedComments = post.comments.map(comment => {
                if (isReply) {
                    const updatedReplies = comment.replies.map(reply => {
                        if (reply.id === commentId) {
                            const isLiked = reply.likedBy.includes(loggedInUser.id);
                            const newLikedBy = isLiked
                                ? reply.likedBy.filter(id => id !== loggedInUser.id)
                                : [...reply.likedBy, loggedInUser.id];

                            return { ...reply, likedBy: newLikedBy, likes: newLikedBy.length };
                        }
                        return reply;
                    });

                    return { ...comment, replies: updatedReplies };
                } else {
                    if (comment.id === commentId) {
                        const isLiked = comment.likedBy.includes(loggedInUser.id);
                        const newLikedBy = isLiked
                            ? comment.likedBy.filter(id => id !== loggedInUser.id)
                            : [...comment.likedBy, loggedInUser.id];

                        return { ...comment, likedBy: newLikedBy, likes: newLikedBy.length };
                    }
                    return comment;
                }
            });

            return { ...post, comments: updatedComments };
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));
    };

    const handleCommentPinToggle = (postId: string, commentId: string) => {
        if (!loggedInUser) return;

        const updatePost = (post: PostType) => {
            if (post.id !== postId || post.author.id !== loggedInUser.id) return post;

            const updatedComments = post.comments.map(comment => {
                if (comment.id === commentId) {
                    return { ...comment, isPinned: !comment.isPinned };
                }
                if (!comment.isPinned) return comment;
                const targetComment = post.comments.find(c => c.id === commentId);
                if (targetComment && !targetComment.isPinned) {
                    return { ...comment, isPinned: false };
                }
                return comment;
            });

            return { ...post, comments: updatedComments };
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        toast({
            title: "Comment pinned",
            description: "Comment pinned to the top"
        });
    };

    const handleCommentHideToggle = (postId: string, commentId: string, isReply: boolean = false) => {
        if (!loggedInUser) return;

        const updatePost = (post: PostType) => {
            if (post.id !== postId || post.author.id !== loggedInUser.id) return post;

            const updatedComments = post.comments.map(comment => {
                if (isReply) {
                    const updatedReplies = comment.replies.map(reply => {
                        if (reply.id === commentId) {
                            return { ...reply, isHidden: !reply.isHidden };
                        }
                        return reply;
                    });
                    return { ...comment, replies: updatedReplies };
                } else {
                    if (comment.id === commentId) {
                        return { ...comment, isHidden: !comment.isHidden };
                    }
                    return comment;
                }
            });

            return { ...post, comments: updatedComments };
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        toast({
            title: "Comment visibility updated",
            description: "Comment hidden from other users"
        });
    };

    const handleCommentDeleted = (postId: string, commentId: string, isReply: boolean = false, parentCommentId?: string) => {
        if (!loggedInUser) return;

        const updatePost = (post: PostType) => {
            if (post.id !== postId) return post;

            const stats = { ...post.stats, comments: Math.max(0, post.stats.comments - 1) };

            if (isReply && parentCommentId) {
                const updatedComments = post.comments.map(comment => {
                    if (comment.id === parentCommentId) {
                        return {
                            ...comment,
                            replies: comment.replies.filter(r => r.id !== commentId)
                        };
                    }
                    return comment;
                });
                return { ...post, comments: updatedComments, stats };
            } else {
                const updatedComments = post.comments.filter(c => c.id !== commentId);
                return { ...post, comments: updatedComments, stats };
            }
        };

        setAllPosts(prev => prev.map(updatePost));
        setVisiblePosts(prev => prev.map(updatePost));

        toast({
            title: "Comment deleted",
            description: "Comment removed"
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
            originalPost: (({ comments, stats, poll, originalPost: _, ...cleanPost }) => cleanPost)(originalPost),
            likedBy: [],
            savedBy: [],
            repostedBy: [],
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

    const handlePollVote = async (postId: string, optionId: string) => {
        if (!loggedInUser) return;

        const supabase = createClient();

        try {
            // Call the database function to record the vote
            const { data: updatedPoll, error } = await supabase
                .rpc('vote_on_poll', {
                    p_post_id: parseInt(postId),
                    p_option_id: optionId
                });

            if (error) throw error;

            // Update local state with the returned poll data
            const updatePost = (post: PostType) => {
                if (post.id !== postId || !post.poll) return post;

                return {
                    ...post,
                    poll: updatedPoll as PollType
                };
            };

            setAllPosts(prev => prev.map(updatePost));
            setVisiblePosts(prev => prev.map(updatePost));

            toast({
                title: "Vote recorded",
                description: "Thank you for voting!"
            });
        } catch (error: any) {
            console.error("Error voting on poll:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to record your vote",
                variant: "destructive"
            });
        }
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
                        <SidebarTrigger className="md:hidden" />

                        {/* Mode Toggle */}
                        <div className="flex gap-2 mr-2">
                            <Button
                                variant={exploreMode === 'feed' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setExploreMode('feed');
                                    setSearchQuery('');
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
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search posts, users, hashtags..."
                                className="pl-10 pr-10 h-12 text-base"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setExploreMode('feed');
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Notifications */}
                        {exploreMode === 'feed' && (
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Feed Filter Tabs */}
                    {exploreMode === 'feed' && !searchQuery && (
                        <Tabs value={feedFilter} onValueChange={(v) => handleFilterChange(v as FeedFilter)} className="w-full">
                            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-4">
                                <TabsTrigger
                                    value="foryou"
                                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    For You
                                </TabsTrigger>
                                <TabsTrigger
                                    value="following"
                                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Following
                                </TabsTrigger>
                                <TabsTrigger
                                    value="latest"
                                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Latest
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {/* Search Filter Tabs */}
                    {searchQuery && (
                        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as SearchFilter)} className="w-full">
                            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-4">
                                <TabsTrigger
                                    value="all"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    All
                                </TabsTrigger>
                                <TabsTrigger
                                    value="posts"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    Posts ({searchResults.posts.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="users"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    People ({searchResults.users.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="hashtags"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <Hash className="h-4 w-4 mr-2" />
                                    Tags ({searchResults.hashtags.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="media"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Media
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </header>

                {/* New Posts Banner */}
                {showNewPostsBanner && newPostsCount > 0 && exploreMode === 'feed' && !searchQuery && (
                    <div className="sticky top-[130px] z-10 px-4 py-2 bg-primary/10 border-b">
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={handleLoadNewPosts}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'} • Click to load
                        </Button>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        {/* FEED MODE */}
                        {exploreMode === 'feed' && !searchQuery && (
                            <div ref={scrollContainerRef}>
                                <CreatePost onPostCreated={handlePostCreated} />

                                {/* Pull to Refresh Indicator */}
                                {isRefreshing && (
                                    <div className="flex justify-center items-center py-4 border-b">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                                        <span className="text-sm text-muted-foreground">Refreshing feed...</span>
                                    </div>
                                )}

                                {isInitialLoading ? (
                                    <>
                                        <PostSkeleton />
                                        <PostSkeleton />
                                        <PostSkeleton />
                                        <PostSkeleton />
                                    </>
                                ) : feedFilter === 'following' ? (
                                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                        <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
                                        <p className="text-muted-foreground max-w-sm">
                                            The Following feed is under development. Stay tuned for updates!
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {visiblePosts.map((post, index) => (
                                            <React.Fragment key={post.id}>
                                                <PostCard
                                                    post={post}
                                                    onComment={handleCommentCreated}
                                                    onDelete={handlePostDeleted}
                                                    onEdit={handlePostEdited}
                                                    onLikeToggle={handlePostLikeToggle}
                                                    onSaveToggle={handlePostSaveToggle}
                                                    onCommentLikeToggle={handleCommentLikeToggle}
                                                    onCommentPinToggle={handleCommentPinToggle}
                                                    onCommentHideToggle={handleCommentHideToggle}
                                                    onCommentDelete={handleCommentDeleted}
                                                    onQuotePost={handleQuotePost}
                                                    onRepost={handleRepost}
                                                    onPollVote={handlePollVote}
                                                    onPromote={handlePromoteClick}
                                                />
                                                {(index + 1) % 10 === 0 && index > 0 && (
                                                    <div className="my-4 border-t border-b">
                                                        <GoogleAd slot="7825657340" />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </>
                                )}

                                {/* Load More / Caught Up Section */}
                                {!isInitialLoading && (
                                    <div className="p-6 text-center space-y-4">
                                        {hasMore && !isCaughtUp ? (
                                            <Button
                                                onClick={handleLoadMore}
                                                disabled={isLoadingMore}
                                                className="w-full sm:w-auto"
                                                variant="outline"
                                            >
                                                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isLoadingMore ? 'Loading...' : 'Load More Posts'}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                                        <Sparkles className="h-12 w-12 text-primary relative" />
                                                    </div>
                                                    <div className="space-y-1 text-center">
                                                        <h3 className="text-lg font-semibold">You're all caught up!</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            You've seen all new posts from the last 24 hours
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap justify-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleRefresh}
                                                        >
                                                            Check for new posts
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleLoadOlderPosts}
                                                        >
                                                            Show older posts
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="border-t pt-6 space-y-3">
                                                    <h4 className="text-sm font-semibold text-muted-foreground">
                                                        While you're here
                                                    </h4>
                                                    <div className="grid gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="justify-start h-auto py-3"
                                                            onClick={() => setExploreMode('discover')}
                                                        >
                                                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                                                            <div className="text-left">
                                                                <div className="font-medium text-sm">Discover new accounts</div>
                                                                <div className="text-xs text-muted-foreground">Find people to follow</div>
                                                            </div>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="justify-start h-auto py-3"
                                                            onClick={() => setExploreMode('discover')}
                                                        >
                                                            <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                                                            <div className="text-left">
                                                                <div className="font-medium text-sm">Explore trending topics</div>
                                                                <div className="text-xs text-muted-foreground">See what's happening now</div>
                                                            </div>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DISCOVER MODE */}
                        {exploreMode === 'discover' && !searchQuery && (
                            <div className="p-4 space-y-6">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Clock className="h-5 w-5" />
                                                    Recent Searches
                                                </CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setRecentSearches([])}
                                                >
                                                    Clear all
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {recentSearches.map((search, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer group"
                                                    onClick={() => handleSearch(search)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Search className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{search}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            clearRecentSearch(search);
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Trending Topics */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Flame className="h-5 w-5 text-orange-500" />
                                            Trending Now
                                        </CardTitle>
                                        <CardDescription>Popular topics in the community</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {/* Trending topics removed */}
                                    </CardContent>
                                </Card>

                                {/* Suggested Users */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Suggested for You
                                        </CardTitle>
                                        <CardDescription>People you might want to follow</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {suggestedUsers.slice(0, 3).map(user => (
                                            <UserCard key={user.id} user={user} onFollow={handleFollowUser} />
                                        ))}
                                        <Button variant="ghost" className="w-full" onClick={() => handleSearch('')}>
                                            See more suggestions
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Popular Categories */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <TrendingCategory
                                        icon={Hash}
                                        title="Devotional Posts"
                                        count="2.5K posts today"
                                        trend="↑ 12%"
                                    />
                                    <TrendingCategory
                                        icon={Video}
                                        title="Kirtan Videos"
                                        count="456 videos"
                                        trend="↑ 8%"
                                    />
                                    <TrendingCategory
                                        icon={ImageIcon}
                                        title="Temple Photos"
                                        count="1.2K images"
                                        trend="↑ 15%"
                                    />
                                    <TrendingCategory
                                        icon={Users}
                                        title="Community Events"
                                        count="23 active"
                                        trend="New"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SEARCH RESULTS MODE */}
                        {searchQuery && (
                            <div className="p-4">
                                <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as SearchFilter)}>
                                    {/* All Results */}
                                    <TabsContent value="all" className="mt-0 space-y-6">
                                        {searchResults.users.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">People</h3>
                                                <div className="space-y-3">
                                                    {searchResults.users.slice(0, 3).map(user => (
                                                        <UserCard key={user.id} user={user} onFollow={handleFollowUser} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {searchResults.hashtags.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Hashtags</h3>
                                                <div className="space-y-2">
                                                    {searchResults.hashtags.map(tag => (
                                                        <HashtagCard
                                                            key={tag.id}
                                                            hashtag={tag.hashtag}
                                                            posts={tag.postsCount}
                                                            category={tag.category}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {searchResults.posts.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Posts</h3>
                                                <div className="space-y-0 border rounded-lg overflow-hidden">
                                                    {searchResults.posts.slice(0, 5).map(post => (
                                                        <PostCard
                                                            key={post.id}
                                                            post={post}
                                                            onComment={handleCommentCreated}
                                                            onDelete={handlePostDeleted}
                                                            onEdit={handlePostEdited}
                                                            onLikeToggle={handlePostLikeToggle}
                                                            onSaveToggle={handlePostSaveToggle}
                                                            onCommentLikeToggle={handleCommentLikeToggle}
                                                            onCommentPinToggle={handleCommentPinToggle}
                                                            onCommentHideToggle={handleCommentHideToggle}
                                                            onCommentDelete={handleCommentDeleted}
                                                            onQuotePost={handleQuotePost}
                                                            onRepost={handleRepost}
                                                            onPollVote={handlePollVote}
                                                            onPromote={handlePromoteClick}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {searchResults.posts.length === 0 &&
                                            searchResults.users.length === 0 &&
                                            searchResults.hashtags.length === 0 && (
                                                <div className="text-center py-12">
                                                    <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try searching for something else
                                                    </p>
                                                </div>
                                            )}
                                    </TabsContent>

                                    {/* Posts Only */}
                                    <TabsContent value="posts" className="mt-0">
                                        {searchResults.posts.length > 0 ? (
                                            <div className="space-y-0 border rounded-lg overflow-hidden">
                                                {searchResults.posts.map(post => (
                                                    <PostCard
                                                        key={post.id}
                                                        post={post}
                                                        onComment={handleCommentCreated}
                                                        onDelete={handlePostDeleted}
                                                        onEdit={handlePostEdited}
                                                        onLikeToggle={handlePostLikeToggle}
                                                        onSaveToggle={handlePostSaveToggle}
                                                        onCommentLikeToggle={handleCommentLikeToggle}
                                                        onCommentPinToggle={handleCommentPinToggle}
                                                        onCommentHideToggle={handleCommentHideToggle}
                                                        onCommentDelete={handleCommentDeleted}
                                                        onQuotePost={handleQuotePost}
                                                        onRepost={handleRepost}
                                                        onPollVote={handlePollVote}
                                                        onPromote={handlePromoteClick}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-sm text-muted-foreground">No posts found</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Users Only */}
                                    <TabsContent value="users" className="mt-0">
                                        {searchResults.users.length > 0 ? (
                                            <div className="space-y-3">
                                                {searchResults.users.map(user => (
                                                    <UserCard key={user.id} user={user} onFollow={handleFollowUser} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-sm text-muted-foreground">No users found</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Hashtags Only */}
                                    <TabsContent value="hashtags" className="mt-0">
                                        {searchResults.hashtags.length > 0 ? (
                                            <div className="space-y-2">
                                                {searchResults.hashtags.map(tag => (
                                                    <HashtagCard
                                                        key={tag.id}
                                                        hashtag={tag.hashtag}
                                                        posts={tag.postsCount}
                                                        category={tag.category}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Hash className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-sm text-muted-foreground">No hashtags found</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Media Only */}
                                    <TabsContent value="media" className="mt-0">
                                        <div className="grid grid-cols-3 gap-1">
                                            {searchResults.posts
                                                .filter(p => p.media.length > 0)
                                                .flatMap(p => p.media)
                                                .slice(0, 12)
                                                .map((media, idx) => (
                                                    <div key={idx} className="aspect-square bg-muted relative group cursor-pointer">
                                                        <img
                                                            src={media.url}
                                                            alt={media.alt || ''}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        {searchResults.posts.filter(p => p.media.length > 0).length === 0 && (
                                            <div className="text-center py-12">
                                                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-sm text-muted-foreground">No media found</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>
                </main>

                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <Button
                        onClick={scrollToTop}
                        size="icon"
                        className="fixed bottom-20 right-4 sm:right-8 h-12 w-12 rounded-full shadow-lg z-50"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                )}
            </div>
            <QuotePostDialog
                open={isQuoteDialogOpen}
                onOpenChange={setIsQuoteDialogOpen}
                postToQuote={postToQuote}
                onQuote={(originalPostId, quoteText) => {
                    // Handle quote post creation here if needed
                    setIsQuoteDialogOpen(false);
                    setPostToQuote(null);
                }}
            />
        </>
    );
}