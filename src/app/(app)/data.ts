/**
 * @file Enhanced data structure with polls, GIFs, notifications, and relationships
 */

// SECTION: Type Definitions

export type UserType = {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
    verified?: boolean;
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
    },
    viewsOverTime: { date: string; views: number }[];
};

export type PostType = {
    id: string;
    author: UserType;
    createdAt: string;
    content: string;
    media: MediaType[];
    poll?: PollType;
    stats: {
        comments: number;
        reshares: number;
        reposts: number;
        likes: number;
        views: number;
        bookmarks: number;
    };
    comments: CommentType[];
    originalPost: Omit<PostType, 'originalPost' | 'comments' | 'stats' | 'poll'> | null;
    editedAt?: string;
    likedBy: string[];
    savedBy: string[];
    repostedBy: string[];
    isPinned?: boolean;
    isRepost?: boolean;
    repostOf?: string;
    isPromoted?: boolean;
    collaborators?: UserType[];
    pendingCollaborators?: CollaborationRequest[];
    analytics?: PostAnalyticsType;
};

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
};

export type UserRelationship = {
    userId: string;
    following: string[];
    followers: string[];
    blockedUsers: string[];
    mutedUsers: string[];
};

export type BookmarkCollection = {
    id: string;
    name: string;
    postIds: string[];
    createdAt: string;
    isPrivate: boolean;
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

// SECTION: Raw Data

const users: UserType[] = [
    { id: "user_1", name: "Advaita Das", username: "advaitadas", avatar: "/user_Avatar/male.png", bio: "Spiritual seeker 🙏", verified: true, followersCount: 1234, followingCount: 456 },
    { id: "user_2", name: "KCS", username: "KCS", avatar: "/logo/light_KCS.svg", bio: "Devotee of Krishna 💙", verified: true, followersCount: 2456, followingCount: 234 },
    { id: "user_3", name: "Chaitanya Charan", username: "ccharan", avatar: "/user_Avatar/male.png", bio: "Author & Speaker 📚", verified: true, followersCount: 5678, followingCount: 123 },
    { id: "user_4", name: "Damodar Pandit", username: "damodarp", avatar: "/user_Avatar/male.png", bio: "Temple volunteer 🛕", followersCount: 567, followingCount: 890 },
    { id: "user_5", name: "Gita Govinda", username: "gitagovinda", avatar: "/user_Avatar/female.png", bio: "Bhakti yoga practitioner 🧘‍♀️", followersCount: 890, followingCount: 345 },
    { id: "user_6", name: "Hari Prasad", username: "hariprasad", avatar: "/user_Avatar/male.png", bio: "Chef & Food lover 🍲", followersCount: 1111, followingCount: 678 },
    { id: "user_7", name: "Indulekha Devi Dasi", username: "indulekha", avatar: "/user_Avatar/female.png", bio: "Artist & Designer 🎨", followersCount: 2222, followingCount: 456 },
    { id: "user_8", name: "Jagannath Swami", username: "jswami", avatar: "/user_Avatar/male.png", bio: "Spiritual guide 🕉️", verified: true, followersCount: 8901, followingCount: 89 },
    { id: "user_9", name: "Krishna Priya", username: "kpriya", avatar: "/user_Avatar/female.png", bio: "Musician 🎵", followersCount: 3456, followingCount: 567 },
    { id: "user_10", name: "An Extremely Long User Name To Test Overflow And Truncation", username: "longusernamefortesting", avatar: "/user_Avatar/male.png", bio: "Testing edge cases", followersCount: 12, followingCount: 34 }
];

// Sample GIFs
const sampleGifs: MediaType[] = [
    { type: 'gif', url: '/DummyData/krishna_dance.gif', alt: 'Krishna dancing', width: 480, height: 360 },
    { type: 'gif', url: '/DummyData/om_animation.gif', alt: 'Om symbol animation', width: 400, height: 400 },
    { type: 'gif', url: '/DummyData/celebration.gif', alt: 'Celebration', width: 500, height: 280 },
];

// Sample Polls
const samplePolls: PollType[] = [
    {
        id: 'poll_1',
        question: 'What time do you prefer for morning Japa?',
        options: [
            { id: 'opt_1', text: '4:00 AM - 5:00 AM', votes: 145, votedBy: ['user_1', 'user_3', 'user_8'] },
            { id: 'opt_2', text: '5:00 AM - 6:00 AM', votes: 234, votedBy: ['user_2', 'user_4', 'user_5'] },
            { id: 'opt_3', text: '6:00 AM - 7:00 AM', votes: 89, votedBy: ['user_6'] },
            { id: 'opt_4', text: 'Later in the day', votes: 56, votedBy: ['user_7', 'user_9'] },
        ],
        totalVotes: 524,
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        allowMultipleChoices: false
    },
    {
        id: 'poll_2',
        question: 'Which spiritual books have you read? (Select all)',
        options: [
            { id: 'opt_5', text: 'Bhagavad Gita', votes: 456, votedBy: ['user_1', 'user_2', 'user_3', 'user_8'] },
            { id: 'opt_6', text: 'Srimad Bhagavatam', votes: 234, votedBy: ['user_1', 'user_3'] },
            { id: 'opt_7', text: 'Ramayana', votes: 345, votedBy: ['user_2', 'user_5', 'user_8'] },
            { id: 'opt_8', text: 'Mahabharata', votes: 289, votedBy: ['user_3', 'user_4'] },
        ],
        totalVotes: 1324,
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        allowMultipleChoices: true
    }
];

const captions = [
    "Just wrapped up a session on the Bhagavad Gita. The wisdom is truly timeless. 🙏 #SpiritualJourney #Wisdom",
    "Early morning Japa is the best way to start the day. The holy names bring so much peace. Hare Krishna!",
    "The temple was so beautiful today! The atmosphere was divine. ✨ Check out the photos! #TempleLife",
    "Reading from the Srimad Bhagavatam. Every verse is a revelation. Highly recommend it to everyone @bhaktidevi!",
    "Preparing for the evening Aarti. 🪔 The lamps, the flowers, the incense... everything for the Lord's pleasure.",
    "Spent the day cooking for the Sunday feast. There's no greater joy than service (Seva). #SelflessService",
    "Nature is the art of God. A quiet walk helps me connect with the divine. 🌳 #DivineCreation",
    "Deep dive into the science of the soul. It's fascinating! Anyone read 'Journey of Self Discovery'?'",
    "Chanting the holy names cleanses the heart. It's a transformative practice. Hare Krishna! Hare Krishna!",
    "So much gratitude for my spiritual master, who guides me with the light of knowledge. #GuruGrace",
    "Short and sweet!",
    "This is a very long post designed to test text wrapping, truncation, and the 'read more' functionality. It needs to handle multiple paragraphs and line breaks gracefully without breaking the layout of the card. Let's see how it holds up across different screen sizes, from mobile to desktop. The quick brown fox jumps over the lazy dog. ".repeat(5),
    "🕉️ ✨ 🙏 🪔 🌺 🎵 📿 🌸 💫 ⭐",
    "",
    "Testing special characters: <script>alert('xss')</script> & \"'|@#$^&*()[]{};:,.?!~`",
    "This post\n\nhas\n\nmultiple\n\nline breaks.",
    "Check out this cool website: https://www.example.com and follow @advaitadas for more updates!",
    "Just a simple post with a single image.",
    "Here are two pictures from our trip to Vrindavan!",
    "Three is a magic number! #VrindavanDiaries",
    "A full grid of four images from the festival.",
    "We took so many pictures! Here are five of the best ones.",
    "A mix of video and photos from today's kirtan.",
    "What a beautiful quote post by @ccharan. Adding my thoughts here.",
    "This is a comment thread test post. Please interact!",
    "A post from a long, long time ago.",
    "Just posted this a few seconds ago!",
    "This post has a hidden comment from the author.",
    "Let's see how a pinned comment looks. It should always stay at the top!",
    "This post has a comment with multiple replies, creating a nested thread.",
    "A post with zero engagement to test how the UI looks with no stats.",
    "This post has gone viral! Testing with very large numbers.",
    "Testing Devanagari script: नमस्ते! हरे कृष्ण। यह एक परीक्षण पोस्ट है। #हिन्दी",
    "What's your favorite time for morning prayers? Vote in the poll! 🗳️",
    "Check out this amazing GIF! 🎉",
];

// SECTION: Generate Mock Analytics

const generateMockAnalytics = (post: PostType): PostAnalyticsType => {
    const impressions = post.stats.views * (Math.random() * (1.5 - 1.1) + 1.1);
    const reach = impressions * (Math.random() * (0.9 - 0.7) + 0.7);
    const totalEngagements = post.stats.likes + post.stats.comments + post.stats.reposts + post.stats.bookmarks;
    const engagementRate = reach > 0 ? (totalEngagements / reach) * 100 : 0;

    const viewsOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(post.createdAt);
        date.setDate(date.getDate() + i);
        return {
            date: date.toISOString().split('T')[0],
            views: Math.floor(post.stats.views / 7 * (Math.random() * 1.2) + (i * 10))
        };
    });

    return {
        impressions: Math.floor(impressions),
        reach: Math.floor(reach),
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        profileVisits: Math.floor(totalEngagements * (Math.random() * (0.5 - 0.1) + 0.1)),
        followerGrowth: Math.floor(totalEngagements * (Math.random() * (0.1 - 0.01) + 0.01)),
        demographics: {
            topLocations: [
                { location: 'USA', percentage: 40 },
                { location: 'India', percentage: 25 },
                { location: 'UK', percentage: 10 },
            ],
            ageRange: [
                { range: '18-24', percentage: 35 },
                { range: '25-34', percentage: 45 },
                { range: '35-44', percentage: 20 },
            ],
            gender: {
                male: 55,
                female: 43,
                other: 2,
            },
        },
        trafficSources: [
            { source: 'For You Page', percentage: 60 },
            { source: 'Follower Feed', percentage: 25 },
            { source: 'Hashtag Search', percentage: 10 },
            { source: 'Profile', percentage: 5 },
        ],
        engagementByType: {
            likes: post.stats.likes,
            comments: post.stats.comments,
            reposts: post.stats.reposts + post.stats.reshares,
            bookmarks: post.stats.bookmarks,
        },
        viewsOverTime,
    };
};

