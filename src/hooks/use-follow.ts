'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type FollowStatus = 'none' | 'pending' | 'approved';

interface UseFollowOptions {
  onSuccess?: (status: FollowStatus) => void;
  onError?: (error: Error) => void;
}

export function useFollow(options?: UseFollowOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  /**
   * Request to follow a user.
   * - If the target account is public, status becomes 'approved' immediately.
   * - If the target account is private, status becomes 'pending'.
   * @returns The new follow status ('pending' or 'approved') or null on error.
   */
  const follow = useCallback(async (targetUserId: string): Promise<FollowStatus | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_follow', {
        target_user_id: targetUserId,
      });

      if (error) {
        console.error('Error following user:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to follow user.',
        });
        options?.onError?.(new Error(error.message));
        return null;
      }

      const newStatus = data?.status as FollowStatus || 'approved';

      if (newStatus === 'pending') {
        toast({ title: 'Follow Requested', description: 'Your request has been sent.' });
      } else {
        toast({ title: 'Following', description: 'You are now following this user.' });
      }

      options?.onSuccess?.(newStatus);
      return newStatus;
    } catch (err: any) {
      console.error('Error following user:', err);
      options?.onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, options]);

  /**
   * Remove a follower from YOUR followers list.
   * Calls remove_follower RPC (SECURITY DEFINER) so the followee can delete the row.
   */
  const removeFollower = useCallback(async (followerUserId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('remove_follower', {
        follower_user_id: followerUserId,
      });

      if (error) {
        console.error('Error removing follower:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to remove follower.',
        });
        options?.onError?.(new Error(error.message));
        return false;
      }

      toast({ title: 'Follower removed' });
      return true;
    } catch (err: any) {
      console.error('Error removing follower:', err);
      options?.onError?.(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, options]);

  /**
   * Unfollow a user (removes both 'approved' and 'pending' relationships).
   */
  const unfollow = useCallback(async (targetUserId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('unfollow_user', {
        target_user_id: targetUserId,
      });

      if (error) {
        console.error('Error unfollowing user:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to unfollow user.',
        });
        options?.onError?.(new Error(error.message));
        return false;
      }

      toast({ title: 'Unfollowed', description: 'You have unfollowed this user.' });
      options?.onSuccess?.('none');
      return true;
    } catch (err: any) {
      console.error('Error unfollowing user:', err);
      options?.onError?.(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, options]);

  /**
   * Get the current follow status between the logged-in user and a target user.
   */
  const getFollowStatus = useCallback(async (targetUserId: string, currentUserId: string): Promise<FollowStatus> => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('status')
        .eq('user_one_id', currentUserId)
        .eq('user_two_id', targetUserId)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (error || !data) {
        return 'none';
      }

      return data.status as FollowStatus;
    } catch (err) {
      console.error('Error getting follow status:', err);
      return 'none';
    }
  }, [supabase]);

  return {
    follow,
    unfollow,
    removeFollower,
    getFollowStatus,
    isLoading,
  };
}
