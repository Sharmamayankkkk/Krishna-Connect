
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "./follow-button";
import { UserCard } from "./user-card";
import type { Profile, Post, User, UserSession } from "@/types";

interface ProfileViewProps {
  profile: Profile;
  posts: Post[];
  followers: User[];
  following: User[];
  session: UserSession;
}

export function ProfileView({ profile, posts, followers, following, session }: ProfileViewProps) {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center md:flex-row md:items-start space-x-0 md:space-x-8">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile.avatar_url || ''} alt={`${profile.username}'s avatar`} />
          <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          <p className="mt-4">{profile.bio || "No bio yet."}</p>
          <div className="flex justify-center md:justify-start space-x-4 mt-4">
            <div>
              <span className="font-bold">{profile.follower_count}</span> Followers
            </div>
            <div>
              <span className="font-bold">{profile.following_count}</span> Following
            </div>
          </div>
          {session?.user?.id !== profile.id && (
            <FollowButton 
              profileId={profile.id} 
              isFollowing={profile.is_following} 
              currentUserId={session.user.id} 
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-8">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg">
                  <p>{post.content}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8">No posts yet.</p>
          )}
        </TabsContent>
        <TabsContent value="followers">
          {followers && followers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followers.map((user) => <UserCard key={user.id} user={user} />)}
            </div>
          ) : (
            <p className="text-center py-8">Not following anyone yet.</p>
          )}
        </TabsContent>
        <TabsContent value="following">
          {following && following.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {following.map((user) => <UserCard key={user.id} user={user} />)}
            </div>
          ) : (
            <p className="text-center py-8">No followers yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
