'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils";
import { Trophy, Award, Medal, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeReward {
    id: string;
    challenge_id: number;
    reward_type: string;
    badge_slug: string;
    issued_at: string;
    challenge_title?: string;
}

export function TrophyCase({ userId }: { userId: string }) {
    const [badges, setBadges] = useState<BadgeReward[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchBadges = async () => {
            setLoading(true);
            try {
                // Fetch rewards specifically of type 'badge'
                const { data, error } = await supabase
                    .from('challenge_rewards')
                    .select('id, challenge_id, reward_type, badge_slug, issued_at, challenges(title)')
                    .eq('user_id', userId)
                    .eq('reward_type', 'badge')
                    .order('issued_at', { ascending: false });

                if (error) throw error;

                // Map the joined challenges title
                const mappedBadges = (data || []).map((b: any) => ({
                    ...b,
                    challenge_title: b.challenges?.title || 'Unknown Challenge',
                }));

                setBadges(mappedBadges);
            } catch (err) {
                console.error("Failed to load badges:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchBadges();
    }, [userId, supabase]);

    if (loading || badges.length === 0) return null;

    // Helper to render different badge icons based on slug
    const renderBadgeIcon = (slug: string) => {
        if (slug.includes('gold') || slug.includes('winner')) return <Medal className="h-6 w-6 text-yellow-500 drop-shadow-md" />;
        if (slug.includes('top')) return <Star className="h-6 w-6 text-blue-500 drop-shadow-md" />;
        return <Award className="h-6 w-6 text-purple-500 drop-shadow-md" />;
    };

    return (
        <div className="mt-6 border-t pt-5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Trophy Case ({badges.length})
            </h3>

            <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                    {badges.map((badge) => (
                        <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-background to-muted border border-border/50 shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                    {renderBadgeIcon(badge.badge_slug)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-center max-w-[200px]">
                                <p className="font-bold text-sm capitalize mb-0.5">{badge.badge_slug.replace('_', ' ')}</p>
                                <p className="text-xs text-muted-foreground">Won in: {badge.challenge_title}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}
