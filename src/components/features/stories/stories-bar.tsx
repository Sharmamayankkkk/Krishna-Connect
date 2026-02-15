"use client";

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Star, Trash2 } from 'lucide-react';
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
    statuses: { id: number; media_url: string; media_type?: string; created_at: string; caption?: string | null; visibility?: string }[];
    is_all_viewed: boolean;
    is_close_friend: boolean;
    is_live: boolean;
};

// --- Shimmer Skeleton ---

function StorySkeletonItem() {
    return (
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative w-[68px] h-[68px] rounded-full overflow-hidden bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <div className="relative h-3 w-12 rounded bg-muted overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
        </div>
    );
}

// --- Story Ring ---

type StoryRingVariant = 'unviewed' | 'viewed' | 'close-friend' | 'own-active' | 'own-empty';

function StoryRing({
    variant,
    children,
    className,
}: {
    variant: StoryRingVariant;
    children: React.ReactNode;
    className?: string;
}) {
    const ringClasses: Record<StoryRingVariant, string> = {
        'unviewed': 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
        'viewed': 'bg-muted/70',
        'close-friend': 'bg-gradient-to-tr from-green-400 to-green-600',
        'own-active': 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
        'own-empty': 'border-[2px] border-dashed border-muted-foreground/40 bg-transparent',
    };

    return (
        <div
            className={cn(
                'w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform duration-200',
                variant === 'own-empty' ? ringClasses[variant] : 'p-[3px]',
                variant !== 'own-empty' && ringClasses[variant],
                className,
            )}
        >
            <div className={cn(
                'w-full h-full rounded-full overflow-hidden',
                variant === 'own-empty' ? 'p-[1px]' : 'border-[3px] border-background',
            )}>
                {children}
            </div>
        </div>
    );
}

// --- Long-Press Hook ---

function useLongPress(callback: () => void, ms = 500) {
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = React.useRef(false);

    const start = React.useCallback(() => {
        didLongPress.current = false;
        timerRef.current = setTimeout(() => {
            didLongPress.current = true;
            callback();
        }, ms);
    }, [callback, ms]);

    const cancel = React.useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    React.useEffect(() => cancel, [cancel]);

    return {
        onPointerDown: start,
        onPointerUp: cancel,
        onPointerLeave: cancel,
        didLongPress,
    };
}

// --- Own Story Context Menu ---

