'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Twitter, Instagram, Facebook, CheckCircle2, AlertCircle, ExternalLink, Gift, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Validation Helpers ---

interface ValidationResult {
    valid: boolean;
    error?: string;
}

function validateSocialLink(platform: string, value: string): ValidationResult {
    const trimmed = value.trim();
    if (!trimmed) return { valid: false };

    // Must be a valid URL
    let url: URL;
    try {
        url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    } catch {
        return { valid: false, error: 'Please enter a valid URL (e.g. https://twitter.com/...)' };
    }

    const hostname = url.hostname.toLowerCase().replace('www.', '');

    const domainMap: Record<string, string[]> = {
        twitter: ['twitter.com', 'x.com'],
        instagram: ['instagram.com'],
        facebook: ['facebook.com', 'fb.com', 'fb.watch'],
    };

    const allowed = domainMap[platform] ?? [];
    if (!allowed.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
        const expected = allowed[0];
        return { valid: false, error: `Link must be from ${expected}` };
    }

    return { valid: true };
}

// --- Types ---

interface SocialDiscountModalProps {
    twitterLink: string;
    instagramLink: string;
    facebookLink: string;
    setTwitterLink: (v: string) => void;
    setInstagramLink: (v: string) => void;
    setFacebookLink: (v: string) => void;
    allLinksProvided: boolean;
}

// --- Subcomponents ---

const SOCIALS = [
    {
        id: 'twitter' as const,
        label: 'Twitter / X',
        icon: Twitter,
        iconColor: '#1DA1F2',
        bgColor: '#E8F5FD',
        placeholder: 'https://twitter.com/yourpost/...',
        hint: 'Link to your tweet mentioning @KrishnaConnect',
        postUrl: 'https://twitter.com/intent/tweet?text=Just+discovered+%40KrishnaConnect+%F0%9F%94%A5',
    },
    {
        id: 'instagram' as const,
        label: 'Instagram',
        icon: Instagram,
        iconColor: '#E4405F',
        bgColor: '#FDE8EC',
        placeholder: 'https://instagram.com/p/...',
        hint: 'Link to your Instagram post or story',
        postUrl: 'https://www.instagram.com/',
    },
    {
        id: 'facebook' as const,
        label: 'Facebook',
        icon: Facebook,
        iconColor: '#1877F2',
        bgColor: '#E8F0FD',
        placeholder: 'https://facebook.com/yourpost/...',
        hint: 'Link to your Facebook post',
        postUrl: 'https://www.facebook.com/sharer/sharer.php?u=https://krishnaconnect.in',
    },
];

interface SocialFieldProps {
    social: (typeof SOCIALS)[number];
    value: string;
    onChange: (v: string) => void;
    touched: boolean;
    onBlur: () => void;
}

