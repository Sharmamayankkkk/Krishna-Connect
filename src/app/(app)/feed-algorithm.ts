/**
 * @file Smart Feed Algorithm for Social Media Feed
 * Handles personalized feed ranking, recommendations, and feed management
 */

import { PostType } from './types';

// User interaction history tracking
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
}

// Feed configuration
export interface FeedConfig {
    followingWeight: number;      // Weight for posts from followed users
    engagementWeight: number;      // Weight for engagement metrics
    recencyWeight: number;         // Weight for post recency
    diversityFactor: number;       // Factor for content diversity
    recommendationRatio: number;   // Ratio of recommended vs following posts
    promotedPostInterval?: number; // How often to inject a promoted post
}

// Default feed configuration (like Instagram/Facebook)
const DEFAULT_CONFIG: FeedConfig = {
    followingWeight: 0.4,
    engagementWeight: 0.35,
    recencyWeight: 0.25,
    diversityFactor: 0.3,
    recommendationRatio: 0.3, // 30% recommended, 70% following
    promotedPostInterval: 5,  // Inject a promoted post every 5 organic posts
};

/**
 * Calculate engagement score for a post
 */
export function calculateEngagementScore(post: PostType): number {
    const { likes, comments, reshares, views } = post.stats;
    
    // Weighted engagement score
    const engagementScore = (
        likes * 1.0 +
        comments * 2.0 +  // Comments are more valuable
        reshares * 1.5 +
        (views > 0 ? Math.log10(views) : 0)
    );
    
    // Normalize by time (decay factor)
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    const hoursSincePost = postAge / (1000 * 60 * 60);
    const decayFactor = Math.exp(-hoursSincePost / 24); // Half-life of 24 hours
    
    return engagementScore * decayFactor;
}

/**
 * Calculate recency score for a post
 */
export function calculateRecencyScore(post: PostType): number {
    const postAge = Date.now() - new Date(post.createdAt).getTime();
    const hoursSincePost = postAge / (1000 * 60 * 60);
    
    // Exponential decay: newer posts get higher scores
    return Math.exp(-hoursSincePost / 12); // Half-life of 12 hours
}

/**
 * Calculate personalization score based on user interactions
 */
export function calculatePersonalizationScore(
    post: PostType,
    interactions: UserInteractions
): number {
    let score = 0;
    
    // Following bonus
    if (interactions.followedUsers.includes(post.author.id)) {
        score += 2.0;
    }
    
    // Interaction history with author
    const authorInteractions = [
        ...interactions.likedPosts,
        ...interactions.commentedPosts,
        ...interactions.savedPosts
    ].filter(id => {
        // Check if any previous interaction was with this author
        // In a real app, you'd have a post-to-author mapping
        return true; // Simplified for now
    }).length;
    
    score += Math.min(authorInteractions * 0.1, 1.0);
    
    // Content preference (if user liked/saved/commented on similar posts)
    const hasLiked = interactions.likedPosts.includes(post.id);
    const hasSaved = interactions.savedPosts.includes(post.id);
    const hasCommented = interactions.commentedPosts.includes(post.id);
    
    if (hasLiked) score += 0.5;
    if (hasSaved) score += 0.7;
    if (hasCommented) score += 0.8;
    
    return score;
}

/**
 * Check if post should be filtered out
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
    const contentLower = post.content.toLowerCase();
    const hasMutedWord = interactions.mutedWords.some(word => 
        contentLower.includes(word.toLowerCase())
    );
    
    if (hasMutedWord) {
        return true;
    }
    
    return false;
}

/**
 * Calculate overall post score
 */
export function calculatePostScore(
    post: PostType,
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): number {
    // Filter out posts that should be hidden
    if (shouldFilterPost(post, interactions)) {
        return -1;
    }
    
    const engagementScore = calculateEngagementScore(post);
    const recencyScore = calculateRecencyScore(post);
    const personalizationScore = calculatePersonalizationScore(post, interactions);
    
    // Weighted combination
    const finalScore = (
        engagementScore * config.engagementWeight +
        recencyScore * config.recencyWeight +
        personalizationScore * config.followingWeight
    );
    
    return finalScore;
}

/**
 * Rank posts for the feed
 */
