import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getMe } from './auth-api';
import { env } from './env';
import { getItem, StorageKeys } from './storage';

/** Events the API pushes over the realtime socket (see xcellar-api src/lib/realtime.ts). */
export type RealtimeEvent =
  | { type: 'job.assigned'; shipmentId: string; title: string; body: string }
  | { type: 'job.changed'; shipmentId: string }
  | { type: 'shipment.changed'; shipmentId: string };

/** The server closes with this when the token is missing or expired. */
const CLOSE_UNAUTHORIZED = 4001;
const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

const realtimeUrl = () => `${env.apiBaseUrl.replace(/^http/, 'ws')}/realtime`;

/**
 * Keep a live connection to the API while the app is in the foreground and
 * hand every event to `onEvent`. Reconnects with backoff; when the server says
 * the token has expired, makes one ordinary request (which refreshes it) and
 * reconnects. Disconnects in the background — push notifications cover that.
 */
export function useRealtime(enabled: boolean, onEvent: (event: RealtimeEvent) => void): void {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let stopped = false;

    const scheduleReconnect = () => {
      if (stopped || AppState.currentState !== 'active') return;
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    async function connect() {
      if (stopped || socket) return;
      const token = await getItem(StorageKeys.accessToken);
      if (!token || stopped) return;

      const next = new WebSocket(realtimeUrl());
      socket = next;
      next.onopen = () => next.send(JSON.stringify({ type: 'auth', token }));
      next.onmessage = (message) => {
        try {
          const event = JSON.parse(String(message.data)) as RealtimeEvent | { type: 'ready' };
          if (event.type === 'ready') {
            attempt = 0;
            return;
          }
          handler.current(event);
        } catch {
          // Ignore anything that isn't one of our events.
        }
      };
      next.onclose = (event) => {
        socket = null;
        if (stopped) return;
        if (event.code === CLOSE_UNAUTHORIZED) {
          // Any authenticated request refreshes an expired token; then try again.
          void getMe()
            .catch(() => undefined)
            .finally(scheduleReconnect);
          return;
        }
        scheduleReconnect();
      };
    }

    const disconnect = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      socket?.close();
      socket = null;
    };

    void connect();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        attempt = 0;
        void connect();
      } else {
        disconnect();
      }
    });

    return () => {
      stopped = true;
      appState.remove();
      disconnect();
    };
  }, [enabled]);
}
