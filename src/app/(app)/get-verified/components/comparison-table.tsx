"use client";

import React from 'react';
import Image from 'next/image';
import { Check, X as XIcon } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export function ComparisonTable() {
  const { t } = useTranslation();

    const features = [
        { feature: 'Verified Badge', free: false, verified: true },
        { feature: 'Official Emojis & Stickers', free: false, verified: true },
        { feature: 'Ad-Free Experience', free: false, verified: true },
        { feature: 'Pin Posts to Profile', free: '3', verified: '∞' },
        { feature: 'Create Challenges', free: false, verified: true },
        { feature: 'Create Events', free: false, verified: true },
        { feature: 'Media Upload Limit', free: '50MB', verified: '200MB' },
        { feature: 'Promote Posts', free: false, verified: true },
        { feature: 'Priority Support', free: false, verified: true },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-center">{t('getVerified.normalVsVerified')}</h3>
            <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="text-left p-3 sm:p-4 font-semibold">{t('getVerified.feature')}</th>
                            <th className="text-center p-3 sm:p-4 font-semibold w-24">{t('getVerified.free')}</th>
                            <th className="text-center p-3 sm:p-4 font-semibold w-24 bg-primary/5">
                                <span className="flex items-center justify-center gap-1">
                                    <Image src="/user_Avatar/verified.png" alt="" width={14} height={14} />{t('getVerified.verified')}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {features.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 sm:p-4 font-medium">{row.feature}</td>
                                <td className="text-center p-3 sm:p-4">
                                    {typeof row.free === 'boolean' ? (
                                        row.free ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <XIcon className="h-4 w-4 text-red-400 mx-auto" />
                                    ) : (
                                        <span className="text-muted-foreground">{row.free}</span>
                                    )}
                                </td>
                                <td className="text-center p-3 sm:p-4 bg-primary/5">
                                    {typeof row.verified === 'boolean' ? (
                                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                        <span className="font-semibold text-green-600">{row.verified}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
