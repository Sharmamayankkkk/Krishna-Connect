"use client";

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RichTextRendererProps {
    content: string;
    className?: string;
    onHareKrishnaClick?: () => void;
}

export function RichTextRenderer({ content, className, onHareKrishnaClick }: RichTextRendererProps) {

    // Combined regex for bold, italic, hashtags, mentions, URLs, and Hare Krishna
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(#\w+)|(@\w+)|(https?:\/\/[^\s]+)|((?:Hare|HARE|hare)\s+(?:Krishna|KRISHNA|krishna|Kṛṣṇa))/gi;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let matchIndex = 0;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            elements.push(content.substring(lastIndex, match.index));
        }

        const key = `rt-${matchIndex++}`;

        if (match[1]) {
            // Bold (**text**)
            elements.push(<strong key={key} className="font-bold">{match[2]}</strong>);
        } else if (match[3]) {
            // Italic (*text*)
            elements.push(<em key={key} className="italic">{match[4]}</em>);
        } else if (match[5]) {
            // Hashtag
            elements.push(
                <Link key={key} href={`/hashtag/${match[5].substring(1)}`} className="text-primary hover:underline font-medium">
                    {match[5]}
                </Link>
            );
        } else if (match[6]) {
            // Mention (@username)
            const username = match[6].substring(1);
            elements.push(
                <Link key={key} href={`/u/${username}`} className="text-blue-500 hover:underline font-medium">
                    {match[6]}
                </Link>
            );
        } else if (match[7]) {
            // URL
            elements.push(
                <a key={key} href={match[7]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                    {match[7]}
                </a>
            );
        } else if (match[8]) {
            // Hare Krishna
            elements.push(
                <span
                    key={key}
                    onClick={onHareKrishnaClick}
                    className="inline-block cursor-pointer transition-transform hover:scale-105 font-semibold"
                    style={{
                        background: 'linear-gradient(135deg, #0a4d68 0%, #1e8bc3 20%, #16c79a 40%, #11d3bc 60%, #7ee8fa 80%, #eaf9ff 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}
                >
                    {match[8]}
                </span>
            );
        }
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
        elements.push(content.substring(lastIndex));
    }

    return <div className={cn("whitespace-pre-wrap break-words", className)}>{elements}</div>;
}
