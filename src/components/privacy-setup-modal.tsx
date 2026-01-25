'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { Lock, Globe, Loader2 } from 'lucide-react';
import { useAppContext } from '@/providers/app-context';

interface PrivacySetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PrivacySetupModal({ open, onOpenChange }: PrivacySetupModalProps) {
    const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();
    const router = useRouter();
    const { refreshProfile } = useAppContext();

    const handleSave = async () => {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error('No user found');

            const isPrivate = privacy === 'private';

            const { error } = await supabase
                .from('profiles')
                .update({
                    is_private: isPrivate,
                    has_set_privacy: true,
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile(); // Refresh global state
            onOpenChange(false);

            toast({
                title: 'Privacy settings updated',
                description: `Your profile is now ${privacy}.`,
            });

        } catch (error) {
            console.error('Error updating privacy:', error);
            toast({
                title: 'Error',
                description: 'Failed to update privacy settings. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing by clicking outside or pressing escape if it's mandatory
            // We can check if it's mandatory here, but for now we enforce it by not providing a way to close
            // unless the update is successful.
            // However, onOpenChange is called by the Dialog component.
            // To strictly prevent closing, we would conditionally call onOpenChange(val) only if val is true?
            // Actually, preventing close effectively means ignoring false values or overriding onInteractOutside.
            // But for better UX, we just don't pass onOpenChange to Dialog content's close button (which we custom build).
            // Standard DialogContent has a strict close button. We can hide it with CSS or usage.
            // Shadcn DialogContent usually has a Close button.
            // We will just let the parent control 'open' and if it's mandatory, the parent won't close it.
            // BUT, Dialog component calls onOpenChange when clicking overlay.
            // We will just effectively do nothing if we want it to be persistent.
            // For now, let's allow it to be driven by props.
            if (!val) return; // Do not allow closing
        }}>
            <DialogContent className="sm:max-w-[425px] [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <Icons.logo className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl">Profile Privacy</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        How would you like people to see your profile? You can change this later in settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <RadioGroup value={privacy} onValueChange={(v: 'public' | 'private') => setPrivacy(v)} className="grid gap-4">
                        <div>
                            <RadioGroupItem value="public" id="public" className="peer sr-only" />
                            <Label
                                htmlFor="public"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Globe className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                                <div className="text-center">
                                    <div className="font-semibold text-lg">Public Profile</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        Anyone can see your posts and follow you.
                                    </div>
                                </div>
                            </Label>
                        </div>

                        <div>
                            <RadioGroupItem value="private" id="private" className="peer sr-only" />
                            <Label
                                htmlFor="private"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Lock className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                                <div className="text-center">
                                    <div className="font-semibold text-lg">Private Profile</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        Only followers can see your posts. You approve follow requests.
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleSave} className="w-full sm:w-auto min-w-[150px]" disabled={loading} size="lg">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
