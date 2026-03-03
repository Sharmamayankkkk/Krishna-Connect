import type React from 'react';
import type { Chat, User, Message } from '@/lib/types';
import type { EmojiClickData } from 'emoji-picker-react';

// ---------------------------------------------------------------------------
// Props for the top-level Chat component
// ---------------------------------------------------------------------------
export interface ChatProps {
    chat: Chat;
    loggedInUser: User;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    highlightMessageId?: number | null;
    isLoadingMore: boolean;
    hasMoreMessages: boolean;
    topMessageSentinelRef: React.RefObject<HTMLDivElement>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    initialUnreadCount?: number;
}

// ---------------------------------------------------------------------------
// Context object passed to the module-level MessageBubble so it has access
// to all the handlers it needs without prop-drilling through the message list.
// ---------------------------------------------------------------------------
export interface MessageBubbleContext {
    loggedInUser: User;
    isGroup: boolean;
    isGroupAdmin: boolean;
    themeSettings: any;
    outgoingBubbleStyle: React.CSSProperties;
    incomingBubbleStyle: React.CSSProperties;
    editingMessage: { id: number; content: string } | null;
    highlightMessageId?: number | null;
    reactionPickerCustomEmojis: { id: string; names: string[]; imgUrl: string }[];
    chatParticipants: any[];
    loggedInUserId: string;
    chatName: string | null | undefined;
    disableSharing: boolean;
    startCall?: ((userId: string, type: 'voice' | 'video') => void) | null;
    joinCall?: ((callId: string) => void) | null;
    handleStartReply: (message: Message) => void;
    handleDeleteForEveryone: (messageId: number) => void;
    handleCopy: (text: string) => void;
    handleStartEdit: (message: Message) => void;
    onReact: (emojiData: EmojiClickData, message: Message) => void;
    onCustomReact: (emojiUrl: string, message: Message) => void;
    handleToggleStar: (message: Message) => Promise<void>;
    handleTogglePin: (message: Message) => Promise<void>;
    setMessageToForward: React.Dispatch<React.SetStateAction<Message | null>>;
    setMessageToReport: React.Dispatch<React.SetStateAction<Message | null>>;
    setIsReportDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setMessageInfo: React.Dispatch<React.SetStateAction<Message | null>>;
    setMessageToTranslate: React.Dispatch<React.SetStateAction<Message | null>>;
    jumpToMessage: (messageId: number) => void;
    getMessageStatus: (message: Message) => 'pending' | 'sent' | 'read' | null;
    renderMessageContent: (message: Message) => React.ReactNode;
    renderReactions: (message: Message) => React.ReactNode;
}
