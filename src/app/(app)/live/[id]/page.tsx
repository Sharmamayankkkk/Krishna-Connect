import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LivestreamHostView } from '@/components/features/live/livestream-host-view';
import { LivestreamViewerView } from '@/components/features/live/livestream-viewer-view';
import { StreamEnded } from '@/components/features/live/stream-ended';
import { redirect } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = createClient()

  const { data: livestream } = await supabase
    .from('livestreams')
    .select(`
      *,
      host:profiles!livestreams_host_id_fkey(name, username, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!livestream) {
    return {
      title: 'Livestream Not Found',
      description: 'This livestream could not be found.',
    }
  }

  const title = `${livestream.title} - Live on Krishna Connect`
  const description = livestream.description || `Watch ${livestream.host.name || livestream.host.username} live on Krishna Connect`
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://krishnaconnect.in'}/live/${id}`
  const image = livestream.host.avatar_url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://krishnaconnect.in'}/og-image.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'video.other',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: livestream.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function LiveStreamingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ host?: string; guest?: string }>
}) {
  const supabase = createClient();

  // Await params and searchParams (Next.js 15 requirement)
  const { id } = await params;
  const { host, guest } = await searchParams;

  // Fetch livestream details from database
  const { data: livestream, error } = await supabase
    .from('livestreams')
    .select(`
      *,
      host:profiles!livestreams_host_id_fkey(id, name, username, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error || !livestream) {
    redirect('/');
  }

  // Check if stream has ended
  if (livestream.status === 'ended') {
    return (
      <StreamEnded
        host={{
          name: livestream.host.name || livestream.host.username,
          username: livestream.host.username,
          avatarUrl: livestream.host.avatar_url
        }}
        duration={livestream.started_at && livestream.ended_at ?
          formatDuration(new Date(livestream.started_at), new Date(livestream.ended_at)) :
          undefined}
      />
    );
  }

  // Check if current user is the host
  const { data: { user } } = await supabase.auth.getUser();
  const isHost = user?.id === livestream.host_id;
  const isGuest = guest === 'true';

  // If host parameter is set and user is the host OR if it's a guest invite
  if ((host === 'true' && isHost) || isGuest) {
    return (
      <LivestreamHostView
        livestreamId={livestream.id}
        callId={livestream.stream_call_id}
        isGuest={isGuest}
      />
    );
  }

  // Otherwise show viewer view
  return (
    <LivestreamViewerView
      livestreamId={livestream.id}
      callId={livestream.stream_call_id}
      hostName={livestream.host.name || livestream.host.username}
      title={livestream.title}
    />
  );
}

function formatDuration(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  const minutes = Math.floor(diff / 60000);
  return `${minutes}m`;
}
