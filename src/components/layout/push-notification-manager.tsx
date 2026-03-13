'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { subscribeUserToPush, unsubscribeUserFromPush } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';

import { useTranslation } from 'react-i18next';

export function PushNotificationManager() {
  const { t } = useTranslation();

    const [isSupported, setIsSupported] = React.useState(false);
    const [isSubscribed, setIsSubscribed] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    // Check support and status
    React.useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);

            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((subscription) => {
                    setIsSubscribed(!!subscription);
                    setIsLoading(false);
                });
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            await subscribeUserToPush();
            setIsSubscribed(true);
            toast({
                title: "Notifications Enabled",
                description: "You will now receive push notifications."
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to enable notifications. Please check your browser settings.",
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setIsLoading(true);
        try {
            await unsubscribeUserFromPush();
            setIsSubscribed(false);
            toast({
                title: "Notifications Disabled",
                description: "You have unsubscribed from push notifications."
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return null; // Or show a message saying not supported
    }

    if (isLoading) {
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }

    return (
        <div>
            {isSubscribed ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsubscribe}
                    className="gap-2"
                >
                    <BellOff className="h-4 w-4" />{t('common.disableNotifications')}</Button>
            ) : (
                <Button
                    size="sm"
                    onClick={handleSubscribe}
                    className="gap-2"
                >
                    <Bell className="h-4 w-4" />{t('common.enableNotifications')}</Button>
            )}
        </div>
    );
}
