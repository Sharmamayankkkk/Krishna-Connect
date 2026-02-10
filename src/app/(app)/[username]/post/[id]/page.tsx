"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PostCard, PostSkeleton } from "@/components/features/posts/post-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PostType } from "@/lib/types";

export default function UserPostPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const postId = Number(params.id);

    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    author:profiles!user_id(*),
                    media:post_media(*),
                    likes:post_likes(user_id),
                    saved:saved_posts(user_id),
                    reposted:reposts(user_id),
                    comments:comments(
                        *,
                        author:profiles!user_id(*)
                    ),
                    collaborators:post_collaborators(
                        user:profiles(*)
                    )
                `)
                .eq('id', postId)
                .single();

            if (!error && data) {
                const formattedPost: PostType = {
                    id: data.id,
                    content: data.content,
                    createdAt: data.created_at,
                    author: {
                        id: data.author.id,
                        name: data.author.name,
                        username: data.author.username,
                        avatar: data.author.avatar_url,
                        verified: data.author.verified
                    },
                    media: data.media?.map((m: any) => ({
                        type: m.type,
                        url: m.url,
                        width: m.width,
                        height: m.height
                    })) || [],
                    stats: {
                        likes: data.likes?.length || 0,
                        comments: data.comments?.length || 0,
                        reposts: data.reposted?.length || 0,
                        views: Math.floor(Math.random() * 1000),
                        reshares: 0,
                        bookmarks: data.saved?.length || 0
                    },
                    likedBy: data.likes?.map((l: any) => l.user_id) || [],
                    savedBy: data.saved?.map((s: any) => s.user_id) || [],
                    repostedBy: data.reposted?.map((r: any) => r.user_id) || [],
                    collaborators: data.collaborators?.map((c: any) => c.user) || [],
                    originalPost: null,
                    isRepost: false,
                    comments: data.comments || [],
                    poll: data.poll
                };
                setPost(formattedPost as any);
            }
            setLoading(false);
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Post</h1>
            </header>

            <main className="flex-1">
                {loading ? (
                    <div className="p-4">
                        <PostSkeleton />
                    </div>
                ) : post ? (
                    <PostCard
                        post={post}
                        onComment={() => { }}
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
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <h2 className="text-lg font-semibold">Post not found</h2>
                        <p>This post may have been deleted.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
