'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Video, MoreVertical, Pin, Star, AtSign, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/providers/app-provider';
import { useCallContext } from '@/providers/call-provider';
import { cn, getContrastingTextColor, createClient, getAvatarUrl } from '@/lib/utils';
import type { Chat, User, Message } from '@/lib/types';

// Split-out modules
import { SYSTEM_MESSAGE_PREFIX, PIN_MESSAGE_MARKER } from './chat-constants';
import type { ChatProps, MessageBubbleContext } from './chat-types';
import { MessageBubble } from './message-bubble';
import { useParseContent } from './message-content/parse-markdown';
import { createRenderMessageContent } from './message-content/render-message-content';
import { createRenderReactions } from './message-content/render-reactions';
import { useChatActions } from './hooks/use-chat-actions';
import { useChatScroll } from './hooks/use-chat-scroll';

// Dialog imports
import { RequestDmDialog } from '../../dialogs/request-dm-dialog';
import { ForwardMessageDialog } from './dialogs/forward-message-dialog';
import { ReportDialog } from '../../dialogs/report-dialog';
import { PinnedMessagesDialog } from './dialogs/pinned-messages-dialog';
import { StarredMessagesDialog } from './dialogs/starred-messages-dialog';
import { ImageViewerDialog } from '../media/image-viewer';
import { MessageInfoDialog } from './dialogs/message-info-dialog';
import { ChatInput } from './chat-input';
import { TranslateDialog } from '../../dialogs/translate-dialog';

// ---------------------------------------------------------------------------
// Small pure separator components — no hooks, safe to keep inline
// ---------------------------------------------------------------------------
const DateSeparator = ({ date }: { date: string }) => (
    <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center">
            <span className="bg-muted px-3 text-xs font-medium text-muted-foreground rounded-full">{date}</span>
        </div>
    </div>
);

