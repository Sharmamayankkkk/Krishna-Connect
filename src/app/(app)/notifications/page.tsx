'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Heart,
    MessageCircle,
    Repeat2,
    UserPlus,
    AtSign,
    BarChart3,
    CheckCheck,
    Trash2,
    Settings,
    Bell,
    BellOff,
    Users,
    Image as ImageIcon,
    Video,
    FileText,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { NotificationType } from '@/lib/types';
import { PushNotificationManager } from '@/components/layout/push-notification-manager';
import { SidebarTrigger } from '@/components/ui/sidebar';

type NotificationFilter = 'all' | 'mentions' | 'likes' | 'comments' | 'follows';

// Icon with colored background bubble
const NotificationIconBubble = ({ type }: { type: NotificationType['type'] }) => {
    const config: Record<string, { icon: React.ReactNode; bg: string }> = {
        like: { icon: <Heart className="h-3.5 w-3.5 text-white fill-white" />, bg: 'bg-gradient-to-br from-red-400 to-pink-500' },
        comment: { icon: <MessageCircle className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-blue-400 to-blue-600' },
        repost: { icon: <Repeat2 className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-emerald-400 to-green-600' },
        quote: { icon: <Repeat2 className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-teal-400 to-cyan-600' },
        follow: { icon: <UserPlus className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-purple-400 to-violet-600' },
        mention: { icon: <AtSign className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-orange-400 to-amber-600' },
        poll_vote: { icon: <BarChart3 className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-cyan-400 to-sky-600' },
        collaboration_request: { icon: <Users className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
    };
    const iconConfig = config[type] || { icon: <Bell className="h-3.5 w-3.5 text-white" />, bg: 'bg-gradient-to-br from-gray-400 to-gray-600' };
    return (
        <div className={cn("absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center ring-2 ring-background", iconConfig.bg)} aria-hidden="true">
            {iconConfig.icon}
        </div>
    );
};

// Action text for notification
const getActionText = (type: NotificationType['type']) => {
    const map: Record<string, string> = {
        like: 'liked your post',
        comment: 'commented on your post',
        repost: 'reposted your post',
        quote: 'quoted your post',
        follow: 'started following you',
        mention: 'mentioned you',
        poll_vote: 'voted on your poll',
        collaboration_request: 'invited you to collaborate',
    };
    return map[type] || 'sent you a notification';
};

// Media type icon
const MediaTypeIcon = ({ type }: { type: string }) => {
    if (type === 'image') return <ImageIcon className="h-3 w-3" />;
    if (type === 'video') return <Video className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
};

// Time grouping
function getTimeGroup(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return 'This Week';
    return 'Earlier';
}

// Individual Notification Item
const NotificationItem = React.memo(({
    notification,
    onMarkAsRead,
    onDelete,
    onAccept,
    onDecline
}: {
    notification: NotificationType;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
}) => {
    const actionText = getActionText(notification.type);

    return (
        <div
            className={cn(
                "flex gap-3 py-3 px-3 sm:px-5 transition-all duration-200 hover:bg-muted/40 relative group rounded-lg mx-2 my-0.5",
                !notification.read && "bg-primary/[0.04] hover:bg-primary/[0.07]"
            )}
        >
            {/* Unread dot */}
            {!notification.read && (
                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            )}

            {/* Avatar with icon overlay */}
            <Link href={`/profile/${notification.fromUser.username}`} className="flex-shrink-0 relative">
                <Avatar className="h-11 w-11 sm:h-12 sm:w-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={notification.fromUser.avatar} alt={notification.fromUser.name} loading="lazy" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {notification.fromUser.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <NotificationIconBubble type={notification.type} />
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                    <Link href={`/profile/${notification.fromUser.username}`} className="font-semibold hover:underline">
                        {notification.fromUser.name}
                    </Link>
                    <span className="text-muted-foreground ml-1">{actionText}</span>
                    <span className="text-xs text-muted-foreground/70 ml-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                </p>

                {/* Post preview */}
                {notification.postId && (notification.postContent || notification.postMediaType) && (
                    <Link
                        href={`/profile/${notification.postAuthorUsername || notification.fromUser.username}/post/${notification.postId}`}
                        className="block mt-1.5"
                    >
                        <div className="border rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-xs sm:text-sm">
                            {notification.postContent && (
                                <p className="line-clamp-2 text-muted-foreground italic">
                                    &ldquo;{notification.postContent}&rdquo;
                                </p>
                            )}
                            {notification.postMediaType && !notification.postContent && (
                                <p className="text-muted-foreground flex items-center gap-1.5">
                                    <MediaTypeIcon type={notification.postMediaType} />
                                    <span className="capitalize">{notification.postMediaType}</span> post
                                </p>
                            )}
                        </div>
                    </Link>
                )}

                {/* Collaboration actions */}
                {notification.type === 'collaboration_request' && (
                    <div className="flex items-center gap-2 mt-2">
                        {notification.status === 'pending' ? (
                            <>
                                <Button size="sm" className="h-7 text-xs rounded-full px-4" onClick={() => onAccept(notification.id)}>
                                    Accept
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs rounded-full px-4" onClick={() => onDecline(notification.id)}>
                                    Decline
                                </Button>
                            </>
                        ) : notification.status === 'accepted' ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">Accepted</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-200">Declined</Badge>
                        )}
                    </div>
                )}

                {/* Action buttons - show on hover on desktop, always on mobile */}
                <div className="flex items-center gap-1 mt-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)} className="h-6 text-[11px] px-2 rounded-full text-muted-foreground hover:text-foreground">
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Read
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onDelete(notification.id)} className="h-6 text-[11px] px-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                    </Button>
                </div>
            </div>

            {/* Follow back CTA */}
            {notification.type === 'follow' && (
                <Button variant="default" size="sm" className="flex-shrink-0 h-8 text-xs rounded-full px-4 self-center shadow-sm">
                    <span className="hidden sm:inline">Follow Back</span>
                    <span className="sm:hidden">Follow</span>
                </Button>
            )}
        </div>
    );
});

NotificationItem.displayName = 'NotificationItem';

// Skeleton Loader
function NotificationSkeleton() {
    return (
        <div className="flex gap-3 py-3 px-3 sm:px-5 mx-2 my-0.5">
            <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
            </div>
        </div>
    );
}

// Time section header
function TimeSectionHeader({ label }: { label: string }) {
    return (
        <div className="sticky top-0 z-10 px-5 py-2 bg-background/90 backdrop-blur-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    );
}

// Empty state with gradient icon
function EmptyState({ filter }: { filter: NotificationFilter }) {
    const configs: Record<string, { icon: React.ReactNode; bg: string; title: string; desc: string }> = {
        mentions: { icon: <AtSign className="h-8 w-8 text-white" />, bg: 'from-orange-400 to-amber-500', title: 'No mentions yet', desc: "When someone tags you, you'll see it here" },
        likes: { icon: <Heart className="h-8 w-8 text-white" />, bg: 'from-red-400 to-pink-500', title: 'No likes yet', desc: "When someone likes your posts, you'll see it here" },
        comments: { icon: <MessageCircle className="h-8 w-8 text-white" />, bg: 'from-blue-400 to-blue-600', title: 'No comments yet', desc: "When someone comments, you'll see it here" },
        follows: { icon: <UserPlus className="h-8 w-8 text-white" />, bg: 'from-purple-400 to-violet-600', title: 'No new followers', desc: "When someone follows you, you'll see it here" },
        all: { icon: <Sparkles className="h-8 w-8 text-white" />, bg: 'from-primary/80 to-primary', title: "You're all caught up!", desc: "When you get notifications, they'll show up here" },
    };
    const emptyConfig = configs[filter] || configs.all;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className={cn("h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg", emptyConfig.bg)}>
                {emptyConfig.icon}
            </div>
            <h3 className="text-lg font-bold mb-1.5">{emptyConfig.title}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{emptyConfig.desc}</p>
        </div>
    );
}

// Map database notification types to UI types
const mapNotificationType = (dbType: string): NotificationType['type'] => {
    const typeMap: Record<string, NotificationType['type']> = {
        'new_like': 'like',
        'new_comment': 'comment',
        'new_repost': 'repost',
        'follow_request': 'follow',
        'new_follower': 'follow',
        'collaboration_request': 'collaboration_request'
    };
    return typeMap[dbType] || 'follow';
};

// Main Notifications Page Component
export default function NotificationsPage() {
    const { toast } = useToast();

    // State
    const [notifications, setNotifications] = React.useState<NotificationType[]>([]);
    const [filter, setFilter] = React.useState<NotificationFilter>('all');
    const [isLoading, setIsLoading] = React.useState(true);
    const [showSettings, setShowSettings] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);
    const PAGE_SIZE = 30;

    // Fetch notifications from database
    React.useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            const supabase = (await import('@/lib/supabase/client')).createClient();

            const { data, error } = await supabase.rpc('get_user_notifications', {
                p_limit: PAGE_SIZE,
                p_offset: 0
            });

            if (error) {
                console.error('Error fetching notifications:', error);
                toast({
                    title: "Error loading notifications",
                    description: error.message,
                    variant: "destructive"
                });
                setIsLoading(false);
                return;
            }

            if (data) {
                // Transform database notifications to UI format
                let transformedNotifications: NotificationType[] = data.map((n: any) => ({
                    id: n.id.toString(),
                    type: mapNotificationType(n.type),
                    fromUser: {
                        id: n.actor_id,
                        name: n.actor_name || 'Unknown User',
                        username: n.actor_username || 'unknown',
                        avatar: n.actor_avatar_url || '/placeholder-user.jpg',
                        verified: n.actor_verified || false
                    },
                    postId: n.entity_id?.toString(),
                    commentId: undefined,
                    text: undefined,
                    createdAt: n.created_at,
                    read: n.is_read,
                    postContent: n.post_content,
                    postMediaType: n.post_media_type as any,
                    postAuthorUsername: n.post_author_username // Add this mapped field
                }));

                // Fetch collaboration statuses
                const collabRequests = transformedNotifications.filter(n => n.type === 'collaboration_request');
                if (collabRequests.length > 0) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const postIds = collabRequests.map(n => n.postId).filter(Boolean);
                        const { data: collabs } = await supabase
                            .from('post_collaborators')
                            .select('post_id, status')
                            .in('post_id', postIds)
                            .eq('user_id', user.id);

                        if (collabs) {
                            const statusMap = new Map(collabs.map(c => [c.post_id, c.status]));
                            transformedNotifications = transformedNotifications.map(n => {
                                if (n.type === 'collaboration_request' && n.postId) {
                                    const status = statusMap.get(n.postId);
                                    return { ...n, status: status as any || 'pending' };
                                }
                                return n;
                            });
                        }
                    }
                }

                setNotifications(transformedNotifications);
                setHasMore(transformedNotifications.length >= PAGE_SIZE);
            }
            setIsLoading(false);
        };

        fetchNotifications();

        // Set up realtime subscription for new notifications
        const setupRealtimeSubscription = async () => {
            const supabase = (await import('@/lib/supabase/client')).createClient();

            // Get current user ID properly
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return null;
            }

            const channel = supabase
                .channel('notifications_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    // Refresh notifications when any change occurs
                    fetchNotifications();
                })
                .subscribe();

            return { supabase, channel };
        };

        let realtimeCleanup: { supabase: any; channel: any } | null = null;

        setupRealtimeSubscription().then(result => {
            realtimeCleanup = result;
        });

        return () => {
            if (realtimeCleanup) {
                realtimeCleanup.supabase.removeChannel(realtimeCleanup.channel);
            }
        };
    }, [toast]);

    // Filter notifications
    const filteredNotifications = React.useMemo(() => {
        let filtered = notifications;

        switch (filter) {
            case 'mentions':
                filtered = notifications.filter(n => n.type === 'mention');
                break;
            case 'likes':
                filtered = notifications.filter(n => n.type === 'like');
                break;
            case 'comments':
                filtered = notifications.filter(n => n.type === 'comment');
                break;
            case 'follows':
                filtered = notifications.filter(n => n.type === 'follow');
                break;
        }

        return filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [notifications, filter]);

    // Count unread notifications
    const unreadCount = React.useMemo(() =>
        notifications.filter(n => !n.read).length,
        [notifications]
    );

    // Filter count per category for badges
    const filterCounts = React.useMemo(() => ({
        mentions: notifications.filter(n => n.type === 'mention' && !n.read).length,
        likes: notifications.filter(n => n.type === 'like' && !n.read).length,
        comments: notifications.filter(n => n.type === 'comment' && !n.read).length,
        follows: notifications.filter(n => n.type === 'follow' && !n.read).length,
    }), [notifications]);

    // Group filtered notifications by time
    const groupedNotifications = React.useMemo(() => {
        const groups: { label: string; items: NotificationType[] }[] = [];
        const groupMap = new Map<string, NotificationType[]>();

        for (const n of filteredNotifications) {
            const group = getTimeGroup(n.createdAt);
            if (!groupMap.has(group)) groupMap.set(group, []);
            groupMap.get(group)!.push(n);
        }

        const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
        for (const label of order) {
            const items = groupMap.get(label);
            if (items && items.length > 0) groups.push({ label, items });
        }
        return groups;
    }, [filteredNotifications]);

    // Load more handler
    const handleLoadMore = React.useCallback(async () => {
        setIsLoadingMore(true);
        const supabase = (await import('@/lib/supabase/client')).createClient();
        const { data, error } = await supabase.rpc('get_user_notifications', {
            p_limit: PAGE_SIZE,
            p_offset: notifications.length
        });

        if (!error && data) {
            const newNotifs: NotificationType[] = data.map((n: any) => ({
                id: n.id.toString(),
                type: mapNotificationType(n.type),
                fromUser: {
                    id: n.actor_id,
                    name: n.actor_name || 'Unknown User',
                    username: n.actor_username || 'unknown',
                    avatar: n.actor_avatar_url || '/placeholder-user.jpg',
                    verified: n.actor_verified || false
                },
                postId: n.entity_id?.toString(),
                commentId: undefined,
                text: undefined,
                createdAt: n.created_at,
                read: n.is_read,
                postContent: n.post_content,
                postMediaType: n.post_media_type as any,
                postAuthorUsername: n.post_author_username
            }));
            setNotifications(prev => [...prev, ...newNotifs]);
            setHasMore(newNotifs.length >= PAGE_SIZE);
        }
        setIsLoadingMore(false);
    }, [notifications.length]);

    // Memoized handlers for better performance
    const handleMarkAsRead = React.useCallback(async (id: string) => {
        const supabase = (await import('@/lib/supabase/client')).createClient();

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        const { error } = await supabase.rpc('mark_notification_as_read', {
            p_notification_id: parseInt(id)
        });

        if (error) {
            console.error('Error marking notification as read:', error);
            // Revert on error
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: false } : n)
            );
        }
    }, []);

    const handleMarkAllAsRead = React.useCallback(async () => {
        const supabase = (await import('@/lib/supabase/client')).createClient();

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        const { error } = await supabase.rpc('mark_all_notifications_as_read');

        if (error) {
            console.error('Error marking all as read:', error);
            toast({
                title: "Error",
                description: "Failed to mark all as read",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "All marked as read",
        });
    }, [toast]);

    const handleDelete = React.useCallback(async (id: string) => {
        const supabase = (await import('@/lib/supabase/client')).createClient();

        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        const { error } = await supabase.rpc('delete_notification', {
            p_notification_id: parseInt(id)
        });

        if (error) {
            console.error('Error deleting notification:', error);
            // Could revert here, but deletion is usually final
        }

        toast({
            title: "Notification deleted",
            variant: 'destructive'
        });
    }, [toast]);

    const handleAcceptCollaboration = React.useCallback(async (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification || !notification.postId) return;

        const supabase = (await import('@/lib/supabase/client')).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, status: 'accepted', read: true } : n)
        );

        const { error } = await supabase
            .from('post_collaborators')
            .update({ status: 'accepted' })
            .eq('post_id', notification.postId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error accepting collaboration:', error);
            // Revert
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'pending', read: false } : n)
            );
            toast({
                title: "Error",
                description: "Failed to accept collaboration",
                variant: 'destructive'
            });
        } else {
            toast({
                title: "Collaboration accepted",
                description: "You are now a collaborator on the post."
            });
            // Mark notification as read
            supabase.rpc('mark_notification_as_read', { p_notification_id: parseInt(id) });
        }
    }, [notifications, toast]);

    const handleDeclineCollaboration = React.useCallback(async (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification || !notification.postId) return;

        const supabase = (await import('@/lib/supabase/client')).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, status: 'declined', read: true } : n)
        );

        const { error } = await supabase
            .from('post_collaborators')
            .update({ status: 'declined' })
            .eq('post_id', notification.postId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error declining collaboration:', error);
            // Revert
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'pending', read: false } : n)
            );
            toast({
                title: "Error",
                description: "Failed to decline collaboration",
                variant: 'destructive'
            });
        } else {
            toast({
                title: "Collaboration declined",
                variant: 'destructive'
            });
            // Mark notification as read
            supabase.rpc('mark_notification_as_read', { p_notification_id: parseInt(id) });
        }
    }, [notifications, toast]);

    const handleClearAll = React.useCallback(async () => {
        const supabase = (await import('@/lib/supabase/client')).createClient();

        // Optimistic update
        setNotifications([]);

        const { error } = await supabase.rpc('delete_all_notifications');

        if (error) {
            console.error('Error clearing notifications:', error);
            toast({
                title: "Error",
                description: "Failed to clear notifications",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "All notifications cleared",
            description: "Your notification inbox is now empty"
        });
    }, [toast]);

    const filterTabClassName = "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm px-3 sm:px-4 py-3 font-medium whitespace-nowrap gap-1.5";

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <SidebarTrigger className="md:hidden" />
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                            <Bell className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <h1 className="text-lg font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <Badge variant="default" className="rounded-full px-2 py-0 text-[11px] h-5 min-w-[20px] flex items-center justify-center">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {unreadCount > 0 && !isLoading && (
                            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 text-xs hover:bg-primary/10 rounded-full px-3">
                                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Mark all read</span>
                                <span className="sm:hidden">Read all</span>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="h-8 w-8 hover:bg-muted rounded-full" aria-expanded={showSettings}>
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs with unread counts */}
                <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)} className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent h-auto p-0 overflow-x-auto flex-nowrap">
                        <TabsTrigger value="all" className={filterTabClassName}>All</TabsTrigger>
                        <TabsTrigger value="mentions" className={filterTabClassName}>
                            <AtSign className="h-3.5 w-3.5" />
                            Mentions
                            {filterCounts.mentions > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px] rounded-full ml-0.5">{filterCounts.mentions}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="likes" className={filterTabClassName}>
                            <Heart className="h-3.5 w-3.5" />
                            Likes
                            {filterCounts.likes > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px] rounded-full ml-0.5">{filterCounts.likes}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="comments" className={filterTabClassName}>
                            <MessageCircle className="h-3.5 w-3.5" />
                            Comments
                            {filterCounts.comments > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px] rounded-full ml-0.5">{filterCounts.comments}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="follows" className={filterTabClassName}>
                            <UserPlus className="h-3.5 w-3.5" />
                            Follows
                            {filterCounts.follows > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px] rounded-full ml-0.5">{filterCounts.follows}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="border-t py-3 px-4 sm:px-6 bg-muted/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Push notifications</span>
                            </div>
                            <PushNotificationManager />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Pause notifications</span>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full">Pause</Button>
                        </div>
                        {notifications.length > 0 && (
                            <Button variant="destructive" size="sm" className="w-full h-8 text-xs rounded-lg" onClick={handleClearAll}>
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Clear all notifications
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Notifications List */}
            <div className="flex-grow overflow-y-auto">
                {isLoading ? (
                    <div className="py-2">
                        {Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <EmptyState filter={filter} />
                ) : (
                    <div role="feed" aria-label="Notifications">
                        {groupedNotifications.map(group => (
                            <div key={group.label}>
                                <TimeSectionHeader label={group.label} />
                                {group.items.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={handleMarkAsRead}
                                        onDelete={handleDelete}
                                        onAccept={handleAcceptCollaboration}
                                        onDecline={handleDeclineCollaboration}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Load more */}
                        {hasMore && (
                            <div className="py-4 px-4 text-center">
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-3.5 w-3.5 border-2 border-current border-r-transparent rounded-full animate-spin" />
                                            Loading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <ChevronDown className="h-3.5 w-3.5" />
                                            Load more
                                        </span>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}