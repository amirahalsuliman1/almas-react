import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { PartnerBanner } from '../../../app/components/home/PartnerBanner';
import manifest from '../../../twilight.json';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (src: string) => src,
  getCdnImageSrcSet: (src: string) => `${src} 800w`,
}));

const wa = 'https://wa.me/966500000000';

describe('PartnerBanner', () => {
  it('draws nothing without an image or without any link', () => {
    expect(renderToString(<PartnerBanner data={{ brand_url: wa }} />)).toBe('');
    expect(renderToString(<PartnerBanner data={{ image: '/p.jpg' }} />)).toBe('');
  });

  it('draws only the buttons that have a link, in order, with the merchant’s labels', () => {
    const { container } = render(
      <PartnerBanner data={{ image: '/p.jpg', brand_url: [{ url: wa }], brand_label: 'انضمي كبراند' }} />
    );
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(wa);
    expect(links[0].textContent).toBe('انضمي كبراند');
    expect(links[0].className).toContain('partner-banner__cta--brand');
  });

  it('falls back to the translated labels when the fields are cleared', () => {
    const { container } = render(
      <PartnerBanner data={{ image: '/p.jpg', brand_url: wa, individual_url: '/page-1', brand_label: '', individual_label: '' }} />
    );
    expect([...container.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['Join as a brand', 'Join as an individual']);
  });

  it('shows the title and line only when set, and reserves the photograph’s box', () => {
    const { container, rerender } = render(<PartnerBanner data={{ image: '/p.jpg', brand_url: wa }} />);
    expect(container.querySelector('h2')).toBeNull();
    expect(container.querySelector('.partner-banner__subtitle')).toBeNull();
    const img = container.querySelector('img')!;
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['900', '1125']);

    rerender(<PartnerBanner data={{ image: '/p.jpg', brand_url: wa, title: { ar: 'عندك براند؟' }, subtitle: 'انضم لنا' }} />);
    expect(container.querySelector('h2')?.textContent).toBe('عندك براند؟');
    expect(container.querySelector('.partner-banner__subtitle')?.textContent).toBe('انضم لنا');
  });

  it('declares the banner with link fields and no form', () => {
    const comp = (manifest.components as { path: string; fields: { id: string; format?: string; value?: unknown }[] }[]).find(
      (c) => c.path === 'home.partner-banner'
    );
    expect(comp?.fields.map((f) => f.id)).toEqual([
      'image',
      'alt',
      'title',
      'subtitle',
      'brand_label',
      'brand_url',
      'individual_label',
      'individual_url',
    ]);
    expect(comp?.fields.find((f) => f.id === 'brand_url')?.format).toBe('variable-list');
    expect(comp?.fields.find((f) => f.id === 'title')?.value).toBeTruthy();
  });
});
