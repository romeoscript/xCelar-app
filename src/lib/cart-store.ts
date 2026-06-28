import { Alert } from 'react-native';
import { create } from 'zustand';

import { type Product, type Vendor } from './marketplace-api';

export type CartLine = { product: Product; quantity: number };

type CartState = {
  /** The vendor the current cart belongs to — a cart holds one vendor at a time. */
  vendor: Vendor | null;
  lines: CartLine[];
  /** Add one of a product. Switching vendors replaces the cart. */
  add: (vendor: Vendor, product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  vendor: null,
  lines: [],

  add: (vendor, product) =>
    set((state) => {
      const sameVendor = state.vendor?.id === vendor.id;
      const lines = sameVendor ? state.lines : [];
      const existing = lines.find((line) => line.product.id === product.id);
      const nextLines = existing
        ? lines.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...lines, { product, quantity: 1 }];
      return { vendor, lines: nextLines };
    }),

  setQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        const lines = state.lines.filter((line) => line.product.id !== productId);
        return { lines, vendor: lines.length > 0 ? state.vendor : null };
      }
      return {
        lines: state.lines.map((line) =>
          line.product.id === productId ? { ...line, quantity } : line,
        ),
      };
    }),

  remove: (productId) =>
    set((state) => {
      const lines = state.lines.filter((line) => line.product.id !== productId);
      return { lines, vendor: lines.length > 0 ? state.vendor : null };
    }),

  clear: () => set({ vendor: null, lines: [] }),
}));

/**
 * Run a cart-adding action, but first confirm if the cart holds another
 * vendor's items (adding would clear them). Calls `perform` immediately when
 * there's no conflict.
 */
export function addToCartWithConfirm(vendor: Vendor, perform: () => void): void {
  const { vendor: current, lines } = useCartStore.getState();
  if (current && current.id !== vendor.id && lines.length > 0) {
    Alert.alert(
      'Start a new cart?',
      `Your cart has items from ${current.name}. Adding this will clear it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear & add', style: 'destructive', onPress: perform },
      ],
    );
    return;
  }
  perform();
}

/** Total item count in the cart. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Cart subtotal in kobo. */
export function cartSubtotalKobo(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.product.priceKobo * line.quantity, 0);
}
