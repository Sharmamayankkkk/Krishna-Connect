'use client';

import React, { useMemo } from 'react';
import type { PostType as Post, PollType as Poll, PollOptionType as PollOption } from '../../data';
import { useAppContext } from '@/providers/app-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface PollComponentProps {
  post: Post;
  onVote?: (postId: string, optionId: string) => void;
}

export function PollComponent({ post, onVote }: PollComponentProps) {
  const { loggedInUser } = useAppContext();
  const poll = post.poll;

  if (!poll) return null;

  const userVote = useMemo(() => {
    if (!loggedInUser) return null;
    for (const option of poll.options) {
      if (option.votedBy.includes(loggedInUser.id)) {
        return option.id;
      }
    }
    return null;
  }, [poll.options, loggedInUser]);

  const totalVotes = useMemo(() => {
    return poll.options.reduce((acc, opt) => acc + opt.votes, 0);
  }, [poll.options]);

  const { requireAuth } = useAuthGuard();

  const handleVote = (optionId: string) => {
    requireAuth(() => {
      if (!userVote && onVote) {
        onVote(post.id, optionId);
      }
    }, "Log in to vote");
  };

  const endsAt = new Date(poll.endsAt || 0);
  const hasEnded = endsAt < new Date();

  return (
    <div className="mt-3 space-y-3 w-full">
      <h4 className="font-semibold text-sm sm:text-base">{poll.question}</h4>
      <div className="space-y-2">
        {poll.options.map(option => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isUserVote = userVote === option.id;

          return (
            <Button
              key={option.id}
              variant="outline"
              // UPDATED CLASSNAMES: h-auto, py-3, whitespace-normal
              className="w-full h-auto min-h-[44px] justify-start p-0 relative overflow-hidden whitespace-normal"
              onClick={() => handleVote(option.id)}
              disabled={!!userVote || hasEnded}
            >
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 transition-all duration-500",
                  isUserVote ? "bg-primary/20" : "bg-accent/50"
                )}
                style={{ width: (userVote || hasEnded) ? `${percentage}%` : '0%' }}
              />
              <div className="relative z-10 flex items-center justify-between w-full px-4 py-3">
                <div className="flex items-center gap-3 flex-1 mr-2">
                  {isUserVote && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                  {/* UPDATED: text-left, break-words to handle long text */}
                  <span className="font-medium text-sm text-left break-words leading-snug">
                    {option.text}
                  </span>
                </div>
                {(userVote || hasEnded) && (
                  <span className="text-sm font-semibold shrink-0">{percentage.toFixed(0)}%</span>
                )}
              </div>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} · {hasEnded ? 'Poll ended' : `Poll ends ${formatDistanceToNow(endsAt, { addSuffix: true })}`}
      </p>
    </div>
  );
}