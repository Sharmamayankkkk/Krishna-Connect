'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Challenge, Submission, LeaderboardEntry } from '@/components/challenges/types';
import { ArrowLeft, Users, Clock, Award, BookOpen, Flag, Trophy, ShieldCheck, UserCircle, MessageSquare, Share2, AlertCircle, Flame, Upload, BadgeCheck } from 'lucide-react';
import { VerificationBadge } from '@/components/shared/verification-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvatarUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ChallengeComments } from '@/components/challenges/ChallengeComments';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChallengeDetailPage() {
  const { t } = useTranslation();

    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [challengeId, setChallengeId] = useState<number | null>(null);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('overview');

    // Data states for tabs
    const [myEntries, setMyEntries] = useState<Submission[]>([]);
    const [publicSubmissions, setPublicSubmissions] = useState<Submission[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        if (params.id) {
            const id = parseInt(params.id as string, 10);
            if (!isNaN(id)) setChallengeId(id);
        }
    }, [params.id]);

    useEffect(() => {
        const init = async () => {
            if (!challengeId) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);

            await fetchChallengeDetails(challengeId, user?.id);
        };
        init();
    }, [challengeId, supabase]);

    const fetchChallengeDetails = async (cId: number, uId?: string) => {
        setLoading(true);
        // Note: For Phase 1 we use get_all_challenges and filter. 
        // In a real V2, we'd have a specific `get_challenge_detail` RPC to fetch a single item faster.
        const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: uId || null });

        if (!error && data) {
            const found = (data as Challenge[]).find(c => c.id === cId);
            if (found) {
                setChallenge(found);
            } else {
                toast({ title: 'Not found', description: 'Challenge does not exist or is private.', variant: 'destructive' });
                router.push('/challenges');
            }
        }
        setLoading(false);
    };

    const fetchTabContent = async (tab: string) => {
        if (!challengeId) return;

        if (tab === 'my_entries' && userId) {
            // New RPC from V2 plan
            const { data } = await supabase.rpc('get_user_challenge_entries', { p_challenge_id: challengeId });
            if (data) setMyEntries(data);
        }
        else if (tab === 'submissions') {
            // In V1 this was 'get_challenge_submissions'. 
            const { data } = await supabase.rpc('get_challenge_submissions', { p_challenge_id: challengeId });
            // If privacy is on, maybe filter on frontend or block via RPC
            if (data) setPublicSubmissions(data);
        }
        else if (tab === 'leaderboard') {
            const { data } = await supabase.rpc('get_challenge_leaderboard', { p_challenge_id: challengeId });
            if (data) setLeaderboard(data);
        }
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        fetchTabContent(value);
    };

    const toggleJoin = async () => {
        if (!userId || !challenge) return;

        const isJoining = !challenge.has_joined;
        if (isJoining) {
            await supabase.from('challenge_participants').insert({ challenge_id: challenge.id, user_id: userId });
            toast({ title: 'Joined!', description: 'You are now participating.' });
        } else {
            await supabase.from('challenge_participants').delete().match({ challenge_id: challenge.id, user_id: userId });
            toast({ title: 'Left Challenge', description: 'You have withdrawn.' });
        }

        fetchChallengeDetails(challenge.id, userId);
    };

    if (loading) return <ChallengeDetailSkeleton />;
    if (!challenge) return null;

    const isAuthor = userId === challenge.author_id;
    const isClosed = ['submission_closed', 'completed', 'cancelled'].includes(challenge.status);

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Header / Nav */}
            <div className="absolute top-4 left-4 z-50">
                <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-background/80 backdrop-blur" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>

            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-background/80 backdrop-blur">
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>

            <main className="flex-1 w-full bg-muted/10 h-full overflow-y-auto overflow-x-hidden">
                {/* Hero Banner Area */}
                <div className="relative w-full aspect-video md:aspect-[3/1] bg-black flex items-center justify-center overflow-hidden">
                    {challenge.cover_image ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl" style={{ backgroundImage: `url(${challenge.cover_image})` }} />
                            <img src={challenge.cover_image} alt={challenge.title} className="relative w-full h-full object-cover z-10" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-20" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                            <Trophy className="h-24 w-24 text-primary/40 drop-shadow-lg" />
                        </div>
                    )}
                </div>

                <div className="px-4 md:px-6 max-w-5xl mx-auto -mt-16 md:-mt-24 relative z-30 pb-16 w-full">

                    {/* Meta Header Box */}
                    <div className="bg-card border shadow-xl rounded-2xl p-6 mb-8 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {challenge.category && <Badge variant="secondary" className="px-2">{challenge.category}</Badge>}
                            <Badge variant="outline" className="gap-1 font-bold">
                                {challenge.status === 'active' ? <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> : null}
                                {challenge.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {challenge.participant_count || 0} Joined</Badge>
                            <Badge variant="outline" className="gap-1 capitalize"><ShieldCheck className="h-3 w-3" /> {challenge.type?.replace('_', ' ') || 'Challenge'}</Badge>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 break-words text-wrap overflow-hidden min-w-0">{challenge.title}</h1>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-muted-foreground mt-6 pt-6 border-t">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border">
                                    <AvatarImage src={getAvatarUrl(challenge.author_avatar || undefined) || getAvatarUrl('male.png')} />
                                    <AvatarFallback>{challenge.author_name?.[0] || 'C'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-foreground hover:underline cursor-pointer" onClick={() => router.push(`/profile/${challenge.author_username}`)}>
                                            {challenge.author_username ? `@${challenge.author_username}` : '@community'}
                                        </span>
                                        <VerificationBadge verified={challenge.author_verified} size={14} className="ml-0.5" />
                                    </div>
                                    <span className="text-xs text-muted-foreground capitalize">{challenge.author_name || 'Community'}</span>
                                </div>
                            </div>
                            {challenge.submission_deadline && (
                                <div className="flex items-center gap-1.5 font-medium text-foreground ml-2 md:ml-0 md:pl-2 md:border-l">
                                    <Clock className={`h-4 w-4 ${isClosed ? 'text-red-500' : 'text-orange-500'}`} />
                                    {isClosed ? 'Submissions Closed' : `Closes ${formatDistanceToNow(new Date(challenge.submission_deadline), { addSuffix: true })}`}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* The 5-Tab Interface */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-0">
                        <TabsList className="mb-8 flex w-full max-w-full justify-start h-auto p-1 bg-card border rounded-xl overflow-x-auto no-scrollbar flex-nowrap shrink-0">
                            <TabsTrigger value="overview" className="shrink-0 rounded-lg py-2.5 px-4"><BookOpen className="h-4 w-4 mr-2" />{t('analytics.overview')}</TabsTrigger>
                            <TabsTrigger value="submissions" className="shrink-0 rounded-lg py-2.5 px-4"><Users className="h-4 w-4 mr-2" />{t('nav.feed')}</TabsTrigger>
                            <TabsTrigger value="leaderboard" className="shrink-0 rounded-lg py-2.5 px-4"><Trophy className="h-4 w-4 mr-2" />{t('challenges.leaderboard')}</TabsTrigger>
                            {challenge.has_joined && !isAuthor && (
                                <TabsTrigger value="my_entries" className="shrink-0 rounded-lg py-2.5 px-4"><UserCircle className="h-4 w-4 mr-2" />{t('challenges.myEntries')}</TabsTrigger>
                            )}
                            <TabsTrigger value="discussion" className="shrink-0 rounded-lg py-2.5 px-4"><MessageSquare className="h-4 w-4 mr-2" />{t('challenges.discussion')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Description */}
                            <section className="bg-card border rounded-2xl p-6 md:p-8 min-w-0">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">{t('challenges.theChallenge')}</h3>
                                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-full overflow-hidden break-words text-muted-foreground whitespace-pre-wrap leading-relaxed min-w-0 text-wrap break-all md:break-words">
                                    {challenge.description || "No description provided."}
                                </div>
                            </section>

                            {/* Rules & Rewards Split */}
                            <div className="grid md:grid-cols-2 gap-8 min-w-0 w-full overflow-hidden">
                                <section className={`bg-muted/30 border border-primary/20 rounded-2xl p-6 md:p-8 min-w-0 ${!challenge.prize_description ? 'md:col-span-2' : ''}`}>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" />{t('challenges.rules')}</h3>
                                    <div className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap font-medium break-words overflow-wrap-anywhere overflow-hidden min-w-0 break-all md:break-words text-wrap">
                                        {Array.isArray(challenge.rules) && challenge.rules.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {challenge.rules.map((rule, idx) => (
                                                    <li key={idx} className="break-words overflow-wrap-anywhere min-w-0 text-wrap break-all md:break-words">{rule}</li>
                                                ))}
                                            </ul>
                                        ) : typeof challenge.rules === 'string' ? (
                                            challenge.rules
                                        ) : (
                                            "Standard community guidelines apply."
                                        )}
                                    </div>
                                </section>

                                {challenge.prize_description && (
                                    <section className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-6 md:p-8 min-w-0">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-500"><Award className="h-5 w-5" />{t('challenges.reward')}</h3>
                                        <div className="text-sm md:text-base font-semibold break-words overflow-wrap-anywhere min-w-0 text-wrap break-all md:break-words">
                                            {challenge.prize_description}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="submissions" className="animate-in fade-in">
                            {challenge.submissions_visibility === 'author_only' && !isAuthor ? (
                                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                                    <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-bold">{t('challenges.privateFeed')}</h3>
                                    <p className="text-muted-foreground">The author has chosen to hide submissions until the challenge ends.</p>
                                </div>
                            ) : publicSubmissions.length === 0 ? (
                                <div className="text-center py-20 border rounded-xl bg-card">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">{t('challenges.noSubmissionsYetBeTheFirst')}</p>
                                </div>
                            ) : (
                                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                    {publicSubmissions.map(sub => (
                                        <div key={sub.id} className="break-inside-avoid bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-4 flex items-center gap-3 border-b bg-muted/20">
                                                <Avatar className="h-8 w-8"><AvatarImage src={sub.user_avatar || ''} /><AvatarFallback>{sub.user_username?.[0]}</AvatarFallback></Avatar>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{sub.user_name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(sub.created_at))} ago</p>
                                                </div>
                                            </div>
                                            {sub.proof_media_url && (
                                                <img src={sub.proof_media_url} alt={t('challenges.proof')} className="w-full object-cover" />
                                            )}
                                            {sub.proof_text && (
                                                <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {sub.proof_text}
                                                </div>
                                            )}
                                            {challenge.voting_enabled && (
                                                <div className="p-3 border-t bg-muted/10 flex justify-between items-center">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1.5 hover:text-primary">
                                                        <Trophy className="h-3.5 w-3.5" /> Vote {sub.vote_count > 0 && `(${sub.vote_count})`}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="leaderboard">
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-20 border rounded-xl bg-card">
                                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">{t('challenges.theLeaderboardIsEmptyBeThe')}</p>
                                </div>
                            ) : (
                                <div className="bg-card border rounded-2xl overflow-hidden">
                                    {leaderboard.map((entry, index) => (
                                        <div key={entry.user_id} className={`flex items-center gap-4 p-4 border-b last:border-0 ${index < 3 ? 'bg-primary/5' : ''}`}>
                                            <div className={`w-8 text-center font-black ${index === 0 ? 'text-yellow-500 text-xl' : index === 1 ? 'text-gray-400 text-lg' : index === 2 ? 'text-amber-700 text-lg' : 'text-muted-foreground'}`}>
                                                #{index + 1}
                                            </div>
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm"><AvatarImage src={getAvatarUrl(entry.avatar_url || undefined) || getAvatarUrl('male.png')} /><AvatarFallback>{entry.username?.[0]}</AvatarFallback></Avatar>
                                            <div className="flex-1">
                                                <div className="font-bold">{entry.name}</div>
                                                <div className="text-xs text-muted-foreground">@{entry.username}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-lg">{entry.score || entry.points} <span className="text-xs font-normal text-muted-foreground">pts</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* MY ENTRIES TAB - Crucial Phase 1 Requirement */}
                        <TabsContent value="my_entries" className="space-y-6">
                            {myEntries.length === 0 ? (
                                <div className="bg-card border rounded-xl p-10 text-center">
                                    <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-1">{t('challenges.noEntriesYet')}</h3>
                                    <p className="text-muted-foreground text-sm">{t('challenges.submitProofOfYourCompletionTo')}</p>
                                </div>
                            ) : (
                                myEntries.map((entry, i) => (
                                    <div key={entry.id} className="bg-card border rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-6">

                                        <div className="md:w-1/3 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider">Entry #{myEntries.length - i}</Badge>
                                                <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(entry.created_at))} ago</div>
                                            </div>

                                            {/* Status Badge highlighting */}
                                            <div className="mt-2">
                                                {entry.status === 'approved' && <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 py-1 px-3">{t('challenges.approved')}</Badge>}
                                                {entry.status === 'rejected' && <Badge variant="destructive" className="py-1 px-3 border-0">{t('challenges.rejected')}</Badge>}
                                                {entry.status === 'pending' && <Badge variant="secondary" className="py-1 px-3 bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 border-0">{t('challenges.underReview')}</Badge>}
                                            </div>

                                            {/* Crucial Phase 1 Requirement: Display Rejection Reason */}
                                            {entry.status === 'rejected' && entry.rejection_reason && (
                                                <div className="mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs mb-1 uppercase">
                                                        <AlertCircle className="h-3.5 w-3.5" />{t('challenges.authorFeedback')}</div>
                                                    <p className="text-sm text-foreground/80">{entry.rejection_reason}</p>
                                                    {challenge.allow_resubmit_after_rejection && (
                                                        <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs border-red-200 hover:bg-red-50 dark:border-red-900/50">{t('challenges.editResubmit')}</Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:w-2/3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                                            {entry.proof_media_url && (
                                                <img src={entry.proof_media_url} alt={t('challenges.proof')} className="rounded-lg border mb-4 max-h-60 object-contain bg-black/5" />
                                            )}
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.proof_text || "No note provided."}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="discussion">
                            <ChallengeComments challengeId={challenge.id} />
                        </TabsContent>

                    </Tabs>
                </div>
            </main>

            {/* Sticky Bottom Action Bar */}
            <div className="sticky bottom-0 w-full p-4 border-t bg-background/95 backdrop-blur-xl z-40 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] mt-auto">
                <div className="hidden md:block">
                    {/* Status hint text based on state */}
                    {isClosed ? (
                        <span className="font-bold text-red-500 flex items-center gap-2"><Lock className="h-4 w-4" />{t('challenges.submissionsClosed')}</span>
                    ) : (
                        <span className="font-bold text-primary flex items-center gap-2"><Flame className="h-4 w-4" />{t('challenges.activeChallenge')}</span>
                    )}
                </div>

                <div className="flex w-full md:w-auto gap-3 justify-end leading-none">
                    {isAuthor ? (
                        <div className="flex w-full gap-2">
                            <Button variant="outline" className="w-1/2 md:w-auto">{t('challenges.editChallenge')}</Button>
                            <Button className="w-1/2 md:w-auto">{t('challenges.manageParticipants')}</Button>
                        </div>
                    ) : (
                        <div className="flex w-full gap-2">
                            {/* Join/Leave Button */}
                            {!isClosed && (
                                <Button
                                    variant={challenge.has_joined ? "secondary" : "default"}
                                    className={`w-1/2 md:w-auto font-bold ${challenge.has_joined ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                                    onClick={toggleJoin}
                                >
                                    {challenge.has_joined ? 'Withdraw' : 'Join Challenge'}
                                </Button>
                            )}

                            {/* Submit Button */}
                            {challenge.has_joined && (
                                <Button
                                    disabled={challenge.has_submitted || isClosed}
                                    variant={challenge.has_submitted ? "outline" : "default"}
                                    className={`w-1/2 md:w-[200px] font-bold ${challenge.has_submitted ? 'border-green-500 text-green-600 bg-green-50/50' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                                >
                                    {challenge.has_submitted ? (
                                        <><ShieldCheck className="h-4 w-4 mr-2" />{t('challenges.proofSubmitted')}</>
                                    ) : (
                                        <><Upload className="h-4 w-4 mr-2" />{t('challenges.submitProof')}</>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ChallengeDetailSkeleton() {
    return (
        <div className="h-full bg-background flex flex-col">
            <Skeleton className="w-full aspect-[3/1]" />
            <div className="px-8 max-w-5xl mx-auto -mt-16 relative w-full space-y-8">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full max-w-md rounded-xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        </div>
    );
}

import { Lock } from 'lucide-react';

import { useTranslation } from 'react-i18next';
