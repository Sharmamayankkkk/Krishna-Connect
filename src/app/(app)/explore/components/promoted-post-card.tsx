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
import { VerificationBadge } from "@/components/shared/verification-badge";

// Types matching promoted_content.json structure
export interface PromotedAuthor {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean | 'none' | 'verified' | 'kcs';
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
        <div className={cn("py-6 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700", className)}>
            <div className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-500">

                {/* Spotlights / Glow effects */}
                <div className="absolute -top-20 -right-20 h-40 w-40 bg-primary/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative p-6 sm:p-8">
                    {/* Header: Featured Badge & Author */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
                                <AvatarImage src={author.avatar} alt={author.name} />
                                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-lg leading-none">{author.name}</span>
                                    <VerificationBadge verified={author.verified} size={18} />
                                </div>
                                <p className="text-sm text-muted-foreground">@{author.username}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-background/50 backdrop-blur-md border-primary/30 text-primary px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-sm">
                            <Megaphone className="h-3 w-3 mr-1.5 fill-current" />
                            Featured
                        </Badge>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <p className="text-lg sm:text-xl font-medium leading-relaxed text-foreground/90">
                            {content.text}
                        </p>

                        {/* Hero Image */}
                        {(type === 'image_banner' || type === 'product_showcase') && content.imageUrl && (
                            <div className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-inner bg-muted/20 group-hover:scale-[1.01] transition-transform duration-500">
                                <Image
                                    src={content.imageUrl}
                                    alt="Promoted content"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* CTA Footer */}
                    {cta && (
                        <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-primary/10">
                            <p className="text-sm text-muted-foreground font-medium hidden sm:block">
                                Sponsored Content
                            </p>
                            <Button asChild size="lg" className="w-full sm:w-auto rounded-full font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                                <Link href={cta.url} target="_blank" rel="noopener noreferrer">
                                    {cta.label}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
