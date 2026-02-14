"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface RichTextRendererProps {
    content: string;
    className?: string;
    onHareKrishnaClick?: () => void;
}

// Custom emoji cache - fetched once and shared
let customEmojiCache: Map<string, string> | null = null;
let customEmojiFetchPromise: Promise<Map<string, string>> | null = null;

function fetchCustomEmojis(): Promise<Map<string, string>> {
    if (customEmojiCache) return Promise.resolve(customEmojiCache);
    if (customEmojiFetchPromise) return customEmojiFetchPromise;
    customEmojiFetchPromise = fetch('/api/assets')
        .then(res => res.json())
        .then(data => {
            const map = new Map<string, string>();
            (data.emojis || []).forEach((url: string) => {
                const name = url.split('/').pop()?.split('.')[0] || '';
                if (name) map.set(name, url);
            });
            customEmojiCache = map;
            return map;
        })
        .catch(() => new Map<string, string>());
    return customEmojiFetchPromise;
}

// Process inline formatting (bold, italic, hashtags, mentions, URLs, custom emojis, Sacred Phrases)
function processInlineFormatting(text: string, onHareKrishnaClick?: () => void, keyPrefix: string = '', emojiMap?: Map<string, string>): React.ReactNode[] {
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(#\w+)|(@\w+)|(https?:\/\/[^\s]+)|(:[a-zA-Z0-9_]+:)|((?:Hare|HARE|hare)\s+(?:Krishna|KRISHNA|krishna|Kṛṣṇa|Rama|RAMA|Ram)|(?:Hari\s+Bol|Haribol)|(?:Radhe\s+Radhe|Radhe|Radha)|(?:(?:Jai|Jaya)\s+(?:Srila\s+Prabhupada|Śrīla\s+Prabhupāda|HG\s+Gauranga\s+Sundar\s+Das\s+Gurudev|His\s+Grace\s+Gauranga\s+Sundar\s+Das\s+Gurudev|Gauranga\s+Sundar|Jagannath|Baladev|Subhadra|Nrsimhadeva))|(?:Bhagwatam|Srimad|Bhagvad\s+(?:Gite|Geeta|Gita))|(?:Nitai\s+Gaur(?:anga)?|Gauranga|Nityananda|Chaitanya|Mahaprabhu|Pancha\s+Tattva|Gadadhar|Srivas|Advaita)|(?:Vrindavan|Mayapur|Goloka|Navadvipa|Jagannath\s+Puri|Dwaraka)|(?:Prabhupada|Gurudev|Maharaj|Acharya|Thakur|Srila)|(?:Dandavat|Pranam)|(?:Prasadam|Maha\s+Prasadam)|(?:Ekadasi|Ekadashi|Radhaashtmi|Radha\s+ashtmi)|(?:Kirtan|Sankirtan|Bhajan|Harinaam|Hari\s+naam)|(?:Bhakti|Seva)|(?:Vaisnava|Vaishnava)|(?:Govinda|Gopal|Madhav|Keshava|Damodar|Shyam|Murari|Vasudeva|Sundar)|(?:Tulsi|Tulasi|Ganga|Yamuna))/gi;

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
            // Custom emoji (:emojiName:)
            const emojiName = match[8].slice(1, -1); // Remove colons
            const emojiUrl = emojiMap?.get(emojiName);
            if (emojiUrl) {
                elements.push(
                    <Image key={key} src={emojiUrl} alt={emojiName} width={24} height={24} className="inline-block align-text-bottom mx-0.5" unoptimized />
                );
            } else {
                // If not found in custom emojis, render as plain text
                elements.push(match[8]);
            }
        } else if (match[9]) {
            // Sacred Phrases
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
                    {match[9]}
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

