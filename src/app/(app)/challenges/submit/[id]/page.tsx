'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Upload, Link as LinkIcon, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Challenge } from '@/components/challenges/types';
import { Card, CardContent } from '@/components/ui/card';

import { useTranslation } from 'react-i18next';

export default function SubmitProofPage() {
  const { t } = useTranslation();

    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [challengeId, setChallengeId] = useState<number | null>(null);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Form State
    const [proofText, setProofText] = useState('');
    const [proofLink, setProofLink] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (params.id) {
            const id = parseInt(params.id as string, 10);
            if (!isNaN(id)) setChallengeId(id);
        }
    }, [params.id]);

    useEffect(() => {
        const fetchChallenge = async () => {
            if (!challengeId) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);

            const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: user.id });
            if (!error && data) {
                const found = (data as Challenge[]).find(c => c.id === challengeId);
                if (found) {
                    if (!found.has_joined) {
                        toast({ title: 'Not Joined', description: 'You must join this challenge to submit proof.', variant: 'destructive' });
                        router.push(`/challenges/${challengeId}`);
                        return;
                    }
                    setChallenge(found);
                } else {
                    router.push('/challenges');
                }
            }
        };
        fetchChallenge();
    }, [challengeId, supabase]);

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadMedia = async (): Promise<string | null> => {
        if (!mediaFile || !userId) return null;
        try {
            const fileExt = mediaFile.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `submissions/${challengeId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('challenges')
                .upload(filePath, mediaFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('challenges').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload Error:', error);
            // toast({ title: 'Image Upload Failed', variant: 'destructive' });
            return null;
        }
    };

    const handleSubmit = async (isDraft: boolean) => {
        if (!challengeId || !userId) return;

        if (!proofText.trim() && !mediaFile && !proofLink.trim()) {
            toast({ title: 'Empty Submission', description: 'Please provide some form of proof.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        let mediaUrl = null;
        if (mediaFile) {
            mediaUrl = await uploadMedia();
        }

        // We assume the RPC is updated to accept the new payload structure
        const payload = {
            p_challenge_id: challengeId,
            p_proof_text: proofText,
            p_proof_media_url: mediaUrl,
            // Assuming DB has these fields, or they are ignored
            // p_proof_link_url: proofLink,
            // p_is_draft: isDraft
        };

        const { error, data } = await supabase.rpc('submit_challenge_proof', payload);

        if (error) {
            toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: isDraft ? 'Draft Saved' : 'Proof Submitted!', description: 'Your entry is under review.' });

            // If it succeeds but was meant as a draft, we might need a separate update if RPC doesn't support p_is_draft yet
            if (isDraft && data) {
                await supabase.from('challenge_submissions').update({ is_draft: true }).eq('id', data);
            }

            router.push(`/challenges/${challengeId}`);
        }
        setIsSubmitting(false);
    };

    if (!challenge) {
        return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
                <div className="flex items-center p-4 max-w-3xl mx-auto w-full gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold line-clamp-1">{challenge.title}</h1>
                        <p className="text-xs text-muted-foreground">{t('challenges.submitProofOfCompletion')}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-8 w-full pb-32">
                <div className="max-w-3xl mx-auto space-y-8">

                    <div className="bg-muted/30 border border-primary/20 rounded-xl p-4 md:p-6 mb-8 flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg hidden sm:block">
                            <CheckCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">{t('challenges.guidelines')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Review the challenge rules carefully. Upload a clear photo, video link, or detailed notes to prove you've accomplished the goal.</p>
                            {challenge.submission_deadline && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-orange-500">
                                    <Clock className="h-3.5 w-3.5" /> Due by {new Date(challenge.submission_deadline).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-6 md:p-8 space-y-8">

                            {/* Media Upload */}
                            <div className="space-y-3">
                                <Label className="text-base font-bold flex items-center gap-2"><Upload className="h-4 w-4" />{t('challenges.mediaProof')}</Label>
                                <div className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center relative bg-muted/20 min-h-[200px] overflow-hidden">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleMediaChange}
                                    />
                                    {mediaPreview ? (
                                        <img src={mediaPreview} alt={t('settings.appearance.preview')} className="absolute inset-0 w-full h-full object-contain bg-black/5" />
                                    ) : (
                                        <>
                                            <div className="h-12 w-12 rounded-full bg-background border flex items-center justify-center mb-3 shadow-sm">
                                                <Upload className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">{t('challenges.clickOrDragFileHere')}</p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">PNG, JPG, or MP4 up to 10MB</p>
                                        </>
                                    )}
                                    {mediaPreview && (
                                        <div className="absolute top-2 right-2 z-20">
                                            <Button size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); setMediaFile(null); setMediaPreview(null); }} className="h-8 shadow-md">{t('challenges.replace')}</Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes Area */}
                            <div className="space-y-3">
                                <Label htmlFor="notes" className="text-base font-bold flex items-center gap-2"><FileText className="h-4 w-4" />{t('challenges.notesStory')}</Label>
                                <Textarea
                                    id="notes"
                                    placeholder={t('challenges.describeYourExperienceCompletingThisChallenge')}
                                    className="min-h-[150px] resize-none text-base p-4"
                                    value={proofText}
                                    onChange={(e) => setProofText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground text-right">{proofText.length} characters</p>
                            </div>

                            {/* Link Field */}
                            <div className="space-y-3">
                                <Label htmlFor="link" className="text-base font-bold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> External Link <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
                                <Input
                                    id="link"
                                    type="url"
                                    placeholder="https://github.com/your/repo or Strava link"
                                    className="h-12"
                                    value={proofLink}
                                    onChange={(e) => setProofLink(e.target.value)}
                                />
                            </div>

                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="absolute bottom-0 inset-x-0 p-4 border-t bg-background/95 backdrop-blur-md z-40 flex items-center justify-end px-4 md:px-8">
                <div className="max-w-3xl w-full mx-auto flex gap-3 sm:justify-end">
                    <Button
                        variant="outline"
                        className="flex-1 sm:flex-none sm:w-32"
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(true)}
                    >{t('challenges.saveDraft')}</Button>
                    <Button
                        className="flex-1 sm:flex-none sm:w-48 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(false)}
                    >
                        {isSubmitting ? 'Uploading...' : 'Submit Entry'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
