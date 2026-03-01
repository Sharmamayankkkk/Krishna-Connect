'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, BookMarked, Layers, Trophy, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Challenge } from '@/components/challenges/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyChallengesPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Categories of challenges
    const [participating, setParticipating] = useState<Challenge[]>([]);
    const [created, setCreated] = useState<Challenge[]>([]);
    const [completed, setCompleted] = useState<Challenge[]>([]);
    const [bookmarked, setBookmarked] = useState<Challenge[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                await fetchMyChallenges(user.id);
            } else {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [supabase]);

    const fetchMyChallenges = async (currentUserId: string) => {
        setLoading(true);
        // We will need a new RPC get_user_challenges_portal to efficiently fetch these buckets
        // For now, mapping from get_all_challenges
        const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: currentUserId });

        if (!error && data) {
            const all = data as Challenge[];

            // Participating: joined, status active/scheduled
            setParticipating(all.filter(c => c.has_joined && (c.status === 'active' || c.status === 'scheduled')));

            // Created: authoritarian
            setCreated(all.filter(c => c.author_id === currentUserId));

            // Completed: joined, status completed/closed
            setCompleted(all.filter(c => c.has_joined && (c.status === 'completed' || c.status === 'cancelled')));

            // Bookmarked: we would need a separate join here in reality
            setBookmarked([]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
                <div className="flex items-center gap-4 p-4 max-w-7xl mx-auto w-full">
                    <Link href="/challenges">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">My Challenge Hub</h1>
                        <p className="text-xs text-muted-foreground">Track your progress and creations</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6 w-full">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : (
                        <Tabs defaultValue="participating" className="w-full">
                            <TabsList className="mb-6 h-auto p-1 bg-muted/50 border overflow-x-auto flex w-full justify-start rounded-xl no-scrollbar max-w-3xl flex-nowrap">
                                <TabsTrigger value="participating" className="gap-2 rounded-lg py-2.5 px-4 shrink-0"><Trophy className="h-4 w-4" /> Participating <span className="text-xs opacity-50 ml-1">({participating.length})</span></TabsTrigger>
                                <TabsTrigger value="created" className="gap-2 rounded-lg py-2.5 px-4 shrink-0"><Layers className="h-4 w-4" /> Created by me <span className="text-xs opacity-50 ml-1">({created.length})</span></TabsTrigger>
                                <TabsTrigger value="completed" className="gap-2 rounded-lg py-2.5 px-4 shrink-0"><CheckCircle className="h-4 w-4" /> Completed <span className="text-xs opacity-50 ml-1">({completed.length})</span></TabsTrigger>
                                <TabsTrigger value="bookmarked" className="gap-2 rounded-lg py-2.5 px-4 shrink-0"><BookMarked className="h-4 w-4" /> Bookmarked</TabsTrigger>
                            </TabsList>

                            <TabsContent value="participating" className="m-0 focus-visible:outline-none">
                                {participating.length === 0 ? (
                                    <EmptyState icon={<Clock />} title="No active challenges" desc="You aren't participating in any active challenges right now." actionText="Discover Challenges" link="/challenges" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {participating.map(c => <ChallengeCard key={c.id} challenge={c} userId={userId} onClick={() => router.push(`/challenges/${c.id}`)} />)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="created" className="m-0 focus-visible:outline-none">
                                {created.length === 0 ? (
                                    <EmptyState icon={<Layers />} title="You haven't created any" desc="Launch a challenge to engage your community." actionText="Create New" link="/challenges/create" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {created.map(c => <ChallengeCard key={c.id} challenge={c} userId={userId} onClick={() => router.push(`/challenges/${c.id}`)} />)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="completed" className="m-0 focus-visible:outline-none">
                                {completed.length === 0 ? (
                                    <EmptyState icon={<CheckCircle />} title="No completed history" desc="Once a challenge you joined finishes, it will appear here." />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-90">
                                        {completed.map(c => <ChallengeCard key={c.id} challenge={c} userId={userId} onClick={() => router.push(`/challenges/${c.id}`)} />)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="bookmarked" className="m-0 focus-visible:outline-none">
                                {bookmarked.length === 0 ? (
                                    <EmptyState icon={<BookMarked />} title="No saved challenges" desc="Tap the bookmark icon on any challenge to save it for later." actionText="Explore" link="/challenges" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {bookmarked.map(c => <ChallengeCard key={c.id} challenge={c} userId={userId} onClick={() => router.push(`/challenges/${c.id}`)} />)}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyState({ icon, title, desc, actionText, link }: { icon: React.ReactNode, title: string, desc: string, actionText?: string, link?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
            <div className="h-12 w-12 text-muted-foreground/50 mb-4 [&>svg]:h-full [&>svg]:w-full">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">{desc}</p>
            {actionText && link && (
                <Link href={link}>
                    <Button variant="outline" className="gap-2 shadow-sm rounded-full px-6">{actionText}</Button>
                </Link>
            )}
        </div>
    );
}
