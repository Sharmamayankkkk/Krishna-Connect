
'use client';

import { useState } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { dummyPosts, PostType } from '../data';
import { PostCard } from '../components/post-card';
import { Separator } from "@/components/ui/separator";
import { CreatePost } from '../components/create-post';
import { useAppContext } from '@/providers/app-provider';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PostsFeedPage() {
  const { loggedInUser } = useAppContext();
  const [posts, setPosts] = useState<PostType[]>(dummyPosts);

  const handlePostCreated = (content: string) => {
    if (!loggedInUser) return;

    const newPost: PostType = {
      id: `post_${Date.now()}`,
      author: {
        id: loggedInUser.id,
        name: loggedInUser.name,
        username: loggedInUser.username,
        avatar: loggedInUser.avatar_url,
      },
      createdAt: new Date().toISOString(),
      content: content,
      media: [],
      stats: { comments: 0, reshares: 0, likes: 0, views: 0 },
      comments: [],
    };

    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleCommentCreated = (postId: string, commentText: string) => {
    if (!loggedInUser) return;

    const newComment = {
        id: `comment_${Date.now()}`,
        user: {
            id: loggedInUser.id,
            name: loggedInUser.name,
            username: loggedInUser.username,
            avatar: loggedInUser.avatar_url
        },
        text: commentText,
        isPinned: false,
        likes: 0
    };

    setPosts(prevPosts => 
        prevPosts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: [...post.comments, newComment],
                    stats: {
                        ...post.stats,
                        comments: post.stats.comments + 1
                    }
                };
            }
            return post;
        })
    );
  };


  return (
    <div className="flex h-full flex-col">
       <header className="flex items-center gap-4 p-4 border-b bg-background sticky top-0 z-10">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-xl font-bold tracking-tight">Home</h2>
      </header>
      <ScrollArea className="flex-1">
        <div className="p-4 border-b">
           <CreatePost onPostCreated={handlePostCreated} />
        </div>

        <div>
            {posts.map((post, index) => (
                <div key={post.id}>
                    <PostCard post={post} onComment={handleCommentCreated} />
                    {index < posts.length - 1 && <Separator />}
                </div>
            ))}
        </div>

         {/* Placeholder for infinite scroll loader */}
        <div className="p-4 text-center text-muted-foreground">
            Loading more posts...
        </div>
      </ScrollArea>
    </div>
  )
}
