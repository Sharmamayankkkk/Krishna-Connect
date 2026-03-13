'use client';

import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CALL_MESSAGE_PREFIX } from '../chat-constants';
import type { Message } from '@/lib/types';

import { useTranslation } from 'react-i18next';

interface CallMessageProps {
    content: string;
    message: Message;
    loggedInUserId: string;
    chatParticipants: any[];
    startCall?: ((userId: string, type: 'voice' | 'video') => void) | null;
    joinCall?: ((callId: string) => void) | null;
}

const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const remaining = s % 60;
    return remaining > 0 ? `${m}m ${remaining}s` : `${m}m`;
};

export const CallMessage = ({
    content,
    message,
    loggedInUserId,
    chatParticipants,
    startCall,
    joinCall,
}: CallMessageProps) => {
    const { t } = useTranslation();
    const callData = content.replace(CALL_MESSAGE_PREFIX, '').replace(']]', '');
    const [callType, callStatus, durationStr, , callId] = callData.split('|');
    const duration = parseInt(durationStr) || 0;
    const isMyCall = message.user_id === loggedInUserId;
    const isMissed = callStatus === 'missed' || callStatus === 'declined';
    const isVideo = callType === 'video';
    const isGroupCall = callStatus === 'started';
    const canJoin = isGroupCall;

    return (
        <div className="flex items-center justify-center my-3">
            <div className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl border',
                isMissed ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30' : 'bg-muted/50 border-border'
            )}>
                <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    isMissed ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                )}>
                    {isVideo
                        ? <Video className={cn('h-4 w-4', isMissed ? 'text-red-500' : 'text-green-600')} />
                        : <Phone className={cn('h-4 w-4', isMissed ? 'text-red-500' : 'text-green-600')} />
                    }
                </div>
                <div className="flex flex-col">
                    <span className={cn('text-sm font-medium', isMissed && 'text-red-600 dark:text-red-400')}>
                        {isMissed
                            ? `Missed ${isVideo ? 'Video' : 'Voice'} Call`
                            : isGroupCall ? `Group ${isVideo ? 'Video' : 'Voice'} Call`
                                : `${isVideo ? 'Video' : 'Voice'} Call`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {isMissed
                            ? (isMyCall ? 'No answer' : 'Tap to call back')
                            : isGroupCall ? 'Tap to join'
                                : formatDuration(duration)}
                    </span>
                </div>
                {isMissed && !isMyCall && startCall && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-7 text-xs text-primary"
                        onClick={() => {
                            const otherUser = chatParticipants?.find((p: any) => p.user_id !== loggedInUserId);
                            if (otherUser) startCall(otherUser.user_id, isVideo ? 'video' : 'voice');
                        }}
                    >{t('chat.callBack')}</Button>
                )}
                {canJoin && joinCall && callId && (
                    <Button variant="default" size="sm" className="ml-2 h-7 text-xs" onClick={() => joinCall(callId)}>{t('chat.join')}</Button>
                )}
            </div>
        </div>
    );
};
