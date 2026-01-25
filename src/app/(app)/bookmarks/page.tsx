'use client';

import * as React from 'react';
import {
    Bookmark,
    Plus,
    Settings,
    List,
    Grid
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { PostCard } from '@/components/features/posts/post-card';
import { PostType } from '@/lib/types';
import { useRouter } from 'next/navigation';

// Type for bookmark collections
type BookmarkCollection = {
    id: string;
    name: string;
    postIds: string[];
    createdAt: string;
    isPrivate: boolean;
};

// Mock collections (to be replaced with real data)
const mockCollections: BookmarkCollection[] = [
    {
        id: 'collection_1',
        name: 'Spiritual Wisdom',
        postIds: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        isPrivate: false,
    },
    {
        id: 'collection_2',
        name: 'Kirtan Melodies',
        postIds: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        isPrivate: true,
    },
    {
        id: 'collection_3',
        name: 'Festival Photos',
        postIds: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        isPrivate: false,
    },
];

// Collection Card Component
function CollectionCard({ collection, postCount }: { collection: BookmarkCollection, postCount: number }) {
    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{collection.name}</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{postCount}</div>
                <p className="text-xs text-muted-foreground">
                    {collection.isPrivate ? 'Private' : 'Public'}
                </p>
            </CardContent>
        </Card>
    );
}

export default function BookmarksPage() {
    const router = useRouter();

    // Empty bookmarked posts - will be fetched from DB
    const bookmarkedPosts: PostType[] = [];

    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between p-4">
                    <div className='flex items-center gap-4'>
                        <SidebarTrigger className="md:hidden" />
                        <div>
                            <h1 className="text-xl font-bold">Bookmarks</h1>
                            <p className="text-sm text-muted-foreground">Your saved posts and collections</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Collection
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setViewMode('list')}>
                                    <List className="mr-2 h-4 w-4" />
                                    <span>List View</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setViewMode('grid')}>
                                    <Grid className="mr-2 h-4 w-4" />
                                    <span>Grid View</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto">
                            <TabsTrigger value="all" className="py-2">All Posts</TabsTrigger>
                            <TabsTrigger value="collections" className="py-2">Collections</TabsTrigger>
                        </TabsList>

                        {/* All Bookmarked Posts */}
                        <TabsContent value="all" className="mt-4">
                            {bookmarkedPosts.length > 0 ? (
                                <div className={viewMode === 'list' ? "space-y-0 border rounded-lg overflow-hidden" : "grid grid-cols-2 md:grid-cols-3 gap-4"}>
                                    {bookmarkedPosts.map(post =>
                                        viewMode === 'list' ? (
                                            <PostCard
                                                key={post.id}
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
                                            <Card key={post.id} className="overflow-hidden">
                                                {post.media && post.media.length > 0 &&
                                                    <img src={post.media[0].url} alt={post.media[0].alt || ''} className="w-full h-40 object-cover" />
                                                }
                                                <CardContent className="p-3">
                                                    <p className="text-sm line-clamp-2">{post.content}</p>
                                                </CardContent>
                                            </Card>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-semibold">No Bookmarks Yet</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Save posts to see them here.
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Bookmark Collections */}
                        <TabsContent value="collections" className="mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {mockCollections.map(collection => (
                                    <CollectionCard
                                        key={collection.id}
                                        collection={collection}
                                        postCount={collection.postIds.length}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
