'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserMinus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { FollowButtonSimple } from '../../components/follow-button';
import { getAvatarUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import UserIdentity from '@/components/shared/user-identity';

interface UserCardProps {
    user: {
        id: string;
        username: string;
        full_name?: string;
        name?: string;
        avatar_url?: string;
        bio?: string;
        verified?: boolean;
        is_following?: boolean;
        follow_status?: 'none' | 'pending' | 'approved';
    };
    currentUserId: string;
    isOwnProfile?: boolean; // If true, we are viewing the logged-in user's profile lists
    listType?: 'followers' | 'following';
    onRemove?: (userId: string) => void; // Callback to remove from UI after removing follower
}

export function UserCard({ user, currentUserId, isOwnProfile, listType, onRemove }: UserCardProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const router = useRouter();

    const handleRemoveFollower = async () => {
        try {
            // Logic: remove logic where user is failing to follow me.
            // relationships: user_one_id (me, the follower) -> user_two_id (target, the followee)
            // IF I am viewing MY FOLLOWERS list:
            // The follower is `user.id` (user_one). The followee is `currentUserId` (me, user_two).
            // We need to delete the relationship where user_one_id = user.id AND user_two_id = currentUserId.

            const { error } = await supabase
                .from('relationships')
                .delete()
                .eq('user_one_id', user.id)
                .eq('user_two_id', currentUserId);

            if (error) throw error;

            toast({ title: "Follower removed" });
            if (onRemove) onRemove(user.id);
            router.refresh();

        } catch (error) {
            console.error('Error removing follower:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to remove follower." });
        }
    };

    const displayName = user.name || user.full_name || user.username;

    return (
        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>
            <div className="flex-1 min-w-0">
                <UserIdentity
                    user={user}
                    size="md"
                    className="mb-1"
                />
                {user.bio && (
                    <p className="text-sm text-foreground/80 line-clamp-1 break-words ml-[52px]">{user.bio}</p>
                )}
            </div>

            <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                {/* If viewing my OWN followers, I can remove them */}
                {listType === 'followers' && isOwnProfile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleRemoveFollower} className="text-destructive">
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove this follower
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Follow/Following Button - Only show if not me */}
                {user.id !== currentUserId && (
                    <FollowButtonSimple
                        profileId={user.id}
                        currentUserId={currentUserId}
                        initialStatus={user.follow_status || (user.is_following ? 'approved' : 'none')}
                    />
                )}
            </div>
        </div>
    );
}
