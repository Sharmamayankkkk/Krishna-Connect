"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle, BarChart3, Tags, Shield, Image as ImageIcon, Calendar } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const CURRENT_VERSION = 'update-v2.1-advanced-chat';

export function WhatsNewDialog() {
  const { t } = useTranslation();

    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        const seenVersion = localStorage.getItem('whats-new-seen-version');
        if (seenVersion !== CURRENT_VERSION) {
            // Add a small delay so it doesn't pop up instantly on load
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('whats-new-seen-version', CURRENT_VERSION);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Hare Krishna! What's New in v2.1?
                    </DialogTitle>
                    <DialogDescription>
                        A major update focused on advanced chat features, group management, and seamless media.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full shrink-0">
                            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">{t('common.interactiveChatPolls')}</h4>
                            <p className="text-sm text-muted-foreground">
                                Create instant polls in any chat or group. Supports multiple answers, anonymous voting, and live vote counting. 
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full shrink-0">
                            <Tags className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">{t('chat.memberTags')}</h4>
                            <p className="text-sm text-muted-foreground">
                                Group members can now showcase their roles or interests with custom tags next to their name. Group admins hold distinct, colored tags.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full shrink-0">
                            <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Protected Content (Disable Sharing)</h4>
                            <p className="text-sm text-muted-foreground">
                                Admins can now restrict forwarding from specific groups, keeping private conversations within the intended audience. 
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full shrink-0">
                            <MessageCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">{t('common.smartClearChatJumpNavigation')}</h4>
                            <p className="text-sm text-muted-foreground">
                                Clear your side of a chat without deleting it for the other person. Clicking replies now smoothly pulses to highlight the original message.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-2 rounded-full shrink-0">
                            <ImageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">{t('common.replyThumbnails')}</h4>
                            <p className="text-sm text-muted-foreground">
                                Replying to an image, file, or voice note now visualizes a clean preview thumbnail inside the message bubble.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full shrink-0">
                            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">{t('common.localizedDateFormatting')}</h4>
                            <p className="text-sm text-muted-foreground">
                                Type specific dates and times using the new date picker. It will automatically convert to the timezone of whomever reads it!
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90">{t('common.jaySriKrishna')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
