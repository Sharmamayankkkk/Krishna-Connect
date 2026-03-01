'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Plus, Settings, Sparkles, Flame, Clock, Users } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/providers/app-provider';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Challenge } from '@/components/challenges/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChallengesPage() {
    const router = useRouter();
    const supabase = createClient();
    const { loggedInUser } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // State for categorizing challenges
    const [featuredChallenges, setFeaturedChallenges] = useState<Challenge[]>([]);
    const [networkChallenges, setNetworkChallenges] = useState<Challenge[]>([]);
    const [endingSoonChallenges, setEndingSoonChallenges] = useState<Challenge[]>([]);
    const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');

    const isVerified = loggedInUser?.is_verified === 'verified' || loggedInUser?.is_verified === 'kcs';

    useEffect(() => {
        const fetchUserAndChallenges = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchChallenges(user.id);
            }
        };
        fetchUserAndChallenges();
    }, [supabase]);

    const fetchChallenges = async (currentUserId: string) => {
        setLoading(true);
        // Note: Update RPCs for v2 returning the new schemas
        const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: currentUserId });

        if (error || !data) {
            console.error('Error fetching challenges:', error);
            setLoading(false);
            return;
        }

        const challenges = data as Challenge[];

        // Filter logic for different buckets
        // 1. Featured (In real app, admin flag. For now, top 4 most participants)
        const sortedByParticipants = [...challenges].sort((a, b) => b.participant_count - a.participant_count);
        setFeaturedChallenges(sortedByParticipants.filter(c => c.status === 'active').slice(0, 4));

        // 2. Network (Challenges created by people I follow. Stubbing with random for now)
        setNetworkChallenges(challenges.filter(c => c.status === 'active' && Math.random() > 0.5).slice(0, 4));

        // 3. Ending Soon (Deadline < 48 hours. Stubbing with just active ones sorted by deadline)
        const withDeadlines = challenges.filter(c => c.status === 'active' && c.submission_deadline);
        withDeadlines.sort((a, b) => new Date(a.submission_deadline!).getTime() - new Date(b.submission_deadline!).getTime());
        setEndingSoonChallenges(withDeadlines.slice(0, 4));

        // 4. Standard Active
        setActiveChallenges(challenges.filter((c: Challenge) => c.status === 'active' || c.status === 'scheduled'));

        // 5. Completed
        setCompletedChallenges(challenges.filter((c: Challenge) => c.status === 'completed' || c.status === 'submission_closed'));

        setLoading(false);
    };

    const handleToggleBookmark = async (e: React.MouseEvent, challengeId: number) => {
        e.stopPropagation();
        if (!userId) return;

        // Optimistic UI for toggling bookmark could exist here
        // await supabase.from('challenge_bookmarks').insert({ challenge_id: challengeId, user_id: userId });
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
                <div className="flex items-center justify-between p-4 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="md:hidden mr-1" />
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2.5 rounded-xl border border-primary/20 hidden sm:flex shadow-sm">
                            <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">Challenges</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Compete and grow together</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Link href="/challenges/me">
                            <Button variant="ghost" size="sm" className="flex gap-1.5 px-2 sm:px-3">
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">My Hub</span>
                            </Button>
                        </Link>
                        {isVerified && (
                            <Link href="/challenges/create">
                                <Button size="sm" className="gap-1.5 px-2 sm:px-3 shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline font-semibold">Create</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Search Bar Row */}
                <div className="px-4 pb-4 max-w-7xl mx-auto w-full">
                    <Input
                        placeholder="Search challenges by title, category, or tag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md bg-muted/50 border-border/50 focus-visible:ring-primary/40 rounded-full px-5"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6 w-full pb-20">
                <div className="max-w-7xl mx-auto space-y-12">
                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                <p className="text-muted-foreground animate-pulse text-sm">Loading challenges ecosystem...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 1. Featured Challenges */}
                            {featuredChallenges.length > 0 && !searchQuery && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
                                                <Sparkles className="h-4 w-4" />
                                            </div>
                                            <h2 className="text-lg font-bold">Featured Picks</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {featuredChallenges.map(challenge => (
                                            <ChallengeCard
                                                key={`featured-${challenge.id}`}
                                                challenge={challenge}
                                                userId={userId}
                                                onClick={() => router.push(`/challenges/${challenge.id}`)}
                                                onToggleBookmark={(e) => handleToggleBookmark(e, challenge.id)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 2. From Your Network */}
                            {networkChallenges.length > 0 && !searchQuery && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-500">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <h2 className="text-lg font-bold">From Your Network</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {networkChallenges.map(challenge => (
                                            <ChallengeCard
                                                key={`network-${challenge.id}`}
                                                challenge={challenge}
                                                userId={userId}
                                                onClick={() => router.push(`/challenges/${challenge.id}`)}
                                                onToggleBookmark={(e) => handleToggleBookmark(e, challenge.id)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 3. Ending Soon */}
                            {endingSoonChallenges.length > 0 && !searchQuery && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-500">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <h2 className="text-lg font-bold">Ending Soon</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {endingSoonChallenges.map(challenge => (
                                            <ChallengeCard
                                                key={`ending-${challenge.id}`}
                                                challenge={challenge}
                                                userId={userId}
                                                onClick={() => router.push(`/challenges/${challenge.id}`)}
                                                onToggleBookmark={(e) => handleToggleBookmark(e, challenge.id)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 4. Active Challenges Grid */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
                                    <div className="p-1.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-500">
                                        <Flame className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-xl font-bold">Explore All Active</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {activeChallenges
                                        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())))
                                        .map(challenge => (
                                            <ChallengeCard
                                                key={challenge.id}
                                                challenge={challenge}
                                                userId={userId}
                                                onClick={() => router.push(`/challenges/${challenge.id}`)}
                                                onToggleBookmark={(e) => handleToggleBookmark(e, challenge.id)}
                                            />
                                        ))}

                                    {activeChallenges.length === 0 && (
                                        <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20 border-border/50">
                                            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                                            <h3 className="text-lg font-medium text-foreground">No active challenges</h3>
                                            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                                                Check back later when creators launch new events, or be the first to create one!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 5. Completed Challenges */}
                            {completedChallenges.length > 0 && !searchQuery && (
                                <section className="pt-8 opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-2 mb-6">
                                        <h2 className="text-lg font-bold text-muted-foreground">Past Events Reference</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {completedChallenges.slice(0, 8).map(challenge => (
                                            <ChallengeCard
                                                key={challenge.id}
                                                challenge={challenge}
                                                userId={userId}
                                                onClick={() => router.push(`/challenges/${challenge.id}`)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}