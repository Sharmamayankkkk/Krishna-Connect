/**
 * @file Type definitions for the app
 */

export type UserType = {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
    verified?: 'none' | 'verified' | 'kcs';
    followersCount?: number;
    followingCount?: number;
};

export type ReplyType = {
    id: string;
    user: UserType;
    text: string;
    isPinned: boolean;
    likes: number;
    isHidden: boolean;
    createdAt: string;
    editedAt?: string;
    likedBy: string[];
};

export type CommentType = {
    [x: string]: any;
    id: string;
    user: UserType;
    text: string;
    isPinned: boolean;
    likes: number;
    isHidden: boolean;
    replies: ReplyType[];
    createdAt: string;
    editedAt?: string;
    likedBy: string[];
};

export type MediaType = {
    type: 'image' | 'video' | 'gif';
    url: string;
    alt?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    file?: File;
};

export type PollOptionType = {
    id: string;
    text: string;
    votes: number;
    votedBy: string[];
};

export type PollType = {
    id: string;
    question: string;
    options: PollOptionType[];
    totalVotes: number;
    endsAt: string;
    allowMultipleChoices: boolean;
};

export type CollaborationRequest = {
    userId: string;
    status: 'pending' | 'accepted' | 'declined';
};

export type PostAnalyticsType = {
    impressions: number;
    reach: number;
    engagementRate: number;
    profileVisits: number;
    followerGrowth: number;
    demographics: {
        topLocations: { location: string; percentage: number }[];
        ageRange: { range: string; percentage: number }[];
        gender: { male: number; female: number; other: number };
    };
    trafficSources: { source: string; percentage: number }[];
    engagementByType: {
        likes: number;
        comments: number;
        reposts: number;
        bookmarks: number;
    };
    viewsOverTime: { date: string; views: number }[];
};

// PostType moved to '@/lib/types'

export type NotificationType = {
    id: string;
    type: 'like' | 'comment' | 'repost' | 'quote' | 'follow' | 'mention' | 'poll_vote' | 'collaboration_request';
    fromUser: UserType;
    postId?: string;
    commentId?: string;
    text?: string;
    createdAt: string;
    read: boolean;
    status?: 'pending' | 'accepted' | 'declined';
    postContent?: string;
    postMediaType?: 'image' | 'video' | 'gif';
};

export type TrendingTopic = {
    id: string;
    hashtag: string;
    postsCount: number;
    category?: string;
};

export type DraftPost = {
    id: string;
    content: string;
    media: MediaType[];
    poll?: PollType;
    createdAt: string;
    updatedAt: string;
};

// Utility Functions

export const generateId = (prefix: 'post' | 'comment' | 'reply' | 'poll' | 'notif' | 'draft'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createEmptyPoll = (question: string, options: string[], endsInHours: number = 24): PollType => {
    return {
        id: generateId('poll'),
        question,
        options: options.map((text, index) => ({
            id: `opt_${Date.now()}_${index}`,
            text,
            votes: 0,
            votedBy: []
        })),
        totalVotes: 0,
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * endsInHours).toISOString(),
        allowMultipleChoices: false
    };
};

export const createDraft = (content: string, media: MediaType[] = []): DraftPost => {
    return {
        id: generateId('draft'),
        content,
        media,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};
