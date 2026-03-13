'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';

import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Spoiler component — click to reveal hidden text
// ---------------------------------------------------------------------------
export const Spoiler = ({ content }: { content: string }) => {
  const { t } = useTranslation();

    const [revealed, setRevealed] = useState(false);
    return (
        <span
            className="spoiler"
            data-revealed={revealed}
            onClick={() => setRevealed(true)}
            title={t('chat.clickToReveal')}
        >
            {content}
        </span>
    );
};

// ---------------------------------------------------------------------------
// DateChip component — renders a timezone-aware date pill
// ---------------------------------------------------------------------------
export const DateChip = ({ iso }: { iso: string }) => {
    const { t } = useTranslation();
    // We only format on the client to avoid hydration mismatch between server UTC and client local time
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    
    const dateObj = new Date(iso);
    const isValid = !isNaN(dateObj.getTime());
    
    if (!isValid) return <span className="text-destructive">{t('chat.invalidDate')}</span>;
    
    const display = mounted 
        ? dateObj.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : 'Loading time...';
        
    return (
        <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-semibold cursor-pointer hover:bg-primary/25 transition-colors border border-primary/20 shadow-sm align-text-bottom">
            <Calendar className="w-3 h-3" />
            {display}
        </span>
    );
};

// ---------------------------------------------------------------------------
// parseMarkdown — converts **bold**, _italic_, ~~strike~~, `code`, ||spoiler||, [[date:ISO]]
// into React nodes. Pure function, no hooks.
// ---------------------------------------------------------------------------
export const parseMarkdown = (text: string | null): (string | React.ReactNode)[] => {
    if (!text) return [];
    const elements: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    const regex = /(\*\*.*?\*\*|_.*?_|~~.*?~~|`.*?`|\|\|.*?\|\||\[\[date:.*?\]\])/g;

    text.replace(regex, (match, _content, offset) => {
        if (offset > lastIndex) elements.push(text.substring(lastIndex, offset));

        if (match.startsWith('**') && match.endsWith('**')) {
            elements.push(<strong key={offset}>{match.slice(2, -2)}</strong>);
        } else if (match.startsWith('_') && match.endsWith('_')) {
            elements.push(<em key={offset}>{match.slice(1, -1)}</em>);
        } else if (match.startsWith('~~') && match.endsWith('~~')) {
            elements.push(<s key={offset}>{match.slice(2, -2)}</s>);
        } else if (match.startsWith('`') && match.endsWith('`')) {
            elements.push(
                <code key={offset} className="bg-muted text-muted-foreground font-mono text-sm px-1.5 py-1 rounded-md">
                    {match.slice(1, -1)}
                </code>
            );
        } else if (match.startsWith('||') && match.endsWith('||')) {
            elements.push(<Spoiler key={offset} content={match.slice(2, -2)} />);
        } else if (match.startsWith('[[date:') && match.endsWith(']]')) {
            elements.push(<DateChip key={offset} iso={match.slice(7, -2)} />);
        } else {
            elements.push(match);
        }

        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < text.length) elements.push(text.substring(lastIndex));
    return elements;
};

// ---------------------------------------------------------------------------
// useParseContent — hook that builds the full content parser for a chat,
// resolving @mentions, :custom_emoji:, and URLs into React nodes.
// ---------------------------------------------------------------------------
export const useParseContent = (
    customEmojiList: string[],
    chatParticipants: any[],
    loggedInUserId: string
) => {
    return useCallback((content: string | null): (string | React.ReactNode)[] => {
        if (!content || typeof content !== 'string') return [];

        if (content.startsWith('Forwarded from')) {
            const parts = content.split('\n');
            return [
                <span key="forwarded-line" className="block text-xs italic opacity-80 font-semibold mb-2">
                    {parts[0].replace(/\*\*/g, '')}
                </span>,
                ...parseMarkdown(parts.slice(1).join('\n')),
            ];
        }

        const emojiMap = new Map(
            customEmojiList.map(url => {
                const name = url.split('/').pop()?.split('.')[0] || 'custom_emoji';
                return [name, url];
            })
        );

        const combinedRegex = /(https?:\/\/[^\s]+)|(@[\w\d_]+)|(:[a-zA-Z0-9_]+:)/g;
        const parsedWithMarkdown = parseMarkdown(content);

        const processNode = (node: string | React.ReactNode): (string | React.ReactNode)[] => {
            if (typeof node !== 'string') return [node];
            const subElements: (string | React.ReactNode)[] = [];
            let subLastIndex = 0;

            node.replace(combinedRegex, (match, url, mention, emoji, offset) => {
                if (offset > subLastIndex) subElements.push(node.substring(subLastIndex, offset));

                if (mention) {
                    const username = mention.substring(1);
                    const isEveryone = username === 'everyone';
                    const participantProfiles = chatParticipants?.map((p: any) => p.profiles).filter(Boolean) || [];
                    const mentionedUser = participantProfiles.find((u: any) => u?.username === username);
                    if (isEveryone || mentionedUser) {
                        const isMe = mentionedUser && (mentionedUser as any).id === loggedInUserId;
                        subElements.push(
                            <span
                                key={`mention-${offset}`}
                                className={`font-semibold rounded-sm px-1 ${isMe ? 'bg-amber-400/30 text-amber-800 dark:text-amber-200' : 'bg-primary/20 text-primary'}`}
                            >
                                {match}
                            </span>
                        );
                    } else {
                        subElements.push(match);
                    }
                } else if (emoji) {
                    const emojiName = emoji.substring(1, emoji.length - 1);
                    const emojiUrl = emojiMap.get(emojiName);
                    if (emojiUrl) {
                        subElements.push(
                            <Image key={`emoji-${offset}`} src={emojiUrl} alt={emojiName} width={28} height={28} className="inline-block align-text-bottom mx-0.5" />
                        );
                    } else {
                        subElements.push(match);
                    }
                } else if (url) {
                    // Lazy-import LinkPreview to avoid circular deps — render as a plain link initially
                    subElements.push(
                        <a key={`url-${offset}`} href={url} target="_blank" rel="noopener noreferrer" className="underline text-primary break-all">
                            {url}
                        </a>
                    );
                }

                subLastIndex = offset + match.length;
                return match;
            });

            if (subLastIndex < node.length) subElements.push(node.substring(subLastIndex));
            return subElements;
        };

        const elements: (string | React.ReactNode)[] = [];
        parsedWithMarkdown.forEach(node => elements.push(...processNode(node)));
        return elements;
    }, [customEmojiList, chatParticipants, loggedInUserId]);
};
