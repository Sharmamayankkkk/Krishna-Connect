'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Challenge, Submission, LeaderboardEntry } from '@/components/challenges/types';
import { ArrowLeft, Users, Settings, Trophy, CheckCircle, XCircle, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { useTranslation } from 'react-i18next';

export default function ManageChallengePage() {
  const { t } = useTranslation();

    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [challengeId, setChallengeId] = useState<number | null>(null);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('stats');

    // Data
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

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
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);
            await fetchChallengeData(challengeId, user.id);
        };
        init();
    }, [challengeId, supabase]);

    const fetchChallengeData = async (cId: number, currentUserId: string) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: currentUserId });

        if (!error && data) {
            const found = (data as Challenge[]).find(c => c.id === cId);
            if (found) {
                // Verify ownership
                if (found.author_id !== currentUserId) {
                    toast({ title: 'Access Denied', description: 'You are not the author of this challenge.', variant: 'destructive' });
                    router.push(`/challenges/${cId}`);
                    return;
                }
                setChallenge(found);
                await fetchTabContent('stats', cId); // Load initial tab data
            } else {
                router.push('/challenges');
            }
        }
        setLoading(false);
    };

    const fetchTabContent = async (tab: string, cId: number) => {
        if (tab === 'submissions') {
            const { data } = await supabase.rpc('get_challenge_submissions', { p_challenge_id: cId });
            if (data) setSubmissions(data);
        }
        else if (tab === 'leaderboard' || tab === 'winners') {
            const { data } = await supabase.rpc('get_challenge_leaderboard', { p_challenge_id: cId });
            if (data) setLeaderboard(data);
        }
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (challengeId) fetchTabContent(value, challengeId);
    };

    const openReviewModal = (submission: Submission) => {
        setSelectedSubmission(submission);
        setRejectionReason(submission.rejection_reason || '');
        setReviewModalOpen(true);
    };

    const handleReviewSubmit = async (status: 'approved' | 'rejected') => {
        if (!selectedSubmission || !challengeId) return;

        if (status === 'rejected' && !rejectionReason.trim()) {
            toast({ title: 'Reason required', description: 'You must provide a reason for rejection.', variant: 'destructive' });
            return;
        }

        // Using existing RPC but passing new reason parameter. 
        // Note: RPC signature must be updated in DB to accept p_rejection_reason
        const { error } = await supabase.rpc('review_challenge_submission', {
            p_submission_id: selectedSubmission.id,
            p_status: status,
            p_score: null,
            // Mocking reason param for UI readiness, ensure DB RPC takes it
            // p_rejection_reason: status === 'rejected' ? rejectionReason : null
        });

        // Temporary workaround if RPC hasn't been updated yet: direct table update
        if (error) {
            const { error: directError } = await supabase.from('challenge_submissions')
                .update({
                    status,
                    rejection_reason: status === 'rejected' ? rejectionReason : null,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', selectedSubmission.id);

            if (directError) {
                toast({ title: 'Error', description: directError.message, variant: 'destructive' });
                return;
            }
        }

        toast({ title: `Submission ${status}` });
        setReviewModalOpen(false);
        fetchTabContent('submissions', challengeId); // refresh
    };

    const handleUpdateStatus = async (newStatus: Challenge['status']) => {
        if (!challenge) return;

        const { error } = await supabase.from('challenges')
            .update({ status: newStatus })
            .eq('id', challenge.id);

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Status updated', description: `Challenge is now ${newStatus}` });
            setChallenge({ ...challenge, status: newStatus });
        }
    };

    if (loading || !challenge) {
        return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    return (
        <div className="flex flex-col h-full bg-muted/20">
            <header className="sticky top-0 z-20 bg-background border-b px-4 md:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/challenges/${challenge.id}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Manage: {challenge.title}
                            <Badge variant="outline" className="text-xs">{challenge.status}</Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">{t('challenges.authorDashboard')}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6">

                {/* Sidebar Navigation */}
                <div className="md:w-64 shrink-0">
                    <div className="flex flex-col gap-1 bg-background border rounded-xl p-2 sticky top-24">
                        <NavButton id="stats" icon={<BarChart3 />} label={t('challenges.analyticsStats')} active={activeTab} onClick={handleTabChange} />
                        <NavButton
                            id="submissions"
                            icon={<Users />}
                            label={t('challenges.submissions')}
                            active={activeTab}
                            onClick={handleTabChange}
                            badge={pendingCount > 0 ? pendingCount : undefined}
                        />
                        <NavButton id="leaderboard" icon={<Trophy />} label={t('challenges.liveLeaderboard')} active={activeTab} onClick={handleTabChange} />
                        <NavButton id="controls" icon={<Settings />} label={t('challenges.controlsStatus')} active={activeTab} onClick={handleTabChange} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-background border rounded-xl p-6 min-h-[500px]">

                    {activeTab === 'stats' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{t('challenges.challengeOverview')}</h2>
                                <p className="text-muted-foreground">{t('challenges.realtimePerformanceMetrics')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />{t('challenges.participants')}</CardTitle></CardHeader>
                                    <CardContent><div className="text-4xl font-black">{challenge.participant_count}</div></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4" />{t('challenges.submissions')}</CardTitle></CardHeader>
                                    <CardContent><div className="text-4xl font-black">{submissions.length}</div></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />{t('challenges.pendingReview')}</CardTitle></CardHeader>
                                    <CardContent><div className="text-4xl font-black text-orange-500">{pendingCount}</div></CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{t('challenges.reviewSubmissions')}</h2>
                                    <p className="text-muted-foreground">{t('challenges.approveOrRejectParticipantEntries')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">{t('challenges.approveAllPending')}</Button>
                                </div>
                            </div>

                            <div className="border rounded-xl overflow-hidden divide-y">
                                {submissions.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">{t('challenges.noSubmissionsToReviewYet')}</div>
                                ) : (
                                    submissions.map(sub => (
                                        <div key={sub.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-muted/30 transition-colors">
                                            <Avatar className="h-10 w-10"><AvatarImage src={sub.user_avatar || '/user_Avatar/male.png'} /><AvatarFallback>{sub.user_username?.[0]}</AvatarFallback></Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold truncate">{sub.user_name}</span>
                                                    <span className="text-xs text-muted-foreground">@{sub.user_username}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{sub.proof_text || "No text provided"}</p>
                                                {sub.proof_media_url && (
                                                    <a href={sub.proof_media_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">{t('challenges.viewAttachedMedia')}</a>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                                                {sub.status === 'pending' ? (
                                                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-none">{t('profile.pending')}</Badge>
                                                ) : sub.status === 'approved' ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600 border-none">{t('challenges.approved')}</Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="border-none">{t('challenges.rejected')}</Badge>
                                                )}

                                                <Button size="sm" variant="outline" onClick={() => openReviewModal(sub)}>{t('challenges.review')}</Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{t('challenges.standings')}</h2>
                                <p className="text-muted-foreground">{t('challenges.currentRankingsOfParticipants')}</p>
                            </div>

                            <div className="border rounded-xl overflow-hidden divide-y">
                                {leaderboard.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">{t('challenges.noActivityYetToRank')}</div>
                                ) : (
                                    leaderboard.map((entry, index) => (
                                        <div key={entry.user_id} className="flex items-center gap-4 p-4 hover:bg-muted/20">
                                            <div className="w-8 text-center font-bold text-muted-foreground">#{index + 1}</div>
                                            <Avatar className="h-8 w-8"><AvatarImage src={entry.avatar_url || ''} /><AvatarFallback>{entry.username?.[0]}</AvatarFallback></Avatar>
                                            <div className="flex-1 font-medium">{entry.name}</div>
                                            <div className="font-bold">{entry.score || entry.points} pts</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'controls' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{t('challenges.stateControls')}</h2>
                                <p className="text-muted-foreground">{t('challenges.manuallyOverrideChallengePhases')}</p>
                            </div>

                            <div className="grid gap-6">
                                <Card className="border-orange-500/20 bg-orange-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-orange-500" />{t('challenges.closeSubmissions')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-foreground/80 mb-4">Stop accepting new entries. The challenge moves to the review phase where you can finalize scores.</p>
                                        <Button
                                            variant="outline"
                                            className="border-orange-200 text-orange-700 hover:bg-orange-100"
                                            disabled={challenge.status !== 'active'}
                                            onClick={() => handleUpdateStatus('submission_closed')}
                                        >{t('challenges.closeSubmissionsNow')}</Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-green-500/20 bg-green-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />{t('challenges.completeChallenge')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-foreground/80 mb-4">Finalize the challenge, lock the leaderboard, and distribute rewards (if applicable).</p>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            disabled={challenge.status === 'completed' || challenge.status === 'cancelled'}
                                            onClick={() => handleUpdateStatus('completed')}
                                        >{t('challenges.markAsCompleted')}</Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-red-500/20 bg-red-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" />{t('challenges.cancelChallenge')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-foreground/80 mb-4">Abort immediately. All pending submissions are voided, and the challenge is hidden from the main feed.</p>
                                        <Button
                                            variant="destructive"
                                            disabled={challenge.status === 'completed' || challenge.status === 'cancelled'}
                                            onClick={() => {
                                                if (confirm('Are you sure you want to cancel this challenge? This action cannot be undone.')) {
                                                    handleUpdateStatus('cancelled');
                                                }
                                            }}
                                        >{t('challenges.cancelChallenge')}</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('challenges.reviewSubmission')}</DialogTitle>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="space-y-6 py-4">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Avatar><AvatarImage src={selectedSubmission.user_avatar || '/user_Avatar/male.png'} /><AvatarFallback>{selectedSubmission.user_username?.[0]}</AvatarFallback></Avatar>
                                <div>
                                    <div className="font-bold">{selectedSubmission.user_name}</div>
                                    <div className="text-xs text-muted-foreground">Submitted {new Date(selectedSubmission.created_at).toLocaleString()}</div>
                                </div>
                            </div>

                            {selectedSubmission.proof_media_url && (
                                <div>
                                    <Label className="mb-2 block text-muted-foreground">{t('challenges.attachment')}</Label>
                                    <img src={selectedSubmission.proof_media_url} alt={t('challenges.proof')} className="w-full rounded-md border" />
                                </div>
                            )}

                            {selectedSubmission.proof_text && (
                                <div>
                                    <Label className="mb-2 block text-muted-foreground">Notes / Text</Label>
                                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">{selectedSubmission.proof_text}</div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <Label htmlFor="reason" className="mb-2 block flex items-center gap-2">
                                    Feedback / Rejection Reason
                                    <span className="text-xs font-normal text-muted-foreground">(Required if rejecting)</span>
                                </Label>
                                <Textarea
                                    id="reason"
                                    placeholder={t('challenges.explainWhyThisIsRejectedTo')}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={() => handleReviewSubmit('rejected')} className="gap-2"><XCircle className="h-4 w-4" />{t('profile.reject')}</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => handleReviewSubmit('approved')}><CheckCircle className="h-4 w-4" />{t('profile.approve')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

function NavButton({ id, icon, label, badge, active, onClick }: { id: string, icon: React.ReactNode, label: string, badge?: number, active: string, onClick: (id: string) => void }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-foreground/80 hover:text-foreground'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`[&>svg]:h-4 [&>svg]:w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{icon}</div>
                {label}
            </div>
            {badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-orange-500 text-white'}`}>
                    {badge}
                </span>
            )}
        </button>
    );
}