function SocialField({ social, value, onChange, touched, onBlur }: SocialFieldProps) {
    const Icon = social.icon;
    const validation = validateSocialLink(social.id, value);
    const showError = touched && value.trim() && !validation.valid;
    const showSuccess = value.trim() && validation.valid;

    return (
        <div className="space-y-1.5">
            {/* Label row */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ background: social.bgColor }}
                    >
                        <Icon className="h-3.5 w-3.5" style={{ color: social.iconColor }} />
                    </span>
                    {social.label}
                </label>
                <a
                    href={social.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    Post now <ExternalLink className="h-3 w-3" />
                </a>
            </div>

            {/* Input */}
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={social.placeholder}
                    className={cn(
                        'pr-9 transition-all duration-200',
                        showError && 'border-destructive focus-visible:ring-destructive/30',
                        showSuccess && 'border-green-500 focus-visible:ring-green-500/30'
                    )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {showError && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
            </div>

            {/* Feedback */}
            {showError && validation.error && (
                <p className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {validation.error}
                </p>
            )}
            {!showError && (
                <p className="text-xs text-muted-foreground">{social.hint}</p>
            )}
        </div>
    );
}

// --- Main Component ---

export function SocialDiscountModal({
    twitterLink,
    instagramLink,
    facebookLink,
    setTwitterLink,
    setInstagramLink,
    setFacebookLink,
    allLinksProvided,
}: SocialDiscountModalProps) {
    const [open, setOpen] = React.useState(false);
    const [touched, setTouched] = React.useState({ twitter: false, instagram: false, facebook: false });

    const values = { twitter: twitterLink, instagram: instagramLink, facebook: facebookLink };
    const setters = { twitter: setTwitterLink, instagram: setInstagramLink, facebook: setFacebookLink };

    // Per-field validation
    const validations = {
        twitter: validateSocialLink('twitter', twitterLink),
        instagram: validateSocialLink('instagram', instagramLink),
        facebook: validateSocialLink('facebook', facebookLink),
    };

    const validCount = Object.values(validations).filter((v) => v.valid).length;
    const allValid = validCount === 3;

    const handleDone = () => {
        // Touch all fields on done click to reveal errors
        setTouched({ twitter: true, instagram: true, facebook: true });
        if (allValid) setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="max-w-3xl mx-auto cursor-pointer group">
                    <Card
                        className={cn(
                            'border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-200',
                            allLinksProvided
                                ? 'border-green-400/60 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20'
                                : 'border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5 group-hover:border-primary/50'
                        )}
                    >
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                                    <Gift className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-base leading-tight mb-0.5">
                                        {allLinksProvided ? 'Discount Unlocked!' : 'Unlock ₹100 Flat Off'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {allLinksProvided ? (
                                            <span className="text-green-600 font-medium text-xs">
                                                All 3 social posts verified ✓
                                            </span>
                                        ) : (
                                            <>
                                                Post on all 3 platforms to claim
                                                <div className="flex -space-x-1">
                                                    {[
                                                        { Icon: Twitter, bg: '#E8F5FD', color: '#1DA1F2' },
                                                        { Icon: Instagram, bg: '#FDE8EC', color: '#E4405F' },
                                                        { Icon: Facebook, bg: '#E8F0FD', color: '#1877F2' },
                                                    ].map(({ Icon, bg, color }, i) => (
                                                        <div
                                                            key={i}
                                                            className="h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-background"
                                                            style={{ background: bg }}
                                                        >
                                                            <Icon className="h-2.5 w-2.5" style={{ color }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {allLinksProvided ? (
                                <div className="flex items-center gap-1.5 text-green-700 font-semibold bg-green-100 dark:bg-green-900/40 px-3 py-1.5 rounded-full text-sm shrink-0">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Unlocked
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    className="font-semibold shrink-0 pointer-events-none group-hover:scale-105 transition-transform"
                                >
                                    Unlock Now
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            Claim Your ₹100 Discount
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1">
                            Share about Krishna Connect on all 3 platforms and paste your post links below.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress bar */}
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${(validCount / 3) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                            {validCount}/3
                        </span>
                    </div>
                </div>

                {/* Fields */}
                <div className="px-6 py-5 space-y-5">
                    {SOCIALS.map((social) => (
                        <SocialField
                            key={social.id}
                            social={social}
                            value={values[social.id]}
                            onChange={setters[social.id]}
                            touched={touched[social.id]}
                            onBlur={() => setTouched((p) => ({ ...p, [social.id]: true }))}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
                    {allValid ? (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-11"
                            onClick={() => setOpen(false)}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Discount Applied — Done!
                        </Button>
                    ) : (
                        <>
                            <Button
                                className="w-full h-11 font-semibold"
                                onClick={handleDone}
                                disabled={validCount === 0}
                            >
                                {validCount > 0 && validCount < 3
                                    ? `${3 - validCount} more link${3 - validCount > 1 ? 's' : ''} needed`
                                    : 'Submit Links'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-muted-foreground">
                                Maybe later
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
