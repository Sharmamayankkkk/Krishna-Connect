"use client";

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function UserCard({
    user,
    onFollow,
    isFollowing
}: {
    user: {
        id: string;
        name: string;
        username: string;
        avatar: string;
        verified: boolean;
        followers: number;
        bio?: string;
    };
    onFollow: (id: string) => void;
    isFollowing?: boolean;
}) {
    const { loggedInUser } = useAppContext();
    const [followStatus, setFollowStatus] = React.useState<'none' | 'pending' | 'approved'>(
        isFollowing ? 'approved' : 'none'
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const handleFollow = async () => {
        if (!loggedInUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to follow users.' });
            return;
        }

        setIsLoading(true);
        try {
            if (followStatus === 'none') {
                // Follow the user using RPC
                const { data, error } = await supabase.rpc('request_follow', {
                    target_user_id: user.id,
                });

                if (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to follow user.' });
                    return;
                }

                const newStatus = data?.status || 'approved';
                setFollowStatus(newStatus);

                if (newStatus === 'pending') {
                    toast({ title: 'Request Sent', description: 'Your follow request has been sent.' });
                } else {
                    toast({ title: 'Following', description: `You are now following ${user.name}.` });
                }
                onFollow(user.id);
            } else {
                // Unfollow using RPC
                const { error } = await supabase.rpc('unfollow_user', {
                    target_user_id: user.id,
                });

                if (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to unfollow user.' });
                    return;
                }

                setFollowStatus('none');
                toast({ title: 'Unfollowed', description: `You have unfollowed ${user.name}.` });
            }
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonText = () => {
        if (isLoading) return '...';
        switch (followStatus) {
            case 'approved': return 'Following';
            case 'pending': return 'Requested';
            default: return 'Follow';
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/profile/${user.username}`}
                                className="font-semibold hover:underline truncate"
                            >
                                {user.name}
                            </Link>
                            {user.verified && (
                                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {user.followers.toLocaleString()} followers
                        </p>
                    </div>
                    <Button
                        variant={followStatus === 'none' ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleFollow}
                        disabled={isLoading}
                        className="flex-shrink-0"
                    >
                        {getButtonText()}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
