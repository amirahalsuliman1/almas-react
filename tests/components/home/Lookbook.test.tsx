import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Lookbook } from '../../../app/components/home/Lookbook';
import manifest from '../../../twilight.json';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
const seen = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }));
vi.mock('../../../app/components/common/HotspotImage', () => ({
  HotspotImage: (props: Record<string, unknown>) => {
    seen.props = props;
    return <div className="hotspot" />;
  },
  toHotspotPoints: (items: { x: number; y: number }[] = []) => items.map((i) => ({ ...i, productId: '1' })),
}));
vi.mock('../../../app/components/common/SectionHeader', () => ({
  SectionHeader: ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

describe('Lookbook', () => {
  it('renders nothing without an image, or when hidden from Home', () => {
    expect(renderToString(<Lookbook data={{}} />)).toBe('');
    expect(renderToString(<Lookbook data={{ image: '/a.jpg', hide_on_home: true }} />)).toBe('');
  });

  it('titles the section and explains the points', () => {
    const { container } = render(
      <Lookbook data={{ image: '/a.jpg', title: 'تسوّقي الإطلالة', hint: 'اضغطي على النقاط' }} />
    );
    expect(container.querySelector('h2')?.textContent).toBe('تسوّقي الإطلالة');
    expect(container.querySelector('p')?.textContent).toBe('اضغطي على النقاط');
  });

  it('passes the image, layout and points to the one shared hotspot component', () => {
    render(
      <Lookbook data={{ image: '/a.jpg', layout: [{ value: 'list' }], hotspots: [{ x: 10, y: 20 }] }} />
    );
    expect(seen.props?.image).toBe('/a.jpg');
    expect(seen.props?.layout).toBe('list');
    expect(seen.props?.points).toEqual([{ x: 10, y: 20, productId: '1' }]);
  });

  it('puts the image on the side the merchant picks', () => {
    const { container } = render(<Lookbook data={{ image: '/a.jpg', desktop_side: 'left' }} />);
    expect(container.querySelector('.lookbook')?.className).toContain('lookbook--image-left');
  });

  it('declares a title and a hint with Arabic defaults', () => {
    const comp = (manifest.components as { path: string; fields: { id: string; value?: unknown }[] }[]).find(
      (c) => c.path === 'home.lookbook'
    );
    expect(comp?.fields.find((f) => f.id === 'title')?.value).toBeTruthy();
    expect(comp?.fields.find((f) => f.id === 'hint')?.value).toBeTruthy();
  });
});
