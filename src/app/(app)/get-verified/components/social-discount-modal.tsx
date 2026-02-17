'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Twitter, Instagram, Facebook, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialDiscountModalProps {
    twitterLink: string;
    instagramLink: string;
    facebookLink: string;
    setTwitterLink: (v: string) => void;
    setInstagramLink: (v: string) => void;
    setFacebookLink: (v: string) => void;
    allLinksProvided: boolean;
}

export function SocialDiscountModal({
    twitterLink,
    instagramLink,
    facebookLink,
    setTwitterLink,
    setInstagramLink,
    setFacebookLink,
    allLinksProvided
}: SocialDiscountModalProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="max-w-3xl mx-auto cursor-pointer group">
                    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl overflow-hidden group-hover:border-primary/50 transition-colors">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg mb-0.5">Unlock ₹100 Flat Off!</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        Post about KCS on
                                        <div className="flex -space-x-1">
                                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center"><Twitter className="h-3 w-3 text-blue-500" /></div>
                                            <div className="h-5 w-5 rounded-full bg-pink-100 flex items-center justify-center"><Instagram className="h-3 w-3 text-pink-500" /></div>
                                            <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center"><Facebook className="h-3 w-3 text-blue-700" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {allLinksProvided ? (
                                <div className="flex items-center gap-2 text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full text-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Unlocked
                                </div>
                            ) : (
                                <Button size="sm" variant="secondary" className="font-semibold pointer-events-none group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    Unlock Now
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Claim Your Discount
                    </DialogTitle>
                    <DialogDescription>
                        Share a post about Krishna Connect on these platforms and paste the links below to unlock ₹100 off.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {[
                        { id: 'twitter', icon: <Twitter className="h-4 w-4" />, color: 'text-[#1DA1F2]', value: twitterLink, setter: setTwitterLink, placeholder: 'https://twitter.com/...' },
                        { id: 'instagram', icon: <Instagram className="h-4 w-4" />, color: 'text-[#E4405F]', value: instagramLink, setter: setInstagramLink, placeholder: 'https://instagram.com/...' },
                        { id: 'facebook', icon: <Facebook className="h-4 w-4" />, color: 'text-[#1877F2]', value: facebookLink, setter: setFacebookLink, placeholder: 'https://facebook.com/...' },
                    ].map(social => (
                        <div key={social.id} className="grid gap-2">
                            <label htmlFor={social.id} className="text-sm font-medium flex items-center gap-2">
                                <span className={cn("p-1.5 rounded-md bg-muted", social.color)}>{social.icon}</span>
                                {social.id.charAt(0).toUpperCase() + social.id.slice(1)} Link
                            </label>
                            <div className="relative">
                                <Input
                                    id={social.id}
                                    placeholder={social.placeholder}
                                    value={social.value}
                                    onChange={(e) => social.setter(e.target.value)}
                                    className="pl-3"
                                />
                                {social.value.trim() && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {allLinksProvided ? (
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setOpen(false)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Discount Applicable! Done
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Done
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
