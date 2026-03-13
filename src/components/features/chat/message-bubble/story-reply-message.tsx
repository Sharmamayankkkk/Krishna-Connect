'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/lib/types';

import { useTranslation } from 'react-i18next';

interface StoryReplyMessageProps {
    content: string;
    message: Message;
    loggedInUserId: string;
}

export const StoryReplyMessage = ({ content, message, loggedInUserId }: StoryReplyMessageProps) => {
  const { t } = useTranslation();

    const isMyMessage = message.user_id === loggedInUserId;
    const match = content.match(/\[\[STORY_REPLY:(.*?)\]\]\s*([\s\S]*)/);
    const mediaUrl = match?.[1] || '';
    const replyText = match?.[2] || content;
    const isVideoStory = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov');

    return (
        <div className={cn('flex items-end gap-1.5 sm:gap-2 group/message', isMyMessage ? 'justify-end' : 'justify-start')}>
            {!isMyMessage && <div className="w-6 sm:w-8 shrink-0" />}
            <div className={cn('relative max-w-[85%] sm:max-w-md rounded-xl overflow-hidden', isMyMessage ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] uppercase tracking-wide opacity-60 font-medium">
                        {isMyMessage ? 'Replied to story' : 'Replied to your story'}
                    </p>
                </div>
                {mediaUrl && (
                    <div className="mx-3 mb-1 h-16 w-16 rounded-lg overflow-hidden bg-black/20 relative">
                        {isVideoStory ? (
                            <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl} alt={t('chat.story')} className="w-full h-full object-cover" />
                        )}
                    </div>
                )}
                <div className="px-3 pb-2">
                    <p className="text-sm">{replyText}</p>
                    <p className={cn('text-[10px] mt-1', isMyMessage ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                </div>
            </div>
            {isMyMessage && <div className="w-6 sm:w-8 shrink-0" />}
        </div>
    );
};
