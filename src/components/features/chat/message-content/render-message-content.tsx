'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FileIcon, Download, Play, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown } from 'lucide-react';
import { VoiceNotePlayer } from '../../media/voice-note-player';
import { LinkPreview } from '../../posts/link-preview';
import { format } from 'date-fns';
import { getAvatarUrl } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { PollMessage } from './poll-message';

import { useTranslation } from 'react-i18next';

const formatBytes = (bytes: number, decimals = 2) => {
  const { t } = useTranslation();

    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const truncateFileName = (fileName: string, maxLength = 25) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop() || '';
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    return `${truncatedName}...${extension ? `.${extension}` : ''}`;
};

interface RenderMessageContentOptions {
    parseContent: (content: string | null) => (string | React.ReactNode)[];
    loggedInUserId: string;
    setImageViewerSrc: (src: string) => void;
    setIsImageViewerOpen: (open: boolean) => void;
    chatParticipants: any[];
}

function PostShareCard({ metadata }: { metadata: any }) {
    const [thumbnail, setThumbnail] = React.useState<string | null>(null);
    const authorName = metadata?.postAuthor || metadata?.description?.replace('@', '') || 'Unknown';
    const authorAvatar = metadata?.postAuthorAvatar || metadata?.image;
    const postContent = metadata?.postContent || metadata?.title;
    
    const mediaUrl = metadata?.image;
    // Check if the URL indicates a video or if the type is explicitly video
    const isVideoUrl = typeof mediaUrl === 'string' && !!mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/);
    const isVideoType = metadata?.mediaType === 'video' || metadata?.type === 'video';
    const isVideo = isVideoUrl || isVideoType;
    const hasMedia = mediaUrl && mediaUrl !== metadata?.postAuthorAvatar;
    const hasPoll = metadata?.hasPoll;
    const pollQuestion = metadata?.pollQuestion;

    React.useEffect(() => {
        let isMounted = true;
        if (isVideo && mediaUrl) {
            import('@/lib/video-thumbnail').then(({ extractVideoThumbnail }) => {
                extractVideoThumbnail(mediaUrl)
                    .then(thumb => {
                        if (isMounted) setThumbnail(thumb);
                    })
                    .catch(err => console.error("Error generating thumbnail", err));
            });
        }
        return () => { isMounted = false; };
    }, [isVideo, mediaUrl]);

    const displaySrc = (isVideo && thumbnail) ? thumbnail : mediaUrl;

    return (
        <Link href={metadata?.url || '#'} className="block max-w-sm w-full group/card">
            <Card className="bg-muted/40 hover:bg-muted/60 transition-all duration-200 overflow-hidden border-primary/10 shadow-sm group-hover/card:shadow-md">
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <Avatar className="h-6 w-6 border border-border/50 shrink-0">
                            <AvatarImage src={getAvatarUrl(authorAvatar)} className="object-cover" />
                            <AvatarFallback className="text-[10px]">{authorName[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold truncate opacity-90">{authorName}</span>
                    </div>
                    <ArrowDown className="w-3 h-3 -rotate-90 text-muted-foreground/50 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                </div>
                {hasMedia && displaySrc && (
                    <div className="relative aspect-square w-full bg-black/5">
                        <Image src={displaySrc} alt={t('chat.postContent')} fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="bg-black/50 backdrop-blur-sm rounded-full p-2.5">
                                    <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {hasMedia && !displaySrc && isVideo && (
                    <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
                        <div className="bg-black/50 backdrop-blur-sm rounded-full p-2.5">
                            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        </div>
                    </div>
                )}
                {hasPoll && (
                   <div className="p-3 bg-primary/5 border-b border-border/50 flex items-center gap-2">
                       <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                       <p className="text-sm font-medium text-foreground truncate">{pollQuestion || 'Poll'}</p>
                   </div>
                )}
                <div className="p-3 bg-background/30">
                    <p className="text-sm line-clamp-3 text-foreground/90 leading-relaxed font-normal">
                        {typeof postContent === 'string' ? postContent : 'Shared post'}
                    </p>
                </div>
            </Card>
        </Link>
    );
}

/**
 * Returns a renderMessageContent function bound to the given options.
 * Not a hook — pure factory. Call once in Chat and pass the result down via bubbleCtx.
 */
export const createRenderMessageContent = ({
    parseContent,
    loggedInUserId,
    setImageViewerSrc,
    setIsImageViewerOpen,
    chatParticipants,
}: RenderMessageContentOptions) => {
    return (message: Message): React.ReactNode => {
        const mainContent = message.content;

        if (message.attachment_url || (message.attachment_metadata && message.attachment_metadata.type === 'poll')) {
            const metadata = (message.attachment_metadata || {}) as any;
            const { type = '', name = 'attachment', size = 0, pollId } = metadata;

            if (type === 'poll' && typeof pollId === 'number') {
                return (
                    <PollMessage 
                        pollId={pollId} 
                        loggedInUserId={loggedInUserId} 
                        chatParticipants={chatParticipants} 
                    />
                );
            }

            if (type === 'event_share' && message.attachment_metadata?.eventId) {
                const metadata = message.attachment_metadata;
                return (
                    <Link href={`/events/${metadata.eventId}`} className="block">
                        <Card className="bg-background/20 backdrop-blur-sm overflow-hidden hover:bg-background/30 transition-colors">
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={metadata.eventThumbnail || 'https://placehold.co/600x400.png'}
                                    alt={name} fill className="object-cover" data-ai-hint="event"
                                    sizes="(max-width: 768px) 80vw, 320px"
                                />
                            </div>
                            <CardHeader className="p-3">
                                <CardTitle className="text-base line-clamp-2" style={{ color: 'inherit' }}>{name}</CardTitle>
                                {metadata.eventDate && (
                                    <CardDescription className="text-xs" style={{ color: 'inherit', opacity: 0.8 }}>
                                        {format(new Date(metadata.eventDate), 'eeee, MMM d, yyyy @ p')}
                                    </CardDescription>
                                )}
                            </CardHeader>
                        </Card>
                    </Link>
                );
            }

            if (type === 'post_share') {
                return <PostShareCard metadata={message.attachment_metadata} />;
            }

            const isSticker = name === 'sticker.webp';

            const attachmentElement = () => {
                if (isSticker) {
                    return <Image src={message.attachment_url!} alt={t('chat.sticker')} width={160} height={160} className="object-contain" />;
                }
                if (type.startsWith('image/')) {
                    return (
                        <button
                            className="relative block w-full max-w-xs cursor-pointer overflow-hidden rounded-lg border bg-muted"
                            onClick={() => { setImageViewerSrc(message.attachment_url!); setIsImageViewerOpen(true); }}
                        >
                            <Image
                                src={message.attachment_url!} alt={name || 'Attached image'}
                                width={320} height={240}
                                className="h-auto w-full object-cover transition-transform group-hover/bubble:scale-105"
                                sizes="(max-width: 768px) 80vw, 320px"
                            />
                        </button>
                    );
                }
                if (type.startsWith('audio/')) {
                    return (
                        <VoiceNotePlayer
                            src={message.attachment_url!}
                            isMyMessage={message.user_id === loggedInUserId}
                            metadata={message.attachment_metadata}
                        />
                    );
                }
                return (
                    <div className="flex w-full max-w-full items-center gap-2 sm:gap-3 rounded-md border bg-background/20 p-2 sm:p-3 backdrop-blur-sm min-w-0">
                        <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 shrink-0 text-current/80" />
                        <div className="flex-grow min-w-0 overflow-hidden">
                            <p className="font-semibold text-sm sm:text-base truncate break-all" title={name}>
                                <span className="sm:hidden">{truncateFileName(name, 15)}</span>
                                <span className="hidden sm:inline">{truncateFileName(name, 30)}</span>
                            </p>
                            <p className="text-xs opacity-80">{formatBytes(size)}</p>
                        </div>
                        <a href={message.attachment_url!} download={name} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </a>
                    </div>
                );
            };

            const showCaption = mainContent && !type.startsWith('audio/') && !isSticker;
            return (
                <div className="space-y-2 break-words min-w-0">
                    {attachmentElement()}
                    {showCaption && <div className="whitespace-pre-wrap break-words">{parseContent(mainContent)}</div>}
                </div>
            );
        }

        // Plain text — also handles link previews inline
        const parsed = parseContent(mainContent);
        const firstUrlMatch = typeof mainContent === 'string' ? mainContent.match(/(https?:\/\/[^\s]+)/) : null;
        const firstUrl = firstUrlMatch?.[1];

        return (
            <div className="whitespace-pre-wrap break-words">
                {parsed}
                {firstUrl && (
                    <LinkPreview metadata={{ type: 'link_preview', url: firstUrl, name: firstUrl, size: 0 }} />
                )}
            </div>
        );
    };
};
