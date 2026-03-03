'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseChatScrollOptions {
    messages: any[] | undefined;
    highlightMessageId?: number | null;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    setIsPinnedDialogOpen: (open: boolean) => void;
}

export const useChatScroll = ({
    messages,
    highlightMessageId,
    scrollContainerRef,
    setIsPinnedDialogOpen,
}: UseChatScrollOptions) => {
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasScrolledOnLoad = useRef(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    const jumpToMessage = useCallback((messageId: number) => {
        setIsPinnedDialogOpen(false);
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('animate-highlight');
            setTimeout(() => messageElement.classList.remove('animate-highlight'), 1500);
        } else {
            toast({ variant: 'destructive', title: 'Message not found', description: 'The original message may not be loaded.' });
        }
    }, [setIsPinnedDialogOpen, toast]);

    // Scroll-to-bottom button visibility
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;
        const handleScroll = () => {
            const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 400;
            setShowScrollToBottom(!isAtBottom);
        };
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef]);

    // Initial scroll to highlighted message or bottom
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || !messagesEndRef.current) return;
        const highlightedElement = highlightMessageId
            ? document.getElementById(`message-${highlightMessageId}`)
            : null;
        if (highlightedElement) {
            jumpToMessage(highlightMessageId as number);
            hasScrolledOnLoad.current = true;
            return;
        }
        if (!hasScrolledOnLoad.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            hasScrolledOnLoad.current = true;
        }
    }, [messages, highlightMessageId, jumpToMessage, scrollContainerRef]);

    // Auto-scroll on new messages (only when near bottom)
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 200;
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages?.length, scrollContainerRef]);

    const handleScrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    return { messagesEndRef, showScrollToBottom, jumpToMessage, handleScrollToBottom };
};
