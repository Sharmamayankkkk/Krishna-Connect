
// Convert VAPID key to Uint8Array
export function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Request permission and subscribe
export async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported on this browser.');
    }

    const registration = await navigator.serviceWorker.ready;

    // Check permissions
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Permission denied.');
    }

    // Subscribe
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
        throw new Error('VAPID Public Key is missing. Please check your .env.local file.');
    }

    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
    };

    const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);

    // Send to backend
    await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: pushSubscription }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return pushSubscription;
}

export async function unsubscribeUserFromPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
        await subscription.unsubscribe();
        // Ideally notify backend to delete, but our backend handles 410 Gone updates lazily
    }
}
