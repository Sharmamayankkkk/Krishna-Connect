'use server';

import { createClient } from '@/lib/supabase/server';
import { getServerClient } from '@/lib/stream-server';
import { revalidatePath } from 'next/cache';

/**
 * Invite a guest to a livestream.
 * 
 * 1. Adds the user to the `livestream_guests` table in Supabase.
 * 2. Adds the user to the Stream Call as a member with 'admin' role (allowing them to publish).
 * 3. Sends a notification.
 */
export async function inviteGuestToLivestream(livestreamId: string, guestUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Fetch details to get the call ID
        const { data: livestream, error: fetchError } = await supabase
            .from('livestreams')
            .select('stream_call_id, title')
            .eq('id', livestreamId)
            .single();

        if (fetchError || !livestream) {
            return { success: false, error: 'Livestream not found' };
        }

        // 2. Add to Supabase `livestream_guests`
        const { error: dbError } = await supabase
            .from('livestream_guests')
            .insert({
                livestream_id: livestreamId,
                user_id: guestUserId,
                status: 'invited'
            });

        // Ignore duplicate key error (already invited)
        if (dbError && dbError.code !== '23505') {
            console.error('Database error inviting guest:', dbError);
            return { success: false, error: 'Database error' };
        }

        // 3. Add to Stream Call as a member with 'admin' role
        // 'admin' role has full permissions, including publishing.
        const serverClient = getServerClient();
        const call = serverClient.call('livestream', livestream.stream_call_id);

        await call.updateCallMembers({
            update_members: [{
                user_id: guestUserId,
                role: 'admin' // Granting admin role to ensure publishing permissions
            }]
        });

        // 4. Send Notification
        const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
                user_id: guestUserId,
                from_user_id: user.id,
                type: 'livestream_invite',
                content: `${user.user_metadata.name || 'Host'} invited you to join their livestream`,
                related_id: livestreamId,
                is_read: false
            });

        if (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }

        revalidatePath(`/live/${livestreamId}`);
        return { success: true };
    } catch (error) {
        console.error('Error inviting guest:', error);
        return { success: false, error: 'Failed to invite guest' };
    }
}
