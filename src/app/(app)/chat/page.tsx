
'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { dummyPosts, PostType } from '../data';
import { PostCard } from '../components/post-card';
import { Separator } from "@/components/ui/separator";

export default function PostsFeedPage() {
  return (
    <div className="flex h-full flex-col">
       <header className="flex items-center gap-4 p-4 border-b bg-background sticky top-0 z-10">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-xl font-bold tracking-tight">Home</h2>
      </header>
      <main className="flex-1 overflow-y-auto">
        {/* Placeholder for 'Create Post' component */}
        <div className="p-4 border-b">
           <p className="text-muted-foreground">"What's happening?" component will go here.</p>
        </div>

        <div>
            {dummyPosts.map((post, index) => (
                <div key={post.id}>
                    <PostCard post={post} />
                    {index < dummyPosts.length - 1 && <Separator />}
                </div>
            ))}
        </div>

         {/* Placeholder for infinite scroll loader */}
        <div className="p-4 text-center text-muted-foreground">
            Loading more posts...
        </div>
      </main>
    </div>
  )
}
