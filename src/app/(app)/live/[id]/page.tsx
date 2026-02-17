import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LivestreamHostView } from '@/components/features/live/livestream-host-view';
import { LivestreamViewerView } from '@/components/features/live/livestream-viewer-view';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Live Stream",
  description: "Watch live streams on Krishna Connect.",
};

export default async function LiveStreamingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ host?: string }>
}) {
  const supabase = createClient();

  // Await params and searchParams (Next.js 15 requirement)
  const { id } = await params;
  const { host } = await searchParams;

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

  // Check if current user is the host
  const { data: { user } } = await supabase.auth.getUser();
  const isHost = user?.id === livestream.host_id;

  // If host parameter is set and user is the host, show host view
  if (host === 'true' && isHost) {
    return (
      <LivestreamHostView
        livestreamId={livestream.id}
        callId={livestream.stream_call_id}
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
