'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="text-center">
                    <DialogHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <DialogTitle className="text-2xl">Application Received!</DialogTitle>
                        <DialogDescription className="text-base">
                            Thank you for applying! We will review your application and contact you shortly to schedule your KCS Meet.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={() => { setShowSuccessModal(false); router.refresh(); }} className="mt-4">
                        Got it!
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="flex items-center gap-4 px-4 h-14">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full" aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-bold text-lg">Get Verified</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                        <Image src="/user_Avatar/verified.png" alt="Verified" width={48} height={48} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Get Verified on Krishna Connect
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Join verified devotees and establish your authentic presence in our community.
                    </p>

                    {/* Benefits Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
                        <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Verified Badge</h3>
                            <p className="text-xs text-muted-foreground text-center">Authentic identity on all posts</p>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Long-Form Posts</h3>
                            <p className="text-xs text-muted-foreground text-center">No character limit</p>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Pin className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Unlimited Pins</h3>
                            <p className="text-xs text-muted-foreground text-center">Pin unlimited posts to profile</p>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Promote Posts</h3>
                            <p className="text-xs text-muted-foreground text-center">Boost visibility of posts</p>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Send className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Priority Support</h3>
                            <p className="text-xs text-muted-foreground text-center">Direct access to team</p>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Crown className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Create & Join Events</h3>
                            <p className="text-xs text-muted-foreground text-center">Host and attend exclusive events</p>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="mt-12 max-w-3xl mx-auto">
                        <h3 className="text-xl font-bold text-center mb-6">Normal vs Verified Comparison</h3>
                        <div className="rounded-xl border overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/50">
                                        <th className="text-left p-4 font-semibold">Feature</th>
                                        <th className="text-center p-4 font-semibold">Normal</th>
                                        <th className="text-center p-4 font-semibold bg-primary/10">
                                            <span className="flex items-center justify-center gap-1">
                                                Verified
                                                <Image src="/user_Avatar/verified.png" alt="Verified" width={16} height={16} />
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="p-4">Verified Badge</td>
                                        <td className="text-center p-4"><XIcon className="h-5 w-5 text-red-500 mx-auto" /></td>
                                        <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Post Character Limit</td>
                                        <td className="text-center p-4">280 chars</td>
                                        <td className="text-center p-4 bg-primary/5 font-semibold text-green-600">Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Pin Posts to Profile</td>
                                        <td className="text-center p-4">Max 3 posts</td>
                                        <td className="text-center p-4 bg-primary/5 font-semibold text-green-600">Unlimited</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Promote Posts</td>
                                        <td className="text-center p-4"><XIcon className="h-5 w-5 text-red-500 mx-auto" /></td>
                                        <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Priority Support</td>
                                        <td className="text-center p-4"><XIcon className="h-5 w-5 text-red-500 mx-auto" /></td>
                                        <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Verified-Only Events</td>
                                        <td className="text-center p-4"><XIcon className="h-5 w-5 text-red-500 mx-auto" /></td>
                                        <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Create Events</td>
                                        <td className="text-center p-4"><XIcon className="h-5 w-5 text-red-500 mx-auto" /></td>
                                        <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Monthly */}
                    <Card
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedPlan === 'monthly' && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Monthly
                                {selectedPlan === 'monthly' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </CardTitle>
                            <CardDescription>Billed monthly</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                {allLinksProvided && (
                                    <span className="text-2xl text-muted-foreground line-through">₹{PRICES.monthly.regular}</span>
                                )}
                                <span className="text-4xl font-bold">₹{allLinksProvided ? PRICES.monthly.discounted : PRICES.monthly.regular}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            {allLinksProvided && (
                                <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    ₹100 Discount Applied!
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    {/* Yearly */}
                    <Card
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
                            selectedPlan === 'yearly' && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            BEST VALUE
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Yearly
                                {selectedPlan === 'yearly' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </CardTitle>
                            <CardDescription>Billed annually (Save 2 months!)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                {allLinksProvided && (
                                    <span className="text-2xl text-muted-foreground line-through">₹{PRICES.yearly.regular}</span>
                                )}
                                <span className="text-4xl font-bold">₹{allLinksProvided ? PRICES.yearly.discounted : PRICES.yearly.regular}</span>
                                <span className="text-muted-foreground">/year</span>
                            </div>
                            {allLinksProvided && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    ₹100 Discount Applied!
                                </Badge>
                            )}

                            {/* Yearly Exclusive Perks */}
                            <Separator />
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                    <Gift className="h-4 w-4" />
                                    Yearly Exclusive Perks
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>3 Promoted Posts/Month</strong> — Boost your posts for free every month</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Gift className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>Madhav Stores Coupon</strong> — ₹100 off on orders above ₹1000</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Community Discount Section */}
                <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Get ₹100 Flat Off!
                        </CardTitle>
                        <CardDescription>
                            Post about our community on Twitter, Instagram, & Facebook to unlock the discount.
                            <br />
                            <span className="text-xs">Share: https://chat.krishnaconsciousnesssociety.com</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="twitter" className="flex items-center gap-2">
                                    <Twitter className="h-4 w-4 text-[#1DA1F2]" /> Twitter Post Link
                                </Label>
                                <Input
                                    id="twitter"
                                    placeholder="https://twitter.com/..."
                                    value={twitterLink}
                                    onChange={(e) => setTwitterLink(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram" className="flex items-center gap-2">
                                    <Instagram className="h-4 w-4 text-[#E4405F]" /> Instagram Post Link
                                </Label>
                                <Input
                                    id="instagram"
                                    placeholder="https://instagram.com/..."
                                    value={instagramLink}
                                    onChange={(e) => setInstagramLink(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facebook" className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook Post Link
                                </Label>
                                <Input
                                    id="facebook"
                                    placeholder="https://facebook.com/..."
                                    value={facebookLink}
                                    onChange={(e) => setFacebookLink(e.target.value)}
                                />
                            </div>
                        </div>

                        {allLinksProvided && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="h-5 w-5" />
                                Discount unlocked! ₹100 off your plan.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Process Info */}
                <Card className="mb-8 bg-muted/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Video className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">How it works</h3>
                                <p className="text-sm text-muted-foreground">
                                    Payment is <strong>not</strong> taken now. After you apply, we will schedule a <strong>KCS Meet</strong> (Video Call) with you.
                                    You will complete the verification and payment during the meet.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="text-center">
                    <Button
                        size="lg"
                        className="px-12 text-lg h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                    <p className="text-sm text-muted-foreground mt-4">
                        Selected: <strong>{selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}</strong> •
                        Total: <strong>₹{currentPrice}</strong>
                        {allLinksProvided && ' (with discount)'}
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
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="flex items-center gap-4 px-4 h-14">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full" aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-bold text-lg">Verification Status</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8">
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
                                If you believe this is an error, please contact support.
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

    // Calculate subscription details
    const planType = request?.plan_type || 'monthly';

    // Use stored expiration date if available, otherwise calculate fallback
    let endDate;
    if (request?.expires_at) {
        endDate = new Date(request.expires_at);
    } else {
        // Fallback calculation (legacy)
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
    const isExpired = daysLeft < 0;

    // Format dates
    const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });


    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
                <CardContent className="pt-10 pb-8">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 ring-4 ring-background shadow-xl">
                        <Image src="/user_Avatar/verified.png" alt="Verified" width={64} height={64} className="drop-shadow-sm" />
                    </div>

                    <h2 className="text-2xl font-bold mb-1">You're Verified!</h2>
                    <p className="text-muted-foreground mb-8 text-sm">
                        Enjoy your exclusive benefits and badge.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-left">
                        <div className="bg-muted/40 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Plan</p>
                            <p className="font-semibold capitalize flex items-center gap-2">
                                {planType}
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30">Active</Badge>
                            </p>
                        </div>
                        <div className="bg-muted/40 p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Expires</p>
                            <p className="font-semibold">{formatDate(endDate)}</p>
                            <p className="text-[10px] text-muted-foreground">{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</p>
                        </div>
                    </div>

                    <div className="bg-muted/40 p-3 rounded-lg border mb-8 text-left">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Promotion Credits</p>
                            <span className="text-xs font-medium">{creditsUsed ?? 0} / 3 Used</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                                style={{ width: `${Math.min(((creditsUsed || 0) / 3) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Verified users get 3 free boosted posts every month.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => router.push('/explore')}>
                            Back to Feed
                        </Button>
                        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            Renew Plan
                        </Button>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <p className="text-xs text-muted-foreground">
                            Need help? <a href="#" className="underline hover:text-primary">Contact Support</a>
                        </p>
                    </div>
                </CardContent>
            </Card>
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
