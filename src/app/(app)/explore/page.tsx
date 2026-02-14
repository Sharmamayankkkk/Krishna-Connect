"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Users, Flame, Heart, MessageCircle, Play, ImageIcon, Compass, Bookmark, Eye, Share2, Sparkles, ChevronRight, Layers } from 'lucide-react';
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

function getGridSpan(index: number): { col: string; row: string } {
    const patternIndex = index % 12;
    if (patternIndex === 0 || patternIndex === 7) {
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

/** Extract a usable URL from a media_urls item (handles both string and {url,type} objects) */
function getMediaUrl(item: any): string | null {
    if (!item) return null;
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item.url) return item.url;
    return null;
}

/** Get media type from a media_urls item */
function getMediaType(item: any): string {
    if (!item) return 'image';
    if (typeof item === 'string') return isVideoUrl(item) ? 'video' : 'image';
    if (typeof item === 'object') return item.type || (isVideoUrl(item.url || '') ? 'video' : 'image');
    return 'image';
}

/** Pick a random image from the media array (for multi-image posts) */
function pickRandomMedia(mediaArray: any[]): { url: string; type: string } | null {
    if (!mediaArray || mediaArray.length === 0) return null;
    // For display variety in the grid, pick a random item
    const idx = Math.floor(Math.random() * mediaArray.length);
    const item = mediaArray[idx];
    const url = getMediaUrl(item);
    if (!url) return null;
    return { url, type: getMediaType(item) };
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
    const [activeCategory, setActiveCategory] = React.useState('all');
    // Store the randomly selected media index per post for stable rendering
    const [selectedMedia, setSelectedMedia] = React.useState<Record<string, { url: string; type: string }>>({});

    const categories = [
        { id: 'all', label: 'For You', icon: Sparkles },
        { id: 'trending', label: 'Trending', icon: Flame },
        { id: 'latest', label: 'Latest', icon: TrendingUp },
        { id: 'people', label: 'People', icon: Users },
    ];

    React.useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            const { data: usersData } = await supabase.rpc('get_who_to_follow', { limit_count: 8 });

            if (usersData) {
                const enhanced = usersData.map((u: any) => ({
                    ...u,
                    followers: u.followers_count,
                    avatar: u.avatar_url || '/placeholder-user.jpg'
                }));
                setSuggestedUsers(enhanced);
            }

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
                .limit(60);

            if (postsData) {
                // Pre-select random media for each post (stable across re-renders)
                const mediaSelection: Record<string, { url: string; type: string }> = {};

                const transformedPosts: PostType[] = postsData.map((p: any) => {
                    // Handle media_urls which can be [{url, type}] objects or plain strings
                    const rawMedia = p.media_urls || [];
                    const normalizedMedia = rawMedia.map((m: any) => ({
                        url: getMediaUrl(m) || '',
                        type: getMediaType(m)
                    })).filter((m: any) => m.url);

                    // Pick a random media item for the grid thumbnail
                    if (normalizedMedia.length > 0) {
                        const idx = Math.floor(Math.random() * normalizedMedia.length);
                        mediaSelection[p.id] = normalizedMedia[idx];
                    }

                    return {
                        id: p.id,
                        content: p.content,
                        createdAt: p.created_at,
                        author: {
                            id: p.author?.id || p.user_id,
                            username: p.author?.username || 'user',
                            name: p.author?.name || 'User',
                            avatar: p.author?.avatar_url || '/user_Avatar/male.png',
                            verified: p.author?.verified || 'none'
                        },
                        media: normalizedMedia,
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
                    };
                });

                setSelectedMedia(mediaSelection);
                const mixedContent = generateExploreContent(transformedPosts, 30);
                setExploreContent(mixedContent);

                // Extract video thumbnails for video posts
                const videoItems = mixedContent.filter(item => {
                    const sel = mediaSelection[item.data.id];
                    return sel?.type === 'video' && sel.url;
                });

                const BATCH_SIZE = 3;
                for (let i = 0; i < videoItems.length; i += BATCH_SIZE) {
                    const batch = videoItems.slice(i, i + BATCH_SIZE);
                    const results = await Promise.allSettled(
                        batch.map(item => {
                            const videoUrl = mediaSelection[item.data.id]?.url;
                            if (!videoUrl) return Promise.reject('No URL');
                            return extractVideoThumbnail(videoUrl)
                                .then(thumb => ({ id: item.data.id, thumb }));
                        })
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

    const handlePostClick = (post: any) => {
        router.push(`/profile/${post.author?.username || 'user'}/post/${post.id}`);
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const filteredContent = React.useMemo(() => {
        if (activeCategory === 'all') return exploreContent;
        if (activeCategory === 'trending') {
            return [...exploreContent].sort((a, b) => (b.data.stats?.likes || 0) - (a.data.stats?.likes || 0));
        }
        if (activeCategory === 'latest') {
            return [...exploreContent].sort((a, b) =>
                new Date(b.data.createdAt || 0).getTime() - new Date(a.data.createdAt || 0).getTime()
            );
        }
        return exploreContent;
    }, [exploreContent, activeCategory]);

    const renderGridItem = (item: ExploreContentItem, index: number) => {
        const post = item.data;
        const sel = selectedMedia[post.id];
        const isVideo = sel?.type === 'video';
        const thumbnailUrl = videoThumbnails[post.id];
        const displaySrc = isVideo ? (thumbnailUrl || sel?.url) : sel?.url;
        const imageHasFailed = failedImages.has(post.id);
        const showImage = displaySrc && !imageHasFailed;
        const hasMultipleMedia = (post.media?.length || 0) > 1;
        const contentPreview = post.content?.replace(/[#@]/g, '').substring(0, 120);
        const { col, row } = getGridSpan(index);
        const isLarge = col === 'col-span-2';

        const gradients = [
            'from-violet-600 via-purple-500 to-fuchsia-500',
            'from-cyan-500 via-blue-500 to-indigo-600',
            'from-rose-500 via-pink-500 to-purple-600',
            'from-emerald-500 via-teal-500 to-cyan-600',
            'from-amber-500 via-orange-500 to-red-500',
            'from-sky-400 via-blue-500 to-violet-600',
            'from-lime-500 via-green-500 to-emerald-600',
            'from-fuchsia-500 via-pink-500 to-rose-600',
        ];
        const gradient = gradients[index % gradients.length];

        return (
            <div
                key={item.id}
                onClick={() => handlePostClick(post)}
                className={cn(
                    "group relative overflow-hidden cursor-pointer",
                    "rounded-[3px] sm:rounded-[4px]",
                    col, row,
                    "aspect-square"
                )}
            >
                {showImage ? (
                    <>
                        <Image
                            src={displaySrc!}
                            alt=""
                            fill
                            unoptimized
                            sizes={isLarge ? "(max-width: 640px) 66vw, 400px" : "(max-width: 640px) 33vw, 200px"}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => {
                                setFailedImages(prev => new Set(prev).add(post.id));
                            }}
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

                        {/* Top-right badges */}
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex items-center gap-1">
                            {isVideo && (
                                <div className="bg-black/60 backdrop-blur-sm rounded-full p-1 sm:p-1.5">
                                    <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-white fill-white" />
                                </div>
                            )}
                            {hasMultipleMedia && !isVideo && (
                                <div className="bg-black/60 backdrop-blur-sm rounded-full p-1 sm:p-1.5">
                                    <Layers className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Stats on hover - centered */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                            <div className="flex items-center gap-3 sm:gap-5 text-white">
                                <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-white drop-shadow-lg" />
                                    <span className="font-bold text-xs sm:text-sm drop-shadow-lg">{formatCount(post.stats?.likes || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 fill-white drop-shadow-lg" />
                                    <span className="font-bold text-xs sm:text-sm drop-shadow-lg">{formatCount(post.stats?.comments || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Author info on large tiles */}
                        {isLarge && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6 ring-1 ring-white/50">
                                        <AvatarImage src={post.author?.avatar || '/user_Avatar/male.png'} />
                                        <AvatarFallback className="text-[8px]">{post.author?.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-white text-[11px] sm:text-xs font-semibold drop-shadow-lg truncate">
                                        {post.author?.username || 'user'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Text-only post or failed image — gradient card */
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br flex flex-col items-center justify-center p-2 sm:p-4",
                        gradient
                    )}>
                        <div className="text-center space-y-1 sm:space-y-2 max-w-full">
                            <p className={cn(
                                "font-semibold text-white/95 leading-snug",
                                isLarge ? "text-xs sm:text-base line-clamp-6" : "text-[10px] sm:text-xs line-clamp-3 sm:line-clamp-4"
                            )}>
                                {contentPreview || 'Shared a thought ✨'}
                            </p>
                            <div className="flex items-center justify-center gap-1">
                                <Avatar className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                                    <AvatarImage src={post.author?.avatar || '/user_Avatar/male.png'} />
                                    <AvatarFallback className="text-[6px] sm:text-[8px]">{post.author?.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <p className="text-[8px] sm:text-[10px] text-white/70 font-medium truncate">
                                    @{post.author?.username || 'user'}
                                </p>
                            </div>
                        </div>

                        {/* Stats overlay on hover */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="flex items-center gap-3 sm:gap-5 text-white">
                                <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                                    <span className="font-bold text-xs sm:text-sm">{formatCount(post.stats?.likes || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                                    <span className="font-bold text-xs sm:text-sm">{formatCount(post.stats?.comments || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b">
                <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
                    <SidebarTrigger className="md:hidden" />
                    <div className="flex items-center gap-2 flex-1">
                        <Compass className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-bold">Explore</h1>
                    </div>
                    {loggedInUser && (
                        <Link href={`/profile/${loggedInUser.username}`}>
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/20 transition-all hover:ring-primary/50 hover:scale-105">
                                <AvatarImage src={loggedInUser.avatar_url || '/placeholder-user.jpg'} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                        </Link>
                    )}
                </div>

                {/* Search */}
                <div className="px-3 sm:px-4 pb-2.5 sm:pb-3">
                    <GlobalSearchBar placeholder="Search posts, users, hashtags..." />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 sm:gap-2 px-3 sm:px-4 pb-2.5 sm:pb-3 overflow-x-auto scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200",
                                activeCategory === cat.id
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                        >
                            <cat.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto">

                    {/* Suggested Users */}
                    {(activeCategory === 'all' || activeCategory === 'people') && suggestedUsers.length > 0 && (
                        <section className="px-3 sm:px-4 py-3 sm:py-4 border-b">
                            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <h2 className="text-xs sm:text-sm font-semibold">Suggested for you</h2>
                                </div>
                                <Link href="/explore" className="text-[11px] sm:text-xs text-primary font-semibold hover:text-primary/80 flex items-center gap-0.5">
                                    See All <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
                                {suggestedUsers.map((user: any) => (
                                    <Link
                                        key={user.id}
                                        href={`/profile/${user.username}`}
                                        className="flex flex-col items-center gap-1 min-w-[60px] sm:min-w-[72px] group"
                                    >
                                        <div className="relative">
                                            <div className="p-0.5 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500">
                                                <Avatar className="h-11 w-11 sm:h-14 sm:w-14 ring-2 ring-background">
                                                    <AvatarImage src={user.avatar_url || user.avatar || '/user_Avatar/male.png'} />
                                                    <AvatarFallback className="text-[10px] sm:text-xs">{user.name?.[0] || user.username?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] text-center truncate w-full font-medium group-hover:text-primary transition-colors">
                                            {user.username}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trending Topics — Compact pills */}
                    {(activeCategory === 'all' || activeCategory === 'trending') && (
                        <section className="px-3 sm:px-4 py-3 sm:py-4 border-b">
                            <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <h2 className="text-xs sm:text-sm font-semibold">Trending</h2>
                            </div>
                            <TrendingTopicsList
                                onHashtagClick={(tag) => {
                                    router.push(`/hashtag/${tag}`);
                                }}
                            />
                        </section>
                    )}

                    {/* Instagram-style Grid */}
                    <section className="p-[1px] sm:p-0.5">
                        <div className="grid grid-cols-3 gap-[1px] sm:gap-0.5 auto-rows-fr">
                            {isLoading ? (
                                Array.from({ length: 15 }).map((_, i) => {
                                    const { col, row } = getGridSpan(i);
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "relative aspect-square overflow-hidden rounded-[3px] sm:rounded-[4px]",
                                                col, row
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-muted animate-pulse" />
                                        </div>
                                    );
                                })
                            ) : filteredContent.length > 0 ? (
                                filteredContent.map((item, index) => renderGridItem(item, index))
                            ) : (
                                <div className="col-span-3 flex flex-col items-center justify-center py-16 sm:py-20 text-muted-foreground">
                                    <div className="p-3 sm:p-4 rounded-full bg-muted mb-3 sm:mb-4">
                                        <Compass className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-base sm:text-lg font-semibold">Nothing to explore yet</p>
                                    <p className="text-xs sm:text-sm mt-1">Posts from the community will appear here</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
