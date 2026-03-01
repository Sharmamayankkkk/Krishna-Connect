'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/providers/app-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "./follow-button";
import { EditProfileDialog } from "./edit-profile-dialog";
import { ReportDialog } from "./report-dialog";
import { PostDetailDialog } from "@/components/features/posts/dialogs/post-detail-dialog";
import type { Profile } from "@/types";
import type { Post, User, PostType } from "@/lib/types";
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
  Share2,
  Pin,
  Play,
  Trash2,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/features/posts/post-card";
import { FeedList } from "@/components/features/posts/feed-list";
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
import { usePostInteractions } from "@/hooks/use-post-interactions";
import { transformPost } from "@/lib/post-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { GoogleAd } from '@/components/ads/google-ad';
import { UploadLeelaFab } from '@/components/features/leela/upload-leela-fab';
import { TrophyCase } from './trophy-case';

interface LeelaVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface ProfileViewProps {
  profile: Profile;
  posts: PostType[];
  repostedPosts: PostType[];
  leelaVideos?: LeelaVideo[];
  followers: any[];
  following: any[];
  currentUser: any;
}

export function ProfileView({ profile, posts, repostedPosts, leelaVideos = [], followers, following, currentUser: serverUser }: ProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { loggedInUser: clientUser } = useAppContext();

  // Use client-side user if server-side user is missing (fixes hydration/cookie issues)
  const currentUser = serverUser || (clientUser ? { ...clientUser, id: clientUser.id } : null);

  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isBannerViewerOpen, setIsBannerViewerOpen] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [displayedLeelaVideos, setDisplayedLeelaVideos] = useState(leelaVideos);

  const canViewConnections = !profile.is_private || profile.is_following || (currentUser?.id === profile.id);
  const canMessage = !profile.is_private || profile.is_following;

  const handleMessage = async () => {
    if (!currentUser) return;
    setIsMessageLoading(true);
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

  // Fetch actual challenge points from the profile object, fallback to 0
  const challengePoints = profile.challenge_points || 0;

  // Convert Profile to User format for PostDetailDialog
  const profileUser = {
    id: profile.id,
    username: profile.username,
    name: profile.name || profile.full_name || profile.username,
    avatar_url: getImageUrl(profile.avatar_url) || '',
    avatar: getImageUrl(profile.avatar_url) || '',
    is_admin: false,
    is_verified: profile.verified || 'none',
    verified: profile.verified || 'none',
    user_metadata: {}
  } as User;

  const isOwnProfile = currentUser?.id === profile.id;

  /* 
    Debug Logs removed. 
    Use console.log locally if issue persists.
  */

  const displayName = profile.name || profile.full_name || profile.username;
  const joinDate = profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : null;

  const handleDeleteLeela = async (videoId: string) => {
    if (!currentUser || currentUser.id !== profile.id) return;
    const video = displayedLeelaVideos.find(v => v.id === videoId);
    if (!video) return;

    // Optimistically remove from UI
    setDisplayedLeelaVideos(prev => prev.filter(v => v.id !== videoId));

    // Delete from storage
    if (video.video_url.includes('/leela/')) {
      const pathMatch = video.video_url.match(/\/leela\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from('leela').remove([pathMatch[1]]);
      }
    }

    // Delete from database
    const { error } = await supabase.from('leela_videos').delete().eq('id', videoId);
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
      setDisplayedLeelaVideos(leelaVideos); // Restore on error
    } else {
      toast({ title: 'Leela deleted' });
    }
  };

  // State for posts to allow local mutations (likes, deletes)
  const [localPosts, setLocalPosts] = useState<PostType[]>(posts);

  const loggedInUser = currentUser ? {
    id: currentUser.id,
    name: currentUser.user_metadata?.name || currentUser.email,
    username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0],
    avatar: currentUser.user_metadata?.avatar_url || ''
  } : null;

  const updatePost = (updatedPost: PostType) => {
    setLocalPosts((prev: any[]) => prev.map((p) => p.id === updatedPost.id ? updatedPost : p));
  };

  const {
    handlePostLikeToggle,
    handleRepost,
    handlePostSaveToggle,
    handlePostDeleted,
    handlePollVote,
    handleCommentSubmit,
    handleCommentLikeToggle,
    handleCommentDelete,
    handleCommentPinToggle,
    handleCommentHideToggle,
    handlePostPinToggle
  } = usePostInteractions({
    loggedInUser,
    updatePost,
    onDeletePost: (postId) => {
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  });

  const handleDeletePost = (id: string) => {
    handlePostDeleted(id);
  };

  // Filter posts based on local state
  const userPosts = localPosts.filter(p => !(p as any).is_reply && !(p as any).parent_id);
  const userReplies = localPosts.filter(p => (p as any).is_reply || (p as any).parent_id);
  const pinnedPosts = userPosts.filter(p => (p as any).isPinned || (p as any).pinned_at);
  const unpinnedPosts = userPosts.filter(p => !(p as any).isPinned && !(p as any).pinned_at);

  // Handler wrapper for pin toggle
  const handlePinPost = (post: PostType) => {
    handlePostPinToggle(post);
  };

  return (
    <div className="min-h-screen">
      <PostDetailDialog
        open={isPostDialogOpen}
        onOpenChange={setIsPostDialogOpen}
        post={selectedPost as any}
        author={selectedPost?.author ? {
          ...selectedPost.author,
          avatar_url: selectedPost.author.avatar,
          is_admin: false,
          user_metadata: {}
        } as unknown as User : profileUser}
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
              <VerificationBadge verified={profile.verified} size={18} className="inline-block" />
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
                  {canMessage ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={handleMessage}
                      disabled={isMessageLoading}
                    >
                      {isMessageLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button variant="outline" size="icon" className="rounded-full" disabled>
                              <Mail className="h-5 w-5" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Follow to message</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </AuthGate>

                {currentUser ? (
                  <FollowButton
                    profileId={profile.id}
                    currentUserId={currentUser.id}
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
            <VerificationBadge verified={profile.verified} size={20} className="inline-block" />
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
          {canViewConnections ? (
            <Link href={`/profile/${profile.username}/connections?type=following`} className="hover:underline">
              <span className="font-bold">{profile.following_count || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </Link>
          ) : (
            <div className="cursor-default opacity-70">
              <span className="font-bold">{profile.following_count || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
          )}

          {canViewConnections ? (
            <Link href={`/profile/${profile.username}/connections?type=followers`} className="hover:underline">
              <span className="font-bold">{profile.follower_count || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </Link>
          ) : (
            <div className="cursor-default opacity-70">
              <span className="font-bold">{profile.follower_count || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full cursor-pointer hover:bg-primary/20 transition-colors">
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="font-bold text-sm">{challengePoints}</span>
                  <span className="text-xs font-medium">pts</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-center">
                <p className="font-bold mb-1">Challenge Points</p>
                <p className="text-xs text-muted-foreground">Points earned from accepted challenge submissions. Rank up on the leaderboard!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Display earned Challenge Badges if applicable */}
        <TrophyCase userId={profile.id} />
      </div>

      {/* Private Account Lock Screen OR Public Feed */}
      {(profile.is_private && !profile.is_following && !isOwnProfile) ? (
        <PrivateContentPlaceholder
          isProfile
          displayName={displayName}
          username={profile.username}
        />
      ) : (
        <>
          {/* Pinned Posts Section */}
          {pinnedPosts.length > 0 && (
            <div className="border-b">
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Pin className="h-4 w-4" />
                <span className="font-semibold">Pinned</span>
              </div>
              <FeedList
                posts={pinnedPosts}
                isLoading={false}
                onPostUpdated={updatePost}
                onPostDeleted={handleDeletePost}
                onQuotePost={() => { }}
                onPromote={() => { }}
                onPin={isOwnProfile ? handlePinPost : undefined}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto p-0 bg-transparent border-b rounded-none justify-start">
              <TabsTrigger value="posts" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Posts
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Replies
              </TabsTrigger>
              <TabsTrigger value="reposts" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Reposts
              </TabsTrigger>
              <TabsTrigger value="leela" className="flex-1 py-4 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Leela
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              <FeedList
                posts={unpinnedPosts}
                isLoading={false}
                onPostUpdated={updatePost}
                onPostDeleted={handleDeletePost}
                onQuotePost={() => { }}
                onPromote={() => { }}
                onPin={isOwnProfile ? handlePinPost : undefined}
                emptyMessage={`When ${isOwnProfile ? 'you post' : `@${profile.username} posts`}, it will show up here.`}
              />
            </TabsContent>

            <TabsContent value="replies" className="mt-0">
              <FeedList
                posts={userReplies}
                isLoading={false}
                onPostUpdated={updatePost}
                onPostDeleted={handleDeletePost}
                onQuotePost={() => { }}
                onPromote={() => { }}
                emptyMessage={`When ${isOwnProfile ? 'you reply' : `@${profile.username} replies`} to a post, it will show up here.`}
              />
            </TabsContent>

            <TabsContent value="reposts" className="mt-0">
              <FeedList
                posts={repostedPosts}
                isLoading={false}
                onPostUpdated={updatePost}
                onPostDeleted={handleDeletePost}
                onQuotePost={() => { }}
                onPromote={() => { }}
                emptyMessage={`When ${isOwnProfile ? 'you repost' : `@${profile.username} reposts`}, it will show up here.`}
              />
            </TabsContent>

            <TabsContent value="leela" className="mt-0">
              {displayedLeelaVideos.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                  {displayedLeelaVideos.map((video) => (
                    <div key={video.id} className="relative aspect-[9/16] bg-muted overflow-hidden group">
                      <Link
                        href={`/leela?v=${video.id}`}
                        className="absolute inset-0"
                      >
                        {video.thumbnail_url ? (
                          <Image
                            src={video.thumbnail_url}
                            alt={video.caption || 'Leela video'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 200px"
                          />
                        ) : (
                          <video
                            src={video.video_url}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        )}
                        {/* Hover overlay with stats */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
                          <span className="flex items-center gap-1">
                            <Play className="h-4 w-4 fill-white" />
                            {video.view_count >= 1000 ? `${(video.view_count / 1000).toFixed(1)}K` : video.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            ♥ {video.like_count}
                          </span>
                        </div>
                        {/* Play icon */}
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-xs">
                          <Play className="h-3 w-3 fill-white" />
                          <span>{video.view_count >= 1000 ? `${(video.view_count / 1000).toFixed(1)}K` : video.view_count}</span>
                        </div>
                      </Link>
                      {isOwnProfile && (
                        <button
                          onClick={() => handleDeleteLeela(video.id)}
                          className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-red-400 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Delete Leela"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-lg font-semibold">
                    {isOwnProfile ? "Your Leela videos" : `@${profile.username}'s Leela videos`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {isOwnProfile
                      ? "Short-form videos you share will appear here."
                      : "Short-form videos will appear here."}
                  </p>
                  {isOwnProfile && (
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/leela">Create your first Leela</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Profile Sidebar Ad */}
          <div className="mt-6">
            <GoogleAd slot="8691086496" />
          </div>
        </>
      )}

      {/* Upload Leela FAB - shown on own profile */}
      {isOwnProfile && <UploadLeelaFab />}
    </div>
  );
}
