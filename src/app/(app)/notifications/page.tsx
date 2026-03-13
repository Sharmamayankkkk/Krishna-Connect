'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNowStrict, isToday, isYesterday, isThisWeek } from 'date-fns';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { NotificationType } from '@/lib/types';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ChevronRight, Settings, Heart, ImageIcon, PlaySquare, BarChart2, Mic } from 'lucide-react';

// A resilient thumbnail component that handles broken image links gracefully
const NotificationThumbnail = ({ url, mediaType }: { url?: string, mediaType?: string }) => {
    const [imgError, setImgError] = React.useState(false);

    if (!url || imgError) {
        let Icon = ImageIcon;
        if (mediaType === 'video') Icon = PlaySquare;
        else if (mediaType === 'poll') Icon = BarChart2;
        else if (mediaType === 'audio') Icon = Mic;
        
        return (
            <div className="h-11 w-11 flex items-center justify-center rounded bg-muted/60 text-muted-foreground">
                <Icon className="h-5 w-5 opacity-50" />
            </div>
        );
    }

    return (
        <Image 
            src={url} 
            alt="Preview" 
            fill 
            className="object-cover" 
            onError={() => setImgError(true)} 
        />
    );
};

// Helpers to format relative time like Instagram ("3d", "2h", "5m")
const formatInstaTime = (dateStr: string) => {
    const raw = formatDistanceToNowStrict(new Date(dateStr));
    const parts = raw.split(' ');
    if (parts.length !== 2) return raw;
    const value = parts[0];
    const unitStr = parts[1];
    
    if (unitStr.startsWith('s')) return `${value}s`;
    if (unitStr.startsWith('mo')) return `${value}mo`;
    if (unitStr.startsWith('m')) return `${value}m`;
    if (unitStr.startsWith('h')) return `${value}h`;
    if (unitStr.startsWith('d')) return `${value}d`;
    if (unitStr.startsWith('w')) return `${value}w`;
    if (unitStr.startsWith('y')) return `${value}y`;
    return raw;
};

function getTimeGroup(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    // If it's not today but within the current week
    if (isThisWeek(date)) return 'This week';
    // If it's within the current month, we group it as "This month"
    const now = new Date();
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return 'This month';
    }
    return 'Earlier';
}

// Map db notification types to UI types
const mapNotificationType = (dbType: string): NotificationType['type'] => {
    const typeMap: Record<string, NotificationType['type']> = {
        'new_like': 'like',
        'new_comment': 'comment',
        'new_repost': 'repost',
        'follow_request': 'follow',
        'new_follower': 'follow',
        'collaboration_request': 'collaboration_request',
        'livestream_invite': 'livestream_invite',
        'challenge_invite': 'challenge_invite',
        'challenge_submission': 'challenge_submission',
        'challenge_approved': 'challenge_approved',
        'challenge_rejected': 'challenge_rejected',
        'challenge_won': 'challenge_won',
        'poll_vote': 'poll_vote',
        'mention': 'mention'
    };
    return typeMap[dbType] || 'follow';
};

