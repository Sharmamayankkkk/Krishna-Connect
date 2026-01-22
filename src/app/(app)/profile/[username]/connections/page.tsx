import { createClient } from '@/lib/utils';
import { ConnectionsView } from './components/connections-view';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: { username: string };
    searchParams: { type?: string };
}

export default async function ConnectionsPage({ params, searchParams }: PageProps) {
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

    const isOwnProfile = currentUserId === profile.id;

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
