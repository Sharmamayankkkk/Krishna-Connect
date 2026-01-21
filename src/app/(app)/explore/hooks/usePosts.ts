import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PostType } from '@/app/(app)/types'

interface PostData {
  id: number;
  content: string;
  created_at: string;
  media: any;
  poll: any;
  quote_of_id: number | null;
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar: string;
  author_verified: boolean;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_liked: boolean;
  is_reposted: boolean;
  next_cursor: number;
}

const transformPostData = (post: PostData): PostType => {
  return {
    id: post.id.toString(),
    author: {
      id: post.user_id,
      name: post.author_name,
      username: post.author_username,
      avatar: post.author_avatar || '/user_Avatar/male.png',
      verified: post.author_verified
    },
    content: post.content,
    media: post.media || [],
    poll: post.poll,
    createdAt: post.created_at,
    stats: {
      comments: post.comments_count,
      reshares: 0,
      reposts: post.reposts_count,
      likes: post.likes_count,
      views: Math.floor(Math.random() * 1000) + 100,
      bookmarks: 0
    },
    comments: [],
    likedBy: post.is_liked ? [post.user_id] : [],
    savedBy: [],
    repostedBy: post.is_reposted ? [post.user_id] : [],
    originalPost: null
  };
};

const fetchPosts = async ({ pageParam = null }: { pageParam?: number | null }) => {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_posts_paginated', {
    p_limit: 20,
    p_cursor: pageParam,
    p_filter: 'for_you'
  });

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return { posts: [], nextCursor: null };
  }

  const posts = data.map(transformPostData);
  const nextCursor = data.length === 20 ? data[data.length - 1].next_cursor : null;

  return { posts, nextCursor };
};

export function usePosts(filter: string = 'for_you') {
  return useInfiniteQuery({
    queryKey: ['posts', filter],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    initialPageParam: null,
  });
}
