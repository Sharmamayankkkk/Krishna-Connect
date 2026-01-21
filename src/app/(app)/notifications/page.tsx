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
    Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { NotificationType } from '../types';

type NotificationFilter = 'all' | 'mentions' | 'likes' | 'comments' | 'follows';

// Notification type icon mapping
const getNotificationIcon = (type: NotificationType['type']) => {
    switch (type) {
        case 'like':
            return <Heart className="h-5 w-5 text-red-500 fill-red-500" />;
        case 'comment':
            return <MessageCircle className="h-5 w-5 text-blue-500" />;
        case 'repost':
        case 'quote':
            return <Repeat2 className="h-5 w-5 text-green-500" />;
        case 'follow':
            return <UserPlus className="h-5 w-5 text-purple-500" />;
        case 'mention':
            return <AtSign className="h-5 w-5 text-orange-500" />;
        case 'poll_vote':
            return <BarChart3 className="h-5 w-5 text-cyan-500" />;
        case 'collaboration_request':
            return <Users className="h-5 w-5 text-indigo-500" />;
        default:
            return <Bell className="h-5 w-5 text-gray-500" />;
    }
};

// Notification action text
const getNotificationText = (notification: NotificationType) => {
    const userName = notification.fromUser.name;

    switch (notification.type) {
        case 'like':
            return `${userName} liked your post`;
        case 'comment':
            return `${userName} commented on your post`;
        case 'repost':
            return `${userName} reposted your post`;
        case 'quote':
            return `${userName} quoted your post`;
        case 'follow':
            return `${userName} started following you`;
        case 'mention':
            return `${userName} mentioned you`;
        case 'poll_vote':
            return `${userName} voted on your poll`;
        case 'collaboration_request':
            return `${userName} invited you to collaborate on a post`;
        default:
            return 'New notification';
    }
};

// Individual Notification Item Component
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
    const notificationText = getNotificationText(notification);
    const icon = getNotificationIcon(notification.type);

    return (
        <div
            className={cn(
                "flex gap-2 sm:gap-3 py-3 px-2 sm:px-4 border-b transition-colors hover:bg-muted/50 relative group",
                !notification.read && "bg-primary/5"
            )}
        >
            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />
            )}

            {/* User Avatar */}
            <Link href={`/profile/${notification.fromUser.username}`} className="flex-shrink-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    <AvatarImage
                        src={notification.fromUser.avatar}
                        alt={`${notification.fromUser.name}'s avatar`}
                        loading="lazy"
                    />
                    <AvatarFallback>{notification.fromUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>

            {/* Notification Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start gap-1.5 sm:gap-2">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                        {icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base break-words">
                            <Link
                                href={`/profile/${notification.fromUser.username}`}
                                className="font-semibold hover:underline"
                            >
                                {notification.fromUser.name}
                            </Link>
                            <span className="text-muted-foreground ml-1">
                                {notificationText.replace(notification.fromUser.name, '').trim()}
                            </span>
                        </p>

                        {/* Additional text (for post snippets, etc.) */}
                        {notification.text && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 p-2 border rounded-md bg-muted/50 break-words">
                                {notification.text}
                            </p>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Collaboration actions */}
                {notification.type === 'collaboration_request' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        {notification.status === 'pending' ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => onAccept(notification.id)}
                                    aria-label="Accept collaboration request"
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDecline(notification.id)}
                                    aria-label="Decline collaboration request"
                                >
                                    Decline
                                </Button>
                            </>
                        ) : notification.status === 'accepted' ? (
                            <p className="text-xs sm:text-sm font-semibold text-green-600">You have accepted this collaboration.</p>
                        ) : (
                            <p className="text-xs sm:text-sm font-semibold text-red-600">You have declined this collaboration.</p>
                        )}
                    </div>
                )}

                {/* Standard action buttons (always visible on mobile, hover on desktop) */}
                <div className="flex flex-wrap items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pt-1">
                    {!notification.read && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsRead(notification.id)}
                            className="h-7 text-xs"
                            aria-label="Mark notification as read"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                            Mark as read
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(notification.id)}
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        aria-label="Delete notification"
                    >
                        <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Quick action (if applicable) */}
            {notification.type === 'follow' && (
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-xs sm:text-sm"
                    aria-label={`Follow ${notification.fromUser.name} back`}
                >
                    <span className="hidden sm:inline">Follow Back</span>
                    <span className="sm:hidden">Follow</span>
                </Button>
            )}
        </div>
    );
});

NotificationItem.displayName = 'NotificationItem';

