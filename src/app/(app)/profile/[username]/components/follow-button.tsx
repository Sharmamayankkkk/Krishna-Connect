
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  profileId: string;
  isFollowing: boolean;
  currentUserId: string;
}

export function FollowButton({ profileId, isFollowing, currentUserId }: FollowButtonProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic state
  const [optimisticIsFollowing, setOptimisticIsFollowing] = useState(isFollowing);

  const handleFollow = async () => {
    setOptimisticIsFollowing(true);
    startTransition(async () => {
      const { error } = await supabase.from('followers').insert({
        follower_id: currentUserId,
        following_id: profileId,
      });

      if (error) {
        // Revert optimistic update on error
        setOptimisticIsFollowing(false);
        console.error('Error following user:', error);
      } else {
        // Revalidate the current page to fetch new data
        router.refresh();
      }
    });
  };

  const handleUnfollow = async () => {
    setOptimisticIsFollowing(false);
    startTransition(async () => {
      const { error } = await supabase
        .from('followers')
        .delete()
        .match({ follower_id: currentUserId, following_id: profileId });

      if (error) {
        // Revert optimistic update on error
        setOptimisticIsFollowing(true);
        console.error('Error unfollowing user:', error);
      } else {
        // Revalidate the current page to fetch new data
        router.refresh();
      }
    });
  };

  if (optimisticIsFollowing) {
    return (
      <Button onClick={handleUnfollow} disabled={isPending} variant="secondary" className="mt-4">
        {isPending ? 'Unfollowing...' : 'Unfollow'}
      </Button>
    );
  }

  return (
    <Button onClick={handleFollow} disabled={isPending} className="mt-4">
      {isPending ? 'Following...' : 'Follow'}
    </Button>
  );
}
