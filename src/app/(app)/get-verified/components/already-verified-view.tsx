'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, CheckCircle2, Copy, Trophy, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '@/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface VerificationRequest {
    plan_type: 'monthly' | 'yearly';
    expires_at?: string;
    updated_at: string;
}

interface AlreadyVerifiedStateProps {
    request: VerificationRequest | null;
}

export function AlreadyVerifiedView({ request }: AlreadyVerifiedStateProps) {
    const router = useRouter();
    const supabase = createClient();
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();
    const [creditsUsed, setCreditsUsed] = useState<number | null>(null);
    const [showConfetti, setShowConfetti] = useState(true);
    const { width, height } = useWindowSize();

    useEffect(() => {
        const fetchCredits = async () => {
            if (!loggedInUser) return;
            const { data } = await supabase.rpc('get_monthly_promotion_count', { p_user_id: loggedInUser.id });
            setCreditsUsed(data || 0);
        };
        fetchCredits();

        // Stop confetti after 5 seconds
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
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

    function copyKcsId() {
        if (loggedInUser?.username) {
            navigator.clipboard.writeText(loggedInUser.username);
            toast({ title: 'Copied!', description: 'KCS ID copied to clipboard' });
        }
    }

    // Helper to get join date visual
    const joinYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
                <div className="flex items-center gap-4 px-4 h-14 max-w-5xl mx-auto">
                    <SidebarTrigger className="md:hidden" />
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full" aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Image src="/user_Avatar/verified.png" alt="Verified" width={20} height={20} />
                        <h1 className="font-bold text-lg">Verified Member</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8 space-y-8">

                {/* ID Card Design */}
                <div className="relative group perspective-1000">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1c2e] to-[#0f111a] border border-white/10 shadow-2xl p-6 sm:p-8 text-white min-h-[220px]">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

                        <div className="relative h-full flex flex-col justify-between gap-6">
                            {/* Card Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 relative bg-white/10 rounded-full flex items-center justify-center font-bold text-sm">
                                        KC
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Krishna Connect</h3>
                                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Verified Member</p>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-0.5 shadow-lg shadow-blue-500/20">
                                    <div className="h-full w-full rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                        <Image src="/user_Avatar/verified.png" alt="Verified" width={20} height={20} className="drop-shadow-md" />
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="flex items-center gap-4 mt-2">
                                <div className="h-20 w-20 rounded-2xl bg-white/10 border border-white/20 overflow-hidden relative shadow-inner shrink-0">
                                    {loggedInUser?.avatar_url ? (
                                        <Image src={loggedInUser.avatar_url} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold">
                                            {loggedInUser?.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="font-bold text-xl tracking-tight truncate">{loggedInUser?.name}</p>
                                    <div className="flex items-center gap-2 text-white/60 text-sm cursor-pointer hover:text-white transition-colors group/copy" onClick={copyKcsId}>
                                        <span className="truncate max-w-[150px]">@{loggedInUser?.username}</span>
                                        <Copy className="h-3 w-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                    </div>
                                    <Badge variant="outline" className="text-[10px] border-white/20 text-white/80 mt-1 h-5">
                                        Level 1 Devotee
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-2">
                                <div>
                                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Member Since</p>
                                    <p className="font-mono text-xs text-white/80">{joinYear}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Valid Until</p>
                                    <p className="font-mono text-xs sm:text-sm font-medium text-white/90">{formatDate(endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Usage & Actions */}
                <div className="grid gap-6">
                    {/* Promotion Credits */}
                    <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Promotion Credits</h3>
                                        <p className="text-sm text-muted-foreground">Boost your reach</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-foreground">{3 - (creditsUsed || 0)}</span>
                                    <span className="text-muted-foreground text-sm"> / 3 Left</span>
                                </div>
                            </div>

                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${Math.min(((creditsUsed || 0) / 3) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mb-4">Refreshes next month</p>

                            <Button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20" variant="default">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Boost a Post
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Stats / Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Plan Type</p>
                                <p className="font-bold text-lg capitalize">{planType}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Status</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                                    Active
                                </Badge>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button variant="outline" className="w-full rounded-xl h-12" onClick={() => router.push('/feed')}>
                            Back to Feed
                        </Button>
                        <p className="text-xs text-center text-muted-foreground pt-4">
                            Need help or want to cancel? <Link href="/contact-us" className="underline hover:text-primary">Contact Support</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
