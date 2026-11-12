import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type IncomingJobNative = {
  show(shipmentId: string, title: string, body: string, url: string): void;
  cancel(shipmentId: string): void;
  showOverLockScreen(show: boolean): void;
  canUseFullScreenIntent(): boolean;
  openFullScreenSettings(): void;
};

/**
 * The Android call-style new-job alert (see IncomingJobModule.kt). Absent on
 * iPhone, where apps can't open themselves, and in Expo Go, which can't load
 * custom native code; every call is then a no-op.
 */
const native = Platform.OS === 'android' ? requireOptionalNativeModule<IncomingJobNative>('IncomingJob') : null;

export const IncomingJob = {
  isAvailable: native != null,
  show: (shipmentId: string, title: string, body: string, url: string) => native?.show(shipmentId, title, body, url),
  cancel: (shipmentId: string) => native?.cancel(shipmentId),
  showOverLockScreen: (show: boolean) => native?.showOverLockScreen(show),
  canUseFullScreenIntent: () => native?.canUseFullScreenIntent() ?? true,
  openFullScreenSettings: () => native?.openFullScreenSettings(),
};
