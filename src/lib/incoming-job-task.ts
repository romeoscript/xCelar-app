import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { IncomingJob } from '../../modules/incoming-job';

/**
 * On Android the server sends new-job alerts as silent data pushes, which wake
 * this task even when the app is closed; it then shows the call-style alert
 * that takes over the screen. Must be defined at module scope, before the app
 * renders, so the OS can run it headless.
 */
const INCOMING_JOB_TASK = 'xcelar-incoming-job';

type AssignedPayload = { kind?: string; shipmentId?: string; title?: string; body?: string };

function readPayload(data: unknown): AssignedPayload | null {
  const raw = (data as { data?: { dataString?: string } } | undefined)?.data?.dataString;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AssignedPayload;
  } catch {
    return null;
  }
}

TaskManager.defineTask(INCOMING_JOB_TASK, async ({ data, error }) => {
  if (error) return;
  const payload = readPayload(data);
  if (payload?.kind !== 'assigned' || !payload.shipmentId) return;
  IncomingJob.show(
    payload.shipmentId,
    payload.title ?? 'New job assigned',
    payload.body ?? 'Open Xcelar to see it.',
    Linking.createURL(`/rider/delivery/${payload.shipmentId}`, { queryParams: { incoming: '1' } }),
  );
});

/** Start listening for new-job pushes in the background (Android dev/store builds only). */
export function registerIncomingJobTask(): void {
  if (Platform.OS !== 'android' || !IncomingJob.isAvailable) return;
  void Notifications.registerTaskAsync(INCOMING_JOB_TASK).catch(() => undefined);
}
