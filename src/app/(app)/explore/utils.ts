import { PostType, CommentType } from '@/lib/types';

// Transform DB post to UI PostType
export const transformPost = (dbPost: any): PostType => {
    // Handle missing author (e.g. due to RLS or data integrity)
    const author = dbPost.author || {
        id: 'unknown',
        name: 'Unknown User',
        username: 'unknown',
        avatar: '', // Use default placeholder
        verified: false
    };

    // Transform comments from database format to UI format
    const transformedComments: CommentType[] = (dbPost.post_comments || []).map((comment: any) => ({
        id: comment.id.toString(),
        user: {
            id: comment.profiles?.id || comment.user_id,
            name: comment.profiles?.name || 'Unknown User',
            username: comment.profiles?.username || 'unknown',
            avatar: comment.profiles?.avatar_url || '/placeholder-user.jpg',
            verified: comment.profiles?.verified || false
        },
        text: comment.content,
        createdAt: comment.created_at,
        likes: comment.like_count || 0,
        likedBy: [], // Could be populated if needed
        replies: [], // Nested replies not yet supported
        isPinned: false,
        isHidden: false
    }));

    return {
        id: dbPost.id.toString(),
        author: {
            id: author.id,
            name: author.name,
            username: author.username,
            avatar: author.avatar_url || '/placeholder-user.jpg', // Fallback avatar
            verified: author.verified,
        },
        createdAt: dbPost.created_at,
        content: dbPost.content,
        media: dbPost.media_urls || [],
        poll: dbPost.poll,
        stats: {
            likes: dbPost.likes?.[0]?.count || 0,
            comments: transformedComments.length || dbPost.comments?.[0]?.count || 0,
            reposts: dbPost.reposts?.[0]?.count || 0,
            reshares: 0, // Not tracked yet
            views: 0, // Not tracked yet
            bookmarks: 0 // Not tracked yet
        },
        comments: transformedComments,
        originalPost: dbPost.quote_of ? transformPost(dbPost.quote_of) : null,
        likedBy: (dbPost.user_likes || []).map((like: any) => like.user_id), // All users who liked this post
        savedBy: [],
        repostedBy: [],
        isPinned: dbPost.is_pinned,
        isPromoted: dbPost.is_promoted,
        collaborators: (dbPost.post_collaborators || [])
            .filter((c: any) => c.status === 'accepted')
            .map((c: any) => ({
                id: c.user.id,
                name: c.user.name,
                username: c.user.username,
                avatar: c.user.avatar_url || '/placeholder-user.jpg',
                verified: c.user.verified
            }))
    };
};
