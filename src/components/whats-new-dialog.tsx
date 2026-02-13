"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle, Heart } from 'lucide-react';
import { RichTextRenderer } from './rich-text-renderer';

const CURRENT_VERSION = 'update-v2-spiritual-words';

export function WhatsNewDialog() {
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
                        Hare Krishna! What's New?
                    </DialogTitle>
                    <DialogDescription>
                        We've added some spiritual enhancements to improve your experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-blue-100 p-2 rounded-full">
                            <Heart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Expanded Sacred Vocabulary</h4>
                            <p className="text-sm text-muted-foreground">
                                We have significantly expanded our spiritual vocabulary. Words such as <RichTextRenderer content="Radhe Radhe" className="inline" /> and many more now appear with exalted spiritual highlighting.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-2 rounded-full">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Reply to Comments</h4>
                            <p className="text-sm text-muted-foreground">
                                You can now reply directly to specific comments to keep conversations organized.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-purple-100 p-2 rounded-full">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">New Layout & Design</h4>
                            <p className="text-sm text-muted-foreground">
                                Enjoy a spacious 3-column layout on desktop and a more polished experience on mobile.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90">
                        Jay Sri Krishna!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
