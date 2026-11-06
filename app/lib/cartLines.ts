import { useEffect, useSyncExternalStore } from 'react';
import { whenSallaReady } from '@salla.sa/twilight-theme-engine/utils';

/**
 * Which products are in the cart, and how many — for the product card's
 * in-cart stepper (R-05b), ported from Twig's `partials/cart-state.js`.
 *
 * NOTHING IS RECOMPUTED HERE. The map is the cart Salla returns (its own item
 * ids and quantities), and every change goes back through `salla.cart`'s own
 * actions, which fire the cart events the rest of the theme listens to.
 *
 * NO CART IS CREATED TO ASK. The cart is read only when the SDK already holds
 * an id (`cart.id` in its storage); a visitor with no basket costs no request.
 */

interface CartItemLike {
  id?: unknown;
  product_id?: unknown;
  quantity?: unknown;
}

interface CartSdk {
  storage?: { get?: (key: string) => unknown };
  cart?: {
    api?: { details?: (id: unknown, include?: unknown[]) => Promise<unknown> };
    event?: {
      onItemAdded?: (cb: (r: unknown) => void) => void;
      onItemUpdated?: (cb: (r: unknown) => void) => void;
      onItemDeleted?: (cb: (r: unknown) => void) => void;
    };
    updateItem?: (data: { id: unknown; quantity: number }) => Promise<unknown>;
    deleteItem?: (id: unknown) => Promise<unknown>;
  };
}

export interface CartLine {
  itemId: unknown;
  quantity: number;
}

let lines = new Map<number, CartLine>();
const listeners = new Set<() => void>();
let started = false;
let sdk: CartSdk | null = null;

const notify = () => listeners.forEach((listener) => listener());

/** Replace the map with the items of a cart, when it carries them. */
export function ingestCart(cart: unknown): boolean {
  const items = (cart as { items?: unknown } | null | undefined)?.items;
  if (!Array.isArray(items)) return false;
  const next = new Map<number, CartLine>();
  for (const item of items as CartItemLike[]) {
    const productId = Number(item?.product_id);
    if (!Number.isFinite(productId)) continue;
    next.set(productId, { itemId: item.id, quantity: Number(item.quantity) || 0 });
  }
  lines = next;
  notify();
  return true;
}

const cartOf = (response: unknown) => {
  const data = (response as { data?: { cart?: unknown } & Record<string, unknown> } | null | undefined)?.data;
  return data?.cart ?? data;
};

function fetchCart() {
  const cartId = sdk?.storage?.get?.('cart.id');
  if (!cartId || !sdk?.cart?.api?.details) return Promise.resolve();
  return sdk.cart.api
    .details(cartId, [])
    .then((response) => {
      ingestCart(cartOf(response));
    })
    .catch(() => {});
}

/** Read the cart once and follow it from then on. Safe to call repeatedly. */
export function startCartLines() {
  if (started || typeof window === 'undefined') return;
  started = true;
  whenSallaReady((ready) => {
    sdk = ready as unknown as CartSdk;
    // Each event carries the new cart; when one does not, read it again.
    const follow = (response: unknown) => {
      if (!ingestCart((response as { data?: { cart?: unknown } } | undefined)?.data?.cart)) void fetchCart();
    };
    sdk.cart?.event?.onItemAdded?.(follow);
    sdk.cart?.event?.onItemUpdated?.(follow);
    sdk.cart?.event?.onItemDeleted?.(follow);
    void fetchCart();
  });
}

/** The cart line for a product, or undefined when it is not in the cart. */
export function cartLine(productId: unknown): CartLine | undefined {
  return lines.get(Number(productId));
}

/** Step a product's quantity through Salla. Zero removes the line, as the cart page's bin does. */
export function stepCartLine(productId: unknown, delta: number): Promise<unknown> {
  const line = cartLine(productId);
  const cart = sdk?.cart;
  if (!line || !cart) return Promise.resolve();
  const quantity = line.quantity + delta;
  if (quantity < 1) return cart.deleteItem ? cart.deleteItem(line.itemId) : Promise.resolve();
  return cart.updateItem ? cart.updateItem({ id: line.itemId, quantity }) : Promise.resolve();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * How many of this product are in the cart (0 when none, or when `enabled` is
 * false). The server always renders 0, so hydration never mismatches.
 */
export function useCartQuantity(productId: unknown, enabled: boolean): number {
  useEffect(() => {
    if (enabled) startCartLines();
  }, [enabled]);
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? (cartLine(productId)?.quantity ?? 0) : 0),
    () => 0
  );
}

/** Test hook: forget everything. */
export function resetCartLinesForTest() {
  lines = new Map();
  started = false;
  sdk = null;
  listeners.clear();
}

/** Test hook: hand the store an SDK without waiting for Salla. */
export function setCartSdkForTest(next: CartSdk | null) {
  sdk = next;
}
