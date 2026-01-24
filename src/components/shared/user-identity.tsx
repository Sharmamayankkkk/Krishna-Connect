import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface UserIdentityProps {
    user: {
        name?: string;
        username?: string;
        avatar_url?: string;
        verified?: boolean;
        is_private?: boolean; // Added for lock icon support if needed in future, currently strictly following prompt props
    };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    hasActiveStatus?: boolean;
    isStatusViewed?: boolean;
    hideText?: boolean;
    href?: string;
    className?: string;
}

export default function UserIdentity({
    user,
    size = 'md',
    hasActiveStatus = false,
    isStatusViewed = false,
    hideText = false,
    href,
    className
}: UserIdentityProps) {

    // Size Configurations
    const sizeConfig = {
        sm: {
            avatar: 'w-8 h-8',
            name: 'text-sm',
            username: 'text-xs',
            verifSize: 14
        },
        md: {
            avatar: 'w-10 h-10',
            name: 'text-base',
            username: 'text-sm',
            verifSize: 16
        },
        lg: {
            avatar: 'w-20 h-20',
            name: 'text-xl',
            username: 'text-base',
            verifSize: 20
        },
        xl: {
            avatar: 'w-24 h-24',
            name: 'text-2xl',
            username: 'text-lg',
            verifSize: 24
        }
    };

    const config = sizeConfig[size];

    // Helper to construct full URLs for avatar (if relative path is stored)
    const getAvatarUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith('http')) return url;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${url}`;
    };

    const avatarUrl = getAvatarUrl(user.avatar_url);
    const displayName = user.name || user.username || 'User';
    const displayUsername = user.username ? `@${user.username}` : '';

    // Status Ring Logic
    // - Active & Unseen: Gradient border
    // - Active & Seen: Gray border
    // - Inactive: No border
    let ringClasses = "";
    if (hasActiveStatus) {
        if (!isStatusViewed) {
            // Unseen: Gradient Ring
            // We use a padding wrapper approach for gradient borders on rounded elements
            ringClasses = "p-[2px] bg-gradient-to-tr from-orange-500 to-fuchsia-600";
        } else {
            // Seen: Solid Gray Ring
            ringClasses = "p-[2px] bg-gray-300";
        }
    }

    const AvatarComponent = (
        <div className={cn("relative rounded-full", ringClasses)}>
            <div className={cn("rounded-full border-2 border-background", hasActiveStatus ? "block" : "border-0")}>
                <Avatar className={cn(config.avatar)}>
                    <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    );

    const TextComponent = !hideText && (
        <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1 truncate">
                <span className={cn("font-bold truncate text-foreground", config.name)}>
                    {displayName}
                </span>
                {user.verified && (
                    <Image
                        src="/user_Avatar/verified.png"
                        alt="Verified"
                        width={config.verifSize}
                        height={config.verifSize}
                        className="flex-shrink-0"
                    />
                )}
            </div>
            {displayUsername && (
                <span className={cn("text-muted-foreground truncate", config.username)}>
                    {displayUsername}
                </span>
            )}
        </div>
    );

    const Content = (
        <div className={cn("flex items-center gap-3", className)}>
            {AvatarComponent}
            {TextComponent}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className={cn("block hover:opacity-90 transition-opacity", className)}>
                {/* We pass className to wrapper, but content assumes flex structure. 
             If href is present, Content shouldn't have className twice if we want proper merging.
             Let's apply className primarily to the wrapper. 
         */}
                <div className="flex items-center gap-3">
                    {AvatarComponent}
                    {TextComponent}
                </div>
            </Link>
        );
    }

    return Content;
}
