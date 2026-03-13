'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetUserId: string;
    targetUsername: string;
}

export function ReportDialog({ open, onOpenChange, targetUserId, targetUsername }: ReportDialogProps) {
  const { t } = useTranslation();

    const supabase = createClient();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!reason) {
            toast({ variant: "destructive", title: t('common.error'), description: t('profile.pleaseSelectAReason') });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('reports')
                .insert({
                    target_user_id: targetUserId,
                    reason,
                    description
                });

            if (error) throw error;

            toast({ title: t('profile.reportSubmittedTitle'), description: t('profile.thankYouForReporting') });
            onOpenChange(false);
            setReason('');
            setDescription('');
        } catch (error: any) {
            console.error('Error submitting report:', error);
            toast({ variant: "destructive", title: t('common.error'), description: t('profile.failedToSubmitReport') });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('profile.reportUser', { username: targetUsername })}</DialogTitle>
                    <DialogDescription>
                        {t('profile.reportDialogDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">{t('profile.reason')}</Label>
                        <Select onValueChange={setReason} value={reason}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('profile.selectAReason')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spam">{t('dialogs.reportReasons.spam')}</SelectItem>
                                <SelectItem value="harassment">{t('profile.harassmentOrBullying')}</SelectItem>
                                <SelectItem value="inappropriate">{t('dialogs.reportReasons.inappropriate')}</SelectItem>
                                <SelectItem value="fake">{t('profile.fakeAccount')}</SelectItem>
                                <SelectItem value="other">{t('challenges.other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('profile.descriptionOptional')}</Label>
                        <Textarea
                            id="description"
                            placeholder={t('profile.provideMoreDetails')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !reason}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('profile.submitReport')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
