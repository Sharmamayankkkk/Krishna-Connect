
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRef, useCallback } from 'react';
import { PostType, CommentType, ReplyType, PollType, UserType } from '@/lib/types';

interface UsePostInteractionsProps {
    loggedInUser: UserType | null;
    updatePost: (post: PostType) => void;
    onDeletePost?: (postId: string) => void; // Optional callback for when a post is fully deleted
}

export function usePostInteractions({ loggedInUser, updatePost, onDeletePost }: UsePostInteractionsProps) {
    const { toast } = useToast();
    // Synchronous guard — prevents concurrent comment inserts before React re-renders.
    const isSubmittingCommentRef = useRef(false);

    // Use refs for stable callback references
    const loggedInUserRef = useRef(loggedInUser);
    loggedInUserRef.current = loggedInUser;
    const updatePostRef = useRef(updatePost);
    updatePostRef.current = updatePost;
    const onDeletePostRef = useRef(onDeletePost);
    onDeletePostRef.current = onDeletePost;
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const handlePostLikeToggle = useCallback(async (post: PostType) => {
        const user = loggedInUserRef.current;
        if (!user) {
            toastRef.current({ title: "Please log in to like posts", variant: "destructive" });
            return;
        }

        const isLiked = post.likedBy.includes(user.id);
        const newLikedBy = isLiked
            ? post.likedBy.filter(id => id !== user.id)
            : [...post.likedBy, user.id];

        // Optimistic update
        const updatedPost = {
            ...post,
            likedBy: newLikedBy,
            stats: {
                ...post.stats,
                likes: isLiked ? Math.max(0, post.stats.likes - 1) : post.stats.likes + 1
            }
        };
        updatePostRef.current(updatedPost);

        const supabase = createClient();
        try {
            if (isLiked) {
                await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: user.id });
            } else {
                await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            updatePostRef.current(post);
            toastRef.current({ title: "Error liking post", variant: "destructive" });
        }
    }, []);

    const handleRepost = useCallback(async (post: PostType) => {
        const user = loggedInUserRef.current;
        if (!user) {
            toastRef.current({ title: "Please log in to repost", variant: "destructive" });
            return;
        }

        const isReposted = post.repostedBy.includes(user.id);
        const newRepostedBy = isReposted
            ? post.repostedBy.filter(id => id !== user.id)
            : [...post.repostedBy, user.id];

        // Optimistic Update
        const updatedPost = {
            ...post,
            repostedBy: newRepostedBy,
            stats: {
                ...post.stats,
                reposts: isReposted ? Math.max(0, post.stats.reposts - 1) : post.stats.reposts + 1
            },
            isReposted: !isReposted
        };
        updatePostRef.current(updatedPost);

        const supabase = createClient();
        try {
            if (isReposted) {
                await supabase.from('post_reposts').delete().match({ post_id: post.id, user_id: user.id });
                toastRef.current({ title: "Repost removed" });
            } else {
                await supabase.from('post_reposts').insert({ post_id: post.id, user_id: user.id });
                toastRef.current({ title: "Reposted!" });
            }
        } catch (error) {
            console.error('Error toggling repost:', error);
            updatePostRef.current(post); // Revert
            toastRef.current({ title: "Error reposting", variant: "destructive" });
        }
    }, []);

    const handlePostSaveToggle = useCallback(async (post: PostType) => {
        const user = loggedInUserRef.current;
        if (!user) return;

        const isSaved = post.savedBy.includes(user.id);
        const newSavedBy = isSaved
            ? post.savedBy.filter(id => id !== user.id)
            : [...post.savedBy, user.id];

        const updatedPost = {
            ...post,
            savedBy: newSavedBy,
            stats: {
                ...post.stats,
                bookmarks: isSaved ? Math.max(0, post.stats.bookmarks - 1) : post.stats.bookmarks + 1
            }
        };
        updatePostRef.current(updatedPost);

        const supabase = createClient();
        try {
            if (isSaved) {
                await supabase.from('bookmarks').delete().match({ post_id: post.id, user_id: user.id });
                toastRef.current({ title: "Removed from bookmarks" });
            } else {
                await supabase.from('bookmarks').insert({ post_id: post.id, user_id: user.id });
                toastRef.current({ title: "Saved to bookmarks" });
            }
        } catch (error) {
            console.error('Error bookmarking:', error);
            updatePostRef.current(post);
            toastRef.current({ title: "Error bookmarking", variant: "destructive" });
        }
    }, []);

    const handlePostDeleted = useCallback(async (postId: string) => {
        const user = loggedInUserRef.current;
        if (!user) return;

        // Optimistic removal from UI if a delete callback is provided
        if (onDeletePostRef.current) {
            onDeletePostRef.current(postId);
        }

        const supabase = createClient();
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;
            toastRef.current({ title: "Post deleted" });
        } catch (error) {
            console.error('Error deleting post:', error);
            toastRef.current({ title: "Error deleting post", variant: "destructive" });
        }
    }, []);

    const handlePollVote = useCallback(async (post: PostType, optionId: string) => {
        const user = loggedInUserRef.current;
        if (!user || !post.poll) return;

        const supabase = createClient();
        try {
            const { data: updatedPoll, error } = await supabase
                .rpc('vote_on_poll', {
                    p_post_id: parseInt(post.id),
                    p_option_id: optionId
                });

            if (error) throw error;

            const updatedPost = {
                ...post,
                poll: updatedPoll as PollType
            };
            updatePostRef.current(updatedPost);

            toastRef.current({ title: "Vote recorded" });
        } catch (error) {
            console.error('Error voting:', error);
            toastRef.current({ title: "Error voting", variant: "destructive" });
        }
    }, []);

    // Comment Actions
    const handleCommentLikeToggle = useCallback(async (post: PostType, commentId: string, isReply: boolean = false) => {
        const user = loggedInUserRef.current;
        if (!user) return;

        const updatedComments = post.comments.map(comment => {
            if (isReply) {
                const updatedReplies = comment.replies.map(reply => {
                    if (reply.id === commentId) {
                        const isLiked = reply.likedBy.includes(user.id);
                        const newLikedBy = isLiked
                            ? reply.likedBy.filter(id => id !== user.id)
                            : [...reply.likedBy, user.id];
                        return { ...reply, likedBy: newLikedBy, likes: newLikedBy.length };
                    }
                    return reply;
                });
                return { ...comment, replies: updatedReplies };
            } else {
                if (comment.id === commentId) {
                    const isLiked = comment.likedBy.includes(user.id);
                    const newLikedBy = isLiked
                        ? comment.likedBy.filter(id => id !== user.id)
                        : [...comment.likedBy, user.id];
                    return { ...comment, likedBy: newLikedBy, likes: newLikedBy.length };
                }
                return comment;
            }
        });

        const updatedPost = { ...post, comments: updatedComments };
        updatePostRef.current(updatedPost);
    }, []);

    const handleCommentSubmit = useCallback(async (post: PostType, commentText: string, parentCommentId?: string) => {
        const user = loggedInUserRef.current;
        if (!user || isSubmittingCommentRef.current) return;
        isSubmittingCommentRef.current = true;

        const commenterUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar
        };

        const userId = user.id; // stable capture

        // Optimistic Update
        const stats = { ...post.stats, comments: post.stats.comments + 1 };
        let updatedPost = { ...post };

        if (parentCommentId) {
            const newReply: ReplyType = {
                id: `reply_${Date.now()}`,
                user: commenterUser,
                text: commentText,
                isPinned: false,
                likes: 0,
                isHidden: false,
                replies: [],
                createdAt: new Date().toISOString(),
                likedBy: []
            };

            const updatedComments = post.comments.map(c =>
                c.id === parentCommentId
                    ? { ...c, replies: [...(c.replies || []), newReply] }
                    : c
            );
            updatedPost = { ...post, comments: updatedComments, stats };
        } else {
            const newComment: CommentType = {
                id: `comment_${Date.now()}`,
                user: commenterUser,
                text: commentText,
                isPinned: false,
                likes: 0,
                isHidden: false,
                replies: [],
                createdAt: new Date().toISOString(),
                likedBy: []
            };
            updatedPost = { ...post, comments: [newComment, ...post.comments], stats };
        }

        updatePostRef.current(updatedPost);

        // Server Request
        const supabase = createClient();
        try {
            const commentPayload: any = {
                post_id: parseInt(post.id),
                user_id: userId,
                content: commentText
            };

            if (parentCommentId) {
                if (!isNaN(Number(parentCommentId))) {
                    commentPayload.parent_comment_id = parseInt(parentCommentId);
                }
            }

            const { error } = await supabase.from('comments').insert(commentPayload);
            if (error) throw error;

            toastRef.current({ title: "Comment added", description: "Your comment has been posted." });
        } catch (error) {
            console.error("Error creating comment:", error);
            updatePostRef.current(post); // Revert
            toastRef.current({ title: "Error", description: "Failed to post comment", variant: "destructive" });
        } finally {
            isSubmittingCommentRef.current = false;
        }
    }, []);

    const handleCommentPinToggle = useCallback(async (post: PostType, commentId: string) => {
        const user = loggedInUserRef.current;
        if (!user || post.author.id !== user.id) return;

        const updatedComments = post.comments.map(comment => {
            if (comment.id === commentId) {
                return { ...comment, isPinned: !comment.isPinned };
            }
            // Unpin others if we are pinning this one (optional, usually only one pinned)
            if (!comment.isPinned) return comment;
            // If we are pinning a new one, unpin the old one? logic depends on requirement. 
            // Feed.tsx implementation unpins others.
            const targetComment = post.comments.find(c => c.id === commentId);
            if (targetComment && !targetComment.isPinned) {
                // We are turning toggle ON for target, so turn OFF for this one
                return { ...comment, isPinned: false };
            }
            return comment;
        });

        const updatedPost = { ...post, comments: updatedComments };
        updatePostRef.current(updatedPost);

        // TODO: Persist to backend
        toastRef.current({ title: "Comment pinned", description: "Comment pinned to the top" });
    }, []);

    const handleCommentHideToggle = useCallback(async (post: PostType, commentId: string, isReply: boolean = false) => {
        const user = loggedInUserRef.current;
        if (!user || post.author.id !== user.id) return;

        const updatedComments = post.comments.map(comment => {
            if (isReply) {
                const updatedReplies = comment.replies?.map(reply => {
                    if (reply.id === commentId) {
                        return { ...reply, isHidden: !reply.isHidden };
                    }
                    return reply;
                }) || [];
                return { ...comment, replies: updatedReplies };
            } else {
                if (comment.id === commentId) {
                    return { ...comment, isHidden: !comment.isHidden };
                }
                return comment;
            }
        });

        const updatedPost = { ...post, comments: updatedComments };
        updatePostRef.current(updatedPost);

        // TODO: Persist to backend
        toastRef.current({ title: "Comment visibility updated" });
    }, []);


    const handleCommentDelete = useCallback(async (post: PostType, commentId: string, isReply: boolean = false, parentCommentId?: string) => {
        const user = loggedInUserRef.current;
        if (!user) return;

        // Optimistic
        let updatedPost = { ...post };
        if (isReply && parentCommentId) {
            const updatedComments = post.comments.map(comment => {
                if (comment.id === parentCommentId) {
                    return {
                        ...comment,
                        replies: comment.replies.filter(r => r.id !== commentId)
                    };
                }
                return comment;
            });
            updatedPost = { ...post, comments: updatedComments, stats: { ...post.stats, comments: Math.max(0, post.stats.comments - 1) } };
        } else {
            const updatedComments = post.comments.filter(c => c.id !== commentId);
            updatedPost = { ...post, comments: updatedComments, stats: { ...post.stats, comments: Math.max(0, post.stats.comments - 1) } };
        }
        updatePostRef.current(updatedPost);

        const supabase = createClient();
        try {
            // Check if it's a real GUID (persisted) or temporary ID
            if (!commentId.startsWith('comment_') && !commentId.startsWith('reply_')) {
                await supabase.from('comments').delete().eq('id', commentId);
            }
            toastRef.current({ title: "Comment deleted" });
        } catch (error) {
            console.error('Error deleting comment:', error);
            updatePostRef.current(post); // Revert
            toastRef.current({ title: "Error deleting comment", variant: "destructive" });
        }
    }, []);

    const handlePostPinToggle = useCallback(async (post: PostType) => {
        const user = loggedInUserRef.current;
        if (!user) {
            toastRef.current({ title: "Please log in to pin posts", variant: "destructive" });
            return;
        }

        if (post.author.id !== user.id) {
            toastRef.current({ title: "You can only pin your own posts", variant: "destructive" });
            return;
        }

        // Optimistic update
        const updatedPost = {
            ...post,
            isPinned: !post.isPinned
        };
        updatePostRef.current(updatedPost);

        const supabase = createClient();
        try {
            const { data, error } = await supabase.rpc('toggle_pin_post', {
                p_post_id: parseInt(post.id)
            });

            if (error) throw error;

            if (!data.success) {
                // Revert on failure
                updatePostRef.current(post);
                toastRef.current({ title: data.message, variant: "destructive" });
                return;
            }

            toastRef.current({ title: data.is_pinned ? "📌 Post pinned to profile" : "Post unpinned" });
        } catch (error) {
            console.error('Error toggling pin:', error);
            updatePostRef.current(post);
            toastRef.current({ title: "Error pinning post", variant: "destructive" });
        }
    }, []);

    return {
        handlePostLikeToggle,
        handleRepost,
        handlePostSaveToggle,
        handlePostDeleted,
        handlePollVote,
        handleCommentLikeToggle,
        handleCommentDelete,
        handleCommentSubmit,
        handleCommentPinToggle,
        handleCommentHideToggle,
        handlePostPinToggle
    };
}

