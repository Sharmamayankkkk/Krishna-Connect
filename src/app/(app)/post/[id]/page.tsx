import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Metadata, ResolvingMetadata } from "next";
import PostView from "./post-view";
import { notFound } from "next/navigation";

// Force dynamic because we use params and auth
export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(
  props: PostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const postId = params.id;

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

  // Fetch minimal post data for metadata
  const { data: post } = await supabase
    .from('posts')
    .select('content, user_id, media_urls, author:user_id(username, name)')
    .eq('id', postId)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const authorName = (post.author as any)?.name || 'Unknown';
  const authorUsername = (post.author as any)?.username || 'unknown';

  // Truncate content for title/description
  const contentSnippet = post.content
    ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content)
    : 'Media Post';

  const title = `"${contentSnippet}" by ${authorName} (@${authorUsername}) | Krishna Connect`;
  const description = post.content || `Check out this post by @${authorUsername} on Krishna Connect.`;

  // Determine OG Image
  // Priority: Post Media -> Author Avatar -> Default Logo
  let imageUrl = '/logo/Srila-Prabhupada.png';
  if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
    // If it's an image attachment
    const firstMedia = post.media_urls[0];
    if (firstMedia.url) {
      imageUrl = firstMedia.url.startsWith('http')
        ? firstMedia.url
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${firstMedia.url}`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: 'article',
      siteName: 'Krishna Connect',
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function PostPage(props: PostPageProps) {
  // Just render the client component which handles full data fetching
  // We await params here to be safe and compatible with Next.js 15
  await props.params;

  return <PostView />;
}