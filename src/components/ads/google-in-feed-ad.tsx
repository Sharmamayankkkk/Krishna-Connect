'use client';

import { useEffect, useRef } from 'react';
import { useAppContext } from '@/providers/app-provider';

// Google In-Feed Ad Component
// Designed for placement between feed items
export const GoogleInFeedAd = () => {
    const adRef = useRef<HTMLModElement>(null);
    const isLoaded = useRef(false);
    const { loggedInUser } = useAppContext();

    // No ads for verified or KCS users
    const isVerified = loggedInUser?.is_verified === 'verified' || loggedInUser?.is_verified === 'kcs';

    useEffect(() => {
        if (isVerified) return;

        // Prevent double tracking in React Strict Mode
        if (isLoaded.current) return;

        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            isLoaded.current = true;
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, [isVerified]);

    if (isVerified) return null;

    return (
        <div aria-hidden="true" className="w-full my-4 overflow-hidden" style={{ minHeight: '90px' }}>
            {/* 
                Google AdSense In-Feed Ad
                - Uses NEXT_PUBLIC_ADSENSE_CLIENT_ID from environment
                - Slot: 6096829313
                - Layout Key: -6q+cx-2f+8c+5j
                - Format: fluid
             */}
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="fluid"
                data-ad-layout-key="-6q+cx-2f+8c+5j"
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot="6096829313"
            />
        </div>
    );
};
