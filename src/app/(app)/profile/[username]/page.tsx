import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileView } from "./components/profile-view";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";

// Update: params is a Promise in Next.js 15
interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage(props: ProfilePageProps) {
  // 1. Await the params to get the username
  const params = await props.params;
  const { username } = params;

  // 2. Await cookies() (this is now async in Next.js 15)
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
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the profile data
  const { data: profile } = await supabase
    .rpc('get_profile_by_username', { 
        p_username: username, // Use the awaited username variable
        p_requesting_user_id: user?.id 
    })
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch the data for the tabs in parallel
  const [ 
    { data: posts },
    { data: followers },
    { data: following }
  ] = await Promise.all([
    supabase.rpc('get_posts_by_user_id', { p_user_id: profile.id }),
    supabase.rpc('get_followers_by_user_id', { p_user_id: profile.id }),
    supabase.rpc('get_following_by_user_id', { p_user_id: profile.id })
  ]);

  return (
    <ProfileView 
      profile={profile} 
      posts={posts} 
      followers={followers} 
      following={following}
      session={{ user }}
    />
  );
}