// SECTION: Post Generation

const basePostForQuoting: PostType = {
    id: "post_base_quote",
    author: users[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    content: "The essence of spiritual life is to remember Krishna and never forget Him. This simple principle can guide all our actions.",
    media: [{ type: 'image', url: '/DummyData/10.png', alt: 'Spiritual quote' }],
    stats: { comments: 15, reshares: 45, reposts: 23, likes: 520, views: 12000, bookmarks: 89 },
    comments: [],
    originalPost: null,
    likedBy: ['user_1', 'user_2', 'user_4', 'user_6'],
    savedBy: ['user_1', 'user_5'],
    repostedBy: ['user_2', 'user_7'],
};

// Sample comments for testing
const sampleComments: CommentType[] = [
    {
        id: 'comment_1',
        user: users[1],
        text: 'This is so inspiring! Thank you for sharing.',
        isPinned: false,
        likes: 12,
        isHidden: false,
        replies: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        likedBy: ['user_3', 'user_4']
    },
    {
        id: 'comment_2',
        user: users[3],
        text: 'Beautiful post! Hare Krishna!',
        isPinned: true,
        likes: 25,
        isHidden: false,
        replies: [
            {
                id: 'reply_1',
                user: users[0],
                text: 'Thank you! Hare Krishna!',
                isPinned: false,
                likes: 5,
                isHidden: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
                likedBy: ['user_3']
            }
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        likedBy: ['user_1', 'user_2', 'user_5']
    }
];

// Create base posts array
const basePosts: PostType[] = [
    {
        id: 'post_1',
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        content: captions[0],
        media: [{ type: 'image', url: '/DummyData/1.png', alt: 'Bhagavad Gita session' }],
        stats: { comments: 45, reshares: 12, reposts: 8, likes: 234, views: 5600, bookmarks: 34 },
        comments: sampleComments,
        originalPost: null,
        likedBy: ['user_2', 'user_3', 'user_5'],
        savedBy: ['user_2'],
        repostedBy: ['user_3'],
    },
    {
        id: 'post_2',
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        content: captions[1],
        media: [],
        stats: { comments: 23, reshares: 5, reposts: 3, likes: 156, views: 3200, bookmarks: 12 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_4'],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_3',
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        content: captions[2],
        media: [
            { type: 'image', url: '/DummyData/2.png', alt: 'Temple view 1' },
            { type: 'image', url: '/DummyData/3.png', alt: 'Temple view 2' }
        ],
        stats: { comments: 67, reshares: 23, reposts: 15, likes: 489, views: 8900, bookmarks: 56 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_3', 'user_6', 'user_8'],
        savedBy: ['user_1', 'user_3'],
        repostedBy: ['user_6'],
    },
    {
        id: 'post_4',
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        content: captions[3],
        media: [],
        stats: { comments: 34, reshares: 8, reposts: 5, likes: 178, views: 4100, bookmarks: 23 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2', 'user_5'],
        savedBy: ['user_5'],
        repostedBy: [],
    },
    {
        id: 'post_5',
        author: users[4],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
        content: captions[4],
        media: [{ type: 'image', url: '/DummyData/4.png', alt: 'Evening Aarti preparation' }],
        stats: { comments: 29, reshares: 6, reposts: 4, likes: 203, views: 4800, bookmarks: 18 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_6', 'user_7'],
        savedBy: ['user_6'],
        repostedBy: [],
    },
    {
        id: 'post_6',
        author: users[5],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        content: captions[5],
        media: [
            { type: 'image', url: '/DummyData/5.png', alt: 'Feast preparation 1' },
            { type: 'image', url: '/DummyData/6.png', alt: 'Feast preparation 2' },
            { type: 'image', url: '/DummyData/7.png', alt: 'Feast preparation 3' }
        ],
        stats: { comments: 56, reshares: 18, reposts: 11, likes: 345, views: 6700, bookmarks: 45 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2', 'user_4', 'user_7', 'user_9'],
        savedBy: ['user_2', 'user_7'],
        repostedBy: ['user_4'],
    },
    {
        id: 'post_7',
        author: users[6],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        content: captions[6],
        media: [{ type: 'image', url: '/DummyData/8.png', alt: 'Nature walk' }],
        stats: { comments: 41, reshares: 14, reposts: 9, likes: 267, views: 5400, bookmarks: 32 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_3', 'user_5', 'user_8'],
        savedBy: ['user_3', 'user_8'],
        repostedBy: ['user_5'],
    },
    {
        id: 'post_8',
        author: users[7],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        content: captions[7],
        media: [],
        stats: { comments: 78, reshares: 34, reposts: 21, likes: 567, views: 11200, bookmarks: 89 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2', 'user_4', 'user_6', 'user_9'],
        savedBy: ['user_4', 'user_9'],
        repostedBy: ['user_2', 'user_6'],
    },
    {
        id: 'post_9',
        author: users[8],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
        content: captions[8],
        media: [],
        stats: { comments: 92, reshares: 45, reposts: 28, likes: 789, views: 15600, bookmarks: 123 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_3', 'user_5', 'user_7'],
        savedBy: ['user_1', 'user_5'],
        repostedBy: ['user_3', 'user_7'],
    },
    {
        id: 'post_10',
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
        content: captions[9],
        media: [{ type: 'image', url: '/DummyData/9.png', alt: 'Spiritual master' }],
        stats: { comments: 65, reshares: 27, reposts: 16, likes: 456, views: 8900, bookmarks: 67 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2', 'user_4', 'user_6', 'user_8'],
        savedBy: ['user_2', 'user_8'],
        repostedBy: ['user_4'],
    },
    {
        id: 'post_11',
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        content: captions[10],
        media: [],
        stats: { comments: 5, reshares: 1, reposts: 0, likes: 23, views: 456, bookmarks: 2 },
        comments: [],
        originalPost: null,
        likedBy: ['user_3'],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_12',
        author: users[9],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
        content: captions[11],
        media: [],
        stats: { comments: 34, reshares: 12, reposts: 7, likes: 189, views: 3400, bookmarks: 28 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_2'],
        savedBy: ['user_1'],
        repostedBy: [],
    },
    {
        id: 'post_13',
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 192).toISOString(),
        content: captions[12],
        media: [],
        stats: { comments: 12, reshares: 4, reposts: 2, likes: 67, views: 1200, bookmarks: 8 },
        comments: [],
        originalPost: null,
        likedBy: ['user_4', 'user_5'],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_14',
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 216).toISOString(),
        content: captions[13],
        media: [],
        stats: { comments: 0, reshares: 0, reposts: 0, likes: 0, views: 89, bookmarks: 0 },
        comments: [],
        originalPost: null,
        likedBy: [],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_15',
        author: users[4],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString(),
        content: captions[14],
        media: [],
        stats: { comments: 8, reshares: 2, reposts: 1, likes: 34, views: 678, bookmarks: 5 },
        comments: [],
        originalPost: null,
        likedBy: ['user_6'],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_16',
        author: users[5],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 264).toISOString(),
        content: captions[15],
        media: [],
        stats: { comments: 15, reshares: 5, reposts: 3, likes: 78, views: 1500, bookmarks: 12 },
        comments: [],
        originalPost: null,
        likedBy: ['user_7', 'user_8'],
        savedBy: ['user_7'],
        repostedBy: [],
    },
    {
        id: 'post_17',
        author: users[6],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 288).toISOString(),
        content: captions[16],
        media: [],
        stats: { comments: 23, reshares: 8, reposts: 5, likes: 123, views: 2300, bookmarks: 18 },
        comments: [],
        originalPost: null,
        likedBy: ['user_9', 'user_1'],
        savedBy: ['user_9'],
        repostedBy: [],
    },
    {
        id: 'post_18',
        author: users[7],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 312).toISOString(),
        content: captions[17],
        media: [{ type: 'image', url: '/DummyData/1.png', alt: 'Simple image' }],
        stats: { comments: 18, reshares: 6, reposts: 4, likes: 98, views: 1800, bookmarks: 15 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2', 'user_3'],
        savedBy: ['user_2'],
        repostedBy: [],
    },
    {
        id: 'post_19',
        author: users[8],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 336).toISOString(),
        content: captions[18],
        media: [
            { type: 'image', url: '/DummyData/2.png', alt: 'Vrindavan 1' },
            { type: 'image', url: '/DummyData/3.png', alt: 'Vrindavan 2' }
        ],
        stats: { comments: 45, reshares: 15, reposts: 10, likes: 267, views: 5100, bookmarks: 38 },
        comments: [],
        originalPost: null,
        likedBy: ['user_4', 'user_5', 'user_6'],
        savedBy: ['user_4', 'user_5'],
        repostedBy: ['user_6'],
    },
    {
        id: 'post_20',
        author: users[9],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 360).toISOString(),
        content: captions[19],
        media: [
            { type: 'image', url: '/DummyData/4.png', alt: 'Image 1' },
            { type: 'image', url: '/DummyData/5.png', alt: 'Image 2' },
            { type: 'image', url: '/DummyData/6.png', alt: 'Image 3' }
        ],
        stats: { comments: 56, reshares: 19, reposts: 12, likes: 345, views: 6700, bookmarks: 49 },
        comments: [],
        originalPost: null,
        likedBy: ['user_7', 'user_8', 'user_9'],
        savedBy: ['user_7'],
        repostedBy: ['user_8'],
    },
    {
        id: 'post_21',
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 384).toISOString(),
        content: captions[20],
        media: [
            { type: 'image', url: '/DummyData/7.png', alt: 'Festival 1' },
            { type: 'image', url: '/DummyData/8.png', alt: 'Festival 2' },
            { type: 'image', url: '/DummyData/9.png', alt: 'Festival 3' },
            { type: 'image', url: '/DummyData/10.png', alt: 'Festival 4' }
        ],
        stats: { comments: 89, reshares: 34, reposts: 22, likes: 567, views: 9800, bookmarks: 78 },
        comments: [],
        originalPost: null,
        likedBy: ['user_1', 'user_2', 'user_3', 'user_4'],
        savedBy: ['user_1', 'user_3'],
        repostedBy: ['user_2', 'user_4'],
    },
    {
        id: 'post_22',
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 408).toISOString(),
        content: captions[21],
        media: [
            { type: 'image', url: '/DummyData/1.png', alt: 'Picture 1' },
            { type: 'image', url: '/DummyData/2.png', alt: 'Picture 2' },
            { type: 'image', url: '/DummyData/3.png', alt: 'Picture 3' },
            { type: 'image', url: '/DummyData/4.png', alt: 'Picture 4' },
            { type: 'image', url: '/DummyData/5.png', alt: 'Picture 5' }
        ],
        stats: { comments: 67, reshares: 28, reposts: 18, likes: 456, views: 8100, bookmarks: 62 },
        comments: [],
        originalPost: null,
        likedBy: ['user_5', 'user_6', 'user_7'],
        savedBy: ['user_5', 'user_6'],
        repostedBy: ['user_7'],
    },
    {
        id: 'post_23',
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 432).toISOString(),
        content: captions[22],
        media: [
            { type: 'video', url: '/DummyData/video1.mp4', alt: 'Kirtan video', thumbnailUrl: '/DummyData/video_thumb.png' },
            { type: 'image', url: '/DummyData/6.png', alt: 'Kirtan photo' }
        ],
        stats: { comments: 78, reshares: 32, reposts: 20, likes: 489, views: 8900, bookmarks: 71 },
        comments: [],
        originalPost: null,
        likedBy: ['user_8', 'user_9', 'user_1'],
        savedBy: ['user_8', 'user_9'],
        repostedBy: ['user_1'],
    },
    {
        id: 'post_24',
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 456).toISOString(),
        content: captions[23],
        media: [],
        stats: { comments: 12, reshares: 4, reposts: 2, likes: 67, views: 1200, bookmarks: 9 },
        comments: [],
        originalPost: basePostForQuoting,
        likedBy: ['user_2'],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_25',
        author: users[4],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 480).toISOString(),
        content: captions[24],
        media: [],
        stats: { comments: 156, reshares: 67, reposts: 43, likes: 892, views: 18900, bookmarks: 134 },
        comments: [],
        originalPost: null,
        likedBy: ['user_3', 'user_4', 'user_5', 'user_6'],
        savedBy: ['user_3', 'user_4'],
        repostedBy: ['user_5', 'user_6'],
    },
    {
        id: 'post_26',
        author: users[5],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        content: captions[25],
        media: [{ type: 'image', url: '/DummyData/7.png', alt: 'Old post' }],
        stats: { comments: 234, reshares: 89, reposts: 56, likes: 1234, views: 25600, bookmarks: 189 },
        comments: [],
        originalPost: null,
        likedBy: ['user_7', 'user_8', 'user_9', 'user_1'],
        savedBy: ['user_7', 'user_8'],
        repostedBy: ['user_9', 'user_1'],
    },
    {
        id: 'post_27',
        author: users[6],
        createdAt: new Date(Date.now() - 1000 * 10).toISOString(),
        content: captions[26],
        media: [],
        stats: { comments: 0, reshares: 0, reposts: 0, likes: 2, views: 34, bookmarks: 0 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2'],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_28',
        author: users[7],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 504).toISOString(),
        content: captions[27],
        media: [],
        stats: { comments: 45, reshares: 18, reposts: 11, likes: 267, views: 5400, bookmarks: 38 },
        comments: [{
            id: 'comment_hidden',
            user: users[7],
            text: 'This comment is hidden by the author.',
            isPinned: false,
            likes: 3,
            isHidden: true,
            replies: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 503).toISOString(),
            likedBy: []
        }],
        originalPost: null,
        likedBy: ['user_2', 'user_3'],
        savedBy: ['user_2'],
        repostedBy: [],
    },
    {
        id: 'post_29',
        author: users[8],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 528).toISOString(),
        content: captions[28],
        media: [],
        stats: { comments: 34, reshares: 14, reposts: 9, likes: 189, views: 3800, bookmarks: 27 },
        comments: [{
            id: 'comment_pinned',
            user: users[1],
            text: 'Pinned: This is the most important comment!',
            isPinned: true,
            likes: 45,
            isHidden: false,
            replies: [],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 527).toISOString(),
            likedBy: ['user_2', 'user_3', 'user_4']
        }],
        originalPost: null,
        likedBy: ['user_4', 'user_5'],
        savedBy: ['user_4'],
        repostedBy: [],
    },
    {
        id: 'post_30',
        author: users[9],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 552).toISOString(),
        content: captions[29],
        media: [],
        stats: { comments: 67, reshares: 25, reposts: 16, likes: 378, views: 6900, bookmarks: 52 },
        comments: [{
            id: 'comment_nested',
            user: users[2],
            text: 'Great post! Let me share my thoughts.',
            isPinned: false,
            likes: 23,
            isHidden: false,
            replies: [
                {
                    id: 'reply_nested_1',
                    user: users[3],
                    text: 'I agree with this!',
                    isPinned: false,
                    likes: 8,
                    isHidden: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 551).toISOString(),
                    likedBy: ['user_4']
                },
                {
                    id: 'reply_nested_2',
                    user: users[4],
                    text: 'Me too! Very insightful.',
                    isPinned: false,
                    likes: 12,
                    isHidden: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 550).toISOString(),
                    likedBy: ['user_5', 'user_6']
                }
            ],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 551).toISOString(),
            likedBy: ['user_5', 'user_6', 'user_7']
        }],
        originalPost: null,
        likedBy: ['user_6', 'user_7'],
        savedBy: ['user_6'],
        repostedBy: [],
    },
    {
        id: 'post_31',
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 576).toISOString(),
        content: captions[30],
        media: [],
        stats: { comments: 0, reshares: 0, reposts: 0, likes: 0, views: 12, bookmarks: 0 },
        comments: [],
        originalPost: null,
        likedBy: [],
        savedBy: [],
        repostedBy: [],
    },
    {
        id: 'post_32',
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 600).toISOString(),
        content: captions[31],
        media: [],
        stats: { comments: 9876, reshares: 5432, reposts: 3456, likes: 123456, views: 9876543, bookmarks: 12345 },
        comments: [],
        originalPost: null,
        likedBy: ['user_2', 'user_3', 'user_4', 'user_5', 'user_6'],
        savedBy: ['user_2', 'user_3', 'user_4'],
        repostedBy: ['user_5', 'user_6'],
    },
    {
        id: 'post_33',
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 624).toISOString(),
        content: captions[32],
        media: [],
        stats: { comments: 45, reshares: 18, reposts: 11, likes: 234, views: 4500, bookmarks: 34 },
        comments: [],
        originalPost: null,
        likedBy: ['user_7', 'user_8'],
        savedBy: ['user_7'],
        repostedBy: [],
    },
    {
        id: 'post_34',
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 648).toISOString(),
        content: captions[33],
        media: [],
        poll: samplePolls[0],
        stats: { comments: 89, reshares: 34, reposts: 21, likes: 456, views: 8200, bookmarks: 67 },
        comments: [],
        originalPost: null,
        likedBy: ['user_9', 'user_1', 'user_2'],
        savedBy: ['user_9', 'user_1'],
        repostedBy: ['user_2'],
    },
    {
        id: 'post_35',
        author: users[4],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 672).toISOString(),
        content: captions[34],
        media: [sampleGifs[0]],
        stats: { comments: 67, reshares: 28, reposts: 18, likes: 389, views: 7100, bookmarks: 54 },
        comments: [],
        originalPost: null,
        likedBy: ['user_3', 'user_4', 'user_5'],
        savedBy: ['user_3', 'user_4'],
        repostedBy: ['user_5'],
    },
    basePostForQuoting,
];

