'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFollow } from '@/hooks/use-follow';
import { FollowButtonSimple } from '../../components/follow-button';
import UserIdentity from '@/components/shared/user-identity';

interface UserCardProps {
    user: {
        id: string;
        username: string;
        full_name?: string;
        name?: string;
        avatar_url?: string;
        bio?: string;
        verified?: 'none' | 'verified' | 'kcs';
        is_following?: boolean;
        follow_status?: 'none' | 'pending' | 'approved';
    };
    currentUserId: string;
    isOwnProfile?: boolean;
    listType?: 'followers' | 'following';
    onRemove?: (userId: string) => void;
}

export function UserCard({ user, currentUserId, isOwnProfile, listType, onRemove }: UserCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { removeFollower, unfollow, isLoading } = useFollow();
    const [removed, setRemoved] = useState(false);

    // Hide the card once removed (optimistic)
    if (removed) return null;

    const handleRemoveFollower = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await removeFollower(user.id);
        if (success) {
            setRemoved(true);
            if (onRemove) onRemove(user.id);
        }
    };

    const handleUnfollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await unfollow(user.id);
        if (success) {
            setRemoved(true);
            if (onRemove) onRemove(user.id);
        }
    };

    return (
        <div
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/profile/${user.username}`)}
        >
            {/* Left: avatar + name + bio */}
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

            {/* Right: action button */}
            <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                {/* My FOLLOWERS list → show "Remove" button */}
                {listType === 'followers' && isOwnProfile && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={handleRemoveFollower}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                    </Button>
                )}

                {/* My FOLLOWING list → show unfollow-capable button (only if not viewing someone else's list) */}
                {listType === 'following' && isOwnProfile && user.id !== currentUserId && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-colors"
                        onClick={handleUnfollow}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Following'}
                    </Button>
                )}

                {/* Someone else's connections list → normal follow button */}
                {!isOwnProfile && user.id !== currentUserId && (
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
