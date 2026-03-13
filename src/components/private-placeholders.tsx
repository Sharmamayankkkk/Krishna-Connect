'use client';

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { LoginModal } from "@/components/login-modal";
import { useState } from "react";

import { useTranslation } from 'react-i18next';

interface PrivatePlaceholderProps {
    avatarUrl?: string;
    displayName: string;
    username: string;
    isProfile?: boolean; // If true, simpler layout for profile feed
}

export function PrivateContentPlaceholder({ avatarUrl, displayName, username, isProfile = false }: PrivatePlaceholderProps) {
  const { t } = useTranslation();

    const [showLogin, setShowLogin] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/20 my-4 py-16">
            <div className="bg-background p-4 rounded-full mb-4 shadow-sm border">
                <Lock className="w-8 h-8 text-foreground" />
            </div>

            <h3 className="text-xl font-bold mb-2">{t('profile.thisAccountIsPrivate')}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">{t('common.followThisAccountToSeeTheir')}</p>

            {!isProfile && (
                <div className="flex items-center gap-3 mb-6 p-4 border rounded-lg bg-background/50">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                        <p className="font-semibold text-sm">{displayName}</p>
                        <p className="text-xs text-muted-foreground">@{username}</p>
                    </div>
                </div>
            )}

            <Button onClick={() => setShowLogin(true)} size="lg" className="font-semibold px-8">{t('common.loginToFollow')}</Button>

            <LoginModal open={showLogin} onOpenChange={setShowLogin} />
        </div>
    );
}
