"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, TrendingUp, CheckCircle2, AlertCircle, Coins, CreditCard } from 'lucide-react';
import { PostType } from '@/lib/types';
import { useAppContext } from '@/providers/app-provider';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

import { useTranslation } from 'react-i18next';

interface PromoteDialogProps {
    post: PostType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Plan = {
    id: string;
    name: string;
    durationLabel: string;
    durationHours: number;
    credits: number;
    price: number;
    description: string;
};

const PLANS: Plan[] = [
    { id: 'basic', name: 'Basic', durationLabel: '24 Hours', durationHours: 24, credits: 1, price: 2.99, description: 'Quick boost' },
    { id: 'pro', name: 'Pro', durationLabel: '3 Days', durationHours: 72, credits: 3, price: 7.99, description: 'Best value' },
    { id: 'ultra', name: 'Ultra', durationLabel: '7 Days', durationHours: 168, credits: 5, price: 14.99, description: 'Max visibility' },
];

export function PromotePostDialog({ post, open, onOpenChange }: PromoteDialogProps) {
  const { t } = useTranslation();

    const { toast } = useToast();
    const { loggedInUser } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [availableCredits, setAvailableCredits] = useState<number>(0);
    const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
    const [checkingCredits, setCheckingCredits] = useState(true);

    const checkCredits = async () => {
        if (!loggedInUser) return;
        setCheckingCredits(true);
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_available_credits', { p_user_id: loggedInUser.id });
        if (!error && typeof data === 'number') {
            setAvailableCredits(data);
        }
        setCheckingCredits(false);
    };

    useEffect(() => {
        if (open && loggedInUser) {
            checkCredits();
            setResult(null);
        }
    }, [open, loggedInUser]);

    const handlePromote = async () => {
        if (!post) return;
        setIsLoading(true);
        setResult(null);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc('request_promotion', {
                p_post_id: parseInt(post.id),
                p_duration_hours: selectedPlan.durationHours
            });

            if (error) throw error;

            if (data) {
                setResult(data as { success: boolean; message: string });
                if (data.success) {
                    toast({
                        title: "Request Sent",
                        description: data.message,
                    });
                    checkCredits(); // Refresh credits
                } else {
                    toast({
                        title: "Failed",
                        description: data.message,
                        variant: "destructive"
                    });
                }
            }
        } catch (error: any) {
            console.error('Error requesting promotion:', error);
            setResult({ success: false, message: error.message || "An unexpected error occurred." });
            toast({
                title: "Error",
                description: "Failed to submit promotion request",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => setResult(null), 300);
    };

    if (!post) return null;

    const canAfford = availableCredits >= selectedPlan.credits;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />{t('post.promotePost')}</DialogTitle>
                    <DialogDescription>{t('post.chooseAPlanToBoostYour')}</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {!result ? (
                        <div className="space-y-6">
                            {/* Credits Display */}
                            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Coins className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{t('post.yourCredits')}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {loggedInUser?.is_verified ? "Renewed monthly" : "Need verification for free credits"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold">
                                    {checkingCredits ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : availableCredits}
                                </div>
                            </div>

                            {/* Plans Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {PLANS.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan)}
                                        className={cn(
                                            "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50",
                                            selectedPlan.id === plan.id ? "border-primary bg-primary/5" : "border-transparent bg-muted"
                                        )}
                                    >
                                        <div className="text-center space-y-2">
                                            <h3 className="font-bold">{plan.name}</h3>
                                            <div className="text-sm text-muted-foreground">{plan.durationLabel}</div>
                                            <div className="py-2">
                                                <div className="text-2xl font-bold">${plan.price}</div>
                                                <div className="text-xs text-muted-foreground">or {plan.credits} Credits</div>
                                            </div>
                                            {selectedPlan.id === plan.id && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">{t('post.selected')}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                {selectedPlan.description}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                            {result.success ? (
                                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <h3 className="font-bold text-xl">
                                    {result.success ? 'Request Submitted!' : 'Something went wrong'}
                                </h3>
                                <p className="text-muted-foreground max-w-[250px] mx-auto">
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="ghost" onClick={handleClose}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {!result && (
                        <Button
                            onClick={handlePromote}
                            disabled={isLoading}
                            className={cn("gap-2 w-full sm:w-auto", !canAfford && "bg-slate-900 text-white hover:bg-slate-800")}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : canAfford ? (
                                <>
                                    <Coins className="h-4 w-4" />
                                    Use {selectedPlan.credits} Credits
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    Pay ${selectedPlan.price}
                                </>
                            )}
                        </Button>
                    )}
                    {result && result.success && (
                        <Button onClick={handleClose} variant="default">{t('common.done')}</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
