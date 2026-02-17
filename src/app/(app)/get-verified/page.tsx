'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    PartyPopper,
    Send,
    Loader2,
    ArrowLeft,
    Sparkles
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useAppContext } from '@/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

// New Components
import { BenefitsGrid } from './components/benefits-grid';
import { ComparisonTable } from './components/comparison-table';
import { PricingCards } from './components/pricing-cards';
import { HowItWorks } from './components/how-it-works';
import { SocialDiscountModal } from './components/social-discount-modal';
import { StatusDashboard } from './components/status-dashboard';
import { AlreadyVerifiedView } from './components/already-verified-view';

// Types (Keep local or move to types file if preferred)
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

    // Already verified check
    const isVerified = loggedInUser.is_verified === 'verified' || loggedInUser.is_verified === 'kcs';
    if (isVerified) {
        return <AlreadyVerifiedView request={existingRequest} />;
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

                {/* Benefits Grid */}
                <BenefitsGrid />

                {/* Comparison Table */}
                <ComparisonTable />

                {/* Pricing Cards */}
                <PricingCards
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                    allLinksProvided={allLinksProvided}
                    prices={PRICES}
                />

                {/* Community Discount Modal */}
                <SocialDiscountModal
                    twitterLink={twitterLink}
                    instagramLink={instagramLink}
                    facebookLink={facebookLink}
                    setTwitterLink={setTwitterLink}
                    setInstagramLink={setInstagramLink}
                    setFacebookLink={setFacebookLink}
                    allLinksProvided={allLinksProvided}
                />

                {/* How It Works */}
                <HowItWorks />

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