// Add analytics to all posts
export const dummyPosts: PostType[] = basePosts.map(post => ({
    ...post,
    analytics: generateMockAnalytics(post)
}));

// SECTION: Notifications

export const dummyNotifications: NotificationType[] = [
    {
        id: 'notif_collab_1',
        type: 'collaboration_request',
        fromUser: users[2],
        postId: 'post_1',
        text: 'Wants to collaborate with you on a post.',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        read: false,
        status: 'pending',
    },
    {
        id: 'notif_1',
        type: 'like',
        fromUser: users[1],
        postId: 'post_1',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false
    },
    {
        id: 'notif_2',
        type: 'comment',
        fromUser: users[2],
        postId: 'post_1',
        text: 'Great post! Very insightful.',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false
    },
    {
        id: 'notif_3',
        type: 'follow',
        fromUser: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: true
    },
    {
        id: 'notif_4',
        type: 'repost',
        fromUser: users[4],
        postId: 'post_2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        read: true
    },
    {
        id: 'notif_5',
        type: 'poll_vote',
        fromUser: users[5],
        postId: 'post_34',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true
    },
    {
        id: 'notif_6',
        type: 'mention',
        fromUser: users[6],
        postId: 'post_3',
        text: 'mentioned you in a post',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        read: true
    },
    {
        id: 'notif_7',
        type: 'quote',
        fromUser: users[7],
        postId: 'post_24',
        text: 'quoted your post',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        read: true
    }
];

