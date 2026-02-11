import React from 'react';
import Image from 'next/image';

interface VerificationBadgeProps {
    verified?: boolean | 'none' | 'verified' | 'kcs' | null;
    size?: number;
    className?: string;
}

export function VerificationBadge({ verified, size = 16, className }: VerificationBadgeProps) {
    if (!verified || verified === 'none') {
        return null;
    }

    const isKcs = verified === 'kcs';
    const src = isKcs ? '/user_Avatar/KCS-verified.png' : '/user_Avatar/verified.png';
    const alt = isKcs ? 'KCS Verified' : 'Verified';

    return (
        <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            className={className}
            title={alt}
        />
    );
}
