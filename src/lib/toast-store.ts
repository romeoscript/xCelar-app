import { create } from 'zustand';

export type ToastType = 'success' | 'error';

type ToastState = {
  message: string | null;
  type: ToastType;
  /** Bumped on every show so repeating the same message still re-triggers it. */
  token: number;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  type: 'success',
  token: 0,
  show: (message, type = 'success') => set({ message, type, token: get().token + 1 }),
  hide: () => set({ message: null }),
}));

/** Fire a toast from anywhere (screens, mutations) without a hook. */
export function toast(message: string, type: ToastType = 'success'): void {
  useToastStore.getState().show(message, type);
}
