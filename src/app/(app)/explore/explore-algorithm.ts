/**
 * @file Explore Page Content Algorithm
 * Dynamically mixes posts, Leela suggestions, and events for discovery feed
 */

import { PostType } from '@/lib/types';
import { calculateEngagementScore, getTrendingPosts } from '../feed-algorithm';

export interface ExploreContentItem {
    id: string;
    type: 'post' | 'leela' | 'event';
    data: any;
    score: number;
}

export interface LeelaPrompt {
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
}

export interface EventItem {
    id: string;
    title: string;
    description: string;
    date?: string;
    route: string;
}

/**
 * Get Leela prompts for explore grid
 */
export function getLeelaPrompts(): LeelaPrompt[] {
    return [
        {
            id: 'leela-1',
            title: 'Leela AI',
            description: 'Ask me anything',
            icon: '✨',
            route: '/leela'
        },
        {
            id: 'leela-2',
            title: 'Daily Wisdom',
            description: 'Get inspired',
            icon: '📖',
            route: '/leela'
        },
        {
            id: 'leela-3',
            title: 'Bhagavad Gita',
            description: 'Explore verses',
            icon: '🕉️',
            route: '/leela'
        }
    ];
}

/**
 * Get event placeholders (will be replaced with real events from DB)
 */
export function getEventSuggestions(): EventItem[] {
    return [
        {
            id: 'event-1',
            title: 'Upcoming Event',
            description: 'Join the community',
            route: '/events'
        },
        {
            id: 'event-2',
            title: 'Live Kirtan',
            description: 'This weekend',
            route: '/events'
        }
    ];
}

/**
 * Calculate score for content items to determine placement
 */
function calculateItemScore(item: ExploreContentItem): number {
    if (item.type === 'post') {
        return calculateEngagementScore(item.data) * 2; // Posts get 2x weight
    }
    // Leela and events get random placement with slight boost
    return Math.random() * 0.5 + 0.3;
}

/**
 * Mix posts, Leela, and events dynamically
 * Algorithm:
 * 1. Get trending posts
 * 2. Calculate scores for intelligent placement
 * 3. Return top posts by engagement
 */
/**
 * Mix posts dynamically — sorted by engagement score across ALL posts,
 * not limited to the last 24h (unlike getTrendingPosts which is feed-only).
 */
export function generateExploreContent(
    posts: PostType[],
    limit: number = 30
): ExploreContentItem[] {
    if (!posts || posts.length === 0) return [];

    const contentPool: ExploreContentItem[] = posts
        .slice(0, limit * 2) // Take from first N posts (already sorted by recency from DB)
        .map((post, idx) => {
            const score = calculateEngagementScore(post) + (posts.length - idx) * 0.01;
            return {
                id: `post-${post.id}`,
                type: 'post' as const,
                data: post,
                score
            };
        });

    // Sort by score descending, take top `limit`
    return contentPool.sort((a, b) => b.score - a.score).slice(0, limit);
}
