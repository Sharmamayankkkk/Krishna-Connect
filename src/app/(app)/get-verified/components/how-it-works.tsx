"use client";

import { Video } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export function HowItWorks() {
  const { t } = useTranslation();

    return (
        <div className="max-w-3xl mx-auto bg-muted/30 rounded-2xl p-6 border">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
                    <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-1">{t('getVerified.howItWorks')}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Payment is <strong className="text-foreground">not</strong> taken now. After you apply, we will schedule a <strong className="text-foreground">KCS Meet</strong> (Video Call) with you.
                        You will complete the verification and payment during the meet.
                    </p>
                    <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                            <span>{t('getVerified.apply')}</span>
                        </div>
                        <div className="h-px flex-1 bg-border" />
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                            <span>KCS Meet</span>
                        </div>
                        <div className="h-px flex-1 bg-border" />
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                            <span>{t('getVerified.verified1')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
