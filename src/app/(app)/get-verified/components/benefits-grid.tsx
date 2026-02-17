import React from 'react';
import { CheckCircle2, Sparkles, Pin, TrendingUp, Crown, Send, Gift, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BenefitsGrid() {
    const benefits = [
        { icon: <CheckCircle2 className="h-6 w-6" />, title: 'Verified Badge', desc: 'Blue tick on all posts & profile', color: 'from-blue-500 to-blue-600' },
        { icon: <Sparkles className="h-6 w-6" />, title: 'Official Emojis', desc: 'Exclusive emojis & stickers', color: 'from-amber-500 to-orange-500' },
        { icon: <ShieldOff className="h-6 w-6" />, title: 'Ad-Free Experience', desc: 'No ads anywhere on the platform', color: 'from-teal-500 to-green-600' },
        { icon: <Pin className="h-6 w-6" />, title: 'Unlimited Pins', desc: 'Pin unlimited posts to profile', color: 'from-purple-500 to-violet-600' },
        { icon: <TrendingUp className="h-6 w-6" />, title: 'Promote Posts', desc: '3 boosted posts/month (yearly)', color: 'from-rose-500 to-pink-600' },
        { icon: <Crown className="h-6 w-6" />, title: 'Create Challenges', desc: 'Only verified users can create', color: 'from-yellow-500 to-amber-600' },
        { icon: <Send className="h-6 w-6" />, title: 'Priority Support', desc: 'Direct access to the team', color: 'from-cyan-500 to-blue-600' },
        { icon: <Gift className="h-6 w-6" />, title: 'Exclusive Perks', desc: 'Madhav Stores coupons & more', color: 'from-fuchsia-500 to-purple-600' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {benefits.map((benefit, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform", benefit.color)}>
                        {benefit.icon}
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base">{benefit.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{benefit.desc}</p>
                </div>
            ))}
        </div>
    );
}
