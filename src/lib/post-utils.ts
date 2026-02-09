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
            id: comment.user?.id || comment.profiles?.id || comment.author?.id || comment.user_id || 'unknown',
            name: comment.user?.name || comment.profiles?.name || comment.author?.name || 'Unknown User',
            username: comment.user?.username || comment.profiles?.username || comment.author?.username || 'unknown',
            avatar: comment.user?.avatar_url || comment.profiles?.avatar_url || comment.author?.avatar_url || comment.author?.avatar || '/placeholder-user.jpg',
            verified: comment.user?.verified || comment.profiles?.verified || comment.author?.verified || false
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

    // Handle likes - Robust count handling
    let likesCount = 0;
    if (typeof dbPost.likes_count === 'number') {
        likesCount = dbPost.likes_count;
    } else if (Array.isArray(dbPost.likes)) {
        if (dbPost.likes.length > 0 && typeof dbPost.likes[0].count === 'number') {
            likesCount = dbPost.likes[0].count;
        } else {
            likesCount = dbPost.likes.length;
        }
    }

    const likedByUsers = Array.isArray(dbPost.likes) && dbPost.likes.length > 0 && !dbPost.likes[0].count
        ? dbPost.likes.map((like: any) => like.user_id || like)
        : (Array.isArray(dbPost.user_likes) ? dbPost.user_likes : []).map((like: any) => like.user_id);

    // Handle reposts - Robust count handling
    let repostsCount = 0;
    if (typeof dbPost.reposts_count === 'number') {
        repostsCount = dbPost.reposts_count;
    } else if (Array.isArray(dbPost.reposts)) {
        if (dbPost.reposts.length > 0 && typeof dbPost.reposts[0].count === 'number') {
            repostsCount = dbPost.reposts[0].count;
        } else {
            repostsCount = dbPost.reposts.length;
        }
    }

    const repostedByUsers = Array.isArray(dbPost.reposts) && dbPost.reposts.length > 0 && !dbPost.reposts[0].count
        ? dbPost.reposts.map((rp: any) => rp.user_id || rp)
        : [];

    // Comments Count
    let commentsCount = transformedComments.length;
    if (typeof dbPost.comments_count === 'number') {
        commentsCount = dbPost.comments_count;
    } else if (Array.isArray(dbPost.comments) && dbPost.comments.length > 0 && typeof dbPost.comments[0].count === 'number') {
        commentsCount = dbPost.comments[0].count;
    }

    // Views Count
    let viewsCount = dbPost.views_count || 0;
    // Fallback to joined view count if column is 0 or missing
    if (viewsCount === 0 && Array.isArray(dbPost.views) && dbPost.views.length > 0 && typeof dbPost.views[0].count === 'number') {
        viewsCount = dbPost.views[0].count;
    }

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
        media: Array.isArray(dbPost.media_urls) ? dbPost.media_urls : (Array.isArray(dbPost.media) ? dbPost.media : []),
        poll: dbPost.poll || null,
        stats: {
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            reshares: 0,
            views: viewsCount,
            bookmarks: dbPost.bookmarks_count || 0
        },
        comments: transformedComments,
        originalPost: dbPost.quote_of ? transformPost(dbPost.quote_of) : null,
        likedBy: likedByUsers,
        savedBy: (Array.isArray(dbPost.saved_posts) ? dbPost.saved_posts : []).map((s: any) => s.user_id || s),
        repostedBy: repostedByUsers,
        isPinned: dbPost.is_pinned || !!dbPost.pinned_at || false,
        isPromoted: dbPost.is_promoted || false,
        collaborators: (Array.isArray(dbPost.post_collaborators) ? dbPost.post_collaborators : [])
            .filter((c: any) => c?.status === 'accepted')
            .map((c: any) => ({
                id: c.user?.id || c.id || 'unknown',
                name: c.user?.name || c.name || 'Unknown',
                username: c.user?.username || c.username || 'unknown',
                avatar: c.user?.avatar_url || c.avatar || '/placeholder-user.jpg',
                verified: c.user?.verified || c.verified || false
            }))
    };
};