function OwnStoryMenu({
    open,
    onClose,
    onAddHighlight,
    onDelete,
    anchorRect,
}: {
    open: boolean;
    onClose: () => void;
    onAddHighlight: () => void;
    onDelete: () => void;
    anchorRect: DOMRect | null;
}) {
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        window.addEventListener('pointerdown', handler);
        return () => window.removeEventListener('pointerdown', handler);
    }, [open, onClose]);

    if (!open || !anchorRect) return null;

    return (
        <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 min-w-[160px] rounded-xl bg-popover border border-border shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ top: anchorRect.bottom + 6, left: anchorRect.left + anchorRect.width / 2, transform: 'translateX(-50%)' }}
        >
            <button
                role="menuitem"
                onClick={() => { onAddHighlight(); onClose(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
                <Star className="w-4 h-4" />
                Add to Highlight
            </button>
            <button
                role="menuitem"
                onClick={() => { onDelete(); onClose(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                Delete Story
            </button>
        </div>
    );
}

// --- Main Component ---

export function StoriesBar() {
    const { loggedInUser } = useAppContext();
    const [statusUpdates, setStatusUpdates] = React.useState<StatusUpdate[]>([]);
    const [myStatus, setMyStatus] = React.useState<StatusUpdate | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [viewingStatusIndex, setViewingStatusIndex] = React.useState<number | null>(null);
    const [isMyStatusViewing, setIsMyStatusViewing] = React.useState(false);

    // Long-press menu state
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [menuAnchorRect, setMenuAnchorRect] = React.useState<DOMRect | null>(null);
    const myStoryBtnRef = React.useRef<HTMLButtonElement>(null);

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const fetchStatuses = React.useCallback(async () => {
        if (!loggedInUser) return;

        const supabase = createClient();

        // Fetch statuses, close friends list, and live profiles in parallel
        const [statusesResult, closeFriendsResult, liveProfilesResult] = await Promise.all([
            supabase
                .from('statuses')
                .select('*, profile:user_id(*), status_views!left(viewer_id)')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false }),
            supabase
                .from('close_friends')
                .select('user_id, friend_id'),
            supabase
                .from('profiles')
                .select('id, is_live')
                .eq('is_live', true),
        ]);

        if (statusesResult.error || !statusesResult.data) {
            setIsLoading(false);
            return;
        }

        // Build close friends lookup: set of user_ids who have me as close friend
        const closeFriendOfSet = new Set<string>();
        // Also: set of user_ids that I have as close friends
        const myCloseFriendsSet = new Set<string>();
        (closeFriendsResult.data ?? []).forEach((row: any) => {
            if (row.friend_id === loggedInUser.id) {
                closeFriendOfSet.add(row.user_id);
            }
            if (row.user_id === loggedInUser.id) {
                myCloseFriendsSet.add(row.friend_id);
            }
        });

        // Build live profiles set
        const liveProfileIds = new Set<string>(
            (liveProfilesResult.data ?? []).map((p: any) => p.id),
        );

        const statusesByUser: Record<string, StatusUpdate> = {};
        statusesResult.data.forEach((status: any) => {
            const userId = status.profile.id;
            const visibility: string = status.visibility ?? 'public';

            // Filter close_friends stories: skip if not creator and not in their close friends
            if (
                visibility === 'close_friends' &&
                userId !== loggedInUser.id &&
                !closeFriendOfSet.has(userId)
            ) {
                return;
            }

            if (!statusesByUser[userId]) {
                statusesByUser[userId] = {
                    user_id: userId,
                    name: status.profile.name,
                    username: status.profile.username,
                    avatar_url: status.profile.avatar_url,
                    statuses: [],
                    is_all_viewed: true,
                    is_close_friend: false,
                    is_live: liveProfileIds.has(userId),
                };
            }

            const hasViewed = status.status_views?.some((view: any) => view.viewer_id === loggedInUser.id) ?? false;
            if (!hasViewed && userId !== loggedInUser.id) {
                statusesByUser[userId].is_all_viewed = false;
            }

            // Mark as close friend if any status is close_friends-only
            if (visibility === 'close_friends') {
                statusesByUser[userId].is_close_friend = true;
            }

            statusesByUser[userId].statuses.push({
                id: status.id,
                media_url: status.media_url,
                media_type: status.media_type || 'image',
                created_at: status.created_at,
                caption: status.caption,
                visibility,
            });
        });

        const myStatusUpdate = statusesByUser[loggedInUser.id] || null;
        if (myStatusUpdate) myStatusUpdate.is_all_viewed = true;
        delete statusesByUser[loggedInUser.id];

        // Sort: live first, then unviewed, then viewed
        const allUpdates = Object.values(statusesByUser).sort((a, b) => {
            if (a.is_live !== b.is_live) return a.is_live ? -1 : 1;
            if (a.is_all_viewed !== b.is_all_viewed) return a.is_all_viewed ? 1 : -1;
            return 0;
        });

        setMyStatus(myStatusUpdate);
        setStatusUpdates(allUpdates);
        setIsLoading(false);
    }, [loggedInUser]);

    React.useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    // --- Long press handler for own story ---
    const handleOwnStoryLongPress = React.useCallback(() => {
        if (myStoryBtnRef.current) {
            setMenuAnchorRect(myStoryBtnRef.current.getBoundingClientRect());
            setMenuOpen(true);
        }
    }, []);

    const longPressProps = useLongPress(handleOwnStoryLongPress, 500);

    const handleOwnStoryClick = () => {
        if (longPressProps.didLongPress.current) return;
        if (myStatus) {
            openMyStatusViewer();
        } else {
            setIsCreateOpen(true);
        }
    };

    const handleDeleteStory = async () => {
        if (!myStatus || myStatus.statuses.length === 0) return;
        const supabase = createClient();
        const latestId = myStatus.statuses[0].id;
        await supabase.from('statuses').delete().eq('id', latestId);
        fetchStatuses();
    };

    // --- Viewer controls ---

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

            <OwnStoryMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onAddHighlight={() => { /* Highlight creation requires a separate dialog — no-op for now */ }}
                onDelete={handleDeleteStory}
                anchorRect={menuAnchorRect}
            />

            <div
                ref={scrollContainerRef}
                className="w-full overflow-x-auto no-scrollbar py-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-sm scroll-smooth snap-x snap-mandatory"
            >
                <div className="flex gap-3 items-start">
                    {/* === Your Story === */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start group">
                        <button
                            ref={myStoryBtnRef}
                            onClick={handleOwnStoryClick}
                            {...longPressProps}
                            className="relative transition-transform duration-200 group-hover:scale-105 select-none touch-manipulation"
                            aria-label={myStatus ? 'View your story' : 'Add new story'}
                        >
                            <StoryRing variant={myStatus ? 'own-active' : 'own-empty'}>
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={loggedInUser.avatar_url} alt="Your Story" className="object-cover" />
                                    <AvatarFallback className="text-sm">{loggedInUser.name?.charAt(0) || 'Y'}</AvatarFallback>
                                </Avatar>
                            </StoryRing>

                            {/* "+" badge */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] bg-blue-500 text-white rounded-full flex items-center justify-center border-[2.5px] border-background shadow-md transition-transform group-hover:scale-110">
                                <Plus className="w-3 h-3" strokeWidth={3} />
                            </div>
                        </button>

                        {/* Secondary tap target when own story exists */}
                        {myStatus && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="sr-only"
                                aria-label="Add new story"
                            />
                        )}

                        <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[72px] group-hover:text-foreground transition-colors leading-tight">
                            Your story
                        </span>
                    </div>

                    {/* === Other Stories === */}
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <StorySkeletonItem key={i} />
                        ))
                    ) : (
                        statusUpdates.map((update, index) => {
                            const ringVariant: StoryRingVariant = update.is_all_viewed
                                ? 'viewed'
                                : update.is_close_friend
                                    ? 'close-friend'
                                    : 'unviewed';

                            return (
                                <button
                                    key={update.user_id}
                                    onClick={() => openStatusViewer(index)}
                                    className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start group touch-manipulation"
                                >
                                    <div className="relative transition-transform duration-200 group-hover:scale-105">
                                        <StoryRing variant={ringVariant}>
                                            <Avatar className="w-full h-full">
                                                <AvatarImage src={update.avatar_url} alt={update.name} className="object-cover" />
                                                <AvatarFallback className="text-sm">{update.name?.charAt(0) || '?'}</AvatarFallback>
                                            </Avatar>
                                        </StoryRing>

                                        {/* LIVE badge */}
                                        {update.is_live && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-sm leading-none shadow-md border border-background">
                                                Live
                                            </span>
                                        )}
                                    </div>

                                    <span className={cn(
                                        'text-[11px] truncate max-w-[72px] transition-colors leading-tight',
                                        update.is_all_viewed
                                            ? 'text-muted-foreground font-medium group-hover:text-foreground'
                                            : 'text-foreground font-semibold',
                                    )}>
                                        {update.username || update.name.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
