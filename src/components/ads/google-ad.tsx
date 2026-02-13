'use client';

import { useEffect } from 'react';

// This component is designed to display a Google Ad.
// It should be placed wherever you want an ad to appear.

export const GoogleAd = ({ slot, client }: { slot: string, client?: string }) => {

    useEffect(() => {
        // In React 18's Strict Mode (used in Next.js development),
        // this effect may run twice. The AdSense script is designed to handle this
        // by throwing an error if you try to push to an already-filled slot.
        // We can safely ignore this specific error in development.
        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {
            // The error is expected in dev strict mode, so we can console.warn or ignore it.
            // console.warn("AdSense error (expected in dev):", e);
        }
    }, [slot]); // Add `slot` as a dependency

    // This is the ad unit markup.
    // Make sure your ad unit is set to be responsive.
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
