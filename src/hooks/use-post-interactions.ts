
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
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

    const handlePostLikeToggle = async (post: PostType) => {
        if (!loggedInUser) {
            toast({ title: "Please log in to like posts", variant: "destructive" });
            return;
        }

        const isLiked = post.likedBy.includes(loggedInUser.id);
        const newLikedBy = isLiked
            ? post.likedBy.filter(id => id !== loggedInUser.id)
            : [...post.likedBy, loggedInUser.id];

        // Optimistic update
        const updatedPost = {
            ...post,
            likedBy: newLikedBy,
            stats: {
                ...post.stats,
                likes: isLiked ? Math.max(0, post.stats.likes - 1) : post.stats.likes + 1
            }
        };
        updatePost(updatedPost);

        const supabase = createClient();
        try {
            if (isLiked) {
                await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: loggedInUser.id });
            } else {
                await supabase.from('post_likes').insert({ post_id: post.id, user_id: loggedInUser.id });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            updatePost(post);
            toast({ title: "Error liking post", variant: "destructive" });
        }
    };

    const handleRepost = async (post: PostType) => {
        if (!loggedInUser) {
            toast({ title: "Please log in to repost", variant: "destructive" });
            return;
        }

        const isReposted = post.repostedBy.includes(loggedInUser.id);
        const newRepostedBy = isReposted
            ? post.repostedBy.filter(id => id !== loggedInUser.id)
            : [...post.repostedBy, loggedInUser.id];

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
        updatePost(updatedPost);

        const supabase = createClient();
        try {
            if (isReposted) {
                await supabase.from('post_reposts').delete().match({ post_id: post.id, user_id: loggedInUser.id });
                toast({ title: "Repost removed" });
            } else {
                await supabase.from('post_reposts').insert({ post_id: post.id, user_id: loggedInUser.id });
                toast({ title: "Reposted!" });
            }
        } catch (error) {
            console.error('Error toggling repost:', error);
            updatePost(post); // Revert
            toast({ title: "Error reposting", variant: "destructive" });
        }
    };

    const handlePostSaveToggle = async (post: PostType) => {
        if (!loggedInUser) return;

        const isSaved = post.savedBy.includes(loggedInUser.id);
        const newSavedBy = isSaved
            ? post.savedBy.filter(id => id !== loggedInUser.id)
            : [...post.savedBy, loggedInUser.id];

        const updatedPost = {
            ...post,
            savedBy: newSavedBy,
            stats: {
                ...post.stats,
                bookmarks: isSaved ? Math.max(0, post.stats.bookmarks - 1) : post.stats.bookmarks + 1
            }
        };
        updatePost(updatedPost);

        const supabase = createClient();
        try {
            if (isSaved) {
                await supabase.from('bookmarks').delete().match({ post_id: post.id, user_id: loggedInUser.id });
                toast({ title: "Removed from bookmarks" });
            } else {
                await supabase.from('bookmarks').insert({ post_id: post.id, user_id: loggedInUser.id });
                toast({ title: "Saved to bookmarks" });
            }
        } catch (error) {
            console.error('Error bookmarking:', error);
            updatePost(post);
            toast({ title: "Error bookmarking", variant: "destructive" });
        }
    }

    const handlePostDeleted = async (postId: string) => {
        if (!loggedInUser) return;

        // Optimistic removal from UI if a delete callback is provided
        if (onDeletePost) {
            onDeletePost(postId);
        }

        const supabase = createClient();
        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) throw error;
            toast({ title: "Post deleted" });
        } catch (error) {
            console.error('Error deleting post:', error);
            toast({ title: "Error deleting post", variant: "destructive" });
            // Note: Reverting a delete is hard without reloading data, so usually we just show error
        }
    };

    const handlePollVote = async (post: PostType, optionId: string) => {
        if (!loggedInUser || !post.poll) return;

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
            updatePost(updatedPost);

            toast({ title: "Vote recorded" });
        } catch (error) {
            console.error('Error voting:', error);
            toast({ title: "Error voting", variant: "destructive" });
        }
    };

    // Comment Actions
    const handleCommentLikeToggle = async (post: PostType, commentId: string, isReply: boolean = false) => {
        if (!loggedInUser) return;

        const updatedComments = post.comments.map(comment => {
            if (isReply) {
                const updatedReplies = comment.replies.map(reply => {
                    if (reply.id === commentId) {
                        const isLiked = reply.likedBy.includes(loggedInUser.id);
                        const newLikedBy = isLiked
                            ? reply.likedBy.filter(id => id !== loggedInUser.id)
                            : [...reply.likedBy, loggedInUser.id];
                        return { ...reply, likedBy: newLikedBy, likes: newLikedBy.length };
                    }
                    return reply;
                });
                return { ...comment, replies: updatedReplies };
            } else {
                if (comment.id === commentId) {
                    const isLiked = comment.likedBy.includes(loggedInUser.id);
                    const newLikedBy = isLiked
                        ? comment.likedBy.filter(id => id !== loggedInUser.id)
                        : [...comment.likedBy, loggedInUser.id];
                    return { ...comment, likedBy: newLikedBy, likes: newLikedBy.length };
                }
                return comment;
            }
        });

        const updatedPost = { ...post, comments: updatedComments };
        updatePost(updatedPost);

        // TODO: Add backend logic for comment likes if not already present
        // const supabase = createClient();
        // await supabase.from('comment_likes')....
    }

    const handleCommentSubmit = async (post: PostType, commentText: string, parentCommentId?: string) => {
        if (!loggedInUser || isSubmittingCommentRef.current) return;
        isSubmittingCommentRef.current = true;

        const commenterUser = {
            id: loggedInUser.id,
            name: loggedInUser.name,
            username: loggedInUser.username,
            avatar: loggedInUser.avatar
        };

        const userId = loggedInUser.id; // stable capture

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

        updatePost(updatedPost);

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

            toast({ title: "Comment added", description: "Your comment has been posted." });
        } catch (error) {
            console.error("Error creating comment:", error);
            updatePost(post); // Revert
            toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
        } finally {
            isSubmittingCommentRef.current = false;
        }
    };

    const handleCommentPinToggle = async (post: PostType, commentId: string) => {
        if (!loggedInUser || post.author.id !== loggedInUser.id) return;

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
        updatePost(updatedPost);

        // TODO: Persist to backend
        toast({ title: "Comment pinned", description: "Comment pinned to the top" });
    };

    const handleCommentHideToggle = async (post: PostType, commentId: string, isReply: boolean = false) => {
        if (!loggedInUser || post.author.id !== loggedInUser.id) return;

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
        updatePost(updatedPost);

        // TODO: Persist to backend
        toast({ title: "Comment visibility updated" });
    };


    const handleCommentDelete = async (post: PostType, commentId: string, isReply: boolean = false, parentCommentId?: string) => {
        if (!loggedInUser) return;

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
        updatePost(updatedPost);

        const supabase = createClient();
        try {
            // Check if it's a real GUID (persisted) or temporary ID
            if (!commentId.startsWith('comment_') && !commentId.startsWith('reply_')) {
                await supabase.from('comments').delete().eq('id', commentId);
            }
            toast({ title: "Comment deleted" });
        } catch (error) {
            console.error('Error deleting comment:', error);
            updatePost(post); // Revert
            toast({ title: "Error deleting comment", variant: "destructive" });
        }
    }

    const handlePostPinToggle = async (post: PostType) => {
        if (!loggedInUser) {
            toast({ title: "Please log in to pin posts", variant: "destructive" });
            return;
        }

        if (post.author.id !== loggedInUser.id) {
            toast({ title: "You can only pin your own posts", variant: "destructive" });
            return;
        }

        // Optimistic update
        const updatedPost = {
            ...post,
            isPinned: !post.isPinned
        };
        updatePost(updatedPost);

        const supabase = createClient();
        try {
            const { data, error } = await supabase.rpc('toggle_pin_post', {
                p_post_id: parseInt(post.id)
            });

            if (error) throw error;

            if (!data.success) {
                // Revert on failure
                updatePost(post);
                toast({ title: data.message, variant: "destructive" });
                return;
            }

            toast({ title: data.is_pinned ? "📌 Post pinned to profile" : "Post unpinned" });
        } catch (error) {
            console.error('Error toggling pin:', error);
            updatePost(post);
            toast({ title: "Error pinning post", variant: "destructive" });
        }
    };

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

