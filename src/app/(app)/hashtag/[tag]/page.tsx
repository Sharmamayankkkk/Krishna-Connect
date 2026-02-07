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

            // First get the hashtag ID
            const { data: hashtagData } = await supabase
                .from('hashtags')
                .select('id')
                .ilike('tag', tag)
                .single();

            if (!hashtagData) {
                setLoading(false);
                return;
            }

            // Then get posts via the join table
            const { data, error } = await supabase
                .from('post_hashtags')
                .select(`
                    post:posts (
                        *,
                        author:profiles(*),
                        media:post_media(*),
                        likes:post_likes(user_id),
                        saved:saved_posts(user_id),
                        reposted:reposts(user_id),
                        comments:comments(count),
                        collaborators:post_collaborators(
                             user:profiles(*)
                        )
                    )
                `)
                .eq('hashtag_id', hashtagData.id)
                .order('post(created_at)', { ascending: false });

            if (!error && data) {
                const formattedPosts: PostType[] = data.map((item: any) => {
                    const p = item.post;
                    // Map formatting similar to feed.tsx
                    return {
                        id: p.id,
                        content: p.content,
                        createdAt: p.created_at,
                        author: {
                            id: p.author.id,
                            name: p.author.name,
                            username: p.author.username,
                            avatar: p.author.avatar_url,
                            verified: p.author.verified
                        },
                        media: (p.media || []).map((m: any) => ({
                            type: m.type,
                            url: m.url,
                            width: m.width,
                            height: m.height
                        })),
                        stats: {
                            likes: p.likes?.length || 0,
                            comments: p.comments?.[0]?.count || 0,
                            reposts: p.reposted?.length || 0,
                            views: Math.floor(Math.random() * 1000), // Mock
                            reshares: 0,
                            bookmarks: p.saved?.length || 0
                        },
                        likedBy: (p.likes || []).map((l: any) => l.user_id),
                        savedBy: (p.saved || []).map((s: any) => s.user_id),
                        repostedBy: (p.reposted || []).map((r: any) => r.user_id),
                        collaborators: p.collaborators?.map((c: any) => c.user) || [],
                        originalPost: null, // Simplified for now
                        isRepost: false,
                        comments: [], // Not loading comments here
                        poll: p.poll
                    };
                });
                // Sort manual again just in case (client side sort)
                formattedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPosts(formattedPosts as any);
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
