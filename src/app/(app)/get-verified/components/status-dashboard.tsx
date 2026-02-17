'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, Clock, AlertCircle, Video, ExternalLink, Edit3, Loader2, Twitter, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SocialLinkInput } from './social-link-input';

interface VerificationRequest {
    id: number;
    user_id: string;
    plan_type: 'monthly' | 'yearly';
    has_social_discount: boolean;
    social_links: {
        twitter?: { url: string; status: 'pending' | 'approved' | 'needs_change'; feedback?: string };
        instagram?: { url: string; status: 'pending' | 'approved' | 'needs_change'; feedback?: string };
        facebook?: { url: string; status: 'pending' | 'approved' | 'needs_change'; feedback?: string };
    };
    meeting_details: { url: string; scheduled_at: string } | null;
    status: 'submitted' | 'reviewing' | 'action_required' | 'meet_scheduled' | 'verified' | 'rejected';
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

interface StatusDashboardProps {
    request: VerificationRequest;
    twitterLink: string;
    instagramLink: string;
    facebookLink: string;
    setTwitterLink: (v: string) => void;
    setInstagramLink: (v: string) => void;
    setFacebookLink: (v: string) => void;
    onResubmit: () => void;
    isSubmitting: boolean;
}

export function StatusDashboard({
    request,
    twitterLink,
    instagramLink,
    facebookLink,
    setTwitterLink,
    setInstagramLink,
    setFacebookLink,
    onResubmit,
    isSubmitting
}: StatusDashboardProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
                <div className="flex items-center gap-4 px-4 h-14 max-w-5xl mx-auto">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full" aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Image src="/user_Avatar/verified.png" alt="Verified" width={20} height={20} />
                        <h1 className="font-bold text-lg">Verification Status</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
                {/* Submitted / Reviewing */}
                {(request.status === 'submitted' || request.status === 'reviewing') && (
                    <Card className="text-center overflow-hidden border-2 shadow-lg">
                        <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                        <CardContent className="pt-10 pb-10">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pulse">
                                <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Application Under Review</h2>
                            <p className="text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                                Thank you for applying! Our team is currently reviewing your details.
                                We'll notify you shortly to schedule your KCS Meet.
                            </p>
                            <Badge variant="secondary" className="text-sm px-4 py-1.5 font-medium">
                                {request.status === 'submitted' ? 'Submitted' : 'Under Review'}
                            </Badge>
                        </CardContent>
                    </Card>
                )}

                {/* Action Required */}
                {request.status === 'action_required' && (
                    <Card className="border-2 border-destructive/20 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="h-5 w-5" />
                                <CardTitle>Action Required</CardTitle>
                            </div>
                            <CardDescription>
                                Please update the highlighted social links and resubmit your application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Twitter */}
                            {request.social_links.twitter && (
                                <SocialLinkInput
                                    platform="twitter"
                                    icon={<Twitter className="h-4 w-4 text-[#1DA1F2]" />}
                                    link={request.social_links.twitter}
                                    value={twitterLink}
                                    onChange={setTwitterLink}
                                />
                            )}
                            {/* Instagram */}
                            {request.social_links.instagram && (
                                <SocialLinkInput
                                    platform="instagram"
                                    icon={<Instagram className="h-4 w-4 text-[#E4405F]" />}
                                    link={request.social_links.instagram}
                                    value={instagramLink}
                                    onChange={setInstagramLink}
                                />
                            )}
                            {/* Facebook */}
                            {request.social_links.facebook && (
                                <SocialLinkInput
                                    platform="facebook"
                                    icon={<Facebook className="h-4 w-4 text-[#1877F2]" />}
                                    link={request.social_links.facebook}
                                    value={facebookLink}
                                    onChange={setFacebookLink}
                                />
                            )}

                            <Separator />

                            <Button onClick={onResubmit} disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                                Resubmit Application
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Meet Scheduled */}
                {request.status === 'meet_scheduled' && request.meeting_details && (
                    <Card className="text-center border-green-500/50 bg-green-50 dark:bg-green-950/20 shadow-lg overflow-hidden">
                        <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
                        <CardContent className="pt-10 pb-10">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 ring-4 ring-green-500/20">
                                <Video className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-300">Application Approved!</h2>
                            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                Your KCS Meet (Video Call) has been scheduled. Please join the call at the scheduled time to complete the verification process.
                            </p>

                            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 mb-8 inline-block border shadow-sm w-full max-w-sm">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Scheduled Time</p>
                                <p className="font-bold text-xl text-foreground">
                                    {new Date(request.meeting_details.scheduled_at).toLocaleString('en-IN', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="text-lg text-primary font-medium mt-1">
                                    {new Date(request.meeting_details.scheduled_at).toLocaleString('en-IN', {
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: true
                                    })}
                                </p>
                            </div>

                            <div className="w-full max-w-sm mx-auto">
                                <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg shadow-lg shadow-green-500/20">
                                    <a href={request.meeting_details.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-5 w-5" />
                                        Join KCS Meet
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Rejected */}
                {request.status === 'rejected' && (
                    <Card className="text-center border-2 border-destructive/30 shadow-lg">
                        <CardContent className="pt-10 pb-10">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-destructive">Application Rejected</h2>
                            <p className="text-muted-foreground mb-6">
                                Unfortunately, your application was not approved at this time.
                            </p>
                            {request.admin_notes && (
                                <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6 text-sm font-medium">
                                    Reason: {request.admin_notes}
                                </div>
                            )}
                            <p className="text-sm">
                                If you believe this is an error, please <Link href="/contact-us" className="underline hover:text-primary font-medium">contact support</Link>.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
