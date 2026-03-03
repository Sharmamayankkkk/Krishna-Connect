'use client';

import React from 'react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';

interface RenderReactionsOptions {
    loggedInUserId: string;
    handleReaction: (message: Message, emoji: string) => Promise<void>;
    chatParticipants: any[];
}

/**
 * Factory that creates the renderReactions function.
 * Not a hook — pure factory. Call once in Chat and pass the result down via bubbleCtx.
 */
export const createRenderReactions = ({
    loggedInUserId,
    handleReaction,
    chatParticipants,
}: RenderReactionsOptions) => {
    return (message: Message): React.ReactNode => {
        if (!message.reactions || Object.keys(message.reactions).length === 0) return null;
        const isOptimistic = typeof message.id === 'string';

        return (
            <div className="absolute -bottom-4 -right-2 flex gap-1">
                {Object.entries(message.reactions).map(([emoji, userIds]) => {
                    const hasReacted = (userIds as string[]).includes(loggedInUserId);
                    const isCustom = emoji.startsWith('/');
                    return (
                        <TooltipProvider key={emoji}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleReaction(message, emoji)}
                                        disabled={isOptimistic}
                                        className={cn(
                                            'px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors',
                                            hasReacted ? 'bg-primary/20 border border-primary' : 'bg-background/80 border'
                                        )}
                                    >
                                        {isCustom
                                            ? <Image src={emoji} alt="reaction" width={16} height={16} />
                                            : <span>{emoji}</span>
                                        }
                                        <span>{(userIds as string[]).length}</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-sm">
                                        {(userIds as string[])
                                            .map(id => chatParticipants?.find((p: any) => p.user_id === id)?.profiles?.name || '...')
                                            .join(', ')}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        );
    };
};
