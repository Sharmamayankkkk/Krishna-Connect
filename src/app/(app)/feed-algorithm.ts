/**
 * @file Smart Feed Algorithm v2.0
 * Improved personalized feed ranking with better scoring, content signals, and feed types
 */

import { PostType } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserInteractions {
    userId: string;
    likedPosts: string[];
    savedPosts: string[];
    commentedPosts: string[];
    viewedPosts: string[];
    followedUsers: string[];
    mutedUsers: string[];
    blockedUsers: string[];
    mutedWords: string[];
    lastSeenPostTime: string;
    // New: Track author affinity
    authorEngagements?: { [authorId: string]: number };
}

export interface FeedConfig {
    // Core weights (should sum to ~1.0)
    followingWeight: number;
    engagementWeight: number;
    recencyWeight: number;
    affinityWeight: number;
    // Feed behavior
    diversityFactor: number;
    recommendationRatio: number;
    promotedPostInterval: number;
    // Decay settings
    recencyHalfLifeHours: number;
    engagementHalfLifeHours: number;
}

export type FeedType = 'for_you' | 'following' | 'latest';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: FeedConfig = {
    followingWeight: 0.30,
    engagementWeight: 0.25,
    recencyWeight: 0.25,
    affinityWeight: 0.20,
    diversityFactor: 0.3,
    recommendationRatio: 0.25,
    promotedPostInterval: 6,
    recencyHalfLifeHours: 8,
    engagementHalfLifeHours: 24,
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate time decay factor using exponential decay
 */
function calculateDecay(ageMs: number, halfLifeHours: number): number {
    const ageHours = ageMs / (1000 * 60 * 60);
    return Math.pow(0.5, ageHours / halfLifeHours);
}

/**
 * Calculate engagement score with proper normalization
 */
export function calculateEngagementScore(post: PostType, config: FeedConfig = DEFAULT_CONFIG): number {
    const { likes = 0, comments = 0, reshares = 0, views = 0 } = post.stats || {};

    // Weighted engagement metrics
    // Comments are most valuable (indicates deep engagement)
    // Reshares show content worth sharing
    // Likes are casual engagement
    // Views provide baseline normalization
    const rawEngagement =
        (likes * 1.0) +
        (comments * 3.0) +
        (reshares * 2.5);

    // Normalize by views to get engagement rate (prevents viral snowballing)
    const engagementRate = views > 10 ? rawEngagement / Math.log10(views) : rawEngagement;

    // Apply time decay
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    const decay = calculateDecay(postAge, config.engagementHalfLifeHours);

    return engagementRate * decay;
}

/**
 * Calculate recency score (newer = higher)
 */
export function calculateRecencyScore(post: PostType, config: FeedConfig = DEFAULT_CONFIG): number {
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    return calculateDecay(postAge, config.recencyHalfLifeHours);
}

/**
 * Calculate author affinity score based on interaction history
 */
export function calculateAffinityScore(
    post: PostType,
    interactions: UserInteractions
): number {
    const authorId = post.author.id;
    let score = 0;

    // Strong signal: User follows author
    if (interactions.followedUsers.includes(authorId)) {
        score += 1.0;
    }

    // Track historical engagement with this author
    if (interactions.authorEngagements?.[authorId]) {
        score += Math.min(interactions.authorEngagements[authorId] * 0.2, 1.0);
    }

    // Boost for posts user has engaged with
    if (interactions.likedPosts.includes(post.id)) score += 0.3;
    if (interactions.savedPosts.includes(post.id)) score += 0.5;
    if (interactions.commentedPosts.includes(post.id)) score += 0.6;

    return Math.min(score, 3.0); // Cap at 3.0
}

/**
 * Calculate content quality signals
 */
export function calculateQualityScore(post: PostType): number {
    let score = 1.0;

    // Boost for media content
    if (post.media && post.media.length > 0) {
        score += 0.3;
    }

    // Boost for polls (interactive content)
    if (post.poll) {
        score += 0.4;
    }

    // Boost for verified authors
    if (post.author.verified) {
        score += 0.2;
    }

    // Slight penalty for very short content
    if (post.content.length < 20) {
        score -= 0.2;
    }

    // Boost for longer, substantive content
    if (post.content.length > 200) {
        score += 0.15;
    }

    return Math.max(score, 0.1);
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Check if a post should be filtered out
 */
export function shouldFilterPost(
    post: PostType,
    interactions: UserInteractions
): boolean {
    // Filter blocked users
    if (interactions.blockedUsers.includes(post.author.id)) {
        return true;
    }

    // Filter muted users
    if (interactions.mutedUsers.includes(post.author.id)) {
        return true;
    }

    // Filter muted words
    if (interactions.mutedWords.length > 0) {
        const contentLower = post.content.toLowerCase();
        const hasMutedWord = interactions.mutedWords.some(word =>
            contentLower.includes(word.toLowerCase())
        );
        if (hasMutedWord) return true;
    }

    return false;
}

// ============================================================================
// SCORING & RANKING
// ============================================================================

/**
 * Calculate composite post score
 */
export function calculatePostScore(
    post: PostType,
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): number {
    // Filter out hidden posts
    if (shouldFilterPost(post, interactions)) {
        return -Infinity;
    }

    const engagementScore = calculateEngagementScore(post, config);
    const recencyScore = calculateRecencyScore(post, config);
    const affinityScore = calculateAffinityScore(post, interactions);
    const qualityScore = calculateQualityScore(post);

    // Weighted combination
    const compositeScore =
        (engagementScore * config.engagementWeight) +
        (recencyScore * config.recencyWeight) +
        (affinityScore * config.affinityWeight) +
        (qualityScore * 0.1); // Quality is a multiplier boost

    // Following bonus applied on top
    const followingBonus = interactions.followedUsers.includes(post.author.id)
        ? config.followingWeight
        : 0;

    return compositeScore + followingBonus;
}

/**
 * Rank posts by score (descending)
 */
export function rankPosts(
    posts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): PostType[] {
    return posts
        .map(post => ({
            post,
            score: calculatePostScore(post, interactions, config)
        }))
        .filter(item => item.score > -Infinity)
        .sort((a, b) => b.score - a.score)
        .map(item => item.post);
}

// ============================================================================
// FEED GENERATION
// ============================================================================

/**
 * Generate "For You" feed - personalized mix of following + recommended
 */
export function generateForYouFeed(
    allPosts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): PostType[] {
    const followingPosts = allPosts.filter(p =>
        interactions.followedUsers.includes(p.author.id) && !shouldFilterPost(p, interactions)
    );
    const recommendedPosts = allPosts.filter(p =>
        !interactions.followedUsers.includes(p.author.id) && !shouldFilterPost(p, interactions)
    );

    // Rank each group
    const rankedFollowing = rankPosts(followingPosts, interactions, config);
    const rankedRecommended = rankPosts(recommendedPosts, interactions, config);

    // Interleave: primarily following with some recommendations sprinkled in
    const result: PostType[] = [];
    let fIdx = 0, rIdx = 0;
    const recFrequency = Math.floor(1 / config.recommendationRatio);

    while (fIdx < rankedFollowing.length || rIdx < rankedRecommended.length) {
        // Add following posts
        for (let i = 0; i < recFrequency - 1 && fIdx < rankedFollowing.length; i++) {
            result.push(rankedFollowing[fIdx++]);
        }
        // Add one recommended post
        if (rIdx < rankedRecommended.length) {
            result.push(rankedRecommended[rIdx++]);
        }
        // Continue with following if recommendations exhausted
        if (rIdx >= rankedRecommended.length && fIdx < rankedFollowing.length) {
            result.push(rankedFollowing[fIdx++]);
        }
    }

    return diversifyFeed(result);
}

/**
 * Generate "Following" feed - only posts from followed users
 */
export function generateFollowingFeed(
    allPosts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): PostType[] {
    const followingPosts = allPosts.filter(p =>
        interactions.followedUsers.includes(p.author.id) && !shouldFilterPost(p, interactions)
    );
    return rankPosts(followingPosts, interactions, config);
}

/**
 * Generate "Latest" feed - chronological order
 */
export function generateLatestFeed(
    allPosts: PostType[],
    interactions: UserInteractions
): PostType[] {
    return allPosts
        .filter(p => !shouldFilterPost(p, interactions))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================================
// FEED ENHANCEMENT
// ============================================================================

/**
 * Diversify feed to prevent consecutive posts from same author
 */
export function diversifyFeed(
    posts: PostType[],
    maxConsecutive: number = 2
): PostType[] {
    const result: PostType[] = [];
    const deferred: PostType[] = [];
    const recentAuthors: string[] = [];

    for (const post of posts) {
        const authorId = post.author.id;
        const consecutiveCount = recentAuthors.filter(id => id === authorId).length;

        if (consecutiveCount < maxConsecutive) {
            result.push(post);
            recentAuthors.push(authorId);
            if (recentAuthors.length > maxConsecutive * 2) {
                recentAuthors.shift();
            }
        } else {
            deferred.push(post);
        }
    }

    // Append deferred posts at the end
    return [...result, ...deferred];
}

/**
 * Inject promoted posts at intervals
 */
export function injectPromotedPosts(
    feed: PostType[],
    promotedPosts: PostType[],
    interval: number
): PostType[] {
    if (promotedPosts.length === 0 || interval <= 0) return feed;

    const result: PostType[] = [];
    let promoIdx = 0;

    for (let i = 0; i < feed.length; i++) {
        result.push(feed[i]);
        if ((i + 1) % interval === 0 && promoIdx < promotedPosts.length) {
            result.push(promotedPosts[promoIdx++]);
        }
    }

    return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get posts newer than a given time
 */
export function getNewPostsSince(posts: PostType[], sinceTime: string): PostType[] {
    const sinceTs = new Date(sinceTime).getTime();
    return posts.filter(p => new Date(p.createdAt).getTime() > sinceTs);
}

/**
 * Update last seen time
 */
export function updateLastSeenTime(interactions: UserInteractions): UserInteractions {
    return { ...interactions, lastSeenPostTime: new Date().toISOString() };
}

/**
 * Track post view
 */
export function trackPostView(interactions: UserInteractions, postId: string): UserInteractions {
    return {
        ...interactions,
        viewedPosts: [...new Set([...interactions.viewedPosts, postId])]
    };
}

/**
 * Update author affinity when user engages with a post
 */
export function updateAuthorAffinity(
    interactions: UserInteractions,
    authorId: string,
    engagementWeight: number = 1
): UserInteractions {
    const currentAffinity = interactions.authorEngagements || {};
    return {
        ...interactions,
        authorEngagements: {
            ...currentAffinity,
            [authorId]: (currentAffinity[authorId] || 0) + engagementWeight
        }
    };
}

/**
 * Get trending posts (highest engagement in 24h)
 */
export function getTrendingPosts(posts: PostType[], limit: number = 10): PostType[] {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return posts
        .filter(p => new Date(p.createdAt).getTime() > oneDayAgo)
        .sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a))
        .slice(0, limit);
}

// ============================================================================
// MAIN FEED GENERATOR
// ============================================================================

/**
 * Main entry point for generating any feed type
 */
export function generateFeed(
    allPosts: PostType[],
    interactions: UserInteractions,
    feedType: FeedType = 'for_you',
    config: FeedConfig = DEFAULT_CONFIG
): {
    feed: PostType[];
    hasNewPosts: boolean;
    newPostsCount: number;
} {
    const isMonetizationEnabled = process.env.NEXT_PUBLIC_ENABLE_MONETIZATION === 'true';

    // Separate promoted posts
    const promotedPosts = isMonetizationEnabled ? allPosts.filter(p => p.isPromoted) : [];
    const regularPosts = allPosts.filter(p => !p.isPromoted);

    // Generate feed based on type
    let feed: PostType[];
    switch (feedType) {
        case 'following':
            feed = generateFollowingFeed(regularPosts, interactions, config);
            break;
        case 'latest':
            feed = generateLatestFeed(regularPosts, interactions);
            break;
        case 'for_you':
        default:
            feed = generateForYouFeed(regularPosts, interactions, config);
            break;
    }

    // Inject promoted posts if enabled
    if (isMonetizationEnabled && promotedPosts.length > 0) {
        feed = injectPromotedPosts(feed, promotedPosts, config.promotedPostInterval);
    }

    // Check for new posts
    const newPosts = getNewPostsSince(allPosts, interactions.lastSeenPostTime);

    return {
        feed,
        hasNewPosts: newPosts.length > 0,
        newPostsCount: newPosts.length
    };
}

// Legacy export for backward compatibility
export const generateSmartFeed = (
    allPosts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
) => {
    const result = generateFeed(allPosts, interactions, 'for_you', config);
    return {
        ...result,
        isCaughtUp: !result.hasNewPosts
    };
};