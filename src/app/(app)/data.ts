// Comprehensive test data for UI development with edge cases
// This file includes various combinations to stress-test the frontend

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
    {
        id: "user_5",
        name: "Extremely Long Name That Should Test Overflow Handling In The UI Component",
        username: "verylongusernamethatmightbreaktheui",
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
    "A moment of gratitude for the spiritual master, the guide who illuminates the path with the torch of knowledge. #Guru #Guidance",
    "Short text.",
    "This is an extremely long post that should test how the UI handles very lengthy content. ".repeat(20) + "Will it truncate? Will it show a 'read more' button? How does the layout respond to paragraphs upon paragraphs of text? This is crucial for responsive design testing. #LongPost #UITesting",
    "🕉️ ✨ 🙏 🪔 🌺 🎵 📿 🌸 💫 ⭐ 🌟 ✨ 🕉️ 🙌 🌼 🌻 🌷 🌹 💐 🌿 🍃 🌾 🌱",
    "",
    "Special characters test: <script>alert('xss')</script> & < > \" ' / \\ | @ # $ % ^ * ( ) [ ] { } ; : , . ? ! ~ ` += -= *= /=",
    "Multiple\n\n\nLine\n\n\nBreaks\n\n\nTest",
    "https://example.com/very/long/url/that/should/be/handled/properly/by/the/ui/component/without/breaking/the/layout https://another-url.com",
];