// Notification Skeleton Loader
function NotificationSkeleton() {
    return (
        <div className="flex gap-2 sm:gap-3 py-3 px-2 sm:px-4 border-b">
            <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

// Empty State Component
function EmptyState({ filter }: { filter: NotificationFilter }) {
    const getMessage = () => {
        switch (filter) {
            case 'mentions':
                return {
                    icon: <AtSign className="h-12 w-12 text-muted-foreground/50" />,
                    title: "No mentions yet",
                    description: "When someone mentions you, you'll see it here"
                };
            case 'likes':
                return {
                    icon: <Heart className="h-12 w-12 text-muted-foreground/50" />,
                    title: "No likes yet",
                    description: "When someone likes your posts, you'll see it here"
                };
            case 'comments':
                return {
                    icon: <MessageCircle className="h-12 w-12 text-muted-foreground/50" />,
                    title: "No comments yet",
                    description: "When someone comments on your posts, you'll see it here"
                };
            case 'follows':
                return {
                    icon: <UserPlus className="h-12 w-12 text-muted-foreground/50" />,
                    title: "No new followers",
                    description: "When someone follows you, you'll see it here"
                };
            default:
                return {
                    icon: <Bell className="h-12 w-12 text-muted-foreground/50" />,
                    title: "No notifications",
                    description: "When you get notifications, they'll show up here"
                };
        }
    };

    const { icon, title, description } = getMessage();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4">{icon}</div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        </div>
    );
}

// Main Notifications Page Component
export default function NotificationsPage() {
    const { toast } = useToast();

    // State
    const [notifications, setNotifications] = React.useState<NotificationType[]>([]);
    const [filter, setFilter] = React.useState<NotificationFilter>('all');
    const [isLoading, setIsLoading] = React.useState(true);
    const [showSettings, setShowSettings] = React.useState(false);

    // Fetch notifications from database
    React.useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            const supabase = (await import('@/lib/supabase/client')).createClient();

            const { data, error } = await supabase.rpc('get_user_notifications', {
                p_limit: 100,
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
                console.log('Fetched notifications:', data.length);
                // Transform database notifications to UI format
                const transformedNotifications: NotificationType[] = data.map((n: any) => ({
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
                    read: n.is_read
                }));

                setNotifications(transformedNotifications);
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
                console.log('No user found for realtime subscription');
                return null;
            }

            const channel = supabase
                .channel('notifications_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    console.log('Notification change detected:', payload);
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

    // Helper function to map database notification types to UI types
    const mapNotificationType = (dbType: string): NotificationType['type'] => {
        const typeMap: Record<string, NotificationType['type']> = {
            'new_like': 'like',
            'new_comment': 'comment',
            'new_repost': 'repost',
            'follow_request': 'follow',
            'new_follower': 'follow'
        };
        return typeMap[dbType] || 'follow'; // Default fallback
    };

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
            title: "✓ All marked as read",
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
            title: "✗ Notification deleted",
            variant: 'destructive'
        });
    }, [toast]);

    const handleAcceptCollaboration = React.useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, status: 'accepted', read: true } : n)
        );
        toast({
            title: "✓ Collaboration accepted!",
            description: "You are now a collaborator on the post."
        });
    }, [toast]);

    const handleDeclineCollaboration = React.useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, status: 'declined', read: true } : n)
        );
        toast({
            title: "✗ Collaboration declined.",
            variant: 'destructive'
        });
    }, [toast]);

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
            title: "✓ All notifications cleared",
            description: "Your notification inbox is now empty"
        });
    }, [toast]);

    return (
        <div className="flex flex-col min-h-screen w-full max-w-2xl mx-auto sm:border-x">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between py-3 px-3 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <h1 className="text-xl font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <Badge variant="default" className="rounded-full flex-shrink-0">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {unreadCount > 0 && !isLoading && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="hidden md:flex"
                                aria-label="Mark all notifications as read"
                            >
                                <CheckCheck className="h-4 w-4 mr-2" aria-hidden="true" />
                                Mark all as read
                            </Button>
                        )}
                        {unreadCount > 0 && !isLoading && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleMarkAllAsRead}
                                className="md:hidden"
                                aria-label="Mark all notifications as read"
                            >
                                <CheckCheck className="h-5 w-5" aria-hidden="true" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSettings(!showSettings)}
                            aria-label={showSettings ? "Hide settings" : "Show settings"}
                            aria-expanded={showSettings}
                        >
                            <Settings className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)} className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto">
                        <TabsTrigger
                            value="all"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4 whitespace-nowrap"
                        >
                            All
                        </TabsTrigger>
                        <TabsTrigger
                            value="mentions"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4 whitespace-nowrap"
                        >
                            <AtSign className="h-4 w-4 mr-2" aria-hidden="true" />
                            Mentions
                        </TabsTrigger>
                        <TabsTrigger
                            value="likes"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4 whitespace-nowrap"
                        >
                            <Heart className="h-4 w-4 mr-2" aria-hidden="true" />
                            Likes
                        </TabsTrigger>
                        <TabsTrigger
                            value="comments"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4 whitespace-nowrap"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                            Comments
                        </TabsTrigger>
                        <TabsTrigger
                            value="follows"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4 whitespace-nowrap"
                        >
                            <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                            Follows
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Settings Panel (expandable) */}
                {showSettings && (
                    <div className="border-t py-3 px-3 sm:px-4 bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Bell className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <span className="text-sm font-medium">Push notifications</span>
                            </div>
                            <Button variant="outline" size="sm" aria-label="Enable push notifications">
                                Enable
                            </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <BellOff className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <span className="text-sm font-medium">Pause all notifications</span>
                            </div>
                            <Button variant="outline" size="sm" aria-label="Pause all notifications">
                                Pause
                            </Button>
                        </div>
                        {notifications.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={handleClearAll}
                                aria-label="Clear all notifications permanently"
                            >
                                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                Clear all notifications
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Notifications List */}
            <div className="flex-grow overflow-y-auto">
                {isLoading ? (
                    // Loading state
                    <>
                        <NotificationSkeleton />
                        <NotificationSkeleton />
                        <NotificationSkeleton />
                        <NotificationSkeleton />
                    </>
                ) : filteredNotifications.length === 0 ? (
                    // Empty state
                    <EmptyState filter={filter} />
                ) : (
                    // Notifications list
                    <div role="feed" aria-label="Notifications">
                        {filteredNotifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                                onAccept={handleAcceptCollaboration}
                                onDecline={handleDeclineCollaboration}
                            />
                        ))}

                        {/* Load more button (for pagination) */}
                        {filteredNotifications.length >= 20 && (
                            <div className="py-3 px-3 sm:px-4 text-center border-b">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    aria-label="Load more notifications"
                                >
                                    Load more notifications
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}