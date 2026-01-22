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

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetUserId: string;
    targetUsername: string;
}

export function ReportDialog({ open, onOpenChange, targetUserId, targetUsername }: ReportDialogProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!reason) {
            toast({ variant: "destructive", title: "Error", description: "Please select a reason." });
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

            toast({ title: "Report submitted", description: "Thank you for reporting. We will review it shortly." });
            onOpenChange(false);
            setReason('');
            setDescription('');
        } catch (error: any) {
            console.error('Error submitting report:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to submit report." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Report @{targetUsername}</DialogTitle>
                    <DialogDescription>
                        Help us keep the community safe. accurately describe the issue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select onValueChange={setReason} value={reason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spam">Spam</SelectItem>
                                <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                                <SelectItem value="fake">Fake Account</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide more details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !reason}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
