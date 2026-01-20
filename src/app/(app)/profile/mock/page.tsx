'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, MoreHorizontal, UserPlus, UserCheck, Grid3x3, Bookmark, Loader2, Share2 } from 'lucide-react';
import { PostDetailDialog } from '../../components/post-detail-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { Post, User, Message as Comment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// MOCK DATA
const mockUser: User = {
    id: 'user-gauranga',
    name: 'Gauranga',
    username: 'gauranga_das',
    avatar_url: 'https://sfblvtwlqmnpjumbross.supabase.co/storage/v1/object/public/attachments/public/deb82b82-ea7d-48a2-ae2a-deda63d71421/avatar.jpeg?t=1750872060990',
    bio: 'President and Founder\n🙏 Spreading Krishna Consciousness\n📿 Hare Krishna Movement',
    is_verified: true,
    is_admin: false,
};

const mockOtherUsers: User[] = [
    { id: 'user-2', name: 'Bhakta John', username: 'john_bhakti', avatar_url: 'https://i.pravatar.cc/150?u=user2', is_admin: false },
    { id: 'user-3', name: 'Mataji Radha', username: 'radha_gopi', avatar_url: 'https://i.pravatar.cc/150?u=user3', is_admin: false },
    { id: 'user-4', name: 'Prabhu Krishna', username: 'krishna_das', avatar_url: 'https://i.pravatar.cc/150?u=user4', is_admin: false },
];

const mockStats = {
    posts: 108,
    followers: 12000,
    following: 108,
};

const generateMockComments = (postId: string | number, count: number): Comment[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `comment-${postId}-${i}`,
        content: `This is a mock comment #${i + 1}. ${i % 3 === 0 ? '🙏' : ''}`,
        created_at: new Date(Date.now() - (i + 1) * 60 * 60 * 1000).toISOString(),
        user_id: mockOtherUsers[i % mockOtherUsers.length].id,
        post_id: postId,
        profiles: mockOtherUsers[i % mockOtherUsers.length],
        chat_id: 0,
        attachment_url: null,
        attachment_metadata: null,
        is_edited: false,
        reactions: null,
        read_by: [],
    }));
};

// Using 'any' type because mock data structure differs from the imported Post type
const mockPosts: any[] = Array.from({ length: 12 }, (_, i) => ({
    id: `post-${i + 1}`,
    author_id: mockUser.id,
    created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    image_url: `https://picsum.photos/id/${i + 10}/500/500`,
    content: `A beautiful snapshot from my journey. Post #${i + 1} 🙏`,
    stats: {
        likes: Math.floor(Math.random() * 2000) + 100,
        comments: Math.floor(Math.random() * 10) + 2,
    }
}));

const mockSavedPosts: any[] = Array.from({ length: 4 }, (_, i) => ({
    id: `saved-${i + 1}`,
    author_id: mockOtherUsers[i % mockOtherUsers.length].id,
    created_at: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
    image_url: `https://picsum.photos/id/${i + 50}/500/500`,
    content: `A saved memory. Post #${i + 1}`,
    stats: {
        likes: Math.floor(Math.random() * 1000) + 50,
        comments: Math.floor(Math.random() * 5) + 1,
    }
}));

