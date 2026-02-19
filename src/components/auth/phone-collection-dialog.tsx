'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface PhoneCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onSuccess?: () => void;
    forceRequired?: boolean; // If true, hide close button/prevent closing without success
}

export function PhoneCollectionDialog({
    open,
    onOpenChange,
    title = "Add Phone Number",
    description = "Please link a phone number to your account for better security and recovery.",
    onSuccess,
    forceRequired = false
}: PhoneCollectionDialogProps) {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    const [timeLeft, setTimeLeft] = useState(0);

    // Timer effect
    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

    const handleSendOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setError(null);
        setIsLoading(true);

        // Using updateUser to link phone to current session
        const { error } = await supabase.auth.updateUser({
            phone: phone
        });

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            setIsOtpSent(true);
            setTimeLeft(120); // 120 seconds cooldown
            toast({
                title: "OTP Sent",
                description: `We've sent a verification code to ${phone}`,
            });
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { error } = await supabase.auth.verifyOtp({
            phone,
            token: otp,
            type: 'phone_change',
        });

        setIsLoading(false);

        if (error) {
            setError(error.message);
        } else {
            toast({
                title: "Phone Verified",
                description: "Your phone number has been successfully linked.",
            });

            // Also update public.profiles
            await supabase.from('profiles').update({ phone }).eq('id', (await supabase.auth.getUser()).data.user?.id);

            if (onSuccess) onSuccess();
            onOpenChange(false);
            router.refresh();

            // Reset state
            setPhone('');
            setOtp('');
            setIsOtpSent(false);
            setTimeLeft(0);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (forceRequired) {
            e.preventDefault();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={open} onOpenChange={forceRequired ? undefined : onOpenChange}>
            <DialogContent
                className="sm:max-w-[425px]"
                hideClose={forceRequired}
                onInteractOutside={handleInteractOutside}
                onEscapeKeyDown={forceRequired ? (e) => e.preventDefault() : undefined}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isOtpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone-collection">Phone Number</Label>
                            <Input
                                id="phone-collection"
                                type="tel"
                                placeholder="e.g. +919876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading || !phone}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp-collection">One-Time Password</Label>
                            <Input
                                id="otp-collection"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                            />
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>Sent to {phone}. <button type="button" onClick={() => setIsOtpSent(false)} className="text-primary hover:underline">Change number</button></span>

                                {timeLeft > 0 ? (
                                    <span>Resend in {formatTime(timeLeft)}</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleSendOtp()}
                                        className="text-primary hover:underline font-medium"
                                        disabled={isLoading}
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading || otp.length < 6}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Link
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
