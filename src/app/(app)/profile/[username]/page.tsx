import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;


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
    console.error(`Profile not found for username: ${username}`);

    // Fetch all usernames for debugging display
    const { data: allProfiles } = await supabase.from('profiles').select('username').limit(50);
    const availableUsernames = allProfiles?.map(p => p.username).join(', ') || 'None found';

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Profile Not Found</h1>
        <p className="text-lg">We couldn't find a user with the username: <strong>"{username}"</strong></p>

        <div className="p-4 bg-muted rounded-lg text-sm text-left max-w-md w-full overflow-hidden">
          <p className="font-semibold mb-2">Debug Information:</p>
          <p><strong>Requested Username:</strong> "{username}"</p>
          <p><strong>Decoded Username:</strong> "{decodeURIComponent(username)}"</p>
          <p className="mt-2"><strong>Available Profiles in DB (First 50):</strong></p>
          <p className="text-muted-foreground break-words">{availableUsernames}</p>
        </div>

        <Button asChild className="mt-4">
          <Link href="/explore">Go to Explore</Link>
        </Button>
      </div>
    );
  }

  // Fetch the data for the tabs
  // We try RPC first, but fallback to direct queries if needed (since RPC seems unreliable for this setup)
  let posts: any[] = [];
  let followers: any[] = [];
  let following: any[] = [];

  try {
    const { data } = await supabase.rpc('get_posts_by_user_id', { p_user_id: profile.id });
    if (data) posts = data;
  } catch (e) {
    // Ignored, will drop to fallback logic below if empty
  }

  // Fallback direct query for posts if RPC failed or returned nothing (and we expect something?)
  // Or simply always if empty.
  if (!posts || posts.length === 0) {
    const { data: rawPosts } = await supabase
      .from('posts')
      .select(`
          *, 
          author:user_id(id, name, username, avatar_url, verified), 
          likes:post_likes(count), 
          comments:comments!post_id(count)
       `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (rawPosts) {
      posts = rawPosts.map(p => ({
        ...p,
        author: p.author || profile, // Use fetched profile as author if join missing
        stats: {
          likes: (p.likes as any)?.[0]?.count || 0,
          comments: (p.comments as any)?.[0]?.count || 0,
          reshares: 0,
          views: 0
        },
        likes: [], // Explicitly empty for now to match type
        comments: []
      }));
    }
  }

  // We skip followers/following for now as tabs are "Coming Soon"

  return (
    <ProfileView
      profile={profile}
      posts={posts}
      followers={followers}
      following={following}
      session={session}
    />

  );
}