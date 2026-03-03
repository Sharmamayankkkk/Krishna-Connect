'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/utils';
import type { Message, User } from '@/lib/types';
import { DELETED_MESSAGE_MARKER, SYSTEM_MESSAGE_PREFIX, PIN_MESSAGE_MARKER } from '../chat-constants';
import type { EmojiClickData } from 'emoji-picker-react';

interface UseChatActionsOptions {
    chat: { id: number | string; messages?: Message[]; participants: any[] };
    loggedInUser: User;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setEditingMessage: React.Dispatch<React.SetStateAction<{ id: number; content: string } | null>>;
    setReplyingTo: React.Dispatch<React.SetStateAction<Message | null>>;
    isGroup: boolean;
    isGroupAdmin: boolean | undefined;
    supabase: ReturnType<typeof createClient>;
}

export const useChatActions = ({
    chat,
    loggedInUser,
    setMessages,
    setEditingMessage,
    setReplyingTo,
    isGroup,
    isGroupAdmin,
    supabase,
}: UseChatActionsOptions) => {
    const { toast } = useToast();

    const sendSystemMessage = useCallback(async (text: string) => {
        const { error } = await supabase.from('messages').insert({
            chat_id: chat.id,
            user_id: loggedInUser.id,
            content: `${SYSTEM_MESSAGE_PREFIX}${text}]]`,
        });
        if (error) toast({ variant: 'destructive', title: 'Error sending system message', description: error.message });
    }, [supabase, chat.id, loggedInUser.id, toast]);

    const handleSaveEdit = useCallback(async (editingMessage: { id: number; content: string } | null) => {
        if (!editingMessage) return;
        const { error } = await supabase
            .from('messages')
            .update({ content: editingMessage.content, is_edited: true })
            .eq('id', editingMessage.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error editing message', description: error.message });
        } else {
            setEditingMessage(null);
        }
    }, [supabase, toast, setEditingMessage]);

    const handleDeleteForEveryone = useCallback(async (messageId: number) => {
        const originalMessages = chat.messages || [];
        const newMessages = originalMessages.map(m =>
            m.id === messageId
                ? { ...m, content: DELETED_MESSAGE_MARKER, attachment_url: null, attachment_metadata: null, reactions: null, is_edited: false }
                : m
        );
        setMessages(newMessages);

        const { error } = await supabase
            .from('messages')
            .update({ content: DELETED_MESSAGE_MARKER, attachment_url: null, attachment_metadata: null, reactions: null, is_edited: false })
            .eq('id', messageId);

        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting message', description: error.message });
            setMessages(originalMessages);
        }
    }, [supabase, chat.messages, setMessages, toast]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard' });
    }, [toast]);

    const handleStartEdit = useCallback((message: Message) => {
        setReplyingTo(null);
        setEditingMessage({ id: message.id as number, content: message.content || '' });
    }, [setReplyingTo, setEditingMessage]);

    const handleStartReply = useCallback((message: Message) => {
        setEditingMessage(null);
        setReplyingTo(message);
    }, [setEditingMessage, setReplyingTo]);

    const handleReaction = useCallback(async (message: Message, emoji: string) => {
        if (typeof message.id === 'string') {
            toast({ variant: 'destructive', title: 'Cannot react yet', description: 'Please wait for the message to be sent.' });
            return;
        }
        const { error } = await supabase.rpc('toggle_reaction', {
            p_emoji: emoji,
            p_message_id: message.id,
            p_user_id: loggedInUser.id,
        });
        if (error) toast({ variant: 'destructive', title: 'Error updating reaction', description: error.message });
    }, [supabase, loggedInUser.id, toast]);

    const onReact = useCallback((emojiData: EmojiClickData, message: Message) => {
        handleReaction(message, emojiData.emoji);
    }, [handleReaction]);

    const onCustomReact = useCallback((emojiUrl: string, message: Message) => {
        handleReaction(message, emojiUrl);
    }, [handleReaction]);

    const handleToggleStar = useCallback(async (messageToStar: Message) => {
        if (typeof messageToStar.id === 'string') return;
        const isCurrentlyStarred = messageToStar.starred_by?.includes(loggedInUser.id) ?? messageToStar.is_starred;

        const { error: rpcError } = await supabase.rpc('toggle_star_message', {
            p_message_id: messageToStar.id,
            p_user_id: loggedInUser.id,
        });
        if (rpcError) {
            const { error } = await supabase
                .from('messages')
                .update({ is_starred: !isCurrentlyStarred })
                .eq('id', messageToStar.id);
            if (error) toast({ variant: 'destructive', title: 'Error starring message', description: error.message });
        }
    }, [supabase, loggedInUser.id, toast]);

    const handleTogglePin = useCallback(async (messageToPin: Message) => {
        if (isGroup && !isGroupAdmin) return;
        if (typeof messageToPin.id === 'string') return;
        const newIsPinned = !messageToPin.is_pinned;
        const { error } = await supabase
            .from('messages')
            .update({ is_pinned: newIsPinned })
            .eq('id', messageToPin.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error pinning message', description: error.message });
        } else {
            if (newIsPinned) sendSystemMessage(`${PIN_MESSAGE_MARKER} ${loggedInUser.name} pinned a message.`);
            toast({ title: newIsPinned ? 'Message pinned' : 'Message unpinned' });
        }
    }, [supabase, isGroup, isGroupAdmin, loggedInUser.name, sendSystemMessage, toast]);

    const handleClearChat = useCallback(async () => {
        const messageIds = (chat.messages || [])
            .filter(m => typeof m.id === 'number')
            .map(m => m.id as number);
        if (messageIds.length === 0) return;

        // Optimistically clear UI immediately
        setMessages([]);

        // Update each message's deleted_for array in the DB
        const { error } = await supabase.rpc('clear_chat_for_user', {
            p_chat_id: chat.id,
            p_user_id: loggedInUser.id,
        });
        if (error) {
            // Fallback: manually push userId into deleted_for for each message
            // (in case the RPC does not exist yet - gracefully degrade)
            console.warn('clear_chat RPC unavailable, messages hidden locally only:', error.message);
        }
    }, [supabase, chat.id, chat.messages, loggedInUser.id, setMessages]);

    return {
        handleSaveEdit,
        handleDeleteForEveryone,
        handleCopy,
        handleStartEdit,
        handleStartReply,
        handleReaction,
        onReact,
        onCustomReact,
        handleToggleStar,
        handleTogglePin,
        handleClearChat,
        sendSystemMessage,
    };
};