export function rankPosts(
    posts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): PostType[] {
    // Calculate scores for all posts
    const scoredPosts = posts
        .map(post => ({
            post,
            score: calculatePostScore(post, interactions, config)
        }))
        .filter(item => item.score >= 0); // Remove filtered posts
    
    // Sort by score (descending)
    scoredPosts.sort((a, b) => b.score - a.score);
    
    return scoredPosts.map(item => item.post);
}

/**
 * Separate posts into following and recommended
 */
export function separatePostsByType(
    posts: PostType[],
    interactions: UserInteractions
): { following: PostType[]; recommended: PostType[] } {
    const following: PostType[] = [];
    const recommended: PostType[] = [];
    
    posts.forEach(post => {
        if (interactions.followedUsers.includes(post.author.id)) {
            following.push(post);
        } else {
            recommended.push(post);
        }
    });
    
    return { following, recommended };
}

/**
 * Mix following and recommended posts
 */
export function mixPosts(
    following: PostType[],
    recommended: PostType[],
    ratio: number = 0.3 // 30% recommended
): PostType[] {
    const mixed: PostType[] = [];
    let followingIndex = 0;
    let recommendedIndex = 0;
    
    // Interleave posts based on ratio
    while (followingIndex < following.length || recommendedIndex < recommended.length) {
        // Add following posts
        const followingCount = Math.ceil((1 - ratio) * 10);
        for (let i = 0; i < followingCount && followingIndex < following.length; i++) {
            mixed.push(following[followingIndex++]);
        }
        
        // Add recommended posts
        const recommendedCount = Math.ceil(ratio * 10);
        for (let i = 0; i < recommendedCount && recommendedIndex < recommended.length; i++) {
            mixed.push(recommended[recommendedIndex++]);
        }
    }
    
    return mixed;
}

/**
 * Check if user has caught up with new posts
 */
export function hasUserCaughtUp(
    posts: PostType[],
    interactions: UserInteractions
): boolean {
    if (posts.length === 0) return true;
    
    const lastSeenTime = new Date(interactions.lastSeenPostTime).getTime();
    const newestPostTime = Math.max(
        ...posts.map(p => new Date(p.createdAt).getTime())
    );
    
    // User is caught up if they've seen all posts newer than the last check
    return lastSeenTime >= newestPostTime;
}

/**
 * Get new posts since last check
 */
export function getNewPostsSince(
    posts: PostType[],
    lastSeenTime: string
): PostType[] {
    const lastSeenTimestamp = new Date(lastSeenTime).getTime();
    
    return posts.filter(post => {
        const postTimestamp = new Date(post.createdAt).getTime();
        return postTimestamp > lastSeenTimestamp;
    });
}

/**
 * Get posts older than a certain time (for "show older posts")
 */
export function getOlderPosts(
    posts: PostType[],
    beforeTime: string,
    limit: number = 10
): PostType[] {
    const beforeTimestamp = new Date(beforeTime).getTime();
    
    return posts
        .filter(post => new Date(post.createdAt).getTime() < beforeTimestamp)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
}

/**
 * Generate personalized feed
 */
export function generatePersonalizedFeed(
    allPosts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): PostType[] {
    // Separate by type
    const { following, recommended } = separatePostsByType(allPosts, interactions);
    
    // Rank each group
    const rankedFollowing = rankPosts(following, interactions, config);
    const rankedRecommended = rankPosts(recommended, interactions, config);
    
    // Mix them together
    const mixedFeed = mixPosts(
        rankedFollowing,
        rankedRecommended,
        config.recommendationRatio
    );
    
    return mixedFeed;
}

/**
 * Diversify feed (prevent too many posts from same author)
 */
export function diversifyFeed(
    posts: PostType[],
    maxConsecutiveFromSameAuthor: number = 2
): PostType[] {
    const diversified: PostType[] = [];
    const authorConsecutiveCount: { [authorId: string]: number } = {};
    
    for (const post of posts) {
        const authorId = post.author.id;
        const consecutiveCount = authorConsecutiveCount[authorId] || 0;
        
        if (consecutiveCount < maxConsecutiveFromSameAuthor) {
            diversified.push(post);
            authorConsecutiveCount[authorId] = consecutiveCount + 1;
            
            // Reset other authors' counts
            Object.keys(authorConsecutiveCount).forEach(id => {
                if (id !== authorId) {
                    authorConsecutiveCount[id] = 0;
                }
            });
        } else {
            // Skip this post for now, will be added later
            // In a real app, you'd implement a more sophisticated approach
        }
    }
    
    return diversified;
}

