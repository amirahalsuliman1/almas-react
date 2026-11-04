import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { StoreFeatures, toFeatures } from '../../../app/components/home/StoreFeatures';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));

const features = [
  { icon: 'sicon-shipping-fast', title: 'شحن سريع', description: 'يوصلك طلبك خلال يومين' },
  { icon: 'https://cdn.example/secure.svg', title: 'دفع آمن', description: '' },
  { icon: 'sicon-gold-badge', title: 'منتجات أصلية', description: 'من الوكيل الرسمي' },
];

describe('StoreFeatures', () => {
  it('draws nothing without a titled feature', () => {
    expect(renderToString(<StoreFeatures data={{ features: [{ icon: 'sicon-x', title: '' }] }} />)).toBe('');
    expect(renderToString(<StoreFeatures data={{}} />)).toBe('');
  });

  it("reads the API's features or Twig's items, and either name for the line", () => {
    expect(toFeatures({ items: [{ title: 'أ', text: 'سطر' }] })).toEqual([{ icon: '', title: 'أ', text: 'سطر' }]);
    expect(toFeatures({ features: [{ title: { ar: 'ب' }, description: 'وصف' }] }, 'ar')).toEqual([
      { icon: '', title: 'ب', text: 'وصف' },
    ]);
  });

  it('draws each feature with its icon (class or image), title and line, the icon hidden from screen readers', () => {
    const { container } = render(<StoreFeatures data={{ features }} />);
    const items = container.querySelectorAll('.features__item');
    expect(items).toHaveLength(3);
    expect(items[0].querySelector('.features__icon i')?.className).toBe('sicon-shipping-fast');
    expect(items[0].querySelector('.features__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(items[1].querySelector('.features__icon img')?.getAttribute('src')).toBe('https://cdn.example/secure.svg');
    expect(items[1].querySelector('.features__text')).toBeNull();
    expect(items[2].querySelector('h2.features__title')?.textContent).toBe('منتجات أصلية');
  });

  it('gives the grid one column per feature, up to four', () => {
    const many = [...features, ...features];
    const { container } = render(<StoreFeatures data={{ features: many }} />);
    expect((container.querySelector('.features__grid') as HTMLElement).style.getPropertyValue('--features-count')).toBe('4');
  });
});
