import { describe, it, expect, vi, beforeEach } from 'vitest';

const ready = vi.hoisted(() => ({ cb: null as null | ((sdk: unknown) => void) }));
vi.mock('@salla.sa/twilight-theme-engine/utils', () => ({
  whenSallaReady: (cb: (sdk: unknown) => void) => {
    ready.cb = cb;
    return () => {};
  },
}));

import {
  cartLine,
  ingestCart,
  resetCartLinesForTest,
  setCartSdkForTest,
  startCartLines,
  stepCartLine,
} from '../../app/lib/cartLines';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  resetCartLinesForTest();
  ready.cb = null;
});

describe('cartLines', () => {
  it("maps Salla's cart items by product id", () => {
    expect(ingestCart({ items: [{ id: 7, product_id: '42', quantity: '2' }] })).toBe(true);
    expect(cartLine(42)).toEqual({ itemId: 7, quantity: 2 });
    expect(cartLine('42')?.quantity).toBe(2);
    expect(cartLine(43)).toBeUndefined();
    expect(ingestCart({})).toBe(false);
  });

  it('never creates a cart to ask: no stored id, no request', async () => {
    const details = vi.fn();
    startCartLines();
    ready.cb!({ storage: { get: () => null }, cart: { api: { details }, event: {} } });
    await flush();
    expect(details).not.toHaveBeenCalled();
  });

  it('reads the stored cart once and follows its events', async () => {
    const handlers: Record<string, (r: unknown) => void> = {};
    const details = vi.fn().mockResolvedValue({ data: { cart: { items: [{ id: 1, product_id: 5, quantity: 1 }] } } });
    startCartLines();
    ready.cb!({
      storage: { get: (k: string) => (k === 'cart.id' ? 99 : null) },
      cart: {
        api: { details },
        event: {
          onItemAdded: (cb: (r: unknown) => void) => (handlers.added = cb),
          onItemUpdated: (cb: (r: unknown) => void) => (handlers.updated = cb),
          onItemDeleted: (cb: (r: unknown) => void) => (handlers.deleted = cb),
        },
      },
    });
    await flush();
    expect(details).toHaveBeenCalledWith(99, []);
    expect(cartLine(5)?.quantity).toBe(1);

    handlers.updated({ data: { cart: { items: [{ id: 1, product_id: 5, quantity: 3 }] } } });
    expect(cartLine(5)?.quantity).toBe(3);
  });

  it('steps through Salla: update above one, delete at one, nothing for a product not in the cart', async () => {
    const updateItem = vi.fn().mockResolvedValue({});
    const deleteItem = vi.fn().mockResolvedValue({});
    setCartSdkForTest({ cart: { updateItem, deleteItem } });
    ingestCart({ items: [{ id: 'a', product_id: 1, quantity: 2 }, { id: 'b', product_id: 2, quantity: 1 }] });

    await stepCartLine(1, 1);
    expect(updateItem).toHaveBeenCalledWith({ id: 'a', quantity: 3 });
    await stepCartLine(2, -1);
    expect(deleteItem).toHaveBeenCalledWith('b');
    await stepCartLine(3, 1);
    expect(updateItem).toHaveBeenCalledTimes(1);
  });
});
