"use client";

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RichTextRendererProps {
    content: string;
    className?: string;
    onHareKrishnaClick?: () => void;
}

// Process inline formatting (bold, italic, hashtags, mentions, URLs, Hare Krishna)
function processInlineFormatting(text: string, onHareKrishnaClick?: () => void, keyPrefix: string = ''): React.ReactNode[] {
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(#\w+)|(@\w+)|(https?:\/\/[^\s]+)|((?:Hare|HARE|hare)\s+(?:Krishna|KRISHNA|krishna|Kṛṣṇa))/gi;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let matchIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(text.substring(lastIndex, match.index));
        }

        const key = `${keyPrefix}inline-${matchIndex++}`;

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

    if (lastIndex < text.length) {
        elements.push(text.substring(lastIndex));
    }

    return elements;
}

export function RichTextRenderer({ content, className, onHareKrishnaClick }: RichTextRendererProps) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let lineIndex = 0;

    while (lineIndex < lines.length) {
        const line = lines[lineIndex];
        const key = `line-${lineIndex}`;

        // Horizontal rule (---)
        if (/^-{3,}$/.test(line.trim())) {
            elements.push(<hr key={key} className="my-3 border-border" />);
            lineIndex++;
            continue;
        }

        // Heading (## text)
        const headingMatch = line.match(/^##\s+(.+)$/);
        if (headingMatch) {
            elements.push(
                <h2 key={key} className="text-lg font-bold mt-2 mb-1">
                    {processInlineFormatting(headingMatch[1], onHareKrishnaClick, key)}
                </h2>
            );
            lineIndex++;
            continue;
        }

        // Bullet list (- item)
        if (/^-\s+/.test(line)) {
            const listItems: React.ReactNode[] = [];
            while (lineIndex < lines.length && /^-\s+/.test(lines[lineIndex])) {
                const itemText = lines[lineIndex].replace(/^-\s+/, '');
                listItems.push(
                    <li key={`${key}-item-${listItems.length}`} className="ml-1">
                        {processInlineFormatting(itemText, onHareKrishnaClick, `${key}-${listItems.length}`)}
                    </li>
                );
                lineIndex++;
            }
            elements.push(
                <ul key={key} className="list-disc list-inside my-1 space-y-0.5">
                    {listItems}
                </ul>
            );
            continue;
        }

        // Numbered list (1. item, 2. item, etc.)
        if (/^\d+\.\s+/.test(line)) {
            const listItems: React.ReactNode[] = [];
            while (lineIndex < lines.length && /^\d+\.\s+/.test(lines[lineIndex])) {
                const itemText = lines[lineIndex].replace(/^\d+\.\s+/, '');
                listItems.push(
                    <li key={`${key}-item-${listItems.length}`} className="ml-1">
                        {processInlineFormatting(itemText, onHareKrishnaClick, `${key}-${listItems.length}`)}
                    </li>
                );
                lineIndex++;
            }
            elements.push(
                <ol key={key} className="list-decimal list-inside my-1 space-y-0.5">
                    {listItems}
                </ol>
            );
            continue;
        }

        // Regular paragraph line
        if (line.trim()) {
            elements.push(
                <React.Fragment key={key}>
                    {processInlineFormatting(line, onHareKrishnaClick, key)}
                    {lineIndex < lines.length - 1 && '\n'}
                </React.Fragment>
            );
        } else if (lineIndex > 0 && lineIndex < lines.length - 1) {
            // Handle empty lines as line breaks
            elements.push(<React.Fragment key={key}>{'\n'}</React.Fragment>);
        }

        lineIndex++;
    }

    return <div className={cn("whitespace-pre-wrap break-words", className)}>{elements}</div>;
}

