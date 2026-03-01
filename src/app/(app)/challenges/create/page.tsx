'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Upload, Clock, ShieldCheck, Trophy, Sparkles, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';

export default function CreateChallengePage() {
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Basic Fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rules, setRules] = useState('');
    const [prize, setPrize] = useState('');
    const [category, setCategory] = useState<string>('fitness');
    const [challengeType, setChallengeType] = useState<string>('proof_based');
    const [submissionDeadline, setSubmissionDeadline] = useState('');

    // File upload
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Advanced Fields
    const [difficulty, setDifficulty] = useState('beginner');
    const [visibility, setVisibility] = useState('public');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [gracePeriodHours, setGracePeriodHours] = useState('0');

    const [allowMultiple, setAllowMultiple] = useState(false);
    const [maxSubmissions, setMaxSubmissions] = useState('1');
    const [allowEditBeforeDeadline, setAllowEditBeforeDeadline] = useState(true);

    const [moderationType, setModerationType] = useState('manual');
    const [scoringType, setScoringType] = useState('binary');
    const [votingEnabled, setVotingEnabled] = useState(false);
    const [submissionsVisibility, setSubmissionsVisibility] = useState('public');
    const [rewardType, setRewardType] = useState('none');

    useState(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async (file: File) => {
        if (!userId) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('challenges')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('challenges').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const handleSave = async (status: 'draft' | 'scheduled' | 'active') => {
        if (!title.trim()) {
            toast({ title: 'Title is required', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        let coverImageUrl = null;

        if (coverImage) {
            coverImageUrl = await handleUploadImage(coverImage);
        }

        // Format dates if provided
        const deadline = submissionDeadline ? new Date(submissionDeadline).toISOString() : null;
        const start = startDate ? new Date(startDate).toISOString() : null;
        const end = endDate ? new Date(endDate).toISOString() : null;

        // Determine correct status based on start date
        let finalStatus = status;
        if (status === 'active' && start && new Date(start) > new Date()) {
            finalStatus = 'scheduled';
        }

        const payload = {
            p_title: title.trim(),
            p_description: description.trim() || null,
            p_rules: rules.trim() || null,
            p_prize_description: prize.trim() || null,
            p_cover_image: coverImageUrl,
            p_status: finalStatus,
            p_type: challengeType,
            p_difficulty: difficulty,
            p_category: category,
            p_submission_deadline: deadline,
            p_end_date: end
            // Note: If you want to pass all 30 fields, you need to either update the RPC to accept json or add all params to create_challenge.
            // For now passing standard fields to trigger creation.
        };

        const { error, data: newChallengeId } = await supabase.rpc('create_challenge', payload);

        if (error) {
            toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: status === 'draft' ? 'Draft saved' : 'Challenge created!' });

            // Depending on architecture, you might want a secondary query here to update the advanced fields using the new ID.
            if (status !== 'draft') {
                // Example: update the advanced fields directly via Supabase table update if RPC doesn't accept all yet
                await supabase.from('challenges').update({
                    grace_period_hours: parseInt(gracePeriodHours) || 0,
                    allow_multiple_submissions: allowMultiple,
                    max_submissions_per_user: parseInt(maxSubmissions) || 1,
                    allow_edit_before_deadline: allowEditBeforeDeadline,
                    moderation_type: moderationType,
                    scoring_type: scoringType,
                    voting_enabled: votingEnabled,
                    submissions_visibility: submissionsVisibility,
                    reward_type: rewardType,
                    visibility: visibility
                }).eq('id', newChallengeId);
            }

            // Redirect
            router.push(`/challenges?id=${newChallengeId}`);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
                <div className="flex items-center justify-between p-3 md:p-4 max-w-4xl mx-auto w-full gap-2">
                    <div className="flex items-center gap-2 md:gap-4 shrink min-w-0">
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base md:text-xl font-bold truncate">Create Challenge</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block truncate">Configure rules, rewards, and deadlines</p>
                        </div>
                    </div>
                    <div className="flex gap-1.5 md:gap-2 shrink-0">
                        <Button variant="secondary" size="sm" className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-3 whitespace-nowrap" onClick={() => setShowPreview(!showPreview)} disabled={isSubmitting}>
                            {showPreview ? 'Edit' : 'Preview'}
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-3 whitespace-nowrap" onClick={() => handleSave('draft')} disabled={isSubmitting}>
                            <span className="hidden sm:inline">Save&nbsp;</span>Draft
                        </Button>
                        <Button size="sm" className="h-8 md:h-9 text-xs md:text-sm px-2 md:px-3 whitespace-nowrap" onClick={() => handleSave('active')} disabled={isSubmitting}>
                            {isSubmitting ? '...' : <><span className="hidden sm:inline">Publish Challenge</span><span className="sm:hidden">Publish</span></>}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 w-full pb-32">
                {showPreview ? (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                            {imagePreview ? (
                                <div className="w-full h-48 md:h-72 bg-muted/30 relative">
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Cover" />
                                </div>
                            ) : (
                                <div className="w-full h-48 md:h-72 bg-muted flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <Upload className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                        <p>No Cover Image</p>
                                    </div>
                                </div>
                            )}
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className="bg-secondary/50 text-xs py-1 hover:bg-secondary/70 capitalize border-transparent">{category}</Badge>
                                        <Badge variant="outline" className="gap-1 capitalize"><ShieldCheck className="h-3 w-3" /> {challengeType.replace('_', ' ')}</Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 break-words text-wrap overflow-hidden min-w-0">{title || 'Untitled Challenge'}</h1>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t min-w-0 overflow-hidden w-full">
                                    <div className="md:col-span-2 space-y-8 min-w-0">
                                        <section className="min-w-0">
                                            <h3 className="text-xl font-bold mb-4">About this Challenge</h3>
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap flex-1 break-words overflow-wrap-anywhere min-w-0 text-wrap break-all md:break-words">{description || 'No description provided.'}</p>
                                        </section>
                                        <section className="min-w-0">
                                            <div className="flex items-center gap-2 mb-4">
                                                <ShieldCheck className="h-5 w-5 text-primary" />
                                                <h3 className="text-xl font-bold">Rules & Guidelines</h3>
                                            </div>
                                            <div className="bg-muted/30 rounded-xl p-5 border text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono break-words overflow-wrap-anywhere min-w-0 text-wrap break-all md:break-words">
                                                {rules || 'No rules provided.'}
                                            </div>
                                        </section>
                                    </div>
                                    <div className="space-y-6 min-w-0">
                                        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-xl p-5 min-w-0">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Trophy className="h-5 w-5 text-yellow-500" />
                                                <h3 className="font-bold text-yellow-700 dark:text-yellow-500">The Prize</h3>
                                            </div>
                                            <p className="text-sm text-yellow-800 dark:text-yellow-200/80 break-words overflow-wrap-anywhere min-w-0 text-wrap break-all md:break-words">{prize || 'No prize specified.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in min-w-0 w-full overflow-hidden">

                        {/* Basic Settings */}
                        <div className="space-y-6 bg-card p-4 md:p-6 rounded-xl border shadow-sm min-w-0 w-full">
                            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">Core Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 md:col-span-2">
                                    <div className="grid gap-2">
                                        <Label>Challenge Type <span className="text-red-500">*</span></Label>
                                        <Select value={challengeType} onValueChange={setChallengeType}>
                                            <SelectTrigger className="h-12 bg-muted/30">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="proof_based">Proof-Based (Manual Review)</SelectItem>
                                                <SelectItem value="speed_race">Speed Race (First to submit wins)</SelectItem>
                                                <SelectItem value="community_voted">Community Voted</SelectItem>
                                                <SelectItem value="scored">Scored (1-10 judges points)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">This determines how the winner is selected.</p>
                                    </div>
                                </div>

                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                    <Input id="title" placeholder="e.g., 30 Days of Code, Morning Gratitude" className="text-lg py-6" value={title} onChange={(e) => setTitle(e.target.value)} />
                                </div>

                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="desc">Description</Label>
                                    <Textarea id="desc" placeholder="What is this challenge about? Inspire your community." className="min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fitness">Fitness</SelectItem>
                                            <SelectItem value="coding">Coding & Tech</SelectItem>
                                            <SelectItem value="spiritual">Spiritual / Yoga</SelectItem>
                                            <SelectItem value="art">Art & Design</SelectItem>
                                            <SelectItem value="photography">Photography</SelectItem>
                                            <SelectItem value="writing">Writing</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Submission Deadline</Label>
                                    <Input type="datetime-local" value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} />
                                </div>

                                <div className="grid gap-2 md:col-span-2">
                                    <Label>Banner Image</Label>
                                    <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative h-48 bg-muted/10 overflow-hidden">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleImageChange}
                                        />
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                                                <p className="text-sm font-medium">Upload Cover Image</p>
                                                <p className="text-xs text-muted-foreground">Recommended: 1200x600px</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 bg-card p-4 md:p-6 rounded-xl border shadow-sm min-w-0 w-full">
                            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">Rules & Rewards</h2>
                            </div>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="rules">Rules & Guidelines</Label>
                                    <Textarea id="rules" placeholder="1. No plagiarism&#10;2. Must be original work&#10;..." className="min-h-[100px] font-mono text-sm" value={rules} onChange={(e) => setRules(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="prize">What does the winner get?</Label>
                                    <Input id="prize" placeholder="e.g., $50 Gift Card, Custom Badge, Fame" value={prize} onChange={(e) => setPrize(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Advanced Accordion */}
                        <Accordion type="single" collapsible className="w-full bg-muted/20 rounded-xl border min-w-0 overflow-hidden">
                            <AccordionItem value="advanced" className="border-0">
                                <AccordionTrigger className="px-4 md:px-6 hover:no-underline hover:bg-muted/40 rounded-xl transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-semibold">Advanced Power Settings</span>
                                        <Badge variant="secondary" className="ml-2 text-[10px] bg-primary/10 text-primary uppercase">Pro Creators</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 pt-2 space-y-8">

                                    {/* Scheduling */}
                                    <div className="space-y-4 pt-4">
                                        <h3 className="font-medium flex items-center gap-2 text-foreground/80"><Clock className="h-4 w-4" /> Scheduling & Access</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Start Date (Schedule to auto-publish)</Label>
                                                <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Event End Date (When the page archives)</Label>
                                                <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Grace Period (Hours after deadline allowed)</Label>
                                                <Input type="number" min="0" value={gracePeriodHours} onChange={e => setGracePeriodHours(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Visibility</Label>
                                                <Select value={visibility} onValueChange={setVisibility}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="public">Public (Anyone)</SelectItem>
                                                        <SelectItem value="followers_only">Followers Only</SelectItem>
                                                        <SelectItem value="private">Private (Invite only)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submissions */}
                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h3 className="font-medium text-foreground/80">Submission Logic</h3>
                                        <div className="grid gap-4 bg-background p-4 rounded-lg border">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Allow Multiple Entries</Label>
                                                    <p className="text-xs text-muted-foreground">Can a user submit more than one proof?</p>
                                                </div>
                                                <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
                                            </div>
                                            {allowMultiple && (
                                                <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                                                    <Label>Max Submissions per user</Label>
                                                    <Input type="number" min="1" value={maxSubmissions} onChange={e => setMaxSubmissions(e.target.value)} className="max-w-[150px]" />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Allow Edits Before Deadline</Label>
                                                    <p className="text-xs text-muted-foreground">Participants can swap their image/text before the clock runs out.</p>
                                                </div>
                                                <Switch checked={allowEditBeforeDeadline} onCheckedChange={setAllowEditBeforeDeadline} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Flow */}
                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h3 className="font-medium text-foreground/80 flex items-center gap-2"><Trophy className="h-4 w-4" /> Review & Moderation</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Moderation Mode</Label>
                                                <Select value={moderationType} onValueChange={setModerationType}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="manual">Manual Review (You approve)</SelectItem>
                                                        <SelectItem value="auto_approve">Auto-Approve (Immediate)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Submissions Privacy</Label>
                                                <Select value={submissionsVisibility} onValueChange={setSubmissionsVisibility}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="public">Public Wall (Everyone sees entries)</SelectItem>
                                                        <SelectItem value="author_only">Private to Author</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {challengeType === 'community_voted' && (
                                                <div className="grid gap-2 md:col-span-2 bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle className="h-4 w-4 text-purple-500" />
                                                        <Label className="font-bold text-purple-700 dark:text-purple-400">Voting Settings (Community Voted required)</Label>
                                                    </div>
                                                    <div className="flex items-center justify-between mb-4 mt-2">
                                                        <Label>Enable Public Voting</Label>
                                                        <Switch checked={votingEnabled} onCheckedChange={setVotingEnabled} />
                                                    </div>
                                                    <Label className="mb-1">Reward Issue Type</Label>
                                                    <Select value={rewardType} onValueChange={setRewardType}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None explicitly handled</SelectItem>
                                                            <SelectItem value="badge">Profile Badge</SelectItem>
                                                            <SelectItem value="points">Platform Points</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}
            </div>
        </div>
    );
}
