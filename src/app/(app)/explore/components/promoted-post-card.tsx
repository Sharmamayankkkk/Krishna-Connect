'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types matching promoted_content.json structure
export interface PromotedAuthor {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
}

export interface PromotedCTA {
    label: string;
    url: string;
}

export interface PromotedContent {
    id: string;
    type: 'text_post' | 'image_banner' | 'product_showcase';
    active: boolean;
    priority: number;
    content: {
        text?: string;
        imageUrl?: string;
        author: PromotedAuthor;
    };
    cta?: PromotedCTA | null;
    targeting?: {
        all?: boolean;
        userIds?: string[];
        interests?: string[];
    };
    schedule?: {
        start?: string | null;
        end?: string | null;
    };
}

interface PromotedPostCardProps {
    promotion: PromotedContent;
    className?: string;
}

export function PromotedPostCard({ promotion, className }: PromotedPostCardProps) {
    const { content, cta, type } = promotion;
    const author = content.author;

    // Don't render if missing critical content
    if (!author || !content.text) {
        return null;
    }

    return (
        <Card
            className={cn(
                "rounded-none border-b border-t-0 border-x-0 shadow-none transition-colors",
                "bg-gradient-to-r from-primary/5 to-transparent",
                "border-l-4 border-l-primary/30",
                className
            )}
        >
            <CardContent className="p-4">
                {/* Promoted Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
                        <Megaphone className="h-3 w-3 mr-1" />
                        Promoted
                    </Badge>
                </div>

                <div className="flex gap-3">
                    {/* Avatar */}
                    <Link href={`/profile/${author.username}`} className="shrink-0">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-1 mb-1">
                            <Link href={`/profile/${author.username}`} className="group flex items-center gap-1 min-w-0">
                                <span className="font-semibold hover:underline truncate text-sm">
                                    {author.name}
                                </span>
                                {author.verified && (
                                    <Image
                                        src="/user_Avatar/verified.png"
                                        alt="Verified"
                                        width={16}
                                        height={16}
                                        className="flex-shrink-0"
                                    />
                                )}
                                <span className="text-sm text-muted-foreground truncate ml-1">
                                    @{author.username}
                                </span>
                            </Link>
                        </div>

                        {/* Text Content */}
                        {content.text && (
                            <p className="whitespace-pre-wrap text-foreground/90 text-sm sm:text-base break-words mb-3">
                                {content.text}
                            </p>
                        )}

                        {/* Image (for image_banner type) */}
                        {type === 'image_banner' && content.imageUrl && (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border mb-3">
                                <Image
                                    src={content.imageUrl}
                                    alt="Promoted content"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        {/* CTA Button */}
                        {cta && (
                            <Button asChild variant="outline" size="sm" className="rounded-full">
                                <Link href={cta.url}>
                                    {cta.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Utility: Filter active promotions that should be shown now
export function getActivePromotions(promotions: PromotedContent[]): PromotedContent[] {
    const now = new Date();

    return promotions
        .filter(p => {
            if (!p.active) return false;

            // Check schedule
            if (p.schedule) {
                if (p.schedule.start && new Date(p.schedule.start) > now) return false;
                if (p.schedule.end && new Date(p.schedule.end) < now) return false;
            }

            return true;
        })
        .sort((a, b) => a.priority - b.priority);
}

// Utility: Inject promotions into a feed at intervals
export function injectPromotionsIntoFeed<T>(
    feed: T[],
    promotions: PromotedContent[],
    interval: number = 5
): (T | PromotedContent)[] {
    if (promotions.length === 0 || interval <= 0) {
        return feed;
    }

    const result: (T | PromotedContent)[] = [];
    let promotionIndex = 0;

    for (let i = 0; i < feed.length; i++) {
        result.push(feed[i]);

        // After every `interval` posts, inject a promotion
        if ((i + 1) % interval === 0 && promotionIndex < promotions.length) {
            result.push(promotions[promotionIndex]);
            promotionIndex++;
        }
    }

    return result;
}

// Type guard to check if an item is a promotion
export function isPromotion(item: any): item is PromotedContent {
    return item && typeof item === 'object' && 'type' in item && 'content' in item && !('author' in item && 'stats' in item);
}
