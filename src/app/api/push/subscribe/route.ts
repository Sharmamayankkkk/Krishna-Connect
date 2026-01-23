import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { subscription } = await request.json();
        const supabase = await createClient(); // Await the promise
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Upsert subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('Error saving subscription:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in subscribe route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