/**
 * Inject promoted posts into the feed at a specified interval.
 */
function injectPromotedPosts(feed: PostType[], promotedPosts: PostType[], interval: number): PostType[] {
    if (promotedPosts.length === 0 || interval <= 0) {
        return feed;
    }

    const finalFeed: PostType[] = [];
    let promotedIndex = 0;

    for (let i = 0; i < feed.length; i++) {
        finalFeed.push(feed[i]);
        // After every `interval` posts, inject a promoted post
        if ((i + 1) % interval === 0 && promotedIndex < promotedPosts.length) {
            finalFeed.push(promotedPosts[promotedIndex]);
            promotedIndex++;
        }
    }

    // Add any remaining promoted posts to the end
    while (promotedIndex < promotedPosts.length) {
        finalFeed.push(promotedPosts[promotedIndex]);
        promotedIndex++;
    }

    return finalFeed;
}

/**
 * Track post view
 */
export function trackPostView(
    interactions: UserInteractions,
    postId: string
): UserInteractions {
    return {
        ...interactions,
        viewedPosts: [...new Set([...interactions.viewedPosts, postId])]
    };
}

/**
 * Update last seen time
 */
export function updateLastSeenTime(
    interactions: UserInteractions
): UserInteractions {
    return {
        ...interactions,
        lastSeenPostTime: new Date().toISOString()
    };
}

/**
 * Main feed generation function
 */
export function generateSmartFeed(
    allPosts: PostType[],
    interactions: UserInteractions,
    config: FeedConfig = DEFAULT_CONFIG
): {
    feed: PostType[];
    hasNewPosts: boolean;
    isCaughtUp: boolean;
    newPostsCount: number;
} {
    const isMonetizationEnabled = process.env.NEXT_PUBLIC_ENABLE_MONETIZATION === 'true';

    // Separate promoted from regular posts
    const promotedPosts = isMonetizationEnabled ? allPosts.filter(p => p.isPromoted) : [];
    const regularPosts = allPosts.filter(p => !p.isPromoted);

    // Generate personalized feed from regular posts
    const personalizedFeed = generatePersonalizedFeed(regularPosts, interactions, config);
    
    // Diversify to prevent spam
    const diversifiedFeed = diversifyFeed(personalizedFeed);

    // Inject promoted posts if enabled
    const finalFeed = isMonetizationEnabled 
        ? injectPromotedPosts(diversifiedFeed, promotedPosts, config.promotedPostInterval || 5)
        : diversifiedFeed;
    
    // Check for new posts (based on all original posts)
    const newPosts = getNewPostsSince(allPosts, interactions.lastSeenPostTime);
    const hasNewPosts = newPosts.length > 0;
    
    // Check if caught up (based on the generated feed)
    const isCaughtUp = hasUserCaughtUp(diversifiedFeed, interactions);
    
    return {
        feed: finalFeed,
        hasNewPosts,
        isCaughtUp,
        newPostsCount: newPosts.length
    };
}

/**
 * Get trending posts (most engagement in last 24 hours)
 */
export function getTrendingPosts(
    posts: PostType[],
    limit: number = 10
): PostType[] {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    return posts
        .filter(post => new Date(post.createdAt).getTime() > oneDayAgo)
        .sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a))
        .slice(0, limit);
}

/**
 * Get recommended users based on interactions
 */
export function getRecommendedUsers(
    allPosts: PostType[],
    interactions: UserInteractions,
    limit: number = 5
): string[] {
    // Count interactions by author
    const authorInteractionCount: { [authorId: string]: number } = {};
    
    interactions.likedPosts.forEach(postId => {
        const post = allPosts.find(p => p.id === postId);
        if (post && !interactions.followedUsers.includes(post.author.id)) {
            authorInteractionCount[post.author.id] = (authorInteractionCount[post.author.id] || 0) + 1;
        }
    });
    
    // Sort by interaction count
    const recommended = Object.entries(authorInteractionCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([authorId]) => authorId);
    
    return recommended;
}