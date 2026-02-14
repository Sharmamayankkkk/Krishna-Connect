'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppContext } from '@/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    CheckCircle2,
    Sparkles,
    Twitter,
    Instagram,
    Facebook,
    ArrowLeft,
    Loader2,
    Clock,
    AlertCircle,
    Video,
    PartyPopper,
    ExternalLink,
    Edit3,
    Send,
    TrendingUp,
    Gift,
    Pin,
    Crown,
    X as XIcon,
    Check
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Types
interface SocialLink {
    url: string;
    status: 'pending' | 'approved' | 'needs_change';
    feedback?: string;
}

interface SocialLinks {
    twitter?: SocialLink;
    instagram?: SocialLink;
    facebook?: SocialLink;
}

interface MeetingDetails {
    url: string;
    scheduled_at: string;
}

interface VerificationRequest {
    id: number;
    user_id: string;
    plan_type: 'monthly' | 'yearly';
    has_social_discount: boolean;
    social_links: SocialLinks;
    meeting_details: MeetingDetails | null;
    status: 'submitted' | 'reviewing' | 'action_required' | 'meet_scheduled' | 'verified' | 'rejected';
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

// Pricing constants
const PRICES = {
    monthly: { regular: 499, discounted: 399 },
    yearly: { regular: 4990, discounted: 4890 }
};

export default function GetVerifiedPage() {
    const router = useRouter();
    const { loggedInUser, isReady } = useAppContext();
    const { toast } = useToast();
    const supabase = createClient();

    // State
    const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form state
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [twitterLink, setTwitterLink] = useState('');
    const [instagramLink, setInstagramLink] = useState('');
    const [facebookLink, setFacebookLink] = useState('');

    // Discount logic
    const allLinksProvided = twitterLink.trim() !== '' && instagramLink.trim() !== '' && facebookLink.trim() !== '';
    const currentPrice = allLinksProvided ? PRICES[selectedPlan].discounted : PRICES[selectedPlan].regular;

    // Fetch existing request
    useEffect(() => {
        const fetchRequest = async () => {
            if (!loggedInUser) return;

            const { data, error } = await supabase
                .from('verification_requests')
                .select('*')
                .eq('user_id', loggedInUser.id)
                .maybeSingle();

            if (data) {
                setExistingRequest(data);
                // Pre-fill form if action_required
                if (data.status === 'action_required' && data.social_links) {
                    setTwitterLink(data.social_links.twitter?.url || '');
                    setInstagramLink(data.social_links.instagram?.url || '');
                    setFacebookLink(data.social_links.facebook?.url || '');
                    setSelectedPlan(data.plan_type);
                }
            }
            setIsLoading(false);
        };

        if (isReady) {
            fetchRequest();
        }
    }, [loggedInUser, isReady, supabase]);

    // Handle submission
    const handleSubmit = async () => {
        if (!loggedInUser) return;

        setIsSubmitting(true);

        const socialLinks: SocialLinks = {};
        if (twitterLink.trim()) {
            socialLinks.twitter = { url: twitterLink.trim(), status: 'pending' };
        }
        if (instagramLink.trim()) {
            socialLinks.instagram = { url: instagramLink.trim(), status: 'pending' };
        }
        if (facebookLink.trim()) {
            socialLinks.facebook = { url: facebookLink.trim(), status: 'pending' };
        }

        try {
            const { error } = await supabase
                .from('verification_requests')
                .insert({
                    user_id: loggedInUser.id,
                    plan_type: selectedPlan,
                    has_social_discount: allLinksProvided,
                    social_links: socialLinks,
                    status: 'submitted'
                });

            if (error) {
                if (error.code === '23505') {
                    toast({ variant: 'destructive', title: 'Application Exists', description: 'You already have a verification request.' });
                } else {
                    throw error;
                }
            } else {
                setShowSuccessModal(true);
            }
        } catch (error: any) {
            console.error('Error submitting:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to submit application.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle resubmission (for action_required status)
    const handleResubmit = async () => {
        if (!loggedInUser || !existingRequest) return;

        setIsSubmitting(true);

        const socialLinks: SocialLinks = {};
        if (twitterLink.trim()) {
            socialLinks.twitter = { url: twitterLink.trim(), status: 'pending' };
        }
        if (instagramLink.trim()) {
            socialLinks.instagram = { url: instagramLink.trim(), status: 'pending' };
        }
        if (facebookLink.trim()) {
            socialLinks.facebook = { url: facebookLink.trim(), status: 'pending' };
        }

        try {
            const { error } = await supabase
                .from('verification_requests')
                .update({
                    social_links: socialLinks,
                    status: 'reviewing'
                })
                .eq('id', existingRequest.id);

            if (error) throw error;

            toast({ title: 'Resubmitted!', description: 'Your updated links are now under review.' });
            // Refresh state
            setExistingRequest({ ...existingRequest, social_links: socialLinks, status: 'reviewing' });
        } catch (error: any) {
            console.error('Error resubmitting:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to resubmit.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (!isReady || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not logged in
    if (!loggedInUser) {
        router.replace('/login');
        return null;
    }

    // Already verified
    // We wait for existingRequest to be loaded if possible, but fallback if not found after loading
    const isVerified = (loggedInUser as any).verified === 'verified' || (loggedInUser as any).verified === 'kcs' || (loggedInUser as any).verified === true;
    if (isVerified) {
        return <AlreadyVerifiedState request={existingRequest} />;
    }

    // Existing request - show status dashboard
    if (existingRequest) {
        return (
            <StatusDashboard
                request={existingRequest}
                twitterLink={twitterLink}
                instagramLink={instagramLink}
                facebookLink={facebookLink}
                setTwitterLink={setTwitterLink}
                setInstagramLink={setInstagramLink}
                setFacebookLink={setFacebookLink}
                onResubmit={handleResubmit}
                isSubmitting={isSubmitting}
            />
        );
    }

    // New application form
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="text-center sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/20">
                            <PartyPopper className="h-10 w-10 text-white" />
                        </div>
                        <DialogTitle className="text-2xl">Application Received</DialogTitle>
                        <DialogDescription className="text-base leading-relaxed">
                            Thank you for applying! We will review your application and contact you shortly to schedule your KCS Meet.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={() => { setShowSuccessModal(false); router.refresh(); }} className="mt-4 rounded-full">
                        Got it!
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
                <div className="flex items-center gap-4 px-4 h-14 max-w-5xl mx-auto">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full" aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Image src="/user_Avatar/verified.png" alt="Verified" width={20} height={20} />
                        <h1 className="font-bold text-lg">Get Verified</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-16">
                {/* Hero Section */}
                <div className="text-center space-y-6 pt-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/25 animate-in zoom-in-50 duration-500">
                        <Image src="/user_Avatar/verified.png" alt="Verified" width={56} height={56} className="drop-shadow-lg" />
                    </div>
                    <div className="space-y-3 max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Get Verified
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Join the verified community of devotees. Unlock exclusive features and establish your authentic presence.
                        </p>
                    </div>
                </div>

                {/* Benefits Grid — 2x4 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { icon: <CheckCircle2 className="h-6 w-6" />, title: 'Verified Badge', desc: 'Blue tick on all posts & profile', color: 'from-blue-500 to-blue-600' },
                        { icon: <Sparkles className="h-6 w-6" />, title: 'Official Emojis', desc: 'Exclusive emojis & stickers', color: 'from-amber-500 to-orange-500' },
                        { icon: <Edit3 className="h-6 w-6" />, title: 'Long-Form Posts', desc: 'No character limit', color: 'from-green-500 to-emerald-600' },
                        { icon: <Pin className="h-6 w-6" />, title: 'Unlimited Pins', desc: 'Pin unlimited posts to profile', color: 'from-purple-500 to-violet-600' },
                        { icon: <TrendingUp className="h-6 w-6" />, title: 'Promote Posts', desc: '3 boosted posts/month (yearly)', color: 'from-rose-500 to-pink-600' },
                        { icon: <Crown className="h-6 w-6" />, title: 'Create Challenges', desc: 'Only verified users can create', color: 'from-yellow-500 to-amber-600' },
                        { icon: <Send className="h-6 w-6" />, title: 'Priority Support', desc: 'Direct access to the team', color: 'from-cyan-500 to-blue-600' },
                        { icon: <Gift className="h-6 w-6" />, title: 'Exclusive Perks', desc: 'Madhav Stores coupons & more', color: 'from-fuchsia-500 to-purple-600' },
                    ].map((benefit, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                            <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform", benefit.color)}>
                                {benefit.icon}
                            </div>
                            <h3 className="font-semibold text-sm sm:text-base">{benefit.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{benefit.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-center">Normal vs Verified</h3>
                    <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="text-left p-3 sm:p-4 font-semibold">Feature</th>
                                    <th className="text-center p-3 sm:p-4 font-semibold w-24">Free</th>
                                    <th className="text-center p-3 sm:p-4 font-semibold w-24 bg-primary/5">
                                        <span className="flex items-center justify-center gap-1">
                                            <Image src="/user_Avatar/verified.png" alt="" width={14} height={14} />
                                            Verified
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {[
                                    { feature: 'Verified Badge', free: false, verified: true },
                                    { feature: 'Official Emojis & Stickers', free: false, verified: true },
                                    { feature: 'Post Character Limit', free: '280', verified: '∞' },
                                    { feature: 'Pin Posts to Profile', free: '3', verified: '∞' },
                                    { feature: 'Create Challenges', free: false, verified: true },
                                    { feature: 'Create Events', free: false, verified: true },
                                    { feature: 'Promote Posts', free: false, verified: true },
                                    { feature: 'Priority Support', free: false, verified: true },
                                ].map((row, i) => (
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

                {/* Pricing Cards */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-center">Choose Your Plan</h3>
                    <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Monthly */}
                        <div
                            className={cn(
                                "relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg",
                                selectedPlan === 'monthly' ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
                            )}
                            onClick={() => setSelectedPlan('monthly')}
                        >
                            {selectedPlan === 'monthly' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                    SELECTED
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xl font-bold">Monthly</h4>
                                    <p className="text-sm text-muted-foreground">Billed every month</p>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    {allLinksProvided && (
                                        <span className="text-xl text-muted-foreground line-through">₹{PRICES.monthly.regular}</span>
                                    )}
                                    <span className="text-4xl font-extrabold">₹{allLinksProvided ? PRICES.monthly.discounted : PRICES.monthly.regular}</span>
                                    <span className="text-muted-foreground text-sm">/mo</span>
                                </div>
                                {allLinksProvided && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                                        ₹100 off applied!
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Yearly */}
                        <div
                            className={cn(
                                "relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg",
                                selectedPlan === 'yearly' ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
                            )}
                            onClick={() => setSelectedPlan('yearly')}
                        >
                            <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                BEST VALUE
                            </div>
                            {selectedPlan === 'yearly' && (
                                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                    SELECTED
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xl font-bold">Yearly</h4>
                                    <p className="text-sm text-muted-foreground">Save 2 months! Billed annually</p>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    {allLinksProvided && (
                                        <span className="text-xl text-muted-foreground line-through">₹{PRICES.yearly.regular}</span>
                                    )}
                                    <span className="text-4xl font-extrabold">₹{allLinksProvided ? PRICES.yearly.discounted : PRICES.yearly.regular}</span>
                                    <span className="text-muted-foreground text-sm">/yr</span>
                                </div>
                                {allLinksProvided && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                                        ₹100 off applied!
                                    </Badge>
                                )}
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                        <Gift className="h-4 w-4" /> Yearly Exclusive Perks
                                    </p>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong className="text-foreground">3 Promoted Posts/Month</strong> — Free boost</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <Gift className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span><strong className="text-foreground">Madhav Stores Coupon</strong> — ₹100 off</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Community Discount Section */}
                <div className="max-w-3xl mx-auto">
                    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                Unlock ₹100 Flat Off!
                            </CardTitle>
                            <CardDescription>
                                Post about Krishna Connect on all 3 platforms to unlock the discount.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                {[
                                    { id: 'twitter', icon: <Twitter className="h-4 w-4" />, color: 'text-[#1DA1F2]', value: twitterLink, setter: setTwitterLink, placeholder: 'https://twitter.com/...' },
                                    { id: 'instagram', icon: <Instagram className="h-4 w-4" />, color: 'text-[#E4405F]', value: instagramLink, setter: setInstagramLink, placeholder: 'https://instagram.com/...' },
                                    { id: 'facebook', icon: <Facebook className="h-4 w-4" />, color: 'text-[#1877F2]', value: facebookLink, setter: setFacebookLink, placeholder: 'https://facebook.com/...' },
                                ].map(social => (
                                    <div key={social.id} className="flex items-center gap-3">
                                        <div className={cn("flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center", social.color)}>
                                            {social.icon}
                                        </div>
                                        <Input
                                            placeholder={social.placeholder}
                                            value={social.value}
                                            onChange={(e) => social.setter(e.target.value)}
                                            className="flex-1 rounded-lg"
                                        />
                                        {social.value.trim() && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {allLinksProvided && (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Discount unlocked! ₹100 off your plan.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* How It Works */}
                <div className="max-w-3xl mx-auto bg-muted/30 rounded-2xl p-6 border">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
                            <Video className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">How it works</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Payment is <strong className="text-foreground">not</strong> taken now. After you apply, we will schedule a <strong className="text-foreground">KCS Meet</strong> (Video Call) with you.
                                You will complete the verification and payment during the meet.
                            </p>
                            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                                    <span>Apply</span>
                                </div>
                                <div className="h-px flex-1 bg-border" />
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                                    <span>KCS Meet</span>
                                </div>
                                <div className="h-px flex-1 bg-border" />
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                                    <span>Verified!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="text-center pb-8 space-y-4">
                    <Button
                        size="lg"
                        className="px-12 text-lg h-14 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Submit Application
                            </>
                        )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Selected: <strong>{selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}</strong> •
                        Total: <strong>₹{currentPrice}</strong>
                        {allLinksProvided && ' (with ₹100 discount)'}
                    </p>
                </div>
            </main>
        </div>
    );
}

// Status Dashboard Component
function StatusDashboard({
    request,
    twitterLink,
    instagramLink,
    facebookLink,
    setTwitterLink,
    setInstagramLink,
    setFacebookLink,
    onResubmit,
    isSubmitting
}: {
    request: VerificationRequest;
    twitterLink: string;
    instagramLink: string;
    facebookLink: string;
    setTwitterLink: (v: string) => void;
    setInstagramLink: (v: string) => void;
    setFacebookLink: (v: string) => void;
    onResubmit: () => void;
    isSubmitting: boolean;
}) {
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

            <main className="max-w-lg mx-auto px-4 py-8">
                {/* Submitted / Reviewing */}
                {(request.status === 'submitted' || request.status === 'reviewing') && (
                    <Card className="text-center">
                        <CardContent className="pt-8 pb-8">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Application Under Review</h2>
                            <p className="text-muted-foreground mb-4">
                                Thank you for applying! Our team is reviewing your application.
                                We'll contact you soon to schedule your KCS Meet.
                            </p>
                            <Badge variant="secondary" className="text-sm">
                                {request.status === 'submitted' ? 'Submitted' : 'Under Review'}
                            </Badge>
                        </CardContent>
                    </Card>
                )}

                {/* Action Required */}
                {request.status === 'action_required' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="h-5 w-5" />
                                <CardTitle>Action Required</CardTitle>
                            </div>
                            <CardDescription>
                                Please update the highlighted social links and resubmit.
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

                            <Button onClick={onResubmit} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                                Resubmit Application
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Meet Scheduled */}
                {request.status === 'meet_scheduled' && request.meeting_details && (
                    <Card className="text-center border-green-500/50 bg-green-50 dark:bg-green-950/20">
                        <CardContent className="pt-8 pb-8">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Video className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-300">Application Approved!</h2>
                            <p className="text-muted-foreground mb-6">
                                Your KCS Meet has been scheduled. Join the video call to complete verification.
                            </p>
                            <div className="bg-background rounded-lg p-4 mb-4 inline-block">
                                <p className="text-sm text-muted-foreground mb-1">Scheduled Time</p>
                                <p className="font-semibold text-lg">
                                    {new Date(request.meeting_details.scheduled_at).toLocaleString('en-IN', {
                                        dateStyle: 'full',
                                        timeStyle: 'short'
                                    })}
                                </p>
                            </div>
                            <div>
                                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
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
                    <Card className="text-center border-destructive/50">
                        <CardContent className="pt-8 pb-8">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-destructive">Application Rejected</h2>
                            <p className="text-muted-foreground mb-4">
                                Unfortunately, your application was not approved at this time.
                                {request.admin_notes && (
                                    <span className="block mt-2 text-sm">Reason: {request.admin_notes}</span>
                                )}
                            </p>
                            <p className="text-sm">
                                If you believe this is an error, please <Link href="/contact-us" className="underline hover:text-primary">contact support</Link>.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Verified (shouldn't normally reach here as we check earlier) */}
                {request.status === 'verified' && <AlreadyVerifiedState request={request} />}
            </main>
        </div>
    );
}

// Already Verified State
function AlreadyVerifiedState({ request }: { request: VerificationRequest | null }) {
    const router = useRouter();
    const supabase = createClient();
    const { loggedInUser } = useAppContext();
    const [creditsUsed, setCreditsUsed] = useState<number | null>(null);

    useEffect(() => {
        const fetchCredits = async () => {
            if (!loggedInUser) return;
            const { data } = await supabase.rpc('get_monthly_promotion_count', { p_user_id: loggedInUser.id });
            setCreditsUsed(data || 0);
        };
        fetchCredits();
    }, [loggedInUser, supabase]);

    const planType = request?.plan_type || 'monthly';

    let endDate;
    if (request?.expires_at) {
        endDate = new Date(request.expires_at);
    } else {
        const startDate = request?.updated_at ? new Date(request.updated_at) : new Date();
        endDate = new Date(startDate);
        if (planType === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
    }

    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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
                        <h1 className="font-bold text-lg">Verification</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-12">
                <Card className="text-center relative overflow-hidden rounded-2xl border-0 shadow-xl">
                    <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                    <CardContent className="pt-10 pb-8 space-y-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 ring-4 ring-background shadow-xl">
                            <Image src="/user_Avatar/verified.png" alt="Verified" width={64} height={64} className="drop-shadow-sm" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">You&apos;re Verified!</h2>
                            <p className="text-muted-foreground text-sm">Enjoy your exclusive benefits and badge.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="bg-muted/30 p-4 rounded-xl border">
                                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Plan</p>
                                <p className="font-semibold capitalize flex items-center gap-2">
                                    {planType}
                                    <Badge className="text-[10px] h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>
                                </p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-xl border">
                                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Expires</p>
                                <p className="font-semibold">{formatDate(endDate)}</p>
                                <p className="text-[10px] text-muted-foreground">{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</p>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-xl border text-left">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Promotion Credits</p>
                                <span className="text-xs font-medium">{creditsUsed ?? 0} / 3 Used</span>
                            </div>
                            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-full"
                                    style={{ width: `${Math.min(((creditsUsed || 0) / 3) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">
                                3 free boosted posts every month.
                            </p>
                        </div>

                        {/* Active Benefits */}
                        <div className="bg-muted/30 p-4 rounded-xl border text-left space-y-2">
                            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Active Benefits</p>
                            {['Verified Badge', 'Official Emojis & Stickers', 'Unlimited Post Length', 'Create Challenges', 'Priority Support'].map(b => (
                                <div key={b} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span>{b}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-full" onClick={() => router.push('/feed')}>
                                Back to Feed
                            </Button>
                            <Button className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                Renew Plan
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground pt-2 border-t">
                            Need help? <Link href="/contact-us" className="underline hover:text-primary">Contact Support</Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

// Social Link Input with Status
function SocialLinkInput({
    platform,
    icon,
    link,
    value,
    onChange
}: {
    platform: string;
    icon: React.ReactNode;
    link: SocialLink;
    value: string;
    onChange: (v: string) => void;
}) {
    const needsChange = link.status === 'needs_change';

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2 capitalize">
                {icon} {platform}
                {link.status === 'approved' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        Approved
                    </Badge>
                )}
                {needsChange && (
                    <Badge variant="destructive" className="text-xs">
                        Needs Change
                    </Badge>
                )}
            </Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`https://${platform}.com/...`}
                className={cn(needsChange && "border-destructive")}
                disabled={link.status === 'approved'}
            />
            {needsChange && link.feedback && (
                <p className="text-sm text-destructive">{link.feedback}</p>
            )}
        </div>
    );
}
