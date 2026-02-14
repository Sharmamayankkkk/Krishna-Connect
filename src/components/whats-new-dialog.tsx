"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Bookmark, Compass, MessageCircle, Video, LayoutGrid } from 'lucide-react';

const CURRENT_VERSION = 'update-v2.0-calls-bookmarks-explore';

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
                        Hare Krishna! What's New in v2.0?
                    </DialogTitle>
                    <DialogDescription>
                        A major update with calling, bookmarks, and a redesigned experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-2 rounded-full shrink-0">
                            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Voice & Video Calls</h4>
                            <p className="text-sm text-muted-foreground">
                                Call any devotee with WebRTC-powered voice and video calls. Includes screen sharing, mute controls, and call history.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full shrink-0">
                            <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Bookmark Collections</h4>
                            <p className="text-sm text-muted-foreground">
                                Save posts to organized collections. Create custom collections, move bookmarks between them, and find saved content easily.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full shrink-0">
                            <Compass className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Redesigned Explore Page</h4>
                            <p className="text-sm text-muted-foreground">
                                Instagram-style media grid with image and video thumbnails, category filters, trending hashtag pills, and suggested devotees.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full shrink-0">
                            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Enhanced Chat Experience</h4>
                            <p className="text-sm text-muted-foreground">
                                Redesigned chat page with quick access contacts, message previews, timestamps, and unread indicators.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full shrink-0">
                            <Video className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Improved Post Detail View</h4>
                            <p className="text-sm text-muted-foreground">
                                Twitter-style threaded comments with engagement stats, quoted posts as threads, and a polished reply experience.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full shrink-0">
                            <LayoutGrid className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Profile Reposts Tab</h4>
                            <p className="text-sm text-muted-foreground">
                                See all posts a user has reposted in a dedicated tab on their profile page.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90">
                        Jay Sri Krishna! 🙏
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
