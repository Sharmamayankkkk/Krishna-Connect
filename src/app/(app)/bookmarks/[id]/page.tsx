'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PostType } from '@/lib/types';
import { PostCard } from '@/components/features/posts/post-card';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useDeleteCollection, useRemoveFromCollection } from '../hooks/useCollections';

import { useTranslation } from 'react-i18next';

function isVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExts.some(ext => url.toLowerCase().includes(ext));
}

function useCollectionPosts(collectionId: string) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['collection-posts', collectionId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_collection_posts', {
                p_collection_id: parseInt(collectionId, 10),
                p_limit: 50
            });
            if (error) throw error;
            return data;
        }
    });
}

// Transform RPC data to PostType (Simplified version of usePosts transform)
const transformPostData = (post: any): PostType => {
    return {
        id: post.id.toString(),
        author: {
            id: post.user_id,
            name: post.author_name,
            username: post.author_username,
            avatar: post.author_avatar || '/user_Avatar/male.png',
            verified: post.author_verified || 'none'
        },
        content: post.content,
        media: Array.isArray(post.media)
            ? post.media.map((m: any) => ({
                url: typeof m === 'string' ? m : m.url,
                type: typeof m === 'string'
                    ? (isVideoUrl(m) ? 'video' : 'image')
                    : (m.type || 'image')
            }))
            : [],
        poll: post.poll,
        createdAt: post.created_at,
        stats: {
            comments: post.comments_count,
            reshares: 0,
            reposts: post.reposts_count,
            likes: post.likes_count,
            views: 0,
            bookmarks: post.bookmarks_count || 0
        },
        comments: [],
        likedBy: post.is_liked ? [post.user_id] : [],
        savedBy: post.is_bookmarked ? [post.user_id] : [],
        repostedBy: post.is_reposted ? [post.user_id] : [],
        isPromoted: false,
        originalPost: null
    };
};

export default function CollectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();

    const router = useRouter();
    const { id: collectionId } = use(params);

    // Fetch collection info (we could pass this via state, but catching it fresh is safer)
    // We can reuse useCollections and find it, or add a get_collection RPC. 
    // For now, let's just use the posts query and maybe a lightweight metadata query if needed.
    // Actually, we need the collection name.

    // Let's just fetch the posts first.
    const { data: rawPosts, isLoading } = useCollectionPosts(collectionId);
    const posts = rawPosts ? rawPosts.map(transformPostData) : [];

    const { mutate: deleteCollection } = useDeleteCollection();
    const { mutate: removeFromCollection } = useRemoveFromCollection();

    const handleDeleteCollection = () => {
        if (confirm('Are you sure you want to delete this collection?')) {
            deleteCollection(collectionId, {
                onSuccess: () => router.push('/bookmarks')
            });
        }
    };

    const handleRemovePost = (postId: string) => {
        if (confirm('Remove this post from collection?')) {
            removeFromCollection({ collectionId, postId });
        }
    };

    return (
        <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between p-4">
                    <div className='flex items-center gap-4'>
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">{t('common.collection')}</h1>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteCollection}>
                                <Trash2 className="mr-2 h-4 w-4" />{t('common.deleteCollection')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : posts.length > 0 ? (
                        posts.map((post: PostType) => (
                            <div key={post.id} className="relative group">
                                <PostCard
                                    post={post}
                                    onComment={() => { }}
                                    onDelete={() => { }}
                                    onEdit={() => { }}
                                    onLikeToggle={() => { }}
                                    onSaveToggle={() => { }} // This toggles *global* bookmark
                                    onCommentLikeToggle={() => { }}
                                    onCommentPinToggle={() => { }}
                                    onCommentHideToggle={() => { }}
                                    onCommentDelete={() => { }}
                                    onQuotePost={() => { }}
                                    onRepost={() => { }}
                                    onPollVote={() => { }}
                                    onPromote={() => { }}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePost(post.id);
                                    }}
                                >{t('common.remove')}</Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">{t('common.noPostsInThisCollectionYet')}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