// SECTION: User Relationships

export const dummyRelationships: UserRelationship[] = [
    {
        userId: 'user_1',
        following: ['user_2', 'user_3', 'user_8'],
        followers: ['user_2', 'user_4', 'user_5', 'user_6'],
        blockedUsers: [],
        mutedUsers: []
    },
    {
        userId: 'user_2',
        following: ['user_1', 'user_3', 'user_4', 'user_5'],
        followers: ['user_1', 'user_6', 'user_7', 'user_8', 'user_9'],
        blockedUsers: [],
        mutedUsers: []
    }
];

// SECTION: Bookmark Collections

export const dummyBookmarkCollections: BookmarkCollection[] = [
    {
        id: 'collection_1',
        name: 'Spiritual Quotes',
        postIds: ['post_1', 'post_base_quote', 'post_8'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        isPrivate: false
    },
    {
        id: 'collection_2',
        name: 'Temple Photos',
        postIds: ['post_3', 'post_5'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        isPrivate: true
    }
];

// SECTION: Trending Topics

export const dummyTrendingTopics: TrendingTopic[] = [
    { id: 'trend_1', hashtag: '#SpiritualJourney', postsCount: 1234, category: 'Spirituality' },
    { id: 'trend_2', hashtag: '#TempleLife', postsCount: 890, category: 'Community' },
    { id: 'trend_3', hashtag: '#BhagavadGita', postsCount: 2345, category: 'Scripture' },
    { id: 'trend_4', hashtag: '#HareKrishna', postsCount: 5678, category: 'Devotion' },
    { id: 'trend_5', hashtag: '#Vrindavan', postsCount: 456, category: 'Places' },
    { id: 'trend_6', hashtag: '#DivineCreation', postsCount: 789, category: 'Nature' },
    { id: 'trend_7', hashtag: '#SelflessService', postsCount: 345, category: 'Karma Yoga' },
    { id: 'trend_8', hashtag: '#Wisdom', postsCount: 1567, category: 'Philosophy' }
];

// SECTION: Draft Posts

export const dummyDrafts: DraftPost[] = [
    {
        id: 'draft_1',
        content: 'Working on a new post about the importance of daily meditation...',
        media: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
        id: 'draft_2',
        content: 'Festival preparations are underway! 🎉',
        media: [{ type: 'image', url: '/DummyData/1.png', alt: 'Festival prep' }],
        poll: samplePolls[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
    }
];

// SECTION: Utility Functions

export const generateId = (prefix: 'post' | 'comment' | 'reply' | 'poll' | 'notif' | 'draft'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createEmptyPost = (author: UserType, content: string, media: MediaType[] = [], collaborators: UserType[] = []): PostType => {
    const newPost: PostType = {
        id: generateId('post'),
        author,
        createdAt: new Date().toISOString(),
        content,
        media,
        collaborators,
        pendingCollaborators: collaborators.map(c => ({ userId: c.id, status: 'pending' })),
        stats: { comments: 0, reshares: 0, reposts: 0, likes: 0, views: 0, bookmarks: 0 },
        comments: [],
        originalPost: null,
        likedBy: [],
        savedBy: [],
        repostedBy: [],
    };
    newPost.analytics = generateMockAnalytics(newPost);
    return newPost;
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

export const votePoll = (poll: PollType, optionId: string, userId: string): PollType => {
    const updatedOptions = poll.options.map(opt => {
        if (opt.id === optionId) {
            return {
                ...opt,
                votes: opt.votes + 1,
                votedBy: [...opt.votedBy, userId]
            };
        }
        return opt;
    });

    return {
        ...poll,
        options: updatedOptions,
        totalVotes: poll.totalVotes + 1
    };
};

// Export users for external use
export { users };