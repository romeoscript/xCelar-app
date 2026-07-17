import * as Notifications from 'expo-notifications';
import { type Href, useRouter } from 'expo-router';
import { useEffect } from 'react';

type NotificationData = { type?: string; shipmentId?: string };

/** Where a tapped notification should take the user, from its data payload. */
function routeFor(data: NotificationData): Href | null {
  if (data.type === 'shipment' && data.shipmentId) {
    return { pathname: '/shipment/[id]', params: { id: data.shipmentId } };
  }
  if (data.type === 'new-job') {
    return '/rider/home';
  }
  return null;
}

/**
 * Deep-link when a push notification is tapped — both a cold start (the app was
 * launched from the notification) and taps while it's already running. Without
 * this the token registers but tapping a push does nothing.
 */
export function useNotificationObserver(): void {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted || !response) {
        return;
      }
      const route = routeFor(response.notification.request.content.data as NotificationData);
      if (route) {
        router.push(route);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeFor(response.notification.request.content.data as NotificationData);
      if (route) {
        router.push(route);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [router]);
}
