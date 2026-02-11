"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Users, Flame } from 'lucide-react';
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
import { PostType } from '@/app/(app)/types';

export default function ExplorePage() {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();
    const router = useRouter();
    const [suggestedUsers, setSuggestedUsers] = React.useState<any[]>([]);
    const [exploreContent, setExploreContent] = React.useState<ExploreContentItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

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
                    media: p.media_urls?.map((url: string) => ({ url, type: 'image' })) || [],
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
                const mixedContent = generateExploreContent(transformedPosts, 20);
                setExploreContent(mixedContent);
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

    const renderContentItem = (item: ExploreContentItem) => {
        // Only post type now
        const post = item.data;
        // Get first image, ensuring it's not an empty string
        const mediaUrl = post.media?.[0]?.url || (Array.isArray(post.media_urls) ? post.media_urls[0] : null);
        const firstImage = mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() !== '' ? mediaUrl : null;
        const contentPreview = post.content?.replace(/[#@]/g, '').substring(0, 60);

        return (
            <div
                key={item.id}
                onClick={() => handlePostClick(post)}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            >
                {firstImage ? (
                    <>
                        <Image
                            src={firstImage}
                            alt="Post media"
                            fill
                            unoptimized
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-white text-xs font-medium line-clamp-2">
                                {contentPreview}
                            </p>
                            <p className="text-white/80 text-xs mt-1">
                                @{post.author?.username || 'user'}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-accent/30 flex items-center justify-center p-4">
                        <div className="text-center">
                            <p className="text-sm font-medium line-clamp-3">
                                {contentPreview}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                @{post.author?.username || 'user'}
                            </p>
                        </div>
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

                    {/* Suggested Users */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-bold">Who to Follow</h2>
                        </div>
                        {suggestedUsers.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
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

                    {/* Dynamic Mixed Content */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <h2 className="text-xl font-bold">Discover</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {isLoading ? (
                                [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div
                                        key={i}
                                        className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                                    </div>
                                ))
                            ) : exploreContent.length > 0 ? (
                                exploreContent.map(renderContentItem)
                            ) : (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No content available
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
