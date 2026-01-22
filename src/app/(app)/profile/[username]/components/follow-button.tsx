'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useFollow, FollowStatus } from '@/hooks/use-follow';
import { Loader2, UserPlus, UserCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  profileId: string;
  currentUserId: string;
  initialStatus?: FollowStatus;
  className?: string;
  variant?: 'default' | 'sm';
}

export function FollowButton({
  profileId,
  currentUserId,
  initialStatus = 'none',
  className,
  variant = 'default',
}: FollowButtonProps) {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const { follow, unfollow, getFollowStatus, isLoading } = useFollow();

  // Fetch initial status if not provided
  useEffect(() => {
    if (initialStatus === 'none' && currentUserId && profileId) {
      getFollowStatus(profileId, currentUserId).then(setStatus);
    }
  }, [profileId, currentUserId, initialStatus, getFollowStatus]);

  const handleClick = async () => {
    if (status === 'none') {
      // Follow the user
      const newStatus = await follow(profileId);
      if (newStatus) {
        setStatus(newStatus);
      }
    } else {
      // Unfollow or cancel request
      const success = await unfollow(profileId);
      if (success) {
        setStatus('none');
      }
    }
  };

  // Determine button appearance based on status
  const getButtonContent = () => {
    switch (status) {
      case 'approved':
        return {
          text: 'Following',
          variant: 'secondary' as const,
          icon: <UserCheck className="h-4 w-4" />,
          hoverText: 'Unfollow',
        };
      case 'pending':
        return {
          text: 'Requested',
          variant: 'outline' as const,
          icon: <Clock className="h-4 w-4" />,
          hoverText: 'Cancel',
        };
      default:
        return {
          text: 'Follow',
          variant: 'default' as const,
          icon: <UserPlus className="h-4 w-4" />,
          hoverText: 'Follow',
        };
    }
  };

  const buttonContent = getButtonContent();
  const isSmall = variant === 'sm';

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={buttonContent.variant}
      size={isSmall ? 'sm' : 'default'}
      className={cn(
        'group transition-all duration-200',
        status === 'approved' && 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500',
        status === 'pending' && 'hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {!isSmall && buttonContent.icon}
          <span className={cn(!isSmall && 'ml-2', 'group-hover:hidden')}>
            {buttonContent.text}
          </span>
          <span className={cn(!isSmall && 'ml-2', 'hidden group-hover:inline')}>
            {buttonContent.hoverText}
          </span>
        </>
      )}
    </Button>
  );
}

// Simplified version for user cards
export function FollowButtonSimple({
  profileId,
  currentUserId,
  initialStatus = 'none',
  className,
}: Omit<FollowButtonProps, 'variant'>) {
  const [status, setStatus] = useState<FollowStatus>(initialStatus);
  const { follow, unfollow, isLoading } = useFollow();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === 'none') {
      const newStatus = await follow(profileId);
      if (newStatus) {
        setStatus(newStatus);
      }
    } else {
      const success = await unfollow(profileId);
      if (success) {
        setStatus('none');
      }
    }
  };

  const getButtonText = () => {
    if (isLoading) return '...';
    switch (status) {
      case 'approved':
        return 'Following';
      case 'pending':
        return 'Requested';
      default:
        return 'Follow';
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={status === 'none' ? 'default' : 'outline'}
      size="sm"
      className={cn('flex-shrink-0', className)}
    >
      {getButtonText()}
    </Button>
  );
}
