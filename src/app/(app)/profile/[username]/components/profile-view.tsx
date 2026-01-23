'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "./follow-button";
import { EditProfileDialog } from "./edit-profile-dialog";
import { ReportDialog } from "./report-dialog";
import { PostDetailDialog } from "../../../components/post-detail-dialog";
import type { Profile } from "@/types";
import type { Post, User } from "@/lib/types";
import {
  ArrowLeft,
  CalendarDays,
  Link as LinkIcon,
  MapPin,
  MoreHorizontal,
  Mail,
  Flag,
  Ban,
  Loader2,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PostCard } from "@/app/(app)/explore/components/post-card";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PrivateContentPlaceholder } from "@/components/private-placeholders";
import { AuthGate } from "@/components/auth-gate";

interface ProfileViewProps {
  profile: Profile;
  posts: Post[];
  followers: any[];
  following: any[];
  session: any;
}

export function ProfileView({ profile, posts, followers, following, session }: ProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isBannerViewerOpen, setIsBannerViewerOpen] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const handleMessage = async () => {
    if (!session?.user) return;
    setIsMessageLoading(true);
    console.log("Debug HandleMessage:", { targetId: profile.id, userId: session.user.id });
    try {
      // Check for existing DM
      const { data: chatId, error } = await supabase.rpc('get_dm_chat_id', {
        target_user_id: profile.id
      });

      if (chatId) {
        router.push(`/chat/${chatId}`);
        return;
      }

      // Create new DM if none exists
      const { data: newChatId, error: createError } = await supabase.rpc('create_dm_chat', {
        target_user_id: profile.id
      });

      if (createError) throw createError;
      if (newChatId) {
        router.push(`/chat/${newChatId}`);
      }
    } catch (error: any) {
      console.error('Error handling message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to start chat."
      });
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      toast({ title: "Post deleted" });
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
    }
  };

  const handleBlock = async () => {
    try {
      const { error } = await supabase.rpc('block_user', {
        target_user_id: profile.id
      });
      if (error) throw error;
      toast({ title: "Blocked", description: `@${profile.username} has been blocked.` });
      // Optionally redirect or refresh
      router.refresh();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to block user." });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} (@${profile.username})`,
          text: `Check out ${displayName}'s profile on Krishna Connect!`,
          url: url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Profile link copied to clipboard." });
      } catch (err) {
        console.error('Error copying link:', err);
        toast({ variant: "destructive", title: "Error", description: "Failed to copy link." });
      }
    }
  };

  // Helper to construct full URLs
  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${url}`;
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPostDialogOpen(true);
  };

  // Convert Profile to User format for PostDetailDialog
  const profileUser = {
    id: profile.id,
    username: profile.username,
    name: profile.name || profile.full_name || profile.username,
    avatar_url: getImageUrl(profile.avatar_url) || '',
    avatar: getImageUrl(profile.avatar_url) || '',
    is_admin: false,
    is_verified: profile.verified || false,
    verified: profile.verified || false
  };

  const isOwnProfile = session?.user?.id === profile.id;
  const displayName = profile.name || profile.full_name || profile.username;
  const joinDate = profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : null;

  // State for posts to allow local mutations (likes, deletes)
  const [localPosts, setLocalPosts] = useState<Post[]>(posts);

  const handleLike = async (postId: string) => {
    if (!session?.user) return;

    // Optimistic Update
    setLocalPosts(currentPosts => currentPosts.map(p => {
      if (p.id === postId) {
        // Cast to any to avoid type errors with likedBy
        const postAny = p as any;
        const isLiked = postAny.likedBy.includes(session.user.id);
        const newLikedBy = isLiked
          ? postAny.likedBy.filter((id: string) => id !== session.user.id)
          : [...postAny.likedBy, session.user.id];

        return {
          ...p,
          likedBy: newLikedBy,
          stats: {
            ...p.stats,
            likes: newLikedBy.length
          }
        } as Post;
      }
      return p;
    }));

    try {
      const { error } = await supabase.rpc('toggle_post_like', { p_post_id: Number(postId) });
      if (error) throw error;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update like." });
      router.refresh(); // Revert on error
    }
  };

  // Filter posts based on local state
  const userPosts = localPosts.filter(p => !(p as any).is_reply && !(p as any).parent_id);
  const userReplies = localPosts.filter(p => (p as any).is_reply || (p as any).parent_id);
  const mediaPosts = localPosts.filter(p => p.media_urls && p.media_urls.length > 0);

  return (
    <div className="min-h-screen">
      <PostDetailDialog
        open={isPostDialogOpen}
        onOpenChange={setIsPostDialogOpen}
        post={selectedPost}
        author={selectedPost?.author ? { ...selectedPost.author, is_admin: false } as User : profileUser}
        initialComments={[]}
      />

      {isOwnProfile && (
        <EditProfileDialog
          open={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          profile={profile}
        />
      )}

      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        targetUserId={profile.id}
        targetUsername={profile.username}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-6 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg leading-tight flex items-center gap-1">
              {displayName}
              {profile.verified && (
                <Image
                  src="/user_Avatar/verified.png"
                  alt="Verified"
                  width={18}
                  height={18}
                  className="inline-block"
                />
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.post_count || posts.length} posts
            </p>
          </div>
        </div>
      </header>

      {/* Banner Image */}
      <div
        className="relative w-full bg-slate-800 cursor-pointer aspect-[16/9] md:aspect-auto md:h-[320px]"
        onClick={() => setIsBannerViewerOpen(true)}
      >
        <Image
          src={profile.banner_url ? (getImageUrl(profile.banner_url) || '/background/banner.png') : '/background/banner.png'}
          alt="Profile banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      {isBannerViewerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setIsBannerViewerOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-colors"
            onClick={() => setIsBannerViewerOpen(false)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={profile.banner_url ? (getImageUrl(profile.banner_url) || '/background/banner.png') : '/background/banner.png'}
            alt="Profile banner"
            width={1200}
            height={675}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Profile Info Section */}
      <div className="px-4 pb-3">
        <div className="flex justify-between items-start">
          <div className="-mt-16 sm:-mt-20">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background bg-background">
              <AvatarImage
                src={getImageUrl(profile.avatar_url)}
                alt={`${profile.username}'s avatar`}
                className="object-cover"
              />
              <AvatarFallback className="text-3xl sm:text-4xl bg-muted">
                {profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-full font-semibold"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  Edit profile
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                      <Ban className="mr-2 h-4 w-4" />
                      Block @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report @{profile.username}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>

                <AuthGate>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={handleMessage}
                    disabled={isMessageLoading}
                  >
                    {isMessageLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                  </Button>
                </AuthGate>

                {session?.user ? (
                  <FollowButton
                    profileId={profile.id}
                    currentUserId={session.user.id}
                    initialStatus={
                      profile.follow_status === 'approved' ? 'approved' :
                        profile.follow_status === 'pending' ? 'pending' :
                          profile.is_following ? 'approved' : 'none'
                    }
                    className="rounded-full font-semibold"
                  />
                ) : (
                  <AuthGate>
                    <Button className="rounded-full font-semibold">
                      Follow
                    </Button>
                  </AuthGate>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-bold flex items-center gap-1">
            {displayName}
            {profile.verified && (
              <Image
                src="/user_Avatar/verified.png"
                alt="Verified"
                width={20}
                height={20}
                className="inline-block"
              />
            )}
          </h2>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm sm:text-base whitespace-pre-wrap">{profile.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {joinDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Joined {joinDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3">
          <Link href={`/profile/${profile.username}/connections?type=following`} className="hover:underline">
            <span className="font-bold">{profile.following_count || 0}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </Link>
          <Link href={`/profile/${profile.username}/connections?type=followers`} className="hover:underline">
            <span className="font-bold">{profile.follower_count || 0}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </Link>
        </div>
      </div>

      {/* Private Account Lock Screen OR Public Feed */}
      {(profile.is_private && !profile.is_following && !isOwnProfile) ? (
        <PrivateContentPlaceholder
          isProfile
          displayName={displayName}
          username={profile.username}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-0 bg-transparent border-b rounded-none justify-start">
            <TabsTrigger value="posts" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Posts
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Replies
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Media
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {userPosts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xl font-bold mb-1">No posts yet</p>
                <p className="text-muted-foreground">When {isOwnProfile ? 'you post' : `@${profile.username} posts`}, it will show up here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
                      createdAt: (post as any).createdAt || (post as any).created_at,
                      likedBy: (post as any).likedBy || [],
                      repostedBy: (post as any).repostedBy || [],
                      author: post.author ? { ...post.author, avatar: (post.author as any).avatar || (post.author as any).avatar_url } : profileUser,
                      media: post.media_urls || []
                    } as any}
                    onDelete={handleDeletePost}
                    onLike={handleLike}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-0">
            {userReplies.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xl font-bold mb-1">No replies yet</p>
                <p className="text-muted-foreground">When {isOwnProfile ? 'you reply' : `@${profile.username} replies`} to a post, it will show up here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {userReplies.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
                      createdAt: (post as any).createdAt || (post as any).created_at,
                      likedBy: (post as any).likedBy || [],
                      repostedBy: (post as any).repostedBy || [],
                      author: post.author ? { ...post.author, avatar: (post.author as any).avatar || (post.author as any).avatar_url } : profileUser,
                      media: post.media_urls || []
                    } as any}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            {mediaPosts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xl font-bold mb-1">No media yet</p>
                <p className="text-muted-foreground">Photos and videos will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {mediaPosts.map((post) => {
                  const mediaUrl = post.media_urls?.[0]?.url || post.image_url;
                  return mediaUrl ? (
                    <button
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="aspect-square relative overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={mediaUrl}
                        alt="Media"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="py-12 text-center">
              <p className="text-xl font-bold mb-1">Coming Soon</p>
              <p className="text-muted-foreground">Liked posts will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
