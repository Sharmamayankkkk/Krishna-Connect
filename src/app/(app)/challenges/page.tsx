'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flame, Check, Trophy, Plus, Upload, Clock, Users, Share2, Trash2, Settings, MoreVertical, X, Calendar, Award, BookOpen } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Challenge {
    id: number;
    title: string;
    description: string | null;
    rules: string | null;
    prize_description: string | null;
    cover_image: string | null;
    is_active: boolean;
    participant_count: number;
    has_joined: boolean;
    has_submitted: boolean;
    user_submission_status: string | null;
    start_date: string;
    end_date: string | null;
    category: string | null;
    created_by: string;
    creator_name: string | null;
    creator_avatar: string | null;
}

interface Submission {
    id: string;
    user_id: string;
    user_name: string;
    user_username: string;
    user_avatar: string | null;
    proof_text: string | null;
    proof_media_url: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface LeaderboardEntry {
    user_id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    score: number;
    rank: number;
    status: string;
}

export default function ChallengesPage() {
    const supabase = createClient();
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();
    const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Create challenge dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newRules, setNewRules] = useState('');
    const [newPrize, setNewPrize] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Submit proof dialog state
    const [selectedActionChallenge, setSelectedActionChallenge] = useState<Challenge | null>(null);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [proofText, setProofText] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Manage challenge dialog state
    const [manageChallenge, setManageChallenge] = useState<Challenge | null>(null);
    const [manageTab, setManageTab] = useState('submissions');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loadingManageData, setLoadingManageData] = useState(false);

    // View DetailsDialog state
    const [viewChallenge, setViewChallenge] = useState<Challenge | null>(null);

    // Delete confirmation state
    const [deleteChallengeId, setDeleteChallengeId] = useState<number | null>(null);

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
        const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: currentUserId });

        if (error) {
            console.error('Error fetching challenges:', error);
        } else {
            setActiveChallenges(data.filter((c: Challenge) => c.is_active));
            setCompletedChallenges(data.filter((c: Challenge) => !c.is_active));
        }
        setLoading(false);
    };

    const toggleJoinChallenge = async (challengeId: number, hasJoined: boolean) => {
        if (!userId) return;

        if (hasJoined) {
            await supabase.from('challenge_participants').delete().match({ challenge_id: challengeId, user_id: userId });
        } else {
            await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: userId });
        }

        // Refresh entire list to update UI everywhere
        await fetchChallenges(userId);

        // Also update the local view state if open
        if (viewChallenge && viewChallenge.id === challengeId) {
            setViewChallenge(prev => prev ? { ...prev, has_joined: !hasJoined, participant_count: prev.participant_count + (hasJoined ? -1 : 1) } : null);
        }
    };

    const openSubmitDialog = (challenge: Challenge) => {
        setSelectedActionChallenge(challenge); // Use specific state for action
        setProofText('');
        setProofImage(null);
        setIsSubmitOpen(true);
    };

    const handleImageUpload = async (file: File, bucket: string = 'challenges'): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({ title: 'Failed to upload image', variant: 'destructive' });
            return null;
        }
    };

    const handleSubmitProof = async () => {
        if (!selectedActionChallenge) return;
        setIsSubmitting(true);

        try {
            let proofUrl = null;
            let proofType = null;

            if (proofImage) {
                proofUrl = await handleImageUpload(proofImage, 'challenges');
                if (!proofUrl) {
                    setIsSubmitting(false);
                    return;
                }
                proofType = 'image';
            }

            const { error } = await supabase.rpc('submit_challenge_proof', {
                p_challenge_id: selectedActionChallenge.id,
                p_proof_text: proofText || null,
                p_proof_media_url: proofUrl,
                p_proof_media_type: proofType
            });

            if (error) throw error;

            toast({ title: 'Proof submitted!', description: 'Your submission is under review.' });
            setIsSubmitOpen(false);
            if (userId) fetchChallenges(userId);

            // Update view state
            if (viewChallenge && viewChallenge.id === selectedActionChallenge.id) {
                setViewChallenge(prev => prev ? { ...prev, has_submitted: true } : null);
            }
        } catch (error: any) {
            toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateChallenge = async () => {
        if (!newTitle.trim()) {
            toast({ title: 'Title is required', variant: 'destructive' });
            return;
        }

        setIsCreating(true);
        let coverImageUrl = null;

        if (coverImage) {
            setUploadingImage(true);
            coverImageUrl = await handleImageUpload(coverImage);
            setUploadingImage(false);
            if (!coverImageUrl) {
                setIsCreating(false);
                return;
            }
        }

        const { error } = await supabase.rpc('create_challenge', {
            p_title: newTitle.trim(),
            p_description: newDescription.trim() || null,
            p_rules: newRules.trim() || null,
            p_prize_description: newPrize.trim() || null,
            p_cover_image: coverImageUrl,
        });

        if (error) {
            toast({ title: 'Failed to create challenge', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Challenge created!' });
            setIsCreateOpen(false);
            setNewTitle('');
            setNewDescription('');
            setNewRules('');
            setNewPrize('');
            setCoverImage(null);
            if (userId) fetchChallenges(userId);
        }
        setIsCreating(false);
    };

    // Manage Challenge Logic
    const openManageDialog = async (challenge: Challenge | null) => {
        if (!challenge) return;
        setManageChallenge(challenge);
        setManageTab('submissions');
        fetchManageData(challenge.id);
    };

    const fetchManageData = async (challengeId: number) => {
        setLoadingManageData(true);
        const { data: submissionsData } = await supabase.rpc('get_challenge_submissions', { p_challenge_id: challengeId });
        if (submissionsData) setSubmissions(submissionsData);

        const { data: leaderboardData } = await supabase.rpc('get_challenge_leaderboard', { p_challenge_id: challengeId });
        if (leaderboardData) setLeaderboard(leaderboardData);

        setLoadingManageData(false);
    };

    const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected', score: number = 0) => {
        try {
            const { error } = await supabase.rpc('review_challenge_submission', {
                p_submission_id: submissionId,
                p_status: status,
                p_score: score,
                p_reviewer_notes: null
            });

            if (error) throw error;

            toast({ title: `Submission ${status}`, description: 'Participant has been notified.' });
            if (manageChallenge) fetchManageData(manageChallenge.id);
        } catch (error: any) {
            toast({ title: 'Review failed', description: error.message, variant: 'destructive' });
        }
    };

    const handleDeleteChallenge = async () => {
        if (!deleteChallengeId) return;

        try {
            const { error } = await supabase.from('challenges').delete().eq('id', deleteChallengeId);
            if (error) throw error;

            toast({ title: 'Challenge deleted' });
            if (userId) fetchChallenges(userId);
            setDeleteChallengeId(null);
            if (viewChallenge?.id === deleteChallengeId) setViewChallenge(null);
        } catch (error: any) {
            toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        }
    };

    const handleShareChallenge = (challenge: Challenge) => {
        const url = `${window.location.origin}/challenges?id=${challenge.id}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link copied!', description: 'Challenge link copied to clipboard.' });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between p-4 max-w-6xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden mr-2" />
                        <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                            <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">Challenges</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Compete, create, and win prizes</p>
                        </div>
                    </div>
                    {isVerified && (
                        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create Challenge</span>
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6 w-full">
                <div className="max-w-6xl mx-auto space-y-10">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {/* Active Challenges Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary gap-1.5">
                                        <Flame className="h-3.5 w-3.5" /> Active
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">{activeChallenges.length} available</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {activeChallenges.map(challenge => (
                                        <ChallengeCard
                                            key={challenge.id}
                                            challenge={challenge}
                                            userId={userId}
                                            onToggleJoin={toggleJoinChallenge}
                                            onSubmitProof={() => openSubmitDialog(challenge)}
                                            onManage={() => openManageDialog(challenge)}
                                            onDelete={() => setDeleteChallengeId(challenge.id)}
                                            onShare={() => handleShareChallenge(challenge)}
                                            onClick={() => setViewChallenge(challenge)}
                                        />
                                    ))}
                                    {activeChallenges.length === 0 && (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/40">
                                            <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <h3 className="text-lg font-medium">No active challenges</h3>
                                            <p className="text-muted-foreground">Check back later or create one yourself!</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Completed Challenges Section */}
                            {completedChallenges.length > 0 && (
                                <section className="pt-8 border-t">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Badge variant="secondary" className="px-3 py-1 gap-1.5">
                                            <Check className="h-3.5 w-3.5" /> Completed
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">Past events</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80">
                                        {completedChallenges.map(challenge => (
                                            <ChallengeCard
                                                key={challenge.id}
                                                challenge={challenge}
                                                userId={userId}
                                                onToggleJoin={toggleJoinChallenge}
                                                onManage={() => openManageDialog(challenge)}
                                                onDelete={() => setDeleteChallengeId(challenge.id)}
                                                onShare={() => handleShareChallenge(challenge)}
                                                onClick={() => setViewChallenge(challenge)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create Challenge Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Challenge</DialogTitle>
                        <DialogDescription>Launch a new challenge for the community.</DialogDescription>
                    </DialogHeader>
                    {/* ... Same create form ... */}
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                            <Input id="title" placeholder="e.g., Early Morning Chant" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea id="desc" placeholder="What is this challenge about?" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="prize">Prize</Label>
                                <Input id="prize" placeholder="Optional prize..." value={newPrize} onChange={e => setNewPrize(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="image">Cover Image</Label>
                                <Input id="image" type="file" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="rules">Rules</Label>
                            <Textarea id="rules" placeholder="Any specific rules?" value={newRules} onChange={e => setNewRules(e.target.value)} className="min-h-[80px]" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateChallenge} disabled={isCreating || !newTitle.trim()}>
                            {isCreating ? 'Creating...' : 'Launch Challenge'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submit Proof Dialog */}
            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Submit Challenge Proof</DialogTitle>
                        <DialogDescription>
                            Show us what you did for <strong>{selectedActionChallenge?.title}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    {/* ... Same submit form ... */}
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="proof-text">Note (Optional)</Label>
                            <Textarea
                                id="proof-text"
                                placeholder="Describe your submission..."
                                value={proofText}
                                onChange={e => setProofText(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="proof-image">Proof Image/Screenshot</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    id="proof-image"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={e => setProofImage(e.target.files?.[0] || null)}
                                />
                                {proofImage ? (
                                    <div className="flex flex-col items-center">
                                        <Check className="h-8 w-8 text-green-500 mb-2" />
                                        <p className="text-sm font-medium">{proofImage.name}</p>
                                        <p className="text-xs text-muted-foreground">Click to change</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <Upload className="h-8 w-8 mb-2" />
                                        <p className="text-sm">Upload Screenshot</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitProof} disabled={isSubmitting || (!proofText && !proofImage)}>
                            {isSubmitting ? 'Submitting...' : 'Submit Proof'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewChallenge} onOpenChange={(open) => !open && setViewChallenge(null)}>
                <DialogContent className="max-w-3xl h-[90vh] md:max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
                    <ScrollArea className="flex-1 w-full bg-background/50">
                        {/* Cover Image Header */}
                        <div className="relative w-full aspect-video bg-black/5 flex items-center justify-center overflow-hidden">
                            {viewChallenge?.cover_image ? (
                                <>
                                    {/* Blurred Background */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl"
                                        style={{ backgroundImage: `url(${viewChallenge.cover_image})` }}
                                    />
                                    <img
                                        src={viewChallenge.cover_image}
                                        alt={viewChallenge.title}
                                        className="relative w-full h-full object-contain z-10"
                                    />
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                                    <Trophy className="h-16 w-16 text-primary/20" />
                                </div>
                            )}
                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 rounded-full h-8 w-8 bg-background/80 hover:bg-background z-20" onClick={() => setViewChallenge(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Header Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {viewChallenge?.category && <Badge variant="outline">{viewChallenge.category}</Badge>}
                                    <Badge variant="secondary"><Users className="h-3 w-3 mr-1" /> {viewChallenge?.participant_count} participants</Badge>
                                </div>
                                <h2 className="text-2xl font-bold">{viewChallenge?.title}</h2>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={viewChallenge?.creator_avatar || ''} />
                                        <AvatarFallback>C</AvatarFallback>
                                    </Avatar>
                                    <span>Hosted by {viewChallenge?.creator_name || 'Community'}</span>
                                    <span>•</span>
                                    {viewChallenge?.end_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Ends {formatDistanceToNow(new Date(viewChallenge.end_date))}</span>}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Description</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{viewChallenge?.description || "No description provided."}</p>
                            </div>

                            {/* Rules */}
                            {viewChallenge?.rules && (
                                <div className="space-y-2 bg-muted/30 p-4 rounded-lg border">
                                    <h3 className="font-semibold text-sm">Rules</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{viewChallenge.rules}</p>
                                </div>
                            )}

                            {/* Prize */}
                            {viewChallenge?.prize_description && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-500"><Award className="h-4 w-4" /> Prize</h3>
                                    <p className="text-sm">{viewChallenge.prize_description}</p>
                                </div>
                            )}

                            {/* Extra bottom padding for scrolling past footer */}
                            <div className="h-20 md:h-0" />
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-background flex gap-2 justify-end sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        {/* Footer Actions - Duplicate logic from card but expanded */}
                        {viewChallenge && userId === viewChallenge.created_by ? (
                            <>
                                <Button variant="outline" onClick={() => { setViewChallenge(null); openManageDialog(viewChallenge); }}>Manage Challenge</Button>
                                <Button onClick={() => handleShareChallenge(viewChallenge)}>Share Link</Button>
                            </>
                        ) : viewChallenge && (
                            <>
                                <Button
                                    variant={viewChallenge.has_joined ? "secondary" : "default"}
                                    onClick={() => toggleJoinChallenge(viewChallenge.id, viewChallenge.has_joined)}
                                >
                                    {viewChallenge.has_joined ? "Leave Challenge" : "Join Challenge"}
                                </Button>
                                {viewChallenge.has_joined && (
                                    <Button
                                        className={viewChallenge.has_submitted ? 'border-green-500/50 text-green-600 hover:text-green-700 hover:bg-green-50' : ''}
                                        variant={viewChallenge.has_submitted ? "outline" : "default"}
                                        onClick={() => { setViewChallenge(null); openSubmitDialog(viewChallenge); }}
                                        disabled={viewChallenge.has_submitted}
                                    >
                                        {viewChallenge.has_submitted ? "Completed" : "Submit Proof"}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Challenge Dialog (Creator Only) */}
            <Dialog open={!!manageChallenge} onOpenChange={(open) => !open && setManageChallenge(null)}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Manage Challenge: {manageChallenge?.title}</DialogTitle>
                        <DialogDescription>Review submissions and manage participants.</DialogDescription>
                    </DialogHeader>
                    {/* ... Same manage content ... */}
                    <Tabs value={manageTab} onValueChange={setManageTab} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList>
                            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
                            <TabsTrigger value="leaderboard">Leaderboard ({leaderboard.length})</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-auto mt-4 px-1">
                            {loadingManageData ? (
                                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
                            ) : (
                                <>
                                    <TabsContent value="submissions" className="space-y-4 m-0 h-full">
                                        {submissions.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">No submissions yet.</div>
                                        ) : (
                                            submissions.map(sub => (
                                                <Card key={sub.id} className="overflow-hidden">
                                                    <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={sub.user_avatar || ''} />
                                                            <AvatarFallback>{sub.user_username?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <CardTitle className="text-sm font-medium">{sub.user_name || sub.user_username}</CardTitle>
                                                            <CardDescription className="text-xs">{formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}</CardDescription>
                                                        </div>
                                                        <Badge variant={sub.status === 'approved' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'outline'}>
                                                            {sub.status}
                                                        </Badge>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-2 text-sm">
                                                        {sub.proof_text && <p className="mb-2 bg-muted/30 p-2 rounded text-muted-foreground">{sub.proof_text}</p>}
                                                        {sub.proof_media_url && (
                                                            <div className="mt-2 rounded-md overflow-hidden border max-h-48 w-fit">
                                                                <img src={sub.proof_media_url} alt="Proof" className="object-contain max-h-48" />
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                    {sub.status === 'pending' && (
                                                        <CardFooter className="p-2 px-4 bg-muted/20 gap-2 justify-end">
                                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReviewSubmission(sub.id, 'rejected')}>Reject</Button>
                                                            <Button size="sm" onClick={() => handleReviewSubmission(sub.id, 'approved', 10)}>Approve</Button>
                                                        </CardFooter>
                                                    )}
                                                </Card>
                                            ))
                                        )}
                                    </TabsContent>

                                    <TabsContent value="leaderboard" className="space-y-2 m-0 h-full">
                                        {leaderboard.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">No participants yet.</div>
                                        ) : (
                                            leaderboard.map((entry, index) => (
                                                <div key={entry.user_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                    <div className="w-6 text-center font-bold text-muted-foreground text-sm">#{index + 1}</div>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={entry.avatar_url || ''} />
                                                        <AvatarFallback>{entry.username?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium flex items-center gap-1">
                                                            {entry.name || entry.username}
                                                            {entry.status === 'winner' && <Trophy className="h-3 w-3 text-yellow-500" />}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold">{entry.score} pts</div>
                                                        <div className="text-xs text-muted-foreground capitalize">{entry.status}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteChallengeId} onOpenChange={(open) => !open && setDeleteChallengeId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the challenge and all associated submissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChallenge} className="bg-red-600 hover:bg-red-700">Delete Challenge</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const ChallengeCard = ({
    challenge,
    userId,
    onToggleJoin,
    onSubmitProof,
    onManage,
    onDelete,
    onShare,
    onClick
}: {
    challenge: Challenge,
    userId: string | null,
    onToggleJoin: (id: number, joined: boolean) => void,
    onSubmitProof?: () => void,
    onManage?: () => void,
    onDelete?: () => void,
    onShare?: () => void,
    onClick?: () => void
}) => {
    const isOwner = userId === challenge.created_by;

    return (
        <Card
            className="flex flex-col h-full overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group relative cursor-pointer"
            onClick={onClick}
        >
            {/* Banner Image */}
            <div className="relative h-36 bg-muted w-full overflow-hidden">
                {challenge.cover_image ? (
                    <img
                        src={challenge.cover_image}
                        alt={challenge.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <Trophy className="h-10 w-10 text-primary/20" />
                    </div>
                )}

                {/* Overlay Badge */}
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/50 border-white/20">
                        <Users className="h-3 w-3 mr-1" /> {challenge.participant_count}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">{challenge.title}</CardTitle>
                </div>
                {challenge.category && (
                    <Badge variant="outline" className="w-fit text-[10px] h-5 px-1.5 font-normal text-muted-foreground mt-1">
                        {challenge.category}
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-1">
                <CardDescription className="line-clamp-2 text-xs mt-2">
                    {challenge.description || "No description provided."}
                </CardDescription>

                {challenge.end_date && (
                    <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Ends {formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-3 border-t bg-muted/20 gap-2" onClick={(e) => e.stopPropagation()}>
                {isOwner ? (
                    <>
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={onManage}>
                            <Settings className="h-3.5 w-3.5" /> Manage
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onShare}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <>
                        <Button
                            variant={challenge.has_joined ? "secondary" : "default"}
                            className="flex-1 h-8 text-xs"
                            onClick={() => onToggleJoin(challenge.id, challenge.has_joined)}
                        >
                            {challenge.has_joined ? "Joined" : "Join Now"}
                        </Button>

                        {challenge.has_joined ? (
                            <Button
                                variant={challenge.has_submitted ? "outline" : "default"}
                                className={`flex-1 h-8 text-xs ${challenge.has_submitted ? 'border-green-500/50 text-green-600 hover:text-green-700 hover:bg-green-50' : ''}`}
                                onClick={onSubmitProof}
                                disabled={challenge.has_submitted}
                            >
                                {challenge.has_submitted ? (
                                    <><Check className="h-3.5 w-3.5 mr-1" /> Done</>
                                ) : (
                                    <><Upload className="h-3.5 w-3.5 mr-1" /> Proof</>
                                )}
                            </Button>
                        ) : (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onShare}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                        )}
                    </>
                )}
            </CardFooter>
        </Card>
    );
}