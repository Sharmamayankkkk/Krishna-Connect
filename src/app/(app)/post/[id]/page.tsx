import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server Component for SEO-friendly redirects
export default async function PostRedirectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const postId = Number(params.id);

  if (isNaN(postId)) {
    redirect('/'); // Fallback
  }

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

  // Fetch the post to get the author's username
  const { data } = await supabase
    .from('posts')
    .select('author:user_id (username)')
    .eq('id', postId)
    .single();

  if (data && data.author) {
    const username = (data.author as any).username;
    redirect(`/profile/${username}/post/${postId}`);
  }

  // If not found, redirect to feed
  redirect('/explore');
}