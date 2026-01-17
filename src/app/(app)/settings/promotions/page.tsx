'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, BarChart2, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { PostType, dummyPosts } from '@/app/(app)/data';
import { PromotePostDialog } from '@/components/promote-post-dialog';
import { useToast } from '@/hooks/use-toast';

// This page will be conditionally rendered based on the feature flag

type PromotedPost = PostType & { promotion: { impressions: number; clicks: number; status: string }};

export default function PromotionsSettingsPage() {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    // State for the promotion dialog
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedPost, setSelectedPost] = React.useState<PostType | null>(null);

    // State for active promotions
    const [activePromotions, setActivePromotions] = React.useState<PromotedPost[]>(() => 
        (dummyPosts.filter(p => p.isPromoted) as PromotedPost[]).filter(p => p.author.id === loggedInUser?.id)
    );

    // Feature flag check
    const isMonetizationEnabled = process.env.NEXT_PUBLIC_ENABLE_MONETIZATION === 'true';

    // Filter to get only the logged-in user's posts that are not reposts
    const userPosts = React.useMemo(() => 
        dummyPosts.filter(p => p.author.id === loggedInUser?.id && !p.isRepost && !p.isPromoted)
    , [loggedInUser]);

    const handlePromoteClick = (post: PostType) => {
        setSelectedPost(post);
        setIsDialogOpen(true);
    };

    const handleConfirmPromotion = (postId: string, budget: number) => {
        const postToPromote = userPosts.find(p => p.id === postId);
        if (!postToPromote) return;

        const newPromotion: PromotedPost = {
            ...postToPromote,
            isPromoted: true, // Set the flag
            promotion: { 
                impressions: Math.floor(Math.random() * 500), // Start with some initial mock data
                clicks: Math.floor(Math.random() * 20),
                status: 'Active' 
            }
        };

        // Add to active promotions list
        setActivePromotions(prev => [newPromotion, ...prev]);

        toast({
            title: "Post Promotion Started!",
            description: `Your post is now being promoted for $${budget}.`,
        });
    };

    if (!isMonetizationEnabled) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Promotions</CardTitle>
                        <CardDescription>The ability to promote posts is currently unavailable.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm text-muted-foreground'>The ability to boost your posts to a wider audience is coming soon. Stay tuned!</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <>
            <PromotePostDialog 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                post={selectedPost}
                onConfirm={handleConfirmPromotion}
            />
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Promotions</h2>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activePromotions.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Number of currently boosted posts.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                            <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{(activePromotions.reduce((sum, p) => sum + p.promotion.impressions, 0) || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                            Total views on your promoted posts.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Promotions Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Promotions</CardTitle>
                        <CardDescription>Manage your boosted posts and view their performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Post</TableHead>
                                    <TableHead className='text-right'>Impressions</TableHead>
                                    <TableHead className='text-right'>Clicks</TableHead>
                                    <TableHead className='text-center'>Status</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activePromotions.length > 0 ? (
                                    activePromotions.map(post => (
                                        <TableRow key={`promo-${post.id}`}>
                                            <TableCell className='truncate' style={{ maxWidth: 200 }}>{post.content || "(No content)"}</TableCell>
                                            <TableCell className='text-right'>{post.promotion.impressions.toLocaleString()}</TableCell>
                                            <TableCell className='text-right'>{post.promotion.clicks.toLocaleString()}</TableCell>
                                            <TableCell className='text-center'><Badge>{post.promotion.status}</Badge></TableCell>
                                            <TableCell className='text-right'>
                                                <Button variant="outline" size="sm">Manage</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">You have no active promotions.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Promote a Post Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Promote a Post</CardTitle>
                        <CardDescription>Boost your content to reach a wider audience.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Post Content</TableHead>
                                    <TableHead className='text-center'>Created</TableHead>
                                    <TableHead className='text-right'>Likes</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {userPosts.length > 0 ? (
                                    userPosts.map(post => (
                                        <TableRow key={`post-to-promote-${post.id}`}>
                                            <TableCell className='truncate' style={{ maxWidth: 300 }}>{post.content || "(No content)"}</TableCell>
                                            <TableCell className='text-center text-xs text-muted-foreground'>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className='text-right'>{post.stats.likes}</TableCell>
                                            <TableCell className='text-right'>
                                                <Button size="sm" variant='outline' className='mr-2'><ExternalLink className='h-3 w-3 mr-1' /> View</Button>
                                                <Button size="sm" onClick={() => handlePromoteClick(post)}><Zap className='h-3 w-3 mr-1' /> Promote</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">You have no more posts to promote.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </>
    );
}
