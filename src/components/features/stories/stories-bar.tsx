"use client";

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { CreateStatusDialog } from './create-status-dialog';
import { ViewStatusDialog } from './view-status-dialog';

type StatusUpdate = {
    user_id: string;
    name: string;
    username: string;
    avatar_url: string;
    statuses: { id: number; media_url: string; created_at: string; caption?: string | null }[];
    is_all_viewed: boolean;
};

export function StoriesBar() {
    const { loggedInUser } = useAppContext();
    const [statusUpdates, setStatusUpdates] = React.useState<StatusUpdate[]>([]);
    const [myStatus, setMyStatus] = React.useState<StatusUpdate | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [viewingStatusIndex, setViewingStatusIndex] = React.useState<number | null>(null);
    const [isMyStatusViewing, setIsMyStatusViewing] = React.useState(false);

    const fetchStatuses = React.useCallback(async () => {
        if (!loggedInUser) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('statuses')
            .select('*, profile:user_id(*), status_views!left(viewer_id)')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error || !data) {
            setIsLoading(false);
            return;
        }

        const grouped: { [key: string]: StatusUpdate } = {};
        data.forEach((status: any) => {
            const userId = status.profile.id;
            if (!grouped[userId]) {
                grouped[userId] = {
                    user_id: userId,
                    name: status.profile.name,
                    username: status.profile.username,
                    avatar_url: status.profile.avatar_url,
                    statuses: [],
                    is_all_viewed: true,
                };
            }
            const hasViewed = status.status_views?.some((view: any) => view.viewer_id === loggedInUser.id) ?? false;
            if (!hasViewed && userId !== loggedInUser.id) {
                grouped[userId].is_all_viewed = false;
            }
            grouped[userId].statuses.push({
                id: status.id,
                media_url: status.media_url,
                created_at: status.created_at,
                caption: status.caption,
            });
        });

        const myStatusUpdate = grouped[loggedInUser.id] || null;
        if (myStatusUpdate) myStatusUpdate.is_all_viewed = true;
        delete grouped[loggedInUser.id];

        // Sort: unviewed first, then viewed
        const allUpdates = Object.values(grouped).sort((a, b) => {
            if (a.is_all_viewed === b.is_all_viewed) return 0;
            return a.is_all_viewed ? 1 : -1;
        });

        setMyStatus(myStatusUpdate);
        setStatusUpdates(allUpdates);
        setIsLoading(false);
    }, [loggedInUser]);

    React.useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    const openStatusViewer = (index: number) => {
        setIsMyStatusViewing(false);
        setViewingStatusIndex(index);
    };

    const openMyStatusViewer = () => {
        if (myStatus) {
            setIsMyStatusViewing(true);
            setViewingStatusIndex(0);
        }
    };

    const handleCloseViewer = () => {
        setViewingStatusIndex(null);
        setIsMyStatusViewing(false);
    };

    if (!loggedInUser) return null;

    const combinedUpdates = statusUpdates;

    return (
        <>
            <CreateStatusDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onStatusCreated={fetchStatuses} />
            <ViewStatusDialog
                allStatusUpdates={isMyStatusViewing && myStatus ? [myStatus] : combinedUpdates}
                startIndex={viewingStatusIndex}
                open={viewingStatusIndex !== null}
                onOpenChange={handleCloseViewer}
                onStatusViewed={fetchStatuses}
            />

            <div className="w-full overflow-x-auto no-scrollbar py-4 px-4 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="flex gap-4 items-start">
                    {/* My Status / Add Story */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer">
                        <button
                            onClick={myStatus ? openMyStatusViewer : () => setIsCreateOpen(true)}
                            className="relative transition-transform duration-200 group-hover:scale-105"
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-background transition-all",
                                myStatus ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 ring-transparent" : "bg-muted ring-transparent group-hover:ring-primary/20"
                            )}>
                                <Avatar className="w-full h-full border-2 border-background">
                                    <AvatarImage src={loggedInUser.avatar_url} alt="Your Story" className="object-cover" />
                                    <AvatarFallback>{loggedInUser.name?.charAt(0) || 'Y'}</AvatarFallback>
                                </Avatar>
                            </div>
                            {!myStatus && (
                                <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background shadow-sm transition-transform group-hover:scale-110">
                                    <Plus className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                        <span className="text-xs font-medium text-muted-foreground truncate max-w-[70px] group-hover:text-foreground transition-colors">
                            Your story
                        </span>
                    </div>

                    {/* Other Users' Stories */}
                    {isLoading ? (
                        // Loading skeletons
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                                <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
                            </div>
                        ))
                    ) : (
                        statusUpdates.map((update, index) => (
                            <button
                                key={update.user_id}
                                onClick={() => openStatusViewer(index)}
                                className="flex flex-col items-center gap-2 flex-shrink-0 group"
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-full p-0.5 transition-all duration-200 group-hover:scale-105 ring-2 ring-offset-2 ring-offset-background",
                                    update.is_all_viewed
                                        ? "bg-muted ring-transparent group-hover:ring-muted-foreground/20"
                                        : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 ring-transparent shadow-sm"
                                )}>
                                    <Avatar className="w-full h-full border-2 border-background">
                                        <AvatarImage src={update.avatar_url} alt={update.name} className="object-cover" />
                                        <AvatarFallback>{update.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <span className={cn(
                                    "text-xs truncate max-w-[70px] transition-colors",
                                    update.is_all_viewed ? "text-muted-foreground font-medium group-hover:text-foreground" : "text-foreground font-semibold"
                                )}>
                                    {update.username || update.name.split(' ')[0]}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
