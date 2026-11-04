import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { HotspotImage, toHotspotPoints } from '../../../app/components/common/HotspotImage';
import { pickedProductId } from '../../../app/lib/pickers';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (n: number) => `${n} SAR` }),
}));
vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (url?: string) => url,
  getCdnImageSrcSet: () => undefined,
}));
vi.mock('@salla.sa/twilight-components-react/add-product-button', () => ({
  SallaAddProductButton: ({ children, className, productId }: { children: React.ReactNode; className?: string; productId: number }) => (
    <button type="button" className={className} data-product={productId}>
      {children}
    </button>
  ),
}));
const api = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({ product: api }));

const products: Record<string, unknown> = {
  '1': { id: 1, name: 'Stanley Quencher', url: '/p/1', price: 180, regular_price: 180, is_on_sale: false, image: { url: '/1.jpg' }, status: 'sale', type: 'product' },
  '2': { id: 2, name: 'Rhode Lip', url: '/p/2', price: 120, sale_price: 96, regular_price: 120, is_on_sale: true, image: { url: '/2.jpg' }, status: 'sale', type: 'product' },
};

beforeEach(() => {
  api.find.mockImplementation((id: string) =>
    products[id] ? Promise.resolve(products[id]) : Promise.reject(new Error('not found'))
  );
});

const points = [
  { x: 30, y: 40, productId: '1' },
  { x: 70, y: 60, productId: '2' },
  { x: 50, y: 50, productId: '999' },
  { x: 10, y: 10, productId: null },
];

describe('HotspotImage', () => {
  it('places markers by percentage, only for products that were found', async () => {
    const { container } = render(<HotspotImage image="/look.jpg" points={points} />);
    await waitFor(() => expect(container.querySelectorAll('.hotspot__marker')).toHaveLength(2));
    const marker = container.querySelector('.hotspot__marker') as HTMLElement;
    expect(marker.style.getPropertyValue('--x')).toBe('30%');
    expect(marker.style.getPropertyValue('--y')).toBe('40%');
    expect(container.querySelectorAll('.hotspot__pill')).toHaveLength(2);
  });

  it('names each marker by its product and ties it to its card', async () => {
    const { container } = render(<HotspotImage image="/look.jpg" points={points} />);
    await waitFor(() => expect(container.querySelector('.hotspot__marker')).toBeTruthy());
    const marker = container.querySelector('.hotspot__marker')!;
    expect(marker.getAttribute('aria-label')).toContain('Stanley Quencher');
    const pill = container.querySelector(`#${CSS.escape(marker.getAttribute('aria-controls')!)}`);
    expect(pill?.textContent).toContain('Stanley Quencher');
  });

  it('a marker moves focus to its card and marks it current', async () => {
    const { container } = render(<HotspotImage image="/look.jpg" points={points} />);
    await waitFor(() => expect(container.querySelectorAll('.hotspot__marker')).toHaveLength(2));
    Element.prototype.scrollIntoView = vi.fn();
    fireEvent.click(container.querySelectorAll('.hotspot__marker')[1]);
    const pills = container.querySelectorAll('.hotspot__pill');
    expect(pills[1].getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(pills[1].querySelector('a'));
  });

  it('shows the sale price and the struck-through regular price', async () => {
    const { container } = render(<HotspotImage image="/look.jpg" points={points} />);
    await waitFor(() => expect(container.querySelectorAll('.hotspot__pill')).toHaveLength(2));
    const sale = container.querySelectorAll('.hotspot__pill')[1];
    expect(sale.querySelector('.hotspot__pill-price')?.textContent).toBe('96 SAR');
    expect(sale.querySelector('.hotspot__pill-price-was')?.textContent).toContain('120 SAR');
  });

  it('labels the add button with the product for screen readers', async () => {
    const { container } = render(<HotspotImage image="/look.jpg" points={points} />);
    await waitFor(() => expect(container.querySelector('.hotspot__pill-buy')).toBeTruthy());
    expect(container.querySelector('.hotspot__pill-buy .sr-only')?.textContent).toContain('Stanley Quencher');
  });
});

describe('toHotspotPoints', () => {
  it('clamps positions to 0–100 and reads the product picker', () => {
    expect(
      toHotspotPoints([{ x: 140, y: -5, product: [{ id: 7 }] }, { x: '25', y: '75', product: [] }], pickedProductId)
    ).toEqual([
      { x: 100, y: 0, productId: '7' },
      { x: 25, y: 75, productId: null },
    ]);
  });
});
