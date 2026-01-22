
'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "./follow-button";
import { UserCard } from "./user-card";
import { PostDetailDialog } from "../../../components/post-detail-dialog";
import type { Profile } from "@/types";
import type { Post, User, Message as Comment } from "@/lib/types";
import { Grid3x3, Heart, MessageCircle } from "lucide-react";
import { useAppContext } from "@/providers/app-provider";

interface ProfileViewProps {
  profile: Profile;
  posts: Post[]; // Expecting richer Post type
  followers: User[];
  following: User[];
  session: any;
}

function PostGrid({ posts, onPostClick }: { posts: Post[]; onPostClick: (post: Post) => void; }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-12">
        <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-semibold">No posts yet</p>
        <p className="text-sm mt-1">When they post, you'll see their photos here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map(post => {
        // Determine image/media URL
        const mediaUrl = post.image_url || (post.media_urls && post.media_urls.length > 0 ? post.media_urls[0].url : null);
        const isVideo = mediaUrl?.match(/\.(mp4|webm|mov)$/i);

        if (!mediaUrl) {
          // Text-only post fallback
          return (
            <button
              key={post.id}
              onClick={() => onPostClick(post)}
              className="relative group aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm bg-muted flex items-center justify-center p-2 text-center"
            >
              <div className="text-xs text-muted-foreground line-clamp-3 leading-tight px-1">
                {post.content}
              </div>
            </button>
          );
        }

        return (
          <button
            key={post.id}
            onClick={() => onPostClick(post)}
            className="relative group aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm bg-black"
          >
            {isVideo ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                loop
                playsInline
                onMouseOver={e => e.currentTarget.play()}
                onMouseOut={e => e.currentTarget.pause()}
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Post thumbnail"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            )}

            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
              <div className="text-white flex items-center space-x-4">
                <div className="flex items-center font-semibold">
                  <Heart className="w-5 h-5 mr-1.5 fill-white" />
                  {post.stats?.likes || 0}
                </div>
                <div className="flex items-center font-semibold">
                  <MessageCircle className="w-5 h-5 mr-1.5 fill-white" />
                  {post.stats?.comments || 0}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ProfileView({ profile, posts, followers, following, session }: ProfileViewProps) {
  // Helper to construct avatar URL
  const getAvatarUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    // Assuming 'attachments' bucket based on user screenshot
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${url}`;
  };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  // Import BadgeCheck inside component or top level? Top level preferred but I can't add imports easily with replace_content unless I include top.
  // I'll add `import { ... BadgeCheck }` via top level update or use existing imports.
  // Existing imports: Grid3x3, Heart, MessageCircle. I need BadgeCheck.

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPostDialogOpen(true);
  };

  // Convert Profile to User format for PostDetailDialog
  const profileUser: User = {
    id: profile.id,
    username: profile.username,
    name: profile.full_name || profile.username,
    avatar_url: getAvatarUrl(profile.avatar_url) || '',
    is_admin: false,
    is_verified: profile.verified || false
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <PostDetailDialog
        open={isPostDialogOpen}
        onOpenChange={setIsPostDialogOpen}
        post={selectedPost}
        author={selectedPost?.author ? { ...selectedPost.author, is_admin: false } as User : profileUser}
        initialComments={[]}
      />

      <div className="flex flex-col items-center md:flex-row md:items-start space-x-0 md:space-x-8 mb-8">
        <Avatar className="h-32 w-32 mb-4 md:mb-0">
          <AvatarImage src={getAvatarUrl(profile.avatar_url)} alt={`${profile.username}'s avatar`} className="object-cover" />
          <AvatarFallback className="text-4xl">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.username}
              {profile.verified && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-blue-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </h1>
            {session?.user && session.user.id !== profile.id && (
              <FollowButton
                profileId={profile.id}
                currentUserId={session.user.id}
                initialStatus={
                  profile.follow_status === 'approved' ? 'approved' :
                    profile.follow_status === 'pending' ? 'pending' :
                      profile.is_following ? 'approved' : 'none'
                }
              />
            )}
          </div>

          <div className="flex justify-center md:justify-start space-x-8 mb-4">
            <div className="text-center md:text-left">
              <span className="font-bold block text-lg">{posts?.length || 0}</span>
              <span className="text-muted-foreground text-sm">posts</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-bold block text-lg">{profile.follower_count}</span>
              <span className="text-muted-foreground text-sm">followers</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-bold block text-lg">{profile.following_count}</span>
              <span className="text-muted-foreground text-sm">following</span>
            </div>
          </div>

          <div className="max-w-md mx-auto md:mx-0">
            <p className="font-semibold">{profile.full_name}</p>
            <p className="whitespace-pre-wrap">{profile.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-around border-t rounded-none h-12 bg-transparent">
          <TabsTrigger value="posts" className="flex-1 rounded-none data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase text-xs tracking-widest">
            <Grid3x3 className="h-4 w-4 mr-2" /> Posts
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex-1 rounded-none data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase text-xs tracking-widest">
            Followers
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1 rounded-none data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase text-xs tracking-widest">
            Following
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
          <PostGrid posts={posts} onPostClick={handlePostClick} />
        </TabsContent>
        <TabsContent value="followers">
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="font-semibold">Feature Coming Soon</p>
            <p className="text-sm">Follower list is under development.</p>
          </div>
        </TabsContent>
        <TabsContent value="following">
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="font-semibold">Feature Coming Soon</p>
            <p className="text-sm">Following list is under development.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
