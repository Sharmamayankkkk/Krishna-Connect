'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/providers/app-provider';

export const GoogleAd = ({ slot, client }: { slot: string, client?: string }) => {
    const { loggedInUser } = useAppContext();

    // No ads for verified or KCS users
    const isVerified = loggedInUser?.is_verified === 'verified' || loggedInUser?.is_verified === 'kcs';

    useEffect(() => {
        if (isVerified) return;
        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
            // Expected in dev strict mode
        }
    }, [slot, isVerified]);

    if (isVerified) return null;

    return (
        <div className="w-full text-center my-4">
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={client || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slot}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
};
