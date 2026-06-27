import { create } from 'zustand';

type FavoritesState = {
  ids: Set<string>;
  toggle: (vendorId: string) => void;
};

/** In-memory favourite vendors. (Persisted storage can come later.) */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  ids: new Set<string>(),
  toggle: (vendorId) =>
    set((state) => {
      const ids = new Set(state.ids);
      if (ids.has(vendorId)) {
        ids.delete(vendorId);
      } else {
        ids.add(vendorId);
      }
      return { ids };
    }),
}));
