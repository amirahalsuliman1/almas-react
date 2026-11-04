import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Marquee } from '../../../app/components/home/Marquee';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));

const items = [{ text: 'شحن مجاني', url: '/shipping' }, { text: 'منتجات أصلية' }, { text: '' }];

describe('Marquee', () => {
  it('renders nothing without a phrase', () => {
    expect(renderToString(<Marquee data={{ items: [{ text: '' }] }} />)).toBe('');
  });

  it('reads one copy: every other copy is aria-hidden', () => {
    const { container } = render(<Marquee data={{ items }} />);
    const groups = container.querySelectorAll('.marquee__group');
    expect(groups.length % 2).toBe(0);
    expect(groups[0].getAttribute('aria-hidden')).toBeNull();
    [...groups].slice(1).forEach((g) => expect(g.getAttribute('aria-hidden')).toBe('true'));
    expect(groups[0].querySelectorAll('.marquee__item')).toHaveLength(2);
  });

  it('keeps one tab stop per link: hidden copies leave the tab order', () => {
    const { container } = render(<Marquee data={{ items }} />);
    const links = [...container.querySelectorAll('a.marquee__link')];
    expect(links.filter((a) => a.getAttribute('tabindex') !== '-1')).toHaveLength(1);
  });

  it('uses the separator, «✦» by default, hidden from screen readers', () => {
    const plain = render(<Marquee data={{ items }} />);
    const sep = plain.container.querySelector('.marquee__separator');
    expect(sep?.textContent).toBe('✦');
    expect(sep?.getAttribute('aria-hidden')).toBe('true');
    plain.unmount();
    const custom = render(<Marquee data={{ items, separator: '•' }} />);
    expect(custom.container.querySelector('.marquee__separator')?.textContent).toBe('•');
  });

  it('applies speed and the merchant colours, dropping invalid ones', () => {
    const { container } = render(
      <Marquee data={{ items, speed: [{ value: 'fast' }], background_color: '#86663A', text_color: 'red;x' }} />
    );
    const root = container.querySelector('.marquee') as HTMLElement;
    expect(root.className).toContain('marquee--fast');
    expect(root.style.getPropertyValue('--marquee-bg')).toBe('#86663a');
    expect(root.style.getPropertyValue('--marquee-text')).toBe('');
  });
});
