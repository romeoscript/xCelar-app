import { create } from 'zustand';

import { StorageKeys, getItem, setItem } from './storage';

const TRUE = 'true';

type PreferencesState = {
  biometricEnabled: boolean;
  pushEnabled: boolean;
  hydrated: boolean;
  /** When true the app shows the lock screen until a biometric scan succeeds. */
  locked: boolean;
  /** Load persisted preferences on app launch. */
  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setPushEnabled: (enabled: boolean) => Promise<void>;
  lock: () => void;
  unlock: () => void;
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  biometricEnabled: false,
  pushEnabled: false,
  hydrated: false,
  locked: false,

  hydrate: async () => {
    const [biometric, push] = await Promise.all([
      getItem(StorageKeys.biometricEnabled),
      getItem(StorageKeys.pushEnabled),
    ]);
    const biometricEnabled = biometric === TRUE;
    set({
      biometricEnabled,
      pushEnabled: push === TRUE,
      hydrated: true,
      // Start locked when biometric unlock is on, so the gate prompts on launch.
      locked: biometricEnabled,
    });
  },

  setBiometricEnabled: async (enabled) => {
    await setItem(StorageKeys.biometricEnabled, String(enabled));
    set({ biometricEnabled: enabled });
  },

  setPushEnabled: async (enabled) => {
    await setItem(StorageKeys.pushEnabled, String(enabled));
    set({ pushEnabled: enabled });
  },

  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
