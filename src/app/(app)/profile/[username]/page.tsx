import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { ProfileView } from "./components/profile-view";
import { User, Session } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata(
  props: ProfilePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const { username } = params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch profile for metadata - try case insensitive match
  // We use a simpler fetch here than the main page for performance
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, username, bio, avatar_url, banner_url')
    .ilike('username', username)
    .maybeSingle();

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  const displayName = profile.name || profile.username;
  const title = `${displayName} (@${profile.username}) | Krishna Connect`;
  const description = profile.bio || `Check out ${displayName}'s profile on Krishna Connect.`;

  // Construct absolute image URL for OG
  let imageUrl = 'logo\Srila-Prabhupada.png'; // Fallback
  if (profile.avatar_url) {
    if (profile.avatar_url.startsWith('http')) {
      imageUrl = profile.avatar_url;
    } else {
      imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${profile.avatar_url}`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: 'profile',
      username: profile.username,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    }
  };
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params;
  const { username } = params;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Get the current user's session securely
  const { data: { user } } = await supabase.auth.getUser();


  // Fetch the profile data
  let { data: profile } = await supabase
    .rpc('get_profile_by_username', {
      p_username: username,
      p_requesting_user_id: user?.id,
    })
    .single() as { data: Profile | null };

  if (!profile) {
    // Fallback: Fetch profiles directly and match in memory
    // This bypasses potential DB collation or RPC weirdness
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(100);

    const foundMatch = allProfiles?.find(p =>
      p.username && p.username.toLowerCase() === username.toLowerCase()
    );

    if (foundMatch) {
      // Retry RPC with exact username from DB
      const { data: retryProfile } = await supabase
        .rpc('get_profile_by_username', {
          p_username: foundMatch.username,
          p_requesting_user_id: user?.id,
        })
        .single() as { data: Profile | null };

      if (retryProfile) {
        profile = retryProfile;
      } else {
        // If RPC still fails, use the raw profile data
        // We'll mock the missing counts for now to allow the page to render
        profile = {
          ...foundMatch,
          // Map potential column names for bio and verified
          bio: foundMatch.bio || foundMatch.description || '',
          verified: foundMatch.is_verified || foundMatch.verified || false,
          banner_url: foundMatch.banner_url || null,
          location: foundMatch.location || null,
          website: foundMatch.website || null,
          created_at: foundMatch.created_at || null,
          follower_count: 0,
          following_count: 0,
          post_count: 0,
          is_following: false,
          follow_status: 'none'
        } as Profile;
      }
    }
  }

  if (!profile) {
    // Fetch suggested users for the 404 page
    const { data: suggestedUsers } = await supabase.rpc('get_who_to_follow', { limit_count: 3 });

    let enhancedUsers = [];
    if (suggestedUsers) {
      enhancedUsers = suggestedUsers.map((u: any) => ({
        ...u,
        followers: u.followers_count,
        avatar: u.avatar_url || '/placeholder-user.jpg'
      }));
    }

    // Import Client Components
    const { UserX } = await import("lucide-react");
    const { Card } = await import("@/components/ui/card");
    const { SuggestedUsersSection } = await import("./components/suggested-users-section");
    const { GoogleAd } = await import("@/components/ads/google-ad");

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center animate-in fade-in duration-500">
        <Card className="w-full max-w-md p-8 shadow-lg border-muted">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-4 bg-muted/50 rounded-full ring-8 ring-muted/20">
              <UserX className="h-12 w-12 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Profile Not Found</h1>
              <p className="text-muted-foreground text-sm">
                The user <strong>@{username}</strong> could not be found. They may have changed their username or deleted their account.
              </p>
            </div>

            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/explore">
                Go to Explore
              </Link>
            </Button>
          </div>
        </Card>

        {/* Suggested Users Section */}
        {enhancedUsers.length > 0 && (
          <SuggestedUsersSection users={enhancedUsers} />
        )}

        {/* Google Ad Unit */}
        <div className="w-full max-w-2xl mt-8">
          <p className="text-xs text-muted-foreground mb-2 text-center uppercase tracking-widest">Advertisement</p>
          <GoogleAd
            slot="6010040695"
            client="ca-pub-4172622079471868"
          />
        </div>
      </div>
    );
  }

  // Fetch the data for the tabs
  let posts: any[] = [];
  let repostedPosts: any[] = [];
  let followers: any[] = [];
  let following: any[] = [];

  // Consistent Select Query (Same as feed.tsx and post-view.tsx)
  const POST_SELECT_QUERY = `
    *,
    author:user_id (id, name, username, avatar_url, verified),
    likes:post_likes(count),
    comments:comments(count),
    reposts:post_reposts(count),
    post_comments:comments (
        id,
        user_id,
        content,
        created_at,
        profiles:user_id (id, name, username, avatar_url, verified)
    ),
    quote_of:quote_of_id (
        *,
        author:user_id (id, name, username, avatar_url, verified),
        media_urls
    ),
    user_likes:post_likes!post_id(user_id),
    post_collaborators:post_collaborators!post_id (
        user_id,
        status,
        user:user_id (id, name, username, avatar_url, verified)
    ),
    views:post_views(count)
  `;

  try {
    const { data } = await supabase
      .rpc('get_posts_by_user_id', {
        p_user_id: profile.id,
        p_limit: 50,
        p_offset: 0
      })
      .select(POST_SELECT_QUERY);

    if (data) {
      // Transform the data to match the component's expected format (Post type)
      // Use the standardized transformPost utility
      const { transformPost } = await import("@/lib/post-utils");

      posts = data.map((post: any) => transformPost({
        ...post,
      }));
    }
  } catch (e) {
    console.error("Error fetching profile posts:", e);
  }

  // Fetch reposted posts
  try {
    const { data: repostData } = await supabase
      .from('post_reposts')
      .select('post_id')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (repostData && repostData.length > 0) {
      const repostIds = repostData.map((r: any) => r.post_id);
      const { data: repostPostsData } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY)
        .in('id', repostIds);

      if (repostPostsData) {
        const { transformPost } = await import("@/lib/post-utils");
        repostedPosts = repostPostsData.map((post: any) => transformPost(post));
      }
    }
  } catch (e) {
    console.error("Error fetching reposted posts:", e);
  }

  // We skip followers/following for now as tabs are "Coming Soon"

  // Fetch Leela videos for this user
  let leelaVideos: any[] = [];
  try {
    const { data: leelaData } = await supabase
      .rpc('get_user_leela_videos', {
        p_user_id: profile.id,
        p_limit: 30,
        p_offset: 0
      });
    if (leelaData) {
      leelaVideos = leelaData;
    }
  } catch (e) {
    console.error("Error fetching leela videos:", e);
  }

  return (
    <ProfileView
      profile={profile}
      posts={posts}
      repostedPosts={repostedPosts}
      leelaVideos={leelaVideos}
      followers={followers}
      following={following}
      currentUser={user}
    />

  );
}