export const dummyPosts = [
    // 1. EDGE: Single video only
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

    // 2. COMBO: Text + Single Image
    {
        id: "post_2",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        content: captions[2],
        media: [
            { type: 'image' as const, url: '/DummyData/1.png' }
        ],
        stats: { comments: 3, reshares: 2, likes: 75, views: 1500 },
        comments: []
    },

    // 3. COMBO: Text + 2 Images
    {
        id: "post_3",
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        content: captions[6],
        media: [
            { type: 'image' as const, url: '/DummyData/5.png' },
            { type: 'image' as const, url: '/DummyData/6.png' }
        ],
        stats: { comments: 2, reshares: 1, likes: 45, views: 980 },
        comments: []
    },

    // 4. COMBO: Text + 3 Images
    {
        id: "post_4",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        content: captions[1],
        media: [
            { type: 'image' as const, url: '/DummyData/7.png' },
            { type: 'image' as const, url: '/DummyData/9.png' },
            { type: 'image' as const, url: '/DummyData/8.png' },
        ],
        stats: { comments: 15, reshares: 7, likes: 210, views: 4300 },
        comments: [
            { id: "comment_4_1", user: users[2], text: "The best way to start the day!", isPinned: false, likes: 8 }
        ]
    },

    // 5. COMBO: Text + 4 Images (Grid layout test)
    {
        id: "post_5",
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
            { id: "comment_5_1", user: users[0], text: "I was there too! The kirtan was magical.", isPinned: false, likes: 5 },
        ]
    },

    // 6. COMBO: Text + 5 Images (Overflow test)
    {
        id: "post_6",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        content: captions[4],
        media: [
            { type: 'image' as const, url: '/DummyData/1.png' },
            { type: 'image' as const, url: '/DummyData/2.png' },
            { type: 'image' as const, url: '/DummyData/3.png' },
            { type: 'image' as const, url: '/DummyData/4.png' },
            { type: 'image' as const, url: '/DummyData/5.png' }
        ],
        stats: { comments: 12, reshares: 5, likes: 120, views: 2800 },
        comments: []
    },

    // 7. COMBO: Text + Video + Image
    {
        id: "post_7",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        content: captions[7],
        media: [
            { type: 'video' as const, url: '/DummyData/1.mp4' },
            { type: 'image' as const, url: '/DummyData/10.png' }
        ],
        stats: { comments: 9, reshares: 14, likes: 195, views: 3400 },
        comments: [
            { id: "comment_7_1", user: users[3], text: "Mixed media post looks great!", isPinned: false, likes: 12 }
        ]
    },

    // 8. COMBO: Text + Multiple Videos
    {
        id: "post_8",
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        content: captions[0],
        media: [
            { type: 'video' as const, url: '/DummyData/1.mp4' },
            { type: 'video' as const, url: '/DummyData/2.mp4' }
        ],
        stats: { comments: 7, reshares: 18, likes: 225, views: 5600 },
        comments: []
    },

    // 9. COMBO: Text + Video + Multiple Images
    {
        id: "post_9",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        content: captions[5],
        media: [
            { type: 'video' as const, url: '/DummyData/2.mp4' },
            { type: 'image' as const, url: '/DummyData/11.png' },
            { type: 'image' as const, url: '/DummyData/12.png' },
            { type: 'image' as const, url: '/DummyData/1.png' }
        ],
        stats: { comments: 11, reshares: 6, likes: 142, views: 3100 },
        comments: [
            { id: "comment_9_1", user: users[0], text: "Beautiful combination!", isPinned: false, likes: 7 }
        ]
    },

    // 10. EDGE: Text only (normal length)
    {
        id: "post_10",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        content: captions[8],
        media: [],
        stats: { comments: 22, reshares: 45, likes: 540, views: 10500 },
        comments: [
            { id: "comment_10_1", user: users[3], text: "Dandavat Pranams. All glories to Srila Prabhupada.", isPinned: false, likes: 50 },
            { id: "comment_10_2", user: users[1], text: "Beautifully said. 🙏", isPinned: false, likes: 23 },
        ]
    },

    // 11. EDGE: Very short text only
    {
        id: "post_11",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        content: captions[10],
        media: [],
        stats: { comments: 1, reshares: 0, likes: 15, views: 250 },
        comments: []
    },

    // 12. EDGE: Extremely long text (truncation test)
    {
        id: "post_12",
        author: users[4],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        content: captions[11],
        media: [],
        stats: { comments: 3, reshares: 1, likes: 28, views: 890 },
        comments: []
    },

    // 13. EDGE: Only emojis
    {
        id: "post_13",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
        content: captions[12],
        media: [],
        stats: { comments: 5, reshares: 2, likes: 42, views: 720 },
        comments: []
    },

    // 14. EDGE: Empty text with media
    {
        id: "post_14",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
        content: captions[13],
        media: [
            { type: 'image' as const, url: '/DummyData/6.png' },
            { type: 'video' as const, url: '/DummyData/1.mp4' }
        ],
        stats: { comments: 0, reshares: 0, likes: 10, views: 180 },
        comments: []
    },

    // 15. EDGE: Special characters test
    {
        id: "post_15",
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        content: captions[14],
        media: [
            { type: 'image' as const, url: '/DummyData/7.png' }
        ],
        stats: { comments: 2, reshares: 0, likes: 8, views: 320 },
        comments: []
    },

    // 16. EDGE: Multiple line breaks
    {
        id: "post_16",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        content: captions[15],
        media: [],
        stats: { comments: 1, reshares: 0, likes: 12, views: 240 },
        comments: []
    },

    // 17. EDGE: URLs in text
    {
        id: "post_17",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        content: captions[16],
        media: [],
        stats: { comments: 4, reshares: 3, likes: 35, views: 680 },
        comments: []
    },

    // 18. EDGE: Maximum comments stress test
    {
        id: "post_18",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        content: captions[3],
        media: [{ type: 'image' as const, url: '/DummyData/8.png' }],
        stats: { comments: 100, reshares: 50, likes: 999, views: 50000 },
        comments: [
            { id: "comment_18_1", user: users[0], text: "First comment", isPinned: true, likes: 500 },
            { id: "comment_18_2", user: users[1], text: "Second comment", isPinned: false, likes: 250 },
            { id: "comment_18_3", user: users[2], text: "Third comment", isPinned: false, likes: 125 },
            { id: "comment_18_4", user: users[3], text: "Fourth comment with very long text that might overflow the comment container and test the UI's ability to handle lengthy comments gracefully without breaking the layout. Let's see how this renders!", isPinned: false, likes: 75 },
            { id: "comment_18_5", user: users[4], text: "Fifth comment", isPinned: false, likes: 50 },
        ]
    },

    // 19. EDGE: Zero stats (new post)
    {
        id: "post_19",
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        content: captions[9],
        media: [
            { type: 'image' as const, url: '/DummyData/9.png' },
            { type: 'image' as const, url: '/DummyData/10.png' }
        ],
        stats: { comments: 0, reshares: 0, likes: 0, views: 0 },
        comments: []
    },

    // 20. COMBO: Max mixed media (stress test)
    {
        id: "post_20",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        content: captions[5],
        media: [
            { type: 'video' as const, url: '/DummyData/1.mp4' },
            { type: 'video' as const, url: '/DummyData/2.mp4' },
            { type: 'image' as const, url: '/DummyData/1.png' },
            { type: 'image' as const, url: '/DummyData/2.png' },
            { type: 'image' as const, url: '/DummyData/3.png' },
            { type: 'image' as const, url: '/DummyData/4.png' }
        ],
        stats: { comments: 25, reshares: 30, likes: 450, views: 8900 },
        comments: [
            { id: "comment_20_1", user: users[2], text: "Wow! So much content!", isPinned: false, likes: 18 }
        ]
    },

    // 21. EDGE: Old post (date rendering test)
    {
        id: "post_21",
        author: users[2],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        content: captions[3],
        media: [],
        stats: { comments: 18, reshares: 9, likes: 180, views: 3200 },
        comments: []
    },

    // 22. EDGE: Very recent post (time rendering test)
    {
        id: "post_22",
        author: users[1],
        createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
        content: "Just now! Testing real-time updates.",
        media: [{ type: 'image' as const, url: '/DummyData/11.png' }],
        stats: { comments: 0, reshares: 0, likes: 1, views: 5 },
        comments: []
    },

    // 23. COMBO: All images different
    {
        id: "post_23",
        author: users[3],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        content: captions[6],
        media: [
            { type: 'image' as const, url: '/DummyData/1.png' },
            { type: 'image' as const, url: '/DummyData/2.png' },
            { type: 'image' as const, url: '/DummyData/3.png' },
            { type: 'image' as const, url: '/DummyData/4.png' },
            { type: 'image' as const, url: '/DummyData/5.png' },
            { type: 'image' as const, url: '/DummyData/6.png' }
        ],
        stats: { comments: 6, reshares: 4, likes: 92, views: 1850 },
        comments: []
    },

    // 24. EDGE: High engagement numbers
    {
        id: "post_24",
        author: users[0],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        content: captions[8],
        media: [{ type: 'video' as const, url: '/DummyData/2.mp4' }],
        stats: { comments: 9999, reshares: 9999, likes: 99999, views: 999999 },
        comments: []
    },
];

export type PostType = (typeof dummyPosts)[0];
export type CommentType = (typeof dummyPosts)[0]['comments'][0];
