"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Users, Flame, Heart, MessageCircle, Play, ImageIcon } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { GlobalSearchBar } from "@/components/global-search-bar";
import { TrendingTopicsList, UserCard } from './components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateExploreContent, ExploreContentItem } from './explore-algorithm';
import { PostType } from '@/lib/types';
import { extractVideoThumbnail } from '@/lib/video-thumbnail';
import { cn } from '@/lib/utils';

// Instagram-style grid pattern: every 3rd row has a large tile
// Pattern: [small, small, small], [small, small, small], [large (2x2), small, small], repeat
function getGridSpan(index: number): { col: string; row: string } {
    // Every 10th item starting from index 2 gets a large tile (2x2)
    const patternIndex = index % 12;
    if (patternIndex === 2 || patternIndex === 9) {
        return { col: 'col-span-2', row: 'row-span-2' };
    }
    return { col: 'col-span-1', row: 'row-span-1' };
}

function isVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const lower = url.toLowerCase();
    return videoExts.some(ext => lower.includes(ext));
}

export default function ExplorePage() {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();
    const router = useRouter();
    const [suggestedUsers, setSuggestedUsers] = React.useState<any[]>([]);
    const [exploreContent, setExploreContent] = React.useState<ExploreContentItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [videoThumbnails, setVideoThumbnails] = React.useState<Record<string, string>>({});
    const [failedImages, setFailedImages] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            // Fetch suggested users using RPC to get real follower counts
            const { data: usersData } = await supabase.rpc('get_who_to_follow', { limit_count: 6 });

            if (usersData) {
                const enhanced = usersData.map((u: any) => ({
                    ...u,
                    followers: u.followers_count,
                    avatar: u.avatar_url || '/placeholder-user.jpg'
                }));
                setSuggestedUsers(enhanced);
            }

            // Fetch posts for the explore algorithm
            const { data: postsData } = await supabase
                .from('posts')
                .select(`
                    id,
                    content,
                    media_urls,
                    created_at,
                    user_id,
                    author:profiles!user_id (
                        id,
                        username,
                        name,
                        avatar_url,
                        verified
                    ),
                    likes:post_likes(count),
                    comments:comments(count),
                    views:post_views(count),
                    reposts:post_reposts(count)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (postsData) {
                // Transform to PostType format
                const transformedPosts: PostType[] = postsData.map((p: any) => ({
                    id: p.id,
                    content: p.content,
                    createdAt: p.created_at,
                    author: {
                        id: p.author.id,
                        username: p.author.username,
                        name: p.author.name,
                        avatar: p.author.avatar_url,
                        verified: p.author.verified || false
                    },
                    media: p.media_urls?.map((url: string) => ({
                        url,
                        type: isVideoUrl(url) ? 'video' : 'image'
                    })) || [],
                    stats: {
                        likes: p.likes?.[0]?.count || 0,
                        comments: p.comments?.[0]?.count || 0,
                        views: p.views?.[0]?.count || 0,
                        reposts: p.reposts?.[0]?.count || 0,
                        reshares: 0,
                        bookmarks: 0
                    },
                    likedBy: [],
                    savedBy: [],
                    repostedBy: [],
                    collaborators: [],
                    originalPost: null,
                    isRepost: false,
                    comments: [],
                    poll: undefined
                }));

                // Generate mixed content using algorithm
                const mixedContent = generateExploreContent(transformedPosts, 24);
                setExploreContent(mixedContent);

                // Extract video thumbnails in batches of 3 to avoid overwhelming the browser
                const videoItems = mixedContent.filter(item => {
                    const firstMedia = item.data.media?.[0];
                    return firstMedia?.type === 'video' && firstMedia.url;
                });

                const BATCH_SIZE = 3;
                for (let i = 0; i < videoItems.length; i += BATCH_SIZE) {
                    const batch = videoItems.slice(i, i + BATCH_SIZE);
                    const results = await Promise.allSettled(
                        batch.map(item =>
                            extractVideoThumbnail(item.data.media[0].url)
                                .then(thumb => ({ id: item.data.id, thumb }))
                        )
                    );
                    for (const result of results) {
                        if (result.status === 'fulfilled') {
                            setVideoThumbnails(prev => ({ ...prev, [result.value.id]: result.value.thumb }));
                        }
                    }
                }
            }

            setIsLoading(false);
        };
        fetchData();
    }, []);

    const handleFollowUser = (userId: string) => {
        toast({
            title: "Following",
            description: "You are now following this user"
        });
    };

    const handlePostClick = (post: any) => {
        router.push(`/profile/${post.author.username}/post/${post.id}`);
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const renderGridItem = (item: ExploreContentItem, index: number) => {
        const post = item.data;
        const mediaUrl = post.media?.[0]?.url || (Array.isArray(post.media_urls) ? post.media_urls[0] : null);
        const firstMedia = mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() !== '' ? mediaUrl : null;
        const isVideo = post.media?.[0]?.type === 'video' || (firstMedia && isVideoUrl(firstMedia));
        const thumbnailUrl = videoThumbnails[post.id];
        const contentPreview = post.content?.replace(/[#@]/g, '').substring(0, 80);
        const { col, row } = getGridSpan(index);
        const hasMultipleImages = (post.media?.length || 0) > 1;
        const imageHasFailed = failedImages.has(post.id);

        // Determine the display image source
        const displaySrc = isVideo ? (thumbnailUrl || firstMedia) : firstMedia;
        const showImage = displaySrc && !imageHasFailed;

        // Gradient backgrounds for text-only or failed image posts
        const gradients = [
            'from-primary/40 via-purple-500/30 to-pink-500/40',
            'from-blue-500/40 via-cyan-500/30 to-teal-500/40',
            'from-orange-500/40 via-red-500/30 to-pink-500/40',
            'from-green-500/40 via-emerald-500/30 to-teal-500/40',
            'from-violet-500/40 via-purple-500/30 to-fuchsia-500/40',
            'from-amber-500/40 via-orange-500/30 to-red-500/40',
        ];
        const gradient = gradients[index % gradients.length];

        const statsOverlay = (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="flex items-center gap-6 text-white">
                    <div className="flex items-center gap-1.5">
                        <Heart className="h-5 w-5 fill-white" />
                        <span className="font-semibold text-sm">{formatCount(post.stats?.likes || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-5 w-5 fill-white" />
                        <span className="font-semibold text-sm">{formatCount(post.stats?.comments || 0)}</span>
                    </div>
                </div>
            </div>
        );

        return (
            <div
                key={item.id}
                onClick={() => handlePostClick(post)}
                className={cn(
                    "group relative overflow-hidden bg-muted cursor-pointer",
                    col, row,
                    "aspect-square"
                )}
            >
                {showImage ? (
                    <>
                        <Image
                            src={displaySrc!}
                            alt="Post"
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => {
                                setFailedImages(prev => new Set(prev).add(post.id));
                            }}
                        />

                        {/* Video indicator */}
                        {isVideo && (
                            <div className="absolute top-2 right-2 z-10">
                                <Play className="h-5 w-5 text-white drop-shadow-lg fill-white" />
                            </div>
                        )}

                        {/* Multiple images indicator */}
                        {hasMultipleImages && !isVideo && (
                            <div className="absolute top-2 right-2 z-10">
                                <ImageIcon className="h-5 w-5 text-white drop-shadow-lg" />
                            </div>
                        )}

                        {statsOverlay}
                    </>
                ) : (
                    /* Text-only / failed-image post with gradient background */
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br flex items-center justify-center p-4",
                        gradient
                    )}>
                        <div className="text-center space-y-2">
                            {firstMedia && imageHasFailed && (
                                <ImageIcon className="h-8 w-8 text-foreground/40 mx-auto" />
                            )}
                            <p className="text-sm font-medium line-clamp-4 text-foreground">
                                {contentPreview || 'No preview available'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                @{post.author?.username || 'user'}
                            </p>
                        </div>
                        {statsOverlay}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header with Search */}
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center gap-4 p-4">
                    <SidebarTrigger className="md:hidden" />

                    <div className="flex items-center gap-2 flex-1">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-xl font-bold">Explore</h1>
                    </div>

                    {/* User Avatar */}
                    {loggedInUser && (
                        <Link href={`/profile/${loggedInUser.username}`}>
                            <Avatar className="h-8 w-8 transition-transform hover:scale-110">
                                <AvatarImage src={loggedInUser.avatar_url || '/placeholder-user.jpg'} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                        </Link>
                    )}
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-4">
                    <GlobalSearchBar placeholder="Search posts, users, hashtags..." />
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 container max-w-5xl mx-auto p-4 md:p-6">
                <div className="space-y-8">
                    {/* Trending Topics */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Flame className="h-5 w-5 text-orange-500" />
                            <h2 className="text-xl font-bold">Trending Now</h2>
                        </div>
                        <TrendingTopicsList
                            onHashtagClick={(tag) => {
                                router.push(`/hashtag/${tag}`);
                            }}
                        />
                    </section>

                    {/* Suggested Users - horizontal scroll on mobile */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-bold">Who to Follow</h2>
                        </div>
                        {suggestedUsers.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
                                {suggestedUsers.map((user: any) => (
                                    <div key={user.id} className="min-w-[200px] md:min-w-0">
                                        <UserCard
                                            user={user}
                                            onFollow={handleFollowUser}
                                            isFollowing={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="border rounded-lg p-4 space-y-3 min-w-[200px] md:min-w-0">
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

                    {/* Instagram-Style Grid */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <h2 className="text-xl font-bold">Discover</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                            {isLoading ? (
                                Array.from({ length: 12 }).map((_, i) => {
                                    const { col, row } = getGridSpan(i);
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "relative aspect-square overflow-hidden bg-muted",
                                                col, row
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse" />
                                        </div>
                                    );
                                })
                            ) : exploreContent.length > 0 ? (
                                exploreContent.map((item, index) => renderGridItem(item, index))
                            ) : (
                                <div className="col-span-3 text-center py-16 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <Search className="h-12 w-12 text-muted-foreground/40" />
                                        <p className="text-lg font-medium">No content to explore yet</p>
                                        <p className="text-sm">Be the first to share something!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
