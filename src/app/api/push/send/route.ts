import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure Web Push with your keys
// NOTE: You must have set these in .env.local!
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@krishnaconnect.in',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function POST(request: Request) {
    try {
        const requestBody = await request.json();
        const { userId, title, body: notifBody, url, icon, data } = requestBody;

        if (!userId || !title || !notifBody) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient(); // Await the promise

        // Fetch user's subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error || !subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found for user:', userId);
            // Not an error, just no devices to push to
            return NextResponse.json({ success: true, count: 0 });
        }

        // Determine if this is a call notification
        const isCallNotification = data?.type === 'incoming_call';

        const notificationPayload = JSON.stringify({
            title,
            body: notifBody,
            url: url || (isCallNotification ? '/calls' : '/'),
            icon: icon || '/logo/krishna_connect.png',
            // Pass through call-specific data for service worker handling
            type: data?.type,
            callId: data?.callId,
            callerId: data?.callerId,
            tag: isCallNotification ? `call-${data?.callId}` : undefined,
        });

        // Send notifications in parallel
        const sendPromises = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, notificationPayload, {
                    // Urgent priority for calls
                    urgency: isCallNotification ? 'high' : 'normal',
                    TTL: isCallNotification ? 30 : 86400, // 30s for calls, 24h for others
                });
                return { success: true, id: sub.id };
            } catch (err: any) {
                // If 410 Gone, the subscription is invalid/expired
                if (err.statusCode === 410) {
                    console.log('Subscription expired, deleting:', sub.id);
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                } else {
                    console.error('Error sending push to subscription:', sub.id, err);
                }
                return { success: false, id: sub.id, error: err };
            }
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({ success: true, sent: successCount, total: results.length });

    } catch (error: any) {
        console.error('Error in send route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
