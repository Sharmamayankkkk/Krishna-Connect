'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, UserCheck, Lock, MoreHorizontal, Loader2, Share2, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Mock data for the private user profile
const mockPrivateUser = {
    name: 'Radharani',
    username: 'radhe_syama',
    avatar_url: 'https://images.unsplash.com/photo-1541348263662-e353683d3539?w=500&h=500&fit=crop&q=60',
    bio: 'Confidential. Follow to see my posts.\n🔒 Private Account\n🌸 Krishna Devotee',
    stats: {
        posts: 72,
        followers: 25000,
        following: 5,
    },
    is_private: true,
    is_verified: true,
};

export default function MockPrivateProfilePage() {
    const { toast } = useToast();
    const [followState, setFollowState] = React.useState<'not_following' | 'requested' | 'following'>('not_following');
    const [isFollowLoading, setIsFollowLoading] = React.useState(false);
    const [followerCount, setFollowerCount] = React.useState(mockPrivateUser.stats.followers);

    const handleFollowClick = async () => {
        if (isFollowLoading) return;
        
        setIsFollowLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        if (followState === 'not_following') {
            setFollowState('requested');
            toast({
                description: `Follow request sent to ${mockPrivateUser.username}`,
            });
        } else if (followState === 'requested') {
            setFollowState('not_following');
            toast({
                description: 'Follow request cancelled',
            });
        } else if (followState === 'following') {
            setFollowState('not_following');
            setFollowerCount(prev => prev - 1);
            toast({
                description: `Unfollowed ${mockPrivateUser.username}`,
            });
        }
        
        setIsFollowLoading(false);
    };

    const handleMessageClick = () => {
        if (followState !== 'following') {
            toast({
                title: 'Cannot send message',
                description: 'You need to follow this account first.',
            });
        } else {
            toast({
                description: 'Opening message...',
            });
        }
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
            description: `You won't see posts from ${mockPrivateUser.username} anymore.`,
        });
    };

    const handleReport = () => {
        toast({
            title: 'Report submitted',
            description: 'Thank you for helping keep our community safe.',
        });
    };

    const getButtonContent = () => {
        if (isFollowLoading) {
            return {
                text: 'Loading',
                icon: <Loader2 className="w-4 h-4 mr-2 animate-spin" />,
                variant: 'secondary' as const
            };
        }

        switch (followState) {
            case 'requested':
                return {
                    text: 'Requested',
                    icon: <UserCheck className="w-4 h-4 mr-2" />,
                    variant: 'secondary' as const
                };
            case 'following':
                return {
                    text: 'Following',
                    icon: <UserCheck className="w-4 h-4 mr-2" />,
                    variant: 'secondary' as const
                };
            case 'not_following':
            default:
                return {
                    text: 'Follow',
                    icon: <UserPlus className="w-4 h-4 mr-2" />,
                    variant: 'default' as const
                };
        }
    };

    const { text, icon, variant } = getButtonContent();

    return (
        <main className="flex-1 p-4 md:p-6 bg-muted/40">
            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <Avatar className="w-24 h-24 md:w-36 md:h-36 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={mockPrivateUser.avatar_url} alt={mockPrivateUser.name} />
                                <AvatarFallback>{mockPrivateUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 text-center md:text-left w-full">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{mockPrivateUser.username}</h2>
                                    {mockPrivateUser.is_verified && (
                                        <img 
                                            src="/user_Avatar/verified.png" 
                                            alt="Verified Account" 
                                            className="w-6 h-6" 
                                        />
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        <Lock className="w-3 h-3" />
                                        <span>Private</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-center md:justify-start gap-3 mb-4 flex-wrap">
                                    <Button 
                                        variant={variant} 
                                        onClick={handleFollowClick}
                                        disabled={isFollowLoading}
                                        className="min-w-[120px]"
                                    >
                                        {icon} {text}
                                    </Button>
                                    
                                    <Button 
                                        variant="outline" 
                                        onClick={handleMessageClick}
                                        disabled={followState !== 'following'}
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
                                                <XCircle className="w-4 h-4 mr-2" />
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
                                        <span className="font-bold">{mockPrivateUser.stats.posts}</span> posts
                                    </div>
                                    <button 
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`${followerCount} followers`}
                                        onClick={() => toast({ description: 'Followers list is private' })}
                                    >
                                        <span className="font-bold">{followerCount.toLocaleString()}</span> followers
                                    </button>
                                    <button 
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`${mockPrivateUser.stats.following} following`}
                                        onClick={() => toast({ description: 'Following list is private' })}
                                    >
                                        <span className="font-bold">{mockPrivateUser.stats.following}</span> following
                                    </button>
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold">{mockPrivateUser.name}</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {mockPrivateUser.bio}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="md:hidden flex items-center justify-around text-center border-t mt-6 pt-4">
                            <div>
                                <p className="font-bold">{mockPrivateUser.stats.posts}</p>
                                <p className="text-xs text-muted-foreground">posts</p>
                            </div>
                            <button 
                                className="hover:opacity-70 transition-opacity"
                                onClick={() => toast({ description: 'Followers list is private' })}
                            >
                                <p className="font-bold">{followerCount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">followers</p>
                            </button>
                            <button 
                                className="hover:opacity-70 transition-opacity"
                                onClick={() => toast({ description: 'Following list is private' })}
                            >
                                <p className="font-bold">{mockPrivateUser.stats.following}</p>
                                <p className="text-xs text-muted-foreground">following</p>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Private Account Notice */}
                <div className="mt-8 border-t pt-12 pb-8 text-center">
                    <div className="max-w-sm mx-auto">
                        <div className="relative inline-block mb-4">
                            <Lock className="h-16 w-16 text-muted-foreground"/>
                            {followState === 'requested' && (
                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-2">
                            {followState === 'requested' 
                                ? 'Follow Request Sent' 
                                : 'This Account is Private'}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground">
                            {followState === 'requested' 
                                ? `${mockPrivateUser.username} will review your request. You'll be notified when they respond.`
                                : 'Follow this account to see their photos and videos.'}
                        </p>
                        
                        {followState === 'requested' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-4"
                                onClick={handleFollowClick}
                                disabled={isFollowLoading}
                            >
                                Cancel Request
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}