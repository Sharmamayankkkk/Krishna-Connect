'use client';

import { useEffect, useRef } from 'react';

// Google In-Feed Ad Component
// Designed for placement between feed items
export const GoogleInFeedAd = () => {
    const adRef = useRef<HTMLModElement>(null);
    const isLoaded = useRef(false);

    useEffect(() => {
        // Prevent double tracking in React Strict Mode
        if (isLoaded.current) return;

        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            isLoaded.current = true;
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div aria-hidden="true" className="w-full my-4 overflow-hidden" style={{ minHeight: '90px' }}>
            {/* 
                Google AdSense In-Feed Ad
                - Client: ca-pub-4172622079471868
                - Slot: 6096829313
                - Layout Key: -6q+cx-2f+8c+5j
                - Format: fluid
             */}
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="fluid"
                data-ad-layout-key="-6q+cx-2f+8c+5j"
                data-ad-client="ca-pub-4172622079471868"
                data-ad-slot="6096829313"
            />
        </div>
    );
};