const UnreadSeparator = () => (
    <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-red-500" /></div>
        <div className="relative flex justify-center">
            <span className="bg-red-500 px-3 text-xs font-medium text-white rounded-full">Unread Messages</span>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Chat component
// ---------------------------------------------------------------------------
export function Chat({
    chat, loggedInUser, setMessages,
    highlightMessageId, isLoadingMore, hasMoreMessages,
    topMessageSentinelRef, scrollContainerRef, initialUnreadCount = 0,
}: ChatProps) {
    const { toast } = useToast();
    const { themeSettings, dmRequests, leaveGroup, deleteGroup, sendDmRequest, unblockUser, blockedUsers, forwardMessage } = useAppContext();
    const { startCall, startGroupCall, joinCall } = useCallContext();
    const router = useRouter();

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isRequestDmOpen, setIsRequestDmOpen] = useState(false);
    const [messageToTranslate, setMessageToTranslate] = useState<Message | null>(null);
    const [customEmojiList, setCustomEmojiList] = useState<string[]>([]);
    const [messageToForward, setMessageToForward] = useState<Message | null>(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [messageToReport, setMessageToReport] = useState<Message | null>(null);
    const [isPinnedDialogOpen, setIsPinnedDialogOpen] = useState(false);
    const [isStarredDialogOpen, setIsStarredDialogOpen] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [imageViewerSrc, setImageViewerSrc] = useState('');
    const [messageInfo, setMessageInfo] = useState<Message | null>(null);
    const [firstUnreadMentionId, setFirstUnreadMentionId] = useState<number | null>(null);

    // -------------------------------------------------------------------------
    // Derived values
    // -------------------------------------------------------------------------
    const supabase = useMemo(() => createClient(), []);
    const isGroup = chat.type === 'group' || chat.type === 'channel';
    const isChannel = chat.type === 'channel';

    const chatPartner = useMemo(() => {
        if (chat.type !== 'dm' || !chat.participants) return null;
        const partnerRecord = chat.participants.find(p => p.user_id !== loggedInUser.id);
        return partnerRecord?.profiles ?? null;
    }, [chat, loggedInUser.id]);

    const canPostInChannel = useMemo(() =>
        isChannel && chat.participants.find(p => p.user_id === loggedInUser.id)?.is_admin,
        [chat, loggedInUser.id, isChannel]);

    const isChatPartnerBlocked = useMemo(() => {
        if (!chatPartner || !blockedUsers) return false;
        return blockedUsers.includes(chatPartner.id);
    }, [blockedUsers, chatPartner]);

    const isGroupAdmin = useMemo(() =>
        isGroup && chat.participants.find(p => p.user_id === loggedInUser.id)?.is_admin,
        [chat, loggedInUser.id, isGroup]);

    const pinnedMessages = useMemo(() => (chat.messages || []).filter(m => m.is_pinned), [chat.messages]);
    const starredMessages = useMemo(() =>
        (chat.messages || []).filter(m => m.starred_by?.includes(loggedInUser.id) ?? m.is_starred),
        [chat.messages, loggedInUser.id]);

    const isDmRestricted = useMemo(() => {
        if (chat.type !== 'dm' || !chatPartner || !dmRequests || loggedInUser.is_admin || chatPartner.is_admin) return false;
        if (!(loggedInUser.gender && chatPartner.gender && loggedInUser.gender !== chatPartner.gender)) return false;
        const hasPermission = dmRequests.some(req =>
            req.status === 'approved' &&
            ((req.from_user_id === loggedInUser.id && req.to_user_id === chatPartner.id) ||
                (req.from_user_id === chatPartner.id && req.to_user_id === loggedInUser.id))
        );
        if (chatPartner?.role === 'gurudev' && !loggedInUser.is_admin) {
            if ((chat.messages || []).length > 0) return false;
            return !hasPermission;
        }
        if (hasPermission) return false;
        if ((chat.messages || []).length === 0 && !hasPermission) return true;
        return !hasPermission;
    }, [chat.type, loggedInUser, chatPartner, dmRequests, chat.messages]);

    const existingRequest = useMemo(() => {
        if (!chatPartner || !dmRequests) return null;
        return dmRequests.find(req =>
            (req.from_user_id === loggedInUser.id && req.to_user_id === chatPartner.id) ||
            (req.from_user_id === chatPartner.id && req.to_user_id === loggedInUser.id)
        );
    }, [dmRequests, loggedInUser, chatPartner]);

    // -------------------------------------------------------------------------
    // Theme styles
    // -------------------------------------------------------------------------
    const wallpaperStyle = {
        backgroundImage: themeSettings.chatWallpaper ? `url(${themeSettings.chatWallpaper})` : `url('/chat-bg/light.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: `brightness(${themeSettings.wallpaperBrightness / 100})`,
        backgroundRepeat: themeSettings.chatWallpaper?.startsWith('/chat-bg/') ? 'repeat' : 'no-repeat',
    };

    const outgoingBubbleStyle = {
        backgroundColor: themeSettings.outgoingBubbleColor,
        color: getContrastingTextColor(themeSettings.outgoingBubbleColor),
    };

    const incomingBubbleStyle = {
        backgroundColor: themeSettings.incomingBubbleColor,
        color: getContrastingTextColor(themeSettings.incomingBubbleColor),
    };

    // -------------------------------------------------------------------------
    // Custom hooks
    // -------------------------------------------------------------------------
    const { messagesEndRef, showScrollToBottom, jumpToMessage, handleScrollToBottom } = useChatScroll({
        messages: chat.messages,
        highlightMessageId,
        scrollContainerRef,
        setIsPinnedDialogOpen,
    });

    const {
        handleSaveEdit, handleDeleteForEveryone, handleCopy,
        handleStartEdit, handleStartReply, handleReaction,
        onReact, onCustomReact, handleToggleStar, handleTogglePin,
        handleClearChat,
    } = useChatActions({
        chat, loggedInUser, setMessages,
        setEditingMessage, setReplyingTo,
        isGroup, isGroupAdmin: !!isGroupAdmin, supabase,
    });

    // -------------------------------------------------------------------------
    // Effects
    // -------------------------------------------------------------------------
    // Load custom emoji/stickers
    useEffect(() => {
        fetch('/api/assets')
            .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
            .then(data => { if (!data.error) setCustomEmojiList(data.emojis || []); })
            .catch(err => console.error('Failed to load assets:', err));
    }, []);

    // Find first unread mention
    useEffect(() => {
        if (initialUnreadCount > 0 && chat.messages?.length && loggedInUser?.username) {
            const mentionRegex = new RegExp(`@${loggedInUser.username}|@everyone`, 'i');
            const firstMention = chat.messages.slice(-initialUnreadCount).find(m => m.content && mentionRegex.test(m.content));
            if (firstMention) setFirstUnreadMentionId(firstMention.id as number);
        }
    }, [initialUnreadCount, chat.messages, loggedInUser?.username]);

    // Real-time message updates
    useEffect(() => {
        const channel = supabase.channel(`chat-messages-updates-${chat.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` },
                (payload) => {
                    const updatedMessage = payload.new as Message;
                    setMessages(current => current.map(msg =>
                        msg.id === updatedMessage.id ? { ...msg, ...updatedMessage, profiles: msg.profiles } : msg
                    ));
                }
            ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [chat.id, supabase, setMessages]);

    // -------------------------------------------------------------------------
    // Render helpers (built once per render via factories / hooks)
    // -------------------------------------------------------------------------
    const parseContent = useParseContent(customEmojiList, chat.participants, loggedInUser.id);

    const getMessageStatus = useCallback((message: Message): 'pending' | 'sent' | 'read' | null => {
        if (message.user_id !== loggedInUser.id) return null;
        if (typeof message.id === 'string' && message.id.startsWith('temp-')) return 'pending';
        const others = chat.participants.filter(p => p.user_id !== loggedInUser.id);
        if (others.length === 0) return 'sent';
        return others.every(p => message.read_by?.includes(p.user_id)) ? 'read' : 'sent';
    }, [chat.participants, loggedInUser.id]);

    const renderMessageContent = useMemo(() =>
        createRenderMessageContent({ parseContent, loggedInUserId: loggedInUser.id, setImageViewerSrc, setIsImageViewerOpen, chatParticipants: chat.participants }),
        [parseContent, loggedInUser.id, chat.participants]);

    const renderReactions = useMemo(() =>
        createRenderReactions({ loggedInUserId: loggedInUser.id, handleReaction, chatParticipants: chat.participants }),
        [loggedInUser.id, handleReaction, chat.participants]);

    const reactionPickerCustomEmojis = useMemo(() =>
        customEmojiList.map(url => ({ id: url, names: [url.split('/').pop()?.split('.')[0] || 'custom'], imgUrl: url })),
        [customEmojiList]);

    // -------------------------------------------------------------------------
    // Messages list with separators
    // -------------------------------------------------------------------------
    const messagesWithSeparators = useMemo(() => {
        if (!chat.messages || chat.messages.length === 0) return [];
        const items: (Message | { type: 'separator' | 'unread_separator'; id: string; date: string })[] = [];
        let lastDate: Date | null = null;
        const unreadIndex = initialUnreadCount > 0 && initialUnreadCount < chat.messages.length
            ? chat.messages.length - initialUnreadCount : -1;

        chat.messages.forEach((message, index) => {
            const messageDate = new Date(message.created_at);
            if (!lastDate || !isSameDay(messageDate, lastDate)) {
                const label = isToday(messageDate) ? 'Today' : isYesterday(messageDate) ? 'Yesterday' : format(messageDate, 'MMMM d, yyyy');
                items.push({ type: 'separator', id: `sep-${message.id}`, date: label });
            }
            if (index === unreadIndex) items.push({ type: 'unread_separator', id: 'unread-separator', date: '' });
            items.push(message);
            lastDate = messageDate;
        });
        return items;
    }, [chat.messages, initialUnreadCount]);

    // -------------------------------------------------------------------------
    // Stable bubble context (memoized so MessageBubble (React.memo) skips re-renders)
    // -------------------------------------------------------------------------
    const bubbleCtx: MessageBubbleContext = useMemo(() => ({
        loggedInUser, isGroup, isGroupAdmin: !!isGroupAdmin, themeSettings,
        outgoingBubbleStyle, incomingBubbleStyle,
        editingMessage, highlightMessageId, reactionPickerCustomEmojis,
        chatParticipants: chat.participants,
        loggedInUserId: loggedInUser.id,
        chatName: chat.name,
        disableSharing: !!chat.disable_sharing,
        startCall, joinCall,
        handleStartReply, handleDeleteForEveryone, handleCopy, handleStartEdit,
        onReact, onCustomReact, handleToggleStar, handleTogglePin,
        setMessageToForward, setMessageToReport, setIsReportDialogOpen,
        setMessageInfo, setMessageToTranslate, jumpToMessage,
        getMessageStatus, renderMessageContent, renderReactions,
    }), [
        loggedInUser, isGroup, isGroupAdmin, themeSettings, outgoingBubbleStyle, incomingBubbleStyle,
        editingMessage, highlightMessageId, reactionPickerCustomEmojis, chat.participants, chat.name,
        startCall, joinCall, handleStartReply, handleDeleteForEveryone, handleCopy, handleStartEdit,
        onReact, onCustomReact, handleToggleStar, handleTogglePin,
        setMessageToForward, setMessageToReport, setIsReportDialogOpen,
        setMessageInfo, setMessageToTranslate, jumpToMessage, getMessageStatus,
        renderMessageContent, renderReactions,
    ]);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <div className="flex h-dvh flex-col">
            {/* Dialogs */}
            <TranslateDialog open={!!messageToTranslate} onOpenChange={() => setMessageToTranslate(null)} message={messageToTranslate} />
            <ImageViewerDialog
                open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}
                media={imageViewerSrc ? [{ url: imageViewerSrc, type: 'image' }] : []}
                startIndex={0}
            />
            {chatPartner && <RequestDmDialog open={isRequestDmOpen} onOpenChange={setIsRequestDmOpen} targetUser={chatPartner} />}
            {messageToForward && <ForwardMessageDialog open={!!messageToForward} onOpenChange={(open) => !open && setMessageToForward(null)} message={messageToForward} />}
            {messageInfo && <MessageInfoDialog message={messageInfo} chat={chat} open={!!messageInfo} onOpenChange={() => setMessageInfo(null)} />}
            {chatPartner && <ReportDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} userToReport={chatPartner} messageToReport={messageToReport} />}
            <PinnedMessagesDialog
                open={isPinnedDialogOpen} onOpenChange={setIsPinnedDialogOpen}
                messages={pinnedMessages} onJumpToMessage={jumpToMessage}
                onUnpinMessage={(id) => { const msg = chat.messages?.find(m => m.id === id); if (msg) handleTogglePin(msg); }}
                isAdmin={!!isGroupAdmin}
            />
            <StarredMessagesDialog
                open={isStarredDialogOpen} onOpenChange={setIsStarredDialogOpen}
                messages={starredMessages} onJumpToMessage={jumpToMessage}
                onUnstarMessage={(id) => { const msg = chat.messages?.find(m => m.id === id); if (msg) handleToggleStar(msg); }}
            />

            {/* Header */}
            <header className="flex items-center justify-between p-2 border-b gap-1 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/chat')} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                        </Button>
                    </div>
                    <Link href={isGroup ? `/group/${chat.id}` : `/profile/${chatPartner?.username || ''}`} className="flex-shrink-0">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage src={getAvatarUrl(isGroup ? chat.avatar_url : chatPartner?.avatar_url)} alt={isGroup ? chat.name : chatPartner?.name} data-ai-hint={isGroup ? 'group symbol' : 'avatar'} />
                            <AvatarFallback className="text-xs sm:text-sm">{(isGroup ? chat.name : chatPartner?.name)?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <Link href={isGroup ? `/group/${chat.id}` : `/profile/${chatPartner?.username || ''}`}>
                            <span className="font-semibold hover:underline truncate block text-sm sm:text-base">{isGroup ? chat.name : chatPartner?.name}</span>
                        </Link>
                        <span className="text-[10px] sm:text-xs text-muted-foreground truncate block">
                            {isGroup ? `${chat.participants?.length} members` : chatPartner ? `@${chatPartner.username}` : ''}
                        </span>
                    </div>
                </div>
                <div className="flex items-center shrink-0">
                    {pinnedMessages.length > 0 && (
                        <TooltipProvider><Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setIsPinnedDialogOpen(true)}>
                                    <Pin className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Pinned Messages</TooltipContent>
                        </Tooltip></TooltipProvider>
                    )}
                    {starredMessages.length > 0 && (
                        <TooltipProvider><Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setIsStarredDialogOpen(true)}>
                                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 fill-amber-400" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Starred Messages</TooltipContent>
                        </Tooltip></TooltipProvider>
                    )}
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => isGroup ? startGroupCall(chat.id.toString(), 'voice') : chatPartner && startCall(chatPartner.id, 'voice')}
                        disabled={!isGroup && !chatPartner}>
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => isGroup ? startGroupCall(chat.id.toString(), 'video') : chatPartner && startCall(chatPartner.id, 'video')}
                        disabled={!isGroup && !chatPartner}>
                        <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={isGroup ? `/group/${chat.id}` : `/profile/${chatPartner?.username || ''}`}>View Info</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsStarredDialogOpen(true)}>
                                <Star className="mr-2 h-4 w-4" /><span>Starred Messages</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => isGroup ? startGroupCall(chat.id.toString(), 'voice') : chatPartner && startCall(chatPartner.id, 'voice')} className="sm:hidden">
                                <Phone className="mr-2 h-4 w-4" /><span>Voice Call</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                if (window.confirm('Are you sure you want to clear this chat? This will remove all messages from your view.')) {
                                    handleClearChat();
                                }
                            }}>
                                Clear chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Message area */}
            <div className="relative flex-1 min-h-0">
                <div className="absolute inset-0" style={wallpaperStyle} />
                <div ref={scrollContainerRef as React.RefObject<HTMLDivElement>} className="relative h-full overflow-y-auto px-2 sm:px-4 py-4 space-y-1">
                    {isLoadingMore && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    <div ref={topMessageSentinelRef} className="h-1" />
                    {messagesWithSeparators.map((item) => {
                        if ('type' in item) {
                            if (item.type === 'separator') return <DateSeparator key={item.id} date={item.date} />;
                            if (item.type === 'unread_separator') return <UnreadSeparator key={item.id} />;
                        }
                        return <MessageBubble key={(item as Message).id} message={item as Message} ctx={bubbleCtx} />;
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom / mention jump buttons */}
                {(showScrollToBottom || firstUnreadMentionId) && (
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                        {firstUnreadMentionId && (
                            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg"
                                onClick={() => { jumpToMessage(firstUnreadMentionId); setFirstUnreadMentionId(null); }}>
                                <AtSign className="h-4 w-4" />
                            </Button>
                        )}
                        {showScrollToBottom && (
                            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg" onClick={handleScrollToBottom}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 11 5 5 5-5"/><path d="M12 4v12"/></svg>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Input — ChatInput handles its own blocked/restricted banners internally */}
            <ChatInput
                chat={chat}
                loggedInUser={loggedInUser}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                editingMessage={editingMessage}
                setEditingMessage={setEditingMessage}
                onSaveEdit={() => handleSaveEdit(editingMessage)}
                messagesEndRef={messagesEndRef}
                isChannel={isChannel}
                canPostInChannel={canPostInChannel}
                isChatPartnerBlocked={isChatPartnerBlocked}
                isDmRestricted={isDmRestricted}
                existingRequest={existingRequest}
                onUnblockUser={() => chatPartner && unblockUser(chatPartner.id)}
                onRequestDm={() => setIsRequestDmOpen(true)}
                setMessages={setMessages}
            />
        </div>
    );
}
