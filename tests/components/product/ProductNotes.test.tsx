import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ProductNotes, productNotes } from '../../../app/components/product/ProductNotes';

const theme = vi.hoisted(() => ({ settings: {} as Record<string, unknown> }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({ useTwilight: () => ({ theme }) }));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));

const defaults = { shipping: 'Shipping', notice: 'Notice' };

beforeEach(() => {
  theme.settings = {};
});

describe('ProductNotes', () => {
  it('draws no panel without text, and leaves out a note without text', () => {
    expect(renderToString(<ProductNotes />)).toBe('');
    expect(productNotes({ pdp_notice_text: 'منتجات أصلية' }, defaults)).toEqual([
      { title: 'Notice', text: 'منتجات أصلية' },
    ]);
  });

  it("uses the merchant's titles over the defaults", () => {
    expect(productNotes({ pdp_shipping_text: 'x', pdp_shipping_title: 'التوصيل' }, defaults)[0].title).toBe('التوصيل');
  });

  it('opens both notes by default, as Twig did, and closes one on its button', () => {
    theme.settings = { pdp_shipping_text: 'الرياض: يومين\n\nباقي المدن: ٥ أيام', pdp_notice_text: 'أصلية' };
    const { container } = render(<ProductNotes />);
    const buttons = container.querySelectorAll<HTMLButtonElement>('.faq__trigger');
    expect(buttons).toHaveLength(2);
    expect([...buttons].map((b) => b.getAttribute('aria-expanded'))).toEqual(['true', 'true']);
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(buttons[0].getAttribute('aria-controls')!)?.hasAttribute('inert')).toBe(true);
  });

  it('keeps every line, an empty one as a gap', () => {
    theme.settings = { pdp_shipping_text: 'الرياض: يومين\n\nباقي المدن: ٥ أيام' };
    const { container } = render(<ProductNotes />);
    expect([...container.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'الرياض: يومين',
      '',
      'باقي المدن: ٥ أيام',
    ]);
  });
});
