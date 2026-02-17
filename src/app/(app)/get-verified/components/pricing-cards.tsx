'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Gift, TrendingUp } from 'lucide-react';

interface PricingCardsProps {
    selectedPlan: 'monthly' | 'yearly';
    onSelectPlan: (plan: 'monthly' | 'yearly') => void;
    allLinksProvided: boolean;
    prices: {
        monthly: { regular: number; discounted: number };
        yearly: { regular: number; discounted: number };
    };
}

export function PricingCards({ selectedPlan, onSelectPlan, allLinksProvided, prices }: PricingCardsProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-center">Choose Your Plan</h3>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Monthly */}
                <div
                    className={cn(
                        "relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg",
                        selectedPlan === 'monthly' ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
                    )}
                    onClick={() => onSelectPlan('monthly')}
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
                                <span className="text-xl text-muted-foreground line-through">₹{prices.monthly.regular}</span>
                            )}
                            <span className="text-4xl font-extrabold">₹{allLinksProvided ? prices.monthly.discounted : prices.monthly.regular}</span>
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
                    onClick={() => onSelectPlan('yearly')}
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
                                <span className="text-xl text-muted-foreground line-through">₹{prices.yearly.regular}</span>
                            )}
                            <span className="text-4xl font-extrabold">₹{allLinksProvided ? prices.yearly.discounted : prices.yearly.regular}</span>
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
    );
}
