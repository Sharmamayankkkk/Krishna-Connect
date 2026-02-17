'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface SocialLink {
    url: string;
    status: 'pending' | 'approved' | 'needs_change';
    feedback?: string;
}

interface SocialLinkInputProps {
    platform: string;
    icon: React.ReactNode;
    link?: SocialLink; // Optional because initial state might not have link object
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function SocialLinkInput({
    platform,
    icon,
    link,
    value,
    onChange,
    placeholder,
    disabled
}: SocialLinkInputProps) {
    const needsChange = link?.status === 'needs_change';
    const isApproved = link?.status === 'approved';

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2 capitalize text-sm font-medium">
                {icon} {platform}
                {isApproved && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] h-5 px-1.5">
                        Approved
                    </Badge>
                )}
                {needsChange && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                        Needs Change
                    </Badge>
                )}
            </Label>
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || `https://${platform}.com/...`}
                    className={cn(needsChange && "border-destructive pr-10", isApproved && "border-green-500/50 pr-10")}
                    disabled={disabled || isApproved}
                />
                {isApproved && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                )}
            </div>
            {needsChange && link?.feedback && (
                <p className="text-xs text-destructive mt-1">{link.feedback}</p>
            )}
        </div>
    );
}