// Main Instagram-like Notification Item
const NotificationItem = React.memo(({
    notification,
    onAccept,
    onDecline
}: {
    notification: NotificationType;
    onAccept?: (id: string) => void;
    onDecline?: (id: string) => void;
}) => {
    const { t } = useTranslation();
    const { fromUser, type, metadata, referenceId, createdAt } = notification;

    // Build the action phrase
    let actionHtml = <></>;
    let rightSideHtml = <></>;

    // Helpers to extract data
    const hasMedia = metadata?.post_media_url || metadata?.thumbnail_url;
    // Determine whether to show a right side thumbnail icon based on explicit visual media types
    const hasVisualType = ['image', 'video', 'poll', 'audio'].includes(metadata?.post_media_type);
    const showRightSide = hasMedia || hasVisualType;
    
    // Extract a snippet text to show inline
    const inlineSnippet = metadata?.comment_content || metadata?.post_content || '';

    // Determine the correct route. If it's a comment or like-on-comment, we still want to go to the parent post.
    const targetHref = notification.postId ? `/post/${notification.postId}` : `/post/${referenceId}`;

    switch (type) {
        case 'like':
            const likeCount = metadata?.grouped_count ? parseInt(metadata.grouped_count, 10) : 1;
            const likeTarget = metadata?.comment_content ? 'comment' : 'post';
            
            actionHtml = (
                <span>
                    {likeCount > 1
                        ? (likeTarget === 'comment'
                            ? t('notifications.andOthersLikedYourComment', { count: likeCount - 1 })
                            : t('notifications.andOthersLikedYourPost', { count: likeCount - 1 }))
                        : (likeTarget === 'comment'
                            ? t('notifications.likedYourComment')
                            : t('notifications.likedYourPost'))}
                    {inlineSnippet ? <span className="opacity-85">: &quot;{inlineSnippet}&quot;</span> : '.'}
                </span>
            );
            if (showRightSide) {
                rightSideHtml = (
                    <Link href={targetHref} className="shrink-0">
                        <div className="h-11 w-11 overflow-hidden rounded bg-muted/60 relative">
                            <NotificationThumbnail url={hasMedia} mediaType={metadata?.post_media_type} />
                        </div>
                    </Link>
                );
            }
            break;

        case 'comment':
            actionHtml = (
                <span>
                    commented: {inlineSnippet ? <span className="opacity-80">"{inlineSnippet}"</span> : 'on your post.'}
                </span>
            );
            if (showRightSide) {
                rightSideHtml = (
                    <Link href={targetHref} className="shrink-0">
                        <div className="h-11 w-11 overflow-hidden rounded bg-muted/60 relative">
                            <NotificationThumbnail url={hasMedia} mediaType={metadata?.post_media_type} />
                        </div>
                    </Link>
                );
            }
            break;

        case 'mention':
            actionHtml = (
                <span>
                    mentioned you in a {metadata?.post_media_type === 'video' ? 'reel' : 'post'}
                    {inlineSnippet ? <span className="opacity-85">: "{inlineSnippet}"</span> : '.'}
                </span>
            );
            if (showRightSide) {
                rightSideHtml = (
                    <Link href={targetHref} className="shrink-0">
                        <div className="h-11 w-11 overflow-hidden rounded bg-muted/60 relative">
                            <NotificationThumbnail url={hasMedia} mediaType={metadata?.post_media_type} />
                        </div>
                    </Link>
                );
            }
            break;

        case 'follow':
            // If it's a follow request
            if (notification.status === 'pending') {
                actionHtml = <span>requested to follow you.</span>;
                rightSideHtml = (
                    <div className="flex shrink-0 items-center gap-2">
                        <Button 
                            className="h-8 rounded-lg bg-[#0064e0] px-4 py-0 text-sm font-semibold hover:bg-[#0052b8] text-white"
                            onClick={() => onAccept && onAccept(notification.id)}
                        >
                            Confirm
                        </Button>
                        <Button 
                            variant="secondary" 
                            className="h-8 rounded-lg bg-muted px-4 py-0 text-sm font-semibold hover:bg-muted/80 text-foreground"
                            onClick={() => onDecline && onDecline(notification.id)}
                        >
                            Delete
                        </Button>
                    </div>
                );
            } else {
                actionHtml = <span>started following you.</span>;
                rightSideHtml = (
                    <div className="shrink-0">
                         {/* Usually this would toggle between follow/following based on relationship */}
                         {notification.status === 'accepted' ? (
                             <Button variant="secondary" className="h-8 rounded-lg bg-muted px-4 py-0 text-sm font-semibold hover:bg-muted/80 text-foreground">
                                Following
                            </Button>
                         ) : (
                             <Button className="h-8 rounded-lg bg-[#0064e0] px-4 py-0 text-sm font-semibold hover:bg-[#0052b8] text-white">
                                Follow
                            </Button>
                         )}
                    </div>
                 );
            }
            break;

        case 'collaboration_request':
            actionHtml = <span>invited you to collaborate on a post.</span>;
            if (showRightSide) {
                rightSideHtml = (
                    <Link href={targetHref} className="shrink-0">
                        <div className="h-11 w-11 overflow-hidden rounded bg-muted/60 relative">
                            <NotificationThumbnail url={hasMedia} mediaType={metadata?.post_media_type} />
                        </div>
                    </Link>
                );
            }
            break;

        case 'repost':
        case 'quote':
            const rpCount = metadata?.grouped_count ? parseInt(metadata.grouped_count, 10) : 1;
            actionHtml = (
                <span>
                    {rpCount > 1 ? t('notifications.andOthersRepostedYourPost', { count: rpCount - 1 }) : t('notifications.repostedYourPost')}
                    {inlineSnippet ? <span className="opacity-85">: &quot;{inlineSnippet}&quot;</span> : '.'}
                </span>
            );
            if (showRightSide) {
                rightSideHtml = (
                    <Link href={targetHref} className="shrink-0">
                        <div className="h-11 w-11 overflow-hidden rounded bg-muted/60 relative">
                            <NotificationThumbnail url={hasMedia} mediaType={metadata?.post_media_type} />
                        </div>
                    </Link>
                );
            }
            break;

        default:
            actionHtml = <span>sent you a notification.</span>;
            break;
    }

    return (
        <div className="flex items-center gap-3 px-4 py-[10px] w-full transition-colors hover:bg-muted/30">
            {/* Avatar */}
            <Link href={`/profile/${fromUser.username}`} className="shrink-0">
                <Avatar className="h-11 w-11 ring-1 ring-border/10">
                    <AvatarImage src={getAvatarUrl(fromUser.avatar) || fromUser.avatar} alt={fromUser.username} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                        {fromUser.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </Link>

            {/* Main Content Area */}
            <div className="min-w-0 flex-1 flex items-center pr-1">
                <div className="text-[14px] leading-[18px] text-foreground/90 font-normal">
                    <Link href={`/profile/${fromUser.username}`} className="font-semibold text-foreground mr-1">
                        {fromUser.username}
                    </Link>
                    {actionHtml}{' '}
                    <span className="text-muted-foreground whitespace-nowrap opacity-80 font-normal text-[13px] ml-1">
                        {formatInstaTime(createdAt)}
                    </span>
                </div>
            </div>

            {/* Right Side (Thumbnail / Buttons) */}
            {rightSideHtml && (
                <div className="ml-1 flex shrink-0 items-center justify-end">
                    {rightSideHtml}
                </div>
            )}
        </div>
    );
});
NotificationItem.displayName = 'NotificationItem';

export default function NotificationsPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const timeGroupLabels: Record<string, string> = {
        'Today': t('notifications.today'),
        'This week': t('notifications.thisWeek'),
        'This month': t('notifications.thisMonth'),
        'Earlier': t('notifications.earlier'),
    };
    const [notifications, setNotifications] = React.useState<NotificationType[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const PAGE_SIZE = 50;

    React.useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            const ObjectSupabase = await import('@/lib/supabase/client');
            const supabase = ObjectSupabase.createClient();

            // Needs the new get_user_notifications RPC that returns metadata
            const { data, error } = await supabase.rpc('get_user_notifications', {
                p_limit: PAGE_SIZE,
                p_offset: 0
            });

            if (error) {
                console.error('Error fetching notifications:', error);
                // toast({ title: "Error", description: error.message, variant: "destructive" });
                setIsLoading(false);
                return;
            }

            if (data) {
                const transformed: NotificationType[] = data.map((n: any) => ({
                    id: n.id.toString(),
                    type: mapNotificationType(n.type),
                    fromUser: {
                        id: n.actor_id,
                        name: n.actor_name || n.actor_username || 'Unknown',
                        username: n.actor_username || 'unknown',
                        avatar: n.actor_avatar_url || '/placeholder-user.jpg',
                        verified: n.actor_verified || false
                    },
                    postId: n.entity_id?.toString(),
                    referenceId: n.reference_id,
                    metadata: n.metadata,
                    createdAt: n.created_at,
                    read: n.is_read,
                    status: (n.type === 'follow_request' ? 'pending' : 'none')
                }));
                setNotifications(transformed);
                
                // Mark as read in background implicitly when visiting the page (Instagram style)
                supabase.rpc('mark_all_notifications_as_read');
            }
            setIsLoading(false);
        };

        fetchNotifications();
    }, [toast]);

    // Group Notifications
    const groupedNotifications = React.useMemo(() => {
        const groups: { label: string; items: NotificationType[] }[] = [];
        const groupMap = new Map<string, NotificationType[]>();
        
        for (const n of notifications) {
            // Put pending follow requests at the very top (we will extract these later)
            if (n.type === 'follow' && n.status === 'pending') continue;

            const group = getTimeGroup(n.createdAt);
            if (!groupMap.has(group)) groupMap.set(group, []);
            groupMap.get(group)!.push(n);
        }

        const order = ['Today', 'This week', 'This month', 'Earlier'];
        for (const label of order) {
            const items = groupMap.get(label);
            if (items && items.length > 0) groups.push({ label, items });
        }
        return groups;
    }, [notifications]);

    // Extract follow requests
    const followRequests = React.useMemo(() => {
        return notifications.filter(n => n.type === 'follow' && n.status === 'pending');
    }, [notifications]);

    const handleAcceptRequest = React.useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'accepted' } : n));
        toast({ title: t('notifications.followRequestAccepted') });
        // TODO: call actual accept RPC
    }, [toast]);

    const handleDeclineRequest = React.useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast({ title: t('notifications.requestDeleted') });
        // TODO: call actual decline RPC
    }, [toast]);

    return (
        <div className="flex bg-background min-h-screen w-full flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between bg-background px-4 py-3 sm:px-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl font-bold tracking-tight">{t('notifications.title')}</h1>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-auto flex-1 pb-16">
                {isLoading ? (
                    <div className="px-4 py-4 space-y-4">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="h-11 w-11 rounded shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full pt-1 pb-4">
                        {/* Follow Requests Banner */}
                        {followRequests.length > 0 && (
                            <Link href="/notifications/follow-requests" className="block w-full">
                                <div className="mx-0 my-1 flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/30">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-12 w-12 flex items-center justify-center">
                                            {/* Stacked avatars style */}
                                            {followRequests.slice(0, 1).map((r, i) => (
                                                <Avatar key={r.id} className="absolute left-0 top-0 h-11 w-11 border-2 border-background z-10">
                                                    <AvatarImage src={r.fromUser.avatar} />
                                                    <AvatarFallback>{r.fromUser.username[0]}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                            <div className="absolute right-0 bottom-0 z-20 rounded-full border-2 border-background bg-blue-500 flex h-5 w-5 items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[15px] leading-tight text-foreground">Follow requests</span>
                                            <span className="text-[14px] text-muted-foreground">{followRequests[0].fromUser.username} + {followRequests.length - 1} others</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
                                    </div>
                                </div>
                                <div className="mx-4 my-2 border-b border-border/40" />
                            </Link>
                        )}

                        {groupedNotifications.length === 0 && followRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                <div className="mb-4 rounded-full border-2 border-current p-6">
                                    <Heart className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-medium">{t('notifications.activityOnPosts')}</h3>
                                <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                                    {t('notifications.emptyDescription')}
                                </p>
                            </div>
                        ) : (
                            groupedNotifications.map((group) => (
                                <div key={group.label} className="mt-1 w-full">
                                    <h3 className="px-4 pb-3 pt-3 text-[16px] font-bold text-foreground">
                                        {timeGroupLabels[group.label] || group.label}
                                    </h3>
                                    <div className="flex flex-col">
                                        {group.items.map((notification) => (
                                            <NotificationItem 
                                                key={notification.id} 
                                                notification={notification} 
                                                onAccept={handleAcceptRequest}
                                                onDecline={handleDeclineRequest}
                                            />
                                        ))}
                                    </div>
                                    <div className="mx-4 mt-3 mb-1 border-b border-border/40" />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}