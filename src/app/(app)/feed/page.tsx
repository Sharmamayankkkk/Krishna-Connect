"use client";

import * as React from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { getAvatarUrl } from '@/lib/utils';
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
import { GoogleAd } from '@/components/ads/google-ad';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Challenge } from '@/components/challenges/types';

const SCROLL_THRESHOLD = 500;

export default function FeedPage() {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    const [allPosts, setAllPosts] = React.useState<PostType[]>([]);
    const [visiblePosts, setVisiblePosts] = React.useState<PostType[]>([]);
    const [isInitialLoading, setIsInitialLoading] = React.useState(true);
    const [showNewPostsBanner, setShowNewPostsBanner] = React.useState(false);
    const [newPostsCount, setNewPostsCount] = React.useState(0);
    const [latestNewPostAuthor, setLatestNewPostAuthor] = React.useState<{ name: string; avatar: string | null } | null>(null);
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const newPostsCheckInterval = React.useRef<NodeJS.Timeout | null>(null);

    // Promotion Dialog
    const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
    const [postToPromote, setPostToPromote] = React.useState<PostType | null>(null);

    // User interactions for algorithm — stored in a ref so changes don't trigger re-fetches
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
    // Keep a ref so fetchPosts can access current interactions without being in deps
    const userInteractionsRef = React.useRef(userInteractions);
    React.useEffect(() => { userInteractionsRef.current = userInteractions; }, [userInteractions]);

    // Home Page Challenges Row
    const [featuredChallenges, setFeaturedChallenges] = React.useState<Challenge[]>([]);

    // Fetch posts — only depends on toast, not userInteractions (avoids re-fetch loop)
    const fetchPosts = React.useCallback(async () => {
        setIsInitialLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .rpc('get_home_feed', { p_limit: 20, p_offset: 0 })
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

            // Use ref so this doesn't need userInteractions in deps
            const { feed } = generateFeed(
                transformedPosts,
                userInteractionsRef.current,
                'for_you'
            );

            // Deduplicate by ID before setting — prevents duplicates when a locally-created
            // post is already in state and then returned again by the next fetchPosts() call
            const uniqueFeed = feed.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
            setVisiblePosts(uniqueFeed);
        }
        setIsInitialLoading(false);
    }, [toast]); // NOTE: no userInteractions dep — prevents re-fetch loop

    React.useEffect(() => {
        // Fire posts fetch and challenges fetch IN PARALLEL, not sequentially
        fetchPosts();

        const fetchFeaturedChallenges = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.rpc('get_all_challenges', { p_user_id: user.id });
                if (data) {
                    const active = (data as Challenge[]).filter(c => c.status === 'active' || c.status === 'scheduled');
                    setFeaturedChallenges(active.sort((a, b) => b.participant_count - a.participant_count).slice(0, 3));
                }
            }
        };
        // Don't await fetchPosts — run challenges independently
        fetchFeaturedChallenges();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only runs once on mount

    const checkForNewPosts = React.useCallback(async () => {
        if (allPosts.length === 0) return;
        const supabase = createClient();
        const latestPostTime = allPosts.reduce((latest, post) => {
            const postTime = new Date(post.createdAt).getTime();
            return postTime > latest ? postTime : latest;
        }, 0);
        if (latestPostTime === 0) return;

        const { data, count, error } = await supabase
            .from('posts')
            .select('id, profiles:user_id(name, avatar_url)', { count: 'exact' })
            .gt('created_at', new Date(latestPostTime).toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error checking for new posts:', error);
            return;
        }
        if (count && count > 0) {
            if (data && data.length > 0 && data[0].profiles) {
                const profile: any = Array.isArray(data[0].profiles) ? data[0].profiles[0] : data[0].profiles;
                if (profile) {
                    setLatestNewPostAuthor({
                        name: profile.name || 'Someone',
                        avatar: profile.avatar_url || null
                    });
                }
            }
            setNewPostsCount(count);
            setShowNewPostsBanner(true);
        }
    }, [allPosts]);

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
        setNewPostsCount(0);
        setLatestNewPostAuthor(null);
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

                {/* Between Stories Ad */}
                <div className="max-w-2xl mx-auto px-4">
                    <GoogleAd slot="2513515369" />
                </div>

                {/* Main Content */}
                <div className="flex-1 container max-w-2xl mx-auto p-0 md:p-4">
                    {/* New Posts Banner (Redesigned as Floating Pill) */}
                    {showNewPostsBanner && (
                        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                            <button
                                onClick={handleLoadNewPosts}
                                className="flex items-center gap-2.5 bg-background border border-border/60 shadow-lg hover:shadow-xl hover:bg-muted/50 transition-all font-medium px-4 py-2 rounded-full cursor-pointer group"
                            >
                                {latestNewPostAuthor?.avatar && (
                                    <img
                                        src={getAvatarUrl(latestNewPostAuthor.avatar) || '/male.png'}
                                        alt="Author"
                                        className="h-5 w-5 rounded-full object-cover"
                                    />
                                )}
                                <div className="flex items-center gap-1.5 text-foreground text-sm">
                                    <ArrowUp className="h-4 w-4 text-primary group-hover:-translate-y-0.5 transition-transform" />
                                    <span>
                                        {latestNewPostAuthor?.name
                                            ? `New from ${latestNewPostAuthor.name.split(' ')[0]}${newPostsCount > 1 ? ` and ${newPostsCount - 1} other${newPostsCount > 2 ? 's' : ''}` : ''}`
                                            : `${newPostsCount} New Post${newPostsCount !== 1 ? 's' : ''}`
                                        }
                                    </span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Create Post */}
                    <div className="bg-card rounded-xl border shadow-sm mb-4">
                        <CreatePost
                            onPostCreated={(newPost) => {
                                if (typeof newPost !== 'string') {
                                    setVisiblePosts(prev => {
                                        const next = [newPost, ...prev];
                                        return next.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
                                    });
                                }
                            }}
                        />
                    </div>

                    {/* Featured Challenges Mini-Carousel */}
                    {featuredChallenges.length > 0 && (
                        <div className="mb-6 space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> Trending Challenges</h2>
                                <a href="/challenges" className="text-xs text-primary font-medium hover:underline">View All</a>
                            </div>
                            <div className="flex overflow-x-auto gap-3 pb-2 snap-x no-scrollbar">
                                {featuredChallenges.map(challenge => (
                                    <div key={challenge.id} className="min-w-[260px] max-w-[280px] snap-center shrink-0">
                                        <ChallengeCard challenge={challenge} userId={loggedInUser?.id || null} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </button>
                )}
            </div>
        </>
    );
}
