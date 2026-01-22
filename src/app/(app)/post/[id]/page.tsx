'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// This page redirects from /post/[id] to /[username]/post/[id]
export default function PostRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      const postId = Number(params.id);

      if (isNaN(postId)) {
        setError('Invalid post ID');
        return;
      }

      // Fetch the post to get the author's username
      const { data, error } = await supabase
        .from('posts')
        .select('id, author:user_id (username)')
        .eq('id', postId)
        .single();

      if (error || !data || !data.author) {
        setError('Post not found');
        return;
      }

      // Redirect to the new URL format
      const username = (data.author as any).username;
      router.replace(`/${username}/post/${postId}`);
    };

    fetchAndRedirect();
  }, [params.id, router, supabase]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}