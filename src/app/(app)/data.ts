
// This is a temporary data generation file for UI development.
// It will be replaced with real database calls later.

// NOTE: We need to manually read the text files for now.
// In a real app, this content would come from a database.
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

const comments = [
    "So inspiring! Thank you for sharing.",
    "Hare Krishna! This is wonderful to see.",
    "Very true. The Gita has all the answers.",
    "Beautifully said. 🙏",
    "I was there too! The kirtan was magical.",
    "This gives me so much peace.",
    "Can you share more about this topic?",
    "So much to learn from you.",
    "Thank you for the reminder. #Gratitude",
    "Dandavat Pranams. All glories to Srila Prabhupada."
];

const users = [
    {
        id: "user_1",
        name: "Advaita Das",
        username: "advaitadas",
        avatar: "https://placehold.co/100x100.png"
    },
    {
        id: "user_2",
        name: "Bhakti Devi",
        username: "bhaktidevi",
        avatar: "https://placehold.co/100x100.png"
    },
    {
        id: "user_3",
        name: "Chaitanya Charan",
        username: "ccharan",
        avatar: "https://placehold.co/100x100.png"
    },
    {
        id: "user_4",
        name: "Damodar Pandit",
        username: "damodarp",
        avatar: "https://placehold.co/100x100.png"
    },
];

const photos = [
    '/DummyData/photo1.jpeg',
    '/DummyData/photo2.jpeg',
    '/DummyData/photo3.jpeg',
    '/DummyData/photo4.jpeg',
];
const videos = [
    '/DummyData/video1.mp4',
    '/DummyData/video2.mp4',
];

const generateRandomData = () => {
    const postCount = 10;
    const posts = [];

    for (let i = 0; i < postCount; i++) {
        const user = users[i % users.length];
        const mediaType = Math.random() > 0.3 ? 'image' : 'video';
        const mediaCount = Math.floor(Math.random() * 4) + 1;
        
        let media: { type: 'image' | 'video', url: string }[] = [];
        if (mediaType === 'image') {
            media = Array.from({ length: mediaCount }, (_, j) => ({
                type: 'image',
                url: photos[j % photos.length]
            }));
        } else {
            media = [{
                type: 'video',
                url: videos[i % videos.length]
            }];
        }
        
        const commentCount = Math.floor(Math.random() * 5);
        const postComments = Array.from({ length: commentCount }, (_, j) => ({
            id: `comment_${i}_${j}`,
            user: users[j % users.length],
            text: comments[Math.floor(Math.random() * comments.length)]
        }));
        
        posts.push({
            id: `post_${i}`,
            author: user,
            createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString(),
            content: captions[i % captions.length],
            media,
            stats: {
                comments: commentCount,
                reshares: Math.floor(Math.random() * 50),
                likes: Math.floor(Math.random() * 200),
                views: Math.floor(Math.random() * 5000),
            },
            comments: postComments,
        });
    }

    return posts;
};

export const dummyPosts = generateRandomData();
export type PostType = (typeof dummyPosts)[0];

