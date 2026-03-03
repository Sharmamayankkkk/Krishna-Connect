'use client';

import Image from 'next/image';

import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { format } from 'date-fns';
import { BadgeCheck } from 'lucide-react'; // kept for any future use
import {
    MoreVertical, Pencil, Trash2, SmilePlus, Copy, Star,
    Share2, ShieldAlert, Pin, PinOff, Reply, Clock, Check,
    CheckCheck, CircleSlash, Info, Languages,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmojiPicker, { SkinTones } from 'emoji-picker-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import type { Message } from '@/lib/types';
import type { MessageBubbleContext } from '../chat-types';
import { SYSTEM_MESSAGE_PREFIX, CALL_MESSAGE_PREFIX, STORY_REPLY_PREFIX, DELETED_MESSAGE_MARKER } from '../chat-constants';
import { SystemMessage } from './system-message';
import { CallMessage } from './call-message';
import { StoryReplyMessage } from './story-reply-message';

// ReplyPreview is a tiny inner component with no hooks — safe to define here
const ReplyPreview = ({
    repliedTo,
    themeSettings,
    jumpToMessage,
}: {
    repliedTo: Message;
    themeSettings: any;
    jumpToMessage: (id: number) => void;
}) => {
    const isImageReply = repliedTo.attachment_url && repliedTo.attachment_metadata?.type?.startsWith('image/');
    const isVoiceReply = repliedTo.attachment_metadata?.type === 'audio/webm' || repliedTo.attachment_metadata?.type?.startsWith('audio/');
    const isFileReply = repliedTo.attachment_url && !isImageReply && !isVoiceReply;

    return (
        <div
            className="flex items-center gap-2 p-2 mb-2 rounded-md cursor-pointer border-l-2 bg-foreground/[.07] dark:bg-foreground/[.1] hover:bg-foreground/[.1] dark:hover:bg-foreground/[.15] transition-colors"
            style={{ borderColor: themeSettings.usernameColor }}
            onClick={() => jumpToMessage(repliedTo.id as number)}
        >
            <div className="flex-1 overflow-hidden min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: themeSettings.usernameColor }}>
                    {repliedTo.profiles?.name || 'Unknown'}
                </p>
                <p className="text-xs truncate opacity-80">
                    {isVoiceReply ? '🎤 Voice message'
                        : isFileReply ? `📎 ${repliedTo.attachment_metadata?.name || 'File'}`
                        : isImageReply ? '🖼️ Photo'
                        : (typeof repliedTo.content === 'string' ? repliedTo.content : 'Attachment')}
                </p>
            </div>
            {isImageReply && repliedTo.attachment_url && (
                <Image
                    src={repliedTo.attachment_url}
                    alt="reply thumbnail"
                    width={40}
                    height={40}
                    className="rounded-sm object-cover shrink-0"
                />
            )}
        </div>
    );
};

export const MessageBubble = React.memo(function MessageBubble({
    message,
    ctx,
}: {
    message: Message;
    ctx: MessageBubbleContext;
}) {
    const {
        loggedInUser, isGroup, isGroupAdmin, themeSettings,
        outgoingBubbleStyle, incomingBubbleStyle,
        editingMessage, highlightMessageId, reactionPickerCustomEmojis, chatParticipants,
        loggedInUserId, startCall, joinCall, chatName,
        handleStartReply, handleDeleteForEveryone, handleCopy, handleStartEdit,
        onReact, onCustomReact, handleToggleStar, handleTogglePin,
        setMessageToForward, setMessageToReport, setIsReportDialogOpen,
        setMessageInfo, setMessageToTranslate, jumpToMessage,
        getMessageStatus, renderMessageContent, renderReactions, disableSharing
    } = ctx;

    // ⚠️ RULES OF HOOKS: always called before any early returns
    const isMyMessage = message.user_id === loggedInUserId;
    const isOptimistic = typeof message.id === 'string';

    const swipeHandlers = useSwipeable({
        onSwipedRight: () => { if (!isMyMessage && !isOptimistic) handleStartReply(message); },
        onSwipedLeft: () => { if (isMyMessage && !isOptimistic) handleStartReply(message); },
        trackMouse: true,
        preventScrollOnSwipe: true,
    });

    // --- Special message types (early return after hooks) ---
    if (message.content?.startsWith(SYSTEM_MESSAGE_PREFIX)) {
        return <SystemMessage content={message.content} />;
    }
    if (message.content?.startsWith(CALL_MESSAGE_PREFIX)) {
        return (
            <CallMessage
                content={message.content}
                message={message}
                loggedInUserId={loggedInUserId}
                chatParticipants={chatParticipants}
                startCall={startCall}
                joinCall={joinCall}
            />
        );
    }
    if (message.content?.startsWith(STORY_REPLY_PREFIX)) {
        return <StoryReplyMessage content={message.content} message={message} loggedInUserId={loggedInUserId} />;
    }
    if (message.content === DELETED_MESSAGE_MARKER) {
        const bubbleStyle = isMyMessage ? outgoingBubbleStyle : incomingBubbleStyle;
        return (
            <div className={cn('flex items-end gap-1.5 sm:gap-2 group/message', isMyMessage ? 'justify-end' : 'justify-start')}>
                {!isMyMessage && <div className="w-6 sm:w-8 shrink-0" />}
                <div className="relative max-w-[85%] sm:max-w-md lg:max-w-lg rounded-lg text-sm px-2 sm:px-3 py-2" style={bubbleStyle}>
                    <div className="flex items-center gap-2 italic text-current/70">
                        <CircleSlash className="h-4 w-4" />
                        <span>This message was deleted</span>
                    </div>
                </div>
                {isMyMessage && <div className="w-6 sm:w-8 shrink-0" />}
            </div>
        );
    }

    // --- Standard message ---
    const sender = message.profiles;
    const isEditing = editingMessage?.id === message.id;
    const messageStatus = getMessageStatus(message);

    if (!sender) return <div>Loading message...</div>;

    const bubbleStyle = isMyMessage ? outgoingBubbleStyle : incomingBubbleStyle;
    const senderName = isGroup && sender.role === 'gurudev' ? chatName : sender.name;
    const senderAvatar = getAvatarUrl(sender.avatar_url);
    const senderFallback = (senderName || 'U').charAt(0);
    // message.profiles comes from a raw SQL join — DB column is 'verified', not 'is_verified'
    // Check both so badges work regardless of the mapping path
    const senderVerifiedTier: string | undefined = sender.is_verified || (sender as any).verified;

    // Member tag from chatParticipants
    const senderParticipant = chatParticipants.find(p => p.user_id === message.user_id);
    const memberTag = senderParticipant?.tag;
    const isSenderAdmin = senderParticipant?.is_admin;

    return (
        <div
            id={`message-${message.id}`}
            className={cn(
                'flex w-full items-end gap-1.5 sm:gap-2 group/message rounded-lg transition-colors',
                isMyMessage ? 'justify-end' : 'justify-start',
                message.id === highlightMessageId && 'animate-highlight'
            )}
        >
            {!isMyMessage && (
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 self-end shrink-0">
                    <AvatarImage src={senderAvatar} alt={senderName ?? undefined} data-ai-hint="avatar" />
                    <AvatarFallback className="text-[10px] sm:text-xs">{senderFallback}</AvatarFallback>
                </Avatar>
            )}
            <div
                {...swipeHandlers}
                className={cn(
                    'relative transition-transform duration-200 ease-out min-w-0',
                    isMyMessage
                        ? 'group-data-[swiped=true]/message:translate-x-[-2rem]'
                        : 'group-data-[swiped=true]/message:translate-x-[2rem]'
                )}
            >
                <div
                    className="group/bubble relative rounded-lg text-sm px-2 sm:px-3 py-2 break-words max-w-[80vw] sm:max-w-md md:max-w-lg"
                    style={bubbleStyle}
                >
                    {isEditing ? (
                        <div className="w-full">
                            <p className="text-xs font-semibold text-primary mb-2">Editing...</p>
                        </div>
                    ) : (
                        <>
                            {isGroup && !isMyMessage && (
                                <div className="flex items-center gap-1.5 font-semibold mb-1 text-sm">
                                    <span style={{ color: themeSettings.usernameColor }}>{senderName}</span>
                                    {senderVerifiedTier === 'verified' && (
                                        <Image src="/user_Avatar/verified.png" alt="Verified" width={16} height={16} className="inline-block shrink-0" />
                                    )}
                                    {senderVerifiedTier === 'kcs' && (
                                        <Image src="/user_Avatar/KCS-verified.png" alt="KCS Verified" width={16} height={16} className="inline-block shrink-0" />
                                    )}
                                    {sender.role === 'gurudev' && (
                                        <Badge variant="destructive" className="text-xs px-1.5 py-0 leading-none">Gurudev</Badge>
                                    )}
                                    {/* Member tag */}
                                    {memberTag && (
                                        <span
                                            className="ml-auto text-xs font-normal"
                                            style={{ color: isSenderAdmin ? themeSettings.usernameColor : undefined, opacity: isSenderAdmin ? 0.85 : 0.55 }}
                                        >
                                            {memberTag}
                                        </span>
                                    )}
                                </div>
                            )}
                            {message.replied_to_message && (
                                <ReplyPreview
                                    repliedTo={message.replied_to_message}
                                    themeSettings={themeSettings}
                                    jumpToMessage={jumpToMessage}
                                />
                            )}
                            {renderMessageContent(message)}
                            <div
                                className="text-xs mt-1 flex items-center gap-1.5 opacity-70"
                                style={{ justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}
                            >
                                {message.is_pinned && <Pin className="h-3 w-3 text-current mr-1" />}
                                {message.is_edited && <span className="text-xs italic">Edited</span>}
                                {(message.starred_by?.includes(loggedInUserId) ?? message.is_starred) && (
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400 mr-1" />
                                )}
                                <span>{format(new Date(message.created_at), 'p')}</span>
                                {isMyMessage && messageStatus === 'pending' && <Clock className="h-4 w-4" />}
                                {isMyMessage && messageStatus === 'sent' && <Check className="h-4 w-4" />}
                                {isMyMessage && messageStatus === 'read' && <CheckCheck className="h-4 w-4 text-primary" />}
                            </div>
                        </>
                    )}

                    {/* Hover action bar */}
                    {!isEditing && (
                        <div className={cn(
                            'absolute -top-4 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity',
                            isMyMessage ? 'left-[-8px]' : 'right-[-8px]'
                        )}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/80 hover:bg-background">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-auto p-1">
                                    <DropdownMenuItem onClick={() => handleStartReply(message)} disabled={isOptimistic}>
                                        <Reply className="mr-2 h-4 w-4" /><span>Reply</span>
                                    </DropdownMenuItem>
                                    {message.content && !isMyMessage && (
                                        <DropdownMenuItem onClick={() => setMessageToTranslate(message)}>
                                            <Languages className="mr-2 h-4 w-4" /><span>Translate</span>
                                        </DropdownMenuItem>
                                    )}
                                    {!disableSharing && (
                                        <DropdownMenuItem onClick={() => setMessageToForward(message)} disabled={isOptimistic}>
                                            <Share2 className="mr-2 h-4 w-4" /><span>Forward</span>
                                        </DropdownMenuItem>
                                    )}
                                    {message.content && (
                                        <DropdownMenuItem onClick={() => handleCopy(message.content as string)}>
                                            <Copy className="mr-2 h-4 w-4" /><span>Copy</span>
                                        </DropdownMenuItem>
                                    )}
                                    {(() => {
                                        const isMessageStarred = message.starred_by?.includes(loggedInUserId) ?? message.is_starred;
                                        return isGroup && !isGroupAdmin ? (
                                            <DropdownMenuItem onClick={() => handleToggleStar(message)} disabled={isOptimistic}>
                                                {isMessageStarred ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                                <span>{isMessageStarred ? 'Unpin for me' : 'Pin for me'}</span>
                                            </DropdownMenuItem>
                                        ) : (
                                            <>
                                                <DropdownMenuItem onClick={() => handleToggleStar(message)} disabled={isOptimistic}>
                                                    <Star className={cn('mr-2 h-4 w-4', isMessageStarred && 'text-amber-400 fill-amber-400')} />
                                                    <span>{isMessageStarred ? 'Unstar' : 'Star'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTogglePin(message)} disabled={isOptimistic}>
                                                    {message.is_pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                                    <span>{message.is_pinned ? 'Unpin' : (isGroup ? 'Pin for everyone' : 'Pin')}</span>
                                                </DropdownMenuItem>
                                            </>
                                        );
                                    })()}
                                    {isMyMessage && isGroup && !isOptimistic && (
                                        <DropdownMenuItem onClick={() => setMessageInfo(message)}>
                                            <Info className="mr-2 h-4 w-4" /><span>Message Info</span>
                                        </DropdownMenuItem>
                                    )}
                                    {!isMyMessage && (
                                        <DropdownMenuItem onClick={() => { setMessageToReport(message); setIsReportDialogOpen(true); }} disabled={isOptimistic}>
                                            <ShieldAlert className="mr-2 h-4 w-4" /><span>Report Message</span>
                                        </DropdownMenuItem>
                                    )}
                                    {isMyMessage && !isOptimistic && (
                                        <>
                                            <DropdownMenuSeparator />
                                            {message.content && (
                                                <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                                                    <Pencil className="mr-2 h-4 w-4" /><span>Edit</span>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteForEveryone(message.id as number)}>
                                                <Trash2 className="mr-2 h-4 w-4" /><span>Delete for everyone</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/80 hover:bg-background" disabled={isOptimistic}>
                                        <SmilePlus className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none">
                                    <EmojiPicker
                                        customEmojis={reactionPickerCustomEmojis}
                                        onEmojiClick={(emojiData) => {
                                            if (emojiData.isCustom) {
                                                onCustomReact(emojiData.imageUrl, message);
                                            } else {
                                                onReact(emojiData, message);
                                            }
                                        }}
                                        defaultSkinTone={SkinTones.NEUTRAL}
                                        getEmojiUrl={(unified, style) => `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/${style}/64/${unified}.png`}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                                onClick={() => handleStartReply(message)}
                                disabled={isOptimistic}
                            >
                                <Reply className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {renderReactions(message)}
                </div>
            </div>
            {isMyMessage && (
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 self-end shrink-0">
                    <AvatarImage src={getAvatarUrl(loggedInUser.avatar_url)} alt={loggedInUser.name} data-ai-hint="avatar" />
                    <AvatarFallback className="text-[10px] sm:text-xs">{loggedInUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
});
