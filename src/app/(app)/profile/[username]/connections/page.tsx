import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ConnectionsView } from './components/connections-view';
import { notFound, redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
    title: "Connections",
    description: "View followers and following on Krishna Connect.",
};

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ type?: string }>;
}

export default async function ConnectionsPage(props: PageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const supabase = createClient();
    const { username } = params;
    const decodeUsername = decodeURIComponent(username);
    const type = searchParams.type === 'followers' ? 'followers' : 'following';

    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        // redirect('/login'); // Optional: redirect if protected
    }

    // 1. Fetch Profile
    // We need basic profile info + counts.
    // Using simplified query or reuse existing RPC if fits. 
    // For now, simpler direct query.

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', decodeUsername)
        .single();

    if (!profile) {
        notFound();
    }

    // Privacy Check
    const isPrivate = profile.is_private;
    const isOwnProfile = currentUserId === profile.id;

    if (isPrivate && !isOwnProfile) {
        // Check if current user follows target
        const { data: relationship } = await supabase
            .from('relationships')
            .select('status')
            .eq('user_one_id', currentUserId)
            .eq('user_two_id', profile.id)
            .eq('status', 'approved')
            .maybeSingle();

        if (!relationship) {
            return (
                <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                    <div className="bg-muted p-4 rounded-full">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">This account is private</h1>
                    <p className="text-muted-foreground">Follow this account to see their {type}.</p>
                </div>
            );
        }
    }

    // 1a. Fetch Counts Real-time (since profile counts might be stale)
    const { count: followerCount } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('user_two_id', profile.id)
        .eq('status', 'approved');

    const { count: followingCount } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('user_one_id', profile.id)
        .eq('status', 'approved');

    // Override profile counts with real values
    profile.follower_count = followerCount || 0;
    profile.following_count = followingCount || 0;

    // 2. Fetch List based on type
    // Use 'relationships' table.
    // JOIN profiles.

    let userList = [];

    if (type === 'followers') {
        // Get people who follow THIS profile (user_two_id = profile.id)
        // Return details of user_one (the follower)
        const { data, error } = await supabase
            .from('relationships')
            .select(`
         user_one:profiles!user_one_id (*)
       `)
            .eq('user_two_id', profile.id)
            .eq('status', 'approved');

        if (data) {
            userList = data.map((r: any) => r.user_one).filter(Boolean);
        }
    } else {
        // Get people THIS profile follows (user_one_id = profile.id)
        // Return details of user_two (the following)
        const { data, error } = await supabase
            .from('relationships')
            .select(`
         user_two:profiles!user_two_id (*)
       `)
            .eq('user_one_id', profile.id)
            .eq('status', 'approved');

        if (data) {
            userList = data.map((r: any) => r.user_two).filter(Boolean);
        }
    }

    // 3. Enhance with "My Relationship Status"
    // For each user in `userList`, check if `currentUserId` follows them.
    // Bulk check: relationships where user_one_id = me AND user_two_id IN (list IDs)

    if (currentUserId && userList.length > 0) {
        const targetIds = userList.map(u => u.id);

        const { data: myRelationships } = await supabase
            .from('relationships')
            .select('user_two_id, status')
            .eq('user_one_id', currentUserId)
            .in('user_two_id', targetIds);

        const relationMap = new Map();
        myRelationships?.forEach((r: any) => {
            relationMap.set(r.user_two_id, r.status);
        });

        // Merge into userList
        userList = userList.map(u => ({
            ...u,
            is_following: relationMap.get(u.id) === 'approved', // Deprecated but kept for compatibility
            follow_status: relationMap.get(u.id) || 'none'
        }));
    }



    return (
        <ConnectionsView
            users={userList}
            profile={profile}
            initialType={type}
            currentUserId={currentUserId || ''}
            isOwnProfile={isOwnProfile}
        />
    );
}
