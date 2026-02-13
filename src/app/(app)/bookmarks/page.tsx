'use client';

import * as React from 'react';
import {
    Bookmark,
    Plus,
    Settings,
    List,
    Grid,
    Loader2,
    Trash2,
    MoreHorizontal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { PostCard } from '@/components/features/posts/post-card';
import { useRouter } from 'next/navigation';
import { usePosts } from '@/app/(app)/explore/hooks/usePosts';
import { useCollections, useCreateCollection, useDeleteCollection } from './hooks/useCollections';
import { BookmarkCollection } from '@/types/collections';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link'; // Import Link

// Collection Card Component
function CollectionCard({ collection }: { collection: BookmarkCollection }) {
    const { mutate: deleteCollection } = useDeleteCollection();

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this collection?')) {
            deleteCollection(collection.id);
        }
    };

    return (
        <Link href={`/bookmarks/${collection.id}`} passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium truncate pr-2">{collection.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={(e) => e.preventDefault()}>
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    {collection.last_post_cover ? (
                        <div className="w-full aspect-video rounded-md overflow-hidden mb-2 bg-muted">
                            <img src={collection.last_post_cover} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full aspect-video rounded-md overflow-hidden mb-2 bg-muted flex items-center justify-center">
                            <Bookmark className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                    )}

                    <div>
                        <div className="text-2xl font-bold">{collection.post_count}</div>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                                {collection.is_private ? 'Private' : 'Public'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// Create Collection Dialog
function CreateCollectionDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    const [name, setName] = React.useState('');
    const [isPrivate, setIsPrivate] = React.useState(true);
    const { mutate: createCollection, isPending } = useCreateCollection();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createCollection({ name, isPrivate }, {
            onSuccess: () => {
                setOpen(false);
                setName('');
                setIsPrivate(true);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Collection</DialogTitle>
                        <DialogDescription>
                            Organize your saved posts into collections.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Inspiration"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="privacy" className="text-right">
                                Private
                            </Label>
                            <div className="flex items-center space-x-2 col-span-3">
                                <Switch
                                    id="privacy"
                                    checked={isPrivate}
                                    onCheckedChange={setIsPrivate}
                                />
                                <Label htmlFor="privacy" className="font-normal text-muted-foreground">
                                    Only you can see this collection
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Collection
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function BookmarksPage() {
    const router = useRouter();

    // Fetch bookmarks (all posts)
    const { data: postsData, isLoading: isPostsLoading } = usePosts('bookmarks');
    const posts = postsData?.pages.flatMap((page: any) => page.posts) || [];

    // Fetch collections
    const { data: collections, isLoading: isCollectionsLoading } = useCollections();

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
                        <CreateCollectionDialog>
                            <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                New Collection
                            </Button>
                        </CreateCollectionDialog>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                        <TabsList className="grid w-full grid-cols-2 h-auto mb-6">
                            <TabsTrigger value="all" className="py-2">All Posts</TabsTrigger>
                            <TabsTrigger value="collections" className="py-2">Collections</TabsTrigger>
                        </TabsList>

                        {/* All Bookmarked Posts */}
                        <TabsContent value="all" className="mt-0 space-y-4">
                            {isPostsLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : posts && posts.length > 0 ? (
                                <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-2 md:grid-cols-3 gap-4"}>
                                    {posts.map((post: any) => (
                                        viewMode === 'list' ? (
                                            <div key={post.id} className="border rounded-xl bg-card">
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
                                            </div>
                                        ) : (
                                            <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                                {post.media && post.media.length > 0 ? (
                                                    <img src={post.media[0].url} alt={post.media[0].alt || ''} className="w-full h-40 object-cover" />
                                                ) : (
                                                    <div className="w-full h-40 bg-muted flex items-center justify-center p-4">
                                                        <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
                                                    </div>
                                                )}
                                                <CardContent className="p-3">
                                                    <p className="text-sm line-clamp-2 font-medium">{post.author.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt))} ago</p>
                                                </CardContent>
                                            </Card>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                    <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-semibold">No Bookmarks Yet</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Save posts to see them here.
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Bookmark Collections */}
                        <TabsContent value="collections" className="mt-0">
                            {isCollectionsLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : collections && collections.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {collections.map(collection => (
                                        <CollectionCard
                                            key={collection.id}
                                            collection={collection}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                    <List className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-semibold">No Collections Yet</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Create a collection to organize your bookmarks.
                                    </p>
                                    <div className="mt-4">
                                        <CreateCollectionDialog>
                                            <Button>Create Collection</Button>
                                        </CreateCollectionDialog>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
