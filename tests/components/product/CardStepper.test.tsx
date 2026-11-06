import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';

const step = vi.hoisted(() => ({ fn: vi.fn(() => Promise.resolve()), qty: 0 }));
vi.mock('../../../app/lib/cartLines', () => ({
  stepCartLine: step.fn,
  useCartQuantity: (_id: unknown, enabled: boolean) => (enabled ? step.qty : 0),
}));
vi.mock('@salla.sa/twilight-theme-engine/product', () => ({
  ProductCard: () => (
    <div className="s-product-card-vertical">
      <div className="s-product-card-image" />
      <div className="s-product-card-content-footer" data-testid="footer">
        <salla-add-product-button />
      </div>
    </div>
  ),
}));
const detail = vi.hoisted(() => ({ fetch: vi.fn(() => Promise.resolve({})) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ fetchQuery: detail.fetch }) }));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: { queries: { detail: (id: string) => ({ queryKey: ['products', 'detail', id] }) } },
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useWishlist', () => ({ useWishlist: () => ({ has: () => false }) }));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));

import { CardStepper, ProductCard, canStep } from '../../../app/components/product/ProductCard';

beforeEach(() => {
  step.fn.mockClear();
  step.qty = 0;
});

describe('ProductCard in the cart', () => {
  it('puts the stepper in the footer once the product is in the cart, and not before', async () => {
    const product = { id: 9, name: 'كريم', status: 'sale', type: 'product' } as never;
    const first = render(<ProductCard product={product} />);
    await act(async () => {});
    expect(first.getByTestId('footer').querySelector('.product-card__stepper')).toBeNull();
    first.unmount();

    step.qty = 3;
    const { getByTestId } = render(<ProductCard product={product} />);
    await act(async () => {});
    const stepper = getByTestId('footer').querySelector('.product-card__stepper');
    expect(stepper?.querySelector('[aria-live]')?.textContent).toBe('3');
  });
});

describe('canStep', () => {
  it('steps a product for sale, never a donation, a booking or one without an add button', () => {
    expect(canStep({ status: 'sale', type: 'product' })).toBe(true);
    expect(canStep({ status: 'out', type: 'product' })).toBe(false);
    expect(canStep({ status: 'sale', type: 'booking' })).toBe(false);
    expect(canStep({ status: 'sale', type: 'donating' })).toBe(false);
    expect(canStep({ status: 'sale', type: 'product', donation: {} })).toBe(false);
    expect(canStep({ status: 'sale', type: 'product' }, true)).toBe(false);
  });
});

describe('CardStepper', () => {
  it('is a named group with + first, the count as a live region, and − last', () => {
    const { getByRole, container } = render(<CardStepper productId={4} name="عطر" quantity={2} />);
    expect(getByRole('group').getAttribute('aria-label')).toBe('Quantity of عطر in the cart');
    const [plus, minus] = container.querySelectorAll('button');
    expect(plus.getAttribute('aria-label')).toBe('Increase quantity');
    expect(minus.getAttribute('aria-label')).toBe('Decrease quantity');
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('2');
  });

  it("at one, − says it removes the product", () => {
    const { container } = render(<CardStepper productId={4} name="عطر" quantity={1} />);
    expect(container.querySelectorAll('button')[1].getAttribute('aria-label')).toBe('Remove the product from the cart');
  });

  it('steps through the cart, and ignores a second press while one is in flight', async () => {
    let resolve: () => void = () => {};
    step.fn.mockImplementationOnce(() => new Promise<void>((r) => (resolve = r)));
    const { container } = render(<CardStepper productId={4} name="عطر" quantity={2} />);
    const [plus, minus] = container.querySelectorAll('button');
    fireEvent.click(plus);
    expect(step.fn).toHaveBeenCalledWith(4, 1);
    expect(plus.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(minus);
    expect(step.fn).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    fireEvent.click(minus);
    expect(step.fn).toHaveBeenLastCalledWith(4, -1);
  });
});
