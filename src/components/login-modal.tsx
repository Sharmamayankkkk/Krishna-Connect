'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from 'react-i18next';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message?: string;
    redirectUrl?: string;
}

export function LoginModal({ open, onOpenChange, message, redirectUrl }: LoginModalProps) {
    const pathname = usePathname();
    const { t } = useTranslation();
    const finalRedirect = redirectUrl || pathname || '/explore';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">{t('auth.signIn')} - {t('common.appName')}</DialogTitle>
                    <DialogDescription className="text-center">
                        {message || "Join the community to like, comment, share, and connect with others."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button asChild size="lg" className="w-full font-semibold">
                        <Link href={`/login?next=${encodeURIComponent(finalRedirect)}`}>
                            {t('auth.signIn')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full font-semibold">
                        <Link href={`/signup?next=${encodeURIComponent(finalRedirect)}`}>
                            {t('auth.signUp')}
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
