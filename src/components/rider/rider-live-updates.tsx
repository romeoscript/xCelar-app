import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { AssignmentAlert, type AssignmentAlertData } from '@/components/rider/assignment-alert';
import { registerIncomingJobTask } from '@/lib/incoming-job-task';
import { requestNotificationPermission, syncPushToken } from '@/lib/notifications';
import { useRealtime, type RealtimeEvent } from '@/lib/realtime';
import { markDeliverySeen } from '@/lib/rider-api';

import { IncomingJob } from '../../../modules/incoming-job';

type PushData = { type?: string; kind?: string; shipmentId?: string };

/**
 * Everything that makes a new job impossible to miss while a rider is signed
 * in: a live connection that refreshes their jobs the moment dispatch changes
 * them, the ringing full-screen alert for a new assignment, and the push token
 * registration that lets the phone ring when the app is closed.
 */
export function RiderLiveUpdates() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<AssignmentAlertData | null>(null);

  const refreshJobs = useCallback(
    (shipmentId?: string) => {
      void queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      if (shipmentId) void queryClient.invalidateQueries({ queryKey: ['rider-delivery', shipmentId] });
    },
    [queryClient],
  );

  const showAlert = useCallback(
    (next: AssignmentAlertData) => {
      refreshJobs(next.shipmentId);
      setAlert((current) => (current?.shipmentId === next.shipmentId ? current : next));
    },
    [refreshJobs],
  );

  useRealtime(true, (event: RealtimeEvent) => {
    if (event.type === 'job.assigned') {
      showAlert({ shipmentId: event.shipmentId, title: event.title, body: event.body });
    } else if (event.type === 'job.changed') {
      refreshJobs(event.shipmentId);
    }
  });

  // A push that lands while the app is open (e.g. the socket was reconnecting).
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data as PushData;
      if (data.type === 'rider-delivery' && data.kind === 'assigned' && data.shipmentId) {
        showAlert({ shipmentId: data.shipmentId, title: content.title ?? 'New job assigned', body: content.body ?? '' });
      } else if (data.type === 'rider-delivery') {
        refreshJobs(data.shipmentId);
      }
    });
    return () => subscription.remove();
  }, [refreshJobs, showAlert]);

  // Riders need pushes to hear about jobs with the app closed, so ask once and register.
  useEffect(() => {
    void requestNotificationPermission()
      .then((granted) => (granted ? syncPushToken() : null))
      .catch(() => undefined);
    registerIncomingJobTask();
  }, []);

  const settle = (current: AssignmentAlertData) => {
    setAlert(null);
    IncomingJob.cancel(current.shipmentId);
    // Stops the server ringing the phone again about this job.
    void markDeliverySeen(current.shipmentId).catch(() => undefined);
  };

  return (
    <AssignmentAlert
      alert={alert}
      onView={(current) => {
        settle(current);
        router.push(`/rider/delivery/${current.shipmentId}`);
      }}
      onDismiss={settle}
    />
  );
}
