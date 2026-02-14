"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PostCard, PostSkeleton } from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { PostType } from "@/lib/types";

export default function HashtagPage() {
    const params = useParams();
    const router = useRouter();
    const tag = params.tag as string;

    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const supabase = createClient();

            // Remove # if present and search for hashtag
            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;

            // First get the hashtag ID
            const { data: hashtagData } = await supabase
                .from('hashtags')
                .select('id')
                .ilike('tag', cleanTag)
                .single();

            if (!hashtagData) {
                setLoading(false);
                return;
            }

            // Then get posts via the join table
            const { data, error } = await supabase
                .from('post_hashtags')
                .select(`
                    post_id
                `)
                .eq('hashtag_id', hashtagData.id);

            if (error) {
                console.error('Error fetching hashtag posts:', error);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                // Now fetch full post details
                const postIds = data.map(item => item.post_id);

                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('*')
                    .in('id', postIds);

                if (postsError) {
                    console.error('Error fetching posts:', postsError);
                    setLoading(false);
                    return;
                }

                if (postsData) {
                    // Fetch additional data for each post
                    const enrichedPosts = await Promise.all(postsData.map(async (p: any) => {
                        // Fetch author
                        const { data: authorData } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', p.user_id)
                            .single();

                        // Fetch stats
                        const { count: likesCount } = await supabase
                            .from('post_likes')
                            .select('*', { count: 'exact', head: true })
                            .eq('post_id', p.id);

                        const { count: commentsCount } = await supabase
                            .from('comments')
                            .select('*', { count: 'exact', head: true })
                            .eq('post_id', p.id);

                        return {
                            id: p.id,
                            content: p.content,
                            createdAt: p.created_at,
                            author: authorData ? {
                                id: authorData.id,
                                name: authorData.name,
                                username: authorData.username,
                                avatar: authorData.avatar_url,
                                verified: authorData.verified
                            } : null,
                            media: Array.isArray(p.media_urls) ? p.media_urls.map((item: any) => {
                                if (typeof item === 'string') return { type: 'image' as const, url: item };
                                if (item && typeof item === 'object' && item.url) return { type: item.type || 'image', url: item.url };
                                return null;
                            }).filter(Boolean) : [],
                            stats: {
                                likes: likesCount || 0,
                                comments: commentsCount || 0,
                                reposts: 0,
                                views: 0,
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
                            poll: p.poll
                        };
                    }));

                    // Sort by date (client side)
                    enrichedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setPosts(enrichedPosts as any);
                }
            }
            setLoading(false);
        };

        if (tag) {
            fetchPosts();
        }
    }, [tag]);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-1">
                        <Hash className="h-5 w-5 text-primary" />
                        {tag}
                    </h1>
                    <p className="text-xs text-muted-foreground">{posts.length} posts</p>
                </div>
            </header>

            <main className="flex-1">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : posts.length > 0 ? (
                    <div>
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onComment={() => { }} // simplified
                                onDelete={() => { }}
                                onEdit={() => { }}
                                onLikeToggle={() => { }}
                                onSaveToggle={() => { }}
                                onCommentLikeToggle={() => { }}
                                onCommentPinToggle={() => { }}
                                onCommentHideToggle={() => { }}
                                onCommentDelete={() => { }}
                                onQuotePost={() => { }}
                                onRepost={() => { }}
                                onPollVote={() => { }}
                                onPromote={() => { }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-semibold">No posts yet</h2>
                        <p>Be the first to post with #{tag}!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