function PostGrid({ posts, onPostClick }: { posts: any[]; onPostClick: (post: any) => void; }) {
    if (posts.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-12">
                <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-semibold">No posts yet</p>
                <p className="text-sm mt-1">When they post, you'll see their photos here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
                <button
                    key={post.id}
                    onClick={() => onPostClick(post)}
                    className="relative group aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                    aria-label={`View post with ${post.stats?.likes || 0} likes and ${post.stats?.comments || 0} comments`}
                >
                    <img
                        src={post.image_url!}
                        alt={`Post by ${mockUser.username}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                        <div className="text-white flex items-center space-x-4">
                            <div className="flex items-center font-semibold">
                                <Heart className="w-5 h-5 mr-1.5 fill-white" />
                                {post.stats?.likes || 0}
                            </div>
                            <div className="flex items-center font-semibold">
                                <MessageCircle className="w-5 h-5 mr-1.5 fill-white" />
                                {post.stats?.comments || 0}
                            </div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

export default function MockUserProfilePage() {
    const { toast } = useToast();
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [isFollowLoading, setIsFollowLoading] = React.useState(false);
    const [followerCount, setFollowerCount] = React.useState(mockStats.followers);
    const [selectedPost, setSelectedPost] = React.useState<any | null>(null);
    const [postAuthor, setPostAuthor] = React.useState<User | null>(null);
    const [postComments, setPostComments] = React.useState<Comment[]>([]);
    const [isPostDialogOpen, setIsPostDialogOpen] = React.useState(false);

    const handlePostClick = (post: any) => {
        const author = post.author_id === mockUser.id
            ? mockUser
            : mockOtherUsers.find(u => u.id === post.author_id) || null;
        setSelectedPost(post);
        setPostAuthor(author);
        setPostComments(generateMockComments(post.id, post.stats?.comments || 0));
        setIsPostDialogOpen(true);
    };

    const handleFollowToggle = async () => {
        if (isFollowLoading) return;

        setIsFollowLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsFollowing(!isFollowing);
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);

        toast({
            description: isFollowing
                ? `Unfollowed ${mockUser.username}`
                : `Now following ${mockUser.username}`,
        });

        setIsFollowLoading(false);
    };

    const handleShare = () => {
        toast({
            description: 'Profile link copied to clipboard!',
        });
        // In real app: navigator.clipboard.writeText(window.location.href);
    };

    const handleBlock = () => {
        toast({
            title: 'User blocked',
            description: `You won't see posts from ${mockUser.username} anymore.`,
        });
    };

    const handleReport = () => {
        toast({
            title: 'Report submitted',
            description: 'Thank you for helping keep our community safe.',
        });
    };

    const handleMessage = () => {
        toast({
            description: 'Opening message...',
        });
    };

    return (
        <main className="flex-1 p-4 md:p-6 bg-muted/40">
            <PostDetailDialog
                open={isPostDialogOpen}
                onOpenChange={setIsPostDialogOpen}
                post={selectedPost}
                author={postAuthor}
                initialComments={postComments}
            />

            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="w-24 h-24 md:w-36 md:h-36 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={mockUser.avatar_url} alt={mockUser.name} />
                                <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 text-center md:text-left w-full">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{mockUser.username}</h2>
                                    {mockUser.is_verified && (
                                        <img
                                            src="/user_Avatar/verified.png"
                                            alt="Verified Account"
                                            className="w-6 h-6"
                                        />
                                    )}
                                </div>

                                <div className="flex justify-center md:justify-start gap-3 mb-4 flex-wrap">
                                    <Button
                                        variant={isFollowing ? "secondary" : "default"}
                                        onClick={handleFollowToggle}
                                        disabled={isFollowLoading}
                                        className="min-w-[120px]"
                                    >
                                        {isFollowLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Loading
                                            </>
                                        ) : isFollowing ? (
                                            <>
                                                <UserCheck className="w-4 h-4 mr-2" />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Follow
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleMessage}
                                        className="min-w-[100px]"
                                    >
                                        Message
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" aria-label="More options">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={handleShare}>
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleBlock}>
                                                Block
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleReport}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                Report
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="hidden md:flex items-center gap-8 mb-4">
                                    <div>
                                        <span className="font-bold">{mockStats.posts}</span> posts
                                    </div>
                                    <button
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`${followerCount} followers`}
                                        onClick={() => toast({ description: 'Followers list coming soon!' })}
                                    >
                                        <span className="font-bold">{followerCount.toLocaleString()}</span> followers
                                    </button>
                                    <button
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`${mockStats.following} following`}
                                        onClick={() => toast({ description: 'Following list coming soon!' })}
                                    >
                                        <span className="font-bold">{mockStats.following}</span> following
                                    </button>
                                </div>

                                <div>
                                    <h3 className="font-semibold">{mockUser.name}</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {mockUser.bio}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden flex items-center justify-around text-center border-t mt-6 pt-4">
                            <div>
                                <p className="font-bold">{mockStats.posts}</p>
                                <p className="text-xs text-muted-foreground">posts</p>
                            </div>
                            <button
                                className="hover:opacity-70 transition-opacity"
                                onClick={() => toast({ description: 'Followers list coming soon!' })}
                            >
                                <p className="font-bold">{followerCount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">followers</p>
                            </button>
                            <button
                                className="hover:opacity-70 transition-opacity"
                                onClick={() => toast({ description: 'Following list coming soon!' })}
                            >
                                <p className="font-bold">{mockStats.following}</p>
                                <p className="text-xs text-muted-foreground">following</p>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="posts" className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="posts" className="gap-2">
                            <Grid3x3 className="w-4 h-4" />
                            <span>Posts</span>
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="gap-2">
                            <Bookmark className="w-4 h-4" />
                            <span>Saved</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-4">
                        <PostGrid posts={mockPosts} onPostClick={handlePostClick} />
                    </TabsContent>

                    <TabsContent value="saved" className="mt-4">
                        {mockSavedPosts.length > 0 ? (
                            <PostGrid posts={mockSavedPosts} onPostClick={handlePostClick} />
                        ) : (
                            <div className="text-center text-muted-foreground p-12">
                                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-semibold">No saved posts yet</p>
                                <p className="text-sm mt-1">Save posts to see them here.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}