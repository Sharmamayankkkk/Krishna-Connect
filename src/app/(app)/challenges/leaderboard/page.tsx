'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowLeft, Loader2, Sparkles, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationBadge } from '@/components/shared/verification-badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface LeaderboardEntry {
    user_id: string;
    name: string | null;
    username: string;
    avatar_url: string | null;
    verified: 'none' | 'verified' | 'kcs';
    total_points: number;
    challenges_completed: number;
    global_rank: number;
}

export default function GlobalLeaderboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.rpc('get_global_challenge_leaderboard', {
                p_limit: 100,
                p_offset: 0
            });

            if (error) {
                console.error('Error fetching global leaderboard:', error);
            } else if (data) {
                setEntries(data as LeaderboardEntry[]);
            }
            setIsLoading(false);
        };

        fetchLeaderboard();
    }, [supabase]);

    const getRankStyles = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400";
            case 2:
                return "bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/50 text-slate-600 dark:text-slate-300";
            case 3:
                return "bg-gradient-to-r from-amber-700/20 to-amber-800/10 border-amber-700/50 text-amber-700 dark:text-amber-500";
            default:
                return "bg-card border-border/50 hover:bg-muted/50 text-foreground";
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
            case 2:
                return <Medal className="h-6 w-6 text-slate-400 fill-slate-400" />;
            case 3:
                return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
            default:
                return <span className="font-bold text-lg text-muted-foreground">#{rank}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40">
                <div className="flex items-center justify-between p-4 max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                Global Leaderboard
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground">Top community challenge participants</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Calculating ranks...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No participants yet</h3>
                        <p className="text-muted-foreground">Be the first to join a challenge and earn points!</p>
                        <Link href="/challenges">
                            <Button className="mt-6">Explore Challenges</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3 pb-8">
                        {entries.map((entry) => (
                            <Link key={entry.user_id} href={`/profile/${entry.username}`}>
                                <Card className={cn("transition-all duration-200 border shadow-sm", getRankStyles(entry.global_rank))}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* Rank Column */}
                                        <div className="w-10 flex justify-center items-center shrink-0">
                                            {getRankIcon(entry.global_rank)}
                                        </div>

                                        {/* User Column */}
                                        <div className="flex flex-1 items-center gap-3 min-w-0">
                                            <Avatar className={cn("h-12 w-12 border-2",
                                                entry.global_rank === 1 ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" :
                                                    entry.global_rank === 2 ? "border-slate-400" :
                                                        entry.global_rank === 3 ? "border-amber-700" : "border-background"
                                            )}>
                                                <AvatarImage src={entry.avatar_url ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${entry.avatar_url}` : undefined} />
                                                <AvatarFallback>{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-base md:text-lg truncate flex items-center gap-1.5">
                                                    {entry.name || entry.username}
                                                    <VerificationBadge verified={entry.verified} size={16} />
                                                </span>
                                                <span className="text-sm opacity-80 truncate">@{entry.username}</span>
                                            </div>
                                        </div>

                                        {/* Score Column */}
                                        <div className="flex flex-col items-end shrink-0 pl-2">
                                            <div className="flex items-center gap-1.5 font-bold text-lg md:text-xl">
                                                <span>{entry.total_points}</span>
                                                <span className="text-sm font-medium opacity-70">pts</span>
                                            </div>
                                            <span className="text-xs opacity-70 mt-0.5">
                                                {entry.challenges_completed} completed
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
