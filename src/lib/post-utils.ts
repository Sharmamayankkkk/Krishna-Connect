import { PostType, CommentType } from '@/lib/types';

/**
 * Transform a database post object to the UI PostType format.
 * This is the single source of truth for post data transformation.
 */
export const transformPost = (dbPost: any): PostType => {
    // Handle missing author (e.g. due to RLS or data integrity)
    const author = dbPost.author || {
        id: 'unknown',
        name: 'Unknown User',
        username: 'unknown',
        avatar: '',
        verified: false
    };

    // Transform comments from database format to UI format
    const transformComment = (comment: any): CommentType => ({
        id: comment.id?.toString() || '',
        user: {
            id: comment.profiles?.id || comment.author?.id || comment.user_id || 'unknown',
            name: comment.profiles?.name || comment.author?.name || 'Unknown User',
            username: comment.profiles?.username || comment.author?.username || 'unknown',
            avatar: comment.profiles?.avatar_url || comment.author?.avatar_url || comment.author?.avatar || '/placeholder-user.jpg',
            verified: comment.profiles?.verified || comment.author?.verified || false
        },
        text: comment.content || comment.text || '',
        createdAt: comment.created_at || comment.createdAt || new Date().toISOString(),
        likes: comment.like_count || (comment.likes?.length) || 0,
        likedBy: (comment.likes || []).map((l: any) => l.user_id || l),
        replies: (comment.replies || []).map(transformComment),
        isPinned: comment.is_pinned || false,
        isHidden: comment.is_hidden || false
    });

    // Filter to only get top-level comments (not replies), then transform
    const topLevelComments = (dbPost.post_comments || dbPost.comments || [])
        .filter((c: any) => !c.parent_comment_id);
    const transformedComments: CommentType[] = topLevelComments.map(transformComment);

    // Handle likes - can be array of objects with user_id or count object
    const likesCount = Array.isArray(dbPost.likes)
        ? dbPost.likes.length
        : (dbPost.likes?.[0]?.count || 0);

    const likedByUsers = Array.isArray(dbPost.likes)
        ? dbPost.likes.map((like: any) => like.user_id || like)
        : (dbPost.user_likes || []).map((like: any) => like.user_id);

    // Handle reposts
    const repostsCount = Array.isArray(dbPost.reposts)
        ? dbPost.reposts.length
        : (dbPost.reposts?.[0]?.count || 0);

    const repostedByUsers = Array.isArray(dbPost.reposts)
        ? dbPost.reposts.map((rp: any) => rp.user_id || rp)
        : [];

    return {
        id: dbPost.id?.toString() || '',
        author: {
            id: author.id,
            name: author.name || author.full_name || author.username,
            username: author.username,
            avatar: author.avatar_url || author.avatar || '/placeholder-user.jpg',
            verified: author.verified || author.is_verified || false,
        },
        createdAt: dbPost.created_at || dbPost.createdAt || new Date().toISOString(),
        content: dbPost.content || '',
        media: dbPost.media_urls || dbPost.media || [],
        poll: dbPost.poll,
        stats: {
            likes: likesCount,
            comments: transformedComments.length || dbPost.comments_count || 0,
            reposts: repostsCount,
            reshares: 0,
            views: dbPost.views_count || 0,
            bookmarks: dbPost.bookmarks_count || 0
        },
        comments: transformedComments,
        originalPost: dbPost.quote_of ? transformPost(dbPost.quote_of) : null,
        likedBy: likedByUsers,
        savedBy: (dbPost.saved_posts || []).map((s: any) => s.user_id || s),
        repostedBy: repostedByUsers,
        isPinned: dbPost.is_pinned || !!dbPost.pinned_at || false,
        isPromoted: dbPost.is_promoted || false,
        collaborators: (dbPost.post_collaborators || [])
            .filter((c: any) => c.status === 'accepted')
            .map((c: any) => ({
                id: c.user?.id || c.id,
                name: c.user?.name || c.name,
                username: c.user?.username || c.username,
                avatar: c.user?.avatar_url || c.avatar || '/placeholder-user.jpg',
                verified: c.user?.verified || c.verified || false
            }))
    };
};
