
// This is a temporary data generation file for UI development.
// It will be replaced with real database calls later.

export const users = [
    {
        id: "user_1",
        name: "Advaita Das",
        username: "advaitadas",
        avatar: "/user_Avatar/male.png"
    },
    {
        id: "user_2",
        name: "Bhakti Devi",
        username: "bhaktidevi",
        avatar: "/user_Avatar/female.png"
    },
    {
        id: "user_3",
        name: "Chaitanya Charan",
        username: "ccharan",
        avatar: "/user_Avatar/male.png"
    },
    {
        id: "user_4",
        name: "Damodar Pandit",
        username: "damodarp",
        avatar: "/user_Avatar/male.png"
    },
];

const captions = [
    "Just concluded a wonderful session on the Bhagavad Gita. The timeless wisdom never ceases to amaze. 🙏 #KrishnaConsciousness #BhagavadGita",
    "Early morning Japa meditation session. The serenity and peace are unparalleled. A perfect start to the day. #Japa #Meditation",
    "Visited the temple today and the atmosphere was just divine. The sound of the kirtan, the aroma of incense... Pure bliss. ✨",
    "Reading from the Srimad Bhagavatam. Every verse is a drop of nectar. So much to learn, so much to imbibe. #SrimadBhagavatam #SpiritualReading",
    "Preparing for the evening Aarti. The lamps are ready, the flowers are fresh. Eagerly waiting to welcome the Lord. 🪔",
    "A beautiful day spent in the service of the Lord. Cooked for the temple feast today. Nothing more satisfying than Seva. #Seva #SelflessService",
    "The beauty of nature is a reflection of the Supreme Artist. A quiet walk in the garden, contemplating the divine creation. 🌳 #Nature #Divine",
    "Attended a lecture on the science of the soul. Deep, insightful, and thought-provoking. Left with a lot to reflect upon. #Soul #Spirituality",
    "The power of chanting the holy names is transformative. It cleanses the heart and brings one closer to Krishna. Hare Krishna! 🙌",
    "A moment of gratitude for the spiritual master, the guide who illuminates the path with the torch of knowledge. #Guru #Guidance"
];

export const dummyPosts = [
    // 1. Post with a single video
    {
        id: "post_1",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        content: captions[0],
        media: [{ type: 'video' as const, url: '/DummyData/1.mp4' }],
        stats: { comments: 5, reshares: 12, likes: 150, views: 2500 },
        comments: [
            { id: "comment_1_1", user: users[1], text: "So inspiring! Thank you for sharing.", isPinned: true, likes: 25 },
            { id: "comment_1_2", user: users[2], text: "Hare Krishna! This is wonderful to see.", isPinned: false, likes: 10 }
        ]
    },
    // 2. Post with four images
    {
        id: "post_2",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        content: captions[2],
        media: [
            { type: 'image' as const, url: '/DummyData/1.png' },
            { type: 'image' as const, url: '/DummyData/2.png' },
            { type: 'image' as const, url: '/DummyData/3.png' },
            { type: 'image' as const, url: '/DummyData/4.png' }
        ],
        stats: { comments: 8, reshares: 3, likes: 88, views: 1200 },
        comments: [
            { id: "comment_2_1", user: users[0], text: "I was there too! The kirtan was magical.", isPinned: false, likes: 5 },
        ]
    },
    // 3. Text-only post
    {
        id: "post_3",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        content: captions[8],
        media: [],
        stats: { comments: 22, reshares: 45, likes: 540, views: 10500 },
        comments: [
            { id: "comment_3_1", user: users[3], text: "Dandavat Pranams. All glories to Srila Prabhupada.", isPinned: false, likes: 50 },
            { id: "comment_3_2", user: users[1], text: "Beautifully said. 🙏", isPinned: false, likes: 23 },
        ]
    },
    // 4. Post with two images
    {
        id: "post_4",
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        content: captions[6],
        media: [
            { type: 'image' as const, url: '/DummyData/5.png' },
            { type: 'image' as const, url: '/DummyData/6.png' }
        ],
        stats: { comments: 2, reshares: 1, likes: 45, views: 980 },
        comments: []
    },
    // 5. Post with three images
    {
        id: "post_5",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        content: captions[1],
        media: [
            { type: 'image' as const, url: '/DummyData/7.png' },
            { type: 'image' as const, url: '/DummyData/9.png' },
            { type: 'image' as const, url: '/DummyData/8.png' },
        ],
        stats: { comments: 15, reshares: 7, likes: 210, views: 4300 },
        comments: [
            { id: "comment_5_1", user: users[2], text: "The best way to start the day!", isPinned: false, likes: 8 }
        ]
    },
    // 6. Post with one image
    {
        id: "post_6",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        content: captions[5],
        media: [
            { type: 'image' as const, url: '/DummyData/10.png' }
        ],
        stats: { comments: 3, reshares: 2, likes: 75, views: 1500 },
        comments: []
    },
     // 7. Another text-only post
    {
        id: "post_8",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        content: captions[3],
        media: [],
        stats: { comments: 18, reshares: 9, likes: 180, views: 3200 },
        comments: []
    }
];

export type PostType = (typeof dummyPosts)[0];
