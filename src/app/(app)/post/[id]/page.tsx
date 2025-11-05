'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/providers/app-provider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, Loader2, MessageSquare, Repeat2, Heart, BarChart2, Upload, MoreHorizontal, Trash2, Edit2, Repeat, Quote } from 'lucide-react';
import { PostCard, PostSkeleton } from '../../explore/components/post-card';
import { CreatePost } from '../../explore/components/create-post';
import { Separator } from '@/components/ui/separator';
import { Post, Comment } from '@/lib';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const POST_QUERY = `
  id,
  user_id,
  content,
  media_urls,
  poll,
  quote_of_id,
  created_at,
  author:user_id (*),
  quote_of:quote_of_id (*, author:user_id (*), media_urls),
  comments (
    *,
    author:user_id (*),
    likes:comment_likes (user_id),
    replies:comments!parent_comment_id (
      *,
      author:user_id (*),
      likes:comment_likes (user_id)
    )
  ),
  likes:post_likes (user_id),
  reposts:post_reposts (user_id)
`;
// --- END ---

// This is the main detail card for the post
function PostDetailCard({ post }: { post: Post }) {
  const { loggedInUser, togglePostLike, repostPost, openQuoteDialog } = useAppContext();
  
  // These are copied from PostCard
  const isLiked = useMemo(() => {
    if (!loggedInUser) return false;
    return post.likes.includes(loggedInUser.id);
  }, [post.likes, loggedInUser]);

  const isReposted = useMemo(() => {
    if (!loggedInUser) return false;
    return post.reposts.includes(loggedInUser.id);
  }, [post.reposts, loggedInUser]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof post.id === 'number') {
      togglePostLike(post);
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof post.id === 'number') {
      repostPost(post);
    }
  };
  
  const handleQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openQuoteDialog(post);
  };
  
  // We'll just re-use the PostCard for now.
  // We can build a more detailed card later.
  return <PostCard post={post} />;
}


// This is the main page component
export default function SinglePostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { posts, isReady } = useAppContext();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  const postId = Number(params.id);

  useEffect(() => {
    if (!isReady) return;
    if (isNaN(postId)) {
        notFound();
        return;
    }

    // Check if we already have the post in context
    const postFromContext = posts.find(p => p.id === postId);
    if (postFromContext) {
      setPost(postFromContext);
      setIsLoading(false);
    } else {
      // If not, fetch it
      const fetchPost = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select(POST_QUERY) // Use the same global query
          .eq('id', postId)
          .single();
        
        if (error || !data) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch post.' });
          notFound();
        } else {
          // We need to format it just like in the provider
          const formattedPost = formatPost(data);
          setPost(formattedPost);
        }
        setIsLoading(false);
      };
      fetchPost();
    }
  }, [postId, posts, isReady, supabase, toast]);
  
  // --- This is temporary, from app-provider ---
  const formatPost = (post: any): Post => {
    const comments = (post.comments || []).map((comment: any) => ({
      ...comment,
      author: comment.author,
      likes: (comment.likes || []).length,
      likedBy: (comment.likes || []).map((l: any) => l.user_id),
      replies: (comment.replies || []).map((reply: any) => ({
        ...reply,
        author: reply.author,
        likes: (reply.likes || []).length,
        likedBy: (reply.likes || []).map((l: any) => l.user_id),
      }))
    })).sort((a: Comment, b: Comment) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const likes = (post.likes || []).map((l: any) => l.user_id);
    const reposts = (post.reposts || []).map((r: any) => r.user_id);

    return {
      ...post,
      media_urls: post.media_urls || [],
      likes: likes,
      reposts: reposts,
      stats: {
        comments: comments.reduce((acc: number, c: any) => acc + 1 + (c.replies?.length || 0), 0),
        likes: likes.length,
        reposts: reposts.length,
        quotes: 0,
        views: 0,
        bookmarks: 0
      },
      comments: comments,
      author: post.author,
      quote_of: post.quote_of_id ? { ...post.quote_of, author: post.quote_of.author } : undefined
    }
  }
  // --- End temporary function ---

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <SidebarTrigger className="md:hidden" />
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold tracking-tight">Post</h2>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <main className="max-w-2xl mx-auto">
          {isLoading || !post ? (
            <PostSkeleton />
          ) : (
            <>
              {/* This is the main post */}
              <PostDetailCard post={post} />
              
              <Separator />
              
              {/* This is the reply box */}
              <CreatePost />
              
              <Separator />

              {/* This is the list of comments */}
              <div>
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    // We can replace this with a dedicated CommentCard later
                    <PostCard key={comment.id} post={comment as any} /> // Temporary cast
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-muted-foreground">
                      No comments yet.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </ScrollArea>
    </div>
  );
}